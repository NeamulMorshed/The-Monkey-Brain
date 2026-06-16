---
title: "MCP Tool Search"
type: concept
status: active
tags: [claude-code, mcp, context, tool-search, scalability]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[mcp-guide]]"]
related: ["[[mcp]]", "[[context-window]]", "[[skills]]"]
aliases: ["tool search", "ToolSearch", "alwaysLoad"]
---

# MCP Tool Search

The mechanism that keeps [[mcp|MCP]] context usage low and lets you add many servers without
filling the [[context-window]]. **On by default.**

## How it works
At session start, only tool **names** and each server's instructions load (truncated at 2KB);
full tool **definitions/schemas defer** until Claude needs them. Claude calls a `ToolSearch`
tool to discover relevant tools on demand, and **only the tools it actually uses enter
context**. This is the concrete answer to "why are idle MCP tools cheap?" asserted on
[[mcp]] and [[extend-claude-code]] — and it mirrors how [[skills]] descriptions load eagerly
while bodies load on use.

## Configuration
`ENABLE_TOOL_SEARCH`:
| Value | Behavior |
| --- | --- |
| unset / `true` | All MCP tools deferred, discovered on demand |
| `auto` / `auto:N` | Load upfront if within N% (default 10%) of context, defer the rest |
| `false` | All tools loaded upfront |

- Needs a model supporting `tool_reference` blocks (**not Haiku**). Off by default on Vertex AI
  and non-first-party `ANTHROPIC_BASE_URL` proxies.
- **`alwaysLoad: true`** (per server in `.mcp.json`, or per-tool `_meta`) exempts tools from
  deferral — loaded every session (costs context; blocks startup ≤5s). Use sparingly.
- Deny the `ToolSearch` tool in [[permission-rules|permissions]] to disable it.

## Sources
- [[mcp-guide]]
