---
title: "ADR — Specs claim the files their gates own via scope: globs"
type: decision
status: accepted
created: 2026-09-15
updated: 2026-09-15
sources: ["[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes]]"]
related: ["[[develop-lifecycle-dogfood]]", "[[develop-lifecycle-fixes]]"]
---

# Specs claim the files their gates own via `scope:` globs

## Context
The plan and TDD gates in `guards.js` consulted every open spec on every source write. With two open specs, an unapproved architecture spec blocked writes that belonged to a different, approved spec ([[develop-lifecycle-dogfood]] finding 7). The gates also fired on writes outside the project root (a scratch-directory write was blocked during this very build). Two ways to fix it were on the table: a `scope:` list of path globs in the spec, or looking up the spec's `projects/` workstream page for its file list.

## Decision
A spec declares the files it owns with an optional `scope:` frontmatter list of project-relative globs (`**` spans directories, a bare path claims itself and everything beneath it). The gates consult only the open specs whose scope claims the written path. A path no open spec claims is still checked against every open spec, so brains without `scope:` fields behave exactly as before. Paths outside the project root are never gated. `/brain:plan` fills `scope:` from the `graph.js radius` file list. The curator chose globs in the spec over workstream matching because the spec is already the record the gates read; adding indirection through `projects/` would give the gates a second file to trust.

## Consequences
Easier: several specs can be open at once without blocking each other, and scratch or sibling-repo writes stop tripping the gates. Harder: a spec whose `scope:` is too narrow silently falls back to the all-specs check for files it forgot to claim, which is the safe direction but can surprise; `/brain:review` should check the scope list against the diff. `lib.parseFrontmatter` now returns `[a, b]` and `- item` lists as arrays for every field, so any future reader of a list field gets an array, not a string. Watch: the fallback rule means adding `scope:` to one spec does not relax the others until they declare scopes too.
