---
title: "Ingest (Compile)"
type: concept
status: active
tags: [methodology, workflow, ingest]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[knowledge-sdlc]]", "[[query-deploy]]", "[[lint-test]]", "[[index-and-log]]"]
aliases: ["ingest", "compile"]
---

# Ingest (Compile)

The "compile" step of the [[knowledge-sdlc]]: turning a raw source into integrated wiki knowledge.

## Flow
1. **Read** the source in full (text first, then images separately if any).
2. **Canonicalize** into [[raw-sources-layer|raw-sources]] (copy from `Clippings/`).
3. **Discuss** takeaways with the curator (unless batch-ingesting unsupervised).
4. **Write a source-summary page** in `wiki/sources/`.
5. **Cross-link 5–10+ related pages** — create/update [[concepts]] and [[entities]], add
   reciprocal `[[wikilinks]]`, flag contradictions, set `status: stale` where superseded.
6. **Update [[index-and-log|index.md]]**.
7. **Append to [[index-and-log|log.md]]** — `## [YYYY-MM-DD] ingest | <Title>`.
8. **Commit** — `ingest: <title>`.

A single source typically touches **10–15 pages**. That bookkeeping is the entire value
proposition of the [[llm-wiki-pattern]] — near-zero cost for the LLM.

## Sources
- [[llm-wiki]]
