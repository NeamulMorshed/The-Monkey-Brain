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

## [2026-09-15] review | research-first-routing
Suite re-run: 10/10 ACs met. Live-brain probes + independent adversarial pass (opus): 0 P0, 6 P1 (`trivial` matched inside `non-trivial`; "should not skip research" read as a skip; two drifting copies of the skip pattern so "no need for research" routed *to* research; one shared token cited a page; five-letter plurals escaped the stop-list; two AC-3 assertions vacuous), 4 P2 (no-brain hint ignored the skip; unbounded citation list; "no research paper parser" and "trivial-looking" read as skips). All fixed and pinned: selftest 408 → 417. Filed [[research-first-routing-review]]; spec → done.

## [2026-09-15] session | research-first routing wrapped — v0.29.0
research → plan → build → review → wrap ran end to end for the second time today (49ec95d … 32a7789). Verified: selftest 417 ALL GREEN, both manifests --strict, spec research-first-routing done. Resume narrative rewritten; pushed; plugin reinstalled locally at 0.29.0.

## [2026-09-15] build | 0.29.1 — selftest from a marketplace install
The installed 0.29.0 cache's selftest threw ENOENT: the new AC-8 drift check read schema/brain-template/CLAUDE.md unconditionally, and marketplace installs ship only plugin/. Guarded with existsSync like the older drift check. Patch release 0.29.1; no behaviour change.

## [2026-09-15] research | brain-health-audit
Curator asked for a full review of the brain: standard, hooks, plugins, MCP, tokens, context management, model routing. Ran doctor/lint/selftest/validate/usage, probed every prompt hook, analysed model-switch cache cost over 15 transcripts, plus two read-only subagent audits (hook code on opus, skills/docs on the main model). 2 P0 (resume split-brain; gates off under a test/spec parent folder), 8 P1 (false doctor critical + phantom dispatches, link scope, Stop nags on hook writes, no engine knowledge, superpowers second lifecycle, dead security-guidance/github deps, librarian tools, leaky model block), 15 P2. Measured: ~270k tokens re-read per call; mid-session model switches cause 25 % of cache writes. Filed [[brain-health-audit]]; recommends specs brain-correctness → token-diet → engine-knowledge.

## [2026-09-15] plan | brain-correctness
Spec drafted from [[brain-health-audit]]: 15 ACs — one resume resolver + silent seed (AC-1…3), gates on project-relative paths + shared containment + log `updated:` check (AC-4…6), section-aware P0, phantom-free dispatch ledger, CI-by-workflow (AC-7…9), per-dispatch model block (AC-10), Stop nudges skip hook-owned files (AC-11), table-link orphans, librarian tools, § references and README counts (AC-12…14), release 0.30.0 (AC-15). Tier architecture (graph radius score 108, via lib.js). plan_approved: true on the curator's word: "do all of these one by one, on your own". Workstream projects/brain-hardening.md created.

## [2026-09-15] build | brain-correctness — AC-1…14
Test-first: 19 red → green, selftest 417 → 447 ALL GREEN. New `lib` helpers `resumePath`, `isSeedResume`, `inProject`, `openP0Lines`, `mdSection`; resume.js / resume-log.js / snapshot.js share the resolver; guards judge project-relative test paths; agent-track blocks per dispatch and skips fork phantoms; wrap nudges skip hook-owned files; doctor #7/#14/#18/#19 fixed; table-escaped links; librarian inline steps + WebFetch; § refs and README counts. Deviations in the spec Notes. CHANGELOG + manifests 0.30.0. Live doctor on this brain: 0 critical. Spec → phase: review.

## [2026-09-15] plan | token-diet
Drafted `specs/token-diet.md` from [[brain-health-audit]]: 10 ACs — one model-routing table in manual §5 (AC-1), no main-thread model pins: `model:` only with `context: fork` (AC-2), research synthesis on the session model (AC-3), context-size nudge in recall.js at ≥150k (AC-4), manual split into `reference.md` ≤10 KB + engine v2.1 (AC-5), descriptions ≤300 B (AC-6), ≥9,000 always-loaded bytes saved (AC-7), 3 bundled dependencies (AC-8), cheaper ingest/lint/wrap instructions (AC-9), release 0.31.0 (AC-10). Tier feature (radius score 45). PreModelSwitch hook dropped: skill switches don't fire it and `ask` is undocumented. Starts after brain-correctness closes.

## [2026-09-15] review | brain-correctness
Suite re-run: 15/15 ACs met. Independent adversarial pass (Opus vs a Sonnet build, probes against the pre-commit scripts): 0 P0, 2 P1 (negated headings like "Not fixed yet" closed open P0s; the hook-owned filter over-matched real pages named resume.md or under sessions/), 4 P2 (resume lookup from a subdirectory, seed edge cases, `updated:` with a time, copies/dead code/docs + a model-block opt-out). Five fixed and pinned, one declined with reason: selftest 447 → 463 ALL GREEN, both manifests --strict. Filed [[brain-correctness-review]]; spec → done.

## [2026-09-15] build | token-diet — AC-1…9
Test-first: 21 red → green, selftest 463 → 484 ALL GREEN. Manual §5 carries the one model-routing table (haiku/sonnet/opus/fable, fork-not-switch, effort medium), cited by agent-track, graph.js, the skills README and /brain:usage; six skills fork (`model:` + `context: fork`), eight lost their pins; research synthesizes on the session model; recall.js adds a context nudge past 150k (once per 100k band); the manual splits into CLAUDE.md (9.9 KB, engine v2.1) + an on-demand reference.md; descriptions ≤300 B (9.9 → 6.0 KB); always-loaded bytes 26,491 → 16,550; code-modernization offered instead of bundled; cheaper ingest/lint/wrap wording. This repo's brain refreshed with `new-brain.js --update`. ADR [[fork-not-switch-model-routing]]. Built on the main model without re-invoking `/brain:build` (then pinned to Sonnet — the very switch this spec removes). Spec → phase: review.
