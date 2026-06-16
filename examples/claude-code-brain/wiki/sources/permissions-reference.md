---
title: "Source — Permissions Reference"
type: source
status: active
tags: [claude-code, permissions, reference, config, security]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Permissions reference.md"
origin: "https://code.claude.com/docs/en/permissions"
related: ["[[permission-rules]]", "[[settings-precedence]]", "[[permission-modes]]", "[[read-only-commands]]"]
aliases: ["permissions reference"]
---

# Permissions Reference

> **Raw source:** [Permissions reference.md](../../raw-sources/Permissions%20reference.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The full reference behind [[permission-rules]]: allow/ask/deny syntax, per-tool patterns
(Bash, Read/Edit, WebFetch, MCP, Agent, Cd), the deny→ask→allow evaluation order, the
five-level [[settings-precedence|settings precedence]], managed policy, and the built-in
[[read-only-commands]].

## Key takeaways
- **Evaluation order is deny → ask → allow**, first match wins; **specificity never reorders**.
  A broad deny beats a narrow allow — no allowlist exceptions. (Sharpens the [[permission-rules]] page.)
- **Bare vs scoped deny:** `Bash` removes the tool from context entirely; `Bash(rm *)` keeps it
  and blocks matching calls.
- **Per-tool syntax:** Bash wildcards (the **space before `*`** matters), shell-operator
  awareness (each subcommand matches independently), process-wrapper stripping; Read/Edit use
  **gitignore semantics** with four path anchors (`//abs`, `~/`, `/root`, `cwd`); WebFetch uses
  `domain:`; `Agent(Name)` governs [[subagents]]; `Cd` governs the you-only `/cd`.
- **New: [[read-only-commands]]** — a built-in set (`ls cat grep find` + read-only `git`…) runs
  with no prompt in **every** mode, even `dontAsk`. This is what [[permission-modes]] meant by
  "reads only."
- **New: [[settings-precedence]]** — managed > CLI > local-project > project > user; **deny at
  any level wins**. Enforced by Claude Code, not the model.
- **Hooks extend, don't bypass:** a PreToolUse [[hooks|hook]] exiting code 2 blocks before rules
  run, but deny/ask rules still apply over a hook's `allow`.
- **Sandboxing** is the complementary OS-level layer; Read/Edit/WebFetch rules merge into its boundary.

## Concepts this touches
- [[permission-rules]] — substantially expanded (per-tool syntax, evaluation order)
- [[settings-precedence]] — new page (the 5-level hierarchy)
- [[read-only-commands]] — new page (the no-prompt built-in set)
- [[permission-modes]] / [[protected-paths]] / [[auto-mode]] — the mode interactions
- [[subagents]] — `Agent()` rules; [[hooks]] — PreToolUse permission extension

## Contradictions / notes
> No contradictions. **Sources** several claims previously asserted from other docs: the
> "reads only" of [[permission-modes]] (now traced to [[read-only-commands]]), the managed
> `disableAutoMode`/`disableBypassPermissionsMode` from [[auto-mode]]/[[protected-paths]], and
> the hook-vs-rule precedence from [[hooks]].

## Pages updated on ingest
- [[index]], [[permission-rules]], [[settings-precedence]], [[read-only-commands]],
  [[permission-modes]], [[subagents]], [[hooks]], [[claude-code]]
