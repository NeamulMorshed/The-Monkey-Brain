---
title: "Hooks reference"
source: "https://code.claude.com/docs/en/hooks"
author:
published:
created: 2026-06-17
description: "Complete reference for Claude Code hooks: events, configuration, input/output schema, exit codes, matchers, and decision control."
tags:
  - "clippings"
  - "claude-code"
  - "hooks"
---
## Claude Code Hooks Reference

> Captured 2026-06-17 via WebFetch of https://code.claude.com/docs/en/hooks for ingestion
> into The Monkey Brain. Faithful summary of the reference; consult the live page for the
> authoritative, current version.

## Hook events

**Session-level:** `SessionStart` (startup/resume/clear/compact), `Setup`, `SessionEnd`,
`InstructionsLoaded` (CLAUDE.md / .claude/rules/*.md load).

**Per-turn:** `UserPromptSubmit` (before processing, can block), `UserPromptExpansion`
(slash-command expansion, can block), `Stop` (Claude finished), `StopFailure` (turn ended on
API error).

**Agentic loop (per tool call):** `PreToolUse` (before exec, can block), `PermissionRequest`
(dialog appears), `PermissionDenied` (auto-mode classifier denied), `PostToolUse` (succeeds),
`PostToolUseFailure` (fails), `PostToolBatch` (after parallel batch).

**Subagent & team:** `SubagentStart`, `SubagentStop`, `TeammateIdle`, `TaskCreated`,
`TaskCompleted`.

**Environment (async):** `CwdChanged`, `FileChanged`, `ConfigChange`, `WorktreeCreate`,
`WorktreeRemove`.

**Display:** `MessageDisplay`, `Notification`.

**MCP:** `Elicitation`, `ElicitationResult`.

**Compaction:** `PreCompact`, `PostCompact`.

## Configuration

Three nesting levels under `"hooks"`: event → matcher group → hook handlers.

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [
          { "type": "command", "if": "Bash(rm *)", "command": "/path/to/hook.sh", "args": [] }
        ] }
    ]
  }
}
```

**Locations (scope / shareable):** `~/.claude/settings.json` (all projects, not shared);
`.claude/settings.json` (one project, commit to share); `.claude/settings.local.json`
(gitignored); managed policy settings (org-wide); plugin `hooks/hooks.json`; skill/agent
frontmatter (while component active).

## Matchers

| Value | Evaluated as |
| --- | --- |
| `"*"`, `""`, or omitted | Match all |
| Letters/digits/`_`/`\|` | Exact string or list (`Bash`, `Edit\|Write`) |
| Other chars | JavaScript regex (`^Notebook`, `mcp__memory__.*`) |

Matcher targets vary by event: tool name (Pre/PostToolUse, Permission*), session source
(SessionStart), exit reason (SessionEnd), notification type (Notification), agent type
(Subagent*), trigger (Pre/PostCompact), etc. Some events (UserPromptSubmit, PostToolBatch,
Stop, CwdChanged…) always fire. MCP tools match as `mcp__<server>__<tool>`.

## Handler types

1. **command** — shell command; JSON on stdin, decisions via exit codes + stdout. Fields:
   `command` (required), `args` (exec form if present), `async`, `asyncRewake`, `shell`,
   `timeout`, `if`, `statusMessage`. Exec form (with `args`) = no shell, literal args; shell
   form (no `args`) = tokenized/expanded.
2. **http** — POST JSON to a URL. Fields: `url`, `headers`, `allowedEnvVars`, `timeout`.
   Non-2xx = non-blocking error; return 2xx + `decision:"block"` to block.
3. **mcp_tool** — call a tool on a connected MCP server (`server`, `tool`, `input` with
   `${tool_input.…}` interpolation). Output treated like command stdout.
4. **prompt** — ask a Claude model a yes/no (`prompt`, optional `model`, `timeout` 30s).
5. **agent** — spawn a subagent to verify before deciding (experimental; `prompt`, `timeout` 60s).

Common fields: `type` (required), `if` (permission-rule syntax, tool events only), `timeout`,
`statusMessage`, `once` (skill frontmatter only).

## Input / output

**Common input (all events):** `session_id`, `transcript_path`, `cwd`, `permission_mode`,
`hook_event_name`, `effort`. Plus `agent_id`/`agent_type` in subagents.

**Exit codes:** `0` = success (parse JSON from stdout for decisions); `2` = blocking error
(stderr shown to Claude, action blocked); other = non-blocking error (first stderr line in
transcript).

**Exit code 2 effects:** PreToolUse blocks the tool; PermissionRequest denies; UserPromptSubmit
blocks+erases the prompt; UserPromptExpansion blocks; Stop/SubagentStop prevent stopping;
PreCompact blocks compaction; WorktreeCreate fails creation; other events ignore it.

**Universal JSON output:** `continue` (false = stop entirely), `stopReason`, `suppressOutput`,
`systemMessage`, `terminalSequence` (OSC/BEL allowlist only), and
`hookSpecificOutput.additionalContext`.

**Event-specific decision control:**
- `PreToolUse` → `hookSpecificOutput.permissionDecision` (`deny|allow|ask|defer`),
  `permissionDecisionReason`, `updatedInput` (modify tool args), `additionalContext`.
- `PostToolUse` → top-level `decision:"block"` + `reason`; `hookSpecificOutput.updatedToolOutput`.
- `SessionStart` → `additionalContext`, `sessionTitle`, `initialUserMessage`, `watchPaths`,
  `reloadSkills`; can append env via `CLAUDE_ENV_FILE`.
- `PermissionRequest` → `decision.behavior` (`allow|deny`), `updatedInput`.
- `Stop` → inject `additionalContext` (optionally `decision:"block"` to continue work).
- `MessageDisplay` → `displayContent` (changes screen only, not transcript/Claude view).
- `WorktreeCreate` → `worktreePath`.
- `Elicitation` → `action` (`accept|decline|cancel`), `content`.

The `if` field uses permission-rule syntax; for Bash, leading assignments are stripped, each
`&&` subcommand is checked, and commands inside `$()` are checked.

## Tooling notes

`/hooks` opens a read-only browser of all configured hooks (event, matcher, type, source,
command/URL/prompt). `terminalSequence` emits allowlisted OSC (0/1/2/9/99/777) or BEL
notifications. `{"disableAllHooks": true}` disables all (managed settings can't be overridden).
