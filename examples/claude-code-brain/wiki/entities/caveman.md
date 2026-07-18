---
title: "Caveman"
type: entity
status: active
tags: [claude-code, plugin, skill, token-discipline, compression, receipts]
created: 2026-07-17
updated: 2026-07-17
sources: ["[[caveman-readme]]"]
related: ["[[plugins]]", "[[skills]]", "[[claude-md]]", "[[context-window]]", "[[mewvault]]", "[[monkey-brain-vs-mewvault]]"]
aliases: ["caveman skill", "caveman plugin"]
---

# Caveman

A token-discipline [[skills|skill]]/[[plugins|plugin]] by Julius Brussee — "*why use many token
when few do trick*." The agent answers in tight caveman-speak (~65% fewer **output** tokens on
its committed benchmarks) while code, commands, and errors stay byte-for-byte exact. Works
across Claude Code, Codex, Gemini, Cursor, Windsurf, and 30+ agents; one installer detects and
installs for all of them.

## Capabilities
- **`/caveman [lite|full|ultra|wenyan]`** — sticky per-session output-compression levels;
  on Claude Code a [[hooks|hook]] flag makes it active from message one.
- **`/caveman-compress <file>`** — permanently rewrites memory files ([[claude-md|CLAUDE.md]],
  project notes) into terse form: **~46% fewer input tokens every later session**, code and
  paths byte-preserved. Savings receipts committed in-repo.
- **`/caveman-stats`** — real token usage from the session log; lifetime savings on the
  statusline (`[CAVEMAN] ⛏ 12.4k`). Receipts, not vibes.
- **`/caveman-commit` / `/caveman-review`** — terse Conventional Commits and one-line PR
  comments (`L42: 🔴 bug: user null. Add guard.`).
- **`caveman-shrink`** — [[mcp|MCP]] middleware wrapping any MCP server to compress its tool
  descriptions; **`cavecrew-*`** subagents (~60% fewer tokens, main context lasts longer).

## Honest numbers
Its own HONEST-NUMBERS doc: only **output** tokens shrink; the skill costs ~1–1.5k input
tokens/turn, so net savings can dip negative on already-terse work. The documented real win is
**readability and speed** — cost savings are the bonus.

## How it fits The Monkey Brain
The **token-economy benchmark** of the v2 competitive triangle ([[mewvault]] = enforcement,
Caveman = economy, the [[llm-wiki-pattern]] = compounding knowledge — see
[[monkey-brain-vs-mewvault]]). The v2 roadmap adopts its mechanisms: `/brain:compress` on
memory/CLAUDE.md files, `/brain:terse` output mode, doctor-reported savings receipts, and its
**compression guard** — terseness applies to prose, never to code, commands, errors, specs, or
acceptance criteria.

## Sources
- [[caveman-readme]]
