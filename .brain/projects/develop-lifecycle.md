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
related: [develop-lifecycle-dogfood, develop-lifecycle-fixes]
---

# Develop lifecycle

Dogfooding the plugin's own research → plan → build → review → wrap chain on this repo and fixing what it trips over.

## Now
- Spec [[develop-lifecycle-fixes]] drafted (feature tier, 12 ACs) — awaiting the curator's review of the ACs and the two assumptions in its Notes before `/brain:build`.

## Next
1. Curator reviews ACs and confirms `scope:` globs and the consolidated Stop message.
2. `/brain:build develop-lifecycle-fixes` — tests first (AC-4, AC-10), then guards.js / wrap.js / SKILL docs / manual.
3. `/brain:review develop-lifecycle-fixes`, then `/brain:wrap` and version bump to v0.28.0.

## Blockers / risks
- Changing gate behaviour affects every brain; the unscoped fallback (AC-3) is what keeps existing brains unchanged.

## Links
Specs: [[develop-lifecycle-fixes]] · Decisions: none yet · Research: [[develop-lifecycle-dogfood]]
