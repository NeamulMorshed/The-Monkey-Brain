---
title: "Index & Log"
type: concept
status: active
tags: [architecture, navigation, methodology]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[wiki-layer]]", "[[knowledge-sdlc]]", "[[search-tooling]]"]
aliases: ["index.md", "log.md", "indexing and logging"]
---

# Index & Log

Two special files navigate the [[wiki-layer|wiki]] as it grows. They serve different purposes.

## [[index|index.md]] — content-oriented
A **catalog** of everything: each page with a link, one-line summary, optional metadata
(date, source count), organized by category. Updated on every [[ingest-compile|ingest]].
On a [[query-deploy|query]], the LLM reads the index **first** to find relevant pages, then
drills in. **The index is the search engine** at moderate scale (~100 sources / hundreds of
pages) — no embeddings needed. Beyond that, see [[search-tooling]].

## [[log|log.md]] — chronological
An **append-only** record of what happened and when — ingests, queries, lint passes. Each
entry starts with a consistent prefix so it's greppable:

```
## [2026-06-17] ingest | Article Title
```

`grep "^## \[" log.md | tail -5` gives the last 5 events. The log is the wiki's evolution
timeline and tells the LLM what's been done recently.

## Sources
- [[llm-wiki]]
