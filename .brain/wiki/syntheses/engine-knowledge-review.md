---
title: "Review — engine-knowledge"
type: synthesis
status: active
tags: [review, links, knowledge, superpowers]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[brain-health-audit]]"]
related: ["[[engine-knowledge]]", "[[links-resolve-across-records]]", "[[wiki-self-healing]]", "[[doctor-health-checks]]"]
aliases: []
question: "Do commits 2e6311e (knowledge) and 3dc3a5c (code) meet every AC of engine-knowledge, and are the code and the pages sound?"
---

# Review — engine-knowledge

Verification of the ingest commit `2e6311e` and the build commit `3dc3a5c` against [[engine-knowledge]]. Method: suite, lint and doctor re-run by the reviewer; an independent adversarial reviewer on a different model family from the builder (builder Opus 5, reviewer Fable 5.1, read-only) probed the link index on three scratch brains, measured it at 500 pages, and spot-checked concrete claims in all 23 knowledge pages against the code and CHANGELOG.

## Verdict
**Done, with fixes applied in review.** All 9 ACs verified. 0 P0, 3 P1 (all knowledge — pages stating pre-fix behaviour as current), 13 P2 (8 code, 5 knowledge). Code fixes in `d7b0519` (selftest 513 → 523), knowledge fixes in a correction pass over 14 pages; one P2 kept as an observation.

## AC table

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 one link index | ✅ | five checks; reviewer: slug, `specs/x`, alias on a record and subfolder records all resolve |
| AC-2 orphans count records | ✅ | a page linked only from an ADR is no orphan in all three checkers |
| AC-3 frontmatter link form | ✅ | every template shows it; the comment parses to nothing; this brain's 18 lines converted, all resolve |
| AC-4 superpowers filing | ✅ | mapping in `reference.md` §9; advisory matches the plugin's real paths (`docs/superpowers/specs|plans/`) |
| AC-5 sources | ✅ | four dated snapshots + summaries |
| AC-6 concepts + entities | ✅ after fixes | 13 + 6 pages; 3 P1 and 5 P2 factual fixes below |
| AC-7 search | ✅ | the AC query ranks three concept pages first; a second query ("how does the plan gate decide which spec to consult") puts the spec and its ADR first and the concept fifth — noted, not a defect |
| AC-8 resume in the brain | ✅ | root `resume.md` removed; `.brain/resume.md` holds the narrative |
| AC-9 release | ✅ | selftest 523 · `--strict` ×2 · 0.32.0 · doctor: no broken links, no orphans |

## Findings (most severe first)
1. **P1 — the pages contradicted the ADR they cite.** `model-routing` and `claude-code` still said six skills fork; the token-diet review had already cut that to `build` only. Fixed.
2. **P1 — `claude-code` described the model block as once per session**, with a selftest anchor asserting the opposite of what the selftest now asserts. Fixed to the 0.30.0 per-dispatch behaviour.
3. **P1 — `wiki-self-healing` and `doctor-health-checks` described the `wiki/`-only link index as a current gap** — the build that fixed it did not touch the pages its own refactor made stale. Rewritten in the past tense, citing [[links-resolve-across-records]]; every line anchor replaced by function and check names.
4. **P2 (code) — slug collisions were silent.** A concept and a project with the same slug masked an orphan; `[[specs/x]]` resolved to a project. Fixed: `linkIndex` reports collisions (lint issue group, doctor check 1) and resolves a record-folder link only inside that folder.
5. **P2 (code) — `wiki/templates/` was indexed** as pages and link targets. Fixed.
6. **P2 (code) — the superpowers advisory fired outside the brain's project** (via `MONKEY_BRAIN_DIR`) **and under `node_modules`.** Fixed.
7. **P2 (code) — orphan checks were O(pages × files)** (1.2 s at 500 pages, ~19 s projected at 2,000). Fixed: every file's links are read once; `hasInbound` is a lookup.
8. **P2 (code) — dead helpers, case-sensitive slugs, a README badge three releases behind, this brain's templates without the new comment.** Fixed; the badge is now pinned to the plugin version by a selftest.
9. **P2 (knowledge) — line anchors wrong when written** (`recall-and-search`, `instincts-and-bans`, `trigger-router` "~27" rules — it is 29). Fixed by naming functions and constants; the pass adopted names over line numbers for every concept page.
10. **P2 (knowledge) — source pages linked to themselves** instead of the raw snapshot; **stale statements** (token-diet review status, superpowers filing "planned", release and selftest counts, "plugin is v0.31.0" cross-checks); **`github-plugin` claimed `/brain:wrap` posts to PRs** (it never does — `pr.js` is read-only by the curator's decision). All fixed.
11. **P2 — the AC-7 query was the only one tuned.** Kept as an observation: BM25 over titles, tags and bodies ranks records well for "which spec" questions; a meaning-based layer (qmd, `reference.md` §8) is the upgrade path past ~100 pages.

## Process notes
- The code build and the knowledge pages were written in parallel, so the pages froze pre-refactor facts; the correction pass now names functions instead of lines, which a later refactor will not silently invalidate.
- During the session the installed plugin was still 0.29.1, so its wiki-check flagged links to records as unresolved while the repo's 0.32.0 code resolved them — the fix only reaches hooks after a reinstall.

## Sources
- [[engine-knowledge]] · [[brain-health-audit]] · [[links-resolve-across-records]] · [[wiki-self-healing]] · [[doctor-health-checks]]
