---
title: "Plugins & Marketplaces"
type: concept
status: active
tags: [claude-code, extension, plugins, packaging]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]"]
related: ["[[skills]]", "[[hooks]]", "[[subagents]]", "[[mcp]]", "[[frontend-design]]", "[[superpowers]]"]
aliases: ["plugin", "plugins", "marketplace"]
---

# Plugins & Marketplaces

The **packaging layer**: a plugin bundles [[skills]], [[hooks]], [[subagents]], and [[mcp|MCP]]
servers into a single installable unit. Plugin skills are **namespaced** (`/my-plugin:review`)
so multiple plugins coexist — and take their command name from the directory, not frontmatter
([[skill-authoring|details]]). A skill folder with a `.claude-plugin/plugin.json` even loads as
a `<name>@skills-dir` plugin.

- **When to use:** reuse the same setup across repositories, or distribute to others via a
  **marketplace**.
- **Examples in this vault:**
  - [[frontend-design]] — auto-activating design [[skills|skill]] for distinctive UI.
  - [[superpowers]] — TDD/debugging/brainstorming [[skills|skills]] + a code-reviewer
    [[subagents|agent]].
  - Code-intelligence plugins activate the [[code-intelligence|LSP tool]] per language.

## Sources
- [[extend-claude-code]], [[frontend-design-plugin]], [[superpowers-plugin]]
