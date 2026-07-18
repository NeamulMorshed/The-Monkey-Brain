---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-07-18
---

## Where we left off
v2 build, session 4 (2026-07-18): **Phases 6 + 6.5 + 7 are complete** (plugin v0.11.0). **P7**
codified the product & game pipelines: `/brain:game` runs concept → GDD → prototype spec →
build → playtest (ingested as sources) → balance (ADRs), with a new `templates/gdd.md`
(`type: gdd`, MDA + core loop); the product pipeline (idea→PRD→spec→build→track→wrap) is the
standard lifecycle + product plugins; instance-manual **§10 "Domain pipelines"** documents both.
Selftest 137 → **144 GREEN**. **P6.5** shipped the first domain-expertise pack
(`skills/product-design/` — 5-phase process + `data/` [Nielsen, WCAG, methods] + `templates/` +
`checklist.md` P0 gate via `pack:` field). **P6** was the bundled-plugin manifest. `skills/init/recommended-plugins.json` lists the nine capability
plugins (github, frontend-design, superpowers, security-guidance, product-tracking-skills,
code-modernization, productivity, product-management, ui-ux-pro-max), each mapped to the
`.brain/` folder its output is filed into; `scripts/plugins.js` renders the offer
(`--verbose`/`--json`); `/brain:init` step 6 offers the relevant subset and installs
model-driven via `/plugin` (never silent, skipped on `--update`); instance-manual **§9
"Capability plugins (the craft layer)"** states the contract — *plugins do the craft; the
brain records the knowledge* — with the per-plugin filing map + precedence chain. Selftest
120 → **127 GREEN**; both manifests validate `--strict`. Full history below and in
`ROADMAP.md`. — Earlier context (Phases 1–5.5, plugin v0.8.0): Phase 5
memory & context engineering landed in five per-step commits: **instinct auto-detection**
(`instinct-track.js` — 3+-session edits → `instincts/pending/` advisory), **decision
auto-distillation** (`wrap.js` Stop nudge after build/review + `brain-status` "Decisions
(the why)" surfacing + `/brain:wrap` step), **opt-in qmd semantic search**
(`qmd-mcp.js` → the `brain-search` MCP in `.mcp.json`, dormant unless `.qmd`/`MONKEY_BRAIN_QMD`
+ qmd on PATH; stdlib no-op server otherwise; SessionEnd re-index; §8 documented),
**compaction survival** (`snapshot.js` now carries active specs/projects), and
**budget-receipt groundwork** (`brain-status` writes `sessions/injection-stats.json`).
Then **Phase 5.5 model routing** (v0.8.0): `model:`/`effort:` frontmatter on all 11 skills
(judgment→main model+high effort; routine `ingest`/`research`/`build`→Sonnet; `terse`→Haiku),
two Sonnet subagents (`brain-researcher` read-only slice + `brain-librarian` batch ingest),
and fan-out patterns documented in the skills. Selftest **120/120 GREEN**; `claude plugin
validate --strict` passes. Full history: `ROADMAP.md` → Execution status + Session log.

- [ ] **P8 `/brain:doctor`**: health-monitor skill + `doctor.js` running 15 checks (broken links · orphans · stale flags · index freshness · Clippings backlog · log gaps · uncommitted `.brain/` · hook registration · injection size vs budget from `injection-stats.json` · semantic-index freshness · WIP limits · instinct-queue overflow · specs without tests · open P0s · schema version vs engine + model-mix). Failures inject a health report via hook #1 (brain-status).
- [ ] Then P9 dogfood on a scratch project + docs v2.0 + PR to `main`
- [ ] Optional dogfood now: `/plugin marketplace add "F:\The Monkey Brain\The-Monkey-Brain"` → `/plugin install brain@monkey-brain`

## Task log (auto)
- [2026-07-17] ✔ P9.2 benchmark ingests + syntheses (4 commits)
- [2026-07-17] ✔ P1 plugin skeleton + MIT license
- [2026-07-17] ✔ P2 hooks #1/#3/#4 (v0.2.0, selftest green)
- [2026-07-17] ✔ P2 hook #8 resume system (v0.3.0)
- [2026-07-17] ✔ P3 core skills /brain:{init,ingest,query,lint,wrap} (v0.4.0)
- [2026-07-17] ✔ P2 complete — hooks #2/#5/#6/#7 (selftest 79/79)
- [2026-07-17] ✔ P4 schema v2 + tier gates + migration (v0.5.0, selftest 88/88)
- [2026-07-17] ✔ P3 complete — research/plan/build/review + terse/compress (v0.6.0, selftest 95/95)
- [2026-07-17] ✔ P5 complete — memory engineering: instinct-track, decision distillation, opt-in qmd MCP, snapshot specs/projects, injection receipts (v0.7.0, selftest 115/115)
- [2026-07-17] ✔ P5.5 complete — model routing frontmatter (11 skills) + brain-researcher/brain-librarian Sonnet agents + fan-out patterns (v0.8.0, selftest 120/120)
- [2026-07-18] ✔ P6 complete — bundled-plugin manifest (9 recommended plugins + plugins.js renderer + /brain:init offer + instance-manual §9 recording contract) (v0.9.0, selftest 127/127)
- [2026-07-18] ✔ P6.5 complete — product-design pack (5-phase process + data/ [Nielsen+WCAG+methods] + templates/ + checklist.md P0 gate; pack: field → /brain:wrap gate; router phrases) (v0.10.0, selftest 137/137)
- [2026-07-18] ✔ P7 complete — product & game pipelines (/brain:game concept→GDD→prototype→playtest→balance; gdd.md template; §10 manual; router game phrases) (v0.11.0, selftest 144/144)
