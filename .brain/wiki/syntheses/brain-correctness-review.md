---
title: "Review — brain-correctness"
type: synthesis
status: active
tags: [review, resume, gates, doctor, hooks]
created: 2026-09-15
updated: 2026-09-15
sources: ["[[brain-health-audit]]"]
related: ["[[brain-health-audit]]", "[[brain-correctness]]", "[[resume-resolver-prefers-real-narrative]]", "[[model-block-every-dispatch]]"]
aliases: []
question: "Does build commit 27cf006 meet every AC of brain-correctness, and is the code sound?"
---

# Review — brain-correctness

Verification of build commit `27cf006` (plus the review-fix commit that follows this page) against [[brain-correctness]]. Method: the suite was re-run by the reviewer (never the spec's ticks), the release checklist re-run, and an independent adversarial reviewer on a different model family from the builder (builder Sonnet 5, reviewer Opus 5, read-only, executable probes against scratch brains and the pre-commit scripts from `git archive 27cf006^`) audited the diff.

## Verdict
**Done, with fixes applied in review.** All 15 ACs verified. The adversarial pass found 0 P0, 2 P1 and 4 P2; five are fixed and pinned by 16 new selftests, one P2 item is declined with a reason. Selftest 447 → 463 ALL GREEN; both manifests `--strict`; doctor on this brain: `14. open-p0: none`.

## AC table

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 one resume resolver | ✅ | five `resume`/`resumePath` checks; review added the subdirectory case |
| AC-2 silent seed | ✅ | `a seed-only resume … injects nothing`; review added task-log-only and false-seed cases |
| AC-3 wrap names the reported file | ✅ | `/brain:wrap updates the resume file the hook reported…` |
| AC-4 project-relative test paths | ✅ | `a project under a parent folder named specs is still plan-gated`; reviewer: `src/core.js` NEW 2 / OLD 0 |
| AC-5 one containment test | ✅ | `lib.inProject` table incl. `D:/x`, `D:x`, `//srv/share/x` (reviewer) |
| AC-6 log `updated:` both sides | ✅ | `…needs an updated: date on both sides`; review allows a time |
| AC-7 section-aware P0 | ✅ | four base checks + eight review checks (negated headings, stray fence, count beside a finding) |
| AC-8 no phantom ledger lines | ✅ | typeless SubagentStop leaves no line; doctor 18 warns through 16 legacy phantoms |
| AC-9 CI by workflow | ✅ | `doctor 19: no detected stack but a workflow present → ok` |
| AC-10 per-dispatch block | ✅ | two model-less dispatches both exit 2; forks pass; review added `MONKEY_BRAIN_MODEL_BLOCK=0` |
| AC-11 Stop nudges skip hook files | ✅ | git fixture + mtime fixture; review added the nested `.brain/` layout |
| AC-12 table-escaped links | ✅ | wiki-check, lint and doctor share the `\|` needle |
| AC-13 librarian | ✅ | 8 steps inline, `WebFetch`, no Skill call |
| AC-14 § refs + README counts | ✅ | template §5, wiki-check/lint §6, 10 hook events |
| AC-15 release | ✅ | selftest 463 ALL GREEN · `claude plugin validate --strict` ×2 · CHANGELOG + manifests 0.30.0 · doctor #14 none |

## Findings (most severe first; all fixed except where noted)
1. **P1 — a heading that merely contains a closing word closed its P0s.** `lib.openP0Lines` matched `fixed|resolved|closed|accepted|done` anywhere in a heading, so "## Not fixed yet", "## Open — to be resolved", "## Blockers (none closed yet)", "## Next steps once the build is fixed" and "## Definition of done" all hid open P0s (doctor #14, loop stop condition and digest "blocked" list all went quiet). A stray unclosed fence hid the rest of a page; "no P0" beside a real finding dropped the line. Fix: a closing heading needs an explicit status marker at its end and no negation word; an unclosed fence at EOF is not a fence; count phrases are stripped before testing for P0. Pinned: eight review checks.
2. **P1 — the hook-owned filter over-matched.** `(^|/)(sessions/|resume\.md$)` matched at any depth, so real wiki pages named `resume.md` or under a `sessions/` folder went uncounted by `wrap[git]` and doctor #7 (reviewer probe: 2 counted, should be 4). The AC-11 test could not see it because its brain was the repo root. Fix: `lib.brainGitDirty` lets git exclude brain-relative pathspecs (`:(exclude)sessions`, `:(exclude)resume.md`, `--untracked-files=all`); wrap and doctor share it. Pinned with a nested `.brain/` fixture.
3. **P2 — `resumePath` looked at `<cwd>/resume.md`.** From a project subdirectory the root narrative lost to the brain seed and `resume.js` went silent. Fix: the root candidate is the brain's parent. Pinned.
4. **P2 — `isSeedResume` edges.** `[\s\S]*_$` read a placeholder line followed by a real narrative ending in an italic word as a seed; a file holding only a hook-written task log read as someone's own format and was injected. Fix: one italic span only; task-log-only is a seed. Pinned ×2.
5. **P2 — a log `updated:` bump that adds a time was newly blocked.** The hooks stamp `updated: YYYY-MM-DD HH:MM` elsewhere, so the model may copy it. Fix: optional time on both sides. Pinned.
6. **P2 — copies, dead code, docs.** Fixed: doctor's inline porcelain copy (now `brainGitDirty`), dead `loop.openP0`, the seed template text and plugin README ("asks whether to continue" — now "once this narrative is filled in" / "silent while it is still the seed"), `resume-log.js` header, and an opt-out `MONKEY_BRAIN_MODEL_BLOCK=0` for third-party plugins that dispatch without a model (noted in the CHANGELOG). **Declined:** `snapshot.js` keeps its own `section()` — it is also used for non-resume sections and behaves identically; not worth the churn.

## Test quality
The reviewer found no vacuous check, but three that could not see the bugs they were meant to pin: AC-7 only tried headings that close correctly, AC-11 only a brain at the repo root, AC-1 only the project root as cwd. Each now has the adversarial case beside the happy one.

## Process notes
- The builder (Sonnet, via `/brain:build`'s `model: sonnet` pin) and the reviewer (Opus) were different families, as the review pairing intends. The build turn itself switched this long main session to Sonnet — the exact cache re-write [[token-diet]] removes; the next build was run without re-invoking the pinned skill for that reason.
- The router fired `brain:ingest` and `brain:research` on subagent hand-back text during the review — routed into [[engine-knowledge]].

## Sources
- [[brain-correctness]] · [[brain-health-audit]] · [[resume-resolver-prefers-real-narrative]] · [[model-block-every-dispatch]]
