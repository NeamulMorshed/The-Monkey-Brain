---
title: "GDD — <Game>"
type: gdd
status: draft            # draft | active | done | superseded
tier: feature            # quick | feature | architecture (the prototype spec inherits this)
phase: concept           # concept | prototype | build | playtest | done
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []              # link the prototype spec, playtest logs, balance ADRs
---

# <Game> — Game Design Document

> The GDD is the concept record; the **prototype spec** (`specs/`, via `/brain:plan`) is what
> the gates read. Keep this living — update it as playtests move `phase` forward.

## High concept
One or two sentences: the pitch. Genre, platform, and the single most important idea.

## Pillars
The 3–4 experience pillars every decision serves (e.g. "tense", "readable", "fair").

## MDA
- **Mechanics** — the rules and systems (what the game *is*, concretely).
- **Dynamics** — the run-time behavior those mechanics produce in play.
- **Aesthetics** — the emotions/experience targeted (the *why* — maps to the pillars).

## Core loop
The moment-to-moment loop the player repeats (e.g. *observe → decide → act → reward → escalate*).
Name the seconds-scale loop and the session-scale loop.

## Mechanics
| Mechanic | What it does | Player input | Feedback |
| --- | --- | --- | --- |
| … | … | … | … |

## Progression & economy
How difficulty, content, and power unfold; currencies/resources and their sinks & sources.

## Win / loss & failure
Victory conditions, failure states, and what a failure teaches (the retry hook).

## Art & audio direction
Visual style, palette, readability rules, mood, key audio cues. (Design-system choices → ADRs.)

## Scope & platform
Target platform/engine ([[godot]] / [[unity]] / web), controls, session length, MVP boundary.

## Open questions & risks
The unknowns a prototype must answer — these become the prototype spec's acceptance criteria.

## Links
Prototype spec: [[…]] · Playtest logs: [[…]] · Balance decisions: [[…]]
