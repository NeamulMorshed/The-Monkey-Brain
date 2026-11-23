---
title: "ADR — /brain:update skips a brain only for edits it would overwrite"
type: decision
status: proposed
created: 2026-11-24
updated: 2026-11-24
sources: ["[[brain-update]]", "[[brain-update-review]]"]
related: ["[[brain-update-command]]"]
---

# /brain:update skips a brain only for edits it would overwrite

## Context
The curator's anti-goal for `/brain:update` was "never refresh a brain on top of uncommitted `.brain/`
work". Taken literally (`git status -- .brain`), it skipped every active brain: hooks write
`sessions/` on every session, and wiki work is often uncommitted. The refresh (`new-brain.js --update`)
only overwrites `CLAUDE.md`, `reference.md` and `templates/`; it appends to `wiki/log.md`.

## Decision
A brain is skipped only when `git status --porcelain -- .brain/CLAUDE.md .brain/reference.md
.brain/templates` is non-empty, which is exactly the set the refresh would lose. Other uncommitted work
in `.brain/` does not block the refresh. If `new-brain.js --update` starts writing a new file, add it
to `OWNED` in `update.js`.

## Consequences
Active brains refresh. An appended `wiki/log.md` line can land beside uncommitted log edits, which is
harmless because the log is append-only. Status is `proposed` until the curator accepts it, since it narrows
their stated rule.
