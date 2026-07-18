---
title: "Product-design methods"
type: reference
pack: product-design
updated: 2026-07-18
---

# Methods — discovery, definition, ideation

Searchable catalog for the pack. Each method: what it is, when to reach for it, and what
artifact it produces (which the brain files back).

## Framing & discovery

| Method | What it is | When | Produces → files to |
| --- | --- | --- | --- |
| **JTBD** (Jobs To Be Done) | Frame needs as the "job" a user hires the product to do: *"When ___, I want to ___, so I can ___."* | Start of discovery; cuts through feature requests to underlying motivation | Job statements → `wiki/research/` |
| **User interviews** | 5–8 open, non-leading conversations about real past behavior (not hypotheticals) | Before committing to a direction | Interview notes → `raw-sources/` → ingest |
| **Competitor teardown** | Structured walkthrough of rivals: flows, patterns, gaps, positioning | Discovery; find table stakes and white space | Teardown → `wiki/research/` (fan out `brain-researcher`) |
| **Affinity mapping** | Cluster raw observations into themes bottom-up | After interviews, to find patterns | Themes → `wiki/syntheses/` |

## Definition

| Method | What it is | When | Produces → files to |
| --- | --- | --- | --- |
| **Persona** | An evidence-based archetypal user: goals, context, pains, behaviors | After discovery; align the team on *who* | `templates/persona.md` → `wiki/syntheses/` |
| **Journey map** | The user's end-to-end path with actions, thoughts, emotions, pain points, opportunities | To locate where the experience breaks | `templates/journey-map.md` → `wiki/syntheses/` |
| **Problem statement** | One sentence: user + need + insight. No solution in it. | Before ideation, to aim it | `templates/hmw.md` |
| **How-Might-We (HMW)** | Reframe each pain as an open opportunity question | Bridge from problem to ideation | `templates/hmw.md` → seeds ideation |

## Ideation (diverge → converge)

| Method | What it is | When | Produces → files to |
| --- | --- | --- | --- |
| **Crazy 8s** | 8 sketches in 8 minutes — quantity over polish | Rapid divergence on a single screen/flow | Sketches → decision synthesis |
| **SCAMPER** | Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse — prompts to transform an idea | When stuck or iterating on one concept | Variants → `wiki/syntheses/` |
| **Double Diamond** | Discover → Define (diverge/converge on the problem) → Develop → Deliver (diverge/converge on the solution) | The overall shape of a full-product effort | Structures the whole run |
| **Dot voting** | Each person spends N dots on options to converge fast | End of divergence, to pick directions | Ranked options → decision ADR |

**Convergence rule:** always record the **rejected** alternatives and *why* — a `decisions/`
ADR captures the chosen direction and the discarded ones, so future sessions don't relitigate.
