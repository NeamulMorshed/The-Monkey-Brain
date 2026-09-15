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

## [2026-09-15] review | develop-lifecycle-fixes
Suite re-run (never the ticks): 12/12 ACs met. Independent adversarial pass (opus, read-only) on the hook diff found 2 P0 (glob→regex passes clobbered each other → `src/**/*.js` matched nothing and an unapproved arch spec could be bypassed; unbalanced `[` threw → fail-open), 1 P1 (doctor/lint alias extractors still string-only), 5 P2 (parser edge cases, `..odd` dir). All fixed and pinned: selftest 372 → 390 ALL GREEN. Filed [[develop-lifecycle-fixes-review]]; spec → status: done, phase: done.

## [2026-09-15] session | lifecycle dogfood wrapped — v0.28.0
research → plan → build → review → wrap all ran on this repo and each left its commit (52b7157 … edb0500). Verified: selftest 390 ALL GREEN, both manifests --strict, spec develop-lifecycle-fixes done. Resume narrative rewritten; pushed to origin/main. Next: reinstall the plugin locally so the running hooks are 0.28.0; spec the doctor/lint link-scope gap.

## [2026-09-15] research | research-first-entry
Curator: the lifecycle should start from research by default, with an explicit skip. Two researcher slices (router/skills code; docs + history). Findings: research fires only on the literal word or idea-validation phrases; generic dev intent hits the v0.24.0 plan-before-build catch-all which never names research; the router reads specs but not wiki/research/; /brain:plan only *offers* research; no doc states an entry rule. Recommendation: research-first router default with related-research detection, skip phrases, a plan-step rule (quick tier exempt), docs stating the entry rule once. Filed [[research-first-entry]]; next `/brain:plan research-first-entry`.

## [2026-09-15] plan | research-first-entry
Drafted `specs/research-first-routing.md` from [[research-first-entry]]: feature tier (graph radius says quick, but the change alters the every-prompt router plus four doc surfaces), 10 ACs — research-first router default (AC-1), curator skip phrases (AC-2), related-research detection from wiki/research/ frontmatter (AC-3, AC-9), unchanged open-spec/question/no-brain behaviour (AC-4, AC-5), plan step 1 becomes a rule with quick exempt (AC-6), research early-exit (AC-7), entry rule stated once in the manual (AC-8), release checklist (AC-10). Awaiting curator walk-through.

## [2026-09-15] build | research-first-routing — AC-1…10
Test-first (19 red → green, selftest 390 → 408). trigger-router: catch-all enters at brain:research; related-research detection over wiki/research/ frontmatter (title/tags/aliases/slug token overlap, stop-listed dev vocabulary, first 8 KB, fail-open); skip phrases enter at plan and also suppress the literal-research rule; open-spec → build unchanged; no-brain hint names the lifecycle. /brain:plan step 1 is a rule (quick exempt); /brain:research early-exits when a page already answers; manual §4 states the entry rule (both copies), README row + skills README echo it. ADR [[research-first-entry-is-advisory]]. CHANGELOG 0.29.0, manifests bumped. Spec → phase: review.
