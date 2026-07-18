---
title: "Domain Expertise Packs"
type: concept
status: active
tags: [expertise-packs, skills, knowledge, pattern, design]
created: 2026-07-17
updated: 2026-07-17
sources: ["[[ui-ux-pro-max-readme]]"]
related: ["[[skills]]", "[[plugins]]", "[[search-tooling]]", "[[ui-ux-pro-max]]", "[[monkey-brain-vs-mewvault]]", "[[llm-wiki-pattern]]"]
aliases: ["expertise pack", "expertise packs", "domain pack"]
---

# Domain Expertise Packs

Packaged **domain knowledge** shipped as a [[skills|skill]]: searchable data + an
industry-standard process + a validation checklist, auto-activating when a task matches its
description. Workflow [[plugins]] bring *method* (how to work); expertise packs bring
*knowledge* (what the industry knows).

## Anatomy (generalized from [[ui-ux-pro-max]])

```
<domain>-pack/
├── SKILL.md        # the process: phases, methods, when to auto-activate
├── data/           # searchable domain knowledge (tables — BM25/qmd-indexed)
├── templates/      # deliverable skeletons (persona, journey map, GDD…)
└── checklist.md    # validation gate, read before "done"
```

- **Data + local search** ([[search-tooling]]) keeps context cost near zero until a task
  activates the pack — only matched rows load, never the whole database.
- **Reasoning layer**: match the task → domain rules → filter industry anti-patterns →
  recommend (ui-ux-pro-max runs 5 parallel BM25 searches, then JSON decision rules).
- **Checklist as gate**: outputs are validated against the pack's checklist before delivery.

## Static vs compounding

[[ui-ux-pro-max]] — the exemplar — is **frozen at publish**: its 161 rules never learn from
use. The Monkey Brain v2 pack format (engine `ROADMAP.md` Phase 6.5) keeps this anatomy and
adds **compounding**: every recommendation files back into the project instance — design
choices become ADRs in `decisions/`, banned anti-patterns become active instinct rules that
[[hooks]] enforce, findings become wiki pages. *Their expertise is output; a brain's
expertise is memory.* See [[monkey-brain-vs-mewvault]].

## Planned packs (Phase 6.5)

First: **product-design** — discovery (JTBD, competitor teardowns) → definition (personas,
journey maps) → ideation (Crazy 8s, SCAMPER, Double Diamond) → design (hand off to
[[ui-ux-pro-max]] for the design system, a build plugin like [[frontend-design]] for
execution) → validation (Nielsen heuristics, WCAG pass). Then: game design (GDD, MDA,
playtest protocols), product analytics, brand/marketing — same anatomy, one format.

## Sources
- [[ui-ux-pro-max-readme]]
