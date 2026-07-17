---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-07-17
---

## Where we left off
v2 build, session 1 (2026-07-17): the three benchmarks (Caveman, MewVault, ui-ux-pro-max)
are ingested into the example brain (16 sources / 69 pages, lint-clean); plugin
`brain@monkey-brain` exists with MIT license and passes `claude plugin validate --strict`;
hooks **#1 brain-status** (budgeted SessionStart injection), **#3 guards** (secrets ·
immutability · log append-only · plan gate), **#4 wiki-check** (self-healing wiki), and
**#8 resume** (this system: reader + task auto-logger) are shipped and covered by
`node plugin/hooks/scripts/selftest.js`. Full history: `ROADMAP.md` → Execution status +
Session log.

## Next steps
- [ ] **Phase 3 core skills**: `plugin/skills/{init,ingest,query,lint,wrap}/SKILL.md` — `/brain:init` wraps `bootstrap/` via `${CLAUDE_PLUGIN_ROOT}`
- [ ] Hook **#2 trigger-router** (natural phrases → the new skills) + **#6 wrap** (P2 remainder)
- [ ] Then hooks #5 snapshot, #7 agent-track → **Phase 4 schema v2** (specs/ projects/ sessions/ decisions/ instincts/ + tiers)
- [ ] Optional dogfood: `/plugin marketplace add "F:\The Monkey Brain\The-Monkey-Brain"` → `/plugin install brain@monkey-brain`

## Task log (auto)
- [2026-07-17] ✔ P9.2 benchmark ingests + syntheses (4 commits)
- [2026-07-17] ✔ P1 plugin skeleton + MIT license
- [2026-07-17] ✔ P2 hooks #1/#3/#4 (v0.2.0, selftest green)
- [2026-07-17] ✔ P2 hook #8 resume system (v0.3.0)
