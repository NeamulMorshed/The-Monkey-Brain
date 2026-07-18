---
title: "Skills"
type: concept
status: active
tags: [claude-code, extension, skills, workflow]
created: 2026-06-17
updated: 2026-07-17
sources: ["[[extend-claude-code]]", "[[context-window]]", "[[skills-authoring-guide]]", "[[caveman-readme]]", "[[ui-ux-pro-max-readme]]"]
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
- **Cost caveat:** an always-on skill body isn't free — [[caveman]] measures its own at
  ~1–1.5k input tokens per turn ([[caveman-readme|source]]). Weigh body size against use rate.
- **Skills can carry data + scripts:** [[ui-ux-pro-max]] bundles CSV knowledge bases and an
  offline BM25 search script inside one skill — a whole
  [[domain-expertise-packs|domain expertise pack]] behind a single auto-activating
  description ([[ui-ux-pro-max-readme|source]]).
- Claude Code ships bundled skills (`/code-review`, `/batch`, `/debug`).

Compare: [[skill-vs-subagent|Skill vs Subagent]], [[claude-md-vs-skills-vs-hooks]].
Bundled into [[plugins]] for distribution (e.g. [[frontend-design]], [[superpowers]],
[[caveman]] — the latter ships the *same* skill to 30+ different agents, showing skills as a
cross-agent portability format).

## Sources
- [[extend-claude-code]], [[context-window]], [[skills-authoring-guide]], [[caveman-readme]], [[ui-ux-pro-max-readme]]
