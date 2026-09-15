---
title: "Review — router-and-drift"
type: synthesis
status: active
tags: [review, router, doctor, bundle, drift]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[brain-health-audit]]"]
related: ["[[router-and-drift]]", "[[router-ignores-questions-and-reports]]", "[[trigger-router]]", "[[doctor-health-checks]]", "[[instincts-and-bans]]"]
aliases: []
question: "Do commits af7482b and 1d47c9e meet every AC of router-and-drift, and are the router, doctor #20 and the growth bounds sound?"
---

# Review — router-and-drift

Verification of the build commits `af7482b` and `1d47c9e` against [[router-and-drift]]. Method: suite and `--strict` re-run by the maintainer; an independent adversarial reviewer on a different model family from the builder (builder Opus 5, reviewer Fable 5.1, read-only) ran router probes against the patched `trigger-router.js`, the doctor check with interpreter overrides, the bundle `--check` against a freshly updated catalog, and read the new selftest block for vacuous checks.

## Verdict
**Done, with fixes applied in review.** All 12 ACs verified. 0 P0, 2 P1, 12 P2 — every one fixed in review, test-first: 28 new checks (27 red first), selftest 551 → 579 ALL GREEN, both manifests `--strict`. One fix (a `MONKEY_BRAIN_PYTHON` path with spaces) has no portable selftest; it was checked by reading and a manual run.

## AC table

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 questions exempt from research | ✅ after fixes | original case green; auxiliary questions ("is there research…", "should we research…") were still routed — fixed, six question cases pinned |
| AC-2 dev intent not swallowed | ✅ | three cases; the dump guard widened beyond "now" (finding 7) |
| AC-3 the noun "research" | ✅ after fixes | the exclusion also silenced "research papers on RAG" / "research models for churn" — fixed (finding 3) |
| AC-4 pasted reports silent | ✅ after fixes | the second test case encoded a false positive; replaced by a teammate-message case |
| AC-5 audit phrasings → doctor | ✅ after fixes | four cases; "review the brain-hardening spec" also went to doctor (finding 1) |
| AC-6 init once, specs capped | ✅ after fixes | the marker also silenced dev guidance for the session (finding 10) |
| AC-7 doctor #20 | ✅ | three warn/ok cases plus a positive case with a real Python ≥ 3.10 |
| AC-8 drift | ✅ after fixes | the catalog dropped `small-business` after the build: bundle regenerated, 294/294, 0.14.1 (finding 2) |
| AC-9 bootstrap wrappers | ✅ | text check; the `.sh` scaffold check now runs only under Git Bash / Cygwin on Windows |
| AC-10 wording | ✅ after fixes | two "19-check" mentions left (finding 14) |
| AC-11 bounded growth | ✅ after fixes | eviction by key order and re-advice after eviction (findings 11–12); pruning skipped brainless repos (finding 10) |
| AC-12 release | ✅ | selftest 579 · `--strict` ×2 · 0.33.0 · `brain-all` 0.14.1 |

## Findings (most severe first)
1. **P1 — the doctor audit clause swallowed spec reviews.** `review (the)? brain` matched the start of "review the brain-hardening spec" and "review the brain-correctness spec and close it", routing a spec review to `/brain:doctor`. Fixed: the clause fires only when the noun ends it (end, punctuation, or "and / then / please / now"), never before a hyphen or apostrophe.
2. **P1 — the bundle drifted again within hours.** The official catalog dropped `small-business`, so `brain-all` (0.14.0, 295 deps) was unloadable for every user; `--check` ran only in the release checklist. Fixed: regenerated to 294/294, bumped to 0.14.1, and a weekly `.github/workflows/bundle-drift.yml` runs `gen-brain-all.js --check` against the live catalog.
3. **P2 — the research noun exclusion silenced requests.** "research papers / models / parsers" were excluded by the word *after* "research". Fixed: the word *before* decides ("the / for / a / any / some / no … research"), plus "research purpose(s)".
4. **P2 — the init rule missed adjectives.** "set up a fresh brain", "initialize a proper monkey brain" fell through. Fixed: up to three plain words between the verb and "brain", never a feature noun (check, rule, test, feature, doctor) or a preposition — "create an API for brain search" stays dev work.
5. **P2 — `HANDBACK_RE` matched "The report follows:" anywhere**, silencing a curator's "ingest this article. The report follows: <url>". Fixed: only a message that *starts* as a hand-back or teammate message.
6. **P2 — "audit skills" stole career's route** ("audit skill matrix" → doctor). Fixed: `skills?` dropped from the audit clause.
7. **P2 — `DUMP_PIVOT` knew only "now".** "we decided on postgres. build the auth endpoint" was filed as a note. Fixed: any clause after "we decided" that opens with a build verb (after `.`, `;`, `:`, a dash, or a comma, optionally "so / then / and / please"), unless the prompt opens with "dump".
8. **P2 — questions with auxiliaries still routed**, and the ingest, wrap and init rules had no question exemption ("How do I ingest a PDF?" → ingest). Fixed: `QUESTION_RE` takes auxiliaries; those three rules are `question: true`.
9. **P2 — `MONKEY_BRAIN_PYTHON` was split on whitespace**, so `C:\Program Files\Python312\python.exe` could never work. Fixed: an override with spaces is tried whole first, then split ("py -3").
10. **P2 — the init marker silenced dev guidance.** After the one offer, every later dev prompt in the session got nothing — not even research → plan → build; sessionless calls shared a `nosession` marker; SessionEnd pruned markers only in repos with a brain. Fixed: repeats still give dev prompts the lifecycle line, no session id means no marker, and pruning runs before the brain check.
11. **P2 — `edit-counts.json` evicted by key order**, which puts integer-like keys first regardless of recency. Fixed: each record carries an `at` timestamp and eviction sorts by it.
12. **P2 — an evicted, already-advised file was advised again** once it came back. Fixed: evicted flagged files are remembered in a `__flagged` list (≤ 2,000).
13. **P2 — test quality.** "Silent" checks did not assert an empty stderr (a crash would pass); no positive Python case; the bash-scaffold check picked WSL's bash, which cannot run a `C:/` path; the cleanup deleted every `mb-router-init-*` marker, including a developer's live sessions. All fixed.
14. **P2 — two "19-check" mentions survived** (`.brain/reference.md`, `wiki-self-healing`). Fixed by the brain refresh and an edit; the dated source snapshots keep their original wording.

## Follow-ups
- None blocking. The router stays a phrase list ([[router-ignores-questions-and-reports]]): a misfire seen in a real session gets a selftest case before its fix.
- Curator-side: `GITHUB_PERSONAL_ACCESS_TOKEN` is still unset, so doctor #20 warns about the github plugin — correct behaviour.
