---
title: "Search Tooling & Upgrade Path"
type: concept
status: active
tags: [tooling, search, scalability, qmd, upgrade-path]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]", "[[qmd-readme]]"]
related: ["[[index-and-log]]", "[[rag]]", "[[qmd]]", "[[llm-wiki-pattern]]"]
aliases: ["cli tools", "scalability"]
---

# Search Tooling & Upgrade Path

At small scale, the [[index-and-log|index file]] **is** the search engine — read it first on
every [[query-deploy|query]]. This works to ~100 sources / hundreds of pages with no
embedding infrastructure. The Monkey Brain is currently far below that threshold.

## When the index isn't enough
Add CLI tooling (a `/tools` folder):

- **[[qmd]]** — local markdown search engine: hybrid BM25 + vector + LLM re-ranking,
  on-device. Has a CLI (LLM shells out) and an [[mcp|MCP]] server (native tool). Preferred
  drop-in; concrete install/commands/config now on its [[qmd|entity page]].
- Or vibe-code a naive `search.py` (grep index + page bodies) and `lint.py` (orphans,
  broken links, stale flags). The LLM can build these as the need arises.

This is the deliberate, lightweight cousin of [[rag|RAG]] — added only **after** the wiki
outgrows the index, not before.

## Status in this vault
**Deferred** by decision (2026-06-17), but now **fully specced** — see [[qmd]] for the exact
install, indexing commands, and MCP config to use when the index stops surfacing the right
pages. The [[schema-layer|schema]] §8 records the trigger for adding it.

## Sources
- [[llm-wiki]]
