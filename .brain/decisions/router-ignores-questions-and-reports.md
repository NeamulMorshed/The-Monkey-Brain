---
title: "ADR — The router acts on the curator's instructions only"
type: decision
status: accepted
created: 2026-09-16
updated: 2026-09-16
sources: ["[[brain-health-audit]]", "[[router-and-drift]]"]
related: ["[[trigger-router]]", "[[router-and-drift]]", "[[research-first-entry-is-advisory]]"]
---

# The router acts on the curator's instructions only

## Context
`trigger-router.js` turns a prompt into a `/brain:*` skill hint with a first-match list of regex rules. The audit and a later probe reproduced six misfires ([[brain-health-audit]], [[router-and-drift]]): questions were exempt only from the dev catch-all, so a question containing "research" fired research; incidental words fired skills ("create a new doctor check for the brain" → init, "research purpose model" → research); and text that was not the curator's at all — subagent reports pasted into the conversation, teammate messages — fired ingest and research several times in one session. Two fixes were possible: an intent classifier (a model call per prompt), or narrower rules plus an explicit "whose words are these" gate.

## Decision
The router stays deterministic and regex-local, with three rules applied before any skill rule wins: text that is someone else's report or message (`[Subagent hand-back]`, "The report follows:", a teammate's message header) is never routed; a rule can declare itself question-exempt, and the literal-`research` rule does, like the dev catch-all; a specific rule yields to development intent when the prompt is a build order about that thing (`not:` guards on doctor — "add a check to the doctor" — and dump — "we decided X, now build Y"). The noun forms ("research paper", "research purpose") are excluded where the verb is meant. Audit phrasings route to `/brain:doctor`.

## Consequences
Easier: routing hints appear when the curator asks for work, and stay silent on questions, reports and chatter — no hint the model has to ignore, no tokens spent on a misroute. Harder: every exclusion is a phrase list, so an unusual phrasing can still misfire or miss; the safe direction is silence, because the hint is advisory ([[research-first-entry-is-advisory]]). Watch: new report formats from Claude Code (a different hand-back header) need adding to `HANDBACK_RE`; a misfire seen in a real session gets a selftest case before its fix.
