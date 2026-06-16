---
title: "Rules (.claude/rules/)"
type: concept
status: active
tags: [claude-code, extension, context, config]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]", "[[context-window]]"]
related: ["[[claude-md]]", "[[skills]]", "[[compaction]]", "[[claude-md-vs-skills-vs-hooks]]"]
aliases: ["rules", "path-scoped rules"]
---

# Rules (`.claude/rules/`)

Instruction files that keep [[claude-md|CLAUDE.md]] focused. Load **every session**, or
**only when matching files are opened** if they carry `paths:` frontmatter — saving
[[context-window|context]].

| | [[claude-md|CLAUDE.md]] | Rules | [[skills]] |
| --- | --- | --- | --- |
| Loads | Every session | Every session, or on matching files | On demand |
| Scope | Whole project | Can be path-scoped | Task-specific |
| Best for | Core conventions | Language/dir-specific guidelines | Reference, workflows |

**[[compaction]] caveat:** `paths:`-scoped rules are **lost** after compaction until a
matching file is read again. For must-persist rules, drop `paths:` or move to the project-root
CLAUDE.md.

## Sources
- [[extend-claude-code]], [[context-window]]
