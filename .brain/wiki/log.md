---
title: "Log — The Monkey Brain (engine)"
type: log
status: active
tags: [log, audit, chronological]
created: 2026-09-15
updated: 2026-09-15
---

# 🐵 The Monkey Brain (engine) — Log

Append-only audit trail. Newest at the bottom. Each entry is prefixed for grep:
`grep "^## \[" log.md | tail -5`. Prefixes:
`ingest | query | lint | schema | feat | session | research | plan | build | review`.

---

## [2026-09-15] feat | Brain scaffolded
Created an empty Monkey Brain instance for **The Monkey Brain (engine)** from the engine template. Ready to
ingest its first source.

## [2026-09-15] research | develop-lifecycle-dogfood
Three-slice fan-out (skill docs, hooks+selftest, roadmap history); four top claims re-verified in source. Filed [[develop-lifecycle-dogfood]]: lifecycle is 4 stages + utilities, gates scan all open specs, review has no hand-off, Stop nudges serialize, no wrap selftest. Recommends a feature-tier spec develop-lifecycle-fixes.

## [2026-09-15] plan | develop-lifecycle-fixes
Spec drafted from [[develop-lifecycle-dogfood]]: 12 ACs across gate scoping (`scope:` globs, unscoped fallback), review→build/wrap hand-off, consolidated Stop nudge with selftest, manual §4 as the single lifecycle definition. Tier feature (graph.js said quick, score 2; raised because gate behaviour changes). plan_approved stays false; awaiting curator review of ACs and two assumptions. Workstream page projects/develop-lifecycle.md created.

## [2026-09-15] plan | develop-lifecycle-fixes approved
Curator approved the spec as drafted ("Approve as drafted") and chose `scope:` globs in the spec over workstream matching. Feature tier, so plan_approved stays false (verbal agreement suffices, manual §5). Entering /brain:build.

## [2026-09-15] build | develop-lifecycle-fixes — AC-1…12
Test-first: 19 selftests added red, then guards.js scope matching + outside-project skip, lib.parseFrontmatter list parsing, wiki-check alias arrays, wrap.js consolidated Stop nudge, review/wrap/build/plan SKILL hand-offs, spec template `scope:`, manual §4/§10 + both READMEs, CHANGELOG 0.28.0, version bumps. selftest 354 → 372 ALL GREEN; both manifests validate --strict. Two ADRs filed: [[spec-scope-globs-gate-ownership]], [[one-stop-message-for-wrap-nudges]]. Research finding 9 corrected (Stop checks were individually tested). Spec → phase: review.
