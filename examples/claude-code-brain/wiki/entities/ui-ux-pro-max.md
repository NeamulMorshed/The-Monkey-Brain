---
title: "ui-ux-pro-max"
type: entity
status: active
tags: [claude-code, skill, plugin, design, bm25, expertise-pack]
created: 2026-07-17
updated: 2026-07-17
sources: ["[[ui-ux-pro-max-readme]]"]
related: ["[[domain-expertise-packs]]", "[[skills]]", "[[frontend-design]]", "[[search-tooling]]", "[[qmd]]", "[[plugins]]"]
aliases: ["uupm", "ui ux pro max"]
---

# ui-ux-pro-max

A design-intelligence [[skills|skill]] (by nextlevelbuilder, uupm.cc) that turns "build a
landing page for my beauty spa" into a complete, industry-tailored design system in seconds —
pattern, style, palette, typography, effects, anti-patterns, and a pre-delivery checklist.

## Capabilities
- **Knowledge base as data files:** 84 UI styles · 192 palettes (1:1 with 192 product types) ·
  74 font pairings · 25 chart types · 98 UX guidelines · 22 tech stacks · **161 industry
  reasoning rules**, each with pattern/style/color/typography priorities and industry
  anti-patterns.
- **Reasoning pipeline:** 5 parallel BM25 domain searches → rule matching → anti-pattern
  filtering → JSON decision rules → full design-system output with validation checklist.
- **Local, offline search:** `scripts/search.py` (Python stdlib only) — the
  [[search-tooling|search-over-local-files]] family of [[qmd]], embedded inside a skill.
- **Master + Overrides persistence:** `--persist` writes `design-system/MASTER.md` +
  `pages/<page>.md` overrides; hierarchical retrieval makes the design system durable across
  sessions (a static, single-domain cousin of a wiki).
- **Auto-activates** on natural UI/UX requests via description matching; distributed through
  the Claude [[plugins|marketplace]] and an npm CLI targeting 19+ assistants.

## How it fits the ecosystem
The exemplar of **[[domain-expertise-packs]]**: packaged domain knowledge (data + search +
reasoning + checklist) rather than just a workflow. Division of labor with
[[frontend-design]]: ui-ux-pro-max **decides** the design system; a build-focused design
plugin **executes** it. Architecturally a mini Monkey Brain pre-compiled for one domain —
data, search, and filed recommendations — but frozen at publish: it doesn't learn from use.
The Monkey Brain v2 pack format adopts the architecture and adds **compounding** (decisions →
ADRs, anti-patterns → instincts).

## Sources
- [[ui-ux-pro-max-readme]]
