---
title: "Trigger Router"
type: concept
status: active
tags: [trigger-router, hooks, routing, develop-lifecycle, advisory]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[research-first-entry]]", "[[research-first-routing-review]]"]
related: ["[[develop-lifecycle-stages]]", "[[plan-and-tdd-gates]]", "[[bounded-loops]]", "[[team-lock]]", "[[doctor-health-checks]]", "[[wiki-self-healing]]", "[[instincts-and-bans]]", "[[recall-and-search]]", "[[model-routing]]", "[[claude-code]]", "[[superpowers-plugin]]"]
aliases: [router, trigger-router.js]
---

# Trigger Router

`plugin/hooks/scripts/trigger-router.js` is hook #2, firing on every `UserPromptSubmit`. It
is the deterministic layer of the activation architecture (ROADMAP L3a, [[engine-roadmap]]):
natural phrases map to `/brain:*` skills so nobody has to memorize commands. It **never
blocks and never rewrites the prompt** — it injects a one-line routing hint via
`additionalContext` telling the model which skill owns the workflow. Model-driven (L3b) and
path-driven (L3c) routing still apply when it misses.

## How it works
- **`RULES` is a first-match list** in `trigger-router.js`, 29 entries, each a regex,
  target skill, `needsBrain` flag and human `what`. Order matters: specific workflows (init,
  ingest, wrap, doctor, lock, lint, learn, career, digest, dump, dashboard, ci, loop, brief,
  spec/build/review, product-design, game, query, usage, terse, compress) are tried before the
  generic development catch-all.
- **Research-first entry** (`:143-149`, `:204-213`, `:298-313`): the bare word `research` fires
  `/brain:research` directly. The catch-all dev-intent rule (`:206-213`, dev verbs + nouns like
  "add a login feature") builds a hint via `devHint()` (`:298-313`) that enters the lifecycle at
  research by default — see [[develop-lifecycle-stages]].
- **`relatedResearch()`** (`:258-285`) reads `wiki/research/*.md` frontmatter (title, tags,
  aliases, slug) and cites a page when it shares **≥2 topic tokens** with the prompt, best 3,
  routing to `/brain:plan` citing them instead of re-running research.
- **`openSpecs()`** (`:288-296`) lists every non-`done`/`closed`/`superseded` spec as
  `` `slug` (tier, phase) `` — see [[plan-and-tdd-gates]]. If one covers the request the hint
  offers `/brain:build <slug>` directly.
- **`SKIP_RE`** (`:222-231`) is the curator's own words only, never inferred: `skip research`,
  `no need for research`, `without research`, `just build/plan/fix/do it`, `quick fix`,
  `trivial` (as a label, not inside "non-trivial"), with polarity-aware negative lookbehind so
  "should not skip research" is not a skip. It also suppresses the literal `research` rule
  (`not: () => SKIP_RE` at `:145`) so "skip research and add X" cannot route *to* research.
- **`QUESTION_RE`** (`:215`, `why/what/how/explain/describe/where/when/who`) is checked only
  against the dev catch-all (`:322`, `rule.dev && QUESTION_RE.test(prompt)` → silent).
- **No-brain hint** (`:326-332`): a `needsBrain` rule matching in a project with no `.brain/`
  offers `/brain:init` first, honoring `.no-brain` (silent) and the curator's skip phrasing.
- Fails open throughout: missing `wiki/research/`, broken frontmatter, or any internal error →
  silent, `exit 0` (`main().catch(() => process.exit(0))`).

## Knobs
- **`.no-brain`** marker file at the project root declines the engine entirely — the router
  goes silent on `needsBrain` rules instead of offering `/brain:init`.
- **RULES ordering** is itself the tuning knob for maintainers — a new specific-workflow rule
  must sit above the generic dev catch-all or it never fires.
- No env var disables the router itself (contrast [[recall-and-search]]'s
  `MONKEY_BRAIN_RECALL=0` and [[model-routing]]'s `MONKEY_BRAIN_MODEL_BLOCK=0`).

## Cost
Runs on every prompt — regex tests only, no file I/O, unless a rule needing brain state
matches: `openSpecs()` reads every `specs/*.md` file's frontmatter on each dev-catch-all or
open-spec-listing hit (uncapped, see misfires below); `relatedResearch()` opens up to one 8 KB
head per `wiki/research/*.md` file, only when the prompt yields ≥2 topic tokens. Advisory
only — it is Never a hard gate itself (contrast [[plan-and-tdd-gates]]'s `guards.js`).

## Gotchas & history
- Through v0.24.0 the dev catch-all sent everything straight to `/brain:plan`, with research
  only an always-available *offer* inside `/brain:plan` step 1 — [[research-first-entry]]
  found the offer was never taken because the escape ("record the evidence gap") was always
  cheaper. [[research-first-entry-is-advisory]] records the fix as a routing **default, not a
  gate** — deliberately, matching how plan-before-build was kept advisory in v0.24.0.
  [[research-first-routing-review]] verified all 10 ACs of `research-first-routing` and found
  6 P1s in the first build (trivial/non-trivial boundary, negated skips, drifting skip
  patterns, single-token false-positive citations, un-stemmed five-letter plurals, vacuous
  test fixtures) — all fixed and pinned (selftest 408 → 417).
- The router only recognizes **its own** phrase set; craft plugins (github,
  frontend-design, [[superpowers-plugin]], security-guidance, code-modernization)
  auto-activate on their own descriptions. Precedence when both apply: deterministic trigger
  (this hook) > domain pack > domain skill > craft plugin > general model (`reference.md` §9).

## Misfires found in the 2026-09-16 audit — fixed in 0.33.0
Each bullet below describes the router **before 0.33.0** ([[router-and-drift]], ADR [[router-ignores-questions-and-reports]]). Fixed: the literal-`research` rule is question-exempt (`question: true`, checked with `QUESTION_RE` like the dev catch-all) and ignores the noun forms ("research purpose / paper / parser / model"); `HANDBACK_RE` silences pasted subagent reports and teammate messages before any rule runs; `DOCTOR_FEATURE` and `DUMP_PIVOT` `not:` guards let a build order about the doctor or after "we decided" reach the dev catch-all; the init rule no longer spans an unrelated object; audit phrasings ("review the entire brain", "audit all plugins and hooks", "is the brain working properly") reach `/brain:doctor`; a brainless repo hears the init offer once per session (a temp marker keyed by session and project root); `devHint()` names at most `MAX_SPECS` (8) open specs, then "+N more".
- **Questions are only exempt from the dev catch-all.** `QUESTION_RE` (`:215`) gates `rule.dev`
  alone (`:322`) — a question that happens to contain a specific-workflow phrase, e.g. "why did
  research take so long?", still matches the literal `research` rule and fires a hint.
- **The bare noun "research" fires research** (`:143-149`) — "I already did some research on
  this" or "research shows X" routes to `/brain:research` with no intent signal beyond the word.
- **Subagent hand-back text can fire ingest/research.** The hook only inspects raw prompt text
  with no author or context check; a hand-back report that itself contains phrasing like "add
  this to the wiki" or the word "research" can re-trigger those rules if it flows back through
  `UserPromptSubmit`.
- **Audit phrasings route nowhere.** No `RULES` entry contains "audit" outside the
  product-design accessibility phrase (`:169`); "audit the brain" or "security audit" falls
  through every rule silently, even though `agent-track.js`'s `VERIFYING` regex treats "audit"
  as review-class work one layer down (see [[model-routing]]).
- **The no-brain `/brain:init` offer repeats every prompt.** Unlike `recall.js`'s
  once-per-session temp-dir marker, `main()` (`:315-344`) has no state — every matching prompt
  in a brainless project re-offers `/brain:init`.
- **The open-spec list is uncapped.** `openSpecs()` (`:288-296`) has no `.slice()` (contrast
  `relatedResearch()`'s top-3); a project with many open specs prints all of them into the hint.

## Related
- [[develop-lifecycle-stages]] — the research → plan → build → review sequence the router enters
- [[plan-and-tdd-gates]] — what `openSpecs()` reports and what the router routes *into*
- [[bounded-loops]] — the `loop` rule (`:132-136`) and `/brain:loop`
- [[team-lock]] — the `lock`/`unlock` rule (`:78-82`)
- [[doctor-health-checks]] — the `doctor` rule (`:54-58`)
- [[wiki-self-healing]] — the `ingest` rule (`:42-46`) feeding the wiki
- [[instincts-and-bans]] — contrast: instincts are learned and can gate; this router is fixed regex and only ever advisory
- [[recall-and-search]] — the other `UserPromptSubmit` hook, runs alongside this one
- [[model-routing]] — `agent-track.js`'s dispatch block is the router's hard-gate counterpart

## Sources
- [[engine-roadmap]] · [[engine-changelog]] · [[research-first-entry]] · [[research-first-routing-review]] · [[research-first-entry-is-advisory]] · [[research-first-routing]]
