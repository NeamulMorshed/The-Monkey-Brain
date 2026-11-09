---
title: "Ideas — to explore later"
type: research
status: stub
tags: [ideas, backlog]
created: 2026-11-10
updated: 2026-11-10
sources: []
related: ["[[index]]"]
aliases: []
---

# Ideas — to explore later

Loose ideas filed by `/brain:dump`; each one goes through `/brain:research` before a spec.

- **`/brain:update` — one command to update the plugin and the brain** (2026-11-10). For anyone
  who installed from the marketplace. Today it takes two separate steps that people miss:
  `/plugin marketplace update monkey-brain` plus a reinstall of `brain` (then a restart), and
  `/brain:init --update` in each project to refresh `CLAUDE.md`, `reference.md` and `templates/`.
  The likely failure is a new plugin over an old brain, or the reverse. **Open question (where
  brainstorming paused):** should it do the whole job, or only report what's out of date and
  print the steps? To check in research: whether a skill can trigger a plugin update at all (the
  `/plugin` commands are built in; `claude plugin …` CLI behaviour), how to compare the installed
  version with the latest on GitHub, and doing this across every brain on the machine
  (`/brain:home` already lists them).
