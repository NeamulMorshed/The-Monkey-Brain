---
title: "Stop Nudges"
type: concept
status: active
tags: [hooks, stop, wrap, git, definition-of-done]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]", "[[brain-correctness-review]]"]
related: ["[[session-injection]]", "[[resume-system]]", "[[wiki-self-healing]]", "[[recall-and-search]]", "[[develop-lifecycle-stages]]", "[[doctor-health-checks]]", "[[claude-code]]"]
aliases: ["wrap.js", "wrap[log]", "wrap[decisions]", "wrap[git]"]
---

# Stop Nudges

"Everything leaves a trace" enforced automatically: `wrap.js` blocks the `Stop` event **once**
per session with every unmet definition-of-done item, then on `SessionEnd` self-heals
`index.md`'s stats and (opt-in) re-indexes semantic search. See ADR
[[one-stop-message-for-wrap-nudges]] for why the three checks were consolidated into one
message instead of firing one per Stop attempt.

## What it is
`plugin/hooks/scripts/wrap.js` handles two hook events with different jobs: `Stop` is
**reminders** (nothing is written or committed automatically — the model must act); `SessionEnd`
is the **mechanic** (deterministic bookkeeping only, zero model tokens).

## How it works
- **Three Stop checks**, each a function returning `{marker, reason}` or `null`
  (`wrap.js:76-159`):
  - `stopCheck` (`wrap[log]`) — wiki pages under `wiki/` changed more than `GRACE_MS` (90s)
    after `wiki/log.md`'s last write (`newestWikiMtime`, which itself skips `log.md` and
    `index.md`). Reason: append a `## [date] <prefix> | ...` entry.
  - `decisionCheck` (`wrap[decisions]`) — the log's *last* entry prefix is `build` or `review`
    but no file under `decisions/` was touched within `DECIDE_GRACE_MS` (15 min) of that log
    write. Skipped entirely on pre-v2 brains with no `decisions/` folder.
  - `gitCheck` (`wrap[git]`) — `lib.brainGitDirty(brain)` reports uncommitted changes inside
    `.brain/`, scoped with `git status --porcelain --untracked-files=all -- . :(exclude)sessions
    :(exclude)resume.md` (`lib.js:279-292`) — hook-owned paths are excluded because these hooks
    write them themselves. Returns `null` (not zero) outside a git repo or without git, so it
    stays silent rather than nudging.
  - `stopNudges()` (`wrap.js:162-169`) runs all three, and if **any** are unmet, writes a
    once-per-session marker file (OS tmpdir, keyed by `session_id`) for **each** unmet item and
    blocks with `{decision: 'block', reason: <all reasons joined>}` — one Stop attempt surfaces
    everything a clean wrap needs, instead of one check per attempt.
  - Loop protection: `input.stop_hook_active` short-circuits every check (Claude Code's own
    re-entry guard), and each check independently checks its own marker file before doing any
    work.
- **`SessionEnd` — `refreshIndex(brain)`** (`wrap.js:171-192`): rewrites only the
  `source_count:`/`page_count:`/`updated:` frontmatter lines of `wiki/index.md` (never the
  body) from a fresh filesystem count — `raw-sources/` markdown minus `assets/`, and all `.md`
  under `wiki/`. No-ops if the index has no such frontmatter, or if the counts already match.
- **`SessionEnd` — `reindex(brain)`** (`wrap.js:200-214`): only when the brain opted into qmd
  (`.qmd` marker or `MONKEY_BRAIN_QMD=1`), spawns `qmd update` **detached** so new pages are
  searchable next session (`[[recall-and-search]]`); swallows any spawn error since qmd may not
  be installed.
- `hooks.json` wires `wrap.js` to both `Stop` and `SessionEnd` (separate hook registrations,
  same script, branching on `input.hook_event_name`).

## Knobs
- `GRACE_MS` (90 000 ms, hard-coded) — how stale wiki writes must be before `wrap[log]` fires.
- `DECIDE_GRACE_MS` (15 min, hard-coded) — the window an ADR counts as "distilled" from a
  build/review log entry.
- Per-session marker files in `os.tmpdir()`, prefixed `mb-wrap-`, `mb-decide-`, `mb-gitcheck-` —
  deleting them (or starting a new `session_id`) resets the once-per-session suppression.
- `.qmd` marker / `MONKEY_BRAIN_QMD=1` — gates the `SessionEnd` re-index spawn.
- Presence of `decisions/` folder — gates whether `decisionCheck` runs at all (opt-out for
  pre-v2 brains).

## Cost
Zero model tokens for the `SessionEnd` mechanic (pure file writes + a detached spawn). The
`Stop` reminders cost nothing when everything is clean; when unmet, one block message (all
unmet reasons concatenated) is shown **once per session per item** — never repeats for an
already-shown item, even if the condition persists.

## Gotchas & history
- v0.4.0 (Roadmap Phase 2 #6) shipped the original single-check `Stop` gate (unlogged wiki
  work) plus the `SessionEnd` index self-heal.
- v0.27.0 added `gitCheck` as a third nudge, mirroring `doctor.js` check #7 but automatic
  instead of only on-demand.
- **v0.28.0 fix — one Stop message:** before this, each check called `lib.succeed` and exited
  on its *first* hit, so a session needing all three reminders took three separate Stop
  attempts to learn everything. `develop-lifecycle-dogfood` finding 8 flagged the serialization.
  Consolidated to "run all three, block once with everything unmet" — see ADR
  [[one-stop-message-for-wrap-nudges]]. No flag added: the old behaviour was replaced outright
  since the reminder texts and `wrap[log]`/`wrap[decisions]`/`wrap[git]` labels stayed
  unchanged.
- **v0.30.0 fix (`brain-health-audit`):** Stop nudges were firing on the hooks' *own* writes —
  `wrap[git]` counted `sessions/` and `resume.md` changes it had just made itself, and
  `wrap[log]` counted `index.md`, which `SessionEnd` rewrites right after the log entry. Fixed
  by excluding both from their respective checks.
- **Independent review fix (`brain-correctness-review`, same release):** `lib.brainGitDirty()`
  now uses brain-relative pathspecs for its exclusions, so a wiki page *named* `resume.md`, or
  one living under a folder literally called `sessions/`, still counts as dirty — only the
  hooks' own files at the brain root are excluded.
- Advisory only, always: `wrap.js` never runs `git commit`/`git push`/writes a decision/appends
  the log itself — "brain records, curator acts," the same boundary as `pr.js` and the MCP
  registry (§9 of the manual).

## Related
- [[session-injection]] — the `SessionStart` counterpart; together the two hooks bookend a
  session (start: what's known: end: what's missing).
- [[resume-system]] — `resume-log.js` also runs on `SessionEnd`, appending a task-log line
  independently of `wrap.js`'s index refresh.
- [[wiki-self-healing]] — `refreshIndex`'s frontmatter self-heal is one instance of the wider
  self-healing pattern.
- [[recall-and-search]] — the opt-in qmd re-index this hook triggers on `SessionEnd`.
- [[develop-lifecycle-stages]] — `/brain:wrap` is the lifecycle's closing step; these nudges are
  what remind a session to run it.
- [[doctor-health-checks]] — `gitCheck` mirrors doctor check #7; both share `lib.brainGitDirty`.
- [[claude-code]] — the host whose `Stop`/`SessionEnd` hook events this script handles.
