---
title: "Brain hardening — status"
type: project
status: active
tier: architecture
phase: review
pack:
audit_score:
created: 2026-09-15
updated: 2026-09-15
related: [brain-health-audit, brain-correctness, token-diet, engine-knowledge]
---

# Brain hardening

Acting on [[brain-health-audit]]: three specs in order, each through plan → build → review → wrap.

## Now
- [[brain-correctness]] — closed `done` in 0.30.0 after an independent review ([[brain-correctness-review]]): 15/15 ACs, 2 P1 + 4 P2 review findings fixed in review.
- [[token-diet]] — built (0.31.0, selftest 484 green, always-loaded bytes 26,491 → 16,550); in review.

## Next
1. [[token-diet]] — model-routing table, fork instead of pin, context nudge, manual split, description cap, dependency slimming.
2. [[engine-knowledge]] — compile the engine into its brain, link resolution across records, superpowers filing, router fixes, docs drift.

## Blockers / risks
- Every change touches hooks that run in every brain; the selftest suite is the safety net and runs on 3 OS × 2 Node in CI.
- Curator-side fixes (not code): install Python 3 or disable `security-guidance`; set `GITHUB_PERSONAL_ACCESS_TOKEN` or disable the github MCP.

## Links
Research: [[brain-health-audit]] · Specs: [[brain-correctness]] · [[token-diet]] · [[engine-knowledge]]
