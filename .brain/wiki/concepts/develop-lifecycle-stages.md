---
title: "Develop lifecycle: research → plan → build → review → wrap"
type: concept
status: active
tags: [lifecycle, skills, gates, sdlc]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[develop-lifecycle-dogfood]]", "[[research-first-entry]]", "[[develop-lifecycle-fixes-review]]", "[[research-first-routing-review]]", "[[brain-correctness-review]]"]
related: ["[[plan-and-tdd-gates]]", "[[trigger-router]]", "[[bounded-loops]]", "[[model-routing]]", "[[wiki-self-healing]]", "[[doctor-health-checks]]"]
aliases: [develop lifecycle, SDLC, research-plan-build-review-wrap]
---

# Develop lifecycle: research → plan → build → review → wrap

What it is: the brain's four-stage feature workflow (manual §4 "Develop", §5 for tiers) —
**research** files findings, **plan** writes a spec with numbered ACs and a tier, **build**
works the ACs test-first, **review** verifies and files results — with `/brain:loop`,
`/brain:wrap`, `/brain:digest` and `/brain:dump` running *around* the four stages rather than
being a fifth. Each stage names the next command explicitly, so the workflow is discoverable
without memorizing it.

## How it works
- **Entry rule (research-first):** a new feature request enters at `/brain:research` by
  default — the router (`plugin/hooks/scripts/trigger-router.js`, see [[trigger-router]]) sends
  generic development intent there unless the brain already holds related research (→
  `/brain:plan`, citing it) or an open spec already covers it (→ `/brain:build <slug>`). Saying
  "skip research" (or "just build it" / "just fix it" / "quick fix") enters at plan instead;
  `quick`-tier work is exempt from research entirely. This is a **routing default with a
  curator-owned skip**, not a hard gate (`[[research-first-entry-is-advisory]]` — decision).
- **`plugin/skills/research/SKILL.md`** — check the brain first (`wiki/index.md` → drill in;
  early-exit and cite an existing `wiki/research/<topic>.md` instead of re-running); gather
  codebase then web, cheapest first; file `wiki/research/<kebab-topic>.md` with every finding
  cited and one `## Recommendation`; hand off to `/brain:plan`. Fan-out to `brain-researcher`
  (sonnet) only past two independent slices.
- **`plugin/skills/plan/SKILL.md`** — gather context; **step 1 is a rule, not an offer**: a
  `feature`/`architecture` spec with no cited `wiki/research/` page must run `/brain:research`
  first unless the curator explicitly said to skip it *in this conversation* (the skip and its
  wording get recorded in the spec's Notes); `quick` tier is exempt. Draft
  `specs/<feature>.md` from `templates/spec.md`: Problem/Goals/Non-goals, numbered `AC-1, AC-2…`
  each testable, a Test plan, and a **tier** sized by
  `node graph.js radius <files/dirs/keywords>` (files touched × dirs spanned × types → a
  suggested tier/model, manual §5). The spec's `scope:` globs (from the radius file list) tell
  the plan/TDD gates which files *this* spec owns, so several open specs don't block each other
  (decision `[[spec-scope-globs-gate-ownership]]`). **Approval is curator-owned, never
  self-set**: `architecture` needs `plan_approved: true`, set only after explicit curator
  words (quoted in the log); `feature`/`quick` need only verbal agreement.
- **`plugin/skills/build/SKILL.md`** (`model: sonnet`, `context: fork`) — load the spec, check
  gate state first (unapproved architecture tier → stop and ask, rather than let the guard
  block mid-write), slice by AC, red → green → refactor per slice (the TDD gate is the
  reminder, not an obstacle — `tdd: false` is the curator's opt-out, never the builder's), tick
  ACs as their tests pass, log deviations in the spec's Notes, durable choices become
  `decisions/` ADRs. **Build never sets `plan_approved`** — only the curator's word does (fixed
  explicitly after dogfooding found the ambiguity). Hands off to `/brain:review` when green.
- **`plugin/skills/review/SKILL.md`** — verify AC-by-AC with evidence (run the suite yourself,
  never trust the spec's own tick-marks); review code for correctness/security/simplification/
  test quality; file a `wiki/syntheses/<feature>-review.md` page, durable choices to
  `decisions/`, a 3rd-plus-repeat correction to `instincts/pending/`. **Two exits, always
  naming the next command**: any AC unmet or a blocking finding → spec stays `active`,
  `phase: build`, blockers listed under `## Blockers`, offer `/brain:build <slug>`; every AC
  verified and nothing blocking → `status: done`, `phase: done`, `audit_score` set, offer
  `/brain:wrap`. This two-exit hand-off was itself a gap found by dogfooding and fixed in
  `develop-lifecycle-fixes` (AC-6).
- **`plugin/skills/wrap/SKILL.md`** — the session's definition-of-done, not a fifth lifecycle
  stage: **trusts** a spec `/brain:review` already closed `done` (reports `audit_score`, does
  not re-verify), re-checks ACs only for specs still `active`; runs the domain-pack checklist
  gate if the workstream names a `pack:`; syncs `wiki/log.md`/`index.md`/`decisions/`/the resume
  pointer; commits per logical step.
- **Around the stages** (manual §4): `/brain:loop` repeats build/research/design until the
  brain's own stop condition is met (see [[bounded-loops]]); `/brain:wrap` closes a *session*;
  `/brain:digest`/`/brain:dump` run any time.

## Knobs
- "skip research" / "just build it" / "quick fix" (curator words, this conversation only) —
  enters the lifecycle at plan.
- `quick`/`feature`/`architecture` tiers (manual §5) control gate strictness — see
  [[plan-and-tdd-gates]].
- `graph.js radius <…>` — sizes a change (files × dirs × types → suggested tier/model), quoted
  into the spec's Notes as the tier rationale.
- Spec `tdd: false` — opts a spec out of the TDD gate (curator-only judgment call).

## Cost
`research`/`plan`/`review`/`wrap` run at `effort: high` on the session's main model (judgment
work per manual §5); `build` forks to `sonnet` at `effort: medium` (`context: fork`, so it
never switches the main thread's model mid-session — see [[model-routing]]).

## Gotchas & history — how this repo ran it (the four specs so far)
This engine repo dogfoods its own lifecycle; four specs have gone through it in one session
(2026-09-15), each surfacing a real bug the process itself fixed:

1. **`develop-lifecycle-fixes`** (feature, done) — dogfooding
   ([[develop-lifecycle-dogfood]]) found: the plan/TDD gates scanned *every* open spec instead
   of the one that owns the touched file (fixed with `scope:` globs); review had no explicit
   hand-off, so a failed AC left the spec "active" with no named next step (fixed with the
   two-exit rule above); the three Stop-time nudges (`wrap[log]`, `wrap[decisions]`,
   `wrap[git]`) each exited on first hit, so a clean wrap could take three attempts (fixed —
   one consolidated Stop message listing every unmet item, decision
   `[[one-stop-message-for-wrap-nudges]]`); the lifecycle was defined in manual §4 but restated
   with drift in §10 and the skills README (fixed — one authoritative definition, others cite
   it). Review found 2 P0s in the new glob matcher (rewrite passes clobbering each other; an
   unbalanced `[` throwing and fail-opening *every* gate) — fixed and pinned.
2. **`research-first-routing`** (feature, done) — before this spec, the only automated entry
   point for dev intent was a plan-before-build hint that never mentioned research, and
   `/brain:plan`'s research step was an easily-skipped offer. Curator's word: *"by default the
   brain should start from research."* Fixed the router and `/brain:plan` step 1 as described
   above. Review found 6 P1s (skip-pattern polarity, a `not:` clause needed so "skip research
   and add X" didn't route *to* research, drifting duplicate skip-phrase copies, one-token
   citation matches, plural handling, vacuous AC-3 tests) — all fixed in-review.
3. **`brain-correctness`** (architecture, done, `plan_approved: true`) — fixed the resume
   resolver, gates matching by absolute instead of project-relative path (silently disabling
   the plan/TDD gates for any project under a `specs/`/`tests/` folder), doctor's false
   criticals and phantom dispatch lines, and Stop nudges firing on the hooks' own writes — see
   [[doctor-health-checks]] for the detail. Review found 0 P0, 2 P1, 4 P2.
4. **`token-diet`** (feature, review phase as of this writing) — model routing consolidation,
   the context-size nudge, and a lighter always-loaded manual/skill footprint; not yet reviewed
   at ingest time.

A fifth, `engine-knowledge` (architecture, `plan_approved: true`), is what produced this very
page — see [[wiki-self-healing]] for the link-index gap it's closing.

## Related
- [[plan-and-tdd-gates]] — the hard enforcement (`guards.js`) the plan/build stages run against.
- [[bounded-loops]] — the iteration primitive layered around build/research/design.
- [[trigger-router]] — the deterministic entry point that routes intent into research vs. plan.
- [[model-routing]] — why build forks to sonnet instead of switching the main thread.
- [[doctor-health-checks]] — the P0/dispatch/schema signals `/brain:wrap` and doctor share.
