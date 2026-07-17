---
description: Compile a source into the project's Monkey Brain wiki — the 8-step ingest of the knowledge SDLC. Use when the user says "ingest this", shares an article / doc / URL / paste to add to the brain, or asks to process Clippings. Requires a .brain/ instance (offer /brain:init when missing).
argument-hint: "[path | url | clippings]"
model: sonnet
effort: medium
---

# /brain:ingest — compile a source into the wiki

The compile step of the knowledge SDLC (instance manual §4): one raw source in, a
source-summary page plus 5–10+ cross-linked wiki pages out. Hooks enforce the
invariants — `raw-sources/` is add-only, `wiki/log.md` is append-only, and every wiki
write is link/orphan-checked (fix flagged issues in the same turn).

## The 8 steps (per source)

1. **Read the source in full.** A file → Read it; a URL → fetch it and save the content
   as markdown; pasted text → treat the paste as the source. If it references local
   images, read the text first, then view images separately.
2. **Canonicalize.** Ensure the source exists as a **new** file in
   `.brain/raw-sources/<kebab-slug>.md`. Clippings get **copied** in (then delete the
   staging copy — `Clippings/` is transient and git-ignored). Never modify an existing
   raw source; corrections belong in wiki pages.
3. **Discuss key takeaways** with the curator before filing — skip when batch-ingesting
   unsupervised.
4. **Write the source-summary page** at `.brain/wiki/sources/<slug>.md` using
   `.brain/templates/source.md`: frontmatter per manual §3, `raw:` relative link to the
   raw file, `origin:` URL, TL;DR, key takeaways, concepts touched, contradictions.
5. **Compile cross-links — touch 5–10+ pages.** Create or update `concepts/` and
   `entities/` pages the source informs (use their templates; every non-source page cites
   `sources:` provenance). Add **reciprocal** `[[wikilinks]]`. Flag conflicts inline
   (`> ⚠️ Contradiction: …`) and set the older page `status: stale` when superseded. A
   `[[link]]` to a not-yet-existing page is a legal TODO marker.
6. **Update `wiki/index.md`**: add/refresh the entry under the right category and bump
   the frontmatter `source_count` / `page_count` / `updated`.
7. **Append to `wiki/log.md`**: `## [YYYY-MM-DD] ingest | <Title>` with 1–3 lines on what
   was filed and which pages changed. Append-only — add after the last entry.
8. **Commit** (offer first): `ingest: <source title>`.

## Modes

- **Batch** (`clippings` or several files): run steps 1–7 per source, commit per source.
  Report one summary at the end: sources in, pages created/updated, contradictions found.
- **No brain?** Don't improvise a layout — offer `/brain:init` first.

**Done when:** summary page exists and is linked (no orphan), 5+ pages touched, index and
log updated, commit offered. That bookkeeping is the whole point — it keeps the wiki alive.
