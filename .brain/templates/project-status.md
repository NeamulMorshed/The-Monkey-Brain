---
title: "<Workstream> — status"
type: project
status: active            # active | paused | done
tier: feature             # quick | feature | architecture (default for its specs)
phase: build              # research | plan | build | review | done
pack:                     # optional domain-expertise pack governing this workstream
                          #   (e.g. product-design) — /brain:wrap runs its checklist gate
audit_score:              # last review/audit result, when one exists
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# <Workstream>

One page per workstream in `projects/` — the session-start status block reads
`tier` and `phase` from here. Keep ≤3 workstreams active (WIP limit, doctor checks).

## Now
What is in flight right now (link the active specs).

## Next
Ordered and small.

## Blockers / risks
- …

## Links
Specs: … · Decisions: [[…]] · Research: [[…]]
