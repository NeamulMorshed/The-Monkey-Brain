---
title: "Source — qmd README"
type: source
status: active
tags: [search, qmd, mcp, tooling, upgrade-path]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/qmd README.md"
origin: "https://github.com/tobi/qmd"
related: ["[[qmd]]", "[[search-tooling]]", "[[mcp]]"]
aliases: ["qmd readme"]
---

# qmd README

> **Raw source:** [qmd README.md](../../raw-sources/qmd%20README.md) · **Origin:** github.com/tobi/qmd · **Ingested:** 2026-06-17

## TL;DR
The reference for the tool named in the [[llm-wiki]] founding doc as the recommended
[[search-tooling|search upgrade]]: an **on-device hybrid** (BM25 + vector + LLM re-rank)
markdown search engine with both a CLI and an [[mcp|MCP]] server.

## Key takeaways
- **Three-stage pipeline:** SQLite FTS5 BM25 + local vector embeddings (chunked ~900 tok/15%
  overlap) fused with **RRF**, then a local reranker re-scores the top 30. `qmd query` is the
  best-quality hybrid mode.
- **Fully local** after a one-time ~2GB model download (3 GGUF models). No cloud — fits a
  private knowledge base.
- **Two integration paths for the LLM:** shell out to the **CLI** (`qmd query "…" --format
  json`) or register the **[[mcp|MCP]] server** (`qmd mcp`) for native `query`/`get`/`multi_get`
  tools — exactly the two modes the [[search-tooling]] page anticipated.
- **Agent-friendly:** `--format json|files`, `--explain` scoring, AST-aware chunking for code,
  context metadata returned with results.

## Concepts this touches
- [[qmd]] — new entity page for the tool
- [[search-tooling]] — the upgrade-path concept (now concretely specced)
- [[mcp]] — qmd ships an MCP server
- [[llm-wiki-pattern]] / [[index-and-log]] — what qmd replaces when the index outgrows itself

## Contradictions / notes
> No contradictions. Makes the deferred [[search-tooling|upgrade path]] **actionable** — concrete
> install/commands/MCP config are now on the [[qmd]] entity page for when this vault crosses the
> ~100-source threshold.

## Pages updated on ingest
- [[index]], [[qmd]], [[search-tooling]], [[mcp]]
