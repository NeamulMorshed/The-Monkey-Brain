---
title: "Instincts and Learned Bans"
type: concept
status: active
tags: [instincts, bans, learned-rules, hooks, enforcement, memory]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[develop-lifecycle-fixes-review]]"]
related: ["[[plan-and-tdd-gates]]", "[[team-lock]]", "[[doctor-health-checks]]", "[[trigger-router]]", "[[wiki-self-healing]]", "[[session-injection]]", "[[claude-code]]"]
aliases: ["instincts.js", "instinct-track.js", "bans.js", "learned bans"]
---

# Instincts and Learned Bans

Instincts are the brain's learned-correction mechanism: a fix repeated 3+ times earns a rule in
`instincts/pending/`, the curator promotes proven ones to `instincts/active/` (injected every
session), and a rule that carries a `ban:` regex becomes enforcement the hooks check on every
write — "scripts notice; the model writes the rule."

## How it works

**Detection — `instinct-track.js`** (`PostToolUse` on `Write|Edit|MultiEdit`, always advisory,
never blocks) has two jobs:
1. Reports `warn`-level learned-ban matches in the text a write just added (`instinct-track.js:92-104`).
2. The Gap-#9 feedback loop: counts, per file, how many **distinct sessions** have revised it
   (`countSession`, `instinct-track.js:47-71`, state in `sessions/edit-counts.json`); at the
   threshold (default 3, `MONKEY_BRAIN_INSTINCT_THRESHOLD`, min 2) it suggests filing a rule in
   `instincts/pending/`, once per file. Hook-written/always-churning files are exempt
   (`isExempt`, `instinct-track.js:34-45`: `resume.md`, `wiki/log.md`, `wiki/index.md`,
   `wiki/dashboard.md`, `sessions/**`, `Clippings/**`, `.git/**`).

**Authoring — `templates/instinct.md`**: `status: pending|active`, `trigger` (when it applies),
`confidence` (blank derives from the evidence count), `ban:` (single-quoted regex),
`ban_paths:` (regex on the project-relative path), `enforce: warn|block`, `evidence: []` (the
3+ corrections that earned it).

**Ranking and promotion — `instincts.js`**: `status` ranks `pending/` by confidence — explicit
`fm.confidence`, else derived from the evidence count (`BY_EVIDENCE`, `instincts.js:24`: 0→0.25,
1→0.4, 2→0.6, 3→0.75, 4→0.85, 5+→0.9) — flagging ≥0.8 `"promote?"` and >30 days old
`"stale — prune?"` (`instincts.js:61-66`). `promote <name>` moves `pending/` → `active/`
(`move()`, `instincts.js:74-87`) — **the curator's call**; `/brain:review` asks before running it.
`prune <name>` moves to `pruned/` (kept for the record, not deleted). `test <file>` shows which
active bans would fire on a given file (`instincts.js:89-95`).

**Enforcement — `bans.js`**: `loadBans(brain)` combines two sources, both plain data:
`fromInstincts` (active instincts whose frontmatter carries `ban:`, `bans.js:32-51`) and
`fromPacks` (any capability pack's `bans.json` — e.g. `plugin/skills/product-design/bans.json` —
active only while a `projects/` workstream declares `pack: <name>` and `status: active`,
`bans.js:53-78`). `findMatches(text, relPath, bans)` returns the first matching line per ban,
filtered by an optional `paths` regex. Enforcement then splits across two hooks:
- **`guards.js` refuses `enforce: block` matches before the write** (guard #6, `guards.js:322-334`
  — see [[plan-and-tdd-gates]]).
- **`instinct-track.js` reports `enforce: warn` matches after the write**
  (`instinct-track.js:96-104`), as `additionalContext` — advisory, fixable in the same turn.

Invalid regex patterns are skipped, never fatal (`bans.js` sets `invalid: !re`; `instincts.js
status` lists them as "invalid ban patterns (the hooks ignore them)").

**Session visibility.** `brain-status.js` lists active instincts by name and the count of learned
bans checked on every write (`brain-status.js:175-187`). `doctor` check 12 (`instinct-queue`,
`doctor.js:168-170`) warns when `instincts/pending/` grows past `INSTINCT_QUEUE_MAX`, prompting
the curator to promote or drop the backlog.

**Example pack** — `plugin/skills/product-design/bans.json`: five UI anti-pattern bans
(`gradient-text`, `glassmorphism`, `oversized-radius`, `side-stripe`, `tracked-uppercase`), all
`warn`-level by default, scoped by a `paths` regex to style/markup file extensions.

## Knobs

- `MONKEY_BRAIN_INSTINCT_THRESHOLD` (default 3, floor 2) — sessions of churn before an advisory fires.
- `confidence:` explicit override vs. evidence-derived.
- `enforce: warn|block` per instinct.
- `ban_paths:` to scope a ban to specific file types.
- A workstream's `pack:` field in `projects/` activates a pack's `bans.json`.
- `INSTINCT_QUEUE_MAX` (doctor) — pending-queue overflow threshold.

## Cost

`instinct-track.js` never blocks — any internal error is a silent no-op, `exit 0`
(`instinct-track.js:116`). `loadBans()` re-reads `instincts/active/*.md` and every declared pack's
`bans.json` fresh on each guarded write — no caching, bounded by the count of active instincts
plus declared packs; cheap at brain scale.

## Gotchas & history

- **`bans.js:24-30` `compile()`:** an *unquoted* `ban: [0-9]` parses in YAML as a one-item list
  (`["[0-9]"]`), not a regex character class — `compile()` rejoins an array back into `[…]` to
  recover intent, but the instinct template asks for **single quotes** specifically to dodge this.
- The same class of `lib.parseFrontmatter` list-parsing fragility (quoted commas inside a list,
  a comment after an inline list truncating it) was hardened in [[develop-lifecycle-fixes-review]]
  when `scope:` globs were added — `ban:`'s array/scalar ambiguity relies on the same parser.
- Promotion is **deliberately never automatic** — `instincts.js` only ranks and flags; only the
  curator (via `/brain:review` or `instincts.js promote <name>` directly) moves `pending/` →
  `active/`, so a script can never silently change what's enforced.
- Shipped as v0.20.0 (v3 P15); the same release fixed a real gate bug found while building it —
  YAML inline comments hiding a spec's `tier:` from the plan/TDD gates (see [[plan-and-tdd-gates]]).

## Related

- [[plan-and-tdd-gates]] — guards.js enforces `block`-level bans in the same `PreToolUse` hook.
- [[team-lock]] — the other guard that shares the brain-relative write path in `guards.js`.
- [[doctor-health-checks]] — check 12 surfaces a growing pending queue.
- [[session-injection]] — `brain-status` lists active instincts and ban counts every session.
- [[claude-code]] — the host whose `PostToolUse` hook `instinct-track.js` is.
