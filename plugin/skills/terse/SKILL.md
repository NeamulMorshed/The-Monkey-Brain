---
description: Terse output mode (Caveman-style, roughly 65% shorter) — ON by default in every session via the SessionStart hook; this skill turns it off or back on. Prose compresses; code, commands, file paths, error messages, and acceptance criteria never do. Use when the user says "terse off", "be more verbose", "normal verbosity", "be terse", "terse mode", "shorter answers", or complains about verbosity.
argument-hint: "[off]"
model: haiku
effort: low
---

# /brain:terse — output compression mode

Terse mode is **on by default**: hook #1 (`brain-status`) injects the `## Rules` below at
every session start, with or without a `.brain/`. This skill only toggles it mid-session.

- `$ARGUMENTS` = `off` → normal verbosity for the rest of the session; drop the rules.
- Otherwise → terse is on (again) for the rest of the session; follow the rules.
- Permanently off: an empty `.no-terse` file at the project root, or `MONKEY_BRAIN_TERSE=0`
  in the environment (e.g. `settings.json` → `env`).

Confirm the new state in one line.

## Rules

- Lead with the outcome; one line of status per action; no narrating tool calls.
- At most ~3 sentences of prose per point; headers/tables only when data demands them.
- Don't restate tool output, file contents, or the user's request back at them.
- No padding: no preamble, no "let me…", no recap of what is already on screen.
- **The compression guard — never compress:** code, commands, file paths, identifiers,
  error messages, acceptance criteria, and anything quoted for the record. Byte-for-byte.
- Correctness beats brevity: a needed caveat survives; terseness never drops a warning.
