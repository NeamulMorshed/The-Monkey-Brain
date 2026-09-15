---
title: "Research — Research-first entry to the develop lifecycle"
type: research
status: active
tags: [lifecycle, trigger-router, research, plan-before-build]
created: 2026-09-15
updated: 2026-09-15
sources: []
related: [develop-lifecycle-dogfood, develop-lifecycle-fixes, research-first-entry-spec]
---

# Research-first entry to the develop lifecycle — research

> **Question:** by which paths does a curator's development request reach `/brain:research` today, and what has to change so the lifecycle starts there by default, with one explicit curator skip? · **For:** [[research-first-entry-spec]]

**Curator's decision that framed this (2026-09-15):** "it should start from research. if a user doesn't want to research then they can skip this but by default the brain should start from research for this life cycle."

Method: two read-only researcher slices (Sonnet) — the router and skill code paths, and the documents' promises plus the change history — synthesized here.

## Findings

### How development intent is routed today
1. **The router is a first-match list of 27 rules** (`plugin/hooks/scripts/trigger-router.js:31-209`). Research fires on exactly two of them: the literal word `research` (`:141-145`, pinned by selftest "research X routes to brain:research") and the idea-validation phrases "validate this idea" / "is it worth building" / "pursue, park, or kill" (`:111-115`).
2. **Generic development intent never reaches research.** "Add a login feature" or "fix the upload crash" falls through to the catch-all dev-intent rule (`:202-208`) whose `devHint()` (`:224-235`) says, verbatim: "this looks like development work. Rule: plan before build — no source change without a spec. Open specs: none → invoke the brain:plan skill now … then brain:build. Skip the spec only if the curator explicitly says so in this message." With open specs it lists them and routes to `brain:build <slug>` when one covers the request, else `brain:plan`.
3. **The router can read specs but not the wiki.** `openSpecs()` (`:214-222`) lists non-done spec slugs with tier and phase from frontmatter. Nothing reads `wiki/index.md` or `wiki/research/`, so the router cannot tell whether research already exists for a request. `brain-status.js` (session start) surfaces counts, specs, loops, decisions and health, and never states the lifecycle order.
4. **Research is only an offer inside `/brain:plan`.** Step 1 (`plugin/skills/plan/SKILL.md:14-16`): "A non-trivial feature with no research behind it → offer `/brain:research` first, or record the evidence gap in the spec's Notes." The second branch is always available, so the model takes it and continues. Nothing in `guards.js` checks for a research page; the plan gate keys on `plan_approved` only.
5. **`/brain:research` has no "already researched → hand to plan" branch.** Step 2 ("Check the brain first … what is already known gets cited, not re-researched", `plugin/skills/research/SKILL.md:22-24`) works *inside* a run; step 6 hands off to `/brain:plan`. No step short-circuits a run when a research page already covers the topic.

### What the documents promise
6. **The manual names research as the first stage but states no entry rule.** §4 "Develop (research → plan → build → review)" and "each stage names the next" (`plugin/skills/init/brain-template/CLAUDE.md:123-131`) describe hand-offs between stages; no sentence says which command a new feature request enters on. §10's "research is always filed" (`:262-263`) is aspiration, not enforcement.
7. **The README describes routing that lands on plan.** The hooks table (`plugin/README.md:61`) shows generic dev intent routed to `/brain:plan`; nothing tells a new user to start at research.
8. **This is a deliberate leftover from v0.24.0, never reconsidered.** CHANGELOG 0.24.0 (`plugin/CHANGELOG.md:115-129`): "the router only sent work through `/brain:plan` when the prompt literally said 'spec' … so 'add a login feature' went straight to code with no spec ever written." The fix routed to plan. Neither that entry nor `ROADMAP.md` (hits only at `:776`, `:819`, citing the hint as precedent for staying advisory) ever discussed a research-first entry. No ADR under `decisions/` touches routing.
9. **The dogfood research page missed this gap.** [[develop-lifecycle-dogfood]] finding 13 covered the deferred hard gate, and finding 1 the "4 stages + utilities" shape, but not that the automated entry point skips stage one. This session's own run did not hit it because it opened with an explicit `/brain:research` command.

### Existing opt-out conventions to reuse
10. Opt-outs in this plugin are always **curator-only, explicit, in the current message or conversation, never inferred**: "Skip the spec only if the curator explicitly says so in this message" (`trigger-router.js:228,233`); "only after the curator explicitly approves in conversation" (`plan/SKILL.md:42-43`); "`tdd: false` in the spec is the curator's opt-out, not yours" (`build/SKILL.md:25-26`); "unless the curator explicitly accepts it" (`wrap/SKILL.md:27`). A research skip should read the same way.
11. **Selftest pins the router thoroughly** (`selftest.js:328-427`): four generic-intent phrases must route to `brain:plan` with "plan before build" and "Open specs: none"; specific workflows ("write a spec", "implement the spec") beat the generic rule; question phrasing stays silent; `.no-brain` silences it; open specs are listed with tier and phase and `done` ones excluded. A research-first change must update these expectations, not just add to them.

### Constraints
12. **Quick fixes should not pay for research.** §5 defines `quick` as under two hours, advisory only. The router cannot know the tier before a spec exists, so the skip has to be phrase-based at routing time ("quick fix", "skip research") and tier-based inside `/brain:plan` (quick tier exempt).
13. **The router runs on every prompt** (UserPromptSubmit) and must stay cheap. Reading `wiki/research/*.md` frontmatter (title, tags, aliases) is a handful of small files; a keyword overlap against the prompt is enough to say "related research: `<slug>`" and is the same cost class as `openSpecs()`.

## Recommendation
Make research the default entry for generic development intent, with one explicit skip, in four coordinated places:

1. **Router catch-all rule** (`trigger-router.js` `devHint()`): the message becomes "Rule: research → plan → build." It reads `wiki/research/` frontmatter and reports **related research** by keyword overlap. Routing: an open spec covers it → `brain:build <slug>` (unchanged); related research exists → `brain:plan` citing those pages; otherwise → **`brain:research` now, then `brain:plan`, then `brain:build`**. Closing line: "Skip research only if the curator explicitly says so in this message."
2. **Skip phrases recognised at routing time**, so a curator who already knows what they want goes straight to plan: `skip (the )?research`, `no research`, `without research`, `just (plan|build|fix|do) it`, `quick fix`, `trivial`. The hint then names plan (or build) and says research was skipped at the curator's word.
3. **`/brain:plan` step 1 becomes a rule, not an offer**: a `feature` or `architecture` spec with no `wiki/research/` page cited must run `/brain:research` first, unless the curator said skip in this conversation; the skip is recorded in the spec's Notes. `quick` tier is exempt.
4. **Docs state the entry rule once**: manual §4 gains the sentence "A new feature request enters at research; the curator can say 'skip research' to enter at plan." README's hooks table and the 0.29.0 CHANGELOG say the same. `/brain:research` gains an early exit: if a research page already covers the question, cite it and hand to `/brain:plan` instead of re-running.

Not recommended: a hard gate in `guards.js` that blocks spec creation without a research page. The plan-before-build hint was kept advisory in v0.24.0 for the same reason, and the curator's instruction is "by default", which a routing default plus a plan-step rule satisfies.

## Filed
Feeds: [[research-first-entry-spec]] · Extends: [[develop-lifecycle-dogfood]] (new finding: the automated entry point skipped stage one) · Related spec: [[develop-lifecycle-fixes]]
