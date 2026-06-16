---
title: "Subagents"
type: concept
status: active
tags: [claude-code, extension, subagents, context]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[subagents-guide]]"]
related: ["[[built-in-subagents]]", "[[agent-teams]]", "[[skills]]", "[[skill-authoring]]", "[[context-window]]", "[[auto-mode]]", "[[skill-vs-subagent]]", "[[subagent-vs-agent-team]]"]
aliases: ["subagent"]
---

# Subagents

Isolated workers that run their own agentic loop in a **separate [[context-window|context]]**
and return only a **summary** to the caller. The tool for context isolation and parallel,
focused tasks. Claude Code ships [[built-in-subagents]] (Explore/Plan/general-purpose); you can
define custom ones.

## What loads at launch
The agent's own system prompt (not the full Claude Code one), full content of skills in its
`skills:` field, CLAUDE.md + git status (except [[built-in-subagents|built-in Explore/Plan]]
omit both), and whatever the lead agent passes in the prompt. It does **not** inherit your
conversation history or invoked skills.

## Defining one (from the [[subagents-guide|guide]])
A markdown file with frontmatter; **the body is the system prompt**. Required: `name` +
`description` (Claude delegates on the description). Key fields: `tools`/`disallowedTools`
(denylist applied first), `model` (default `inherit`; route to Haiku to cut cost), `skills`
(preload), `permissionMode`, `mcpServers`, `memory` (persistent dir), `isolation: worktree`.
**Scope precedence:** managed > `--agents` CLI > project (`.claude/agents/`) > user > plugin.

- **Best for:** tasks that read many files, parallel work, specialized workers — your main
  conversation stays clean.
- **With [[skills]]:** preloads listed skills (`skills:` field); can discover others via the
  Skill tool. The inverse is a skill with `context: fork`, which makes the SKILL.md the
  subagent's prompt — see [[skill-authoring]].
- **Under [[auto-mode]]:** classifier checks the subagent at spawn, during run, and on return
  (its own `permissionMode` is ignored). Parent `bypassPermissions`/`acceptEdits` also override
  the subagent's `permissionMode`.
- **[[hook-events|Hook events]]:** `SubagentStart`/`SubagentStop` bracket each subagent; the
  `agent` hook handler type even spawns a subagent to verify a decision.
- **[[permission-rules|Permission control]]:** `Agent(Explore)` / `Agent(my-agent)` rules (or
  `--disallowedTools`) enable or disable specific subagents.

Compare [[skill-vs-subagent]] and [[subagent-vs-agent-team]]; scale up to [[agent-teams]] when
subagents need to talk to each other.

## Sources
- [[extend-claude-code]], [[context-window]], [[subagents-guide]]
