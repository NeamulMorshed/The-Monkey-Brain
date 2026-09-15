---
title: "Spec — Engine knowledge: links across records, superpowers filing, the engine compiled into its brain"
type: spec
status: done
tier: architecture
phase: done
audit_score: "done — 0 open findings (0 P0, 3 P1, 13 P2 found in review; fixed — code in d7b0519, knowledge in a correction pass; one kept as an observation; selftest 523 green)"
plan_approved: true
tdd: true
scope: [plugin/hooks/scripts/lib.js, plugin/hooks/scripts/wiki-check.js, plugin/skills/lint/**, plugin/skills/doctor/**, plugin/hooks/scripts/selftest.js, plugin/skills/init/brain-template/**, schema/brain-template/**, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**, plugin/README.md, README.md, resume.md]
created: 2026-09-16
updated: 2026-09-16
related: ["[[brain-health-audit]]", "[[brain-correctness]]", "[[token-diet]]"]
---

# Engine knowledge — spec

## Problem
The brain cannot answer questions about the engine it lives in: 0 sources, 0 concepts, 0 entities; `ROADMAP.md`, the READMEs, the CHANGELOG and 27 hook scripts were never compiled, so every engine question is answered by re-reading code — the most expensive path there is ([[brain-health-audit]] finding 6). Its link checkers disagree with its own linking rules: wiki-check, lint and doctor each keep a copy of a link inventory that only knows `wiki/`, so every link to a spec, ADR or workstream is "broken" (8 today), and records' frontmatter uses bare slugs that are neither links nor provenance (finding 4). `superpowers` writes design docs and plans to `docs/superpowers/`, where no gate, index or search ever sees them (finding 7).

## Goals / Non-goals
- Goal: one link inventory, covering the records the skills tell the model to link.
- Goal: every plugin artifact lands in the brain, superpowers included.
- Goal: the engine's knowledge — its roadmap, history and subsystems — is compiled, cited and searchable.
- Non-goal: router fixes, doctor dependency health, docs drift, bundle regeneration ([[router-and-drift]]).
- Non-goal: moving the engine's `ROADMAP.md` / `README.md` — they stay; the brain holds dated snapshots.

## Acceptance criteria

**Links (finding 4)**
- **AC-1** ✅ `lib.linkIndex resolves wiki pages and spec, decision and project records` · `wiki-check: links to a spec, an ADR and a workstream resolve` · `lint: records resolve and count as inbound links` · `doctor: records resolve and count as inbound links` · `wiki-check, lint and doctor share lib.linkIndex`; this brain: broken links none (was 8) — `lib.linkIndex(brain)` is the one inventory wiki-check, lint and doctor use: slugs, folder-qualified names and aliases of `wiki/**` plus the `specs/`, `decisions/` and `projects/` records (never `templates/`, `sessions/`, `raw-sources/`). A `[[slug]]` to a spec, ADR or workstream resolves in all three.
- **AC-2** ✅ `wiki-check: a page linked only from an ADR is not an orphan` + the lint and doctor checks above — Orphan checks in all three count inbound links from records as well as wiki pages; only wiki pages can be orphans.
- **AC-3** ✅ `every template with sources:/related: shows the quoted-wikilink form` · `the example comment does not change what the template parses to`; 18 bare-slug lines converted on this brain — Every template's `sources:` / `related:` line shows the quoted-wikilink form (`["[[page]]"]`), and this brain's bare-slug fields are converted.

**Superpowers (finding 7)**
- **AC-4** ✅ `reference.md §9 maps superpowers designs, plans and root causes into the brain` · `a superpowers plan … naming the spec as its home` · `a superpowers design … naming wiki/research` · `outside a brain, a superpowers write stays silent` — `reference.md` §9 maps superpowers outputs into the brain (a brainstorming design → the spec's Notes or `wiki/research/`; a written plan → the spec; a root cause from systematic debugging → `wiki/`); a write under `docs/superpowers/` in a brain project gets one PostToolUse advisory naming where it belongs.

**Engine knowledge (finding 6)**
- **AC-5** ✅ commit `2e6311e`: `raw-sources/engine-{roadmap,readme,changelog,resume-history}.md` + `wiki/sources/` summaries — The engine's `ROADMAP.md`, root `README.md`, `plugin/CHANGELOG.md` and root `resume.md` history are canonicalized into `raw-sources/` as dated snapshots, each with one `wiki/sources/` summary.
- **AC-6** ✅ 13 concept pages + 6 entity pages; lint on this brain: no broken links, no orphans, frontmatter complete — At least 10 concept pages cover the engine's subsystems (session injection · trigger router · plan & TDD gates · wiki self-healing & lint · Stop nudges · resume system · recall, search & the context nudge · agent tracking & model routing · doctor · loops · team lock · instincts & bans), each citing its source summaries and code paths; entity pages cover Claude Code and the capability plugins (github, frontend-design, superpowers, security-guidance, code-modernization). No orphans.
- **AC-7** ✅ `search.js "hook architecture session start injection token budget"` → 1. `session-injection` · 2. `resume-system` · 3. `recall-and-search` — On this brain, `search.js --brief "hook architecture session start injection token budget"` puts a concept page in its top three (before this spec: lifecycle-change pages only).
- **AC-8** ✅ root `resume.md` removed (`git rm`) after its ingest; `.brain/resume.md` holds the real narrative `resume.js` now resolves — The resume history lives in the brain: after its ingest the root `resume.md` is removed, and `.brain/resume.md` holds a real 2–4 line narrative that `resume.js` injects.

**Release**
- **AC-9** ✅ reviewer re-ran: selftest 523 ALL GREEN · `--strict` ×2 · 0.32.0 · doctor on this brain: no broken links, no orphans — selftest ALL GREEN; both manifests `--strict`; CHANGELOG and manifests `0.32.0`; doctor on this brain lists only deliberate TODO markers as broken links. *(Build evidence: selftest 513 ALL GREEN; `--strict` ×2; 0.32.0; doctor on this brain: `1. broken-links: none`, `2. orphans: none`. Left for the reviewer to re-run.)*

## Test plan
Selftest, red first: AC-1 a fixture brain with a spec, an ADR and a workstream linked from a wiki page — no broken link in wiki-check, lint or doctor, plus a `lib.linkIndex` unit check; AC-2 a wiki page linked only from a spec is not an orphan in all three; AC-3 every template's `sources:`/`related:` carries `[[`; AC-4 a reference.md text check and a PostToolUse probe on `docs/superpowers/specs/x.md`. AC-5…8 are knowledge work verified on this brain by lint, doctor and the AC-7 search; AC-9 by the reviewer.

## Notes & links
- Research: [[brain-health-audit]] (findings 4, 6, 7).
- Tier: `graph.js radius` → "touches 27 file(s) across 4 module(s) · 1 file type(s) · score 108 · suggested tier: architecture" (the width is `lib.js`).
- Approval: the curator said "do all of these one by one, on your own" after the audit recommended this spec, and "keep going, don't wait for me. do all of those on your own" on 2026-09-16. Recorded as `plan_approved: true` on those words.
- Split from the audit's third spec: router fixes, doctor dependency health (#20) and docs drift move to [[router-and-drift]], so this spec stays about knowledge and links.
- Knowledge pages are written by parallel `brain-librarian` workers (sonnet, per the manual §5 table) from a cluster of files each; the lead writes index and log once, so parallel writers never collide.
- **Build (2026-09-16):** 10 checks red first, then green; selftest 501 → 513 ALL GREEN. Seven librarians (sonnet) wrote the 23 knowledge pages in parallel from the code; the index listed every planned slug first so no page was ever an orphan. ADR [[links-resolve-across-records]].
- **Review (2026-09-16):** [[engine-knowledge-review]] — 0 P0, 3 P1 (knowledge pages stating pre-fix behaviour), 13 P2 (link-index collisions, case, templates, O(n²), superpowers guard, stale anchors and claims). Code fixes pinned by 10 checks (selftest 513 → 523); 14 pages corrected, line anchors replaced by names.
- **Build deviations:** (1) the first green run crashed doctor and lint — both already had a variable named `idx` (the index page), which the new `const idx = lib.linkIndex(…)` redeclared; renamed `links`, caught by the suite before any commit. (2) The template example sits in a comment line of its own, because a `]` inside an inline comment would confuse the frontmatter list parser.
