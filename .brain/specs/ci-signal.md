---
title: "Spec — CI signal: drift issues and doctor #21"
type: spec
status: active
tier: feature
phase: build
plan_approved: false
tdd: true
scope: [.github/workflows/bundle-drift.yml, plugin/skills/doctor/**, plugin/hooks/scripts/selftest.js, plugin/README.md, plugin/skills/README.md, plugin/skills/init/brain-template/reference.md, README.md, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**]
created: 2026-11-09
updated: 2026-11-09
related: ["[[router-and-drift]]", "[[router-and-drift-review]]"]
---

# CI signal: drift issues and doctor #21 — spec

## Problem
The weekly `bundle-drift` job went red on 2026-10-12 and stayed red for five runs; nobody saw it,
because a failed *scheduled* run sends no push signal, and doctor only checks that CI exists (#19),
not that it passes. Meanwhile `brain-all` was unloadable for every user (the catalog dropped
`data-agent-kit-starter-pack`). Fixed by hand in brain-all 0.15.0; this spec makes the next one loud.

## Goals / Non-goals
- Goal: a drift failure lands in the curator's GitHub notifications (an issue), once per episode.
- Goal: doctor (and so the next session-start status) names any red workflow on the default branch.
- Non-goal: auto-regenerating the bundle in CI (a dependency change stays a reviewed release).
- Non-goal: a hard gate — red CI is a warning; `/brain:wrap` already treats red CI as not done.

## Acceptance criteria

**Drift job files an issue**
- **AC-1** — `bundle-drift.yml` grants `issues: write` (and `contents: read`), runs the check under `shell: bash` with `pipefail`, and keeps its output for the issue body.
- **AC-2** — On failure, the job opens an issue labelled `bundle-drift` (creating the label if missing) with the check output and the run URL; when one is already open it comments on it instead of opening another.
- **AC-3** — On success, the job closes any open `bundle-drift` issue with a "green again" comment and the run URL; with none open it does nothing.
- **AC-4** — Verified live: a dispatch on a branch with a stale bundle opens the issue; a second failing dispatch comments on it; a dispatch on `main` closes it.

**Doctor #21 `ci-status`**
- **AC-5** — Doctor runs 21 checks; #21 `ci-status` reads, per workflow file in `.github/workflows/`, the latest *completed* run on the default branch via `gh run list`.
- **AC-6** — Any latest run concluded `failure` (or `timed_out` / `startup_failure`) → `warn`, naming the workflow, the date, the run id and `gh run view <id> --log-failed`. All green → `ok`, naming the workflows.
- **AC-7** — No workflows, `gh` missing, not logged in, offline or timing out → `info`, never `warn`; a workflow with no completed run yet is skipped. Doctor stays usable without GitHub.
- **AC-8** — `MONKEY_BRAIN_GH` overrides the `gh` binary (a `.js` path runs under node) so tests stub it; the finding reaches `sessions/health.json` and so the next session's status line.
- **AC-9** — Docs say 21 checks (README ×2, plugin README, skills README, doctor SKILL.md, scaffold reference.md); doctor's SKILL.md routes a red #21 to `gh run view --log-failed`.

**Release**
- **AC-10** — selftest ALL GREEN; both manifests `--strict`; plugin 0.34.0 in both manifests, the CHANGELOG and the README badge; pushed CI green.

## Test plan
- AC-1–3: selftest static checks over `bundle-drift.yml` (permissions, pipefail, `failure()` / `success()` steps, label, comment-if-open, close-on-green).
- AC-4: manual live run — temp branch `drift-test` with the 0.14.1 manifest, `gh workflow run bundle-drift.yml --ref drift-test` ×2, then `--ref main`; check `gh issue list --label bundle-drift --state all`. Delete the branch afterwards.
- AC-5–8: selftest with a stub `gh` (a node script reading a fixture): red, green, mixed, in-progress-only, gh exit 1 (not logged in), missing binary, no workflows dir; assert level + detail + health.json.
- AC-9: selftest greps the six docs for "21-check" / "21 checks" and no stale "20-check".
- AC-10: the CI `run:` steps locally, then `gh run list` after push.

## Notes & links
Origin: the 2026-11-09 session-start doctor + `gh run list` ([[log]]). Prior drift: [[router-and-drift-review]] finding 2.
