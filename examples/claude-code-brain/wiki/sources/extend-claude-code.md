---
title: "Source — Extend Claude Code"
type: source
status: active
tags: [claude-code, extensions, skills, hooks, mcp, plugins, subagents]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Extend Claude Code.md"
origin: "https://code.claude.com/docs/en/features-overview"
related: ["[[claude-code]]", "[[skills]]", "[[hooks]]", "[[mcp]]", "[[plugins]]", "[[subagents]]"]
aliases: ["features overview", "extend claude code docs"]
---

# Extend Claude Code

> **Raw source:** [Extend Claude Code.md](../../raw-sources/Extend%20Claude%20Code.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The map of Claude Code's extension layer: when to use [[claude-md|CLAUDE.md]], [[skills]],
[[subagents]], [[agent-teams]], [[mcp]], [[hooks]], and [[plugins]] — how they differ, how
they layer, and how they combine.

## Key takeaways
- **Each extension plugs into a different part of the agentic loop:**
  - [[claude-md]] — always-on persistent context ("always do X").
  - [[skills]] — on-demand reusable knowledge & invocable `/<name>` workflows (most flexible).
  - [[subagents]] — isolated context workers returning summaries.
  - [[agent-teams]] — independent sessions that message each other (experimental).
  - [[mcp]] — connect to external services/tools.
  - [[hooks]] — deterministic automation on lifecycle events.
  - [[plugins]] — the packaging/distribution layer bundling the above.
- **Build over time, by trigger:** wrong convention twice → CLAUDE.md; repeated prompt →
  skill; uncaptured browser data → MCP; output flood → subagent; "every time" → hook;
  second repo needs it → plugin.
- **Key distinctions:** [[skill-vs-subagent]], [[claude-md-vs-skills]],
  [[claude-md-vs-rules-vs-skills]], [[subagent-vs-agent-team]], [[mcp-vs-skill]],
  [[hook-vs-skill]] (see filed [[syntheses]]).
- **Guardrails belong in [[hooks]], not prompts** — CLAUDE.md "never edit .env" is a request;
  a `PreToolUse` hook is enforcement.
- **Layering rules:** CLAUDE.md is additive; skills/subagents/MCP override by name with a
  priority order; hooks merge (all fire).
- **[[context-window|Context cost]] by feature** — CLAUDE.md every request; skills cheap until
  used; MCP cheap until a tool is called; subagents isolated; hooks ~zero.

## Concepts this touches
- [[skills]], [[hooks]], [[mcp]], [[subagents]], [[agent-teams]], [[plugins]], [[claude-md]],
  [[rules]], [[code-intelligence]], [[context-window]]
- Comparison syntheses: [[claude-md-vs-skills-vs-hooks]]

## Contradictions / notes
> None. This source is the connective tissue tying the other Claude Code concept pages
> together; it justified most concept-page creation in this ingest batch.

## Pages updated on ingest
- [[index]], [[skills]], [[hooks]], [[mcp]], [[subagents]], [[agent-teams]], [[plugins]],
  [[claude-md]], [[rules]], [[code-intelligence]], [[claude-code]],
  [[claude-md-vs-skills-vs-hooks]]
