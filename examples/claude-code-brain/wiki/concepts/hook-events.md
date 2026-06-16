---
title: "Hook Events"
type: concept
status: active
tags: [claude-code, hooks, events, reference]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[hooks-reference]]"]
related: ["[[hooks]]", "[[permission-rules]]", "[[compaction]]", "[[subagents]]", "[[mcp]]", "[[auto-mode]]"]
aliases: ["hook event", "lifecycle events", "PreToolUse", "PostToolUse", "SessionStart"]
---

# Hook Events

The lifecycle points where [[hooks]] fire. ~30 events across eight groups. Events marked
**(block)** can stop the action via exit code `2` or a decision field.

## Catalog
| Group | Events |
| --- | --- |
| Session | `SessionStart` (startup/resume/clear/compact), `Setup`, `SessionEnd`, `InstructionsLoaded` |
| Per-turn | `UserPromptSubmit` **(block)**, `UserPromptExpansion` **(block)**, `Stop` **(block)**, `StopFailure` |
| Agentic loop | `PreToolUse` **(block)**, `PermissionRequest` **(block)**, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch` |
| Subagent/team | `SubagentStart`, `SubagentStop` **(block)**, `TeammateIdle`, `TaskCreated`, `TaskCompleted` |
| Environment (async) | `CwdChanged`, `FileChanged`, `ConfigChange`, `WorktreeCreate` **(block)**, `WorktreeRemove` |
| Display | `MessageDisplay`, `Notification` |
| MCP | `Elicitation`, `ElicitationResult` |
| Compaction | `PreCompact` **(block)**, `PostCompact` |

## Where they connect
- **[[compaction]]:** `PreCompact`/`PostCompact` straddle the summarize step.
- **[[subagents]]:** `SubagentStart`/`SubagentStop` bracket isolated workers.
- **[[mcp]]:** `Elicitation`/`ElicitationResult` handle MCP user-input requests.
- **[[auto-mode]]:** `PermissionDenied` fires when the classifier blocks an action.

## Matching
Matchers filter by the event's target — tool name for `Pre/PostToolUse`, session source for
`SessionStart`, trigger for `Pre/PostCompact`, etc. The `if` field narrows further with
[[permission-rules|permission-rule syntax]]. See [[hooks]] for handler types and the
exit-code/decision protocol.

## Sources
- [[hooks-reference]]
