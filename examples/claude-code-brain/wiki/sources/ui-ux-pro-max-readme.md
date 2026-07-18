---
title: "Source — ui-ux-pro-max README"
type: source
status: active
tags: [ui-ux-pro-max, design, skills, bm25, expertise-pack, design-system]
created: 2026-07-17
updated: 2026-07-17
raw: "../../raw-sources/ui-ux-pro-max README.md"
origin: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"
related: ["[[ui-ux-pro-max]]", "[[domain-expertise-packs]]", "[[skills]]", "[[frontend-design]]", "[[search-tooling]]"]
aliases: ["ui ux pro max readme", "uupm readme"]
---

# ui-ux-pro-max README

> **Raw source:** [ui-ux-pro-max README.md](../../raw-sources/ui-ux-pro-max%20README.md) · **Origin:** github.com/nextlevelbuilder/ui-ux-pro-max-skill · **Ingested:** 2026-07-17

## TL;DR
An AI [[skills|skill]] providing **design intelligence**: a searchable knowledge base (styles,
palettes, typography, UX rules) + a BM25 search script + a reasoning engine that generates a
complete, industry-tailored design system from a one-line request. Ingested as the
**domain-expertise-pack exemplar** for the Monkey Brain v2 roadmap — architecturally a mini
Monkey Brain pre-compiled for one domain (see [[domain-expertise-packs]]).

## Key takeaways
- **Packaged domain knowledge, in searchable data files:** 84 UI styles · 192 color palettes
  aligned 1:1 with 192 product types · 74 font pairings · 25 chart types · 98 UX guidelines ·
  stack-specific rules for 22 frameworks · **161 industry reasoning rules** (v2.0 flagship).
- **Design System Generator pipeline:** user request → **5 parallel domain searches**
  (product type, style, palette, landing-page pattern, typography) → **reasoning engine**
  (match product→category rules, BM25 style ranking, industry anti-pattern filtering, JSON
  decision rules) → complete output: pattern + style + colors + typography + effects +
  **anti-patterns to avoid** + **pre-delivery checklist** (SVG icons not emojis, cursor
  states, 4.5:1 contrast, focus states, `prefers-reduced-motion`, responsive breakpoints).
- **Each of the 161 rules carries:** recommended pattern, style priority, color mood,
  typography mood, key effects, and industry anti-patterns (e.g. "no AI purple/pink gradients"
  for banking).
- **Search is local BM25** (`scripts/search.py`, Python stdlib only, offline, no network
  calls) with `--domain style|typography|chart`, `--stack react|javafx|…`, `--design-system`,
  and `--json` modes — the same search-over-markdown/CSV family as [[qmd]], embedded *inside*
  a skill.
- **Persistence pattern (Master + Overrides):** `--persist` writes
  `design-system/MASTER.md` (global source of truth) + `design-system/pages/<page>.md`
  (overrides only). Hierarchical retrieval across sessions: page file wins where it exists,
  Master otherwise — a filed-back knowledge store, but **static** (no compounding).
- **Auto-activation:** in skill mode it fires on any natural UI/UX request ("Build a landing
  page for my SaaS") — description matching, no command needed. Slash-command mode for agents
  without auto-activation.
- **Distribution:** Claude marketplace (`/plugin marketplace add
  nextlevelbuilder/ui-ux-pro-max-skill`) or an npm CLI (`uipro init --ai <agent>`) generating
  platform files for 19+ assistants from one source of truth (template-based generation).
- Freemium: open-source core vs. premium (brand identity, logo/CIP, asset generation,
  enterprise token architecture).

## Concepts this touches
- [[domain-expertise-packs]] — this is the pattern's exemplar: data + search + process + checklist
- [[skills]] — auto-activation by description; a skill can *carry a database and scripts*
- [[search-tooling]] — BM25 over local files at pack scale (the [[qmd]] family, minus vectors)
- [[frontend-design]] — division of labor: ui-ux-pro-max *decides* the design system,
  frontend-design-style plugins *execute* the build
- [[plugins]] — marketplace + CLI distribution of the same skill

## Contradictions / notes
> ⚠️ Boundary worth naming, not a contradiction: its knowledge is **frozen at publish** —
> recommendations don't learn from use. The Monkey Brain v2 pack format keeps the
> data+search+checklist architecture but **files every recommendation back** into the
> instance (design decisions → ADRs, anti-patterns → instincts), so packs compound. See
> [[domain-expertise-packs]] and [[monkey-brain-vs-mewvault]].

## Pages updated on ingest
- [[index]], [[ui-ux-pro-max]], [[skills]], [[frontend-design]], [[search-tooling]], [[plugins]], [[entities]]
