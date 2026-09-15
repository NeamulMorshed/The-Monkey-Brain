---
description: Permanently rewrite an instruction or memory file (CLAUDE.md, memory notes, rules pages) into a terser form with identical meaning, cutting its per-session token cost. Use for "compress <file>" or a bloated CLAUDE.md. Not for wiki pages whose wording is evidence.
argument-hint: "<file-path>"
effort: high
---

# /brain:compress — permanent input-token savings

Terse output saves once; compressing a file that loads every session saves forever.

## Scope — instruction files only
CLAUDE.md files, `memory/` notes, rules files, resume narratives, README instructions.
**Not** wiki knowledge pages (`sources/ concepts/ entities/ syntheses/` — their wording
carries provenance), and never `raw-sources/` (immutable; the guard blocks it anyway).

## Steps

1. **Measure before:** file size in bytes; tokens ≈ bytes ÷ 4.
2. **Rewrite in place, preserving every load-bearing element:**
   - keep ALL rules, constraints, paths, commands, names, numbers, conventions, and the
     frontmatter (bump `updated:`); keep section anchors other files cite (e.g. "§5");
   - **byte-for-byte:** code blocks, commands, error strings, numbered criteria;
   - cut filler, restatements, marketing tone, redundant examples, throat-clearing;
   - compress prose into imperative bullets; merge overlapping sections.
3. **Verify against loss:** re-read the result against the original — would a fresh
   session act identically on both? If any rule became ambiguous, restore it. When the
   curator is present, show the diff before finalizing.
4. **Report receipts:** `before → after bytes (−NN%, ≈ N,NNN tokens saved per session
   the file loads)`.
5. **Bookkeeping:** inside a brain, append `wiki/log.md`
   `## [YYYY-MM-DD] schema | compress <file> (−NN%)` and offer commit
   `schema: compress <file> (−NN%)`.

**Done when:** the file reads leaner, nothing normative was lost, and the before/after
receipt is reported.
