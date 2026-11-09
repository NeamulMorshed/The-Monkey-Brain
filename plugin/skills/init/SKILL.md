---
description: Scaffold a Monkey Brain (.brain/) into the current project, or refresh an existing brain's schema without touching its knowledge. Use when the user asks to set up, initialize or create a brain, or accepts the session-start offer.
argument-hint: "[project-path] [--name <display-name>] [--update]"
allowed-tools: Bash(node:*)
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
   with the user and use `--update` (refreshes `CLAUDE.md`, `reference.md` and `templates/`,
   keeps the display name, never touches wiki/raw-sources/memory).
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
   `node "${CLAUDE_SKILL_DIR}/scripts/plugins.js"` to list the recommended set. The ones
   marked ✓ ship with the brain plugin as dependencies — already installed and enabled, so
   just mention them. Offer the unmarked ones relevant to *this* project — don't push them
   all. The contract: **plugins do the craft; the brain records the knowledge** — each
   plugin's decisions, findings, and artifacts get filed back into `.brain/` by the brain's
   skills and hooks (the manifest names the target folder per plugin). Install is
   model-driven: confirm the current `/plugin` command with the curator (marketplace names
   evolve); never install silently. Mention the opt-in `brain-all` bundle only if the
   curator wants every official plugin — it is heavy on context. Skip on `--update` unless asked.
6b. **Offer the recommended MCP servers** (the connected-data layer). Run
   `node "${CLAUDE_SKILL_DIR}/scripts/mcp-servers.js" --project "<root>"` to list the curated
   set (Supabase, Firebase, Figma, Framer, Vercel) with ✓ marking ones already configured in
   this project's `.mcp.json`. Offer the unconfigured ones relevant to *this* project. Same
   contract as step 6, extended to MCP servers: the brain never installs a server, runs a
   setup command, or touches a credential — hand over the listed `setup_hint` (an env-var
   placeholder, never a literal secret) and let the curator run and confirm it themselves. A
   configured server outside the curated set is still surfaced (generic "no filing rules yet"
   note) so nothing connected goes unmentioned. Skip on `--update` unless asked.
6c. **Offer the skill packs** (the motion and video craft layer). Run
   `node "${CLAUDE_SKILL_DIR}/scripts/skills.js" --project "<root>"` to list the three packs
   (web-motion, video, mobile-motion) marked installed / partial / not installed from
   `.claude/skills/` and `~/.claude/skills/`. Offer only the packs relevant to *this* project,
   and state each pack's **context cost** (its skill descriptions load every turn) and, for
   video, **Remotion's licence note** (free up to 3 employees, a paid company licence above). Run a
   pack's `install_steps` (`npx skills add ...`, one command at a time, never chained)
   **only after the curator says yes to that pack**; the brain never installs by default, and
   `new-brain.js` scaffolding never touches packs. Tell the curator a step marked slow in
   `install_notes` is slow (the gsap step clones a large repo). A **partial** install (skills.js
   shows `~ partial`) means a step failed: retry that step, or run the pack's `install_fallbacks`
   (a sparse clone of the one directory), then re-run skills.js to confirm. A **declined** pack goes
   in `.brain/memory/skill-packs-declined.md` (one pack id per line); the router never offers a
   pack listed there, and the router makes each not-installed offer once per session per pack. After a
   web-motion install, offer `skills.js --seed-instincts web-motion --brain "<root>/.brain"` (writes
   `instincts/pending/` only; the curator promotes). Skip on `--update` unless asked.
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
  integration notes, `--json` for raw); the brain's `reference.md` §9 states the recording
  contract. Plugins auto-activate by their own descriptions; the trigger-router nudges the
  brain's own workflows, not theirs.
- The recommended skill packs live in `recommended-skills.json`; `scripts/skills.js` renders the
  offer, detects installs and seeds taste rules (reference.md §9, "Skill packs").
- The recommended MCP server set lives in `recommended-mcp-servers.json` (next to this
  skill) — same shape and contract as the plugin manifest, for MCP servers instead of Claude
  Code plugins. `scripts/mcp-servers.js` renders it and detects which curated servers are
  already in this project's `.mcp.json` (`--verbose` for setup hints, `--json` for raw);
  `reference.md` §9 states the same recording contract. The brain never calls, installs,
  or configures an MCP server itself — it only recognizes what's connected.
