---
title: "Source — Subagents Guide"
type: source
status: active
tags: [claude-code, subagents, reference, context]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Subagents guide.md"
origin: "https://code.claude.com/docs/en/sub-agents"
related: ["[[subagents]]", "[[built-in-subagents]]", "[[skill-authoring]]"]
aliases: ["subagents guide", "sub-agents"]
---

# Subagents Guide

> **Raw source:** [Subagents guide.md](../../raw-sources/Subagents%20guide.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The full reference behind [[subagents]]: the agent-definition file format, every frontmatter
field, scope precedence, the **[[built-in-subagents|built-in agents]]** (Explore/Plan/
general-purpose), and exactly **what loads at startup**.

## Key takeaways
- **Definition = markdown + frontmatter; the body is the system prompt.** Subagents get only
  that + basic env, **not** the full Claude Code system prompt. Manage via `/agents` (instant)
  or files (restart).
- **[[built-in-subagents]] (new page):** Explore (read-only, Haiku), Plan (read-only research),
  general-purpose (all tools). **Explore and Plan skip CLAUDE.md + parent git status** to stay
  fast — this is the source of the "what loads at startup" caveat asserted on [[subagents]] and
  [[extend-claude-code]].
- **Scope precedence:** managed > `--agents` CLI > project (`.claude/agents/`) > user > plugin.
  Identity comes only from `name`.
- **Frontmatter:** `tools`/`disallowedTools` (denylist applied first), `model` (default
  `inherit`), `skills` (preload full content), `permissionMode`, `mcpServers`, `memory`,
  `isolation: worktree`, etc. Plugin subagents ignore `hooks`/`mcpServers`/`permissionMode`.
- **`skills:` preload is the inverse of a skill's `context: fork`** ([[skill-authoring]]) — both
  use the same system.
- **Permission inheritance:** parent `bypassPermissions`/`acceptEdits` and [[auto-mode]] override
  the subagent's own `permissionMode`.
- **Cost lever:** route to Haiku; scope an [[mcp|MCP]] server here to keep its tools out of the
  main [[context-window|context]].

## Concepts this touches
- [[subagents]] — substantially expanded (frontmatter, scope, startup)
- [[built-in-subagents]] — new page (Explore / Plan / general-purpose)
- [[skill-authoring]] — `skills:` preload ↔ `context: fork`
- [[permission-modes]] / [[auto-mode]] — permission inheritance
- [[mcp]] — scoped MCP servers; [[agent-teams]] — subagent defs reused for teammates

## Contradictions / notes
> No contradictions. **Sources** the "Explore/Plan omit CLAUDE.md + git status" claim that
> [[subagents]] and [[extend-claude-code]] had asserted, and confirms the `skills:` ↔ fork
> relationship from [[skill-authoring]].

## Pages updated on ingest
- [[index]], [[subagents]], [[built-in-subagents]], [[skill-authoring]], [[permission-modes]],
  [[mcp]], [[claude-code]]
