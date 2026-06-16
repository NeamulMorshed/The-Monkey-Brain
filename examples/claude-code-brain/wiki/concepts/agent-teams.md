---
title: "Agent Teams"
type: concept
status: active
tags: [claude-code, extension, agent-teams, experimental]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]"]
related: ["[[subagents]]", "[[subagent-vs-agent-team]]", "[[claude-code]]"]
aliases: ["agent team"]
---

# Agent Teams

Multiple **independent Claude Code sessions** that communicate peer-to-peer, coordinating via
a shared task list. Unlike [[subagents]] (which run inside your session and report back to
you), teammates message each other directly and are fully independent.

- **Best for:** research with competing hypotheses, parallel code review, new-feature work
  where each teammate owns a piece.
- **Cost:** higher — each teammate is a separate Claude instance.
- **Transition point:** if parallel subagents hit context limits or need to talk to each
  other, agent teams are the next step.
- **Status:** experimental, disabled by default.

See [[subagent-vs-agent-team]].

## Sources
- [[extend-claude-code]]
