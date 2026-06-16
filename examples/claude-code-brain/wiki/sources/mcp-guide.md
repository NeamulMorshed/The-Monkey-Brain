---
title: "Source — MCP Guide"
type: source
status: active
tags: [claude-code, mcp, reference, integration]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/MCP guide.md"
origin: "https://code.claude.com/docs/en/mcp"
related: ["[[mcp]]", "[[mcp-tool-search]]", "[[context-window]]"]
aliases: ["mcp guide"]
---

# MCP Guide

> **Raw source:** [MCP guide.md](../../raw-sources/MCP%20guide.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The full reference behind [[mcp]]: the four transports, adding/scoping servers, OAuth, resources
& prompts, output limits, and **[[mcp-tool-search|Tool Search]]** — the mechanism that keeps idle
MCP tools nearly free in [[context-window|context]].

## Key takeaways
- **Transports:** HTTP (recommended remote), stdio (local, `--` separates Claude opts from the
  server command), WebSocket (`ws`, header-only), SSE (deprecated).
- **Scopes & precedence:** local (default, `~/.claude.json`) > project (`.mcp.json`, committed,
  prompts for approval) > user > plugin > claude.ai connector. First wins, **no field merge**.
- **[[mcp-tool-search|Tool Search]] (new page):** on by default — only tool **names** + 2KB server
  instructions load at start; definitions defer until a `ToolSearch` call needs them. This is the
  source behind the "idle MCP tools cost minimal context" claim on [[mcp]]/[[extend-claude-code]].
  `alwaysLoad: true` exempts a server.
- **Auth:** OAuth via `/mcp` (401/403 → flagged), tokens in keychain; `oauth.scopes` pins scopes;
  `headersHelper` for non-OAuth schemes.
- **Resources** (`@server:proto://path`) and **prompts** (`/mcp__server__prompt`) extend `@` and
  `/`; **elicitation** maps to the [[hook-events|Elicitation hook]].
- **Reconnection:** HTTP/SSE auto-reconnect (≤5, backoff); stdio not reconnected.
- **Output:** warn >10k tokens, default cap 25k (`MAX_MCP_OUTPUT_TOKENS`).

## Concepts this touches
- [[mcp]] — substantially expanded (transports, scopes, auth, resources/prompts)
- [[mcp-tool-search]] — new page (deferred tool loading)
- [[context-window]] — why idle MCP tools are cheap (now sourced)
- [[plugins]] — plugin-bundled servers; [[permission-rules]] — `mcp__*` tool names
- [[hooks]] — `Elicitation` / `ElicitationResult`; [[qmd]] — a concrete MCP server

## Contradictions / notes
> No contradictions. **Sources** the context-cost claim about MCP that [[context-window]] and
> [[extend-claude-code]] asserted: it's specifically **Tool Search** deferring schemas.

## Pages updated on ingest
- [[index]], [[mcp]], [[mcp-tool-search]], [[context-window]], [[plugins]], [[qmd]], [[claude-code]]
