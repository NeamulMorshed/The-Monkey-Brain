---
title: "Claude Code"
type: entity
status: active
tags: [claude-code, host-platform, hooks, skills, subagents, mcp, model-routing]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-readme]]", "[[engine-changelog]]", "[[brain-health-audit]]"]
related: ["[[github-plugin]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[model-routing]]", "[[session-injection]]", "[[resume-system]]", "[[stop-nudges]]", "[[trigger-router]]", "[[recall-and-search]]", "[[plan-and-tdd-gates]]", "[[wiki-self-healing]]", "[[doctor-health-checks]]", "[[develop-lifecycle-stages]]", "[[instincts-and-bans]]"]
aliases: [Claude Code CLI]
---

# Claude Code

Anthropic's agentic coding CLI — the host application the `brain` plugin runs inside. It supplies
the four extension surfaces the whole engine is built on: **hooks** (lifecycle events a plugin can
intercept), **skills** (`/brain:*` slash commands with model-routing frontmatter), **subagents**
(isolated-context workers dispatched via the Agent/Task tool), and **MCP servers** (tool-serving
processes a session can call into). Every mechanism described below — session injection, gates,
routing, recall — is the brain plugin using one of these four surfaces; Claude Code itself holds
no project knowledge.

## How the brain uses it

**Hooks.** `plugin/hooks/hooks.json` registers **10 lifecycle events, 11 Node scripts**
(`brain-health-audit` reconciles README's stale "nine events, eleven scripts" count — see
[[engine-changelog]] P2 #19): `SessionStart` (`brain-status.js` always, `resume.js` on
`startup|clear`) → [[session-injection]], [[resume-system]]; `UserPromptSubmit`
(`trigger-router.js`, `recall.js`) → [[trigger-router]], [[recall-and-search]]; `PreToolUse` on
`Write|Edit|MultiEdit` (`guards.js`) → [[plan-and-tdd-gates]], and on `Agent|Task`
(`agent-track.js`) → [[model-routing]]; `PostToolUse` on `Write|Edit|MultiEdit` (`wiki-check.js`,
`instinct-track.js`) → [[wiki-self-healing]], [[instincts-and-bans]]; `TaskCreated` /
`TaskCompleted` (`resume-log.js`); `Stop` (`wrap.js`) → [[stop-nudges]]; `SubagentStop`
(`agent-track.js`); `PreCompact` (`snapshot.js`); `SessionEnd` (`resume-log.js`, `wrap.js`). Hook
output follows Claude Code's contract: `hookSpecificOutput.additionalContext` to inject text, a
`Stop` hook's `decision: block` to force another turn, `PreToolUse` exit code 2 to block a write;
every script fails safe (bad stdin → `{}` → exit 0) rather than blocking the session.

**Skills.** The plugin exposes 25 `/brain:*` skills as Claude Code skill files; frontmatter fields
`model:`, `effort:` and `context: fork` (see Gotchas) pin how each one runs — e.g.
`plugin/agents/brain-librarian.md` pins `model: sonnet` for batch ingest work. [[model-routing]]
is the one policy table these pins are meant to follow.

**Subagents.** Two Sonnet subagents ship with the plugin — `brain-librarian` (this agent; batch
`/brain:ingest`, tools `Read, Write, Edit, Grep, Glob, WebFetch`) and `brain-researcher`
(read-only research fan-out) — dispatched via Claude Code's Agent/Task tool, each naming a
`model` per the audit's per-dispatch rule ([[model-routing]]).

**MCP servers.** `plugin/.mcp.json` registers the built-in `brain-search` server
(`search-mcp.js`, serving `brain_search` / `brain_brief`) in every brain — see
[[recall-and-search]]. The `github` capability plugin ships its own MCP server needing
`GITHUB_PERSONAL_ACCESS_TOKEN` — see [[github-plugin]].

## Setup & requirements

- Claude Code CLI itself, plus the `brain` plugin installed from the engine's marketplace
  (`/plugin marketplace add NeamulMorshed/The-Monkey-Brain` then `/plugin install
  brain@monkey-brain`).
- Node.js ≥ 18 runs every hook script (stdlib-only, one runtime across Windows/macOS/Linux).
- Git, to version each project's `.brain/` alongside its code.
- Prompt caching is **per model** — see Gotchas; this is why the engine's model-routing table
  says "fork or dispatch, never switch the main thread."

## Gotchas

From the audit's verified read of Claude Code's own docs (skills.md frontmatter table,
sub-agents.md, hooks-guide.md, settings-reference.md) — **"What Claude Code allows"**:

> A skill's `model:` / `effort:` apply **only to the turn that invokes it** — the session model
> resumes on the next prompt, so every pinned skill costs a switch *and* a switch back (measured:
> a 197k-token haiku→opus and a 77k-token sonnet→opus re-write are those returns). With
> **`context: fork`** in the same frontmatter, `model:` instead sets a **forked subagent's**
> model, which runs on a fresh small context with no main-thread switch. Subagent model
> resolution: Agent-tool `model` param > agent `model:` > `CLAUDE_CODE_SUBAGENT_MODEL` > main
> model. No hook can set the model, but **`PreModelSwitch`** can allow/deny/ask a requested
> switch and `PostModelSwitch` can react. `model` and `effortLevel` are valid in project
> `.claude/settings.json`.

Measured cost of getting this wrong: same-model calls wrote ~4.3k cache tokens on average across
15 sessions; the 8 main-thread model switches averaged **162,732** cache tokens each and caused
25% of all main-thread cache writes (1.30M tokens) — one opus→sonnet mid-session switch alone
re-wrote 488,844 tokens ([[brain-health-audit]], [[model-routing]]). [[engine-changelog]]'s
`0.31.0` entry fixed this: a `model:` pin now always comes with `context: fork`, and only
**`build`** does this (Sonnet, `effort: medium` — `plugin/skills/build/SKILL.md`), with the
active instincts injected into the fork via `instincts.js active` since a fork misses the
session-start injection. Every other skill (`research`, `ingest`, `dump`, `learn`, `init`, `ci`,
`terse`, `lock`, `digest`, `usage`, `brief`, `dashboard`, `home` included) lost its pin at the
same release and runs on the session model.

The model-routing dispatch block applies to **every** unpinned heavy dispatch, not just the
first per session (fixed in `0.30.0`, ADR [[model-block-every-dispatch]]): `agent-track.js`
blocks any model-less dispatch of a main-model agent type (`general-purpose`, `claude`, `Plan`,
or no type at all), citing the routing table; forks are exempt, since Claude Code ignores a
model override on a fork; `MONKEY_BRAIN_MODEL_BLOCK=0` opts a dispatch out. Before the fix the
block used a once-per-session temp-dir marker — a live probe found the first model-less
dispatch blocked while its parallel sibling ran unpinned on the main model.

## Related
- [[github-plugin]] · [[frontend-design-plugin]] · [[superpowers-plugin]] ·
  [[security-guidance-plugin]] · [[code-modernization-plugin]] — the five capability plugins that
  run inside Claude Code alongside `brain`.
- [[model-routing]] · [[session-injection]] · [[resume-system]] · [[stop-nudges]] ·
  [[trigger-router]] · [[recall-and-search]] · [[plan-and-tdd-gates]] · [[wiki-self-healing]] ·
  [[doctor-health-checks]] · [[develop-lifecycle-stages]] · [[instincts-and-bans]] — the
  subsystems built on these hook/skill/subagent/MCP surfaces.
