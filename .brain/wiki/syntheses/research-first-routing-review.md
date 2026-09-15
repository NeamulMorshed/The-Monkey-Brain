---
title: "Review — research-first-routing"
type: synthesis
status: active
tags: [review, lifecycle, trigger-router, research]
created: 2026-09-15
updated: 2026-09-15
sources: [research-first-routing, research-first-entry]
related: [research-first-routing, research-first-entry, research-first-entry-is-advisory, develop-lifecycle-fixes-review]
aliases: []
question: "Does build commit c044f3c meet every AC of research-first-routing, and is the router change sound?"
---

# Review — research-first-routing

Verification of build commit `c044f3c` (plus the review-fix commit that follows) against [[research-first-routing]]. Scope: `plugin/hooks/scripts/trigger-router.js`, the router and docs blocks of `selftest.js`, the four doc surfaces (plan and research SKILL.md, manual §4 both copies, README row, skills README), and the `.brain/` records. Method: the suite was re-run by the reviewer (never the ticks), the live router was probed against this repo's own brain, and an independent adversarial reviewer (opus, read-only, with executable probes) audited the router diff.

## Verdict
**Done, with fixes applied in-review.** All 10 ACs verified. The adversarial pass found no P0, six P1s and two P2s; the reviewer's own probes found two more P2s. Every finding is fixed and pinned by a selftest before this page was filed. Selftest 408 → 417, all green.

## AC table

| AC | Verdict | Evidence (selftest check name) |
| --- | --- | --- |
| AC-1 enters at research | ✅ met | four generic phrases `enter at brain:research, then plan, then build`; rule line and closing skip sentence asserted |
| AC-2 curator skip | ✅ met | nine skip phrasings `skip research at the curator's word`; three non-skips (`non-trivial`, `trivial helper`, `no research paper parser`) still enter at research; `should not skip research` routes to research; with open specs a skip offers build/plan; no-brain honours the skip |
| AC-3 related research | ✅ met | two shared topic words cite `payments-gateway`; login unrelated; dev nouns incl. `hooks`, `pages` never overlap; one generic word (`entry`) is not enough |
| AC-4 unchanged behaviour | ✅ met | questions silent; `.no-brain` silent; no brain → init then research → plan → build; open specs listed with tier/phase, `done` excluded, `brain:build` offered |
| AC-5 specific rules win | ✅ met | `write a spec` → plan, `implement the spec` → build, `research X` → research, none carry the catch-all rule line |
| AC-6 plan step 1 is a rule | ✅ met | `/brain:plan step 1 is a rule … quick exempt` |
| AC-7 research early exit | ✅ met | `/brain:research exits early when a page already answers, handing to /brain:plan` |
| AC-8 entry rule stated once | ✅ met | `manual §4 states the entry rule`; `README hook #2 row and skills README …`; `bundled manual and schema master stay identical` |
| AC-9 bounded, fail-open | ✅ met | `a missing wiki/research/ never throws`; `broken frontmatter does not crash the router` (now driven by a prompt that opens the files) |
| AC-10 release checklist | ✅ met | `selftest: ALL GREEN` (417) · `claude plugin validate --strict` ×2 · CHANGELOG 0.29.0 · both manifests 0.29.0 |

## Findings (most severe first, all fixed)

1. **P1 — `trivial` fired anywhere, including `non-trivial`** (`-` is a word boundary). "the fix is non-trivial, add a retry handler" skipped research. Fix: `trivial` counts only as a label — line start, after `,;:(`, or after "this is / it's / that's" — and never before a hyphen. Pinned.
2. **P1 — a refusal to skip was read as a skip.** "we should not skip research here" matched `skip … research`; the research rule's `not:` then suppressed the literal rule too, inverting intent twice. Fix: negative lookbehind for `not / never / don't / shouldn't / won't / without` before the skip verb. Pinned.
3. **P1 — two drifting copies of the skip pattern.** The research rule's `not:` and `SKIP_RE` were independent, so "no need for research, add a login feature" matched neither and routed *to* research. Fix: one `SKIP_RE`, referenced by the rule as `not: () => SKIP_RE`, widened to `skip / no need for / without / don't / do not … research` within 20 characters. Pinned.
4. **P1 — one shared token cited a page.** "add an entry form to the signup page" cited `research-first-entry` via `entry`. Fix: a page needs at least two shared topic tokens; hits are scored and capped at three. Pinned with an `entry-points` fixture that must not be cited.
5. **P1 — five-letter plurals escaped the stop-list.** `hooks`, `pages`, `tests`, `forms` were never singularised (threshold was six letters), so a page tagged `hooks` matched "add a hooks page". Fix: strip at five letters, handle `-ches/-shes/-sses/-xes`, keep `-ss`; both sides normalised identically. Pinned.
6. **P1 — two AC-3 assertions were vacuous.** "add a feature to the settings page" and "add a login feature" produced no topic tokens at all, so `relatedResearch` returned before opening any file; deleting the whole `STOP` set kept them green, and the "broken frontmatter" check never opened `broken.md`. Fix: a `settings-redesign` fixture tagged with the dev nouns that must *not* be cited, and the broken-frontmatter check now runs on a prompt that opens every page. Pinned.
7. **P2 — the no-brain hint ignored the skip.** "quick fix: add a login button" in a brainless folder said research → plan → build. Fix: the hint says plan → build with "research skipped at your word". Pinned.
8. **P2 — unbounded citation list.** Every matching page was listed. Fix: top three by score.
9. **P2 (reviewer's probe) — "no research paper parser needed" was a skip.** Fix: bare `no research` counts only when followed by nothing, punctuation, or `needed / required / necessary / first / please / for this / on this`; the verb form excludes `paper(s) / page(s) / parser(s) / tool(s) / module(s) / section(s) / report(s) / team(s) / data`. Pinned.
10. **P2 (reviewer's probe) — "trivial-looking" was a skip.** Covered by fix 1.

Nothing found: zero extra file reads on prompts that miss the catch-all; one 8 KB read per research page on a hit; a split multibyte character at the 8 KB boundary cannot throw; CRLF frontmatter parses; the slug tokenizer is correct; "how do I skip research and add X?" stays silent.

## Test quality
The build's tests pinned the happy paths but two negative assertions were true for the wrong reason (finding 6), and the skip set only had positive cases. The review adds negative fixtures that would match under a broken stop-list, three non-skip phrasings, one polarity flip, and a one-token-versus-two-token pair, so each branch of `SKIP_RE` and `relatedResearch` now has a test that fails if that branch is removed.

## Process notes
The independent adversarial pass again caught what the implementer's own tests missed (compare [[develop-lifecycle-fixes-review]]); the pairing is worth keeping as the review default. The live-brain probe (this repo's own `wiki/research/`) surfaced the two P2s before the agent reported, which suggests a standing step: probe the router against the real brain, not only the fixture.

## Sources
- [[research-first-routing]] · [[research-first-entry]] · [[research-first-entry-is-advisory]] · [[develop-lifecycle-fixes-review]]
