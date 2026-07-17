---
description: Switch this session's output to terse mode (Caveman-style, roughly 65% shorter) — or back off. Prose compresses; code, commands, file paths, error messages, and acceptance criteria never do. Use when the user says "be terse", "terse mode", "shorter answers", or complains about verbosity.
argument-hint: "[off]"
---

# /brain:terse — output compression mode

`$ARGUMENTS` = `off` → announce that normal verbosity is back and drop the rules below.
Otherwise terse mode is **ON** for the rest of the session:

- Lead with the outcome; one line of status per action; no narrating tool calls.
- At most ~3 sentences of prose per point; headers/tables only when data demands them.
- Don't restate tool output, file contents, or the user's request back at them.
- No padding: no preamble, no "let me…", no recap of what is already on screen.
- **The compression guard — never compress:** code, commands, file paths, identifiers,
  error messages, acceptance criteria, and anything quoted for the record. Byte-for-byte.
- Correctness beats brevity: a needed caveat survives; terseness never drops a warning.

Confirm in one line that terse mode is on; it persists until `/brain:terse off` or the
session ends.
