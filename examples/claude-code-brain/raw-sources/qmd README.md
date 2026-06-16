---
title: "qmd README"
source: "https://github.com/tobi/qmd"
author: "Tobias Lütke (tobi)"
published:
created: 2026-06-17
description: "qmd — on-device hybrid (BM25 + vector + LLM re-rank) search engine for markdown docs, with CLI and MCP server."
tags:
  - "clippings"
  - "search"
  - "qmd"
  - "mcp"
---
## qmd — on-device markdown search engine

> Captured 2026-06-17 via WebFetch of https://github.com/tobi/qmd for ingestion into The
> Monkey Brain (to plan this vault's search upgrade path). Faithful summary; consult the repo
> for authoritative, current details.

"mini cli search engine for your docs, knowledge bases, meeting notes, whatever." Runs
**entirely on-device** — no cloud after the initial model download.

### Hybrid search pipeline
- **BM25 full-text** via SQLite FTS5 (exact phrases, boolean operators).
- **Vector semantic** — docs chunked (~900 tokens, 15% overlap) and embedded with local models;
  finds semantically similar content without keyword overlap.
- **LLM re-ranking** — top 30 hybrid candidates re-scored by a local reranker.
- **Reciprocal Rank Fusion (RRF)** combines BM25 + vector; position-aware blending weights
  retrieval scores 75% for ranks 1–3, trusting the reranker more further down.

### Install / requirements
Node ≥ 22 or Bun ≥ 1.0. `npm install -g @tobilu/qmd`, or `npx`/`bunx @tobilu/qmd`. macOS needs
Homebrew SQLite for extension support. Three GGUF models auto-download (~2GB total, cached):
EmbeddingGemma 300M (~300MB), Qwen3-Reranker 0.6B (~640MB), Qwen3-QueryExpansion 1.7B (~1.1GB).
Override embeddings via `QMD_EMBED_MODEL` (multilingual).

### CLI
- **Collections:** `qmd collection add <path> --name <name>` / `list` / `remove <name>`;
  `qmd context add qmd://<path> "<desc>"`.
- **Search:** `qmd search "q"` (BM25), `qmd vsearch "q"` (vector), `qmd query "q"` (hybrid +
  re-rank, best quality).
- **Retrieve:** `qmd get docs/file.md` / `qmd get "#abc123"` / `qmd multi-get "docs/*.md"`.
- **Index:** `qmd update` (re-index), `qmd embed` (`-f` force).
- **Options:** `-n <num>` (default 5), `-c <collection>`, `--min-score`, `--full`, `--explain`,
  `--format json|csv|md|files`.

### MCP server
`qmd mcp` exposes three tools — **query** (typed lexical/vector/hyde sub-queries via RRF +
optional re-rank), **get** (by path/docid/line ranges, fuzzy suggestions), **multi_get** (glob
or comma list). Claude Desktop config:
```json
{ "mcpServers": { "qmd": { "command": "qmd", "args": ["mcp"] } } }
```
Can run HTTP mode for shared access (avoids repeated model loading).

### SDK & storage
Node/Bun library: `createStore({ dbPath })` → `store.search({ query })`. Index lives in
`~/.cache/qmd/index.sqlite` (collections, doc metadata/content, FTS5, sqlite-vec embeddings,
cached LLM responses). AST-aware (tree-sitter) chunking for code files (.ts/.js/.py/.go/.rs).
JSON/file-list output for agents; `--explain` shows scoring; benchmarking tool included.
