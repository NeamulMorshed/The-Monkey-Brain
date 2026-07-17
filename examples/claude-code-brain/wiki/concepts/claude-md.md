---
title: "CLAUDE.md"
type: concept
status: active
tags: [claude-code, extension, context, memory]
created: 2026-06-17
updated: 2026-07-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[caveman-readme]]"]
related: ["[[skills]]", "[[rules]]", "[[memory]]", "[[schema-layer]]", "[[claude-md-vs-skills-vs-hooks]]"]
aliases: ["claude.md", "memory file"]
---

# CLAUDE.md

Persistent context loaded **every session, automatically**. The place for "always do X"
rules: coding conventions, build/test commands, project structure, "never do X" rules.

- **Loads:** full content at session start, every request. Re-injected after [[compaction]].
- **Can import** files with `@path`. **Cannot** trigger workflows (that's [[skills]]).
- **Layering:** additive across managed/user/project levels; nested CLAUDE.md in subdirs load
  as Claude works there; conflicts reconciled by judgment (more specific wins).
- **Rule of thumb:** keep it **under ~200 lines**. Overflow → move reference content to
  [[skills]] or split into [[rules|`.claude/rules/`]].
- **Compressible:** because it loads every session, terseness here pays compound interest —
  [[caveman]]'s `/caveman-compress` rewrites CLAUDE.md-style memory files tersely for **~46%
  fewer input tokens every later session**, code/paths byte-preserved
  ([[caveman-readme|source]]).
- **Guardrails caveat:** "never edit .env" here is a *request*, not enforcement — use a
  [[hooks|hook]]. See [[claude-md-vs-skills-vs-hooks]].

In The Monkey Brain, the [[schema-layer|schema]] (`schema/CLAUDE.md`) plays this role for the
wiki itself.

## Sources
- [[extend-claude-code]], [[context-window]], [[caveman-readme]]
