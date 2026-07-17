---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-07-17
---

## Where we left off
v2 build, session 3 (2026-07-17): **Phases 1–5 are complete** (plugin v0.7.0). Phase 5
memory & context engineering landed in five per-step commits: **instinct auto-detection**
(`instinct-track.js` — 3+-session edits → `instincts/pending/` advisory), **decision
auto-distillation** (`wrap.js` Stop nudge after build/review + `brain-status` "Decisions
(the why)" surfacing + `/brain:wrap` step), **opt-in qmd semantic search**
(`qmd-mcp.js` → the `brain-search` MCP in `.mcp.json`, dormant unless `.qmd`/`MONKEY_BRAIN_QMD`
+ qmd on PATH; stdlib no-op server otherwise; SessionEnd re-index; §8 documented),
**compaction survival** (`snapshot.js` now carries active specs/projects), and
**budget-receipt groundwork** (`brain-status` writes `sessions/injection-stats.json`).
Selftest **115/115 GREEN**; `claude plugin validate --strict` passes. Full history:
`ROADMAP.md` → Execution status + Session log.

## Next steps
- [ ] **P5.5 model routing & parallel fan-out**: `model:`/`effort:` frontmatter across skills per the routing policy; `agents/brain-librarian.md` + `agents/brain-researcher.md` (Sonnet); parallel fan-out patterns documented in the skills
- [ ] Then P6 bundled-plugin manifest · P6.5 product-design pack · P7 pipelines · P8 `/brain:doctor` (reads the new `injection-stats.json` + `edit-counts.json`) · P9 dogfood + PR to `main`
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
