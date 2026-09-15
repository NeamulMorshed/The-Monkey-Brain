---
description: One-page offline HTML dashboard of this project's Monkey Brain — index stats, open specs with AC progress, loops, health, recent log and decisions, token usage — written to .brain/sessions/. Use for "dashboard" or "show me the brain".
argument-hint: "[--open]"
effort: low
---

# /brain:dashboard — the brain on one page

The dashboard was built before you read this (zero model tokens):

!`node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/dashboard.js"`

1. Tell the user where the file is and what stands out (open criticals, stalled specs, a low
   cache-hit ratio) in two or three lines.
2. Offer to open it: re-run the script with `--open`, which uses the system's default browser.
3. It is a generated snapshot: regenerate it any time, and don't hand-edit it.
