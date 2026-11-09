---
title: "ADR — External craft skills are offered as packs, never vendored"
type: decision
status: accepted
created: 2026-11-09
updated: 2026-11-09
related: ["[[motion-skill-packs]]", "[[motion-and-video-skills]]", "[[motion-skill-packs-review]]"]
---

# ADR — External craft skills are offered as packs, never vendored

## Context
The curator wanted GSAP/Framer, Remotion and Emil Kowalski's skills usable in brain projects under the brain's rules.

## Decision
They ship as curated **packs** in `recommended-skills.json`, offered per project by `/brain:init`, and installed into `.claude/skills/` only after the curator says yes to that pack. The brain routes to them below its own workflows and files their output (research, specs, reviews, ADRs, pending instincts).

## Why
- Vendoring freezes upstream and bloats the plugin, and Remotion's licence forbids it.
- Every installed skill's description costs context on every turn, so a project should carry only the packs it uses.
- It's the same contract already proven for MCP servers: the brain offers and records, it never installs on its own.

## Consequences
Install commands can rot upstream; the review found the gsap install failing and added a fallback. Skills that are user-invoked upstream can't be called by the model, so the brain asks the curator to run them.
