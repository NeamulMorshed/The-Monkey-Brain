---
title: "Context Window"
type: concept
status: active
tags: [claude-code, context, tokens]
created: 2026-06-17
updated: 2026-07-17
sources: ["[[context-window]]", "[[extend-claude-code]]", "[[caveman-readme]]"]
related: ["[[compaction]]", "[[subagents]]", "[[claude-md]]", "[[skills]]", "[[mcp]]", "[[hooks]]", "[[memory]]", "[[rules]]"]
aliases: ["context", "context window"]
---

# Context Window

Everything Claude Code knows about a session: instructions, files read, its own responses,
and content that never appears in your terminal. Default ~200K tokens.

## What loads, and when
- **Before you type:** [[claude-md|CLAUDE.md]], auto [[memory]], [[mcp|MCP]] tool **names**
  (schemas deferred via [[mcp-tool-search|Tool Search]]), [[skills]] descriptions (+ output
  style / `--append-system-prompt`). See [[extend-claude-code|context cost by feature]].
- **As Claude works:** each file read adds tokens; path-scoped [[rules]] load with matching
  files; [[hooks|PostToolUse hooks]] fire after edits.
- **Delegation:** [[subagents]] run in a *separate* window and return only a summary, keeping
  large reads out of yours.

## Managing it
- `/compact [focus]`, `/clear` between tasks, delegate to [[subagents]].
- Inspect with `/context` (live breakdown) and `/memory` (what loaded at startup).
- **Where savings land** ([[caveman-readme|Caveman's honest numbers]]): output, input, and
  reasoning tokens are separate budgets. Output-style compression (~65%) never touches input;
  compressing always-loaded memory files cuts input **permanently** (~46%); an always-on
  [[skills|skill]] body costs ~1–1.5k input/turn. Account economy claims per budget — with
  receipts.
- **Extended context:** Fable 5, Opus 4.6+, Sonnet 4.6 support a **1M-token** window (`[1m]`).

At the limit, [[compaction]] summarizes history automatically.

## Sources
- [[context-window]], [[extend-claude-code]], [[caveman-readme]]
