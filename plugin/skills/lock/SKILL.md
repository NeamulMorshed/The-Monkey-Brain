---
description: Take, check, or release the team work lock on the project's Monkey Brain — the whole brain or one spec — so two people don't change the same thing at once. The lock is a committed LOCK.md with an expiry; teammates see it at session start and the hooks keep their writes out of the locked scope. Use when the user says "lock the brain", "lock the <x> spec", "release the lock", "who has the lock", or before a long change on a shared brain. Requires a .brain/ (offer /brain:init when missing).
argument-hint: "acquire <brain|spec-slug> [--hours N] | release | status"
model: haiku
effort: low
---

# /brain:lock — one writer at a time

The driver is `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/lock.js"`.

1. **Check first:** `lock.js status` — who holds what, until when.
2. **Take it:** `lock.js acquire <brain|spec-slug> --hours N --note "what you're changing"`
   (default 8 hours). A spec lock covers `specs/<slug>.md` and `projects/<slug>.md`; a brain
   lock covers every knowledge layer except the append-only log.
3. **Commit and push `LOCK.md` right away** (offer `session: lock <scope>`) — a lock only
   protects you once teammates have pulled it.
4. **Release it when done:** `lock.js release`, then commit and push. Take over someone's active
   lock (`acquire … --force` / `release --force`) only after they've agreed.
