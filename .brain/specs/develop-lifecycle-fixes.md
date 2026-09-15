---
title: "Spec — Develop lifecycle fixes"
type: spec
status: active
tier: feature
phase: review
plan_approved: false
tdd: true
created: 2026-09-15
updated: 2026-09-15
related: [develop-lifecycle-dogfood, spec-scope-globs-gate-ownership, one-stop-message-for-wrap-nudges]
scope: [plugin/hooks/scripts/guards.js, plugin/hooks/scripts/lib.js, plugin/hooks/scripts/wrap.js, plugin/hooks/scripts/wiki-check.js, plugin/hooks/scripts/selftest.js, plugin/skills/**, plugin/README.md, plugin/CHANGELOG.md, schema/brain-template/**]
---

# Develop lifecycle fixes — spec

## Problem
Dogfooding the lifecycle on this repo ([[develop-lifecycle-dogfood]]) found four things a curator trips over when running research → plan → build → review → wrap in order:

1. The plan and TDD gates scan **every** open spec, so an unapproved architecture spec blocks source writes that belong to a different, approved spec (finding 7).
2. `/brain:review` has no hand-off: after a failed AC the spec "stays active" and nothing says to run `/brain:build` again; `/brain:wrap` then re-verifies ACs instead of trusting review's verdict (findings 3, 4).
3. The three Stop-time nudges (`wrap[log]`, `wrap[decisions]`, `wrap[git]`) each exit on first hit, so a clean wrap can take three Stop attempts, and none of them has a selftest (findings 8, 9).
4. The instance manual defines the lifecycle as four stages in §4 but appends `wrap` in §10, and the skills README restates it a third time (findings 1, 2).

## Goals / Non-goals
- Goal: a curator with several open specs is only gated by the spec that owns the file being written.
- Goal: every lifecycle skill names its successor, including review on failure and on success.
- Goal: one Stop-time message that lists every unmet wrap item, each path covered by selftest.
- Goal: one authoritative lifecycle definition in the manual; other docs cite it.
- Non-goal: a hard plan gate on new code with no spec (deliberately deferred in v0.24.0; no evidence yet the advisory hint is ignored).
- Non-goal: a numbered "8-step lifecycle" abstraction; the accurate model is four stages plus loop/wrap/digest/dump utilities.
- Non-goal: changing what the gates enforce (tiers, `plan_approved` ownership, TDD companion rules). Only *which* spec they consult changes.

## Acceptance criteria

**Gate scoping (guards.js)**
- **AC-1** ✅ `parseFrontmatter: inline [a, b] list → array · block "- item" list → array · scalars untouched` — A spec may declare `scope:` in frontmatter: a list of path globs relative to the project root (e.g. `plugin/hooks/scripts/guards.js`, `src/auth/**`). `lib.parseFrontmatter` returns it as an array; a missing field means "unscoped".
- **AC-2** ✅ `scoped: write inside an approved spec's scope passes · write inside the unapproved arch spec's scope is blocked by that spec · scoped TDD gate ×2` — When a source write targets a path matched by at least one open spec's `scope:`, the plan gate and TDD gate consult **only** the matching spec(s). An unapproved architecture spec whose scope does not match the path does not block the write.
- **AC-3** ✅ `unscoped path: falls back to every open spec · a write outside the project root is never tier-gated` — When no open spec's `scope:` matches the written path, the gates fall back to today's behaviour (consult every open spec), so existing brains without `scope:` fields see no change.
- **AC-4** ✅ `the six scoped/unscoped guards checks above` — Selftest covers: two open specs where the unscoped-matching write is blocked (AC-3), and two open specs where a scoped write to the approved spec's path passes while a write to the unapproved spec's path blocks (AC-2).
- **AC-5** ✅ `spec template carries a scope: line · /brain:plan tells the planner to fill scope: from the radius file list` — `templates/spec.md` carries a commented `scope: []` line, and `/brain:plan` step 2 tells the planner to fill it from the `graph.js radius` file list.

**Review hand-off (review + wrap skills)**
- **AC-6** ✅ `/brain:review names both exits` — `/brain:review` step 5 states both exits: any AC failed → set `phase: build`, list the blockers under a `## Blockers` heading in the spec, offer `/brain:build <slug>`; all ACs verified → set `status: done`, `phase: done`, offer `/brain:wrap`. The "Done when" line names the offered next command.
- **AC-7** ✅ `/brain:wrap trusts status: done and re-verifies only active specs` — `/brain:wrap` step 1 trusts a spec with `status: done` and re-verifies ACs only for specs still `active`; if wrap's recheck disagrees with a `done` spec it reports the disagreement and leaves the spec's status unchanged.
- **AC-8** ✅ `/brain:build states it never sets plan_approved` — `/brain:build` step 1 states that build never sets `plan_approved` itself.

**Consolidated Stop nudge (wrap.js)**
- **AC-9** ✅ `all three unmet → one block naming wrap[log], wrap[decisions] and wrap[git]` — On `Stop`, `wrap.js` runs all three checks, collects every unmet item, and blocks once with a single message listing them (`wrap[log]`, `wrap[decisions]`, `wrap[git]` labels preserved verbatim). The once-per-session markers remain per check, so an item already shown this session is omitted from later messages.
- **AC-10** ✅ `consolidated nudge fires once per session · pre-existing per-check tests (unlogged wiki work / decision nudge / uncommitted .brain/) still green` — Selftest exercises each check in isolation (only log lag, only missing ADR, only uncommitted git) and the all-three case, asserting one block per Stop and the labels present.

**Manual consistency (docs)**
- **AC-11** ✅ `manual §4 names loop, wrap, digest and dump · manual §10 cites §4 · skills README cites the manual` — Instance manual §4 (`skills/init/brain-template/CLAUDE.md`, mirrored in `schema/brain-template/CLAUDE.md`) defines the develop lifecycle once as four stages, then names loop, wrap, digest and dump with their position relative to the stages in one short paragraph. §10 and `plugin/skills/README.md` refer to §4 instead of restating the sequence.
- **AC-12** ✅ `selftest: ALL GREEN (372 checks) · claude plugin validate --strict ×2 passed · CHANGELOG 0.28.0 · plugin.json + marketplace.json 0.28.0` — `node plugin/hooks/scripts/selftest.js` is all green, both manifests validate with `--strict`, `plugin/CHANGELOG.md` records the change as v0.28.0, and the plugin version is bumped to match.

## Test plan
- AC-1..4, AC-9..10: new selftest fixtures in `plugin/hooks/scripts/selftest.js` (two-spec brains; Stop events with controlled mtimes and a scratch git repo), written before the code changes.
- AC-5..8, AC-11: grep assertions in selftest for the required phrases in the SKILL.md and manual files (the same style selftest already uses for skill existence), plus a manual read-through.
- AC-12: run selftest and `claude plugin validate --strict` on both manifests.

## Notes & links
Tier rationale: `graph.js radius` reports "touches 2 file(s) across 1 module(s) · 1 file type(s) · score 2 · suggested tier: quick". Raised to **feature** because the change alters gate behaviour that every brain relies on; the TDD gate should apply. Not architecture: no interface others depend on changes (the `scope:` field is additive and optional).

Assumptions to confirm with the curator: (a) `scope:` globs rather than matching by `projects/` workstream; (b) the consolidated Stop message replaces the v0.27.0 one-check-per-Stop behaviour rather than sitting behind a flag.

**Build deviations (2026-09-15):**
- Research finding 9 was partly wrong: the three Stop checks *did* each have a selftest (matching their reason text, not the `wrap[` label the researcher grepped). AC-10's "each check in isolation" therefore already held; the new tests cover the all-three case and the once-per-session marker. Research page corrected.
- AC-3 gained a clause found during the build: the TDD gate blocked a write to the session scratch directory, outside the project root. Writes outside the project root are now never tier-gated (tested).
- `lib.parseFrontmatter` list parsing is global (every field), which required `wiki-check.js` alias extraction to accept arrays; one existing instinct fixture (`confidence:` bare with a trailing comment) caught a first attempt that turned bare keys into empty arrays — fixed so a bare `key:` stays `''` unless `- item` lines follow.

Decisions: [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]] · Research: [[develop-lifecycle-dogfood]] · PRs: none
