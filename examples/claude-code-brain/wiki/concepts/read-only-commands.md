---
title: "Read-Only Commands"
type: concept
status: active
tags: [claude-code, permissions, bash, safety]
created: 2026-06-17
updated: 2026-06-17
sources: ["[[permissions-reference]]"]
related: ["[[permission-rules]]", "[[permission-modes]]", "[[auto-mode]]"]
aliases: ["read-only bash", "read only commands"]
---

# Read-Only Commands

A built-in set of Bash commands Claude Code treats as **read-only** and runs **without a
permission prompt in every [[permission-modes|mode]]** — including `default` and `dontAsk`.
This is precisely what "reads only" means in the [[permission-modes|modes table]].

## The set
`ls cat echo pwd head tail grep find wc which diff stat du cd` plus the **read-only forms of
`git`**. Not configurable — to require a prompt for one, add an `ask` or `deny`
[[permission-rules|rule]].

## Edge rules
- **Unquoted globs** are allowed when *every* flag is read-only (`ls *.ts`, `wc -l src/*.py`).
  Commands with write/exec-capable flags (`find`, `sort`, `sed`, `git`) still prompt with an
  unquoted glob, because it could expand to e.g. `-delete`.
- **`cd`** into the working dir or an additional directory is read-only; `cd … && ls` runs
  without a prompt when each part qualifies, but **`cd` combined with `git`** always prompts.

## Why it matters here
Under [[auto-mode]], these skip the classifier (like working-dir reads). They're the floor of
what Claude can always do — the rest is governed by [[permission-rules]] and
[[settings-precedence]].

## Sources
- [[permissions-reference]]
