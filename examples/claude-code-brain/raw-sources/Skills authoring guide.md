---
title: "Skills authoring guide"
source: "https://code.claude.com/docs/en/skills"
author:
published:
created: 2026-06-17
description: "Create, manage, and share Claude Code skills: SKILL.md structure, frontmatter reference, invocation control, subagent execution, dynamic context injection."
tags:
  - "clippings"
  - "claude-code"
  - "skills"
---
## Extend Claude with skills

> Captured 2026-06-17 via WebFetch of https://code.claude.com/docs/en/skills for ingestion
> into The Monkey Brain. Faithful condensation; consult the live page for the authoritative
> version and full code examples.

A skill is a `SKILL.md` file (YAML frontmatter + markdown instructions) that Claude adds to
its toolkit. Claude loads it when relevant, or you invoke it with `/skill-name`. Body loads
only when used, so long reference material is nearly free until needed. Follows the
**Agent Skills** open standard (agentskills.io); Claude Code adds invocation control, subagent
execution, and dynamic context injection. **Custom commands merged into skills**:
`.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`; if
both exist, the skill wins.

### Bundled skills
Available every session unless `disableBundledSkills`: `/code-review`, `/batch`, `/debug`,
`/loop`, `/claude-api`, plus `/run`, `/verify`, `/run-skill-generator` (run/verify your app).
Prompt-based: they instruct Claude rather than executing fixed logic.

### Where skills live (precedence)
| Location | Path | Applies to |
| --- | --- | --- |
| Enterprise | managed settings | All org users |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |

Same-name precedence: **enterprise > personal > project**. Plugin skills are namespaced
`plugin-name:skill-name` (no conflicts). A skill beats a same-named command.
- **Live change detection:** edits under watched skills dirs apply within the session; a brand-new
  top-level skills dir needs a restart. Covers `SKILL.md` text only.
- **Discovery:** project skills load from `.claude/skills/` in the start dir and every parent
  up to repo root; nested dirs (`packages/frontend/.claude/skills/`) load on demand (monorepos).
- `--add-dir` / `/add-dir` DO load `.claude/skills/` (the one config exception); the
  `additionalDirectories` setting does not.

### Skill directory layout
```
my-skill/
├── SKILL.md       # required entrypoint
├── reference.md   # loaded when needed
├── examples.md
└── scripts/helper.py   # executed, not loaded
```
Reference supporting files from SKILL.md so Claude knows what they contain. Keep SKILL.md
under 500 lines; body stays in context across turns (recurring token cost — be concise).

### Frontmatter reference (all optional; `description` recommended)
| Field | Description |
| --- | --- |
| `name` | Display name; defaults to dir name. Only sets command name for a plugin-root SKILL.md. |
| `description` | What it does + when to use. Drives auto-invocation. Combined w/ `when_to_use`, capped 1,536 chars. |
| `when_to_use` | Trigger phrases / example requests; appended to description. |
| `argument-hint` | Autocomplete hint, e.g. `[issue-number]`. |
| `arguments` | Named positional args for `$name` substitution. |
| `disable-model-invocation` | `true` = only you invoke; also blocks subagent preload. Default false. |
| `user-invocable` | `false` = hide from `/` menu (Claude-only background knowledge). |
| `allowed-tools` | Tools pre-approved while active (does NOT restrict others). |
| `disallowed-tools` | Tools removed from pool while active; clears next message. |
| `model` | Model override for the turn. |
| `effort` | Effort level (`low`…`max`) while active. |
| `context` | `fork` = run in a forked subagent context. |
| `agent` | Subagent type when `context: fork` (Explore/Plan/general-purpose/custom). |
| `hooks` | Hooks scoped to this skill's lifecycle. |
| `paths` | Globs limiting auto-activation (like path-specific rules). |
| `shell` | `bash` (default) or `powershell` for `!` injection. |

### Command-name source
Skill dir under `~/.claude/skills` or `.claude/skills` → **dir name**. File under
`.claude/commands/` → file name. Plugin `skills/` subdir → dir name, plugin-namespaced.
Plugin-root SKILL.md → frontmatter `name` (only case where `name` sets the command).

### String substitutions
`$ARGUMENTS` (all args; if absent, appended as `ARGUMENTS: <value>`), `$ARGUMENTS[N]` / `$N`
(0-based positional, shell-quoted), `$name` (declared in `arguments`), `${CLAUDE_SESSION_ID}`,
`${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}` (skill's own dir — use for bundled script paths).
Escape literal `\$1`.

### Invocation control
| Frontmatter | You invoke | Claude invokes | Loaded |
| --- | --- | --- | --- |
| (default) | Yes | Yes | Description always in context; body on invoke |
| `disable-model-invocation: true` | Yes | No | Description NOT in context; body on your invoke |
| `user-invocable: false` | No | Yes | Description always in context; body on invoke |

### Content lifecycle
Invoked SKILL.md enters the conversation as one message and stays all session (not re-read).
Auto-compaction re-attaches the most recent invocation of each skill after the summary: first
**5,000 tokens/skill**, combined **25,000-token** budget, newest first (older dropped). If a
skill stops influencing behavior, content is usually still present — strengthen `description`,
use hooks for hard enforcement, or re-invoke after compaction.

### allowed-tools / restrict access
`allowed-tools` pre-approves listed tools while active (project skills need workspace trust).
Control Claude's skill access via permission rules: deny `Skill` (all), `Skill(commit)` exact,
`Skill(review-pr *)` prefix. `disable-model-invocation: true` removes a skill from Claude's
context. `skillOverrides` setting (`on`/`name-only`/`user-invocable-only`/`off`) controls
visibility without editing SKILL.md (the `/skills` menu writes it).

### Dynamic context injection
`` !`<command>` `` runs a shell command **before** Claude sees the skill; output replaces the
placeholder (preprocessing, not something Claude executes). Inline form only at line start or
after whitespace; multi-line via a ` ```! ` fenced block. Runs once; output not re-scanned.
Disable with `disableSkillShellExecution`. `ultrathink` anywhere requests deeper reasoning.

### context: fork
Runs the skill in an isolated subagent; SKILL.md content becomes the prompt (no conversation
history). Only meaningful for skills with explicit task instructions. Two directions:
- **Skill `context: fork`** — system prompt from agent type, task = SKILL.md, loads CLAUDE.md
  (except Explore/Plan).
- **Subagent `skills:` field** — system prompt from subagent body, task = delegation message,
  preloads listed skills + CLAUDE.md.

### Share / visual output / troubleshooting
Share via project `.claude/skills/` (commit), plugins, or managed settings. Skills can bundle
and run scripts (e.g. generate interactive HTML) using `${CLAUDE_SKILL_DIR}`. Troubleshoot
non-triggering by adding natural-language keywords to `description`; over-triggering by making
it specific or adding `disable-model-invocation`. Descriptions are truncated to a budget
(1% of context, `skillListingBudgetFraction`); `/doctor` shows overflow; 1,536-char cap per
entry (`maxSkillDescriptionChars`).
