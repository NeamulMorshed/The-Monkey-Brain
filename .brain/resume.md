---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-09-16 12:00
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
found by a 128-probe independent test of the installed plugin; selftest 589.

## Next steps
- [ ] Curator: set `GITHUB_PERSONAL_ACCESS_TOKEN` or disable the github plugin — doctor #20 warns until then.
- [ ] Restart Claude Code after the reinstall so the hooks run 0.33.0 (the old session ran 0.29.1 hooks).
- [ ] Watch the weekly `bundle-drift` job; a router misfire seen in a real session gets a selftest case before its fix.

## Task log (auto)
- [2026-09-15 11:17] ■ session ended (other)
- [2026-09-15 22:33] ■ session ended (clear)
