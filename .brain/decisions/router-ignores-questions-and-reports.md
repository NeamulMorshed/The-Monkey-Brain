---
title: "ADR — The router acts on the curator's instructions only"
type: decision
status: accepted
created: 2026-09-16
updated: 2026-09-16
sources: ["[[brain-health-audit]]", "[[router-and-drift]]"]
related: ["[[trigger-router]]", "[[router-and-drift]]", "[[router-and-drift-review]]", "[[research-first-entry-is-advisory]]"]
---

# The router acts on the curator's instructions only

## Context
`trigger-router.js` turns a prompt into a `/brain:*` skill hint with a first-match list of regex rules. The audit and a later probe reproduced six misfires ([[brain-health-audit]], [[router-and-drift]]): questions were exempt only from the dev catch-all, so a question containing "research" fired research; incidental words fired skills ("create a new doctor check for the brain" → init, "research purpose model" → research); and text that was not the curator's at all — subagent reports pasted into the conversation, teammate messages — fired ingest and research several times in one session. Two fixes were possible: an intent classifier (a model call per prompt), or narrower rules plus an explicit "whose words are these" gate.

## Decision
The router stays deterministic and regex-local, with three rules applied before any skill rule wins: text that *starts* as someone else's report or message (`[Subagent hand-back]`, a teammate's "Another Claude session sent a message" header, `<agent-message>`) is never routed; a rule can declare itself question-exempt — the literal-`research`, ingest, wrap and init rules do, like the dev catch-all — and a question opens with a wh-word or an auxiliary ("is there…", "should we…"); a specific rule yields to development intent when the prompt is a build order about that thing (`not:` guards on doctor — "add a check to the doctor" — and dump — "we decided X. build Y", unless the prompt opens with "dump"). The noun forms ("the research", "for research purposes") are excluded where the verb is meant. Audit phrasings route to `/brain:doctor` only as a whole clause ("review the brain", never "review the brain-hardening spec").

*Amended 2026-09-16 by [[router-and-drift-review]]:* the first version also skipped any prompt containing "The report follows:", which silenced the curator's own pastes, and excluded "research papers / models" as nouns, which silenced real requests. Only a message's opening marks it as someone else's, and the noun test looks at the word before "research", not after.

## Consequences
Easier: routing hints appear when the curator asks for work, and stay silent on questions, reports and chatter — no hint the model has to ignore, no tokens spent on a misroute. Harder: every exclusion is a phrase list, so an unusual phrasing can still misfire or miss; the safe direction is silence, because the hint is advisory ([[research-first-entry-is-advisory]]). Watch: new report formats from Claude Code (a different hand-back header) need adding to `HANDBACK_RE`; a misfire seen in a real session gets a selftest case before its fix.
