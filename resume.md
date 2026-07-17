---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-07-17
---

## Where we left off
v2 build, session 2 (2026-07-17): **Phases 1–4 are complete** (plugin v0.6.0). All 8
hooks live; **all 11 Phase-3 skills shipped** — knowledge SDLC
(`/brain:{init,ingest,query,lint,wrap}`), develop lifecycle
(`/brain:{research,plan,build,review}` — specs with AC-n + curator-owned approval,
test-first build, reviews filed back into syntheses/ADRs/instincts), token discipline
(`/brain:terse`, `/brain:compress`). Schema v2 template with tier gates (plan + TDD) and
v1→v2 migration in both update paths. Selftest **95/95 GREEN**; both manifests validate
`--strict`. Full history: `ROADMAP.md` → Execution status + Session log.

## Next steps
- [ ] **P5 memory engineering**: session-end auto-distillation into `decisions/`; bundle qmd semantic search via `plugin/.mcp.json` (deferred loading, §8 upgrade path); budget receipts groundwork
- [ ] **P5.5 model routing**: `model:`/`effort:` frontmatter across skills per the routing policy; `agents/brain-librarian.md` + `agents/brain-researcher.md` (Sonnet); parallel fan-out patterns documented in the skills
- [ ] Then P6 bundled-plugin manifest · P6.5 product-design pack · P7 pipelines · P8 `/brain:doctor` · P9 dogfood + PR to `main`
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
