---
title: "WCAG accessibility pass (POUR)"
type: reference
pack: product-design
updated: 2026-07-18
---

# Accessibility — WCAG 2.2, POUR

The validation phase runs a practical WCAG pass. Target **Level AA** for product work. WCAG is
organized under four principles — **P**erceivable, **O**perable, **U**nderstandable, **R**obust.
A failed Level A criterion on a core task is a **P0** (blocks `/brain:wrap`).

## Perceivable

- **Text alternatives** (1.1.1, A) — every non-text element (images, icons, controls) has a
  meaningful `alt` / accessible name; decorative images are marked empty.
- **Captions & transcripts** (1.2, A/AA) — for audio/video.
- **Contrast** (1.4.3, AA) — text ≥ **4.5:1** (large text ≥ 3:1); UI components/graphics ≥ 3:1
  (1.4.11, AA).
- **Reflow & resize** (1.4.4/1.4.10, AA) — usable at 200% zoom and at 320px width without
  horizontal scroll or loss of content.
- **Don't rely on color alone** (1.4.1, A) — state/meaning also carried by text, icon, or shape.

## Operable

- **Keyboard** (2.1.1, A) — all functionality works from the keyboard; **no keyboard trap**
  (2.1.2, A).
- **Focus visible** (2.4.7, AA) — a clear focus indicator on every interactive element.
- **Focus order** (2.4.3, A) — logical, matches visual order.
- **Target size** (2.5.8, AA, 2.2) — interactive targets ≥ **24×24 px** (or adequate spacing).
- **Enough time / no seizures** (2.2, 2.3) — timeouts adjustable; nothing flashes > 3×/sec.
- **Bypass blocks / page titles / link purpose** (2.4.1–2.4.4, A) — skip links, descriptive
  titles, links that make sense out of context.

## Understandable

- **Labels & instructions** (3.3.2, A) — every input has a persistent visible label.
- **Errors identified & described** (3.3.1/3.3.3, A/AA) — errors named in text and a fix suggested.
- **Consistent navigation & identification** (3.2.3/3.2.4, AA).
- **Language of page** set (3.1.1, A).

## Robust

- **Valid, semantic markup** (4.1.1) — proper elements/roles; **name, role, value** exposed to
  assistive tech for all custom components (4.1.2, A).
- **Status messages** (4.1.3, AA) — announced to screen readers without moving focus
  (e.g. `aria-live`).

## How to run the pass

1. Keyboard-only walkthrough of every core flow; then a screen-reader pass on the same.
2. Automated check (axe/Lighthouse) for contrast/markup — but never rely on it alone; ~⅓ of
   criteria need human judgment.
3. File results as `wiki/syntheses/a11y-<feature>.md`; Level-A failures on core tasks are P0.
