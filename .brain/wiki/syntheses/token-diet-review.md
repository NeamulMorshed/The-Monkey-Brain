---
title: "Review — token-diet"
type: synthesis
status: active
tags: [review, tokens, model-routing, context, manual]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[brain-health-audit]]"]
related: ["[[brain-health-audit]]", "[[token-diet]]", "[[fork-not-switch-model-routing]]", "[[model-routing]]", "[[recall-and-search]]"]
aliases: []
question: "Does build commit 0939199 meet every AC of token-diet, and is the code sound?"
---

# Review — token-diet

Verification of build commit `0939199` (plus the review-fix commit that follows this page) against [[token-diet]]. Method: the suite and the release checklist re-run by the reviewer, never the spec's ticks; an independent adversarial reviewer on a different model family from the builder (builder Opus 5, reviewer Fable 5.1, read-only, probes against scratch brains and real transcripts — including one with a `compact_boundary` at 326k → 62k).

## Verdict
**Done, with fixes applied in review.** All 10 ACs verified; AC-2 amended in review (only `build` forks). The pass found 0 P0, 3 P1 and 9 P2; all fixed and pinned by 16 new checks except one P2 tracked in [[router-and-drift]]. Selftest 485 → 501 ALL GREEN; both manifests `--strict`; this brain refreshed to engine v2.1 with `reference.md`.

## AC table

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 one routing table | ✅ | manual §5 table (haiku · sonnet · opus · fable, fork-not-switch, effort medium); four surfaces cite it |
| AC-2 no main-thread switch | ✅ amended | every `model:` pin has `context: fork`; after review only `build` forks — see finding 3 |
| AC-3 research on the session model | ✅ | no pin; fan-out only past two independent slices |
| AC-4 context nudge | ✅ | five base checks + six review checks (compaction reset, shrink, stale marker, env fallback, slash commands, synthetic entries) |
| AC-5 manual split | ✅ | manual 9,973 B ≤ 10,000, engine v2.1, `reference.md` created and refreshed, names kept |
| AC-6 descriptions | ✅ | 25 ≤ 300 B, 5,959 B total |
| AC-7 always-loaded bytes | ✅ | 26,491 → ~16,660 (the credential rule came back to the manual) |
| AC-8 four bundled plugins | ✅ | deps = 4; both READMEs' tables now agree (finding 2) |
| AC-9 cheaper instructions | ✅ | ingest, lint, wrap wording |
| AC-10 release | ✅ | selftest 501 · `--strict` ×2 · 0.31.0 · this brain at v2.1 |

## Findings (most severe first; all fixed except where noted)
1. **P1 — the context nudge went dead after a compaction.** The band marker kept the highest band ever seen, so after `/compact` (a real transcript: 326k → 62k → regrew to 175k) the nudge stayed silent until the next 100k band, and a stale marker from a previous day silenced a resumed session's first nudge. Fix: the marker stores `band:tokens`, resets whenever context drops below the threshold, nudges again when context shrank 40 %+ yet is still large, and is ignored after 12 h. The old "once per band" check only tried monotone growth — now three sequences are pinned.
2. **P1 — two README sections still shipped five plugins.** The plugin README's capability paragraph and the root README's "Ship automatically" table still listed code-modernization; `/brain:init` step 1 still said `--update` refreshes only CLAUDE.md + templates. The AC-8 check had matched other lines. Fix: all three corrected; the check now counts the table's rows.
3. **P1 — forking five skills cost tokens and lost context.** A `context: fork` skill runs as a background subagent that cannot see the conversation and gets no session-start injections: the forked `build` — the one skill that writes source — never saw the brain's active instincts, and `brief`, `dashboard`, `home`, `usage`, `digest` paid a subagent bootstrap for output a `!` script produces identically inline. Fix: only `build` forks; it gets the active rules through the new `instincts.js active` and returns blockers instead of asking; the other five run unpinned (no switch either way). ADR [[fork-not-switch-model-routing]] amended.
4. **P2 — `MONKEY_BRAIN_CONTEXT_NUDGE` of `''` or `abc` silently disabled the nudge.** Fix: fall back to 150k. Pinned.
5. **P2 — slash commands never saw the nudge.** Fix: recall still skips them, the nudge does not. Pinned.
6. **P2 — a trailing `<synthetic>` or zero-usage entry, or a tool result bigger than the 512 KB window, read as 0.** Fix: such entries are skipped and a second window is read. Pinned (synthetic).
7. **P2 — `--update` renamed quoted names.** `project: 'Foo'` became `"'Foo'"`, `Foo # legacy` kept the comment. Fix: the name is read with the frontmatter parser; `--update` now says it refreshed `reference.md`. Pinned ×2.
8. **P2 — normative rules left the always-loaded path.** "Never install an MCP server or touch a credential" and "security P0s gate wrap" lived only in `reference.md`. Fix: one sentence back in manual §9 (manual 9,973 B, still ≤ 10,000); the recall, context-nudge and model-block knobs documented in `reference.md` §8. Pinned.
9. **P2 — stale "manual §8/§10" references outside the checked list** (`search.js`, plugin README). Fix: corrected; the check now scans every `.js`/`.md` under `plugin/`. Pinned.
10. **P2 — the CHANGELOG's manual size** (15.9 → 15.6 KB at LF). Fixed.
11. **P2 — `mb-ctx-*` markers accumulate in the temp dir** — the same pre-existing pattern as `mb-recall-*`. **Tracked** in [[router-and-drift]] AC-11 (marker pruning), not fixed here.

## Test quality
Three checks could pass with the bug present — the monotone-only band check, the AC-8 README check that matched a different paragraph, and the reference scan's hand-picked file list. Each now has the adversarial case. The AC-1 "cites manual §5" checks remain text checks by nature.

## Process notes
- Reviewer (Fable) and builder (Opus) were different families; the reviewer confirmed from the skills docs that `context: fork` + `model:` is the documented way to set a skill's subagent model, that `!` preprocessing still runs in a fork, and that forks run in the background.
- Verified correct: tail reader on CRLF and split lines, 63 ms on a 53 MB transcript, all descriptions YAML-safe, the four manifests consistent, template copies byte-identical.

## Sources
- [[token-diet]] · [[brain-health-audit]] · [[fork-not-switch-model-routing]] · [[model-routing]] · [[recall-and-search]]
