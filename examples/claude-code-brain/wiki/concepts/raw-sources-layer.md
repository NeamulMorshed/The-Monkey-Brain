---
title: "Raw Sources Layer"
type: concept
status: active
tags: [architecture, layer]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[wiki-layer]]", "[[schema-layer]]", "[[llm-wiki-pattern]]", "[[obsidian-ecosystem]]"]
aliases: ["raw sources", "raw layer"]
---

# Raw Sources Layer

The first of the three [[llm-wiki-pattern|architecture]] layers: your curated collection of
**immutable** source documents (`raw-sources/`). Articles, papers, images, data files.

- The LLM **reads from but never modifies** this layer — it is the source of truth.
- New clippings land in `Clippings/` (via [[obsidian-ecosystem|Web Clipper]]) and are copied
  here on [[ingest-compile|ingest]] so the immutable layer is self-contained.
- Local images go in `raw-sources/assets/` so the LLM can view them directly.

Contrast: [[wiki-layer]] (mutable, LLM-owned) and [[schema-layer]] (config).

## Sources
- [[llm-wiki]]
