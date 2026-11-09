---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-11-09
---

## Where we left off
2026-09-16 — the brain health audit ([[brain-health-audit]]) is fully acted on, one spec at a time on
the curator's "do all of these on your own". Four specs, each built test-first and closed after an
independent review on another model family: brain-correctness (0.30.0), token-diet (0.31.0),
engine-knowledge (0.32.0), router-and-drift (0.33.0; review fixes in `6ce0203`).
Workstream `brain-hardening` → done. `brain-all` is 0.14.1 (294/294) and a weekly `bundle-drift`
CI job watches the catalog. 0.33.1: scaffolded manuals are always LF (a Windows clone made them
CRLF, over the 10 KB budget) — caught by the installed cache's selftest. 0.33.2: design phrasings
("design the onboarding user flow", "redesign the checkout ux") reach `/brain:product-design`,
found by a 128-probe independent test of the installed plugin. 0.33.3: CI had been red for five
pushes (example-brain slug collisions); fixed, `/brain:wrap` now checks CI; run 35127534491 green on
all 6 jobs, selftest 590.

2026-11-09 — `bundle-drift` had been red since 2026-10-12 unnoticed: the catalog dropped
`data-agent-kit-starter-pack` (bundle unloadable) and added 22. `brain-all` regenerated to 315/315, 0.15.0.

## Next steps
- [ ] Curator: a `GITHUB_PERSONAL_ACCESS_TOKEN` is set but the github MCP returns HTTP 401 — replace it, or disable the github plugin.
- [x] Reinstall/restart — this session runs the 0.33.3 cache.
- [ ] Check `gh run list --workflow bundle-drift.yml` at session start (a red scheduled run went unseen five weeks); a router misfire seen in a real session gets a selftest case before its fix.

## Task log (auto)
- [2026-09-15 11:17] ■ session ended (other)
- [2026-09-15 22:33] ■ session ended (clear)
- [2026-09-16 07:54] ■ session ended (clear)
- [2026-09-16 23:34] ■ session ended (prompt_input_exit)
- [2026-09-16 23:45] ■ session ended (other)
