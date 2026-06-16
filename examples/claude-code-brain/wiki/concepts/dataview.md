---
title: "Dataview"
type: concept
status: active
tags: [tooling, obsidian, query, metadata]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[obsidian-ecosystem]]", "[[schema-layer]]", "[[index-and-log]]"]
aliases: ["dataview plugin"]
---

# Dataview

An Obsidian plugin that runs queries over page **YAML frontmatter** to generate dynamic
tables and lists. The reason every page in this vault carries a consistent frontmatter block
(see the [[schema-layer|schema]] §3).

## Example queries (run inside Obsidian)
````
```dataview
TABLE status, updated FROM "wiki/concepts" SORT updated DESC
```
````
````
```dataview
LIST FROM "" WHERE status = "stale"
```
````

Useful for [[lint-test]] (find `status: stale`/`stub` pages) and for an always-fresh
alternative to the hand-maintained [[index-and-log|index]]. This vault's live
**[[dashboard]]** is built entirely from these queries.

## Sources
- [[llm-wiki]]
