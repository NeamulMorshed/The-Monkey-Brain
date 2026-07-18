---
title: "Schema — The Monkey Brain"
type: schema
status: living
tags: [schema, config, conventions]
created: 2026-06-17
updated: 2026-07-18
version: 2.0
---

# 🐵 The Monkey Brain — Schema & Operating Manual

This is the **canonical operating manual** for The Monkey Brain — a persistent, compounding
knowledge base built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
It defines how the wiki is structured, what conventions to follow, and which workflows to run
when ingesting sources, answering queries, or linting.

> **Engine note.** This repo is the **engine** (the reusable tool); see the top-level
> [README](../README.md). Real project knowledge lives in per-project `.brain/` **instances**
> scaffolded by `bootstrap/new-brain.ps1` — or, in v2, by the **`brain` plugin**'s `/brain:init`
> (which also enforces these conventions with hooks; see [`plugin/README.md`](../plugin/README.md)).
> Each instance carries its own copy of this manual (from `schema/brain-template/CLAUDE.md`);
> this file is the master they derive from. For a complete worked brain built with these
> conventions, see [`examples/claude-code-brain/`](../examples/claude-code-brain/).

> **Roles.** The human is the **curator** (sources, exploration, questions). The LLM is
> the **programmer** (summarizing, cross-referencing, filing, bookkeeping). Obsidian is
> the **IDE**; this wiki is the **codebase**; ingesting a source is a **compile**.
>
> You (the LLM) own `/wiki` entirely. You never modify `/raw-sources`. You and the
> curator co-evolve `/schema` over time.

---

## 1. Architecture (three layers)

```
The-Monkey-Brain/
├── raw-sources/          # IMMUTABLE inputs. Read-only. The source of truth.
│   └── assets/           # Local images/attachments referenced by sources.
├── wiki/                 # LLM-OWNED codebase. You create & maintain everything here.
│   ├── index.md          # Content catalog — navigation hub. Updated every ingest.
│   ├── log.md            # Chronological, append-only audit trail.
│   ├── sources/          # One summary page per ingested raw source.
│   ├── concepts/         # Topic / concept pages (the synthesis layer).
│   ├── entities/         # Named things: tools, plugins, products, people.
│   ├── syntheses/        # Cross-cutting analyses, comparisons, query results filed back.
│   └── research/         # v2 ★ filed research runs (web + codebase) feeding specs/decisions.
├── schema/               # CONFIG. This file + page templates. Co-evolved with curator.
│   ├── CLAUDE.md         # ← you are here
│   └── templates/        # Frontmatter/page skeletons for each page type.
└── Clippings/            # Obsidian Web Clipper drop zone (staging before raw-sources).
```

**Schema v2 record layers** (per-project `.brain/` instances add, beside `wiki/`):

```
specs/          # acceptance-criteria specs — the plan & TDD gates read these
projects/       # one status page per workstream: tier, phase, audit fields
sessions/       # hook-written: compaction snapshots, agent dispatch log
decisions/      # ADRs — durable "why" records distilled from work
instincts/      # learned correction rules: pending/ (proposed) → active/ (injected)
```

**Layer rules**

- **raw-sources** — Never edit. New clippings land in `Clippings/`; on ingest, copy the
  canonical file into `raw-sources/` so the immutable layer is self-contained.
- **wiki** — You own it. Create, update, cross-link, keep consistent.
- **schema** — Update deliberately, with the curator, and bump `version` + `updated`.
- **specs / projects / decisions** — co-owned records: the LLM drafts, the curator approves
  (tier changes, `plan_approved`, ADR acceptance).
- **sessions** — hook-written; append, never rewrite.
- **instincts** — the LLM proposes in `pending/` (3+ repeated corrections earn a rule);
  only the curator promotes to `active/`, which then injects at every session start.

---

## 2. Page types & where they live

| Type | Folder | Purpose | Naming |
| --- | --- | --- | --- |
| Source summary | `wiki/sources/` | Distilled takeaways from one raw source + what it touched | matches source slug, e.g. `permission-modes.md` |
| Concept | `wiki/concepts/` | A topic synthesized across sources | kebab-case noun, e.g. `context-window.md` |
| Entity | `wiki/entities/` | A named tool/product/plugin/person | kebab-case proper noun, e.g. `superpowers.md` |
| Synthesis | `wiki/syntheses/` | Comparison / analysis / filed-back query | descriptive, e.g. `claude-md-vs-skills-vs-hooks.md` |
| Research ★ | `wiki/research/` | A filed research run: question → findings → recommendation | descriptive, e.g. `auth-provider-options.md` |
| Index | `wiki/index.md` | Catalog of everything | fixed |
| Log | `wiki/log.md` | Chronological audit | fixed |

**v2 records** (instances; templates ship in `templates/`): Spec (`specs/`, numbered ACs +
tier + approval) · Project status (`projects/`, one per workstream) · Decision/ADR
(`decisions/`) · Instinct (`instincts/pending|active/`). Same kebab-case slugs.

**Slugs are kebab-case, lowercase, no spaces.** A wikilink `[[context-window]]` must
resolve to exactly one page. Page filename == slug == link target.

---

## 3. Frontmatter standard (every wiki page)

Every page carries YAML frontmatter so [Dataview](../wiki/concepts/dataview.md) can query it.

```yaml
---
title: "Human Readable Title"
type: source | concept | entity | synthesis   # one of these
status: stub | draft | active | stale | superseded
tags: [kebab, case, topical]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["[[llm-wiki]]", "[[permission-modes]]"]   # provenance for concept/entity/synthesis
related: ["[[skills]]", "[[hooks]]"]                # outbound conceptual links
aliases: []                                         # alternate names, for link resolution
---
```

- `status` lifecycle: `stub` → `draft` → `active`. Mark `stale` when a newer source
  likely supersedes a claim; `superseded` when confirmed and replaced (keep the page,
  link forward to the replacement).
- `sources` is **provenance** — every non-source page must cite which raw sources back it.
- Always update `updated:` when you touch a page. Never backdate `created:`.
- Convert relative dates in sources ("today", "last week") to **absolute** dates.
- **v2 record fields** (specs/projects): `tier: quick|feature|architecture` ·
  `phase: research|plan|build|review|done` · `plan_approved: true|false` (curator-set;
  opens the architecture source gate) · `audit_score` · `tdd: false` (opts a spec out of
  the TDD gate).

---

## 4. The Knowledge SDLC

### 4.1 Ingest (Compile)

When a new source is added:

1. **Read** the raw source in full. If it references local images, read text first, then
   view images separately (LLMs can't read inline-image markdown in one pass).
2. **Stage → canonicalize.** Ensure the file exists in `raw-sources/` (copy from `Clippings/`).
3. **Discuss** key takeaways with the curator (unless batch-ingesting unsupervised).
4. **Write a source-summary page** in `wiki/sources/` using the source template.
5. **Compile cross-links — touch 5–10+ related wiki pages.** Create or update concept and
   entity pages the source informs. Add reciprocal `[[wikilinks]]`. Flag contradictions
   with older claims inline (`> ⚠️ Contradiction: …`) and set `status: stale` where needed.
6. **Update `index.md`** — add/refresh the entry under the right category.
7. **Append to `log.md`** — one entry, prefixed `## [YYYY-MM-DD] ingest | <Title>`.
8. **Commit** with a message like `ingest: <source title>` (see §6).

> A single source typically touches **10–15 pages**. That bookkeeping is the whole point —
> it's near-zero cost for the LLM and is what keeps the wiki alive.

### 4.2 Query (Deploy)

1. Read `index.md` first to locate relevant pages, then drill in.
2. Synthesize an answer **with citations** to wiki pages (and through them, raw sources).
3. Output form fits the question: prose, a comparison table, a Mermaid diagram, a Marp deck.
4. **File good answers back.** A novel comparison, analysis, or discovered connection
   becomes a new `wiki/syntheses/` page (and gets indexed + logged) so explorations compound.
   Log it `## [YYYY-MM-DD] query | <question>` and note any page filed back.

### 4.3 Lint (Test)

Periodically health-check the wiki. Scan for:

- **Contradictions** between pages → reconcile or flag, set `status`.
- **Stale claims** a newer source superseded → update + forward-link.
- **Orphan pages** (no inbound links) → wire them into the graph or justify.
- **Missing pages** — concepts mentioned a lot but lacking their own page → create stubs.
- **Missing cross-references** — pages that should link but don't.
- **Broken links** — `[[wikilinks]]` with no matching file.
- **Data gaps** worth a web search or a new source.

Log it `## [YYYY-MM-DD] lint | <scope>` with findings + fixes. Lint is also where you
**suggest new questions and sources** to the curator.

### 4.4 Develop (Research → Plan → Build → Review) — v2, for feature work

1. **Research** — investigate (web + codebase), file findings to `wiki/research/` with
   sources and a recommendation. Log `research | <topic>`.
2. **Plan** — produce `specs/<feature>.md` with **numbered acceptance criteria** (AC-1,
   AC-2…) and a **tier**; architecture tiers need the curator's `plan_approved: true`
   before source code may be written. Log `plan | <feature>`.
3. **Build** — work the ACs test-first; the TDD gate (feature+ tiers) blocks new source
   files that have no test companion. Log `build | <feature>`.
4. **Review** — verify every AC, run checks, file findings back (wiki page / ADR);
   decisions distill into `decisions/`. Log `review | <feature>`.

**Project tiers** (gate strictness, read by the enforcement hooks):

| Tier | Meant for | Enforcement |
| --- | --- | --- |
| `quick` | <2h fixes, chores | advisory only |
| `feature` | normal feature work | TDD gate blocks new source files without a test (spec `tdd: false` opts out); plan may be verbal |
| `architecture` | structural change | hard plan gate (`plan_approved: true` required) + TDD gate |

**All log prefixes:**
`ingest | query | lint | schema | feat | session | research | plan | build | review`.

---

## 5. Linking & graph conventions

- Use Obsidian `[[wikilinks]]` (target = slug, no `.md`). Add display text with `[[slug|Label]]`.
- **Link liberally and reciprocally** — if A links B because they're related, B should link A.
- Every new page must have **≥1 inbound link** before you finish the ingest (no orphans).
- Hub pages (index, big concepts) are expected to be high-degree — that's healthy.
- A `[[link]]` to a page that doesn't exist yet is a deliberate **TODO marker**, fine to
  leave; it signals a page worth creating. Track recurring ones in the lint pass.

---

## 6. Git integration

The vault is a git repo of markdown. Treat every knowledge integration as a commit.

- **Commit per logical step.** Scaffold, schema change, each ingest, each filed-back query,
  each lint pass.
- **Message conventions** (mirror the log prefixes):
  - `ingest: <source title>`
  - `query: <question> (+ filed <page>)`
  - `lint: <scope> — <n> fixes`
  - `schema: <what changed>`
  - `feat: <structural change>`
  - v2: `research: <topic>` · `plan: <feature>` · `build: <feature>` ·
    `review: <feature>` · `session: <summary>`
- Keep `.obsidian/` workspace noise out of meaningful diffs where practical.

---

## 7. Visuals & tooling

- **Mermaid.js** for diagrams (graph/flow/sequence) directly in pages — Obsidian renders it.
- **Marp** for slide decks generated from wiki content (Marp frontmatter `marp: true`).
- **Dataview** queries rely on the frontmatter in §3 — keep it clean and consistent.
- **Obsidian Web Clipper** feeds `Clippings/`. **Attachment folder** → `raw-sources/assets/`
  so images live locally and the LLM can view them.

---

## 8. Scalability & upgrade path

Current scale: tiny. The **index file is the search engine** — read it first on every
query. This works well to ~100 sources / hundreds of pages, no embeddings needed.

When the index stops being enough, add CLI tooling (a `/tools` folder):

- **[qmd](https://github.com/tobi/qmd)** — local markdown search (BM25 + vector + LLM
  re-rank), CLI + MCP server. Preferred drop-in.
- Or vibe-code a naive `search.py` (grep the index + page bodies) and a `lint.py`
  (orphans, broken links, stale flags) as the need arises.

This file is **living**. Curator and LLM update it as conventions evolve — add
model-specific hooks, new workflows, and naming rules here, then bump the version.

---

## 9. Quick reference

```
NEW SOURCE   → read → copy to raw-sources → summary page → cross-link 5–10 pages
             → update index → append log → commit "ingest: …"
QUESTION     → read index → drill in → answer w/ citations → file back if novel
             → update index/log → commit "query: …"
HEALTH CHECK → scan contradictions/stale/orphans/missing/broken → fix → log → commit "lint: …"
FEATURE      → research (wiki/research/) → spec w/ AC-n + tier (specs/) → curator approval
             (architecture) → build test-first → review vs ACs → ADRs to decisions/
             → log/commit per step: "research: … | plan: … | build: … | review: …"
```

See also: [[index]] · [[log]] · [[llm-wiki]] (the founding pattern)
