---
description: Definition-of-done for a Monkey Brain work session — verify the work, sync the bookkeeping (wiki log, index stats, resume narrative), and commit with the vault's conventions. Use when the user says "wrap up", "end the session", "call it a day", or after completing a milestone.
argument-hint: "[one-line summary of the session]"
effort: high
---

# /brain:wrap — close the loop on a session

Nothing is "done" until it is verified, logged, and committed. This skill is the manual
counterpart of the automatic wrap hook (which only reminds and self-heals index stats) —
the narrative belongs to you.

## Steps

1. **Verify the work honestly.**
   - If `.brain/specs/` has a spec this session worked against, check its numbered
     acceptance criteria one by one and report each as met / not met.
   - If project code changed and the project has obvious checks (package scripts, test
     suite, linters), run them. Report failures with output — never paper over them.
   - **Domain-pack gate:** if the active workstream's `projects/<name>.md` names a `pack:`
     (e.g. `pack: product-design`), open that pack's `checklist.md`
     (`${CLAUDE_SKILL_DIR}/../<pack>/checklist.md`) and run it. Report every **open P0** with
     its location; an unmet P0 **blocks "done"** unless the curator explicitly accepts it
     (record the acceptance in the project-status). Non-P0 items are advisories.
2. **Sync the wiki bookkeeping** (skip whatever already happened during the work):
   - `wiki/log.md` — if knowledge work happened this session and has no entry yet, append
     `## [YYYY-MM-DD] session | <summary>` (or the specific `ingest |` / `query |` /
     `lint |` prefix) with 2–4 lines of what changed. Append-only.
   - `wiki/index.md` — ensure new pages are listed and the frontmatter
     `source_count` / `page_count` / `updated` match reality.
   - `decisions/` — if this session made a real design/architecture decision
     (a build or review usually does), distill the **why** into
     `decisions/<slug>.md` (template `templates/decision.md`) so the reasoning
     survives. The wrap hook nudges once when a build/review session filed none.
3. **Update the resume pointer** (`.brain/resume.md`, or root `resume.md` in the engine
   repo): rewrite **"Where we left off"** (2–4 lines) and **"Next steps"** (add new boxes,
   tick finished ones). Leave **"Task log (auto)"** alone — hooks own it. Bump `updated:`.
4. **Commit** with the vault conventions — one commit per logical step that isn't
   committed yet (`ingest:` / `query:` / `lint:` / `session:` / `feat:` / `schema:`).
   Show what will be staged, then commit. Never commit `Clippings/` staging drops.
5. **Report the outcome** in 3–5 lines: what was verified (with results), what was logged
   and committed, and the top next step now recorded in resume.md.

**Done when:** checks ran (or none applied), log + index + resume reflect the session,
and every logical step is committed.
