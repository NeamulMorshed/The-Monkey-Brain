---
title: "Plan and TDD Gates"
type: concept
status: active
tags: [hooks, guards, gates, tdd, plan-gate, enforcement, tiers]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes-review]]", "[[brain-correctness-review]]"]
related: ["[[spec-scope-globs-gate-ownership]]", "[[team-lock]]", "[[instincts-and-bans]]", "[[session-injection]]", "[[trigger-router]]", "[[doctor-health-checks]]", "[[wiki-self-healing]]", "[[bounded-loops]]", "[[develop-lifecycle-stages]]", "[[claude-code]]"]
aliases: ["guards.js", "plan gate", "TDD gate", "tier gates"]
---

# Plan and TDD Gates

`plugin/hooks/scripts/guards.js` is the brain's **enforcement layer**: a `PreToolUse` hook on
`Write|Edit|MultiEdit` that can refuse a tool call outright (exit 2) before it ever touches disk.
"Enforcement over advice" — of its eight checks, the plan gate and TDD gate are the two that read
project *tiers* from `specs/` and block source code, not just brain files.

## How it works

`main()` (`guards.js:176`) runs checks in this order for every write:

1. **Secrets** (`guards.js:184-193`) — any new text matching an API-key/token/private-key pattern, anywhere.
2. **Career privacy** (`guards.js:195-214`) — uncleared case studies stay in `private/`.
3. *(brain-relative writes only, `guards.js:216-255`)* **raw-sources immutability**, then **log append-only** — the latter's `updated:` exemption requires a bare `updated: <date>` line on *both* sides of the edit (`editIsAppendOnly`, `guards.js:64-68`).
4. **Team lock** (`guards.js:257-268`) — see [[team-lock]].
5. *(project writes only, `guards.js:270-320`)* **Plan gate**, then **TDD gate**.
6. **Learned bans**, block-level only (`guards.js:322-334`) — see [[instincts-and-bans]].

**Scoping.** A source write is only tier-gated when the path is inside the project (`lib.inProject`,
`lib.js:170-173` — rejects `..`, `../…`, absolute and drive-letter paths) and a `specs/` dir exists.
Open specs are read, then filtered by `scope:` globs (`scopeMatches`, `guards.js:121-133`, compiled
by the single left-to-right tokenizer `globToRegExp`, `guards.js:136-150`): `**` spans directories,
`*`/`?` stay within one segment, a bare path claims itself and everything beneath it. When at least
one open spec's scope claims the path, **only** the claiming spec(s) are consulted; when none does,
every open spec is (the pre-scope fallback, so unscoped brains see no change). Paths outside the
project root are never gated.

**Plan gate** (`guards.js:290-304`): any claiming spec with `tier: architecture` and
`plan_approved` not `true` blocks the write (docs and test paths exempt, `isTestPath`,
`guards.js:70-79`). The second block on the same spec calls `recordPlanBlock`
(`guards.js:94-114`), which writes `.brain/sessions/gate-blocks.json` and, on the 2nd hit, appends
`.brain/sessions/review-required.md` — union-merged in git, surfaced at next session start by
`brain-status`.

**TDD gate** (`guards.js:306-318`): a brand-new file (`Write`, not existing) with a recognized code
extension (`CODE_EXT`, `guards.js:153`) under a claiming `feature`/`architecture`-tier spec with
`tdd !== false` is blocked unless a test companion already exists (`hasTestCompanion`,
`guards.js:156-174`: same-dir `<name>.test/.spec`, a sibling `__tests__/`, or a root-level
`test|tests|spec|specs` dir).

Gates degrade gracefully: no `.brain/`, no `specs/`, or no open spec → no gate. `quick` tier is
advisory only.

## Knobs

- Spec frontmatter: `tier: quick|feature|architecture`, `plan_approved: true|false`, `tdd: false`
  (opt out of the TDD gate), `scope: [globs]` (claims which files this spec's gates own — filled by
  `/brain:plan` from `graph.js radius`).
- `isDoc` regex (`\.(md|mdx|txt|rst)$`) exempts docs from the plan gate.
- `CODE_EXT` (`guards.js:153`) decides which new files trip the TDD gate.

## Cost

Runs synchronously on every `Write|Edit|MultiEdit`; cost is bounded by the number of open specs
(frontmatter parse each) plus, for the TDD gate, one or two directory listings. **Fails open**
(`exit 1`, non-blocking, message to stderr — `guards.js:337-342`) on any internal error: a bug in
the guard never blocks the session, but it also silently stops enforcing for that call.

## Gotchas & history

- **v0.20.0 (P15):** `lib.parseFrontmatter` didn't strip YAML inline comments, so a spec that kept
  the template's `tier: architecture   # quick | feature | architecture` comment parsed the whole
  line as the tier string — the plan and TDD gates never fired for it. Fixed with regression tests
  (`engine-changelog` 0.20.0).
- **v0.28.0, `scope:` globs** ([[spec-scope-globs-gate-ownership]]): added after dogfooding found an
  unapproved architecture spec blocking writes owned by a different, approved spec
  ([[develop-lifecycle-dogfood]] finding 7). [[develop-lifecycle-fixes-review]] then caught **two
  P0s in the glob matcher itself** before it shipped: multi-pass rewrites clobbering each other
  (`src/**/*.js` matched nothing), and an unbalanced `[` throwing out of `new RegExp` — which
  **fail-opened every gate** for that write. Both fixed by the single-pass `globToRegExp`
  tokenizer, pinned by selftest. That build also found the TDD gate blocking a scratch-directory
  write outside the project root, which became the "never tier-gate outside the project" rule.
- **v0.30.0, `lib.inProject`** ([[brain-correctness-review]] AC-4/AC-5): a project stored under a
  parent folder literally named `specs`/`tests` had its gates silently switched off, because
  `isTestPath` was judged on the wrong string. `lib.inProject` is now the one containment test
  shared by the tier gates *and* the learned-bans guard.
- The plan-gate escalation to `sessions/review-required.md` is the brain's own definition of "stop
  retrying" — a spec blocked twice is a curator decision, not a retry loop.

## Related

- [[team-lock]] — guard #7, same hook, checked on every brain-relative write.
- [[instincts-and-bans]] — guard #6, block-level learned bans in the same hook; `warn`-level bans
  are reported separately, post-write.
- [[spec-scope-globs-gate-ownership]] — the ADR behind `scope:`.
- [[develop-lifecycle-stages]], [[bounded-loops]] — the lifecycle these gates arm.
- [[doctor-health-checks]], [[session-injection]] — how a stuck gate surfaces to the curator.
- [[claude-code]] — the host whose `PreToolUse` hook this is.
