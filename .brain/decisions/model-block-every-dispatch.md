---
title: "ADR — The model-routing block applies to every unpinned dispatch"
type: decision
status: accepted
created: 2026-09-15
updated: 2026-09-15
sources: ["[[brain-health-audit]]", "[[brain-correctness]]"]
related: ["[[brain-health-audit]]", "[[brain-correctness]]"]
---

# The model-routing block applies to every unpinned dispatch

## Context
`agent-track.js` blocked a main-model agent dispatch without an explicit `model` only once per session, via a temp-dir marker: "one corrective retry, then the session is left alone". The audit showed the leak live — the first model-less dispatch was blocked while its parallel sibling ran unpinned on the main model, and the selftest asserted the leak as intended ([[brain-health-audit]] P1 #10). The same hook also logged Claude Code's internal forks (no agent type, no transcript) as successful dispatches: 61 of 69 outcome lines, which hid real empty results from doctor check 18.

## Decision
Every dispatch of a main-model agent type (`general-purpose`, `claude`, `Plan`, or none) without an explicit `model` is blocked, with the routing table in the message. `fork` is not a heavy type: Claude Code ignores a model override on forks, so blocking one could only force a meaningless parameter. A SubagentStop with no agent type and no transcript records is not a dispatch and leaves no ledger line; doctor 18 skips the legacy phantom lines already written.

## Consequences
Easier: the routing policy is actually enforced, and doctor 18's window shows real outcomes. Harder: every heavy dispatch needs a `model` — one parameter, and `opus` is the answer for work that belongs on the main model. Watch: if Claude Code adds agent types that default to the main model, add them to `HEAVY_TYPES`; which model each kind of work should use is settled by the model-routing table ([[token-diet]]), not here.
