---
title: "Review — develop-lifecycle-fixes"
type: synthesis
status: active
tags: [review, lifecycle, hooks, gates]
created: 2026-09-15
updated: 2026-09-15
sources: ["[[develop-lifecycle-fixes]]", "[[develop-lifecycle-dogfood]]"]
related: ["[[develop-lifecycle-fixes]]", "[[develop-lifecycle-dogfood]]", "[[spec-scope-globs-gate-ownership]]", "[[one-stop-message-for-wrap-nudges]]"]
aliases: []
question: "Does build commit aed8351 meet every AC of develop-lifecycle-fixes, and is the code sound?"
---

# Review — develop-lifecycle-fixes

Verification of the build commit `aed8351` (plus the review-fix commit that follows this page) against [[develop-lifecycle-fixes]]. Scope: the working-tree diff on `plugin/hooks/scripts/{guards,lib,wrap,wiki-check,bans,selftest}.js`, `plugin/skills/{doctor,lint}/scripts`, the four lifecycle SKILL docs, the instance manual, and the `.brain/` records. Method: the suite was re-run by the reviewer (never the spec's own ticks), then an independent adversarial reviewer (opus, read-only) audited the hook diff with executable probes.

## Verdict
**Done, with fixes applied in-review.** All 12 ACs verified. The adversarial pass found two P0s, one P1 and five P2s in the build commit; every one is fixed and pinned by a selftest before this page was filed. Selftest 354 → 390, all green; both manifests validate `--strict`.

## AC table

| AC | Verdict | Evidence (selftest check name, or file) |
| --- | --- | --- |
| AC-1 `scope:` parsed as array | ✅ met | `parseFrontmatter: inline [a, b] list → array` · `block "- item" list → array` · `column-0 "- item" block lists parse` |
| AC-2 only claiming specs consulted | ✅ met | `scoped: a write inside an approved spec's scope passes …` · `… blocked by that spec` · `scoped TDD gate …` ×2 |
| AC-3 fallback + outside-project | ✅ met | `unscoped path: falls back to every open spec` · `a write outside the project root is never tier-gated` · `a project dir named "..odd" is still inside the project` |
| AC-4 two-spec selftests | ✅ met | the six checks above, plus 7 `glob:` semantics checks and the unbalanced-`[` check |
| AC-5 template + plan step | ✅ met | `spec template carries a scope: line` · `/brain:plan tells the planner to fill scope:` |
| AC-6 review names both exits | ✅ met | `/brain:review names both exits` (`skills/review/SKILL.md` step 5) |
| AC-7 wrap trusts `done` | ✅ met | `/brain:wrap trusts status: done and re-verifies only active specs` |
| AC-8 build never sets `plan_approved` | ✅ met | `/brain:build states it never sets plan_approved` |
| AC-9 one Stop message | ✅ met | `all three unmet → one block naming wrap[log], wrap[decisions] and wrap[git]` |
| AC-10 Stop selftests | ✅ met | `consolidated nudge fires once per session` · the three pre-existing per-check tests still green |
| AC-11 manual §4 single definition | ✅ met | `manual §4 names loop, wrap, digest and dump …` · `manual §10 cites §4` · `skills README cites the manual` |
| AC-12 green, strict, versioned | ✅ met | `selftest: ALL GREEN` (390) · `claude plugin validate --strict` ×2 · CHANGELOG 0.28.0 · both manifests 0.28.0 |

## Findings (most severe first, all fixed)

1. **P0 — glob→regex passes clobbered each other** (`guards.js` scopeMatches, build commit lines 129-138). `**/` became `(?:.*/)?`, then the `?` pass rewrote that into a broken capture group and the `*` pass rewrote `.*`. Measured: `src/**/*.js` matched nothing, `**` matched only root files, `src/auth/**` matched one level deep. Worst case was **under-gating**: an unapproved architecture spec with `scope: [src/**]` beside a feature spec claiming `src/ui` let a `src/ui/x.js` write bypass the plan gate. Fix: single left-to-right tokenizer `globToRegExp`. Pinned by seven `glob:` checks that go through the real gate with two open specs.
2. **P0 — unbalanced `[` in a glob threw** out of `new RegExp`, so `guards.js` exited 1 (fail-open) and every gate was skipped for that write. Fix: `[` and `]` are now escaped by the tokenizer. Pinned: `an unbalanced [ in a scope glob never throws`.
3. **P1 — two more copies of the alias extractor** (`skills/doctor/scripts/doctor.js:57`, `skills/lint/scripts/lint.js:38`) still expected a string, so `aliases: ["A", "B"]` (now an array) yielded no aliases and doctor/lint would report false orphans. Fix: one `lib.extractAliases` shared by wiki-check, doctor and lint. Pinned: `lib.extractAliases: array form and quoted-string form both work`.
4. **P2 — `ban: [0-9]` unquoted** became a one-item list and compiled to `/0-9/`. Fix: `bans.compile` rejoins an array as `[…]`. The instinct template already mandates single quotes.
5. **P2 — comment after an inline list** (`tags: [a, "b #c"]`) was truncated by comment stripping. Fix: the list rule now requires the whole value to be `[…]` plus an optional comment, and cuts at the last `]` before stripping. This also keeps `[0-9]+` and `[WIP] thing` as scalars. Pinned by three parser checks.
6. **P2 — quoted commas split** (`["a,b", c]`). Fix: `splitTopLevel` respects quotes. Pinned.
7. **P2 — `listKey` leaked across a nested map** (`meta:\n  owner: bob\n  - leaked` → `{meta: ["leaked"]}`). Fix: any non-item, non-key line ends the pending list. Pinned.
8. **P2 — column-0 `- item` lists** (valid YAML) parsed as `''`. Fix: items may be at column 0. Pinned.
9. **P2 — a project directory named `..odd`** was treated as outside the project. Fix: `relProj === '..' || startsWith('../')`. Pinned.

Nothing found in `wrap.js` (marker and block stay one-to-one, `stop_hook_active` still short-circuits), in the Windows cross-drive `inProject` check, or in `search.js` term extraction.

## Test quality
The first build's scope tests only used `src/auth/**` against a direct child and a literal directory, which is exactly why the `**` bug shipped. The review's `probe()` helper pins each glob through the real gate with a second open spec that always claims the file, so a no-match can never hide behind the all-specs fallback.

## Process notes for the lifecycle itself
- The implementer and the reviewer were the same session; the independent adversarial subagent was what caught the P0s. The review skill's "main model reviews Sonnet's build" pairing held in spirit, and the dispatch hook correctly demanded an explicit model for it.
- The wrap-time reminders and the TDD gate both fired on this very build (the gate blocked a scratch-directory write, which became the AC-3 outside-project clause). Dogfood evidence, filed.

## Sources
- [[develop-lifecycle-fixes]] · [[develop-lifecycle-dogfood]] · [[spec-scope-globs-gate-ownership]] · [[one-stop-message-for-wrap-nudges]]
