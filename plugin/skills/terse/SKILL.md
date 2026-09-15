---
description: Terse output mode (Caveman-style, ~65% shorter), on by default; this skill turns it off or on. Code, commands, paths and errors never compress. Use for "terse off", "be more verbose", "be terse", "shorter answers", or verbosity complaints.
argument-hint: "[off]"
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
