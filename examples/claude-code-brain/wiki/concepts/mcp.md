---
title: "MCP (Model Context Protocol)"
type: concept
status: active
tags: [claude-code, extension, mcp, integration]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[mcp-guide]]"]
related: ["[[skills]]", "[[hooks]]", "[[mcp-tool-search]]", "[[search-tooling]]", "[[qmd]]", "[[claude-code]]"]
aliases: ["mcp", "model context protocol"]
---

# MCP (Model Context Protocol)

The protocol that connects Claude Code to **external services and tools** — query a database,
post to Slack, control a browser. The server handles connection and authentication.

- **Loading:** tool **names** load at session start; full JSON schemas stay deferred via
  **[[mcp-tool-search|Tool Search]]** (on by default), so idle MCP tools cost minimal
  [[context-window|context]]. `/mcp` shows status and per-server token cost.
- **Transports:** **HTTP** (recommended remote), **stdio** (local process; `--` separates Claude
  options from the server command), **WebSocket** (`ws`), **SSE** (deprecated). Add with
  `claude mcp add --transport …` or `.mcp.json` / `add-json`.
- **Scopes & precedence (first wins, no field merge):** local (default) > project (`.mcp.json`,
  committed, prompts for approval) > user > plugin > claude.ai connector.
- **Auth:** OAuth 2.0 via `/mcp` (401/403 flags the server; tokens in keychain, auto-refreshed);
  `oauth.scopes` pins scopes; `headersHelper` for non-OAuth schemes.
- **Resources & prompts:** reference resources with `@server:proto://path`; MCP prompts appear as
  `/mcp__server__prompt` commands. Output warns >10k tokens (cap 25k, `MAX_MCP_OUTPUT_TOKENS`).
- **MCP vs [[skills|Skill]]:** MCP provides the *tools*; a skill provides the *knowledge* of
  how to use them well. They combine (e.g. MCP connects a DB; a skill documents the schema and
  query patterns). See [[mcp-vs-skill]].
- **Scaling tie-in:** [[qmd]] ships an MCP server (`qmd mcp`) so the wiki's search becomes a
  native Claude tool when this vault outgrows its [[index-and-log|index]] — see [[search-tooling]].
- **[[hooks|Hook]] integration:** the `mcp_tool` handler calls a connected server's tool, and
  the `Elicitation`/`ElicitationResult` [[hook-events|events]] handle MCP user-input requests.

## Sources
- [[extend-claude-code]], [[context-window]], [[mcp-guide]]
