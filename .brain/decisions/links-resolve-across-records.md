---
title: "ADR — Links resolve across wiki pages and records"
type: decision
status: accepted
created: 2026-09-16
updated: 2026-09-16
sources: ["[[brain-health-audit]]", "[[engine-knowledge]]"]
related: ["[[engine-knowledge]]", "[[wiki-self-healing]]", "[[doctor-health-checks]]"]
---

# Links resolve across wiki pages and records

## Context
The plan, review and research skills tell the model to link specs and ADRs (`[[brain-correctness]]`, `[[spec-scope-globs-gate-ownership]]`), and Obsidian — whose vault is the repo root — resolves those links. But wiki-check, lint and doctor each kept their own copy of a link inventory that only knew `wiki/`, so every such link was reported broken (8 on this brain) and a wiki page linked only from an ADR was an orphan. The model learned to ignore the warnings, and records' frontmatter drifted to bare slugs that were neither links nor provenance ([[brain-health-audit]] finding 4). Two fixes were possible: tell the model to use relative markdown links for records, or widen the resolver.

## Decision
Widen the resolver, once: `lib.linkIndex(brain)` covers `wiki/**` plus the `specs/`, `decisions/` and `projects/` records (by slug, `specs/x`-style name and alias) and is the only inventory wiki-check, lint and doctor use. Orphans stay a wiki-page notion, but a link from any record counts as inbound. Templates, sessions and raw sources are never link targets. Frontmatter uses the quoted-wikilink form, shown in every template.

## Consequences
Easier: one rule for linking anything the brain holds, matching Obsidian; a broken-link warning now means a real gap or a deliberate TODO. Harder: a slug must be unique across wiki pages and records — a concept named like a spec or workstream would resolve ambiguously (the knowledge pages avoid this, e.g. `develop-lifecycle-stages` beside the `develop-lifecycle` workstream). Watch: if records gain subfolders, `specs/x`-style names only cover the first level.
