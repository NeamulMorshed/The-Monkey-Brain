---
description: Verify a built spec and review its code — AC-by-AC verification with evidence, findings filed back into the Monkey Brain (review synthesis page, ADRs, instinct candidates), and the spec closed out honestly. Use when the user says "review the changes/spec/branch/PR", after /brain:build finishes, or before merging feature work.
argument-hint: "[spec-slug | branch | PR#/URL | scope]"
effort: high
---

# /brain:review — verify, judge, file it back

> **Pair (P5.5):** the build+review pattern runs this review on the main model against a
> Sonnet implementer's work (`/brain:build`), auditing AC-by-AC — so disagreement surfaces
> before wrap, not after. This skill is `effort: high` and inherits the main model by design.

A review that only lives in chat is lost. This one ends in the brain.

## Steps

1. **Scope.** The spec's diff (branch or working tree) when a spec is named or active;
   otherwise the scope the user gave. Read the spec's ACs and test plan first.
   - **PR mode** — a PR number, URL, or "review the PR": run
     `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/pr.js" <ref>` (no ref = current
     branch's PR) for the PR's metadata, live CI check status and diff in one read-only
     call. `pr.js` never posts anything back to GitHub — it only fetches (`gh` missing or
     unauthenticated → it says so; hand that to the curator rather than treating it as
     a review finding). Treat the CI check summary as the "green CI" evidence step 2
     below asks for, instead of running the suite yourself when it's already green
     upstream; still run it yourself if any check is failing, pending, or missing.
2. **Verify AC-by-AC.** For each criterion: met / not met, with evidence — a test name
   and its result, or a demonstrated behavior. Run the suite yourself; never take the
   spec's own tick-marks on faith.
3. **Review the code,** most severe first:
   - **correctness** — edge cases, failure paths, state/concurrency;
   - **security** — secrets, injection, authz (the secrets guard catches writes, not
     design flaws);
   - **simplification / reuse** — needless complexity, duplicated logic;
   - **test quality** — do the tests actually pin the ACs, or just touch the code?
   Report findings concretely: `file:line`, what breaks, how to fix.
4. **File it back:**
   - Review page → `wiki/syntheses/<feature>-review.md` (verdict, AC table, findings),
     linked from the index and the spec. In PR mode, include the PR URL and its CI check
     summary; the brain never posts the review to GitHub itself — hand the curator the
     filed page (or a short excerpt) to paste into the PR themselves if they want it there.
   - Durable choices the review surfaced → `decisions/` ADRs.
   - A correction made for the 3rd+ time → draft `instincts/pending/<rule>.md`
     (template `instinct.md`) for the curator to promote. If the correction is a *pattern*
     (a CSS property, an API call, an import), give it `ban:` (a single-quoted regex) and
     `ban_paths:` so the hooks enforce it once promoted — `enforce: block` only with the
     curator's say-so.
   - **Work the queue:** `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/instincts.js" status`
     ranks pending rules by confidence. Ask the curator about each `promote?`; only their
     yes runs `instincts.js promote <name>`. Offer `prune` for stale ones.
5. **Close the spec honestly — two exits, always name the next command:**
   - **Any AC not met, or a blocking finding** → the spec stays `status: active`, set
     `phase: build`, list every blocker under a `## Blockers` heading in the spec (AC,
     what fails, `file:line`), and offer **`/brain:build <slug>`** — the build resumes
     from that list, then comes back here.
   - **Every AC verified and no blocking finding** → `status: done`, `phase: done`,
     `audit_score: <verdict — open findings>`, and offer **`/brain:wrap`** to close the
     session (wrap trusts a `done` spec; it does not re-verify it).
   Update the `projects/` page's phase either way.
6. **Bookkeeping:** append `wiki/log.md` `## [YYYY-MM-DD] review | <feature>`, offer
   commit `review: <feature>`.

**Done when:** every AC has a verdict with evidence, findings are filed rather than just
spoken, the spec's status matches reality, log + commit are done, and the curator was
offered the next command (`/brain:build <slug>` on failure, `/brain:wrap` on success).
