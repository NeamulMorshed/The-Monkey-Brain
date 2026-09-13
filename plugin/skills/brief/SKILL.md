---
description: Pull a compact, cited context pack on a topic from the project's Monkey Brain — the best-matching excerpts from the top pages, capped at ~2k tokens. Use when the user says "brief me on X", "catch me up on X", or before starting work that past decisions, specs, or research may already cover. Requires a .brain/ (offer /brain:init when missing).
argument-hint: "<topic>"
model: sonnet
effort: low
---

# /brain:brief — a context pack from the brain

Built-in recall (v3 P10): full-text search over the compiled layers — `wiki/`, `decisions/`,
`specs/`, `projects/`, `memory/` — read fresh from the files on every call, so it is never stale.

1. Build the pack for the topic in `$ARGUMENTS` (quote it):
   `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/search.js" --brief "<topic>"`
   The `brain_brief` MCP tool returns the same pack inside a session.
2. Present it as returned — it is already ranked and cited. Open with one line on what the
   brain knows about the topic and where the gaps are; keep every `[[slug]]` citation.
3. If nothing matched, say so plainly and suggest a source to ingest or `/brain:research`.
   If the user needs an answer *synthesized* across the pages, hand off to `/brain:query`,
   which files novel answers back.

A brief is a read: it files nothing and needs no log entry.
