---
title: "Permission Modes"
type: concept
status: active
tags: [claude-code, permissions, safety]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permission-modes]]"]
related: ["[[auto-mode]]", "[[plan-mode]]", "[[protected-paths]]", "[[permission-rules]]", "[[claude-code]]"]
aliases: ["permission mode", "modes"]
---

# Permission Modes

Control how often Claude Code pauses to ask before edits, shell commands, and network
requests. The mode sets a baseline; [[permission-rules]] layer on top.

## The six modes
| Mode | Runs without asking | Best for |
| --- | --- | --- |
| `default` | Reads only ([[read-only-commands]]) | Getting started, sensitive work |
| `acceptEdits` | Reads, file edits, common FS commands (`mkdir`, `mv`, `cp`…) | Iterating on reviewed code |
| `plan` → [[plan-mode]] | Reads only | Exploring before changing |
| `auto` → [[auto-mode]] | Everything, with classifier safety checks | Long tasks, fewer prompts |
| `dontAsk` | Only pre-approved tools | Locked-down CI/scripts |
| `bypassPermissions` | Everything | Isolated containers/VMs only |

## Switching
`Shift+Tab` cycles `default → acceptEdits → plan`. Optional modes slot in when enabled
(`bypassPermissions` first, `auto` last); `dontAsk` never cycles (flag only). Set at startup
with `--permission-mode <mode>`, or as default via `permissions.defaultMode` in settings.
Cloud/Remote-Control sessions expose a restricted subset.

## Always true
In every mode except `bypassPermissions`, writes to [[protected-paths]] are never
auto-approved. Deny + explicit ask [[permission-rules|rules]] apply in *every* mode, and the
built-in [[read-only-commands]] run without a prompt in *every* mode. Where the same setting
exists at multiple levels, [[settings-precedence]] decides.

## Sources
- [[permission-modes]]
