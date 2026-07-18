---
title: "Product-design validation gate"
type: reference
pack: product-design
updated: 2026-07-18
---

# Validation gate — read by `/brain:wrap`

When a workstream records `pack: product-design`, `/brain:wrap` runs this gate before it lets
the session be "done". Items marked **(P0)** are hard gates — an unmet P0 **blocks wrap** the
same way an open security P0 does, unless the curator explicitly accepts it (record the
acceptance in the workstream's project-status). Non-P0 items are reported as advisories.

## Definition is grounded
- [ ] At least one **persona** exists and cites discovery research (not invented). *(P0 if the
      product was designed with zero user evidence.)*
- [ ] The problem statement is user-framed and solution-free; key journey pains map to HMWs.
- [ ] The spec's acceptance criteria trace back to a persona need or journey pain point.

## Ideation left a record
- [ ] The chosen direction **and the rejected alternatives** are filed (a `wiki/syntheses/`
      page or a `decisions/` ADR captures the *why*), so it isn't relitigated later.

## Design decisions are recorded, not lost
- [ ] Design-system choices (palette / type / components) are `decisions/` ADRs. **(P0 if a
      structural design decision was made with no ADR — the knowledge would evaporate.)**
- [ ] Anti-patterns discovered are drafted to `instincts/pending/`.

## Usability holds up (Nielsen)
- [ ] A heuristic evaluation was run against `data/heuristics.md` and filed. **(P0: any open
      catastrophe-severity (4) finding or broken core task.)**

## Accessible (WCAG AA)
- [ ] Keyboard-only pass of every core flow — no traps, focus visible. **(P0 on failure.)**
- [ ] Contrast ≥ 4.5:1 text / 3:1 UI; not color-alone; inputs labeled; errors described.
      **(P0: a Level-A failure on a core task.)**
- [ ] Automated check (axe/Lighthouse) run — with the caveat it catches only ~⅓.

## Validated with users (when the tier warrants it)
- [ ] A usability test (or a documented reason it was skipped for this tier) — failed core
      tasks resolved or tracked as spec items.

**Gate result to report in wrap:** list each **open P0** with its location and the fix or the
curator's explicit acceptance. No open P0 → gate passes.
