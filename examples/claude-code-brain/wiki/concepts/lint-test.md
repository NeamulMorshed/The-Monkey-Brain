---
title: "Lint (Test)"
type: concept
status: active
tags: [methodology, workflow, lint, maintenance]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[knowledge-sdlc]]", "[[ingest-compile]]", "[[query-deploy]]"]
aliases: ["lint", "test", "health-check"]
---

# Lint (Test)

The "test" step of the [[knowledge-sdlc]]: periodically health-checking the wiki so it stays
trustworthy as it grows.

## What to scan for ("bugs")
- **Contradictions** between pages → reconcile or flag.
- **Stale claims** a newer source superseded → update + forward-link; set `status: stale|superseded`.
- **Orphan pages** (no inbound links) → wire into the graph.
- **Missing pages** — concepts mentioned often but lacking a page → create stubs.
- **Missing cross-references** — pages that should link but don't.
- **Broken links** — `[[wikilinks]]` with no matching file.
- **Data gaps** worth a web search or a new source.

Lint is also where the LLM **suggests new questions and sources** to the curator. Log it
`## [YYYY-MM-DD] lint | <scope>`.

## First lint pass
See [[index-and-log|log.md]] for the 2026-06-17 baseline lint of this vault.

## Sources
- [[llm-wiki]]
