---
title: "Team Lock"
type: concept
status: active
tags: [team-mode, lock, git, collaboration, hooks]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]"]
related: ["[[plan-and-tdd-gates]]", "[[instincts-and-bans]]", "[[session-injection]]", "[[claude-code]]"]
aliases: ["lock.js", "LOCK.md", "/brain:lock", "team mode"]
---

# Team Lock

A git-native work lock (v3 P16, v0.21.0) for a team sharing one brain: a committed, expiring
`.brain/LOCK.md` states who holds it, on what scope (the whole brain, or one spec), and until
when — so teammates coordinate without a server, and the guard hooks keep their writes out of the
locked scope until it expires or is released.

## How it works

`plugin/hooks/scripts/lock.js` is a CLI, not a hook itself:
`acquire <brain|spec-slug> [--hours N] [--note "…"] [--force] | release [--force] | status`
(`lock.js:104-129`).

- **Identity** (`identity()`, `lock.js:27-34`): `MONKEY_BRAIN_AUTHOR` env var, else `git config
  user.email`/`user.name`, else the OS username.
- **`acquire()`** (`lock.js:72-91`) refuses to overwrite another still-active lock unless
  `--force` (only after the two people have agreed); writes `LOCK.md` frontmatter — `author`,
  `scope`, `since`, `until` (`since` + `--hours`, default **8**), `note` — plus a human sentence
  reminding the curator to commit and push it, and to `/brain:lock release` when done.
- **`readLock(brain)`** (`lock.js:43-56`) parses that frontmatter; `active` is true only when
  `until` parses and is still in the future — an expired lock needs no explicit release, it just
  stops applying.
- **`inScope(lock, rel)`** (`lock.js:59-62`): `scope: 'brain'` covers
  `wiki/|specs/|decisions/|projects/|memory/|instincts/` — **except `wiki/log.md`**, which is
  excluded because it already merges safely via `.gitattributes` (locking it would block
  legitimate parallel logging for no benefit). `scope: <slug>` covers exactly
  `specs/<slug>.md` or `projects/<slug>.md`.
- **Enforcement — `guards.js` guard #7** (`guards.js:257-268`): for any write inside the brain,
  if a lock is active, in scope, and held by someone other than the caller's own identity, the
  write is blocked, naming the holder, scope, expiry and the `--force` override — see
  [[plan-and-tdd-gates]] for where this sits among the other guards.
- **Visibility — `brain-status.js`** (`SessionStart`, `brain-status.js:96-106`): the lock section
  is **priority 0, never dropped by the token budget** — every teammate sees it every session.
  `describeLock()` (`lock.js:64-70`) renders `🔒 X holds the lock on Y until Z` (active) or
  `🔓 …expired… — free to take over`, plus a hint to release it (if you hold it) or coordinate
  (if someone else does).
- **The union-merge plumbing that makes this safe alongside real collaboration:**
  `.brain/.gitattributes` marks `wiki/log.md`, `sessions/agents.md` and
  `sessions/review-required.md` `merge=union`, so two authors' parallel appends never conflict
  (verified end to end with a real bare repo and two clones); `sessions/.gitignore` keeps
  per-machine caches (graph, dashboard, injection receipts, edit counts, health report, gate
  counters, loop state) out of git entirely — only genuinely shared state round-trips through
  commits. `/brain:init --update` adds both to brains scaffolded before team mode existed.
- `/brain:lock` is the skill form; router phrases ("lock the `<x>` spec", "who has the lock",
  "release the lock") route to it, guarded so app "lock screen" work stays app work.

## Knobs

- `--hours N` (default 8).
- `--note "…"` (free text, recorded and shown).
- `--force` (take over an active lock — deliberately friction-y, not silent).
- `MONKEY_BRAIN_AUTHOR` — identity override when git config isn't set or is wrong for this brain.
- `scope`: `'brain'` (everything except the log) or a spec/project slug (one file, two paths).

## Cost

`lock.js` runs only on explicit `/brain:lock` invocation — zero session cost otherwise.
`guards.js`'s lock check runs on every in-brain write but is one small file read plus a regex
test. `brain-status`'s lock section is *never* budget-dropped once a lock exists, by design —
teammates must see it even under a tight token budget, which is the one deliberate exception to
"optimize by injecting less, never more."

## Gotchas & history

- **The lock only protects once pushed *and* pulled** — it is a committed file, not a live
  server. `acquire`'s own output says so explicitly: "Commit and push `LOCK.md` now — it only
  protects you once teammates have pulled it." Acquiring locally and forgetting to push protects
  no one.
- `wiki/log.md` staying outside `scope: 'brain'` is deliberate, not an oversight — it is the one
  layer designed to merge without a lock at all.
- Expiry is time-based and unilateral: reclaiming an *expired* lock needs no coordination
  (`readLock`'s `active` flag just checks `until > Date.now()`), but taking over a *still-active*
  one needs `--force` after agreeing — the tool won't silently let two people believe they hold
  the same scope.
- Shipped in **v0.21.0 (v3 P16)** alongside per-author digests (a teammate's same-day standup
  file gets a name suffix instead of being overwritten, and every digest records its author) —
  part of the same "close the gap with a competitor vault" push that also produced blast-radius
  routing and bounded loops (`engine-roadmap`, P16).

## Related

- [[plan-and-tdd-gates]] — guard #7 in the same `guards.js` hook enforces the lock's scope.
- [[instincts-and-bans]] — guard #6, adjacent enforcement in the same write path.
- [[session-injection]] — `brain-status` is how teammates actually see an active lock.
- [[claude-code]] — the host whose `SessionStart`/`PreToolUse` hooks carry lock visibility and enforcement.
