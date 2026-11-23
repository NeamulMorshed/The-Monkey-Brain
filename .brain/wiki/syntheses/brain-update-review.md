---
title: "Review — /brain:update (0.36.0)"
type: synthesis
status: active
tags: [review, update, router]
created: 2026-11-24
updated: 2026-11-24
sources: ["[[brain-update-command]]"]
related: ["[[brain-update]]", "[[brain-update-workstream]]", "[[update-skips-only-rewritten-files]]"]
---

# Review — /brain:update (0.36.0)

**Verdict: done — 0 P0 · 2 P1 · 2 P2; both P1s and one P2 fixed in review, one P2 open.** The builder ran
on Sonnet (`fedf28b`) and the review on Opus. Selftest 726, all green locally; example lint clean.

## AC verification
| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 check prints one plan, changes nothing | met | `update.test.js` (no `plugin update`/`new-brain` calls on `--check`); live `--check` on this machine |
| AC-2 skips (amended) | met after fix | `update.test.js`: `dirty` (edited CLAUDE.md) skipped, `busy` (dirty sessions/ + wiki) refreshed, missing → one count line, pruned only on `--apply` |
| AC-3 nothing behind → no command | met | `update.test.js` up-to-date world |
| AC-4 plugin update then new cache's `new-brain.js` | met | `update.test.js` call order + path assertions |
| AC-5 no partial update | met | `update.test.js` missing / offline / failUpdate / failBrain cases |
| AC-6 per-brain log + restart line | met | `update.test.js` log assertions |
| AC-7 skill: check → yes/no → apply | met | selftest AC-7 check; `plugin/skills/update/SKILL.md` |
| AC-8 router + red-first misfire | met | selftest AC-8 cases (built red first, 7 failures) + review case |
| AC-9 docs + 0.36.0 | met | selftest AC-9/AC-12 checks |

## Findings
- **P1 (fixed) — every active brain was skipped.** `update.js` ran `git status --porcelain -- .brain`, and
  hook-written `sessions/agents.md` is tracked and always dirty, so the live `--check` skipped all five
  of the curator's active brains. Now only `.brain/CLAUDE.md`, `.brain/reference.md` and
  `.brain/templates` count — the files `new-brain.js --update` overwrites. See
  [[update-skips-only-rewritten-files]].
- **P1 (fixed) — the plan was noise.** The registry held 11 dead temp-dir entries from old review runs,
  each printed as a `missing` line. Now one count line; `--apply` prunes them (as `registry.list()`
  would).
- **P2 (fixed) — router.** "update the brain's index" routed to `update`; the possessive is now
  excluded, with a selftest case.
- **P2 (open) — wording.** When only the plugin moved, a brain line reads `schema 2.1 → 2.1`; it is a
  templates refresh. Cosmetic.

## Not verified
- `--apply` has not run live on this machine; first live run is the 0.36.0 release check.
