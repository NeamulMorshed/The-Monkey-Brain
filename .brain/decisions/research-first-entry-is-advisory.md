---
title: "ADR — The lifecycle enters at research by default, as a routing default, not a gate"
type: decision
status: accepted
created: 2026-09-15
updated: 2026-09-15
sources: ["[[research-first-entry]]", "[[research-first-routing]]"]
related: ["[[research-first-entry]]", "[[research-first-routing]]", "[[develop-lifecycle-dogfood]]", "[[spec-scope-globs-gate-ownership]]"]
---

# The lifecycle enters at research by default, as a routing default, not a gate

## Context
The manual describes the develop lifecycle as research → plan → build → review, but since v0.24.0 the router's catch-all for development intent sent every request to `/brain:plan`, and `/brain:plan` only *offered* research with an always-available "record the evidence gap" escape ([[research-first-entry]] findings 2, 4, 8). The curator decided on 2026-09-15: "it should start from research. if a user doesn't want to research then they can skip this but by default the brain should start from research for this life cycle." Two ways to honour that: a hard gate in `guards.js` refusing spec creation without a research page, or a routing default plus a rule inside `/brain:plan`.

## Decision
Research-first is a **default, not a gate**. The trigger-router's catch-all now enters at `brain:research`, routes to `brain:plan` when `wiki/research/` frontmatter already overlaps the prompt (citing the pages), and to `brain:build` when an open spec covers the request. The curator's own words skip it: "skip research", "no research", "without research", "just build/plan/fix/do it", "quick fix", "trivial" — recognised at routing time, and a skip also suppresses the literal-`research` rule so "skip research and add X" cannot route *to* research. Inside `/brain:plan`, a `feature` or `architecture` spec with no research to cite must run `/brain:research` first unless the curator skipped it in the conversation; the skip is recorded in the spec's Notes; `quick` tier is exempt. The manual states this entry rule once in §4; README and skills README echo it.

## Consequences
Easier: every non-trivial feature now starts with filed, cited research unless the curator opts out in their own words, and topics the brain already researched go straight to plan with the pages named. Harder: related-research detection is a token overlap on frontmatter (title, tags, aliases, slug) — at least two shared topic words after a stop-list of function words and the router's own dev vocabulary, best three pages cited — so a poorly tagged research page will not be found and research runs again; tag research pages well. The skip vocabulary is a fixed list, so an unusual phrasing ("let's not bother investigating") falls through to research, which is the safe direction. Nothing blocks: a session that ignores the hint still reaches `/brain:plan`, where the step-1 rule is the second reminder. Revisit a hard gate only if the advisory default is observed being ignored, the same standard applied to plan-before-build in v0.24.0.
