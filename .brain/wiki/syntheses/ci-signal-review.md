---
title: "Review — CI signal (0.34.0)"
type: synthesis
status: active
tags: [review, ci, doctor, bundle-drift]
created: 2026-11-09
updated: 2026-11-09
sources: ["[[ci-signal]]"]
related: ["[[doctor-health-checks]]", "[[router-and-drift-review]]"]
---

# Review — CI signal (0.34.0)

Independent review of [[ci-signal]] (builder Opus, reviewer Fable) against commit `e05c9e4`;
every finding fixed in the same release with tests written red first (selftest 605 → 612).

## Findings (all fixed)
1. **P1 — one unknown workflow hid every red** (`doctor.js` #21). `gh run list --workflow x.yml` is a 404 for a workflow GitHub's default branch doesn't have; the loop broke to `info`. Fixed: a 404 skips that workflow; any other gh error keeps reds already collected.
2. **P1 — no `origin/HEAD` meant every branch.** A `git init` + `push -u` repo has no `refs/remotes/origin/HEAD`, so no `--branch` was passed and feature-branch runs counted (this repo's two red `drift-test` runs would have warned). Fixed: fall back to `gh repo view`; neither → `info`, never a guess.
3. **P2 — cancelled/skipped read as green.** Fixed: the newest *decisive* run (success or fail) of the last 10 counts.
4. **P2 — any branch closed (or opened) the issue; a fetch failure was titled as drift.** Fixed: both steps gate on the default branch; a failed fetch gets its own title.
5. **P2 — no concurrency group** (overlapping runs could open two issues). Fixed.
6. **P2 — the gh stub ignored `--branch` / `--status completed`.** Fixed: the stub refuses calls without them.
7. **P2 — loose assertions and stale "20-check" text** in the brain's own pages. Fixed.
- Not changed: run time grows with workflows × gh latency; doctor is the only caller and this repo has two.

## AC verdicts
| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1–3 | ✅ | selftest static checks; workflow reviewed |
| AC-4 | ✅ | live: two failing dispatches → issue #2 + one comment; dispatch on `main` after push closes it |
| AC-5–8 | ✅ | selftest stub cases incl. review P1s; real doctor: "latest runs green on main" |
| AC-9 | ✅ | six docs + the brain's own pages say 21 |
| AC-10 | ✅ | selftest 612 ALL GREEN; both manifests `--strict`; 0.34.0; pushed CI checked at wrap |
