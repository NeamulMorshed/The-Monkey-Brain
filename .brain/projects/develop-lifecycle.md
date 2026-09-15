---
title: "Develop lifecycle — status"
type: project
status: done
tier: feature
phase: done
pack:
audit_score: "done — 0 open findings"
created: 2026-09-15
updated: 2026-09-15
related: [develop-lifecycle-dogfood, develop-lifecycle-fixes]
---

# Develop lifecycle

Dogfooding the plugin's own research → plan → build → review → wrap chain on this repo and fixing what it trips over.

## Now
- Spec [[develop-lifecycle-fixes]] reviewed and closed `done` ([[develop-lifecycle-fixes-review]]): 12/12 ACs, 9 review findings fixed, selftest 390 green, v0.28.0 ready to push.

## Next
1. `/brain:wrap` — resume narrative, push v0.28.0, reinstall the plugin locally.
2. Dogfood debts still open: PR-review mode on a real PR, MCP registry on a real `.mcp.json`.
3. Doctor check 1 counts `[[links]]` from wiki pages to `decisions/` and `specs/` as broken (it only knows `wiki/` slugs) — a doctor/lint scope gap to spec separately.

## Blockers / risks
- Changing gate behaviour affects every brain; the unscoped fallback (AC-3) is what keeps existing brains unchanged.

## Links
Specs: [[develop-lifecycle-fixes]] · Decisions: [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]] · Research: [[develop-lifecycle-dogfood]]
