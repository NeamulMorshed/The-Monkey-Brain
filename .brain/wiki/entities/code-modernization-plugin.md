---
title: "Code Modernization (capability plugin)"
type: entity
status: active
tags: [plugin, code-modernization, refactor, capability-plugin]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-readme]]", "[[engine-changelog]]", "[[brain-health-audit]]"]
related: ["[[claude-code]]", "[[github-plugin]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[token-diet]]"]
aliases: [code-modernization plugin, code-modernization]
---

# Code Modernization (capability plugin)

An official Anthropic capability plugin that fires on **legacy refactors** — 15 skills + 8 agents
per its own listing.

## How the brain uses it

Per `.brain/reference.md` §9: migration notes and before/after analysis are filed to
`wiki/research/` so the rationale survives the refactor.

## Setup & requirements

**Offered, not bundled** — `auto_install: false` in `recommended-plugins.json`;
`/brain:init` suggests it when a project's shape fits, and the curator approves each install
explicitly (`/plugin marketplace add …` then `/plugin install …`), same as `product-tracking-skills`,
`productivity`, `product-management`, and `ui-ux-pro-max`.

This was not always the case. Per [[engine-changelog]]:
- **`0.14.0`** (2026-09-13) shipped it as one of **five** auto-installed dependencies alongside
  `github`, `frontend-design`, `superpowers`, `security-guidance`.
- **`0.31.0`** (2026-09-15, the token-diet pass) moved it back to the `/brain:init` offer: its
  "15 skills + 8 agents in every request's listing" cost tokens on every turn in every brain
  regardless of whether the project ever does a legacy refactor, so it joined the offered tier
  while `security-guidance` stayed bundled (marked as needing Python 3.10+ instead of dropped,
  since its security net is load-bearing for every project).

## Gotchas

- **Not currently installed on the audited machine** — no plugin cache directory for
  `code-modernization` was found under `claude-plugins-official` here, consistent with it now
  being offered rather than auto-installed; its live behavior in this brain is unverified.
- Its size is the specific reason it moved from bundled to offered — a caution for any future
  "ship it by default" decision about a heavy plugin: weigh the per-request listing cost
  ([[token-diet]]) against how often the project actually needs the craft.

## Related
- [[claude-code]] — the host platform.
- [[github-plugin]] · [[frontend-design-plugin]] · [[superpowers-plugin]] ·
  [[security-guidance-plugin]] — the four plugins that *are* auto-installed today.
- [[token-diet]] — the spec whose findings moved this plugin from bundled to offered.
