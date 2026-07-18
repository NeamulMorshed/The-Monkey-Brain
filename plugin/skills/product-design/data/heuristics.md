---
title: "Nielsen's 10 usability heuristics"
type: reference
pack: product-design
updated: 2026-07-18
---

# Usability heuristics (Nielsen, 1994)

The validation phase evaluates the design against these ten. For each, record **violations**
with a severity (0 none · 1 cosmetic · 2 minor · 3 major · **4 catastrophe = P0**). P0/P1
findings gate `/brain:wrap` (see `checklist.md`).

| # | Heuristic | Evaluate: is it true here? |
| --- | --- | --- |
| 1 | **Visibility of system status** | Does the system always show what's going on (loading, saved, progress, current location) within a reasonable time? |
| 2 | **Match system ↔ real world** | Words, phrases, icons, and flows follow real-world conventions and user language — not internal jargon? |
| 3 | **User control & freedom** | Clear "emergency exits": undo/redo, cancel, back, no dead ends or forced paths? |
| 4 | **Consistency & standards** | Same words/actions mean the same thing throughout; follows platform conventions? |
| 5 | **Error prevention** | Slips and mistakes designed out (constraints, good defaults, confirmation on destructive acts) before they happen? |
| 6 | **Recognition rather than recall** | Options, actions, and info visible when needed — the user isn't forced to remember across screens? |
| 7 | **Flexibility & efficiency of use** | Accelerators (shortcuts, saved state, personalization) for experts, without blocking novices? |
| 8 | **Aesthetic & minimalist design** | No irrelevant/rarely-needed content competing with the essentials for attention? |
| 9 | **Help users recognize, diagnose, recover from errors** | Error messages in plain language, state the problem, suggest a fix — no raw codes? |
| 10 | **Help & documentation** | When needed, help is findable, task-focused, concrete, and not overlong? |

## How to run the pass

1. Walk each key screen/flow against all 10; note every violation with heuristic #, location,
   and a severity 0–4.
2. A **catastrophe (4)** or a broken core task is a **P0** — it blocks wrap.
3. File the findings as a `wiki/syntheses/` page (`heuristic-eval-<feature>.md`); link the
   spec and the workstream. Fixes for P0/P1 either land now or become tracked spec items.
