---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-07-17
---

## Where we left off
v2 build, session 2 (2026-07-17): **P2 complete (8/8 hooks)**, **P3 core skills shipped**
(`/brain:{init,ingest,query,lint,wrap}`), and **P4 schema v2 done** (plugin v0.5.0).
The template now carries `specs/ projects/ sessions/ decisions/ instincts/ wiki/research/`
with templates for spec (AC-n · tier · `plan_approved` · `tdd`), ADR, project status,
instinct, and research; both CLAUDE.md manuals are at v2.0. Tier gates are live: plan gate
(architecture) + TDD gate (feature+, new code files need a test companion). Both update
paths (`new-brain.ps1 -Update`, `new-brain.js --update`) migrate v1→v2 structure without
touching knowledge. Selftest **88/88 GREEN**; both manifests validate `--strict`.
Full history: `ROADMAP.md` → Execution status + Session log.

## Next steps
- [ ] **P3 remainder — develop-lifecycle skills**: `/brain:research` (file to `wiki/research/`), `/brain:plan` (spec with numbered ACs, arms the plan gate), `/brain:build` (TDD loop vs spec), `/brain:review` (filed-back review); wire new trigger-router phrases ("spec X", "research Y")
- [ ] Token discipline skills: `/brain:terse`, `/brain:compress`
- [ ] Then **P5** memory tiers + qmd MCP · **P5.5** model routing (agents brain-librarian/brain-researcher)
- [ ] Optional dogfood: `/plugin marketplace add "F:\The Monkey Brain\The-Monkey-Brain"` → `/plugin install brain@monkey-brain`

## Task log (auto)
- [2026-07-17] ✔ P9.2 benchmark ingests + syntheses (4 commits)
- [2026-07-17] ✔ P1 plugin skeleton + MIT license
- [2026-07-17] ✔ P2 hooks #1/#3/#4 (v0.2.0, selftest green)
- [2026-07-17] ✔ P2 hook #8 resume system (v0.3.0)
- [2026-07-17] ✔ P3 core skills /brain:{init,ingest,query,lint,wrap} (v0.4.0)
- [2026-07-17] ✔ P2 complete — hooks #2/#5/#6/#7 (selftest 79/79)
- [2026-07-17] ✔ P4 schema v2 + tier gates + migration (v0.5.0, selftest 88/88)
