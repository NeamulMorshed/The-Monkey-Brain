---
title: "Source — Skills Authoring Guide"
type: source
status: active
tags: [claude-code, skills, authoring, reference]
created: 2026-06-17
updated: 2026-06-17
raw: "../../raw-sources/Skills authoring guide.md"
origin: "https://code.claude.com/docs/en/skills"
related: ["[[skills]]", "[[skill-authoring]]", "[[subagents]]", "[[hooks]]"]
aliases: ["skills guide", "skills authoring"]
---

# Skills Authoring Guide

> **Raw source:** [Skills authoring guide.md](../../raw-sources/Skills%20authoring%20guide.md) · **Origin:** code.claude.com · **Ingested:** 2026-06-17

## TL;DR
The how-to behind the [[skills]] concept: the `SKILL.md` file format, the full frontmatter
reference, where skills live and their precedence, invocation control, dynamic context
injection, and running a skill in a forked [[subagents|subagent]].

## Key takeaways
- **A skill = a `SKILL.md` directory** (frontmatter + markdown). Follows the **Agent Skills**
  open standard. **Custom commands merged into skills** — `.claude/commands/x.md` and
  `.claude/skills/x/SKILL.md` both make `/x`; the skill wins on conflict.
- **Location → precedence:** enterprise > personal (`~/.claude/skills`) > project
  (`.claude/skills`); plugin skills are namespaced. The command name comes from the
  **directory name** (except a plugin-root SKILL.md, where `name` sets it).
- **Frontmatter** (all optional, `description` recommended): `description`/`when_to_use` drive
  auto-invocation (1,536-char cap); `disable-model-invocation` and `user-invocable` are the two
  **invocation-control** knobs; `allowed-tools`/`disallowed-tools`, `model`, `effort`,
  `context: fork` + `agent`, `paths`, `hooks`, `arguments`, `shell`.
- **Dynamic context injection:** `` !`cmd` `` runs a shell command **before** Claude sees the
  skill and inlines the output — preprocessing, not execution. Concrete cousin of a
  [[hooks|SessionStart hook]] injecting context.
- **Lifecycle:** an invoked body stays in context all session (not re-read); after
  [[compaction]] the newest invocation of each skill is re-attached (5k/skill, 25k total) —
  this is the source behind the cap noted on [[skills]] and [[compaction]].
- **`context: fork`** turns a skill into a [[subagents|subagent]] task (SKILL.md becomes the
  prompt); the inverse is a subagent's `skills:` preload field.

## Concepts this touches
- [[skills]] — the concept page (expanded)
- [[skill-authoring]] — new page: the practical SKILL.md/frontmatter how-to
- [[subagents]] — `context: fork` and the `skills:` field
- [[hooks]] — `hooks:` frontmatter scoping + `!` injection vs SessionStart
- [[compaction]] — the 5k/25k skill re-attachment budget
- [[plugins]] — skills as the primary thing plugins bundle

## Contradictions / notes
> No contradictions. **Confirms and sources** the previously-asserted skill compaction caps
> (5k/skill, 25k total) which had come from [[context-window]] — now traced to their primary doc.

## Pages updated on ingest
- [[index]], [[skills]], [[skill-authoring]], [[subagents]], [[hooks]], [[compaction]], [[plugins]]
