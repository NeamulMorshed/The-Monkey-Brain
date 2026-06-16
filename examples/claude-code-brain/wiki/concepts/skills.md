---
title: "Skills"
type: concept
status: active
tags: [claude-code, extension, skills, workflow]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[skills-authoring-guide]]"]
related: ["[[skill-authoring]]", "[[claude-md]]", "[[subagents]]", "[[hooks]]", "[[mcp]]", "[[plugins]]", "[[claude-md-vs-skills-vs-hooks]]"]
aliases: ["skill"]
---

# Skills

A markdown file containing knowledge, workflows, or instructions — **the most flexible
extension**. Invoke with `/<name>`, or Claude loads one automatically when its description
matches your task. For the practical SKILL.md/frontmatter how-to, see **[[skill-authoring]]**.

- **Reference vs action.** Reference skills provide knowledge used throughout a session (API
  style guide); action skills *do* something (`/deploy`).
- **Loading:** descriptions load at session start (cheap); full body loads when used. Set
  `disable-model-invocation: true` for zero cost until *you* invoke it (good for skills with
  side effects). Override visibility without editing via `skillOverrides` in settings.
- **[[compaction]]:** invoked bodies re-injected, capped 5k/skill & 25k total (newest first) —
  put key instructions near the top. The body **stays in context across turns** and isn't
  re-read, so write standing instructions, not one-time steps ([[skills-authoring-guide|source]]).
- **With [[subagents]]:** a subagent's `skills:` field **preloads** listed skills fully at launch.
  A skill can run in isolated context with `context: fork`.
- Claude Code ships bundled skills (`/code-review`, `/batch`, `/debug`).

Compare: [[skill-vs-subagent|Skill vs Subagent]], [[claude-md-vs-skills-vs-hooks]].
Bundled into [[plugins]] for distribution (e.g. [[frontend-design]], [[superpowers]]).

## Sources
- [[extend-claude-code]], [[context-window]], [[skills-authoring-guide]]
