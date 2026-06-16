---
title: "Auto Mode"
type: concept
status: active
tags: [claude-code, permissions, autonomy, classifier]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permission-modes]]"]
related: ["[[permission-modes]]", "[[protected-paths]]", "[[permission-rules]]", "[[subagents]]", "[[context-window]]"]
aliases: ["auto"]
---

# Auto Mode

Lets Claude Code execute without routine permission prompts, with a **separate classifier
model** reviewing each action before it runs. A research preview (requires v2.1.83+; model,
plan, and provider requirements apply).

## What the classifier does
Blocks actions that escalate beyond your request, target unrecognized infrastructure, or
look driven by hostile content. **Blocked by default:** `curl | bash`, data exfil to
external endpoints, prod deploys/migrations, mass cloud deletion, IAM grants, force-push or
push to `main`, irreversibly destroying pre-session files. **Allowed by default:** local
working-dir ops, installing declared deps, reading `.env` and sending creds to the matching
API, read-only HTTP, pushing to the branch you started on.

## Boundaries you state in chat
Saying "don't push" makes the classifier block matching actions even when defaults allow
them. **Caveat:** boundaries are re-read from the transcript each check, so they can be
**lost on [[compaction]]** — for a hard guarantee use a deny [[permission-rules|rule]].
(Cross-link noted from [[context-window]].)

## Fallbacks & decision order
On entering auto mode, broad code-execution allow rules (`Bash(*)`, interpreters, `Agent`)
are dropped; narrow rules carry over. After 3 consecutive or 20 total blocks, auto mode
pauses and resumes prompting. The classifier also checks [[subagents]] at spawn, during
run, and on return. Writes to [[protected-paths]] route to the classifier.

> Design motif: the "fall back after 3 failures" circuit breaker also appears in the
> [[superpowers]] plugin's debugging methodology.

## Sources
- [[permission-modes]]
