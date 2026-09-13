---
description: Generate a one-page HTML dashboard of the project's Monkey Brain — index stats, open specs with AC progress, running loops, workstreams, the last health report, recent log and decisions, and 7-day token usage. Self-contained (no network), written to .brain/sessions/dashboard.html. Use when the user says "dashboard", "show me the brain", or wants an overview to open or share. Requires a .brain/ (offer /brain:init when missing).
argument-hint: "[--open]"
model: haiku
effort: low
---

# /brain:dashboard — the brain on one page

The dashboard was built before you read this (zero model tokens):

!`node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/dashboard.js"`

1. Tell the user where the file is and what stands out (open criticals, stalled specs, a low
   cache-hit ratio) in two or three lines.
2. Offer to open it: re-run the script with `--open`, which uses the system's default browser.
3. It is a generated snapshot: regenerate it any time, and don't hand-edit it.
