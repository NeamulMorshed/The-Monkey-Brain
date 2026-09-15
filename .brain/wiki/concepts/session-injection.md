---
title: "Session Injection"
type: concept
status: active
tags: [hooks, session-start, context-budget, brain-status]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]", "[[brain-correctness-review]]"]
related: ["[[resume-system]]", "[[stop-nudges]]", "[[recall-and-search]]", "[[bounded-loops]]", "[[team-lock]]", "[[doctor-health-checks]]", "[[trigger-router]]", "[[wiki-self-healing]]", "[[model-routing]]", "[[claude-code]]"]
aliases: ["brain-status", "SessionStart injection"]
---

# Session Injection

What every Claude Code session gets told about the project's Monkey Brain the moment it
starts, without reading the whole `wiki/` — a hard-budgeted status block built by
`brain-status.js` (hook #1, `SessionStart`), the engine's answer to the "Caveman" anti-pattern
of re-reading a vault per task.

## What it is
On every `SessionStart`, `plugin/hooks/scripts/brain-status.js` finds the project's `.brain/`
(`lib.findBrainDir`) and, if present, assembles a prioritized, token-budgeted markdown block —
manual pointer, index stats, team lock, health, active specs/projects, instincts/bans,
decisions, search mode, recent log, memory — and injects it as `additionalContext`. Outside a
brain it instead offers a one-line `/brain:init`, plus terse-mode rules for every project.

## How it works
- `BUDGET = Number(process.env.MONKEY_BRAIN_BUDGET || 3000)` (`brain-status.js:33`) — default
  3000 tokens, estimated as `chars/4` (`lib.estimateTokens`).
- Sections are built as `[priority, text]` pairs (`brain-status.js:84`): **priority 0** (never
  dropped) — the manual pointer, terse block, team lock (`[[team-lock]]`), index stats.
  **Priority 1** — Clippings backlog, health summary (`[[doctor-health-checks]]`), active
  specs, stuck plan-gate blocks + running loops (`[[bounded-loops]]`), active projects,
  instincts/learned bans, search mode (built-in vs qmd, `[[recall-and-search]]`). **Priority
  2** (drops first) — decisions ("the why", last 3 ADRs), last 3 `wiki/log.md` heads, memory
  file count.
- Budget enforcement (`brain-status.js:229-236`): render all sections, then while over budget,
  drop lowest-priority sections first (`for (const pr of [2, 1])`), popping the *last* section
  at that priority each time — priority 0 is structurally exempt from the loop.
- No-brain fallback (`brain-status.js:60-78`): on `input.source === 'startup'` and no
  `.no-brain` marker at the project root, a single-line `/brain:init` offer; terse-mode rules
  are still appended for every project, brain or not.
- Terse mode (`terseBlock`, `brain-status.js:37-47`): reads the live `## Rules` section out of
  `skills/terse/SKILL.md` at runtime (never copy-pasted, so it cannot drift) and is on by
  default every session. Off via an empty `.no-terse` file at the project root, or
  `MONKEY_BRAIN_TERSE=0`.
- `hooks.json`'s `SessionStart` array runs `brain-status.js` unconditionally, and a second
  matcher (`startup|clear`) additionally runs `resume.js` (`[[resume-system]]`) — the two hooks
  are independent and their `additionalContext` outputs both get injected.
- `registry.touch(path.dirname(brain))` (`brain-status.js:80`) registers/refreshes the project
  in the cross-project registry (`registry.js`, `~/.claude/monkey-brain/projects.json`) behind
  `/brain:home` — lazy, so pre-existing brains show up without a re-init.

## Knobs
- `MONKEY_BRAIN_BUDGET` — override the 3000-token cap.
- `MONKEY_BRAIN_TERSE=0` / `.no-terse` (project root) — turn off the terse-mode block.
- `.no-brain` (project root) — permanently silence the no-brain `/brain:init` offer.
- `.qmd` marker or `MONKEY_BRAIN_QMD=1` — switches the injected search line from built-in
  `brain_search`/`brain_brief` to "semantic (qmd) enabled" (`[[recall-and-search]]`).
- `sessions/health.json`, `sessions/gate-blocks.json`, `sessions/loops/` — read-only inputs
  that surface health, stuck plan-gate specs and running loops.
- `sessions/injection-stats.json` — the receipt file this hook writes (not a knob, but the
  audit trail; see Cost below).

## Cost
Every session start costs at most `MONKEY_BRAIN_BUDGET` tokens (default 3000) of injected
`additionalContext` — zero when there is no brain (beyond the optional one-line offer + terse
block). After rendering, the hook appends one entry to `sessions/injection-stats.json`
(`{at, source, budget, tokens, sections_total, sections_kept, sections_dropped}`, rolling last
20) — this write itself costs the session nothing (Roadmap Phase 5 item 5: "budget-receipt
groundwork... zero added tokens"), and is what a future `/brain:doctor` reads to check
injection size against budget (`[[doctor-health-checks]]`).

## Gotchas & history
- Roadmap Phase 2 #1 shipped the budgeted block at v0.3.0 (79/79 selftest); the no-brain
  `/brain:init` offer and `.no-brain` silencer were grown onto the same hook.
- v0.13.0 added terse-mode-by-default, read live from `skills/terse/SKILL.md` so the rules
  text has one source of truth.
- A status hook must never break a session: `main().then(...).catch(() => process.exit(0))`
  (`brain-status.js:264`) — any internal error exits 0 silently rather than blocking startup.
- v0.31.0 (token-diet) trimmed the *always-loaded* manual and skill-description footprint
  (26.5 KB → ~16.5 KB) around this hook, but did not change the 3000-token injection budget
  itself — the two are separate budgets (static instructions vs. dynamic per-session status).
- `brain-health-audit` and `brain-correctness-review` (the 2026-09-15 audit + independent
  review behind v0.30.0) targeted the *resume* and *Stop-nudge* hooks, not `brain-status.js`
  directly, but established the shared primitives this hook also depends on:
  `lib.openP0Lines()` (section-aware P0 detection feeding the health summary) and
  `lib.parseFrontmatter()`'s list-array parsing (used to read spec/project frontmatter here).

## Related
- [[resume-system]] — the second `SessionStart` hook, fired only on `startup|clear`.
- [[stop-nudges]] — the Stop-side counterpart; together they bookend a session.
- [[recall-and-search]] — what the injected search line points to.
- [[bounded-loops]] — running loops surfaced in the priority-1 section.
- [[team-lock]] — the one section that is structurally never dropped alongside identity.
- [[doctor-health-checks]] — reads `sessions/health.json` and the injection-stats receipts.
- [[claude-code]] — the host whose `SessionStart` hook event this is.
