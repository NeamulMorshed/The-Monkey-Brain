---
title: "Spec — Research-first entry to the develop lifecycle"
type: spec
status: done
tier: feature
phase: done
audit_score: "done — 0 open findings (0 P0, 6 P1, 4 P2 found in review, all fixed + pinned; selftest 417 green)"
plan_approved: false
tdd: true
scope: [plugin/hooks/scripts/trigger-router.js, plugin/hooks/scripts/selftest.js, plugin/skills/plan/**, plugin/skills/research/**, plugin/skills/README.md, plugin/README.md, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**, plugin/skills/init/brain-template/CLAUDE.md, schema/brain-template/CLAUDE.md]
created: 2026-09-15
updated: 2026-09-15
related: ["[[research-first-entry]]", "[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes]]"]
---

# Research-first entry to the develop lifecycle — spec

## Problem
The manual says the develop lifecycle is research → plan → build → review, but the only automated entry point for a development request ("add a login feature") is the v0.24.0 plan-before-build hint, which routes to `/brain:plan` and never mentions research. Research runs only when the curator types the word. Inside `/brain:plan`, research is an offer with an always-available "record the evidence gap" escape, so the model skips it. Curator's decision (2026-09-15): "it should start from research. if a user doesn't want to research then they can skip this but by default the brain should start from research for this life cycle." Evidence: [[research-first-entry]].

## Goals / Non-goals
- Goal: generic development intent enters the lifecycle at `/brain:research` by default.
- Goal: one explicit, curator-only skip that enters at plan instead, recognised at routing time and honoured inside `/brain:plan`.
- Goal: the router recognises research the brain already holds and routes to plan citing it, so research is never re-run for a topic already covered.
- Goal: the entry rule is stated once in the manual and echoed by the README.
- Non-goal: a hard gate in `guards.js` that blocks spec creation without a research page. The hint stays advisory, as plan-before-build was in v0.24.0.
- Non-goal: changing how an open spec routes to `/brain:build`, or how question phrasing stays silent.
- Non-goal: research for `quick`-tier work.

## Acceptance criteria
- **AC-1** ✅ `four generic phrases enter at brain:research, then plan, then build; rule line + closing skip sentence asserted` — Generic dev intent, no open spec covering it, no related research: the router hint names `brain:research` as the step to invoke now, then `brain:plan`, then `brain:build`; its rule line reads "research → plan → build — no source change without a spec"; it ends with "Skip research only if the curator explicitly says so in this message."
- **AC-2** ✅ `six skip phrasings route to brain:plan and say "skipped at the curator's word" · with open specs a skip offers build/plan, never research` — The same intent phrased with a skip (`skip research`, `skip the research`, `no research`, `without research`, `just plan it` / `just build it` / `just fix it` / `just do it`, `quick fix`, `trivial`) routes to `brain:plan` (or `brain:build <slug>` when an open spec covers it) and states that research was skipped at the curator's word.
- **AC-3** ✅ `related research routes to brain:plan citing `payments-gateway` · unrelated login still enters at research · dev nouns never count as overlap` — Related-research detection: the router reads the frontmatter (`title`, `tags`, `aliases`) and slug of every `wiki/research/*.md`; a page is *related* when it shares at least one significant token (≥ 5 letters, not in a small stop-list, not one of the dev verbs/nouns in the catch-all regex) with the prompt. When one or more related pages exist the hint routes to `brain:plan`, lists them as "Related research: `<slug>`…", and does not ask for a new research run.
- **AC-4** ✅ `questions silent · .no-brain silent · no brain → init then research → plan → build · open specs listed with tier/phase, done excluded, brain:build offered` — An open spec that covers the request still routes to `brain:build <slug>` and lists open specs with tier and phase, excluding `done` ones; question phrasing (`why/what/how…`) stays silent; `.no-brain` silences the hint; a project with no brain suggests `brain:init` then the lifecycle. The existing selftest checks for these are updated to the new wording, not deleted.
- **AC-5** ✅ `"write a spec" → plan, "implement the spec" → build, "research X" → research, all without the catch-all rule line` — Specific-workflow rules still win over the catch-all: "write a spec" → plan, "implement the spec" → build, "research X" → research, "validate this idea" → research (existing checks stay green).
- **AC-6** ✅ `/brain:plan step 1 is a rule: must run /brain:research first, quick exempt, "or record the evidence gap" gone` — `/brain:plan` step 1 is a rule, not an offer: a `feature` or `architecture` spec with no `wiki/research/` page cited must run `/brain:research` first, unless the curator said skip in this conversation, in which case the skip and its wording are recorded in the spec's Notes. `quick` tier is exempt. Selftest asserts the wording.
- **AC-7** ✅ `/brain:research exits early when a page already answers, handing to /brain:plan` — `/brain:research` step 2 gains an early exit: when an existing `wiki/research/` page already answers the question, cite it, add nothing, and hand to `/brain:plan` instead of re-running. Selftest asserts the wording.
- **AC-8** ✅ `manual §4 states the entry rule · README hook #2 row + skills README say research → plan → build with the skip · bundled manual === schema master` — The instance manual §4 states the entry rule in one sentence ("A new feature request enters at research; say 'skip research' to enter at plan"); README hook #2 row and `skills/README.md` say the same; `schema/brain-template/CLAUDE.md` and the bundled copy stay identical.
- **AC-9** ✅ `a missing wiki/research/ never throws · a research page with broken frontmatter does not crash the router (reads first 8 KB, only when the catch-all fires)` — Router cost stays bounded: related-research detection reads only `wiki/research/*.md` frontmatter (first 8 KB per file) and runs only when the catch-all rule fires, never on other prompts. A malformed or missing `wiki/research/` never throws (fail open to "no related research").
- **AC-10** ✅ `selftest: ALL GREEN (417 checks after review fixes) · claude plugin validate --strict ×2 · CHANGELOG 0.29.0 · plugin.json + marketplace.json 0.29.0` — `node plugin/hooks/scripts/selftest.js` ALL GREEN; both manifests validate `--strict`; CHANGELOG 0.29.0 entry; `plugin.json` and `marketplace.json` bumped to 0.29.0.

## Test plan
- AC-1..5, AC-9: selftest hook #2 block — fixture brain with (a) no research pages, (b) a research page whose tags overlap the prompt, (c) an open spec covering the prompt, (d) skip phrasings; assert routed skill, rule line, skip sentence, "Related research:" listing, and that a research page with broken frontmatter does not crash the router.
- AC-6, AC-7, AC-8: selftest docs assertions on `plan/SKILL.md`, `research/SKILL.md`, the manual §4 section, README row, skills README; the existing template-drift check covers schema vs bundled copy.
- AC-10: the release checklist commands.

## Notes & links
**Review (2026-09-15):** [[research-first-routing-review]] — verdict done; 6 P1 (skip pattern polarity, `non-trivial`, two drifting skip copies, one-token citations, five-letter plurals, vacuous AC-3 tests) + 4 P2, all fixed in-review and pinned.

**Build (2026-09-15):** test-first, 19 red → green. Discovery: "skip research and add X" matched the literal-`research` rule before the catch-all and routed *to* research — the research rule now carries a `not:` skip pattern (AC-2). The first draft of the router tests used `/invoke brain:research/` while the hint says "invoke the brain:research skill", so several assertions passed vacuously; fixed to the real phrase. `/brain:init --update` on this repo dropped the instance display name (defaults to the folder name) — re-run with `--name`.

Tier rationale: `graph.js radius` says `touches 1 file(s) across 1 module(s) · 1 file type(s) · score 1 → quick`, but the graph only sees imports; the change alters a hook that runs on every prompt in every brain, plus four skill/doc surfaces, so `feature` (TDD gate on, selftest is the test companion) is the honest tier. No `plan_approved` needed.

Research: [[research-first-entry]] · Extends: [[develop-lifecycle-dogfood]], [[develop-lifecycle-fixes]] · Decisions: [[research-first-entry-is-advisory]]
