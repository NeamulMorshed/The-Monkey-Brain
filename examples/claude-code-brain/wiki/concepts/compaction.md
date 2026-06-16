---
title: "Compaction"
type: concept
status: active
tags: [claude-code, context, compaction]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[context-window]]"]
related: ["[[context-window]]", "[[claude-md]]", "[[skills]]", "[[rules]]", "[[memory]]", "[[auto-mode]]"]
aliases: ["compact", "/compact"]
---

# Compaction

When a session nears the [[context-window]] limit, Claude Code **summarizes the conversation
history** into a structured summary so the session continues. Runs automatically, or on
demand via `/compact [focus]`.

## What survives
| Mechanism | After compaction |
| --- | --- |
| System prompt & output style | Unchanged (not in message history) |
| Project-root [[claude-md|CLAUDE.md]] & unscoped [[rules]] | Re-injected from disk |
| Auto [[memory]] | Re-injected from disk |
| Rules with `paths:` frontmatter | **Lost** until a matching file is read again |
| Nested CLAUDE.md in subdirs | **Lost** until a file there is read again |
| Invoked [[skills]] bodies | Re-injected, capped 5k/skill & 25k total, oldest dropped |
| [[hooks]] | N/A — run as code, not context (the `PreCompact`/`PostCompact` [[hook-events|events]] bracket this step) |

## Practical consequences
- Put must-persist rules in the **project-root CLAUDE.md**, not `paths:`-scoped files.
- Put the most important [[skills|skill]] instructions **near the top** (truncation keeps the start).
- **[[auto-mode]] conversational boundaries can be lost** when compaction drops the message
  that stated them — use a deny [[permission-rules|rule]] for a hard guarantee.

## Sources
- [[context-window]]
