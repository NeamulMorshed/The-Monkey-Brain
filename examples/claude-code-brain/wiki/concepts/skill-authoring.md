---
title: "Skill Authoring"
type: concept
status: active
tags: [claude-code, skills, authoring, reference, how-to]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[skills-authoring-guide]]"]
related: ["[[skills]]", "[[subagents]]", "[[hooks]]", "[[plugins]]", "[[claude-md]]"]
aliases: ["SKILL.md", "skill frontmatter", "authoring skills", "context fork"]
---

# Skill Authoring

The practical how-to for writing [[skills]]: the `SKILL.md` file, its frontmatter, and the
advanced patterns. (For *what a skill is and when to use it*, see [[skills]].)

## The file
A skill is a **directory** with `SKILL.md` (YAML frontmatter + markdown) as the required
entrypoint, plus optional supporting files (templates, examples, scripts) referenced from the
body so Claude knows when to load them. Keep `SKILL.md` < 500 lines — its body **stays in
context across turns**, so every line is a recurring cost (same conciseness test as
[[claude-md|CLAUDE.md]]).

```
my-skill/
├── SKILL.md            # required
├── reference.md        # loaded only when referenced
└── scripts/helper.py   # executed via ${CLAUDE_SKILL_DIR}, not loaded
```

## Frontmatter (all optional; `description` recommended)
- **Discovery:** `name`, `description`, `when_to_use` (capped 1,536 chars combined), `paths`
  (globs that limit auto-activation), `argument-hint`, `arguments`.
- **Invocation control:** `disable-model-invocation: true` (only you invoke; also blocks
  subagent preload), `user-invocable: false` (only Claude invokes).
- **Tools & model:** `allowed-tools` (pre-approve without restricting), `disallowed-tools`,
  `model`, `effort`.
- **Execution:** `context: fork` + `agent` (run as a [[subagents|subagent]]), `hooks`
  (skill-scoped [[hooks]]), `shell` (`bash`/`powershell`).

## Command name
Comes from the **directory name** for `~/.claude/skills/<name>/` and `.claude/skills/<name>/`;
from the file name for `.claude/commands/`; plugin-namespaced for plugin skills. Only a
plugin-root `SKILL.md` uses the frontmatter `name`.

## String substitutions
`$ARGUMENTS`, `$ARGUMENTS[N]`/`$N`, `$name` (from `arguments`), `${CLAUDE_SESSION_ID}`,
`${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}` (for bundled script paths).

## Dynamic context injection
`` !`<command>` `` runs a shell command **before** Claude sees the skill and inlines its output
(preprocessing). Inline only at line start / after whitespace; multi-line via a ` ```! ` block.
Disable with `disableSkillShellExecution`.

## Running in a subagent (`context: fork`)
The SKILL.md content becomes the subagent's prompt (no conversation history) — only meaningful
for skills with an explicit task. Pick the `agent` type ([[built-in-subagents|Explore/Plan/
general-purpose]]/custom). The inverse pattern is a subagent's `skills:` preload field (full
content injected at startup) — see [[subagents]].

## Visibility & access
`skillOverrides` settings (`on`/`name-only`/`user-invocable-only`/`off`) control listing
without editing the file; permission rules govern the `Skill` tool
(`Skill(commit)`, `Skill(review-pr *)`).

## Sources
- [[skills-authoring-guide]]
