---
title: "Spec — Router misfires, dependency health, docs drift"
type: spec
status: done
tier: feature
phase: done
audit_score: "done — 0 P0 / 2 P1 / 12 P2 found in review, all fixed; see router-and-drift-review"
plan_approved: false
tdd: true
scope: [plugin/hooks/scripts/trigger-router.js, plugin/hooks/scripts/instinct-track.js, plugin/hooks/scripts/wrap.js, plugin/hooks/scripts/selftest.js, plugin/skills/doctor/**, plugin/skills/home/**, plugin/skills/wrap/**, plugin/skills/init/brain-template/**, schema/**, bundles/**, bootstrap/**, plugin/README.md, README.md, plugin/skills/README.md, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**]
created: 2026-09-16
updated: 2026-09-16
related: ["[[brain-health-audit]]", "[[engine-knowledge]]", "[[trigger-router]]", "[[router-and-drift-review]]"]
---

# Router misfires, dependency health, docs drift — spec

## Problem
The router misroutes and misses ([[brain-health-audit]] P2 #11–14, reproduced with file:line by a router probe on 2026-09-16): questions are exempt only from the dev catch-all, so "why did the research-first routing misfire?" fires research; "create a new doctor check for the brain" fires init; the noun "research" in a curator's sentence fires research; subagent hand-back text fires ingest; audit phrasings ("review the entire brain") route nowhere; a brainless repo gets the init offer on every prompt; the open-spec list is uncapped. Dead dependencies stay invisible (finding 8): nothing checks that security-guidance has a Python or the github MCP a token. And the docs drift: the `brain-all` bundle fails its own `--check` (293 vs 295), `schema/CLAUDE.md` + `schema/templates/` are dead v1 copies, the bootstrap scripts lag `new-brain.js`, and two hook-owned files grow forever (P2 #18, #21–24).

## Goals / Non-goals
- Goal: the router fires on instructions, never on questions, pasted reports, or incidental nouns; audit requests reach `/brain:doctor`.
- Goal: doctor names a dependency that cannot run, and the fix.
- Goal: one source of truth for scaffolding and a bundle that matches the catalog.
- Non-goal: rewriting the router; changing link resolution or knowledge ([[engine-knowledge]]).

## Acceptance criteria

**Router (P2 #11–14)**
- **AC-1** ✅ `a question that mentions research is silent` — The literal-`research` rule is exempt on questions like the dev catch-all: "Why did the research-first routing misfire?" → silent.
- **AC-2** ✅ three `"…" enters the dev lifecycle, not init / doctor / dump` checks; the existing init / doctor / dump routes stay green — Specific rules stop swallowing dev intent: "create a new doctor check for the brain" and "add a check to the brain doctor that flags stale specs" → the dev lifecycle, not init / doctor; "we decided to use postgres, now build the auth endpoint" → the dev lifecycle, not dump. The existing init / doctor / dump selftests stay green.
- **AC-3** ✅ `the noun "research" … does not fire research` · `"research competitor pricing models" still fires research` — The noun "research" (research purpose / mode / paper / parser) does not fire research; "research competitor pricing models" still does.
- **AC-4** ✅ two `a pasted subagent report is silent` checks — Pasted subagent reports ("[Subagent hand-back] …", "… The report follows: …") are silent.
- **AC-5** ✅ four `"…" routes to brain:doctor` checks · review and lint regressions — Audit phrasings reach `brain:doctor`: "review the entire brain", "audit all plugins and hooks", "is the brain working properly", "check the entire brain and review how it works"; "review the changes on this branch" still reaches review and "lint the brain" lint.
- **AC-6** ✅ `without a brain the /brain:init offer appears once per session` · `the dev hint lists at most 8 open specs, then "+N more"` — In a brainless repo the `/brain:init` offer appears once per session; the dev hint lists at most 8 open specs, then "+N more".

**Dependency health (finding 8)**
- **AC-7** ✅ three `doctor 20:` checks · `doctor runs all 20 checks` · `exactly 20 findings`; every "19-check" mention updated — Doctor check #20 `dependency-health`: an enabled `security-guidance` needs a Python ≥ 3.10 (`python3`, `python` or `py -3`), an enabled `github` plugin needs `GITHUB_PERSONAL_ACCESS_TOKEN` (process env or a settings `env`); each missing one is a warning naming the fix; otherwise ok. Doctor reports 20 checks and every "19-check" mention says 20.

**Docs drift (P2 #18, #21–24)**
- **AC-8** ✅ `the plugin README release checklist runs gen-brain-all --check` · `the dead v1 schema/CLAUDE.md and schema/templates/ are gone`; `gen-brain-all.js --check` → "295 official deps · catalog has 295" — `bundles/brain-all` is regenerated (`gen-brain-all.js --check` passes) and the release checklist says to run it; the dead `schema/CLAUDE.md` and `schema/templates/` are removed.
- **AC-9** ✅ `bootstrap scripts wrap new-brain.js and lint.js` · `new-brain.sh scaffolds through new-brain.js, reference.md included` — `bootstrap/new-brain.sh` and `bootstrap/new-brain.ps1` are thin wrappers over `node plugin/skills/init/scripts/new-brain.js` (same flags), and `bootstrap/lint-brain.ps1` over `lint.js`.
- **AC-10** ✅ three wording checks — The READMEs call `/brain:home`'s registry "this machine's project registry" (not cross-machine); `/brain:wrap` lists every log prefix as a commit prefix; `reference.md` §10 names the game design doc's type and folder that `/brain:game` files (on-demand, so the always-loaded manual stays ≤ 10,000 bytes).
- **AC-11** ✅ `edit-counts.json keeps the 500 most recently revised files` · `SessionEnd prunes session markers older than 7 days and keeps fresh ones` — Growth is bounded: `instinct-track`'s `edit-counts.json` keeps at most 500 files, dropping the least recent; SessionEnd prunes the brain's `mb-*` session markers in the OS temp dir older than 7 days.

**Release**
- **AC-12** ✅ — selftest ALL GREEN; both manifests `--strict`; CHANGELOG and manifests `0.33.0`. *(Review evidence: selftest 579 ALL GREEN after the review fixes; `--strict` ×2; 0.33.0 in both manifests, the CHANGELOG and the README badge; `brain-all` 0.14.1, `gen-brain-all.js --check` → "294 official deps · catalog has 294".)*

## Test plan
Selftest, red first: AC-1…6 the 12 router cases from the probe report (prompt → route or silence), including a two-prompt same-session no-brain case and a 10-open-spec fixture; AC-7 doctor with an interpreter override and an env token set/unset (fixture settings); AC-8 the release checklist and the two paths absent; AC-9 the wrappers call `new-brain.js` / `lint.js` (text) and a scaffold through the `.sh` wrapper where bash exists; AC-10 text checks; AC-11 a 600-file `edit-counts.json` trimmed to 500 and an old marker removed; AC-12 by the reviewer.

## Notes & links
- Research: [[brain-health-audit]] (P2 #11–14, #18, #21–24; finding 8) and the 2026-09-16 router probe (misfires reproduced at `trigger-router.js` rules init, ingest, doctor, dump, research, `openSpecs()`, `devHint()` and `main()`; fixes are regex-local, no rule-order rewrite).
- Tier: `graph.js radius` → "touches 4 file(s) across 3 module(s) · 1 file type(s) · score 12 · suggested tier: feature". Verbal approval suffices: the curator said "do all of those on your own".
- AC-10 revised before build: the GDD's type row lives in `reference.md` §10, not the manual's type table — the manual was at 9,973 of its 10,000 bytes, and a pack-specific row does not belong in every session's context.
- **Build (2026-09-16):** 25 checks red first, then green; selftest 523 → 551 ALL GREEN. The tests and the fix were first run as a dry run on a scratch copy of the tree, which caught two problems before any repo write. ADR [[router-ignores-questions-and-reports]].
- **Build deviations:** (1) the dry run found a `q` identifier collision in the new test block (renamed `rq`). (2) Stripping `PATH` cannot fake a missing Python on Windows — the process loader still finds the interpreter — so the doctor #20 probe honours `MONKEY_BRAIN_PYTHON`, which the tests point at a missing command; it doubles as a knob for a non-standard interpreter name. (3) The once-per-session init marker is keyed by session and a hash of the project root, so a new selftest run never inherits one; two existing tests that re-offer init now use their own sessions. (4) The bundle's `--check` is in the release checklist, not the selftest: the upstream catalog moves on its own, so a selftest check would start failing without any change here. (5) The `trigger-router` and `doctor-health-checks` concept pages are updated after the concurrent knowledge-fix pass on the same pages finishes.
- **Review (2026-09-16):** [[router-and-drift-review]] — 12/12 ACs met; 0 P0, 2 P1, 12 P2, all fixed in review with 28 new checks (27 red first), selftest 551 → 579. AC-4's second case encoded a false positive ("…The report follows:" anywhere in a prompt) and was replaced by a teammate-message case; AC-6 now also requires dev prompts to keep their lifecycle line after the one init offer; AC-8's catalog dropped `small-business`, so the bundle was regenerated (294/294, 0.14.1) and a weekly `bundle-drift` CI job now checks it. Spec → done.
