---
title: "Extension Feature Comparison — CLAUDE.md vs Skills vs Hooks (and friends)"
type: synthesis
status: active
tags: [claude-code, comparison, extensions, decision-guide]
created: 2026-06-17
updated: 2026-07-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[mewvault-readme]]"]
related: ["[[claude-md]]", "[[skills]]", "[[hooks]]", "[[subagents]]", "[[agent-teams]]", "[[mcp]]", "[[rules]]"]
aliases: ["skill-vs-subagent", "claude-md-vs-skills", "claude-md-vs-rules-vs-skills", "subagent-vs-agent-team", "mcp-vs-skill", "hook-vs-skill", "extension comparison"]
question: "When should I use CLAUDE.md vs a skill vs a hook (and the other extension features)?"
---

# Extension Feature Comparison

A filed-back decision guide consolidating every pairwise comparison from
[[extend-claude-code]]. The one-line rule: **CLAUDE.md = always-on context, Skills = on-demand
knowledge/workflows, Hooks = deterministic automation, Subagents = context isolation, MCP =
external connections.**

> This page is the canonical target for the comparison aliases (`skill-vs-subagent`,
> `mcp-vs-skill`, etc.) referenced across the [[concepts]].

## Master decision table
| Feature | What it does | Loads | Determinism | Best for |
| --- | --- | --- | --- | --- |
| [[claude-md]] | Always-on context | Every session | Interpreted | "Always do X" rules, conventions |
| [[rules]] | Scoped always-on context | Every session / on matching files | Interpreted | Language/dir-specific guidelines |
| [[skills]] | Reusable knowledge & `/<name>` workflows | On demand | Interpreted (varies) | Reference docs, repeatable tasks |
| [[hooks]] | Script/HTTP/prompt/subagent on events | On trigger | **Guaranteed** | Linting, guardrails, logging, notifications |
| [[subagents]] | Isolated worker → summary | When spawned | — | Many-file reads, parallel focused work |
| [[agent-teams]] | Independent sessions, peer messaging | When spawned | — | Competing hypotheses, parallel review |
| [[mcp]] | External services/tools | Session start (names) | — | DB, Slack, browser control |

## The pairwise comparisons

### CLAUDE.md vs Skill (`claude-md-vs-skills`)
Both store instructions. **CLAUDE.md** loads every session, can't trigger workflows — use for
"always know this." **Skill** loads on demand, can trigger `/<name>` — use for reference
material or workflows needed *sometimes*. Rule of thumb: keep CLAUDE.md < 200 lines; overflow
→ skills or [[rules]].

### CLAUDE.md vs Rules vs Skills (`claude-md-vs-rules-vs-skills`)
[[rules|Rules]] keep CLAUDE.md focused: path-scoped rules load only when matching files are
opened, saving [[context-window|context]]. CLAUDE.md = core every-session conventions; Rules =
scoped guidelines; Skills = sometimes-needed content.

### Skill vs Subagent (`skill-vs-subagent`)
**Skills** are reusable *content* loaded into any context (adds to your window). **Subagents**
are isolated *workers* with their own window; only a summary returns. They combine: a subagent
preloads skills via `skills:`; a skill can fork into isolated context with `context: fork`.

### Subagent vs Agent Team (`subagent-vs-agent-team`)
[[subagents|Subagents]] run *inside* your session and report back to the main agent only
(lower token cost). [[agent-teams|Agent teams]] are fully independent sessions that message
each other and self-coordinate via a shared task list (higher cost). Transition to teams when
parallel subagents hit context limits or need to talk to each other.

### MCP vs Skill (`mcp-vs-skill`)
[[mcp|MCP]] gives Claude purpose-built *tools* for an external system (connection + auth
handled by the server). [[skills|Skills]] give *knowledge* of how to use those tools well.
Example: MCP connects a DB; a skill documents the schema and query patterns.

### Hook vs Skill (`hook-vs-skill`)
A [[hooks|hook]] fires deterministically on a lifecycle event and needs no reasoning (format
on save, reject `rm -rf /`). A [[skills|skill]] is interpreted by Claude (a `/release`
checklist). **Guardrails belong in hooks** — a prompt instruction is a request, a hook is
enforcement. Hook *output* lands in context as text Claude reads.

> **Validated in production:** [[mewvault]] builds a whole workspace on exactly this rule —
> seven lifecycle hooks and OS-level gates (plan-approval, TDD, secrets, immutability),
> because CLAUDE.md sentences are requests Claude can forget while `PreToolUse` blocks cannot
> be talked past ([[mewvault-readme|source]]).

## How they combine
- **Skill + MCP** — MCP connects; skill teaches usage.
- **Skill + Subagent** — `/audit` skill spawns security/perf/style subagents.
- **CLAUDE.md + Skills** — always-on rules + on-demand reference.
- **Hook + MCP** — post-edit hook posts a Slack notification.

## Sources
- [[extend-claude-code]], [[context-window]], [[mewvault-readme]]
