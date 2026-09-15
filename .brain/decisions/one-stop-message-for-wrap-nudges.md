---
title: "ADR — One Stop message lists every unmet wrap item"
type: decision
status: accepted
created: 2026-09-15
updated: 2026-09-15
sources: ["[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes]]"]
related: ["[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes]]", "[[spec-scope-globs-gate-ownership]]"]
---

# One Stop message lists every unmet wrap item

## Context
`wrap.js` runs three Stop-time reminders: wiki changed but not logged, build/review with no ADR, uncommitted `.brain/` changes (the last added in v0.27.0). Each called `lib.succeed` and exited on its first hit, so a session that needed all three took three Stop attempts to learn everything it had to do ([[develop-lifecycle-dogfood]] finding 8). The v0.27.0 design was deliberately additive; this session asked whether the one-check-per-Stop behaviour should stay behind a flag.

## Decision
Every Stop check returns its unmet item instead of exiting. `wrap.js` runs all three, writes a once-per-session marker for each item it shows, and blocks once with the reasons joined. The per-check markers stay, so an item already shown this session is omitted from a later message while the others can still appear. No flag: the consolidated message replaces the old behaviour outright, since the reminder texts and the `wrap[log]`, `wrap[decisions]`, `wrap[git]` labels are unchanged and every existing selftest still passes.

## Consequences
Easier: a clean wrap sees its full to-do list on the first Stop. Harder: the message is longer when several items are unmet; each item keeps its own one-paragraph text so the labels stay greppable. Watch: any new Stop-time check must follow the return-an-item contract rather than calling `lib.succeed` itself, or it will short-circuit the others again.
