---
description: Verify a built spec and review its code — AC-by-AC verification with evidence, findings filed back into the Monkey Brain (review synthesis page, ADRs, instinct candidates), and the spec closed out honestly. Use when the user says "review the changes/spec/branch", after /brain:build finishes, or before merging feature work.
argument-hint: "[spec-slug | branch | scope]"
effort: high
---

# /brain:review — verify, judge, file it back

A review that only lives in chat is lost. This one ends in the brain.

## Steps

1. **Scope.** The spec's diff (branch or working tree) when a spec is named or active;
   otherwise the scope the user gave. Read the spec's ACs and test plan first.
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
     linked from the index and the spec.
   - Durable choices the review surfaced → `decisions/` ADRs.
   - A correction made for the 3rd+ time → draft `instincts/pending/<rule>.md`
     (template `instinct.md`) for the curator to promote.
5. **Close the spec honestly:** all ACs verified and no blocking findings →
   `status: done`, `phase: done`, `audit_score: <verdict — open findings>`; otherwise it
   stays `active` with the blockers listed. Update the `projects/` page.
6. **Bookkeeping:** append `wiki/log.md` `## [YYYY-MM-DD] review | <feature>`, offer
   commit `review: <feature>`.

**Done when:** every AC has a verdict with evidence, findings are filed rather than just
spoken, the spec's status matches reality, and log + commit are done.
