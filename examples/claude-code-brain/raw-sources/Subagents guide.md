---
title: "Subagents guide"
source: "https://code.claude.com/docs/en/sub-agents"
author:
published:
created: 2026-06-17
description: "Create custom subagents in Claude Code: definition files, frontmatter, scopes, tools, models, skills preload, permission modes, what loads at startup."
tags:
  - "clippings"
  - "claude-code"
  - "subagents"
---
## Create custom subagents

> Captured 2026-06-17 via WebFetch of https://code.claude.com/docs/en/sub-agents for ingestion
> into The Monkey Brain. Faithful condensation; consult the live page for authoritative details.

A subagent is a specialized assistant that runs in its **own context window** with a custom
system prompt, specific tool access, and independent permissions, returning only a summary.
Use one when a side task would flood the main conversation; define a custom one when you keep
spawning the same worker. Single-session (cf. background agents / agent teams).

Benefits: preserve context, enforce tool constraints, reuse configs, specialize behavior,
control cost (route to Haiku). Claude delegates based on the subagent's **description**.

### Built-in subagents
- **Explore** — fast read-only (Haiku), denied Write/Edit; file discovery/search. Thoroughness:
  quick / medium / very thorough.
- **Plan** — read-only research during [plan mode]; model inherits.
- **general-purpose** — all tools; complex multi-step exploration + action.
- Others: `statusline-setup` (Sonnet), `claude-code-guide` (Haiku).
- **Explore and Plan skip CLAUDE.md and the parent git status** to stay fast/cheap; every other
  built-in and custom subagent loads both.
- Always registered interactively; block one via `permissions.deny` `Agent(Explore)`; deny the
  `Agent` tool to stop all delegation; `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` in headless/SDK.

### Definition files
Markdown + YAML frontmatter; **body = system prompt** (subagents get only this + basic env, not
the full Claude Code system prompt). Manage via `/agents` (effective immediately) or write files
(restart to load). `cd` inside a subagent doesn't persist between tool calls; `isolation: worktree`
gives an isolated repo copy.

### Scope & precedence (highest first)
1. Managed settings · 2. `--agents` CLI JSON (session-only) · 3. `.claude/agents/` (project,
commit) · 4. `~/.claude/agents/` (user) · 5. plugin `agents/` (lowest). Same-name → higher wins.
Identity comes only from the `name` field; scanned recursively (plugin subfolders become part of
the `plugin:sub:name` identifier). `--add-dir` does NOT load subagents.

### Frontmatter (only `name` + `description` required)
`name` (lowercase-hyphens; hooks see it as `agent_type`), `description` (when to delegate),
`tools` (allowlist; inherits all if omitted), `disallowedTools` (denylist; applied before
`tools`), `model` (`sonnet|opus|haiku|fable|<id>|inherit`, default inherit), `permissionMode`,
`maxTurns`, `skills` (preload full content), `mcpServers` (inline or by-name), `hooks`, `memory`
(`user|project|local` persistent dir), `background`, `effort`, `isolation: worktree`, `color`,
`initialPrompt`. Plugin subagents ignore `hooks`/`mcpServers`/`permissionMode` (security).

### Tools
Inherit internal + MCP tools by default. Never available even if listed: `AskUserQuestion`,
`EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `ScheduleWakeup`,
`WaitForMcpServers`. `tools`=allowlist, `disallowedTools`=denylist (applied first). For a
main-thread `--agent`, `Agent(worker, researcher)` restricts which subagent types it can spawn;
bare `Agent` = any; omitting `Agent` = none. (Task tool renamed Agent in v2.1.63; `Task(...)` aliases.)

### Model resolution order
`CLAUDE_CODE_SUBAGENT_MODEL` env → per-invocation `model` param → definition `model` frontmatter
→ main conversation model.

### Permission modes
`default|acceptEdits|auto|dontAsk|bypassPermissions|plan`. Subagents inherit the parent context
and may override — **except** parent `bypassPermissions`/`acceptEdits` take precedence, and under
parent **auto mode** the subagent inherits auto and its `permissionMode` is ignored (classifier
evaluates with the same rules).

### Skills preload (`skills`)
Injects the **full content** of listed skills at startup (domain knowledge without discovery).
Controls preload, not access — without it the subagent can still invoke skills via the Skill
tool. Can't preload `disable-model-invocation: true` skills. **Inverse** of a skill's
`context: fork` (which injects skill content into a chosen agent).

### Scoped MCP / memory
`mcpServers` inline definitions connect at subagent start, disconnect at finish; defining a
server here keeps its tools out of the main conversation's context. `memory: user|project|local`
gives a persistent directory for cross-session learning.
