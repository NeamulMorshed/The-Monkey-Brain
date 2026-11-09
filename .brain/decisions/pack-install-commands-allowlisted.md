---
title: "ADR — Pack install commands are allowlisted before the curator sees them"
type: decision
status: accepted
created: 2026-11-10
updated: 2026-11-10
sources: ["[[motion-skill-packs-review]]"]
related: ["[[skill-packs-offered-not-vendored]]", "[[motion-skill-packs]]", "[[trigger-router]]"]
---

# ADR — Pack install commands are allowlisted before the curator sees them

## Context
0.35.0 made `/brain:init` print install commands from `recommended-skills.json` for the curator
to copy and run ([[skill-packs-offered-not-vendored]]). An automated security review of that release
found four weak spots: install steps, fallbacks and notes were printed verbatim, so a poisoned or
careless manifest edit could put a chained shell command (`; curl … | sh`), a non-GitHub clone or a
pasted token in front of someone who trusts the brain; prose in `memory/skill-packs-declined.md`
that merely mentioned a pack id declined it; and the router's offer markers were written
exists-then-create, a race on a shared temp dir. Fixed in 0.35.1 (`8a68542`).

## Decision
- An install entry is shown only if it passes `validInstall(entry, kind)` in `skills.js`:
  **steps** must match `npx skills add …` with no shell metacharacters (`; | & $ \` < >`);
  **fallbacks** must be `git clone` of `https://github.com/…` URLs only; **notes** may not carry
  metacharacters inside backticks. All three are secret-scanned (`sk-`, `ghp_`, `github_pat_`,
  `glpat-`). A failing entry is skipped with a visible warning, never printed.
- A pack is declined only by its own line (`- id`, `* id` or a bare id) that names a real
  manifest pack.
- One-time offer markers are created exclusively (`{ flag: 'wx', mode: 0o600 }`); `EEXIST`
  means already offered.
- Selftest asserts `new-brain.js` and the hook scripts never mention `npx` / `skills add`, so
  only the curator-facing offer can print an install command.

## Why
- The brain never installs anything itself, but a command it prints carries the brain's
  authority. The curator copies it, so what gets printed is what gets protected.
- An allowlist fails closed. A new install shape has to be added on purpose, with a test,
  instead of slipping through a denylist.
- Skipping with a warning is better than refusing the whole manifest: one bad entry doesn't hide
  the other packs, and the warning tells the curator to look.

## Consequences
A legitimate upstream installer that isn't `npx skills add` or a GitHub clone (a tarball URL,
another host, a package manager) needs a code change and a selftest case before it can be
offered. Notes can't show piped examples in backticks.
