---
title: "The Monkey Brain (engine) — Brain Operating Manual"
type: schema
status: living
tags: [schema, config, monkey-brain]
created: 2026-09-16
updated: 2026-09-16
engine_version: 2.1
project: "The Monkey Brain (engine)"
---

# 🐵 The Monkey Brain (engine) — Monkey Brain

This `.brain/` is a **Monkey Brain instance**: a persistent, compounding knowledge base for
**The Monkey Brain (engine)**, built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
This file is its **operating manual** and loads with every `claude` session at the project root.
Material needed only now and then — plugins, MCP servers, pipelines, team mode, qmd — lives in
[reference.md](reference.md) next to this file; read it when a task touches those.

> **Roles.** You are the **curator** (sources, questions, approvals); I am the **maintainer**
> (summarizing, cross-referencing, filing, bookkeeping). I own `wiki/`; I never modify
> `raw-sources/`. **Scope:** this brain is about **The Monkey Brain (engine) only** — no unrelated context.

---

## 1. Architecture

```
.brain/
├── CLAUDE.md · reference.md  # this manual · the on-demand reference
├── Clippings/     # Web Clipper staging — transient, git-ignored, never canonical
├── raw-sources/   # IMMUTABLE inputs + assets/ — the source of truth
├── wiki/          # MAINTAINER-OWNED: index.md (read first) · log.md (append-only) ·
│                  #   dashboard.md · sources/ concepts/ entities/ syntheses/ research/
├── specs/         # acceptance-criteria specs — the plan & TDD gates read these
├── projects/      # one status page per workstream (tier, phase, audit)
├── sessions/      # HOOK-WRITTEN: snapshots, agent dispatch log
├── decisions/     # ADRs — the durable "why"
├── instincts/     # learned rules: pending/ (proposed) → active/ (injected)
└── memory/        # durable project facts not derivable from the wiki
```

**Layer rules** — Clippings: staging only, copy into `raw-sources/` on ingest. raw-sources:
never edit; new sources come through ingest. wiki: mine. specs / projects / decisions:
co-owned — I draft, the curator approves (`plan_approved`, tier changes, ADR acceptance).
sessions: hook-written, append only. instincts: I propose in `pending/` after 3+ repeated
corrections; only the curator promotes to `active/`. memory: short durable notes.

---

## 2. Page & record types

| Type | Folder | Template |
| --- | --- | --- |
| Source summary (one raw source) | `wiki/sources/` | `templates/source.md` |
| Concept (a topic across sources) | `wiki/concepts/` | `templates/concept.md` |
| Entity (tool, product, person, system) | `wiki/entities/` | `templates/entity.md` |
| Synthesis (comparison, filed-back answer) | `wiki/syntheses/` | `templates/synthesis.md` |
| Research (a run with findings + recommendation) | `wiki/research/` | `templates/research.md` |
| Spec (numbered ACs, tier, approval) | `specs/` | `templates/spec.md` |
| Project status (tier, phase, audit) | `projects/` | `templates/project-status.md` |
| Decision / ADR | `decisions/` | `templates/decision.md` |
| Instinct (a learned rule) | `instincts/{pending,active}/` | `templates/instinct.md` |

Slugs are **kebab-case, lowercase, no spaces**. A `[[wikilink]]` must resolve to exactly one page.

---

## 3. Frontmatter standard

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
Bump `updated:` on every touch; write absolute dates; every non-source page **cites its
sources**. Link raw source files with relative markdown links (`../../raw-sources/...`), not
`[[wikilinks]]`.

---

## 4. The Knowledge SDLC

### Ingest (compile) — when a source is added
1. Read it fully. 2. Copy into `raw-sources/`. 3. Write a `wiki/sources/` summary.
4. **Cross-link every page the source genuinely informs** (create/update concepts & entities,
reciprocal links, flag contradictions, mark `stale` where superseded). 5. Update
`wiki/index.md`. 6. Append `wiki/log.md`. 7. Offer a commit.

### Query (deploy) — when asked a question
Read `index.md` first → drill in → answer **with citations** → **file novel answers back**
into `wiki/syntheses/`. Log it.

### Lint (test) — periodically
Scan for contradictions, stale claims, orphans, missing pages, broken `[[links]]`, gaps.
Fix, log, suggest new questions/sources.

### Develop (research → plan → build → review) — for feature work
**Research** files findings to `wiki/research/` → **Plan** writes `specs/<feature>.md` with
numbered ACs and a tier (the curator approves architecture tiers) → **Build** works the ACs
test-first → **Review** verifies and files results; decisions distill into `decisions/`. The
spec file *is* the plan: Markdown only. Each stage names the next: research → `/brain:plan` →
`/brain:build` → `/brain:review`, which sends the spec back to `/brain:build` (blockers listed
in the spec) or closes it `done` and offers `/brain:wrap`. A spec's `scope:` globs tell the
gates which files it owns.
**Entry rule:** a new feature request enters at research by default — unless the brain already
holds related research (then `/brain:plan`, citing it) or an open spec covers it (then
`/brain:build`). Say **"skip research"** (or "just build it", "quick fix") to enter at plan;
`quick`-tier work never needs research.
**Around the stages:** `/brain:loop` repeats build, research or design until the brain's own
criteria are met and halts on stalls or a tick cap; `/brain:wrap` closes a *session* (verify,
log, index, resume, commit) and trusts a `done` spec; `/brain:digest` (standup / weekly) and
`/brain:dump` (file a loose note) run any time. Other commands: [reference.md](reference.md).

**Log prefixes** (`wiki/log.md`, append-only):
`ingest | query | lint | schema | feat | session | research | plan | build | review`.

---

## 5. Tiers and model routing

| Tier | Meant for | Enforcement (hooks) |
| --- | --- | --- |
| `quick` | <2h fixes, chores | advisory only — no hard gates |
| `feature` | normal feature work | **TDD gate**: new source files need a test companion (`tdd: false` opts out); plan may be verbal |
| `architecture` | structural change | **hard plan gate**: source writes blocked until `plan_approved: true` (+ TDD gate) |

The tier lives in the spec. No active spec → no gate. `/brain:plan` sizes a change with
`graph.js radius <files|dirs|keywords>`; a wide blast radius means `architecture`.

**Model routing** — the one policy; hooks and skills cite this table.

| Work | Runs where | Model | Effort |
| --- | --- | --- | --- |
| Deterministic checks (doctor, lint, graph, usage data) | Node scripts | none | — |
| Triage, classification | subagent | haiku | low |
| Reading fan-out (research slices, sweeps, batch ingest) | subagent | sonnet | medium |
| Coding (build ACs, CI, scaffolds) | forked skill or subagent | sonnet | medium |
| Research synthesis, planning, architecture | main session | opus · fable for architecture tier | high |
| Review, adversarial audit | subagent, a family other than the builder's | opus or fable | high |
| Conversation | the session model, chosen at start | sonnet · opus/fable on research or plan days | medium |

**Change model by forking or dispatching, never by switching the main thread mid-session** —
prompt caches are per model, so a switch re-writes the whole context (~160k tokens measured
per switch). A skill that pins `model:` also sets `context: fork`; an agent dispatch always
names its `model`. Recommended default `effortLevel: medium`; judgment skills raise it.

---

## 6. Conventions

- Link **liberally and reciprocally**; every new page needs ≥1 inbound link (no orphans).
- A `[[link]]` to a not-yet-existing page is a deliberate TODO marker — fine to leave.
- Obsidian may create 0-byte stray files at the brain root — delete them on lint.
- **Mermaid** for diagrams, **Marp** (`marp: true`) for decks, **Dataview** for live tables.
- Watch for slug collisions between a source summary and a concept of the same name.

## 7. Git

This `.brain/` is committed **with the The Monkey Brain (engine) repo**. Commit per logical step using the
log prefixes (`ingest: <title>`, `plan: <feature>`, …). `Clippings/` drops stay out of git.
Team mode (union-merged logs, `/brain:lock`): [reference.md](reference.md).

## 8. Engine and search

Scaffolded by **The Monkey Brain** engine (schema v2.1). `/brain:init --update` refreshes this
file, `reference.md` and `templates/`, never your knowledge. **Search before re-deriving:** the
built-in `brain-search` MCP serves `brain_search` and `brain_brief` (a cited pack of ~2k
tokens) over `wiki/`, `decisions/`, `specs/`, `projects/` and `memory/`; `/brain:brief` is the
command form, and each session's first prompt is matched automatically. `wiki/index.md` stays
the map. Past ~100 sources, qmd adds meaning-based search ([reference.md](reference.md)).

## 9. Capability plugins & MCP servers

**Plugins do the craft; the brain records the knowledge** — every decision, finding or
durable artifact a plugin or MCP server produces is filed into a `.brain/` folder. The
per-plugin mapping, the precedence chain and the MCP contract: [reference.md](reference.md).

## 10. Domain pipelines

Product and game pipelines reuse the §4 lifecycle with a domain-shaped front end
(`/brain:game` for games): [reference.md](reference.md).

See also: [[index]] · [[log]] · [[dashboard]]
