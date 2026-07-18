---
title: "MewVault"
type: entity
status: active
tags: [claude-code, workspace, enforcement, hooks, gates, tiers, memory, doctor]
created: 2026-07-17
updated: 2026-07-17
sources: ["[[mewvault-readme]]"]
related: ["[[hooks]]", "[[memory]]", "[[caveman]]", "[[claude-md-vs-skills-vs-hooks]]", "[[monkey-brain-vs-mewvault]]", "[[compaction]]"]
aliases: ["mew", "mewwiki"]
---

# MewVault

A **federated AI workspace for Claude Code** (github.com/mewking2099/MewVault): independent
git silos (software, design, games, knowledge), automatic budgeted context injection, and its
defining trait — **enforcement over advice**. Quality is held by OS-level [[hooks|hook]] gates
Claude cannot talk past, not by instructions it might forget.

## Capabilities
- **7 lifecycle hooks:** session-start injection + trigger routing + doctor spawn ·
  session-end auto-wrap/wiki-sync/memory-index · pre-tool-use gates · agent tracking (ledger +
  model gate) · post-tool-use activity/correction signals · pre-[[compaction|compact]]
  semantic snapshot.
- **Hard gates:** plan-approval (`plan_approved: true` before code on architecture tier),
  TDD (no source without a test), design-audit (no handoff with open P0s), secrets patterns,
  immutability (`raw/`, wiki), model routing (dispatches must name a model), UI anti-pattern
  bans.
- **3,000-token budgeted injection**, cache-aware: static first (prompt-cache hits), dynamic
  after; over budget drops whole sections, never trigger instructions.
- **Spec-driven development:** numbered acceptance criteria → human approval → tests from
  criteria → green → verified wrap → CI. Review points are product language + green checks.
- **Project tiers** (pounce / stalk / mewking) scale gate strictness to stakes.
- **Semantic memory** (SQLite-vec + Ollama via [[mcp|MCP]]) consulted before substantive
  work, plus an **instinct system**: repeated corrections become injectable rules.
- **15-check doctor**, token-health-first, runs detached each session; findings inject a
  `## Vault Health` section into the next session.

## Hard-won rule worth keeping
Never put a compressing/rewriting proxy between Claude Code and the API — mutating the prompt
prefix breaks prompt caching (~0.1× reads) and re-bills the whole conversation every turn.
**Optimize by injecting less, never by transforming the prompt.**

## How it fits The Monkey Brain
The **competitor benchmark** the v2 roadmap measures against ("differentiate, don't
imitate"). Adopted: gates, budgeted cache-aware injection, tiers, instincts, doctor,
spec-driven flow. Differentiated: compile-time [[llm-wiki-pattern|LLM wiki]] (vs. a synced
read layer), plugin portability to any repo (vs. one fixed workspace), a model *routing
policy* (vs. merely requiring a model name), and federated `.brain/` instances with upstream
promotion. Complements [[caveman]]: MewVault enforces **quality**, Caveman enforces
**economy**, the wiki compounds **knowledge** — v2 aims at all three. Full scorecard:
[[monkey-brain-vs-mewvault]].

## Sources
- [[mewvault-readme]]
