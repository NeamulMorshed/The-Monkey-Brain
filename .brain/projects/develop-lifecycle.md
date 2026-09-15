---
title: "Develop lifecycle — status"
type: project
status: active
tier: feature
phase: plan
pack:
audit_score:
created: 2026-09-15
updated: 2026-09-15
related: [develop-lifecycle-dogfood, develop-lifecycle-fixes, research-first-entry, research-first-routing]
---

# Develop lifecycle

Dogfooding the plugin's own research → plan → build → review → wrap chain on this repo and fixing what it trips over.

## Now
- Spec [[research-first-routing]] drafted (feature tier, 10 ACs): generic dev intent enters at `/brain:research` by default, explicit curator skip enters at plan, router detects research the brain already holds. Awaiting the curator's walk-through, then `/brain:build research-first-routing`.
- Previous spec [[develop-lifecycle-fixes]] closed `done` in v0.28.0 ([[develop-lifecycle-fixes-review]]).

## Next
1. Curator reviews the ACs → `/brain:build research-first-routing` → `/brain:review` → `/brain:wrap` (v0.29.0).
2. Dogfood debts still open: PR-review mode on a real PR, MCP registry on a real `.mcp.json`.
3. Doctor check 1 counts `[[links]]` from wiki pages to `decisions/` and `specs/` as broken (it only knows `wiki/` slugs) — a doctor/lint scope gap to spec separately.

## Blockers / risks
- Changing gate behaviour affects every brain; the unscoped fallback (AC-3) is what keeps existing brains unchanged.

## Links
Specs: [[research-first-routing]] · [[develop-lifecycle-fixes]] · Decisions: [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]] · Research: [[research-first-entry]] · [[develop-lifecycle-dogfood]]
