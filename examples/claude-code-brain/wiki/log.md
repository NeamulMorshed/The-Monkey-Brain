---
title: "Log — The Monkey Brain"
type: log
status: active
tags: [log, audit, chronological]
created: 2026-06-17
updated: 2026-07-17
---

# 🐵 The Monkey Brain — Log

Append-only audit trail. Newest at the bottom. Each entry is prefixed for grep:
`grep "^## \[" log.md | tail -5`. Prefixes: `ingest | query | lint | schema | feat`.

---

## [2026-06-17] feat | Vault scaffolded
Created the three-layer architecture: `raw-sources/` (immutable), `wiki/` (LLM-owned:
`sources/ concepts/ entities/ syntheses/`), `schema/` (`CLAUDE.md` + `templates/`). Added
`.gitignore`. Reference structure: MewVault (structural only). Decisions: full compile of all
6 seed sources; commit-per-step; tooling deferred (see [[search-tooling]]).

## [2026-06-17] schema | Operating manual v1.0 written
`schema/CLAUDE.md` defines layers, page types, frontmatter standard, the [[knowledge-sdlc]]
(ingest/query/lint), linking conventions, git conventions, visuals (Mermaid/Marp/Dataview),
and the scalability upgrade path. Added 4 page templates (source/concept/entity/synthesis).

## [2026-06-17] ingest | LLM Wiki (Karpathy)
Founding pattern. Source → [[sources/llm-wiki]]. Spawned [[llm-wiki-pattern]], [[rag]],
[[knowledge-sdlc]] (+ [[ingest-compile]], [[query-deploy]], [[lint-test]]),
[[raw-sources-layer]], [[wiki-layer]], [[schema-layer]], [[index-and-log]],
[[obsidian-ecosystem]], [[dataview]], [[search-tooling]]. Touched: 12 pages.

## [2026-06-17] ingest | Choose a Permission Mode
Source → [[sources/permission-modes]]. Spawned/updated [[permission-modes]], [[auto-mode]],
[[plan-mode]], [[protected-paths]], [[permission-rules]], [[claude-code]]. Flagged
cross-source dependency: auto-mode conversational boundaries can be lost on [[compaction]].
Touched: 7 pages.

## [2026-06-17] ingest | Explore the Context Window
Source → [[sources/context-window]]. Spawned/updated [[context-window]], [[compaction]],
[[subagents]], [[claude-md]], [[skills]], [[mcp]], [[hooks]], [[rules]], [[memory]].
Reinforced the auto-mode/compaction dependency. Touched: 10 pages.

## [2026-06-17] ingest | Extend Claude Code
Source → [[sources/extend-claude-code]]. Connective tissue: spawned/updated [[skills]],
[[hooks]], [[mcp]], [[subagents]], [[agent-teams]], [[plugins]], [[claude-md]], [[rules]],
[[code-intelligence]]. Filed synthesis [[claude-md-vs-skills-vs-hooks]]. Touched: 11 pages.

## [2026-06-17] ingest | Frontend Design Plugin
Source → [[sources/frontend-design-plugin]]. Entity [[frontend-design]]; updated [[plugins]],
[[skills]]. Touched: 4 pages.

## [2026-06-17] ingest | Superpowers Plugin
Source → [[sources/superpowers-plugin]]. Entity [[superpowers]]; updated [[plugins]],
[[skills]], [[subagents]]. Noted "circuit-breaker after 3 failures" motif shared with
[[auto-mode]]. Touched: 5 pages.

## [2026-06-17] feat | index.md built
Catalog of all pages by category, with Mermaid mindmap and Dataview-ready stats.
Verified final count: 45 wiki pages (32 concepts, 3 entities, 6 sources, 2 syntheses, index, log).

## [2026-06-17] lint | Baseline health check
First [[lint-test]] pass over the seed vault. Findings & fixes recorded; see the lint section
below.

### Lint findings (2026-06-17)
- **Slug collision:** `sources/context-window` vs `concepts/context-window` share a basename.
  Resolved by always linking the concept as `[[context-window]]` (Obsidian shortest-path) and
  the source via folder-qualified `[[sources/context-window]]` in the index. Watch on future ingests.
- **Comparison aliases:** `skill-vs-subagent`, `mcp-vs-skill`, `hook-vs-skill`,
  `claude-md-vs-skills`, `claude-md-vs-rules-vs-skills`, `subagent-vs-agent-team` are registered
  as `aliases:` on [[claude-md-vs-skills-vs-hooks]] so inbound links resolve to one canonical
  synthesis (no thin orphan pages).
- **Raw-source links normalized:** the six source-summary pages linked their immutable raw
  file via `[[wikilink]]`, which risked ambiguity with the `Clippings/` duplicates and the
  en-dash filenames. Converted all six to explicit relative markdown links into `raw-sources/`.
- **Category MOCs added:** created [[concepts]], [[entities]], [[syntheses]] map-of-content
  pages to resolve repeated category references and give each wiki folder a hub (42 pages total).
- **Orphans:** none — verified programmatically; every page has ≥1 inbound link.
- **Broken links:** none — verified programmatically (inline-code examples excluded).
- **Stray file removed:** a 0-byte `hook-vs-skill.md` appeared at the vault root (Obsidian
  materialized an unresolved link before its alias was registered). Deleted — the
  `hook-vs-skill` comparison lives as an alias on [[claude-md-vs-skills-vs-hooks]].

## [2026-06-17] ingest | Hooks Reference
Web-fetched https://code.claude.com/docs/en/hooks → [Hooks reference.md](../raw-sources/Hooks%20reference.md).
Summary → [[sources/hooks-reference]]. **New concept** [[hook-events]] (the ~30-event catalog).
**Expanded** [[hooks]] with the five handler types and the exit-code/decision protocol.
Added reciprocal links from [[claude-code]], [[permission-rules]], [[compaction]],
[[subagents]], [[mcp]]. Vault now 7 sources / 47 pages. Touched: 10 pages.

## [2026-06-17] ingest | Skills Authoring Guide
Web-fetched https://code.claude.com/docs/en/skills → [Skills authoring guide.md](../raw-sources/Skills%20authoring%20guide.md).
Summary → [[sources/skills-authoring-guide]]. **New concept** [[skill-authoring]] (SKILL.md
format, full frontmatter, `context: fork`, `!` injection, substitutions). **Expanded** [[skills]]
and traced its compaction caps (5k/25k) to this primary source. Reciprocal links from
[[subagents]] (fork ↔ skills field) and [[plugins]] (namespacing). Vault now 8 sources / 49
pages. Touched: 8 pages.

## [2026-06-17] ingest | qmd README
Web-fetched https://github.com/tobi/qmd → [qmd README.md](../raw-sources/qmd%20README.md).
Summary → [[sources/qmd-readme]]. **New entity** [[qmd]] (on-device BM25+vector+rerank search,
CLI + MCP, concrete adoption steps). **Expanded** [[search-tooling]] from "deferred" to "fully
specced" and linked [[mcp]]. Resolved a naming clash by moving the `qmd` alias off
[[search-tooling]] onto the new entity page. Vault now 9 sources / 51 pages. Touched: 6 pages.

## [2026-06-17] query | Vault overview deck (filed back)
Self-directed. Generated [[vault-overview-deck]] — a Marp slide deck touring the pattern,
architecture, SDLC, contents, and scaling path — and filed it into `syntheses/`. Linked from
[[index]] and [[syntheses]].

## [2026-06-17] feat | Dataview dashboard
Added [[dashboard]] (`wiki/dashboard.md`): live Dataview tables for health (stub/stale),
sources, concepts, entities, syntheses, hubs by inbound-link count, orphans, and recent edits.
Wired into [[index]] "Start here" and [[dataview]]. Vault now 53 pages.

## [2026-06-17] ingest | Permissions Reference
Web-fetched https://code.claude.com/docs/en/permissions → [Permissions reference.md](../raw-sources/Permissions%20reference.md).
Summary → [[sources/permissions-reference]]. **Two new concepts:** [[settings-precedence]]
(managed > CLI > local > project > user, deny-wins) and [[read-only-commands]] (the no-prompt
built-in Bash set). **Substantially expanded** [[permission-rules]] with the deny→ask→allow
evaluation order and per-tool syntax. Reciprocal links from [[permission-modes]], [[subagents]]
(`Agent()` rules), [[claude-code]]. Sourced several previously-asserted claims. Vault now 10
sources / 56 pages. Touched: 8 pages.

## [2026-06-17] ingest | MCP Guide
Web-fetched https://code.claude.com/docs/en/mcp → [MCP guide.md](../raw-sources/MCP%20guide.md).
Summary → [[sources/mcp-guide]]. **New concept** [[mcp-tool-search]] (deferred tool loading) —
which finally **sources** the "idle MCP tools are cheap" claim long asserted by [[context-window]]
and [[extend-claude-code]]. **Substantially expanded** [[mcp]] (transports, scopes/precedence,
OAuth, resources/prompts, output limits). Reciprocal links from [[context-window]], [[qmd]].
Vault now 11 sources / 58 pages. Touched: 7 pages.

## [2026-06-17] ingest | Subagents Guide
Web-fetched https://code.claude.com/docs/en/sub-agents → [Subagents guide.md](../raw-sources/Subagents%20guide.md).
Summary → [[sources/subagents-guide]]. **New concept** [[built-in-subagents]] (Explore/Plan/
general-purpose + what each loads) — **sources** the "Explore/Plan omit CLAUDE.md + git status"
claim long asserted by [[subagents]] and [[extend-claude-code]]. **Expanded** [[subagents]]
(definition frontmatter, scope precedence, permission inheritance). Reciprocal links from
[[plan-mode]] (Plan agent) and [[skill-authoring]] (`skills:` ↔ `context: fork`). Vault now 12
sources / 60 pages. Touched: 7 pages.

### Note
This completes the **Claude Code reference cluster** (permissions, context, extensions all now
have their primary-doc sources ingested). Most previously-asserted cross-doc claims are now
traced to a source.
- **Stale claims:** none yet (single-day corpus).
- **Suggested next sources / questions:** Claude Code Hooks reference; Skills authoring guide;
  the qmd README (to plan the [[search-tooling]] upgrade); a Memex primary source for
  [[llm-wiki-pattern]] provenance.

## [2026-06-17] ingest | As We May Think (Bush, 1945) — first real Clippings/ run
Clipped via Web Clipper into `Clippings/As We May Think - Vannevar Bush.md` (title/URL/note
only), then canonicalized into [Memex - As We May Think (Bush 1945).md](../raw-sources/Memex%20-%20As%20We%20May%20Think%20%28Bush%201945%29.md)
as a **citation stub** — the 1945 Atlantic essay is still copyrighted, so the raw source holds
metadata + an original factual summary instead of the full text, with the canonical URL for the
curator to read in full. The transient `Clippings/` copy was deleted after canonicalizing, per
the layer rule. Summary → [[sources/memex-as-we-may-think]]. **Resolves the long-standing
asserted-but-unsourced claim** in [[llm-wiki-pattern]] and [[sources/llm-wiki]] that this vault
is "kin to Vannevar Bush's Memex" — now backed by a primary citation. Reciprocal links added
from [[llm-wiki-pattern]], [[sources/llm-wiki]], [[vault-overview-deck]]. Vault now 13 sources /
61 pages. Touched: 5 pages.

## [2026-07-17] ingest | Caveman README
Web-fetched https://github.com/JuliusBrussee/caveman → [Caveman README.md](../raw-sources/Caveman%20README.md).
Opens the **v2 enhancement research cluster** (token economy · enforcement · expertise packs —
the three benchmarks behind the engine's `ROADMAP.md` v0.2). Summary → [[sources/caveman-readme]].
**New entity** [[caveman]]. Cross-linked [[skills]] (per-turn skill cost), [[plugins]]
(repo-as-marketplace), [[claude-md]] (compress-memory-files play, ~46% permanent input savings),
[[context-window]] (output/input/reasoning are separate budgets). Noted the honest-numbers
nuance: the 65% headline is output-only. Vault now 14 sources / 63 pages. Touched: 9 pages.

## [2026-07-17] ingest | MewVault README
Web-fetched https://github.com/mewking2099/MewVault → [MewVault README.md](../raw-sources/MewVault%20README.md).
The **enforcement benchmark** of the v2 research cluster. Summary → [[sources/mewvault-readme]].
**New entity** [[mewvault]]. **Expanded** [[hooks]] (a production 7-hook architecture),
[[claude-md-vs-skills-vs-hooks]] ("guardrails belong in hooks" now validated at workspace
scale), [[memory]] (semantic memory + instinct tiers). Captured the prompt-cache postmortem
rule: *optimize by injecting less, never by transforming the prompt.* Design difference flagged
(session-end synced read-layer wiki vs. our compile-time wiki) — to be reconciled in
[[monkey-brain-vs-mewvault]]. Vault now 15 sources / 65 pages. Touched: 8 pages.

## [2026-07-17] ingest | ui-ux-pro-max README
Web-fetched https://github.com/nextlevelbuilder/ui-ux-pro-max-skill → [ui-ux-pro-max README.md](../raw-sources/ui-ux-pro-max%20README.md).
The **expertise-pack exemplar** of the v2 research cluster. Summary → [[sources/ui-ux-pro-max-readme]].
**New entity** [[ui-ux-pro-max]]. Cross-linked [[skills]] (skills can carry data + scripts),
[[frontend-design]] (decider vs. executor division of labor), [[search-tooling]] (BM25-in-a-skill,
the [[qmd]] family scaled down), [[plugins]] (marketplace + npm CLI distribution). Boundary
flagged: its knowledge is frozen at publish — the compounding fix is specced in
[[domain-expertise-packs]]. Vault now 16 sources / 67 pages. Touched: 9 pages.
