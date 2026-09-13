---
description: One dashboard for every Monkey Brain project on this machine — health status, open specs, running loops, and token usage per project and combined. Use when the user says "show all my brains", "dashboard for all projects", "monkey brain home", or wants an overview across every project rather than just the current one. Works with no .brain/ in the current directory — it reads the cross-machine project registry.
argument-hint: "[--days N] [--open]"
model: haiku
effort: low
---

# /brain:home — every brain on this machine, one page

Built before you read this (zero model tokens) — the script scans the registry of every
project that has ever scaffolded or opened a `.brain/` on this machine:

!`node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/home.js"`

## How to read it

- **Needs attention** — projects whose last `/brain:doctor` run found a critical, or that have
  a spec waiting on the curator (`sessions/review-required.md`). Lead with this.
- **Status** — Healthy / Warning / Critical mirror the project's own doctor report; **Not checked
  yet** means `/brain:doctor` has never run there.
- **Tokens / cache-hit** — real usage from Claude Code's transcripts for that project, same
  source as `/brain:usage`, just summarized across every project at once.
- A project only appears once someone has run `/brain:init` there, or opened a Claude Code
  session inside an existing `.brain/` at least once — that's what registers it.

## Steps

1. Lead with what needs attention, if anything; otherwise say plainly that nothing does.
2. Name the busiest project by tokens if it stands out — that's usually worth knowing.
3. Offer to open it: re-run the script with `--open` (uses the system's default browser), or
   with `--days N` for a longer window than the default 7.
4. It's a generated snapshot — regenerate any time, don't hand-edit `home.html`.
