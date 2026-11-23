---
description: Update the brain plugin from the marketplace and refresh every Monkey Brain on this machine in one go, after one yes. Use for "update the brain", "update monkey brain", "update all brains" or "is the plugin up to date". Needs no .brain/ here.
argument-hint: ""
effort: low
---

# /brain:update — plugin + every brain, one command

Two steps people forget: update the `brain` plugin, and `/brain:init --update` in **every**
project that has a brain. Miss one and a new plugin runs over an old brain, or the reverse.
This does both. It needs no `.brain/` in the current project.

## Steps

1. **Check (changes nothing):** run
   `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/update.js" --check`
   It refreshes the marketplace clone, then prints one plan: `plugin <installed> → <latest>` (or
   `plugin <v> is current`), the brains it would refresh, and every skipped brain with its reason
   (`uncommitted .brain/ changes`, `missing`).
2. **Show the plan** as printed. If it says `everything is up to date`, say so and stop.
   If the check aborted (no `claude` on PATH, offline), report the reason: nothing was changed.
3. **Ask one yes/no:** "Apply this plan?" Mention any skipped brain with uncommitted work and
   that it stays untouched until committed.
4. **Only on yes, apply:** run
   `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/update.js" --apply`
   Plugin update first (only when behind), then `new-brain.js --update` per brain with the
   **new** version. One brain failing does not stop the others.
5. **Report** the per-brain outcomes. When the plugin was updated, end with: restart Claude Code
   to load the new hooks and skills (a skill cannot restart it).

Knowledge is never touched: only `CLAUDE.md`, `reference.md` and `templates/` of each brain are
refreshed, and each refreshed brain gets a `wiki/log.md` entry.
