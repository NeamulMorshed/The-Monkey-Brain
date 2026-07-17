---
title: "Auto Memory"
type: concept
status: active
tags: [claude-code, context, memory]
created: 2026-06-17
updated: 2026-07-17
sources: ["[[context-window]]", "[[extend-claude-code]]", "[[mewvault-readme]]"]
related: ["[[claude-md]]", "[[context-window]]", "[[compaction]]", "[[mewvault]]", "[[caveman]]"]
aliases: ["memory", "auto memory"]
---

# Auto Memory

Persistent memory that loads into [[context-window|context]] at session start, alongside
[[claude-md|CLAUDE.md]]. Survives [[compaction]] (re-injected from disk). Inspect what loaded
with `/memory`.

Distinct from [[claude-md|CLAUDE.md]] (curated project instructions) — auto memory accrues
across sessions. Both are "always-on" context, contrast with on-demand [[skills]].

## Richer memory architectures (seen in the wild)
[[mewvault]] layers two further tiers on top of file memory ([[mewvault-readme|source]]):
- **Semantic memory** — SQLite-vec + Ollama embeddings exposed as an [[mcp|MCP]] server,
  re-indexed automatically at wiki sync; sessions are instructed to *consult memory before
  substantive work*, so past decisions resurface instead of rotting in the vault.
- **Instincts** — corrections become rules: 3+ rapid rewrites of the same file produce a
  candidate rule in `instincts/pending/`; once promoted, it injects at every session start.

Because memory files load every session, they are also the highest-leverage **compression**
target — [[caveman]]'s `/caveman-compress` cuts them ~46% permanently (see [[claude-md]]).

## Sources
- [[context-window]], [[extend-claude-code]], [[mewvault-readme]]
