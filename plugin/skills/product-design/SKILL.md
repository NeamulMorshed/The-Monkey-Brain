---
description: Run an industry-standard product-design process end to end — discovery, definition, ideation, design, validation — and file every artifact into the Monkey Brain. Use when the user wants to design a product, feature, or UX from the ground up; asks for personas, user journeys, JTBD, how-might-we questions, ideation/brainstorming, usability or accessibility evaluation. The first domain-expertise pack — it brings the process and the knowledge, and the brain records the decisions. Requires a .brain/ (offer /brain:init when missing).
argument-hint: "<product or feature to design>"
effort: high
---

# /brain:product-design — the product-design pack

The **first domain-expertise pack**: a packaged process + searchable knowledge that runs on
top of the brain. It orchestrates the craft (and hands the visual build to `ui-ux-pro-max` +
`frontend-design`); the brain **records the knowledge** so each decision compounds. Bundled
assets: `data/` (methods, heuristics, accessibility), `templates/` (deliverable skeletons),
`checklist.md` (the validation gate `/brain:wrap` reads).

> **Pick the phase, don't run all five blindly.** A small feature may need only Definition +
> Validation; a new product needs the whole diamond. Confirm scope with the curator first.

## The process (each phase files back)

1. **Discovery** — understand the problem. Stakeholder/user interviews, **JTBD** framing,
   competitor teardowns. Fan out `brain-researcher` for the teardowns. → file to
   `wiki/research/` (use `/brain:research`); log `research | discovery: <product>`.
2. **Definition** — frame what to build. **Personas** (`templates/persona.md`), **journey
   maps** (`templates/journey-map.md`), a problem statement + **How-Might-We** questions
   (`templates/hmw.md`). → the decision of *what to build* becomes `specs/<feature>.md` with
   numbered ACs via `/brain:plan`; personas/journeys are `wiki/syntheses/` pages the spec cites.
3. **Ideation** — diverge then converge. Pick methods from `data/methods.md` (Crazy 8s,
   SCAMPER, Double Diamond, dot-voting). → the chosen direction + rejected alternatives file
   as a `wiki/syntheses/` page (record *why*, not just the winner); a real design decision
   becomes a `decisions/` ADR.
4. **Design** — hand off the build with the brain's context injected. `ui-ux-pro-max` decides
   the **design system** (palette/style/type/industry reasoning); `frontend-design` executes
   the build. Feed them brand decisions from `decisions/`, past audit findings, and banned
   patterns from `instincts/active/`. → their choices file back to `decisions/`; anti-patterns
   seed `instincts/pending/`. (Precedence: domain pack > domain skill > craft plugin.)
5. **Validation** — prove it works. **Nielsen heuristic** evaluation (`data/heuristics.md`),
   **WCAG accessibility** pass (`data/accessibility.md`), a usability-test script
   (`templates/usability-test-script.md`). → findings file to `wiki/syntheses/`; **open
   critical (P0) findings gate `/brain:wrap`** exactly like security P0s (see `checklist.md`).

## Wiring

- **Workstream:** create/update `projects/<workstream>.md` with `pack: product-design` and the
  current `phase` so `/brain:wrap` knows to run this pack's `checklist.md` gate.
- **Every artifact is cited and linked** — personas cite discovery research; specs cite
  personas/journeys; ADRs cite the ideation synthesis. The wiki-check hook blocks orphans.
- **Log + commit per phase** with the matching prefix (`research | plan | build | review`);
  offer the next phase's skill at each hand-off.

**Done when:** the phases the curator asked for are complete, each produced a linked+indexed
artifact in the right `.brain/` folder, the workstream records `pack: product-design`, and the
validation checklist has no open P0s (or the curator has accepted them explicitly).
