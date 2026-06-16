---
title: "Obsidian Ecosystem"
type: concept
status: active
tags: [tooling, obsidian, dataview, marp, mermaid]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[llm-wiki]]"]
related: ["[[llm-wiki-pattern]]", "[[raw-sources-layer]]", "[[dataview]]", "[[index-and-log]]"]
aliases: ["obsidian", "tips and tricks"]
---

# Obsidian Ecosystem

The tooling around the [[llm-wiki-pattern|wiki]]. Obsidian is the **IDE** the curator browses
while the LLM writes.

- **Web Clipper** — browser extension converting web articles to markdown; feeds `Clippings/`
  → [[raw-sources-layer|raw-sources]]. (This vault's 6 seed sources arrived this way.)
- **Local attachments** — set Settings → Files & links → Attachment folder to
  `raw-sources/assets/`, bind "Download attachments for current file" to a hotkey, so images
  live on disk and the LLM can view them. (LLMs can't read inline-image markdown in one pass —
  read text first, view images separately.)
- **Graph view** — the best way to see the wiki's shape: hubs vs orphans, what connects to
  what. Central to the [[lint-test]] pass.
- **[[dataview|Dataview]]** — queries page frontmatter into dynamic tables/lists. Relies on
  the YAML standard in the [[schema-layer|schema]].
- **Marp** — markdown slide decks generated from wiki content (`marp: true` frontmatter).
- **Mermaid.js** — diagrams inline in pages (see [[knowledge-sdlc]] for an example).
- **Git** — the wiki is just a git repo of markdown: version history, branching, collaboration.

## Sources
- [[llm-wiki]]
