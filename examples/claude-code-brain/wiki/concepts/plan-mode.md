---
title: "Plan Mode"
type: concept
status: active
tags: [claude-code, permissions, planning]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permission-modes]]"]
related: ["[[permission-modes]]", "[[auto-mode]]", "[[claude-code]]"]
aliases: ["plan"]
---

# Plan Mode

Tells Claude Code to **research and propose** changes without making them. It reads files,
runs exploratory commands, and writes a plan — but does not edit source. Permission prompts
otherwise behave like `default`. Research is delegated to the read-only **Plan**
[[built-in-subagents|built-in subagent]] so exploration stays out of the main context.

- **Enter:** `Shift+Tab`, prefix a prompt with `/plan`, or `--permission-mode plan`.
- **Approve a plan** and choose how to proceed: start in [[auto-mode]], accept edits, review
  each edit, keep planning, or refine with **Ultraplan** (browser-based review). Approving
  exits plan mode and switches the session to the chosen [[permission-modes|mode]].
- `Ctrl+G` opens the plan in your editor; accepting also auto-names the session.
- Make it the project default via `permissions.defaultMode: "plan"`.

## Sources
- [[permission-modes]]
