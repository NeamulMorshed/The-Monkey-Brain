---
title: "qmd"
type: entity
status: active
tags: [search, qmd, mcp, tooling, bm25, vector]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[qmd-readme]]"]
related: ["[[search-tooling]]", "[[mcp]]", "[[rag]]", "[[index-and-log]]"]
aliases: ["qmd tool"]
---

# qmd

An on-device search engine for markdown files (by Tobias Lütke / tobi), recommended in the
[[llm-wiki|founding doc]] as this vault's [[search-tooling|search upgrade path]]. "Mini CLI
search engine for your docs."

## Capabilities
- **Hybrid pipeline:** BM25 (SQLite FTS5) + local **vector** embeddings, fused with
  **Reciprocal Rank Fusion**, then a local **LLM reranker** re-scores the top 30. Position-aware
  blending (ranks 1–3 trust retrieval 75%, lower ranks trust the reranker).
- **Fully local** after a one-time ~2GB model download (EmbeddingGemma 300M, Qwen3-Reranker
  0.6B, Qwen3-QueryExpansion 1.7B). No cloud — suits a private brain.
- **CLI:** `qmd search` (BM25), `qmd vsearch` (vector), `qmd query` (hybrid+rerank, best);
  `qmd get` / `multi-get`; `qmd update` / `embed`. Agent flags: `--format json|files`,
  `--explain`, `-n`, `-c`.
- **[[mcp|MCP]] server:** `qmd mcp` exposes `query` / `get` / `multi_get` as native Claude
  tools (deferred by [[mcp-tool-search|Tool Search]] like any MCP server); HTTP mode for shared access.

## How it fits The Monkey Brain
The [[index-and-log|index file]] is the search engine until ~100 sources; past that, qmd is the
drop-in upgrade — the deliberate, **local** cousin of [[rag]]. Two adoption modes match
[[search-tooling]]: shell-out CLI or registered MCP server.

**Adopt when:** the index stops surfacing the right pages on a [[query-deploy|query]]. Setup:
`npm i -g @tobilu/qmd`, `qmd collection add ./wiki --name brain`, `qmd update && qmd embed`,
then either `qmd query "…" --format json` or add the MCP server config.

## Requirements
Node ≥ 22 or Bun ≥ 1.0; macOS needs Homebrew SQLite. Index at `~/.cache/qmd/index.sqlite`.

## Sources
- [[qmd-readme]]
