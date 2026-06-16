---
title: "Protected Paths"
type: concept
status: active
tags: [claude-code, permissions, safety]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permission-modes]]"]
related: ["[[permission-modes]]", "[[auto-mode]]", "[[permission-rules]]"]
aliases: ["protected paths"]
---

# Protected Paths

A fixed set of paths whose writes are **never auto-approved** — in every
[[permission-modes|mode]] except `bypassPermissions` — guarding repo state and Claude's own
config from accidental corruption.

| Mode | Protected-path writes |
| --- | --- |
| `default`, `acceptEdits`, `plan` | Prompted |
| `auto` | Routed to the [[auto-mode|classifier]] |
| `dontAsk` | Denied |
| `bypassPermissions` | Allowed |

**Key subtlety:** `permissions.allow` rules do **not** pre-approve protected-path writes —
the safety check runs before allow rules are evaluated. In prompting modes the prompt offers
"Yes, and allow Claude to edit its own settings for this session."

**Protected directories** include `.git`, `.vscode`, `.idea`, `.husky`, `.cargo`,
`.devcontainer`, `.claude` (except `.claude/worktrees`). **Protected files** include
`.gitconfig`, shell rc files (`.bashrc`, `.zshrc`, `.profile`, `.envrc`…), package-manager
configs (`.npmrc`, `.yarnrc`, `bunfig.toml`…), `.pre-commit-config.yaml`, `.mcp.json`,
`.claude.json`, and more.

> Note for this vault: the schema lives at `schema/CLAUDE.md`, **not** `.claude/`, so it is
> not protected — but a Claude Code session pointed here treats real `.claude/` writes as
> protected.

## Sources
- [[permission-modes]]
