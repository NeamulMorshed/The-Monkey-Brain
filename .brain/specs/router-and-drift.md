---
title: "Spec — Router misfires, dependency health, docs drift"
type: spec
status: active
tier: feature
phase: plan
audit_score:
plan_approved: false
tdd: true
scope: [plugin/hooks/scripts/trigger-router.js, plugin/hooks/scripts/instinct-track.js, plugin/hooks/scripts/wrap.js, plugin/hooks/scripts/selftest.js, plugin/skills/doctor/**, plugin/skills/home/**, plugin/skills/wrap/**, plugin/skills/init/brain-template/**, schema/**, bundles/**, bootstrap/**, plugin/README.md, README.md, plugin/skills/README.md, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**]
created: 2026-09-16
updated: 2026-09-16
related: ["[[brain-health-audit]]", "[[engine-knowledge]]", "[[trigger-router]]"]
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
- **AC-1** — The literal-`research` rule is exempt on questions like the dev catch-all: "Why did the research-first routing misfire?" → silent.
- **AC-2** — Specific rules stop swallowing dev intent: "create a new doctor check for the brain" and "add a check to the brain doctor that flags stale specs" → the dev lifecycle, not init / doctor; "we decided to use postgres, now build the auth endpoint" → the dev lifecycle, not dump. The existing init / doctor / dump selftests stay green.
- **AC-3** — The noun "research" (research purpose / mode / paper / parser) does not fire research; "research competitor pricing models" still does.
- **AC-4** — Pasted subagent reports ("[Subagent hand-back] …", "… The report follows: …") are silent.
- **AC-5** — Audit phrasings reach `brain:doctor`: "review the entire brain", "audit all plugins and hooks", "is the brain working properly", "check the entire brain and review how it works"; "review the changes on this branch" still reaches review and "lint the brain" lint.
- **AC-6** — In a brainless repo the `/brain:init` offer appears once per session; the dev hint lists at most 8 open specs, then "+N more".

**Dependency health (finding 8)**
- **AC-7** — Doctor check #20 `dependency-health`: an enabled `security-guidance` needs a Python ≥ 3.10 (`python3`, `python` or `py -3`), an enabled `github` plugin needs `GITHUB_PERSONAL_ACCESS_TOKEN` (process env or a settings `env`); each missing one is a warning naming the fix; otherwise ok. Doctor reports 20 checks and every "19-check" mention says 20.

**Docs drift (P2 #18, #21–24)**
- **AC-8** — `bundles/brain-all` is regenerated (`gen-brain-all.js --check` passes) and the release checklist says to run it; the dead `schema/CLAUDE.md` and `schema/templates/` are removed.
- **AC-9** — `bootstrap/new-brain.sh` and `bootstrap/new-brain.ps1` are thin wrappers over `node plugin/skills/init/scripts/new-brain.js` (same flags), and `bootstrap/lint-brain.ps1` over `lint.js`.
- **AC-10** — `/brain:home` says "this machine's project registry" (not cross-machine); `/brain:wrap` lists every log prefix as a commit prefix; the manual's type table has the game design doc row that `/brain:game` files.
- **AC-11** — Growth is bounded: `instinct-track`'s `edit-counts.json` keeps at most 500 files, dropping the least recent; SessionEnd prunes the brain's `mb-*` session markers in the OS temp dir older than 7 days.

**Release**
- **AC-12** — selftest ALL GREEN; both manifests `--strict`; CHANGELOG and manifests `0.33.0`.

## Test plan
Selftest, red first: AC-1…6 the 12 router cases from the probe report (prompt → route or silence), including a two-prompt same-session no-brain case and a 10-open-spec fixture; AC-7 doctor with a fake `PATH` without Python and with an env token set/unset (fixture settings); AC-8 `gen-brain-all.js --check` exit 0 and the two paths absent; AC-9 the wrappers call `new-brain.js` / `lint.js` (text) and a scaffold through the `.sh` wrapper where bash exists; AC-10 text checks; AC-11 a 600-file `edit-counts.json` trimmed to 500 and an old marker removed; AC-12 by the reviewer.

## Notes & links
- Research: [[brain-health-audit]] (P2 #11–14, #18, #21–24; finding 8) and the 2026-09-16 router probe (misfires reproduced at `trigger-router.js:36, :42, :54, :90, :143-149, :288-296, :312, :318, :322, :326-332`; fixes are regex-local, no rule-order rewrite).
- Tier: `graph.js radius` → "touches 4 file(s) across 3 module(s) · 1 file type(s) · score 12 · suggested tier: feature". Verbal approval suffices: the curator said "do all of those on your own".
- Starts after [[engine-knowledge]] closes (both edit `selftest.js` and doctor).
