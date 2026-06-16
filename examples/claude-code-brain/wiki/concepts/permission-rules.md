---
title: "Permission Rules"
type: concept
status: active
tags: [claude-code, permissions, config]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permission-modes]]", "[[permissions-reference]]"]
related: ["[[permission-modes]]", "[[settings-precedence]]", "[[read-only-commands]]", "[[auto-mode]]", "[[protected-paths]]", "[[hooks]]"]
aliases: ["allow rules", "deny rules", "ask rules", "permission rule syntax"]
---

# Permission Rules

Allow / ask / deny rules layered on top of a [[permission-modes|mode]] to pre-approve or
block specific tools. Enforced by **Claude Code, not the model** — prompt/CLAUDE.md text can't
change them. Manage with `/permissions`.

## Evaluation order: deny → ask → allow
First match wins; **specificity never reorders**. A broad `Bash(aws *)` deny blocks even a
narrower `Bash(aws s3 ls)` allow — deny rules carry **no allowlist exceptions**. A matching
ask prompts even when a more specific allow also matches. Across scopes, **deny at any level
wins** (see [[settings-precedence]]).

- **Bare vs scoped deny:** `Bash` removes the tool from Claude's context entirely; `Bash(rm *)`
  keeps it available and blocks matching calls.
- **Mode interactions:** deny + explicit ask apply in **every** mode, incl. `bypassPermissions`;
  allow has no effect there and never overrides [[protected-paths]]; in `dontAsk` only
  allow-matched + [[read-only-commands]] run; in [[auto-mode]] broad code-exec allows are
  dropped on entry, restored on exit.

## Rule syntax (`Tool` or `Tool(specifier)`)
- **Bash:** `*` wildcards at any position; the **space before `*` matters** — `Bash(ls *)`
  matches `ls -la` not `lsof`; `Bash(ls*)` matches both. `:*` = trailing ` *`. Shell-operator
  aware (each subcommand matches independently); strips wrappers `timeout`/`nice`/`xargs` but
  **not** env runners (`devbox run`, `npx`). See [[read-only-commands]] for the no-prompt set.
- **Read/Edit:** gitignore semantics, four anchors — `//abs`, `~/home`, `/project-root`,
  `cwd`. Bare filename matches at any depth (`Read(.env)` = `Read(**/.env)`). Symlinks: allow
  needs link+target; deny matches either.
- **WebFetch:** `WebFetch(domain:*.example.com)`. **MCP:** `mcp__server__tool`, `mcp__server__*`.
  **[[subagents|Agent]]:** `Agent(Explore)` (deny to disable). **Cd:** governs the you-only `/cd`.
- Deny/ask tool-name globs (`mcp__*`, `*`) supported; unanchored *allow* globs are skipped.

## Enforcement strength
For a guarantee stronger than a prompt instruction, use a deny rule or a [[hooks|PreToolUse
hook]] (which can block before rules even run, but cannot bypass deny/ask) — see
[[claude-md-vs-skills-vs-hooks]]. The same syntax powers a hook's `if` filter — see [[hook-events]].

## Sources
- [[permission-modes]], [[permissions-reference]]
