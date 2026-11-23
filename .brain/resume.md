---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-11-24 14:10
---

## Where we left off
2026-11-24 — `/brain:update` (spec [[brain-update]]) is built, reviewed on Opus ([[brain-update-review]],
2 P1 + 1 P2 fixed) and closed; 0.36.0 is on main (`7369b40`), CI green on all 6 jobs, selftest 726 —
released as `v0.36.0` (2026-11-24); **`--apply` deferred by the curator, never run live.** Earlier this session: `brain-all`
0.15.1 after catalog drift (released `brain-all-v0.15.1`). History: [[log]].

## Next steps
- [x] GitHub MCP authenticates again (`get_me` OK, 2026-11-23).
- [x] Installed plugin is 0.35.1; doctor runs #21 (2026-11-23).
- [x] `/brain:update` built + reviewed, 0.36.0 on main, CI green (2026-11-24).
- [x] Tag `v0.36.0` + GitHub Release; live `--check` clean — plugin 0.35.1 → 0.36.0, 7 brains, 0 skipped, 11 dead registry folders (2026-11-24).
- [ ] Run `node plugin/hooks/scripts/update.js --apply` — curator deferred 2026-11-24; ask before running.- [ ] Curator: accept or reject ADR [[update-skips-only-rewritten-files]] (proposed; narrows "skip any uncommitted .brain/").
- [ ] Cosmetic P2: `schema 2.1 → 2.1` line when only the plugin moved — say "templates refresh".
- [x] Tag `v0.35.1` on `8a68542` + the repo's first GitHub Release (notes = CHANGELOG 0.35.1 section), 2026-11-10.
- [ ] Tag + release every future version bump the same way.
- [ ] A router misfire seen in a real session gets a selftest case before its fix.

## Task log (auto)
- [2026-09-15 11:17] ■ session ended (other)
- [2026-09-15 22:33] ■ session ended (clear)
- [2026-09-16 07:54] ■ session ended (clear)
- [2026-09-16 23:34] ■ session ended (prompt_input_exit)
- [2026-09-16 23:45] ■ session ended (other)
- [2026-11-09 23:59] ■ session ended (clear)
- [2026-11-10 00:25] ■ session ended (other)
- [2026-11-24 01:54] ■ session ended (clear)

## Open — security hardening for 0.35.x (from the automated review, 2026-11-09)
- [x] `trigger-router.js` `firstOffer`: create the marker with `{ flag: 'wx', mode: 0o600 }`, treat EEXIST as offered, drop the `existsSync` pre-check.
- [x] `skills.js` `declinedPacks`: parse line-wise (`^\s*[-*]?\s*([a-z][a-z0-9-]*)\s*$`) and intersect with manifest pack ids.
- [x] Manifest validation: apply the no-secret scan and an allowlist (`npx skills add …` / `git clone … https://github.com/…`) to `install_fallbacks` and `install_notes` too; `skills.js` refuses to render an entry that fails.
- [x] Selftest: restore the AC-4 assertion that `new-brain.js` never mentions `recommended-skills|skills add|npx`.
A first attempt via an inline `node -e` patch broke escaping and was reverted — use Edit, test-first.
