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
related: [develop-lifecycle-dogfood, develop-lifecycle-fixes]
---

# Develop lifecycle

Dogfooding the plugin's own research → plan → build → review → wrap chain on this repo and fixing what it trips over.

## Now
- Spec [[develop-lifecycle-fixes]] built: 12/12 ACs ticked, selftest 372 green, v0.28.0 — awaiting `/brain:review`.

## Next
1. `/brain:review develop-lifecycle-fixes` — AC-by-AC verification, code review of guards.js / lib.js / wrap.js changes.
2. `/brain:wrap`, push v0.28.0, reinstall the plugin locally.
3. Dogfood debts still open: PR-review mode on a real PR, MCP registry on a real `.mcp.json`.

## Blockers / risks
- Changing gate behaviour affects every brain; the unscoped fallback (AC-3) is what keeps existing brains unchanged.

## Links
Specs: [[develop-lifecycle-fixes]] · Decisions: [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]] · Research: [[develop-lifecycle-dogfood]]
