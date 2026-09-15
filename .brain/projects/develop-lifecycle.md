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
related: ["[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes]]", "[[research-first-entry]]", "[[research-first-routing]]"]
---

# Develop lifecycle

Dogfooding the plugin's own research → plan → build → review → wrap chain on this repo and fixing what it trips over.

## Now
- Spec [[research-first-routing]] reviewed and closed `done` ([[research-first-routing-review]]): 10/10 ACs, 10 review findings fixed, selftest 417 green, v0.29.0 ready to push.
- Earlier: [[develop-lifecycle-fixes]] closed `done` in v0.28.0 ([[develop-lifecycle-fixes-review]]).

## Next
1. `/brain:wrap` — push v0.29.0, reinstall the plugin locally, restart Claude Code.
2. Dogfood debts still open: PR-review mode on a real PR, MCP registry on a real `.mcp.json`.
3. Doctor check 1 counts `[[links]]` from wiki pages to `decisions/` and `specs/` as broken (it only knows `wiki/` slugs) — a doctor/lint scope gap to spec separately.

## Blockers / risks
- Changing gate behaviour affects every brain; the unscoped fallback (AC-3) is what keeps existing brains unchanged.

## Links
Specs: [[research-first-routing]] · [[develop-lifecycle-fixes]] · Decisions: [[research-first-entry-is-advisory]] · [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]] · Research: [[research-first-entry]] · [[develop-lifecycle-dogfood]]
