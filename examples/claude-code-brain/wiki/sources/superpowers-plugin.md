---
title: "Source — Superpowers (Claude Plugin)"
type: source
status: active
tags: [claude-code, plugin, tdd, debugging, skills, methodology]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Superpowers – Claude Plugin.md"
origin: "https://claude.com/plugins/superpowers"
related: ["[[superpowers]]", "[[plugins]]", "[[skills]]", "[[subagents]]"]
aliases: ["superpowers plugin docs"]
---

# Superpowers (Claude Plugin)

> **Raw source:** [Superpowers – Claude Plugin.md](../../raw-sources/Superpowers%20%E2%80%93%20Claude%20Plugin.md) · **Origin:** claude.com/plugins · **Ingested:** 2026-06-17

## TL;DR
A comprehensive [[skills]] framework [[plugins|plugin]] that teaches Claude structured
software-development methodologies: TDD, systematic debugging, brainstorming,
subagent-driven development with code review, and skill authoring.

## Key takeaways
- Enforces **disciplined practices**: red-green-refactor TDD (tests must fail first), a
  four-phase debugging method (root-cause before fixes), Socratic brainstorming before coding.
- Invoked via slash commands: `/brainstorming` (explore requirements), `/execute-plan`
  (batched implementation with review checkpoints).
- Ships a **code-reviewer [[subagents|agent]]** evaluating implementations against plans,
  standards, and architecture; triggers architectural review after **3 failed fix attempts**.
- `writing-skills` module teaches authoring/testing new skills with TDD applied to docs.
- A **methodology** plugin — contrast with the **aesthetic** [[frontend-design]] plugin;
  both demonstrate [[plugins]] bundling [[skills]] + [[subagents]].

## Concepts this touches
- [[superpowers]] — the entity page
- [[plugins]] — packaging layer
- [[skills]] — composable methodology skills
- [[subagents]] — the code-reviewer agent

## Contradictions / notes
> None. The "architectural review after 3 failed attempts" safeguard parallels Claude Code's
> own [[auto-mode]] fallback-after-3-blocks — a recurring "circuit breaker" design motif.

## Pages updated on ingest
- [[index]], [[superpowers]], [[plugins]], [[skills]], [[subagents]]
