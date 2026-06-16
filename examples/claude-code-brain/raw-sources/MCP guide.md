---
title: "MCP guide"
source: "https://code.claude.com/docs/en/mcp"
author:
published:
created: 2026-06-17
description: "Connect Claude Code to tools via MCP: transports, adding servers, scopes & precedence, OAuth, tool search, reconnection, resources, prompts, output limits."
tags:
  - "clippings"
  - "claude-code"
  - "mcp"
---
## Connect Claude Code to tools via MCP

> Captured 2026-06-17 via WebFetch of https://code.claude.com/docs/en/mcp for ingestion into
> The Monkey Brain. Faithful condensation; consult the live page for authoritative details.

MCP (Model Context Protocol) is an open standard connecting Claude Code to hundreds of external
tools/data sources. Connect a server when you keep copying data from another tool (issue
tracker, dashboard, DB). **Verify trust** — servers fetching external content carry prompt-injection risk.

### Transports
- **HTTP** (recommended for remote): `claude mcp add --transport http <name> <url>`
  (`--header "Authorization: Bearer …"`). In JSON, `type: "streamable-http"` is an alias for `http`.
- **SSE** — deprecated; use HTTP.
- **stdio** (local process): `claude mcp add [opts] <name> -- <command> [args...]`. **`--` separates
  Claude's options from the server command.** Claude sets `CLAUDE_PROJECT_DIR` in the server env.
- **WebSocket** (`type: "ws"`, persistent bidirectional, header-only auth) — configure via
  `.mcp.json`/`add-json` only; no `--transport ws`, no OAuth.

### Managing servers
`claude mcp list` / `get <name>` / `remove <name>`; `/mcp` (status, tool counts, OAuth). Project
servers from `.mcp.json` show `⏸ Pending approval` until approved. Server name `workspace` is
reserved. Supports `list_changed` dynamic tool updates.

### Reconnection
HTTP/SSE auto-reconnect with exponential backoff (≤5 attempts, 1s doubling); initial connection
retried ≤3× on transient (5xx/refused/timeout) errors — not on auth/not-found. **stdio not
reconnected** (local process).

### Scopes & precedence
| Scope | Loads in | Shared | Stored in |
| --- | --- | --- | --- |
| **local** (default) | current project | No | `~/.claude.json` (per-project) |
| **project** | current project | Yes (commit `.mcp.json`) | `.mcp.json` at root |
| **user** | all projects | No | `~/.claude.json` |

Precedence (first wins, no field merge): **local > project > user > plugin > claude.ai
connectors**. Scopes match by name; plugins/connectors match by endpoint. Project servers
prompt for approval (`claude mcp reset-project-choices` to reset). `.mcp.json` supports env
expansion `${VAR}` / `${VAR:-default}` in command/args/env/url/headers.

### Auth (OAuth 2.0)
Server returns 401/403 → flagged in `/mcp` → complete OAuth in browser. Tokens stored in
keychain, auto-refreshed. `--callback-port` for a fixed redirect URI; `--client-id` /
`--client-secret` for pre-configured creds (no Dynamic Client Registration). `oauth.scopes`
pins requested scopes; `authServerMetadataUrl` overrides discovery. `headersHelper` generates
headers at connect time for non-OAuth auth (Kerberos/SSO/short-lived tokens).

### Other integration
`claude mcp add-json <name> '<json>'`; `claude mcp add-from-claude-desktop` (macOS/WSL);
claude.ai connectors auto-available when authed via Claude.ai subscription
(`ENABLE_CLAUDEAI_MCP_SERVERS=false` to disable). `claude mcp serve` runs Claude Code itself as
an MCP server. Plugins bundle servers (`${CLAUDE_PLUGIN_ROOT}`); plugin tool names are
`mcp__plugin_<plugin>_<server>__<tool>`.

### Output limits
Warning at >10,000 output tokens; default cap **25,000** (`MAX_MCP_OUTPUT_TOKENS`). Per-tool
override `_meta["anthropic/maxResultSizeChars"]` (ceiling 500k chars). Oversized results persist
to disk + file reference.

### Resources & prompts
**Resources:** `@server:protocol://resource/path` (e.g. `@github:issue://123`), fuzzy-searchable
in `@` autocomplete, fetched as attachments. **Prompts:** appear as `/mcp__server__prompt` slash
commands, args space-separated. **Elicitation:** servers request structured input mid-task
(form or URL mode); auto-respond via the `Elicitation` hook.

### Tool Search (scale)
**On by default.** Defers tool *definitions* until needed — only tool **names** + server
instructions load at session start, so adding servers barely touches the context window. Claude
uses a `ToolSearch` tool to discover relevant tools on demand; only used tools enter context.
- `ENABLE_TOOL_SEARCH`: unset/`true` = all deferred; `auto`/`auto:N` = load upfront if within
  N% (default 10%) of context, defer overflow; `false` = all upfront.
- Disabled by default on Vertex AI and non-first-party `ANTHROPIC_BASE_URL` proxies; needs a
  model supporting `tool_reference` blocks (not Haiku). Deny `ToolSearch` to disable the tool.
- **`alwaysLoad: true`** (per server, or per-tool `_meta`) exempts tools from deferral (loaded
  every session; blocks startup ≤5s). Server instructions + tool descriptions truncated at 2KB.

### Managed
`managed-mcp.json`, `allowedMcpServers`/`deniedMcpServers` for org control.
