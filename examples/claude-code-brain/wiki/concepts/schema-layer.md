---
title: "Schema Layer"
type: concept
status: active
tags: [architecture, layer, config]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]", "[[extend-claude-code]]"]
related: ["[[raw-sources-layer]]", "[[wiki-layer]]", "[[claude-md]]", "[[llm-wiki-pattern]]"]
aliases: ["the schema", "CLAUDE.md schema"]
---

# Schema Layer

The third [[llm-wiki-pattern|architecture]] layer: the **configuration** that tells the LLM
how the wiki is structured, what conventions to follow, and which workflows to run. In this
vault it is `schema/CLAUDE.md` plus `schema/templates/`.

- It's **the key file** — what makes the LLM a disciplined wiki maintainer rather than a
  generic chatbot.
- **Co-evolved** by curator and LLM over time as you learn what works for your domain.
- For Claude Code, the natural home is a [[claude-md|CLAUDE.md]] file (Codex uses `AGENTS.md`).

> This vault's schema doubles as a Claude Code [[claude-md|CLAUDE.md]]: persistent,
> always-loaded operating instructions. That's the intended fusion of the
> [[llm-wiki-pattern]] with Claude Code's own extension model from [[extend-claude-code]].

## Sources
- [[llm-wiki]], [[extend-claude-code]]
