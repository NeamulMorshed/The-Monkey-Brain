---
description: Implement a spec from .brain/specs/ as a test-first loop against its numbered acceptance criteria, keeping the spec's phase and the bookkeeping current. Use when the user says "build/implement the spec", "start building <feature>", or work begins on a planned feature. The TDD and plan gates are active — work with them, not around them.
argument-hint: "<spec-slug>"
model: sonnet
effort: medium
---

# /brain:build — work the spec, test-first

The spec is the contract: every AC gets a test, every milestone leaves a trace.

## Steps

1. **Load the contract.** Read `specs/<slug>.md`. Check gate state up front:
   `architecture` tier without `plan_approved: true` → stop and ask the curator to
   approve the plan first (the guard would block source writes anyway). Set the spec's
   `phase: build` (and the `projects/` page's phase).
2. **Slice by AC.** Take criteria in dependency order; keep each slice small enough
   that one red→green cycle covers it.
3. **Red → green → refactor per slice:**
   - **Red:** write the failing test that encodes the AC *first*. For new source files
     the TDD gate enforces this — if it blocks you, that's the reminder working, not an
     obstacle to route around (`tdd: false` in the spec is the curator's opt-out, not
     yours).
   - **Green:** the minimal implementation that passes.
   - **Refactor:** clean up with the tests green.
   Run the affected suite each cycle and report results honestly — a red suite is never
   "done".
4. **Track progress in the spec:** tick ACs as their tests pass (e.g.
   `AC-1 ✅ test_login_expiry`); log deviations and discoveries in the spec's Notes;
   choices worth keeping become `decisions/` ADRs (template `decision.md`).
5. **Bookkeeping per milestone:** append `wiki/log.md`
   `## [YYYY-MM-DD] build | <feature> — AC-n…m` and commit `build: <feature> — <slice>`
   per logical step.
6. **Hand off:** all ACs green → set `phase: review` and offer `/brain:review`.

**Done when:** every AC has a passing test (or an honestly recorded exception), the
spec reflects reality, and the trail — log entries plus commits — shows how it got there.
