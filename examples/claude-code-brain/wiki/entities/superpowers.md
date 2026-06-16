---
title: "Superpowers (Plugin)"
type: entity
status: active
tags: [claude-code, plugin, tdd, debugging, methodology]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[superpowers-plugin]]"]
related: ["[[plugins]]", "[[skills]]", "[[subagents]]", "[[frontend-design]]"]
aliases: ["superpowers plugin"]
---

# Superpowers (Plugin)

A Claude Code [[plugins|plugin]] (claude.com/plugins/superpowers): a composable [[skills]]
framework teaching structured software-development methodologies.

## Capabilities
- **TDD** — red-green-refactor cycles where tests must fail before implementation.
- **Systematic debugging** — four-phase method requiring root-cause investigation before
  fixes; triggers architectural review after **3 failed fix attempts**.
- **Brainstorming** — Socratic sessions refining requirements before coding (`/brainstorming`).
- **Subagent-driven development** — `/execute-plan` runs batched implementation with review
  checkpoints, backed by a code-reviewer [[subagents|agent]] that evaluates work against
  plans, standards, and architecture.
- **Skill authoring** — a `writing-skills` module applying TDD to documentation.

## How it fits the ecosystem
Bundles [[skills]] + a [[subagents|subagent]] — a richer example of [[plugins]] than the
single-skill [[frontend-design]]. Its "review after 3 failures" safeguard echoes Claude
Code's [[auto-mode]] fallback-after-3-blocks — a recurring **circuit-breaker** motif.

## Sources
- [[superpowers-plugin]]
