---
title: "Hooks"
type: concept
status: active
tags: [claude-code, extension, hooks, automation]
created: 2026-06-17
updated: 2026-07-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[hooks-reference]]", "[[mewvault-readme]]"]
related: ["[[skills]]", "[[mcp]]", "[[permission-rules]]", "[[hook-events]]", "[[claude-md-vs-skills-vs-hooks]]", "[[mewvault]]"]
aliases: ["hook"]
---

# Hooks

A script, HTTP request, LLM prompt, or subagent triggered by **lifecycle [[hook-events|events]]**
(`PostToolUse`, `SessionStart`, `PreToolUse`, permission requests, compaction…). The
**deterministic** extension: it *always* fires on its event.

- **Context cost: zero**, unless the hook returns output (which then lands in context as text
  Claude reads — e.g. a linter's results).
- **Guardrails belong in hooks.** "Never edit `.env`" in [[claude-md|CLAUDE.md]] or a
  [[skills|skill]] is a request; a `PreToolUse` hook is **enforcement**. If a rule must hold
  every time, make it a hook (or a deny [[permission-rules|rule]]).
- **Layering:** hooks **merge** — all registered hooks fire for matching events regardless of source.
- Survives [[compaction]] trivially (runs as code, not context).

Use a **hook** when the action must happen the same way every time and needs no reasoning;
use a **[[skills|skill]]** when Claude should decide how to apply steps. See
[[claude-md-vs-skills-vs-hooks]] and [[hook-vs-skill]].

## Enforcement at scale (seen in the wild)

[[mewvault]] runs an entire managed workspace on this principle — **seven** lifecycle hooks
(session-start injection + trigger routing, session-end auto-wrap, `PreToolUse` gates, agent
tracking, post-tool-use correction signals, pre-[[compaction|compact]] snapshots) with
OS-level gates for plan-approval, TDD, secrets, and immutability
([[mewvault-readme|source]]). Its motto is this page's rule operationalized: **enforcement
over advice**.

## How a hook actually works (from the [[hooks-reference|reference]])

**Five handler types:**
1. `command` — shell command; receives JSON on stdin, returns decisions via **exit codes +
   stdout JSON**.
2. `http` — POST JSON to a URL; return `2xx` + `decision:"block"` to block.
3. `mcp_tool` — call a tool on a connected [[mcp|MCP]] server.
4. `prompt` — ask a (fast) model a yes/no.
5. `agent` — spawn a [[subagents|subagent]] to verify before deciding (experimental).

**The exit-code protocol (command hooks):**
| Exit | Meaning |
| --- | --- |
| `0` | Success — parse stdout JSON for decisions |
| `2` | **Blocking error** — stderr shown to Claude; effect depends on [[hook-events|event]] (PreToolUse blocks the tool, UserPromptSubmit erases the prompt, PreCompact blocks compaction, Stop forces more work…) |
| other | Non-blocking error (stderr line logged) |

**Decision control is richer than block/allow.** `PreToolUse` can return
`permissionDecision: allow|deny|ask|defer` **and rewrite the tool input** (`updatedInput`);
`PostToolUse` can rewrite output; `SessionStart` can inject context and env (`CLAUDE_ENV_FILE`);
`Stop` can inject `additionalContext`. Filtering: a **matcher** picks the
[[hook-events|event target]] (regex ok) and an `if` field narrows with
[[permission-rules|permission-rule syntax]] (`Bash(rm *)`).

**Config & control:** defined under `"hooks"` in settings across user/project/local/managed/
plugin/component scopes; inspect with `/hooks`; kill all with `{"disableAllHooks": true}`
(managed hooks can't be overridden).

## Sources
- [[extend-claude-code]], [[context-window]], [[hooks-reference]], [[mewvault-readme]]
