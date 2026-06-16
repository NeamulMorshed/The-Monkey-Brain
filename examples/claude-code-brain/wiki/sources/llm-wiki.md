---
title: "Source — LLM Wiki (Karpathy)"
type: source
status: active
tags: [knowledge-base, methodology, founding-doc, rag, memex]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/llm-wiki.md"
origin: "https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"
related: ["[[llm-wiki-pattern]]", "[[knowledge-sdlc]]", "[[index-and-log]]"]
aliases: ["llm wiki", "karpathy wiki"]
---

# LLM Wiki (Karpathy)

> **Raw source:** [llm-wiki.md](../../raw-sources/llm-wiki.md) · **Origin:** gist.github.com/karpathy · **Ingested:** 2026-06-17

This is the **founding document** of The Monkey Brain — the pattern this whole vault instantiates.

## TL;DR
Instead of re-retrieving from raw documents on every query (RAG), have the LLM
**incrementally build and maintain a persistent, interlinked markdown wiki** that sits
between you and your sources. Knowledge is compiled once and kept current, not re-derived.

## Key takeaways
- **RAG rediscovers; a wiki compounds.** RAG finds and re-pieces fragments every query and
  accumulates nothing. The wiki is a persistent, compounding artifact — cross-references,
  contradiction flags, and synthesis already exist before you ask. See [[llm-wiki-pattern]].
- **Division of labor.** Human = curator (sourcing, exploration, questions). LLM = programmer
  (summarizing, cross-referencing, filing, bookkeeping). Obsidian is the IDE.
- **Three-layer architecture:** immutable [[raw-sources-layer|raw sources]] →
  LLM-owned [[wiki-layer|wiki]] → co-evolved [[schema-layer|schema]].
- **Three operations** form the [[knowledge-sdlc]]: [[ingest-compile|Ingest]],
  [[query-deploy|Query]], [[lint-test|Lint]].
- **[[index-and-log|index.md + log.md]]** navigate the vault: index is content-oriented, log
  is chronological. The index *is* the search engine at moderate scale (~100 sources).
- **Why it works:** the bottleneck of knowledge bases is *maintenance bookkeeping*, which
  humans abandon and LLMs do tirelessly. Related in spirit to Vannevar Bush's **Memex** (1945).
- Optional tooling ([[search-tooling|qmd]]), [[obsidian-ecosystem|Obsidian]] niceties
  (Web Clipper, graph view, Marp, Dataview), and git versioning round it out.

## Concepts this touches
- [[llm-wiki-pattern]] — the core idea
- [[knowledge-sdlc]] — ingest / query / lint
- [[index-and-log]] — navigation files
- [[obsidian-ecosystem]] — the tooling around it
- [[search-tooling]] — qmd / scaling search

## Contradictions / notes
> None — this is the seed. Everything else is built to comply with it.

## Pages updated on ingest
- [[index]], [[llm-wiki-pattern]], [[knowledge-sdlc]], [[index-and-log]],
  [[raw-sources-layer]], [[wiki-layer]], [[schema-layer]], [[obsidian-ecosystem]],
  [[search-tooling]]
