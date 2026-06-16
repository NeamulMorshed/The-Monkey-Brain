---
title: "Auto Memory"
type: concept
status: active
tags: [claude-code, context, memory]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[context-window]]", "[[extend-claude-code]]"]
related: ["[[claude-md]]", "[[context-window]]", "[[compaction]]"]
aliases: ["memory", "auto memory"]
---

# Auto Memory

Persistent memory that loads into [[context-window|context]] at session start, alongside
[[claude-md|CLAUDE.md]]. Survives [[compaction]] (re-injected from disk). Inspect what loaded
with `/memory`.

Distinct from [[claude-md|CLAUDE.md]] (curated project instructions) — auto memory accrues
across sessions. Both are "always-on" context, contrast with on-demand [[skills]].

## Sources
- [[context-window]], [[extend-claude-code]]
