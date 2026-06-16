---
title: "LLM Wiki Pattern"
type: concept
status: active
tags: [methodology, knowledge-base, founding]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[knowledge-sdlc]]", "[[raw-sources-layer]]", "[[wiki-layer]]", "[[schema-layer]]", "[[index-and-log]]"]
aliases: ["the pattern", "compounding wiki"]
---

# LLM Wiki Pattern

The core idea The Monkey Brain is built on: instead of retrieving from raw documents at
query time ([[rag|RAG]]), the LLM **incrementally builds and maintains a persistent,
interlinked markdown wiki** between you and your sources. Knowledge is **compiled once and
kept current**, not re-derived on every question.

## Why it's different from RAG
[[rag|RAG]] rediscovers knowledge from scratch every query and accumulates nothing. The
wiki is a **persistent, compounding artifact**: cross-references already exist,
contradictions are already flagged, the synthesis already reflects everything read. It gets
richer with every source added and every question asked.

## Division of labor
- **Human = curator:** sourcing, exploration, asking good questions, deciding what matters.
- **LLM = programmer:** summarizing, cross-referencing, filing, bookkeeping — the
  maintenance humans abandon.
- **Obsidian = IDE**, the wiki = **codebase**, ingest = **compile**.

## The three layers
[[raw-sources-layer]] (immutable) → [[wiki-layer]] (LLM-owned) → [[schema-layer]] (co-evolved config).

## Why it works
The bottleneck of knowledge bases is **maintenance bookkeeping**, not reading or thinking.
Humans abandon wikis because maintenance grows faster than value. LLMs don't get bored and
can touch 15 files in one pass, so maintenance cost approaches zero. Kin to Vannevar Bush's
**Memex** (1945): a private, curated store where the *connections* between documents are as
valuable as the documents — Bush couldn't solve who maintains it; the LLM does.

## How it relates
- [[knowledge-sdlc]] — the operations (ingest/query/lint) that run the pattern.
- [[index-and-log]] — the navigation substrate that makes it scale without embeddings.
- [[obsidian-ecosystem]] — the tools around it.

## Sources
- [[llm-wiki]]
