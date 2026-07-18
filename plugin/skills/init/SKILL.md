---
description: Scaffold a Monkey Brain instance (.brain/) into the current project — the per-project LLM wiki + memory that this plugin's hooks and skills operate on. Use when the user asks to set up / initialize / create a brain for a project, or accepts the session-start offer. Also refreshes an existing brain's schema without touching its knowledge.
argument-hint: "[project-path] [--name <display-name>] [--update]"
allowed-tools: Bash(node:*)
model: sonnet
effort: low
---

# /brain:init — scaffold a Monkey Brain instance

Creates `.brain/` at the project root from the bundled template: an operating manual
(`CLAUDE.md`), a seeded wiki (`index`, `log`, `dashboard`), page templates, `Clippings/`
staging, `raw-sources/`, `memory/`, and `resume.md`. Once it exists, the plugin's hooks
(status injection, guards, wiki-check, resume) activate automatically for this project.

## Steps

1. **Resolve the target.** Project root = the argument path if given, else the git root of
   the cwd (fall back to cwd). If `.brain/` already exists there, don't recreate — confirm
   with the user and use `--update` (refreshes `CLAUDE.md` + `templates/` only, never
   touches wiki/raw-sources/memory).
2. **Pick the display name.** Default is the project folder name; use `--name` if the user
   stated one. Ask only if the folder name is cryptic.
3. **Run the scaffold:**
   ```
   node "${CLAUDE_SKILL_DIR}/scripts/new-brain.js" --project "<root>" [--name "<name>"] [--update]
   ```
   It prints the seed-page count and next moves. On error, read the message — it explains
   the fix (`--update` vs `--force`).
4. **Wire auto-load.** Ensure a `CLAUDE.md` at the project root contains a line with
   `@.brain/CLAUDE.md` (create the file or append the import) so the operating manual
   loads in every session. Delete a `.no-brain` marker if one exists — the user just
   changed their mind.
5. **Orient the curator** (2–3 lines): the brain is empty; drop a doc into
   `.brain/raw-sources/` (or web-clip into `.brain/Clippings/`, or paste in chat) and say
   **"ingest this"**; `.brain/` opens as an Obsidian vault for graph browsing.
6. **Offer the capability plugins** (the craft layer). Run
   `node "${CLAUDE_SKILL_DIR}/scripts/plugins.js"` to list the recommended set, then offer
   the ones relevant to *this* project — don't push all nine. The contract:
   **plugins do the craft; the brain records the knowledge** — each plugin's decisions,
   findings, and artifacts get filed back into `.brain/` by the brain's skills and hooks
   (the manifest names the target folder per plugin). Install is model-driven: confirm the
   current `/plugin` command with the curator (marketplace names evolve); never install
   silently. Skip on `--update` unless asked.
7. **Commit** (offer first): `feat: scaffold .brain (Monkey Brain instance)`. The
   `Clippings/.gitignore` keeps staging drops out of git by design.

## Notes

- The brain is project-isolated: its knowledge, log, and memory never mix with other
  projects. The engine ships the schema; the instance owns the content.
- If the user wants to permanently decline the brain for this project, create an empty
  `.no-brain` file at the project root — the session-start offer honors it.
- The recommended plugin set lives in `recommended-plugins.json` (next to this skill) —
  the authoritative list of capability plugins, what each auto-fires on, and which `.brain/`
  folder records its output. `scripts/plugins.js` renders it (`--verbose` for the
  integration notes, `--json` for raw); the instance manual's §9 states the recording
  contract. Plugins auto-activate by their own descriptions; the trigger-router nudges the
  brain's own workflows, not theirs.
