---
title: "Brain hardening — status"
type: project
status: active
tier: architecture
phase: done
pack:
audit_score: "all four specs done; every review finding fixed"
created: 2026-09-15
updated: 2026-09-16
related: ["[[brain-health-audit]]", "[[brain-correctness]]", "[[token-diet]]", "[[engine-knowledge]]", "[[router-and-drift]]"]
---

# Brain hardening

Acting on [[brain-health-audit]]: three specs in order, each through plan → build → review → wrap.

## Now
- [[brain-correctness]] — closed `done` in 0.30.0 after an independent review ([[brain-correctness-review]]): 15/15 ACs, 2 P1 + 4 P2 review findings fixed in review.
- [[token-diet]] — closed `done` in 0.31.0 after an independent review ([[token-diet-review]]): 10/10 ACs (AC-2 amended — only `build` forks), 3 P1 + 9 P2 fixed; always-loaded bytes 26,491 → ~16,660.
- [[engine-knowledge]] — closed `done` in 0.32.0 after an independent review ([[engine-knowledge-review]]): 9/9 ACs, code and 14 knowledge pages fixed in review.
- [[router-and-drift]] — closed `done` in 0.33.0 after an independent review ([[router-and-drift-review]]): 12/12 ACs, 2 P1 + 12 P2 fixed in review, selftest 579; `brain-all` 0.14.1 and a weekly bundle-drift CI job.

## Next
Nothing open in this workstream. Watch the weekly `bundle-drift` job; a real-session router misfire gets a selftest case before its fix ([[router-ignores-questions-and-reports]]).

## Blockers / risks
- Every change touches hooks that run in every brain; the selftest suite is the safety net and runs on 3 OS × 2 Node in CI.
- Curator-side fix (not code): set `GITHUB_PERSONAL_ACCESS_TOKEN` or disable the github plugin — doctor #20 warns until then. Python 3.14 is installed (2026-09-16), which satisfies `security-guidance`.

## Links
Research: [[brain-health-audit]] · Specs: [[brain-correctness]] · [[token-diet]] · [[engine-knowledge]] · [[router-and-drift]]
