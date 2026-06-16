---
title: "Source — Hooks Reference"
type: source
status: active
tags: [claude-code, hooks, reference, automation, config]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Hooks reference.md"
origin: "https://code.claude.com/docs/en/hooks"
related: ["[[hooks]]", "[[hook-events]]", "[[permission-rules]]"]
aliases: ["hooks reference"]
---

# Hooks Reference

> **Raw source:** [Hooks reference.md](../../raw-sources/Hooks%20reference.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The complete reference behind the [[hooks]] concept: every lifecycle [[hook-events|event]],
the five handler types, the input/output JSON schema, exit-code semantics, matchers, and how a
hook **blocks or modifies** a tool call.

## Key takeaways
- **~30 [[hook-events|events]]** across session, per-turn, agentic-loop, subagent/team,
  environment, display, MCP, and compaction groups. Several (`PreToolUse`, `UserPromptSubmit`,
  `Stop`, `PreCompact`…) can **block**.
- **Five handler types:** `command` (stdin JSON → exit codes/stdout), `http`, `mcp_tool`,
  `prompt` (model yes/no), `agent` (subagent verification, experimental).
- **Exit codes are the core protocol:** `0` = success (parse stdout JSON), `2` = **blocking
  error** (effect depends on event), other = non-blocking. This is how a hook **enforces**
  guardrails — concretizing the "[[hooks|put guardrails in hooks]]" rule from [[extend-claude-code]].
- **Decision control** beyond block: `PreToolUse` can `allow|deny|ask|defer` and **rewrite**
  tool input (`updatedInput`); `PostToolUse` can rewrite output; `SessionStart` can inject
  context/env; `Stop` can inject context and force more work.
- **Matchers + `if`**: matcher filters by tool name / trigger (regex supported); `if` uses
  [[permission-rules|permission-rule syntax]] (`Bash(rm *)`), with Bash sub-command and `$()`
  inspection.
- **Config** lives under `"hooks"` in settings, layered across user/project/local/managed/
  plugin/component scopes; `/hooks` inspects them; `disableAllHooks` is the kill-switch.

## Concepts this touches
- [[hooks]] — the concept page (substantially expanded by this source)
- [[hook-events]] — new page: the full event catalog
- [[permission-rules]] — the `if` filter syntax
- [[mcp]] — `mcp_tool` handler & `Elicitation` events
- [[subagents]] — `agent` handler & `Subagent*` events
- [[compaction]] — `PreCompact`/`PostCompact` events
- [[auto-mode]] — `PermissionDenied` fires on classifier denial

## Contradictions / notes
> No contradictions. **Deepens** rather than challenges existing pages: the abstract
> "[[hooks]] are deterministic" claim from [[extend-claude-code]] is now backed by the concrete
> exit-code/decision protocol. The earlier-deleted stray `hook-vs-skill.md` remains an alias on
> [[claude-md-vs-skills-vs-hooks]].

## Pages updated on ingest
- [[index]], [[hooks]], [[hook-events]], [[permission-rules]], [[claude-code]]
