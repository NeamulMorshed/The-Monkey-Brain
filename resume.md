---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-07-17
---

## Where we left off
v2 build, session 2 (2026-07-17): **Phase 2 is complete (8/8 hooks)** and the **Phase 3
core skills shipped** (plugin v0.4.0). `/brain:{init,ingest,query,lint,wrap}` exist —
`init` is self-contained (bundled template + Node scaffold, `--sync-template` guard),
`lint` injects a mechanical scanner. New hooks: #2 trigger-router (phrases → skills),
#5 snapshot (PreCompact → `sessions/`), #6 wrap (unlogged-work stop gate + index
self-heal), #7 agent-track (dispatch log + explicit-model gate); #1 grew the no-brain
`/brain:init` offer. Selftest **79/79 GREEN**; both manifests validate `--strict`.
Full history: `ROADMAP.md` → Execution status + Session log.

## Next steps
- [ ] **Phase 4 schema v2**: brain-template `specs/ projects/ sessions/ decisions/ instincts/` + tiers (`quick`/`feature`/`architecture`), frontmatter `tier`/`phase`/`plan_approved`/`audit_score`, log prefixes `session|research|plan|build|review`; migrate via `new-brain.ps1 -Update` **and** `new-brain.js --update`; `schema/CLAUDE.md` → v2.0
- [ ] P4-dependent skills: `/brain:research`, `/brain:plan` (numbered ACs, arms plan gate), `/brain:build` (TDD vs spec), `/brain:review`
- [ ] Token discipline skills: `/brain:terse`, `/brain:compress`
- [ ] Optional dogfood: `/plugin marketplace add "F:\The Monkey Brain\The-Monkey-Brain"` → `/plugin install brain@monkey-brain`

## Task log (auto)
- [2026-07-17] ✔ P9.2 benchmark ingests + syntheses (4 commits)
- [2026-07-17] ✔ P1 plugin skeleton + MIT license
- [2026-07-17] ✔ P2 hooks #1/#3/#4 (v0.2.0, selftest green)
- [2026-07-17] ✔ P2 hook #8 resume system (v0.3.0)
- [2026-07-17] ✔ P3 core skills /brain:{init,ingest,query,lint,wrap} (v0.4.0)
- [2026-07-17] ✔ P2 complete — hooks #2/#5/#6/#7 (selftest 79/79)
