---
title: "Spec — /brain:update"
type: spec
status: draft
tier: feature
phase: plan
plan_approved: false
tdd: true
scope: [plugin/hooks/scripts/update.js, plugin/hooks/scripts/update.test.js, plugin/skills/update/**, plugin/hooks/scripts/trigger-router.js, plugin/hooks/scripts/selftest.js]
created: 2026-11-24
updated: 2026-11-24
related: ["[[brain-update-command]]", "[[ideas]]", "[[brain-update-workstream]]"]
---

# /brain:update — spec

## Problem
Updating from the marketplace takes two steps people miss: refresh the marketplace and update the
`brain` plugin (then restart), and `/brain:init --update` in **every** project with a brain. Miss one
and a new plugin runs over an old brain, or the reverse.

## Goals / Non-goals
- Goal: one command that brings the plugin and every brain on the machine up to date, after one yes.
- Goal: never a half-done update — a failure before the plugin update changes nothing.
- Non-goal: restarting Claude Code (impossible from a skill; it says to).
- Non-goal: touching knowledge — the refresh is `new-brain.js --update` (CLAUDE.md, reference.md,
  templates/ only).
- Non-goal: updating `brain-all` or other plugins.
- Anti-goal: refreshing a brain on top of uncommitted `.brain/` work.

## Acceptance criteria
- **AC-1** — `update.js --check` runs `claude plugin marketplace update monkey-brain`, reads the
  installed `brain@monkey-brain` version and `installPath` from `claude plugin list --json`, the latest
  from the refreshed `marketplaces/monkey-brain/.claude-plugin/marketplace.json`, and every brain from
  `registry.list()` with its instance schema; it prints one plan:
  `plugin <installed> → <latest>` (or `plugin <v> is current`), the brains to refresh, and each skipped
  brain with its reason. It changes nothing.
- **AC-2** — A brain whose project has uncommitted changes under `.brain/` (`git status --porcelain
  .brain`) is skipped with reason `uncommitted .brain/ changes`; a project that isn't a git repo is not
  skipped for that; a registered root that no longer exists is skipped with `missing`.
- **AC-3** — Nothing behind (plugin current, every brain's schema equals the latest engine schema) →
  the plan says `everything is up to date` and `--apply` exits 0 without running any command.
- **AC-4** — `update.js --apply` runs the plugin update (`claude plugin update brain@monkey-brain`) only
  when the plugin is behind, then refreshes each non-skipped brain with the **new** version's
  `<installPath of the new version>/skills/init/scripts/new-brain.js --update --project <root>`.
- **AC-5** — No partial update: `claude` missing from PATH, the marketplace refresh failing (offline),
  or unreadable `list --json` → exit non-zero with the reason, no update run, no brain refreshed. The
  plugin update failing → no brain refreshed. One brain's refresh failing does not stop the others;
  each result is reported.
- **AC-6** — Each refreshed brain gets a `wiki/log.md` entry
  `## [YYYY-MM-DD] schema | /brain:update → engine <latest>`; the final report lists per-brain outcomes
  and ends with `restart Claude Code to load the new hooks and skills` when the plugin was updated.
- **AC-7** — `/brain:update` skill (`plugin/skills/update/SKILL.md`): runs `--check`, shows the plan,
  asks the curator one yes/no, runs `--apply` only on yes; needs no `.brain/` in the current project.
- **AC-8** — Router: "update the brain", "update monkey brain", "/brain:update", "is the plugin up to
  date", "update all brains" → `update`. A selftest case **added red before the fix**: the bare reply
  "all brains" does not route to `home`; "show all my brains" still does.
- **AC-9** — Docs and version: plugin README + skills README list `/brain:update`; reference.md names it
  next to `/brain:init --update`; [[ideas]] marks the idea specced; plugin 0.36.0 in plugin.json,
  marketplace.json, CHANGELOG and the README badge; selftest green on the CI matrix.

## Test plan
- AC-1…6: `update.test.js` (wired into selftest) runs `update.js` with an injected command runner and
  temp config dir: fake `claude` responses (current / behind / failing / missing), a temp registry with
  a clean git brain, a dirty git brain, a non-git brain and a missing root; asserts the printed plan,
  the exact commands run (and not run), the `new-brain.js` path used, the log entries written.
- AC-7: selftest asserts the skill file exists with `--check` before `--apply` and the yes/no step;
  manual run of `/brain:update` on this machine after release.
- AC-8: router selftest cases (misfire case committed red first).
- AC-9: existing version/README selftest checks extended to 0.36.0 and `update`.

## Notes & links
Research: [[brain-update-command]] · Idea: [[ideas]] · Workstream: [[brain-update-workstream]].
Design approved in conversation 2026-11-24: curator picked "A" (do the whole job), "all brains", then
"go ahead" on the short design. Blast radius (`graph.js radius` registry.js trigger-router.js
new-brain.js): `touches 5 file(s) across 2 module(s) · 1 file type(s) · score 10` → suggested tier
`feature`, sonnet to build, opus or fable to review.
