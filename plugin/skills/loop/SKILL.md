---
description: Run a bounded loop that stops on the brain's own criteria — build until every AC passes, research until the recommendation is stable, design until no P0 — with tick caps and stall and livelock halts. Use for "loop until done" or "keep going until green".
argument-hint: "<spec|research|design> <slug>"
effort: high
---

# /brain:loop — iterate until the brain says stop

The stop condition comes from the brain, not from running out of tokens (v3 P12):

| Type | Iteration | Done when |
| --- | --- | --- |
| `spec` | one AC slice, red → green (as in `/brain:build`) | every AC in `specs/<slug>.md` is marked ✅ |
| `research` | read, then draft `wiki/research/<slug>.md` | it has a Recommendation and stops changing |
| `design` | critique, then refine | `projects/<slug>.md` lists no open P0 |

The loop driver is `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/loop.js"` (below: `loop.js`).

## Steps

1. **Start.** `loop.js start <type> <slug> --generator <model doing the work>` (for example
   `--generator sonnet` when a Sonnet subagent implements). Optional caps: `--max-ticks N`
   (default 12) and `--max-no-progress N` (default 3). Spec loops need the spec to exist
   (`/brain:plan` first).
2. **Iterate.** Do one small, complete iteration. For spec loops, tick the AC in the spec
   (`AC-1 ✅ test_name`) only when its test passes — the loop reads those marks.
3. **Tick after every iteration.** `loop.js tick <id> --summary "<one line: what changed>"`
   and obey the verdict:
   - `↻ continue` → next iteration.
   - `✅ done` → hand off (`/brain:review` for specs, `/brain:wrap` otherwise).
   - `⛔ halted` (livelock, stall or cap) → stop. Report the reason and the last three
     ticks to the curator; don't restart the same loop without a change of plan.
4. **Verify on another model family.** A reviewer on the generator's family misses the same
   errors, so the agent hook blocks a verify/review dispatch on that family while the loop
   runs — dispatch the check on a different one (e.g. opus for a sonnet generator).

`loop.js status` lists loops; running loops also show in the session-start status, so they
survive `/clear` and compaction. `loop.js stop <id> --reason "…"` ends one early.
