---
description: Answer a question from the project's Monkey Brain — index-first retrieval with citations, filing novel answers back as synthesis pages so explorations compound. Use when the user asks what the brain/wiki knows, wants a comparison or overview drawn from accumulated knowledge, or says "ask the brain" / "search the brain".
argument-hint: "<question>"
effort: high
---

# /brain:query — deploy knowledge from the wiki

The deploy step of the knowledge SDLC (instance manual §4.2): retrieval is **index-first**,
answers carry **citations**, and anything novel is **filed back** so the next session
starts smarter.

## Steps

1. **Read `.brain/wiki/index.md` first** — it is the map. Locate candidate pages there
   (and via the `related:`/`sources:` frontmatter trails), then drill into only the pages
   the question needs. Never brute-force the whole vault.
2. **Synthesize the answer with citations.** Cite wiki pages as `[[slugs]]` — and through
   their `raw:`/`sources:` frontmatter, the raw sources. If the wiki cannot answer, say so
   plainly and suggest what source to ingest; don't pad with general knowledge unlabeled.
3. **Fit the output to the question:** prose for explanations, a comparison table for
   trade-offs, Mermaid for structure/flows, a Marp deck when the user wants slides.
4. **File good answers back.** If the answer is a *novel* synthesis — a comparison,
   analysis, or connection no single page held — write it to
   `.brain/wiki/syntheses/<descriptive-slug>.md` (template `templates/synthesis.md`,
   frontmatter with `sources:` provenance), link it from the index (and any related hub
   page — no orphans), then append to `wiki/log.md`:
   `## [YYYY-MM-DD] query | <question> (+ filed <slug>)` and offer a commit
   `query: <question> (+ filed <slug>)`.
   A **plain lookup** already answered by one page needs no file-back, no log entry.

**Done when:** the answer is cited, and — if novel — the synthesis page exists, is linked,
indexed, logged, and a commit was offered.
