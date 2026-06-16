---
title: "Source — Choose a Permission Mode"
type: source
status: active
tags: [claude-code, permissions, safety, config]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Choose a permission mode.md"
origin: "https://code.claude.com/docs/en/permission-modes"
related: ["[[permission-modes]]", "[[auto-mode]]", "[[protected-paths]]"]
aliases: ["permission mode docs"]
---

# Choose a Permission Mode

> **Raw source:** [Choose a permission mode.md](../../raw-sources/Choose%20a%20permission%20mode.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
Permission modes control how often Claude Code pauses to ask before edits, commands, and
network requests — trading oversight for fewer interruptions. Six modes, layered with
allow/ask/deny rules, with a set of always-protected paths.

## Key takeaways
- **Six modes** (see [[permission-modes]] for the full table): `default` (reads only),
  `acceptEdits`, `plan`, [[auto-mode|auto]] (classifier-guarded), `dontAsk` (CI lockdown),
  `bypassPermissions` (isolated VMs only).
- **Cycle with `Shift+Tab`**: default → acceptEdits → plan. `auto`/`bypassPermissions` slot
  in when enabled; `dontAsk` never cycles (flag only).
- Modes set a **baseline**; layer [[permission-rules]] (allow/ask/deny) on top. Deny + ask
  rules apply in *every* mode, including bypass.
- **[[protected-paths]]** (`.git`, `.claude`, shell rc files, etc.) are never auto-approved
  except in `bypassPermissions`.
- **[[auto-mode]]** uses a separate classifier model that blocks escalation, external data
  exfil, prod deploys, force-push to main, etc.; respects conversational boundaries; falls
  back to prompting after repeated blocks.
- **[[plan-mode]]** researches and proposes without editing; approving a plan switches modes.

## Concepts this touches
- [[permission-modes]] — the six modes
- [[auto-mode]] — classifier-guarded autonomy
- [[plan-mode]] — research-before-edit
- [[protected-paths]] — never-auto-approved writes
- [[permission-rules]] — allow / ask / deny layering
- [[claude-code]] — parent product

## Contradictions / notes
> None within the corpus. Cross-links to [[context-window]]: conversational boundaries in
> auto mode can be **lost on compaction** — a real interaction worth noting.

## Pages updated on ingest
- [[index]], [[permission-modes]], [[auto-mode]], [[plan-mode]], [[protected-paths]],
  [[permission-rules]], [[claude-code]]
