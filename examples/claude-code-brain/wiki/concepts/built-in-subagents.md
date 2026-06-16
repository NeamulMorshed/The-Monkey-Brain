---
title: "Built-in Subagents"
type: concept
status: active
tags: [claude-code, subagents, explore, plan]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[subagents-guide]]"]
related: ["[[subagents]]", "[[plan-mode]]", "[[context-window]]", "[[permission-rules]]"]
aliases: ["Explore agent", "Plan agent", "general-purpose agent", "built-in agents"]
---

# Built-in Subagents

The [[subagents]] Claude Code ships and delegates to automatically. Each inherits the parent's
permissions with extra tool restrictions.

| Agent | Model | Tools | Purpose |
| --- | --- | --- | --- |
| **Explore** | Haiku | Read-only (no Write/Edit) | File discovery, code search. Thoroughness: quick / medium / very thorough |
| **Plan** | inherits | Read-only | Codebase research during [[plan-mode]] |
| **general-purpose** | inherits | All | Complex multi-step exploration + action |
| statusline-setup | Sonnet | — | `/statusline` setup |
| claude-code-guide | Haiku | — | Answer Claude Code questions |

## What loads at startup (the key caveat)
**Explore and Plan skip your [[claude-md|CLAUDE.md]] and the parent session's git status** to
keep research fast and cheap. **Every other** built-in and custom subagent loads both. This is
the detail [[subagents]] and [[extend-claude-code]] referenced — now sourced.

## Control
Always registered interactively. Block one with a [[permission-rules|deny rule]]
`Agent(Explore)`; deny the `Agent` tool to stop all delegation;
`CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` removes built-ins in headless/SDK.

## Sources
- [[subagents-guide]]
