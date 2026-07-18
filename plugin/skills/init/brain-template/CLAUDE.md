---
title: "{{PROJECT}} — Brain Operating Manual"
type: schema
status: living
tags: [schema, config, monkey-brain]
created: {{DATE}}
updated: {{DATE}}
engine_version: 2.0
project: "{{PROJECT}}"
---

# 🐵 {{PROJECT}} — Monkey Brain

This `.brain/` is a **Monkey Brain instance**: a persistent, compounding knowledge base for the
**{{PROJECT}}** project, built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
This file is its **operating manual** — it loads automatically when you run `claude` from the
project root, telling me how to maintain this brain.

> **Roles.** You are the **curator** (sources, exploration, questions, approvals). I am the
> **maintainer** (summarizing, cross-referencing, filing, bookkeeping). Obsidian is the **IDE**;
> this brain is the **codebase**; ingesting a source is a **compile**.
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
├── Clippings/            # Web Clipper staging — transient, git-ignored. Never canonical.
├── raw-sources/          # IMMUTABLE inputs + assets/. Read-only. The source of truth.
├── wiki/                 # MAINTAINER-OWNED knowledge. I create & maintain everything here.
│   ├── index.md          # Content catalog — read first on any query. log.md — append-only
│   ├── dashboard.md      #   audit trail. dashboard.md — live Dataview tables.
│   ├── sources/ concepts/ entities/ syntheses/
│   └── research/         # filed research runs (web + codebase), feeding specs/decisions
├── specs/                # acceptance-criteria specs — the plan & TDD gates read these
├── projects/             # one status page per workstream (tier, phase, audit fields)
├── sessions/             # HOOK-WRITTEN: compaction snapshots, agent dispatch log
├── decisions/            # ADRs — durable "why" records distilled from work
├── instincts/            # learned correction rules: pending/ (proposed) → active/ (injected)
└── memory/               # durable project facts not derivable from the wiki
```

**Layer rules**
- **Clippings** — staging only; on ingest, copy the canonical file into `raw-sources/`.
- **raw-sources** — never edit existing files; new sources are added by the ingest flow.
- **wiki** — mine. Create, update, cross-link, keep consistent.
- **specs / projects / decisions** — co-owned records: I draft, the curator approves
  (`plan_approved`, tier changes, ADR acceptance).
- **sessions** — hook-written (snapshots, agent log); append, don't rewrite.
- **instincts** — I propose in `pending/` (3+ repeated corrections earn a rule); only the
  curator promotes to `active/`, which then injects at every session start.
- **memory** — short durable notes (decisions, constraints, "why") guiding future work.

---

## 2. Page & record types

| Type | Folder | Purpose | Template |
| --- | --- | --- | --- |
| Source summary | `wiki/sources/` | Takeaways from one raw source | `templates/source.md` |
| Concept | `wiki/concepts/` | A topic synthesized across sources | `templates/concept.md` |
| Entity | `wiki/entities/` | A named tool/product/person/system | `templates/entity.md` |
| Synthesis | `wiki/syntheses/` | Comparison / analysis / filed-back answer | `templates/synthesis.md` |
| Research | `wiki/research/` | A filed research run with findings + recommendation | `templates/research.md` |
| Spec | `specs/` | Feature spec with numbered ACs, tier, approval | `templates/spec.md` |
| Project status | `projects/` | Workstream state: tier, phase, audit | `templates/project-status.md` |
| Decision (ADR) | `decisions/` | Context → decision → consequences | `templates/decision.md` |
| Instinct | `instincts/{pending,active}/` | A learned correction rule | `templates/instinct.md` |

Slugs are **kebab-case, lowercase, no spaces**. A `[[wikilink]]` must resolve to exactly one page.

---

## 3. Frontmatter standard

Every wiki page (schema as v1):

```yaml
---
title: "Human Readable Title"
type: source | concept | entity | synthesis | research
status: stub | draft | active | stale | superseded
tags: [kebab, case]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["[[source-page]]"]      # provenance for non-source pages
related: ["[[other-page]]"]
aliases: []
---
```

Records add (specs/projects): **`tier`** `quick|feature|architecture` · **`phase`**
`research|plan|build|review|done` · **`plan_approved`** `true|false` · **`audit_score`**.
Update `updated:` whenever you touch a page. Convert relative dates to absolute. Every
non-source page **cites its sources**. Link raw source files with relative markdown links
(`../../raw-sources/...`), NOT `[[wikilinks]]`.

---

## 4. The Knowledge SDLC

### Ingest (compile) — when a source is added
1. Read it fully. 2. Copy into `raw-sources/` (canonicalize from `Clippings/` or a paste).
3. Write a `wiki/sources/` summary. 4. **Cross-link 5–10+ pages** (create/update concepts &
entities, reciprocal links, flag contradictions, mark `stale` where superseded).
5. Update `wiki/index.md`. 6. Append `wiki/log.md`. 7. Offer a commit.

### Query (deploy) — when asked a question
Read `index.md` first → drill in → answer **with citations** → **file novel answers back**
into `wiki/syntheses/` so explorations compound. Log it.

### Lint (test) — periodically
Scan for contradictions, stale claims, orphans, missing pages, broken `[[links]]`, gaps.
Fix, log, suggest new questions/sources.

### Develop (research → plan → build → review) — for feature work
**Research** files findings to `wiki/research/` → **Plan** produces `specs/<feature>.md`
with numbered ACs and a tier (curator approves architecture tiers) → **Build** works the
ACs test-first → **Review** verifies and files results; decisions distill into `decisions/`.

**Log prefixes** (`wiki/log.md`, append-only):
`ingest | query | lint | schema | feat | session | research | plan | build | review`.

---

## 5. Project tiers (gate strictness)

| Tier | Meant for | Enforcement (hooks) |
| --- | --- | --- |
| `quick` | <2h fixes, chores | advisory only — no hard gates |
| `feature` | normal feature work | **TDD gate**: new source files need a test companion (spec `tdd: false` opts out); plan may be verbal |
| `architecture` | structural change | **hard plan gate**: source writes blocked until the spec has `plan_approved: true` (+ TDD gate) |

The tier lives in the spec (and the workstream default in `projects/`). Gates degrade
gracefully: no active spec → no gate.

---

## 6. Conventions

- Link **liberally and reciprocally**; every new page needs ≥1 inbound link (no orphans).
- A `[[link]]` to a not-yet-existing page is a deliberate TODO marker — fine to leave.
- Obsidian may create 0-byte stray files at the brain root — delete them on lint.
- **Mermaid** for diagrams, **Marp** (`marp: true`) for decks, **Dataview** for live tables.
- Watch for slug collisions between a source summary and a concept of the same name.

## 7. Git

This `.brain/` is committed **with the {{PROJECT}} repo**. Commit per logical step using
the log prefixes as message conventions (`ingest: <title>`, `plan: <feature>`, …).
`Clippings/` staging and its drops stay out of git.

## 8. Engine

Scaffolded by **The Monkey Brain** engine (schema v2.0). To refresh conventions later, run
the engine's update path (`new-brain.ps1 -Update` or `/brain:init --update`) — it updates
this file, `templates/`, and missing folders, never your knowledge.

**Semantic search (optional, deferred).** `wiki/index.md` *is* the search engine until this
wiki outgrows it (~100 sources). Past that, enable on-device semantic search:

1. Install qmd — `npm i -g @tobilu/qmd` (needs Node ≥ 22).
2. Index this wiki — `qmd collection add ./wiki` then `qmd update && qmd embed`.
3. Turn it on — create an empty **`.qmd`** marker in this brain (or set `MONKEY_BRAIN_QMD=1`).

The engine then activates the **`brain-search`** MCP (qmd's `query` / `get` tools, deferred
by Tool Search) — query it before substantive work, and the session-end hook keeps the index
fresh. Until enabled it stays fully dormant (zero token cost).

---

## 9. Capability plugins (the craft layer)

Craft is done by **capability plugins** (github, frontend-design, superpowers,
security-guidance, ui-ux-pro-max, …) that `/brain:init` offers to install. The rule:
**plugins do the craft; the brain records the knowledge** — every plugin output that is a
decision, a finding, or a durable artifact is filed into a `.brain/` folder by my skills and
hooks, so the capability stays transient while its knowledge compounds here:

- design-system & UI decisions (ui-ux-pro-max / frontend-design) → `decisions/` ADRs; their
  anti-patterns seed `instincts/pending/`.
- security findings (security-guidance) → `wiki/`; open **P0s gate `/brain:wrap`**.
- reviews & PR links (github) → `wiki/syntheses/`; workstream status → `projects/`.
- PRDs (product-management) → `raw-sources/` → ingested; tracking plans → `projects/`;
  migration notes (code-modernization) → `wiki/research/`.

Plugins auto-activate by their own descriptions; the trigger-router routes **my** workflows.
When a plugin and one of mine both apply, precedence is: **deterministic trigger > domain
pack > domain skill > craft plugin > general model**.

---

## 10. Domain pipelines (products & games)

Both pipelines reuse the develop lifecycle (§4.4) — research is always filed, plans always
carry numbered ACs, approval always gates architecture-tier code — with a domain-shaped front end.

**Product:** idea → PRD → spec → build → track → wrap.
`/brain:research` files the idea to `wiki/research/` → the `product-management` plugin drafts a
PRD into `raw-sources/` → `/brain:ingest` compiles it → `/brain:plan` writes `specs/` with ACs →
`/brain:build` implements → `product-tracking` plans live in `projects/` → `/brain:wrap` closes it.
No special skill — it's the standard lifecycle composed.

**Game:** concept → GDD → prototype spec → build → playtest → balance. Run `/brain:game`.
The **GDD** (`templates/gdd.md`) captures concept, MDA, core loop, progression, art direction;
its open questions become the **prototype spec**'s ACs (`/brain:plan`, tiered); `/brain:build`
implements against an engine entity page ([[godot]] / [[unity]] / web in `wiki/entities/`);
each **playtest** is ingested as a raw source; each **balance** decision is a `decisions/` ADR.

Everything files back — the wiki-check hook blocks orphans, and `/brain:wrap` closes each phase.

See also: [[index]] · [[log]] · [[dashboard]]
