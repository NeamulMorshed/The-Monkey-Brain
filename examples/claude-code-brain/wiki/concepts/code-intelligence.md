---
title: "Code Intelligence (LSP)"
type: concept
status: active
tags: [claude-code, extension, lsp, navigation]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]"]
related: ["[[context-window]]", "[[plugins]]", "[[claude-code]]"]
aliases: ["lsp", "code intelligence"]
---

# Code Intelligence (LSP)

Connects Claude Code to a **language server** for symbol-level navigation and live type
errors — jump to a definition instead of reading whole files.

- **Loads:** type errors/warnings after each file edit; definition/reference/type info on
  symbol lookup.
- **[[context-window|Context cost]]:** low — symbol lookups often *replace* broad file reads,
  so net context can drop.
- **Best for:** typed languages and large codebases where grep is slow or imprecise.
- The LSP tool is inactive until you install a **code intelligence [[plugins|plugin]]** for
  your language.

## Sources
- [[extend-claude-code]]
