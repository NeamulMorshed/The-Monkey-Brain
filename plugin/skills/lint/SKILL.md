---
description: Health-check the project's Monkey Brain — a mechanical scan (broken wikilinks, orphans, frontmatter gaps, index drift, backlog, strays) followed by reasoning over contradictions and staleness, with fixes applied. Use when the user says "lint the brain/wiki", asks for a brain health check, or after a large ingest batch.
argument-hint: "[scope]"
---

# /brain:lint — test the wiki

The test step of the knowledge SDLC (instance manual §4.3). The mechanical scan below ran
before you read this — its report is already in context (zero model tokens spent scanning):

!`node "${CLAUDE_SKILL_DIR}/scripts/lint.js"`

## Steps

1. **Fix what the scan found** (mechanical layer):
   - *Broken `[[links]]`* — fix the slug if it's a typo; create a stub page if the target
     deserves to exist; leave it only if it's a deliberate TODO marker (say so).
   - *Orphans* — wire each into the graph with a real inbound link (index or a hub page),
     or justify deleting the page.
   - *Frontmatter gaps* — complete `type:` / `updated:` per manual §3.
   - *Index drift* — correct `source_count` / `page_count` / `updated` and any missing
     index entries.
   - *Clippings backlog* — offer `/brain:ingest clippings`.
   - *Stray root files* — 0-byte strays are Obsidian artifacts; delete them.
2. **Reason over what a script can't see** (read the pages the scan flagged, plus any
   scope the user named):
   - **Contradictions** between pages → reconcile or flag inline
     (`> ⚠️ Contradiction: …`) and set `status:` accordingly.
   - **Stale claims** a newer source likely supersedes → update, forward-link, mark
     `stale`/`superseded`.
   - **Missing pages** — concepts referenced often without a page of their own → create
     stubs with provenance.
   - **Missing cross-references** — related pages that don't link → add reciprocal links.
   - **Gaps worth new sources** — suggest questions/sources to the curator (lint is where
     the brain asks to grow).
3. **Log + commit:** append `## [YYYY-MM-DD] lint | <scope> — <n> fixes` to
   `wiki/log.md`, then offer a commit `lint: <scope> — <n> fixes`.

**Done when:** every scan finding is fixed or explicitly justified, reasoning findings are
reconciled or flagged, and the log entry + commit round it off.
