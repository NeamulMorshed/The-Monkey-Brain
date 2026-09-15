---
description: Pull a cited context pack (at most ~2k tokens) on a topic from the project's Monkey Brain. Use when the user says "brief me on X" or "catch me up on X", or before work that past decisions, specs or research may already cover.
argument-hint: "<topic>"
model: haiku
context: fork
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

## Meeting prep — "prep for <meeting> with <people>"

1. Brief on the meeting's topic as above.
2. For each attendee or organization, read their `wiki/entities/` page and the log entries that
   mention them (`brain_search <name>`): role, last interaction, what they care about.
3. Pull the open threads they're part of: workstreams' `## Next` and `## Blockers`, specs in
   review, anything in `sessions/review-required.md`.
4. Draft a short agenda (decisions needed first) and file it to
   `sessions/meeting-<date>-<slug>.md`. After the meeting, `/brain:dump` the outcomes.
