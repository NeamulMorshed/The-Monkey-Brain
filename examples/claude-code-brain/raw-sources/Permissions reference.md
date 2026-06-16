---
title: "Permissions reference"
source: "https://code.claude.com/docs/en/permissions"
author:
published:
created: 2026-06-17
description: "Configure Claude Code permissions: allow/ask/deny rule syntax, tool-specific patterns, settings precedence, managed policy, read-only commands, working directories."
tags:
  - "clippings"
  - "claude-code"
  - "permissions"
---
## Configure permissions

> Captured 2026-06-17 via WebFetch of https://code.claude.com/docs/en/permissions for
> ingestion into The Monkey Brain. Faithful condensation; consult the live page for the
> authoritative version.

Fine-grained control over what Claude Code may do, checkable into version control and
distributable org-wide.

### Tiered system
Read-only (no approval) · Bash (approval; "don't ask again" persists per project+command) ·
File modification (approval; "don't ask again" lasts until session end).

### Manage (`/permissions`)
- **Allow** = use without approval; **Ask** = always prompt; **Deny** = forbid.
- **Evaluation order: deny → ask → allow.** First match wins; specificity does NOT reorder.
  A broad deny blocks even a narrower allow (no allowlist exceptions). A matching ask prompts
  even with a more specific allow.
- A **bare tool name** deny (`Bash`) removes the tool from Claude's context entirely; a
  **scoped** deny (`Bash(rm *)`) leaves the tool available and blocks matching calls.
- Rules are enforced by Claude Code, **not the model** — prompt/CLAUDE.md can't change them.

### Modes (set `defaultMode`)
`default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. Disable bypass/auto
with `permissions.disableBypassPermissionsMode` / `disableAutoMode` = `"disable"` (best in
managed settings).

### Rule syntax — `Tool` or `Tool(specifier)`
- Bare `Bash` / `Bash(*)` = all Bash. `Read(./.env)`, `WebFetch(domain:example.com)`.
- **Bash wildcards** `*` at any position. **Space matters:** `Bash(ls *)` matches `ls -la`
  not `lsof`; `Bash(ls*)` matches both. `:*` suffix = trailing ` *` (end only).
- **Tool-name globs** in deny/ask: `"*"` all tools, `"mcp__*"` all MCP tools. Allow globs only
  after a literal `mcp__<server>__` prefix (server segment glob-free); unanchored allow globs
  are skipped with a warning. Unknown tool name in deny/ask → startup warning (typo guard).
  Match the **canonical** tool name (`TaskStop`, not `Stop Task`).

### Tool-specific
- **Bash:** aware of shell operators (`&&`,`||`,`;`,`|`,`|&`,`&`,newline) — each subcommand
  must match independently; approving a compound saves a rule per subcommand (≤5). Strips
  process wrappers `timeout`/`time`/`nice`/`nohup`/`stdbuf` and bare `xargs`. Env runners
  (`devbox run`, `npx`, `docker exec`) are NOT stripped — write specific rules. Exec wrappers
  (`watch`,`setsid`,`flock`, `find -exec/-delete`) always prompt.
- **Read-only commands** run without prompt in every mode: `ls cat echo pwd head tail grep
  find wc which diff stat du cd` + read-only `git`. Not configurable; add ask/deny to require
  a prompt. Unquoted globs ok for all-read-only flags.
- **PowerShell:** same shape; aliases canonicalized (`gci`/`ls`/`dir` → `Get-ChildItem`);
  case-insensitive; AST-parsed compound splitting.
- **Read/Edit:** gitignore-spec patterns with four anchors — `//abs`, `~/home`, `/project-root`,
  `path`/`./path` cwd-relative. `*` within a segment, `**` across. Bare filename matches at any
  depth (`Read(.env)` = `Read(**/.env)`). Symlinks: allow needs both link+target to match;
  deny matches if either does. Applies to built-in file tools + recognized Bash file commands
  (`cat`/`head`/`sed`), NOT arbitrary subprocesses (use the sandbox).
- **WebFetch:** `domain:` prefix, hostname match, `*` wildcards; `*.example.com` = subdomains
  only. `domain:*` = all.
- **MCP:** `mcp__server`, `mcp__server__*`, `mcp__server__tool`.
- **Agent (subagents):** `Agent(Explore)`, `Agent(my-custom-agent)` — deny to disable.
- **Cd:** governs the `/cd` command (you-only, not model-invocable); any `Cd` allow rule
  switches `/cd` to allowlist mode.

### Hooks extend permissions
PreToolUse hooks run **before** the prompt and can deny/ask/skip — but **do not bypass rules**:
deny/ask rules still apply, and a hook exiting code 2 blocks before rules are evaluated (beats
allow). Pattern: allow `Bash` broadly + a PreToolUse hook that rejects specific commands.

### Working directories
Extend file access: `--add-dir` (startup), `/add-dir` (session), `additionalDirectories`
(settings). `--add-dir`/`/add-dir` also load `.claude/skills/` (live reload), `enabledPlugins`,
and CLAUDE.md (only with `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`); the
`additionalDirectories` **setting** grants file access ONLY. `/cd` relocates the primary
working dir (loads new CLAUDE.md).

### Sandboxing (complementary)
Permissions = which tools/files/domains (all tools); sandbox = OS-level Bash filesystem/network
enforcement. Read/Edit deny rules merge into the sandbox boundary; WebFetch rules merge with
`allowedDomains`/`deniedDomains`. With `autoAllowBashIfSandboxed: true` (default), sandboxed
Bash skips the bare-`Bash` ask prompt (content-scoped asks + deny still apply).

### Managed settings & precedence
Org policy that user/project can't override; many **managed-only** keys
(`allowManagedPermissionRulesOnly`, `strictPluginOnlyCustomization`, `allowManagedMcpServersOnly`,
`sandbox.*.allowManaged*Only`, etc.).

**Settings precedence (highest first):**
1. Managed settings (cannot be overridden, even by CLI args)
2. Command-line arguments
3. Local project settings (`.claude/settings.local.json`)
4. Shared project settings (`.claude/settings.json`)
5. User settings (`~/.claude/settings.json`)

**If denied at any level, no other level can allow it** (deny from any scope beats allow from
any scope, consistent with deny-first evaluation).
