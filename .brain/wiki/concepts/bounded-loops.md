---
title: "Bounded loops: spec / research / design, stopped by the brain's own state"
type: concept
status: active
tags: [hooks, loops, enforcement, model-routing]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]"]
related: ["[[doctor-health-checks]]", "[[model-routing]]", "[[develop-lifecycle-stages]]", "[[session-injection]]"]
aliases: [loop.js, /brain:loop, loops that stop]
---

# Bounded loops: spec / research / design, stopped by the brain's own state

What it is: `/brain:loop` (ROADMAP v3 P12, v0.17.0 — "loops that stop") repeats build, research
or design work until a stop condition read **from the brain itself** is met, not until tokens
run out. It exists to make "keep going until green" bounded and verifiable rather than an
open-ended agentic loop.

## How it works
- **`plugin/hooks/scripts/loop.js`** implements three loop types (`loop.js:30-34`), each with a
  stop condition measured from a brain file (`loop.js:52-56`, `:70-85`):

  | Type | Iteration | Anchor file | Done when |
  | --- | --- | --- | --- |
  | `spec` | build → verify | `specs/<slug>.md` | every numbered `AC-n` line is marked `✅`/`[x]` (`acProgress`, `:63-67`) |
  | `research` | research → synthesise | `wiki/research/<slug>.md` | it has a non-empty `## Recommendation` section **and** its content stops changing between ticks (hash comparison, `:76-81`) |
  | `design` | critique → refine | `projects/<slug>.md` | `lib.openP0Lines()` reports zero open P0s (`:83-84`, same section-aware function [[doctor-health-checks]] check 14 uses) |

- **Lifecycle:** `loop.js start <type> <slug> [--generator MODEL] [--max-ticks N]
  [--max-no-progress N]` creates `sessions/loops/<type>-<slug>.json` with a baseline measurement
  (`:100-126`). Each iteration ends with `loop.js tick <id> --summary "…"`, which re-measures,
  records progress (`improved()`, research compares by hash change, others by a metric increase,
  `:87`), and appends to the spec's own `## Loop log` for spec loops (`:134-146`, `:183`).
  `loop.js status [id]` lists loops; `loop.js stop <id> --reason "…"` ends one early.
- **Stop criteria the driver enforces on every tick** (`:169-181`):
  - **met** — the AC/Recommendation/no-P0 condition above → `status: done`.
  - **livelock** — the last 3 ticks hash to the exact same summary → `status: halted`.
  - **stall** — `maxNoProgress` (default 3) consecutive ticks with no measured progress →
    `status: halted`.
  - **tick cap** — `maxTicks` (default 12) reached → `status: halted`.
- **Survives `/clear` and compaction:** state lives in `sessions/loops/<id>.json`, not in
  context; `activeLoops(brain)` (`:201`) is what [[session-injection]]'s `brain-status.js` reads
  to show running loops at the next session start, and `sessions/review-required.md` gets an
  entry when a spec's plan gate blocks the same write twice (separate mechanism, same
  "survive a session boundary" concern).
- **Verifier-family rule (`plugin/hooks/scripts/agent-track.js:105-113`):** while a loop with a
  recorded `--generator` is running, `agent-track` (the `PreToolUse` hook on `Agent` dispatches)
  compares the dispatch's `model` against `loops.family(clash.generator)` — same model *family*
  (opus/sonnet/haiku/fable, ignoring version suffixes, `loop.js:40-44`) as the generator → the
  dispatch is **blocked** with a message naming the generator and suggesting the other family
  (`agent-track.js:109-113`). Rationale (`SKILL.md:33-35`): a reviewer on the generator's own
  model family tends to miss the same mistakes the generator made — verify a Sonnet build with
  an Opus check, and vice versa.

## Knobs
- `--generator MODEL` — records who's producing the work; arms the verifier-family block.
- `--max-ticks N` (default 12), `--max-no-progress N` (default 3) — tick cap and stall window.
- No env var disables the loop mechanism itself; `MONKEY_BRAIN_MODEL_BLOCK=0` (see
  [[model-routing]]) affects the *separate* explicit-model gate, not the family-clash block.

## Cost
`loop.js` is a stdlib-only Node script — zero model tokens per tick for the bookkeeping itself;
the cost is whatever the iteration (build/research/design work) actually spends. `effort: high`
on the `/brain:loop` skill governs the judgment of *what to do* each iteration, not the driver.

## Gotchas & history
- Loop state and the spec's `## Loop log` can drift if a spec is edited by hand outside the
  loop (e.g. an AC ticked without a tick call) — `measure()` re-reads the spec fresh each tick,
  so it self-corrects on the next `tick`, but the log line for that jump won't exist.
- A halted loop (livelock/stall/cap) is a signal to change the plan, not to restart the same
  loop — `SKILL.md` step 3 says so explicitly; there's no automatic backoff-and-retry.
- The design-loop stop condition depends entirely on `lib.openP0Lines()` being accurate; the
  section-awareness fixes described in [[doctor-health-checks]] (closing headings, code-fence
  handling, "no P0" not counting) apply here too since `loop.js` imports the same `lib.js`.
- First smoke test of P12 crashed selftest on a redeclared variable, fixed before merge
  (roadmap session log, 2026-09-13); no functional bug in the loop logic itself.

## Related
- [[doctor-health-checks]] — shares `lib.openP0Lines()` with the design-loop stop condition and
  check 14; running loops are the kind of state `health.json`/`brain-status` also carry forward.
- [[model-routing]] — the family-clash block is layered on top of `agent-track.js`'s explicit-
  model-required gate; both live in the same hook.
- [[develop-lifecycle-stages]] — `/brain:loop` wraps around build/research/design, not a
  fifth stage of the lifecycle itself (manual §4: "around the stages").
- [[session-injection]] — surfaces `activeLoops()` at session start so a loop isn't silently lost.
