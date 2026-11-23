---
title: "Brain update — status"
type: project
status: active
tier: feature
phase: review
audit_score:
created: 2026-11-24
updated: 2026-11-24
related: ["[[brain-update]]", "[[brain-update-command]]"]
---

# Brain update

One command (`/brain:update`) that updates the plugin and refreshes every brain on the machine.

## Now
- Built (0.36.0, selftest green) — in review; `/brain:review` on another model family next.
- [[brain-update]] — spec drafted, feature tier (target 0.36.0).

## Next
1. `/brain:build brain-update` (test-first; AC-8's router case red first).
2. `/brain:review` on another model family.
3. Release 0.36.0 (tag + GitHub Release).
