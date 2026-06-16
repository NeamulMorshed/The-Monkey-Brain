---
title: "Source — Explore the Context Window"
type: source
status: active
tags: [claude-code, context, compaction, subagents]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Explore the context window.md"
origin: "https://code.claude.com/docs/en/context-window"
related: ["[[context-window]]", "[[compaction]]", "[[subagents]]"]
aliases: ["context window docs"]
---

# Explore the Context Window

> **Raw source:** [Explore the context window.md](../../raw-sources/Explore%20the%20context%20window.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The context window holds everything Claude knows about a session. A lot loads *before you
type* (CLAUDE.md, memory, skill descriptions, MCP tool names). Reads, rules, and hooks add
to it as Claude works; compaction summarizes history when it fills.

## Key takeaways
- **Pre-prompt load:** [[claude-md]], auto [[memory]], [[mcp|MCP]] tool names, and
  [[skills]] descriptions are all in [[context-window|context]] before your first message.
- **As Claude works:** each file read adds tokens; path-scoped [[rules]] load with matching
  files; [[hooks|PostToolUse hooks]] fire after edits.
- **[[subagents]]** keep large reads out of your window — they run in a separate context and
  return only a summary.
- **[[compaction]]** at the limit replaces history with a structured summary. What survives
  varies by mechanism (system prompt unchanged; CLAUDE.md/auto-memory re-injected;
  `paths:` rules and nested CLAUDE.md lost until re-triggered; skill bodies re-injected but
  capped at 5k/skill, 25k total, oldest dropped).
- **Manage proactively:** `/compact` with focus, `/clear` between tasks, delegate to
  subagents. `/context` and `/memory` inspect live usage.
- **Extended context:** Fable 5, Opus 4.6+, Sonnet 4.6 support a **1M-token** window (`[1m]`).

## Concepts this touches
- [[context-window]] — the central concept
- [[compaction]] — what survives, what's lost
- [[subagents]] — context isolation
- [[claude-md]], [[skills]], [[mcp]], [[hooks]], [[rules]], [[memory]] — what loads & when

## Contradictions / notes
> Reinforces [[permission-modes]]: auto-mode conversational boundaries are re-read from the
> transcript and can be **dropped by compaction** — a cross-source dependency.

## Pages updated on ingest
- [[index]], [[context-window]], [[compaction]], [[subagents]], [[claude-md]], [[skills]],
  [[mcp]], [[hooks]], [[rules]], [[memory]]
