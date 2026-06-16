---
title: "Settings Precedence"
type: concept
status: active
tags: [claude-code, settings, config, permissions]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permissions-reference]]"]
related: ["[[permission-rules]]", "[[claude-md]]", "[[extend-claude-code]]", "[[protected-paths]]"]
aliases: ["settings hierarchy", "managed settings", "settings.json"]
---

# Settings Precedence

How Claude Code resolves configuration (including [[permission-rules]]) when the same setting
exists at multiple levels.

## Order (highest wins)
1. **Managed settings** — org policy; cannot be overridden by anything, **including CLI args**.
2. **Command-line arguments** — temporary session overrides.
3. **Local project** — `.claude/settings.local.json` (gitignored).
4. **Shared project** — `.claude/settings.json` (committed).
5. **User** — `~/.claude/settings.json`.

## The deny-wins rule
**If a tool is denied at any level, no other level can allow it.** A managed deny can't be
overridden by `--allowedTools`; a user-level deny blocks a project-level allow. This is the
[[permission-rules|deny → ask → allow]] evaluation applied *across scopes*.

## Managed-only settings
Some keys are read **only** from managed settings: `allowManagedPermissionRulesOnly`,
`allowManagedMcpServersOnly`, `strictPluginOnlyCustomization`, `allowManagedHooksOnly`,
`sandbox.*.allowManaged*Only`, marketplace restrictions, etc. `disableBypassPermissionsMode`
works from any scope (a user can lock themselves out of [[protected-paths|bypass]]).

## Relation to other layering
This governs `settings.json` keys. [[claude-md|CLAUDE.md]] files layer **additively** instead;
skills/MCP/subagents override **by name** — see [[extend-claude-code]] for those rules.

## Sources
- [[permissions-reference]]
