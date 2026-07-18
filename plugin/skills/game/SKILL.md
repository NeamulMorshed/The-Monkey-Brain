---
description: Run the game-development pipeline in the Monkey Brain — concept to GDD to prototype spec to build to playtest to balance decisions. Use when the user wants to start a game, write a game design document (GDD), design mechanics or a core loop, spec a prototype, log a playtest, or tune game balance. Reuses the develop-lifecycle skills (plan, build, wrap) with a game-shaped front end. Requires a .brain/ (offer /brain:init when missing).
argument-hint: "<game concept or current phase>"
effort: high
---

# /brain:game — the game pipeline

Games reuse the same spine as any feature (research → plan → build → review), with a
game-shaped front end: a **GDD** captures the concept, a **prototype spec** turns the risky
unknowns into acceptance criteria, **playtests** are ingested as sources, and **balance
decisions** are ADRs. The brain records all of it so the design compounds across playtests.

> **Sibling: the product pipeline.** A product runs idea → PRD → spec → build → track → wrap:
> `/brain:research` files the idea to `wiki/research/`; the `product-management` plugin drafts
> the PRD into `raw-sources/` → `/brain:ingest`; `/brain:plan` writes the spec; `/brain:build`
> implements; `product-tracking` plans live in `projects/`; `/brain:wrap` closes it. No special
> skill needed — it's the standard lifecycle. See instance manual §10.

## The pipeline (each phase files back)

1. **Concept → GDD.** Draft `wiki/<game>-gdd.md` from `templates/gdd.md`: high concept,
   pillars, **MDA** (mechanics / dynamics / aesthetics), the **core loop**, progression,
   win/loss, art direction, scope + platform ([[godot]] / [[unity]] / web entity pages in
   `wiki/entities/`). The GDD's **open questions** are what the prototype must answer.
2. **Prototype spec.** Turn those unknowns into `specs/<game>-prototype.md` via `/brain:plan`
   — numbered ACs that each resolve a design risk ("is the core loop fun in 30s?"), with a
   **tier** (prototypes are usually `feature`; a new engine/architecture decision is
   `architecture`). The plan/TDD gates apply as normal.
3. **Build.** `/brain:build` works the ACs. Create/link the engine entity page for the target
   ([[godot]] etc.) with setup notes and gotchas as they're found.
4. **Playtest → source.** Each playtest session is written up and **ingested as a raw source**
   (`/brain:ingest`) so observations are searchable knowledge, not lost notes. Log
   `## [YYYY-MM-DD] ingest | playtest <n>: <game>`.
5. **Balance → ADR.** Every tuning decision (numbers, difficulty curves, economy) that a
   playtest drives becomes a `decisions/<slug>.md` ADR — the *why* behind the values, so a
   future change knows what it's trading against. Update the GDD's `phase` and the mechanics
   table to match reality.

## Wiring

- **Workstream:** `projects/<game>.md` with `phase` tracking concept → prototype → build →
  playtest; set `pack: product-design` if you also run the UX/validation gate on the UI.
- **Link reciprocally:** GDD ↔ prototype spec ↔ playtest sources ↔ balance ADRs (the
  wiki-check hook blocks orphans). Log + commit per phase with the matching prefix.

**Done when:** the GDD exists and is current, the prototype spec's ACs are met, playtests are
ingested as sources, and the balance decisions that shaped the build are ADRs in `decisions/`.
