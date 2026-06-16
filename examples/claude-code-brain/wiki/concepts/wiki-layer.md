---
title: "Wiki Layer"
type: concept
status: active
tags: [architecture, layer]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[raw-sources-layer]]", "[[schema-layer]]", "[[index-and-log]]", "[[llm-wiki-pattern]]"]
aliases: ["the wiki", "wiki directory"]
---

# Wiki Layer

The second [[llm-wiki-pattern|architecture]] layer: a directory of **LLM-generated** markdown
files (`wiki/`). Summaries, [[concepts|concept pages]], [[entities|entity pages]],
comparisons, [[syntheses]], plus [[index-and-log|index.md and log.md]].

- The LLM **owns this layer entirely**: creates pages, updates them as sources arrive,
  maintains cross-references, keeps everything consistent. You read it; the LLM writes it.
- Organized (in this vault) as `sources/`, `concepts/`, `entities/`, `syntheses/`.
- It's just a git repo of markdown — version history and collaboration for free.

Contrast: [[raw-sources-layer]] (immutable inputs) and [[schema-layer]] (the rules that
govern this layer).

## Sources
- [[llm-wiki]]
