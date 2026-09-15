---
description: Private career pack in .brain/private/ (never committed or indexed) — case studies from shipped work, CV variants, an evidence-backed skill matrix, mock interviews. Use for "case study", "mock interview", "update/tailor my CV" or "skill matrix".
argument-hint: "<case study | cv | skills | mock interview> [details]"
effort: high
---

# /brain:career — your work, told well, kept private

All career material lives in `.brain/private/` (gitignored by the brain template, and outside
every search, digest and dashboard). Templates are in `${CLAUDE_SKILL_DIR}/templates/`.

## Case studies — `private/cases/<slug>.md`

Built from what the brain already knows: the spec and its ACs, the review, the decisions (ADRs)
and the log. Three stages, in order:

1. **assembled** — facts pulled together from the brain, cited to their pages.
2. **drafted** — written in the owner's voice; they edit it (voice pass), and recurring
   phrasing goes to `private/voice.md`.
3. **publishable** — only with `confidentiality: cleared` after the owner checked every name,
   number and client detail. **The hooks refuse `publishable` without it**, and refuse to write
   an uncleared case study anywhere outside `private/`.

## CV — `private/cv/master.md` + `private/cv/<role>.md`

The master is canonical; role variants derive from it (reorder, cut, re-emphasize — never
invent). "Refresh my CV" mines the log, done specs and decisions since the last update.

## Skill matrix — `private/skills.md`

Five pillars (design · product · development · AI & tooling · leadership), levels 1–5. Any
level above 2 needs an evidence link (a case study, a spec, a decision). Nudge the most dormant
pillar in the weekly review.

## Mock interview

Ask questions grounded in the owner's real history — a decision they made, a trade-off in a
shipped spec, a review finding — one at a time. Score each answer (structure, evidence,
outcome) and file the session to `private/interviews/<date>.md` with the weakest area to work
on next.
