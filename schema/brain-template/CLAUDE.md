---
title: "{{PROJECT}} — Brain Operating Manual"
type: schema
status: living
tags: [schema, config, monkey-brain]
created: {{DATE}}
updated: {{DATE}}
engine_version: 1.0
project: "{{PROJECT}}"
---

# 🐵 {{PROJECT}} — Monkey Brain

This `.brain/` is a **Monkey Brain instance**: a persistent, compounding knowledge base for the
**{{PROJECT}}** project, built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
This file is its **operating manual** — it loads automatically when you run `claude` from the
project root, telling me how to maintain this brain.

> **Roles.** You are the **curator** (sources, exploration, questions). I am the **maintainer**
> (summarizing, cross-referencing, filing, bookkeeping). Obsidian is the **IDE**; this brain is
> the **codebase**; ingesting a source is a **compile**.
>
> I own `wiki/` entirely. I never modify `raw-sources/`. We co-evolve this file over time.
>
> **Scope & isolation:** this brain is about **{{PROJECT}} only**. Its knowledge, log, and
> memories are independent from every other project's brain. Don't pull in unrelated context.

---

## 1. Architecture

```
.brain/
├── CLAUDE.md             # ← this operating manual (loads with `claude` at project root)
├── raw-sources/          # IMMUTABLE inputs. Read-only. The source of truth.
│   └── assets/           # Local images/attachments.
├── wiki/                 # MAINTAINER-OWNED. I create & maintain everything here.
│   ├── index.md          # Content catalog — navigation hub. Updated every ingest.
│   ├── log.md            # Chronological, append-only audit trail.
│   ├── dashboard.md      # Live Dataview tables (health, hubs, orphans).
│   ├── sources/          # One summary page per ingested raw source.
│   ├── concepts/         # Topic / concept pages (the synthesis layer).
│   ├── entities/         # Named things: tools, products, people, systems.
│   └── syntheses/        # Cross-cutting analyses, comparisons, filed-back answers.
└── memory/               # Durable project facts/decisions not derivable from the wiki.
```

**Layer rules**
- **raw-sources** — never edit. On ingest, copy the canonical file here so the layer is self-contained.
- **wiki** — I own it. Create, update, cross-link, keep consistent.
- **memory** — short durable notes (decisions, constraints, "why") that guide future work.

---

## 2. Page types

| Type | Folder | Purpose | Naming |
| --- | --- | --- | --- |
| Source summary | `wiki/sources/` | Takeaways from one raw source + what it touched | matches source slug |
| Concept | `wiki/concepts/` | A topic synthesized across sources | kebab-case noun |
| Entity | `wiki/entities/` | A named tool/product/person/system | kebab-case proper noun |
| Synthesis | `wiki/syntheses/` | Comparison / analysis / filed-back query | descriptive slug |
| Index | `wiki/index.md` | Catalog of everything | fixed |
| Log | `wiki/log.md` | Chronological audit | fixed |

Slugs are **kebab-case, lowercase, no spaces**. A `[[wikilink]]` must resolve to exactly one page.

---

## 3. Frontmatter standard (every wiki page)

```yaml
---
title: "Human Readable Title"
type: source | concept | entity | synthesis
status: stub | draft | active | stale | superseded
tags: [kebab, case]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["[[source-page]]"]      # provenance for concept/entity/synthesis
related: ["[[other-page]]"]       # outbound conceptual links
aliases: []                       # alternate names for link resolution
---
```

Update `updated:` whenever you touch a page. Convert relative dates ("today") to absolute.
Every non-source page must **cite its sources**. Link **raw source files** with relative
markdown links (`../../raw-sources/...`), NOT `[[wikilinks]]`.

---

## 4. The Knowledge SDLC

### Ingest (compile) — when a source is added
1. Read it fully. 2. Copy into `raw-sources/`. 3. Write a `wiki/sources/` summary.
4. **Cross-link 5–10+ pages** (create/update concepts & entities, reciprocal links, flag
contradictions, set `status: stale` where superseded). 5. Update `wiki/index.md`.
6. Append `wiki/log.md` (`## [YYYY-MM-DD] ingest | <Title>`). 7. Offer a commit.

### Query (deploy) — when asked a question
Read `index.md` first → drill in → answer **with citations** → **file novel answers back** into
`wiki/syntheses/` so explorations compound. Log it (`## [YYYY-MM-DD] query | <question>`).

### Lint (test) — periodically
Scan for contradictions, stale claims, orphans (no inbound links), missing pages, broken
`[[links]]`, gaps. Fix, then log (`## [YYYY-MM-DD] lint | <scope>`). Suggest new questions/sources.

---

## 5. Conventions
- Link **liberally and reciprocally**; every new page needs ≥1 inbound link (no orphans).
- A `[[link]]` to a not-yet-existing page is a deliberate TODO marker — fine to leave.
- Obsidian may create 0-byte stray files from unresolved links at the brain root — delete them on lint.
- Use **Mermaid** for diagrams, **Marp** (`marp: true`) for decks, **Dataview** for live tables
  (the `dashboard.md` already does this).
- Watch for slug collisions between a source-summary and a concept of the same name.

## 6. Git
This `.brain/` is committed **with the {{PROJECT}} project repo**. Commit per logical step:
`ingest: <title>`, `query: <q>`, `lint: <scope>`, `schema: <change>`.

## 7. Engine
This brain was scaffolded by **The Monkey Brain** engine. To refresh conventions later, re-run
the engine's `bootstrap/new-brain` update path — it updates this file/templates, never your `wiki/`.

See also: [[index]] · [[log]] · [[dashboard]]
