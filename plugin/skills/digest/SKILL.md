---
description: Standup or weekly review from the Monkey Brain — what's blocked, what got done (log and commits), what's in flight — filed to sessions/. Use for "standup", "daily brief", "what did we do yesterday" or "weekly review".
argument-hint: "[week]"
effort: low
---

# /brain:digest — standup and weekly review

A script builds the digest from the brain and git (zero model tokens); you present it.

1. Run `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/digest.js"` for a standup (last 24 hours),
   or add `--week` when `$ARGUMENTS` asks for the weekly review (last 7 days, plus decisions,
   closed specs, the instinct queue and token usage). It files the digest to
   `sessions/standup-<date>.md` or `sessions/weekly-<date>.md`.
2. Present it as returned, **blockers first**. Add one line of judgment at the top: the single
   thing that most needs attention today (or this week).
3. For the weekly review, nudge what's stale: idle workstreams (pause or close them), pending
   instincts (promote or drop), open P0s. Offer the skill that fixes each; don't fix silently.

A digest is a read of the brain: no log entry, no commit.
