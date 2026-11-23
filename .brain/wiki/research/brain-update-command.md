---
title: "Research — a /brain:update command"
type: research
status: active
tags: [update, plugin, registry, cli]
created: 2026-11-24
updated: 2026-11-24
sources: ["[[ideas]]"]
related: ["[[brain-update]]", "[[ideas]]"]
---

# A `/brain:update` command — research

> **Question:** can one command update the installed plugin *and* every brain on the machine, and
> should it act or only report? · **For:** [[brain-update]]

## Findings
- **A skill can update the plugin from the shell.** Claude Code 2.1.330 ships
  `claude plugin marketplace update [name]` and `claude plugin update <plugin>` ("Update a plugin
  to the latest version (restart required to apply)"). Checked with `claude plugin --help`,
  2026-11-23.
- **The installed version is machine-readable.** `claude plugin list --json` returns
  `{ id: "brain@monkey-brain", version, installPath, ... }`; `installPath` is
  `~/.claude/plugins/cache/monkey-brain/brain/<version>`.
- **The latest version is local after a marketplace refresh.**
  `~/.claude/plugins/marketplaces/monkey-brain/.claude-plugin/marketplace.json` carries each plugin's
  `version`; before a refresh it is stale (it still said `brain-all` 0.15.0 after 0.15.1 shipped).
  No GitHub API call is needed.
- **The brain refresh can run before the restart.** A new version lands in its own cache folder, so
  that folder's `skills/init/scripts/new-brain.js --update --project <root>` refreshes a brain with the
  *new* templates at once; only hooks and skills wait for the restart.
- **Every brain is already known.** `plugin/hooks/scripts/registry.js` `list()` returns each
  registered project whose `.brain/CLAUDE.md` exists (what `/brain:home` shows).
- **Doctor #15 `schema-version`** already flags an instance schema older than the engine; nothing
  compares the installed plugin with the latest.
- **Router overlap:** the `home` route matches `\b(all|every) (my |our )?brains?\b`, so the bare reply
  "all brains" fired `/brain:home` on 2026-11-24 — a misfire to pin in selftest first.

## Recommendation
Do the whole job (curator's pick, 2026-11-24, over report-only or a `--apply` flag): check, show one
plan, one yes, update the plugin, refresh **every** registered brain from the new cache (curator:
"all brains"), skip projects with uncommitted `.brain/` changes, then ask for a restart. A Node
script (`update.js`) does the deterministic work, like doctor and home.

## Filed
Feeds: [[brain-update]] · Idea: [[ideas]]
