---
title: "Research — Develop lifecycle dogfood"
type: research
status: active
tags: [lifecycle, dogfood, hooks, skills]
created: 2026-09-15
updated: 2026-09-15
sources: []
related: []
---

# Develop lifecycle dogfood — research

> **Question:** does running the plugin's own develop lifecycle (research → plan → build → review → loop → wrap, with digest/dump as daily drivers) end to end on a real feature work without a curator tripping, and where are the gaps? · **For:** [[develop-lifecycle-fixes]] (spec to be planned)

Method: three read-only `brain-researcher` slices (skill docs + instance manual, hooks + selftest, roadmap/changelog history), then the four highest-severity claims re-verified against source by the lead. All paths below are relative to `plugin/` in this repo (identical to the installed `brain@0.27.0`).

## Findings

### A. What the lifecycle actually is (docs slice)
1. **The canonical lifecycle is 4 stages, not 8.** Instance manual §4 defines "Develop (research → plan → build → review)" and nothing more (`skills/init/brain-template/CLAUDE.md:123-126`). `loop` is a wrapper that repeats build/research/design (§4, lines 129-132); `digest` and `dump` are listed under "Daily" (lines 134-135); `wrap` is not in §4 at all and appears only in §7 (git) and its own SKILL.md as a session close.
2. **§4 and §10 disagree on whether wrap closes a feature.** §10's product pipeline reads "idea → PRD → spec → build → track → wrap" (`CLAUDE.md:257,260`) and `skills/README.md:111-112` restates the 4-stage form. A curator following §4 never runs `/brain:wrap` to close a feature; one following §10 does.
3. **Hand-offs are explicit for research → plan → build → review, and absent after review.** research offers `/brain:plan` (`skills/research/SKILL.md:36-37`); plan offers `/brain:build` (`skills/plan/SKILL.md:43`); build sets `phase: review` and offers `/brain:review` (`skills/build/SKILL.md:35`). review's SKILL.md never names a next command: on failed ACs the spec "stays `active` with the blockers listed" (`skills/review/SKILL.md:51-53`) with no pointer back to `/brain:build`. Verified by grep: the only `/brain:build` mention in review is the model-split note on line 10. Only `loop` documents a review-failure path, and only for loop-managed work (`skills/loop/SKILL.md:30`).
4. **wrap re-derives spec closure instead of trusting review.** `skills/wrap/SKILL.md:16-17` re-checks the ACs of any spec the session touched rather than reading review's `status: done` / `phase: done`; no reconciliation rule if they disagree.
5. **Bookkeeping is re-specified in six skills.** Log entry + index refresh + commit offer appear independently in research (34-35), plan (42-43), build (32-34), review (54-55), wrap (25-40), dump (28-29). digest is explicitly log-free (`skills/digest/SKILL.md:21`).
6. **`plan_approved` ownership is documented in plan and the manual (§3 `CLAUDE.md:99-100`, §5 line 154) but build only checks it reactively** (`skills/build/SKILL.md:15-16`) and never states that build must not flip it itself.

### B. What the hooks enforce (hooks slice, verified)
7. **Plan gate and TDD gate scan every open spec, not the one the write belongs to.** `hooks/scripts/guards.js:239-258` blocks on the first open `tier: architecture` spec lacking `plan_approved: true` regardless of which file is being written; the TDD gate (`guards.js:260-272`) likewise uses `specs.find(...)` across all open specs. With one unapproved architecture spec and one approved feature spec open, a write for the approved spec is blocked. No selftest covers the two-open-specs case (`hooks/scripts/selftest.js:154-182` all use a single spec).
8. **The three Stop-time nudges serialize into up to three separate blocks.** `hooks/scripts/wrap.js:204-208` calls `stopCheck`, `decisionCheck`, `gitCheck` in sequence and each `block()` exits the process, so a clean wrap can need three Stop attempts (log entry, then ADR, then commit). Each fires once per session via a marker file.
9. **The wrap.js Stop checks have no selftest.** A grep for `wrap[` in selftest.js returns nothing; selftest covers plan gate (154-162, 1242-1245), TDD gate (168-182), orphan check (192-205) and comment-tolerant frontmatter parsing (991-993) only. review → build loop-back, wrap closing a spec, and loop stop conditions are also untested at hook level.
10. **`phase` is informational only.** Read by `brain-status.js:170` and `trigger-router.js:221` for display and routing hints; no gate keys off it (`guards.js` never reads `phase`). No hook writes `tier`, `plan_approved`, `tdd`, `phase` or AC ticks; the skills do.
11. **The trigger-router covers every stage** (`hooks/scripts/trigger-router.js`: research 141, plan 147, build 153, review 159, loop 129, wrap 45) plus a catch-all dev-intent rule (202-208) that routes to plan or, if a matching open spec exists, to build. Natural-language follow-ups mid-review that match dev-intent phrasing can re-nudge toward plan/build; slash-prefixed prompts are silent (line 240).

### C. History and intent (roadmap slice)
12. **Every lifecycle roadmap row is marked shipped**: P3 lifecycle skills (v0.6.0, `ROADMAP.md:46,466-473`), P4 gates and tiers (v0.5.0, lines 47, 494-496), P12 loops (v0.17.0, lines 59, 239-248).
13. **The "brain starts developing without a plan" complaint (2026-09-14, v0.24.0)** was fixed by the router's catch-all dev-intent rule, not a hard gate (`plugin/CHANGELOG.md:73-79`, `resume.md:57-72`). A hard-gate variant was deliberately deferred: "revisit only if the advisory hint gets ignored in practice." The competitor vault has the same gap (`resume.md:67-68`).
14. **A real engine bug surfaced under P15:** inline YAML comments hid spec tiers from the gates (`ROADMAP.md:114-116`), fixed in `lib.parseFrontmatter` with regression tests (selftest 991-993).
15. **No end-to-end lifecycle example exists.** `examples/claude-code-brain/` has wiki/sources/sessions only, no `specs/`, `projects/` or `decisions/`. The "full lifecycle" claim rests on selftest counts and design docs, not a preserved walkthrough. This page is the first dogfood record.
16. **Open dogfood debts adjacent to the lifecycle:** PR-review mode never exercised on a real PR (`resume.md:35-36`); MCP registry not run against a real `.mcp.json` (`resume.md:74`).

## Recommendation
Plan one **feature-tier** spec, `develop-lifecycle-fixes`, with these ACs, in this order of value:
1. **Scope the plan and TDD gates to the spec that owns the write** (finding 7): match open specs to the written path (a spec `files:`/`scope:` field or its workstream), fall back to today's all-specs behaviour only when no spec claims the path; add the two-open-specs selftest.
2. **Give review a hand-off** (finding 3): on any failed AC, review sets `phase: build`, lists blockers, and offers `/brain:build <slug>`; on all green it offers `/brain:wrap`. Make wrap trust `status: done` and only re-verify when the spec is still `active` (finding 4).
3. **Consolidate the Stop nudges into one message** (finding 8): run all three checks, block once with every unmet item listed, and add a selftest for each `wrap[...]` path (finding 9).
4. **Make the manual consistent** (findings 1-2): §4 states the 4-stage core, then names loop, wrap, digest and dump with their position relative to it; §10 and `skills/README.md` cite §4 rather than restating.

Leave the hard plan gate deferred (finding 13); this dogfood produced no evidence the advisory hint was ignored. Do not build an "8-step numbered lifecycle" as a new abstraction; the 4 stages + utilities framing is the accurate one.

## Filed
Concepts/entities updated: none yet (first page in this brain) · Feeds: [[develop-lifecycle-fixes]] (spec, next via `/brain:plan`)
