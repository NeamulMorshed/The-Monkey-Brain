---
title: "Source — Caveman README"
type: source
status: active
tags: [caveman, token-discipline, compression, skills, plugins, receipts]
created: 2026-07-17
updated: 2026-07-17
raw: "../../raw-sources/Caveman README.md"
origin: "https://github.com/JuliusBrussee/caveman"
related: ["[[caveman]]", "[[skills]]", "[[claude-md]]", "[[context-window]]", "[[monkey-brain-vs-mewvault]]"]
aliases: ["caveman readme"]
---

# Caveman README

> **Raw source:** [Caveman README.md](../../raw-sources/Caveman%20README.md) · **Origin:** github.com/JuliusBrussee/caveman · **Ingested:** 2026-07-17

## TL;DR
A [[skills|skill]]/[[plugins|plugin]] for Claude Code and 30+ other agents that compresses the
agent's **output style** — "same answers, 65% fewer output tokens" — while keeping code,
commands, and errors **byte-for-byte exact**. Ingested as the **token-economy benchmark** for
the Monkey Brain v2 roadmap (see [[monkey-brain-vs-mewvault]]).

## Key takeaways
- **Shrinks the mouth, not the brain.** Compresses what the agent *says*, never what it knows.
  Six levels (`lite` / `full` (default) / `ultra` / `wenyan`), switched with `/caveman <level>`,
  sticky per session. Keeps the user's language — compresses style, never translates.
- **`/caveman-compress <file>`** rewrites memory files ([[claude-md|CLAUDE.md]] and friends)
  into terse form: **~46% fewer input tokens every subsequent session** — a *permanent* input
  saving, with a receipts table committed in the repo. Code, URLs, paths byte-preserved.
- **Honest-numbers warning (its own docs):** the headline 65% is **output tokens only**. Input
  and reasoning tokens are untouched, and the skill itself adds **~1–1.5k input tokens per
  turn** — whole-session savings run smaller and can go net-negative on already-terse
  workloads. The real win is readability and speed; cost is the bonus.
- **Receipts culture:** `/caveman-stats` reads the real session log → lifetime savings on the
  Claude Code statusline; benchmarks are committed and reproducible (avg 65%, range 22–87%
  across 10 tasks). Claims come with measurements, not vibes.
- **Mechanism:** install drops a skill file; on Claude Code a [[hooks|hook]] writes a session
  flag so terseness is on from message one. `/caveman-commit` (≤50-char Conventional Commits)
  and `/caveman-review` (one-line PR comments) extend the discipline to git.
- **`caveman-shrink`** — [[mcp|MCP]] middleware that wraps any MCP server and compresses its
  tool descriptions (input-side savings on tool surfaces).
- **Ecosystem:** caveman-code (whole terminal agent, ~2× fewer tokens than Codex), cavemem
  (cross-session memory), cavekit (spec-driven build loop), cavegemma (compression fine-tuned
  into weights). "Agent do more with less."
- Cites a March 2026 paper (*Brevity Constraints Reverse Performance Hierarchies*, 31 models):
  constraining large models to brief answers **improved accuracy ~26 points** on some
  benchmarks — short isn't just cheaper.
- Privacy: no telemetry, no backend; the skill is a prompt, hooks are local scripts.

## Concepts this touches
- [[skills]] / [[plugins]] — a cross-agent skill distributed via marketplace (`claude plugin
  marketplace add JuliusBrussee/caveman`)
- [[claude-md]] + [[memory]] — the compress-memory-files play: permanent input-token savings
- [[context-window]] — output vs input vs reasoning tokens; per-turn skill overhead; the
  honest accounting of where savings actually land
- [[mcp]] — caveman-shrink compresses MCP tool descriptions
- [[hooks]] — session flag hook for zero-command activation

## Contradictions / notes
> ⚠️ Nuance, not contradiction: the headline "65%" is **output-only**; net session savings are
> smaller and can be negative on terse workloads (per its own HONEST-NUMBERS doc). The Monkey
> Brain v2 roadmap adopts the *mechanisms* — compress-memory-files (`/brain:compress`), terse
> output mode (`/brain:terse`), stats receipts (`/brain:doctor`), and the **compression guard**
> (never compress code/commands/errors/specs) — not the headline number.

## Pages updated on ingest
- [[index]], [[caveman]], [[skills]], [[plugins]], [[claude-md]], [[context-window]], [[entities]]
