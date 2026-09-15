---
title: "Develop lifecycle — status"
type: project
status: active
tier: feature
phase: review
pack:
audit_score:
created: 2026-09-15
updated: 2026-09-15
related: [develop-lifecycle-dogfood, develop-lifecycle-fixes, research-first-entry, research-first-routing]
---

# Develop lifecycle

Dogfooding the plugin's own research → plan → build → review → wrap chain on this repo and fixing what it trips over.

## Now
- Spec [[research-first-routing]] built: 10/10 ACs ✅, selftest 408 green, v0.29.0 staged. ADR [[research-first-entry-is-advisory]] filed. Awaiting `/brain:review research-first-routing`.
- Previous spec [[develop-lifecycle-fixes]] closed `done` in v0.28.0 ([[develop-lifecycle-fixes-review]]).

## Next
1. `/brain:review research-first-routing` → `/brain:wrap` (push v0.29.0, reinstall locally).
2. Dogfood debts still open: PR-review mode on a real PR, MCP registry on a real `.mcp.json`.
3. Doctor check 1 counts `[[links]]` from wiki pages to `decisions/` and `specs/` as broken (it only knows `wiki/` slugs) — a doctor/lint scope gap to spec separately.

## Blockers / risks
- Changing gate behaviour affects every brain; the unscoped fallback (AC-3) is what keeps existing brains unchanged.

## Links
Specs: [[research-first-routing]] · [[develop-lifecycle-fixes]] · Decisions: [[research-first-entry-is-advisory]] · [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]] · Research: [[research-first-entry]] · [[develop-lifecycle-dogfood]]
