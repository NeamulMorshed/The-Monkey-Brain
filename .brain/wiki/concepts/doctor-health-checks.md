---
title: "Doctor: the 20 health checks"
type: concept
status: active
tags: [hooks, doctor, health, enforcement]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]", "[[brain-correctness]]", "[[brain-correctness-review]]"]
related: ["[[wiki-self-healing]]", "[[bounded-loops]]", "[[model-routing]]", "[[session-injection]]", "[[develop-lifecycle-stages]]"]
aliases: [doctor.js, brain doctor, /brain:doctor]
---

# Doctor: the 20 health checks

What it is: `/brain:doctor` is the brain's periodic health monitor (ROADMAP Phase 8, v0.12.0) —
a deterministic, zero-model-token scan that the model then reasons over (what to fix first, what
to file). Unlike [[wiki-self-healing]], which fires reactively per write, doctor is an on-demand
snapshot whose result persists and surfaces automatically at the *next* session start.

## How it works
`plugin/skills/doctor/scripts/doctor.js` runs 20 checks, each producing a
level (`ok`/`info`/`warn`/`crit`) and a one-line detail:

1. **broken-links** — resolves every `[[link]]` against `lib.linkIndex(brain)`, the shared
   inventory also used by [[wiki-self-healing]] and lint; also reports **slug collisions**
   (a slug naming more than one file, so a `[[link]]` to it is ambiguous) — see Gotchas.
2. **orphans** — pages with no inbound link, `index`/`log`/`dashboard` exempt.
3. **stale-contradictions** — `status: stale` pages + inline `⚠️ Contradiction` flags.
4. **index-freshness** — `index.md`'s `source_count`/`page_count` vs. actual counts.
5. **clippings-backlog** — unprocessed files in `Clippings/`.
6. **log-gaps** — session activity newer than the last `wiki/log.md` entry.
7. **uncommitted** — `.brain/` git-dirty via `lib.brainGitDirty(brain)`, which excludes
   hook-owned paths (`sessions/**`, `resume.md`) so wrap's own writes don't self-trigger it
   (fixed in `brain-correctness`, shared with `wrap[git]`).
8. **hook-registration** — all 11 expected hooks present in `hooks.json`.
9. **injection-budget** — average recent `SessionStart` injection size vs. `MONKEY_BRAIN_BUDGET`
   (default 3000), from `sessions/injection-stats.json`.
10. **semantic-index** — qmd on/off, or "built-in recall covers N pages".
11. **wip-limits** — >3 active `projects/` or any idle 21+ days.
12. **instinct-queue** — `instincts/pending/` overflow past 5.
13. **specs-without-tests** — feature+/`tdd`-on specs with an empty `## Test plan`.
14. **open-p0** — open P0 findings across `projects/` and `wiki/syntheses/`, via
    `lib.openP0Lines()`, **section-aware**: a heading marked fixed/resolved/closed/accepted/
    done closes the P0s beneath it, and "0 P0"/"no P0" never count as an open one.
    This is what **gates `/brain:wrap`** when critical.
15. **schema-version** — instance `engine_version` vs. the bundled template's.
16. **cache-safety** — `ANTHROPIC_BASE_URL` isn't a prompt-rewriting proxy that would break
    prompt caching.
17. **cache-hit** — real cache-hit ratio from Claude Code transcripts, last 7 days,
    via `usage.js`.
18. **dispatch-outcomes** — last 20 subagent dispatches' done/empty ratio from
    `sessions/agents.md`, **ignoring legacy phantom lines** (`· agent · on unknown · 0 tokens ·
    0 turn(s)`, Claude Code's internal forks logged before v0.30.0 stopped being recorded as
    dispatches) so real empties still warn.
19. **ci-presence** — detects the project's stack (`ci.js`) and checks for
    `.github/workflows/*.y(a)ml`; recognises an existing workflow even with no stack match.
20. **dependency-health** (v0.33.0) — an enabled `security-guidance` needs a Python ≥ 3.10 (`python3`, `python` or `py -3`; `MONKEY_BRAIN_PYTHON` names another), an enabled `github` plugin needs `GITHUB_PERSONAL_ACCESS_TOKEN` in the environment or a settings `env` entry; each missing one is a warning naming the fix ([[router-and-drift]]).

Plus a **model-mix** line parsed from `sessions/agents.md` model tags.

**Persistence and surfacing:** doctor writes `sessions/health.json` (best-effort).
`plugin/hooks/scripts/brain-status.js` (`SessionStart`) reads it and, whenever the last run had
open warnings/criticals, injects a compact `🩺 Health` line — counts, top findings, a staleness
note, and "Criticals gate wrap" when relevant — so a bad health run
costs nothing extra next session; the fix just shows up. **Criticals gate `/brain:wrap`**
(check 14 open-P0, primarily) per manual §4/§8.

## Knobs
- `node doctor.js --brain <path> --strict --json` — `--strict` exits 1 on any warn/crit (CI);
  `--json` emits the machine report instead of the table.
- `MONKEY_BRAIN_BUDGET` — injection-budget threshold (default 3000 tokens).
- `WIP_MAX = 3`, `IDLE_DAYS = 21`, `INSTINCT_QUEUE_MAX = 5` — hard-coded thresholds in the script.
- `MONKEY_BRAIN_MODEL_BLOCK=0` — turns off the *per-dispatch* model-block gate that check 18's
  ledger reflects (see [[model-routing]]), not doctor itself.

## Cost
Zero model tokens for the scan (`effort: high` is the skill's *reasoning* pass over the report,
not the scan). One `sessions/health.json` write per run; `brain-status`'s health line adds a
handful of tokens only when there's something to report.

## Gotchas & history
- **False criticals from unclosed P0s**: before `brain-correctness` (v0.30.0), doctor's P0 scan
  wasn't section-aware, so a review's *fixed* findings kept raising a critical every session.
  `lib.openP0Lines()` fixed this and is now shared by doctor #14, [[bounded-loops]] (`loop.js`
  design-loop stop condition) and `digest.js`. The review of that same spec tightened it further
  (2026-09-15): a heading only closes its P0s with an explicit status marker ("(all fixed)",
  "— resolved", a bare "Done") and *never* when it negates ("not fixed yet", "to be resolved",
  "definition of done"); an unclosed code fence no longer hides the rest of a page; "no P0"
  beside a real finding no longer drops it.
- **Phantom dispatch lines**: `agent-track.js` used to log Claude Code's own internal forks as
  subagent dispatches, polluting check 18's outcome ledger with meaningless "0 tokens · 0
  turn(s)" lines. Fixed by not logging forks as dispatches (v0.30.0); doctor #18 additionally
  ignores any pre-existing legacy phantom line so historical ledgers don't need cleanup.
- **CI-by-workflow (#19)**: originally only fired off detected stacks (package.json, etc.); a
  project with a workflow file but no stack match still deserved `ok`, not a false warning —
  fixed in `brain-correctness` to recognize an existing workflow regardless.
- **`lib.brainGitDirty()` (#7)**: originally counted changes anywhere in the repo while claiming
  to be about `.brain/`, and didn't exclude hook-owned files (`sessions/**`, `resume.md`), so a
  clean session with only auto-logged snapshot files still warned. Fixed with brain-relative
  pathspecs and the same hook-owned filter `wrap[git]` uses.
- Doctor's check count grew from 15 (Phase 8, v0.12.0) to 20 as P11 (cache/usage), P14
  (CI presence) and P16-era work added checks; the docstring and `SKILL.md` are the source of
  truth for the current count if it drifts further.
- **Check 1 used to be `wiki/`-only**: through 0.31.0 it (and wiki-check, and lint) only
  indexed `wiki/**`, so a `[[link]]` to a `specs/`, `decisions/` or `projects/` record read as
  broken. `lib.linkIndex(brain)` ([[links-resolve-across-records]], spec `[[engine-knowledge]]`)
  is now the one inventory all three share, covering those record kinds too; a same-release
  review fix added case-insensitive resolution (as Obsidian does), a `specs/x`-style link
  resolving only to a spec named `x`, and check 1 flagging slug collisions — a slug that names
  more than one file, which makes a `[[link]]` to it ambiguous.

## Related
- [[wiki-self-healing]] — checks 1–2 reuse the exact link/orphan logic doctor shares with it.
- [[bounded-loops]] — `lib.openP0Lines()` also drives the design-loop stop condition.
- [[model-routing]] — the model-mix line and dispatch-outcome ledger (check 18) read
  `sessions/agents.md`, written by `agent-track.js`.
- [[session-injection]] — `brain-status.js` is the hook that surfaces `health.json` next session.
- [[brain-correctness]] — the spec that fixed the resume/gates/health-signal/Stop-nudge issues
  this page documents; [[brain-correctness-review]] tightened `openP0Lines` further.
- [[links-resolve-across-records]] — the ADR behind check 1's current link-index behaviour.
