---
description: Run a 15-check health report on the project's Monkey Brain — broken links, orphans, stale flags, index freshness, Clippings backlog, log gaps, uncommitted changes, hook registration, injection budget, semantic-index freshness, WIP limits, instinct-queue overflow, specs without tests, open P0 findings, and schema version — then triage the fixes. Use when the user says "brain doctor", "check brain health", "is the brain healthy", or before a release/handoff.
argument-hint: "[--strict]"
effort: high
---

# /brain:doctor — full health report

The health monitor of the brain (ROADMAP Phase 8). The 15-check mechanical scan below ran
before you read this — its report is already in context (zero model tokens), and it also wrote
`sessions/health.json` so the **next session's** brain-status surfaces any open failures.

!`node "${CLAUDE_SKILL_DIR}/scripts/doctor.js"`

## How to read it

Levels: `✓` ok · `·` info · `⚠` warning · `✗` critical. **Criticals gate `/brain:wrap`** — an
open P0 finding, a missing index, or an unregistered hook is not "done". Warnings are triaged;
info is context.

## Steps

1. **Fix the criticals first** (they block a clean wrap):
   - *Open P0 findings* (#14) — resolve them or get the curator's explicit acceptance recorded
     in the workstream's project-status. This is the security/usability audit gate.
   - *Missing index* (#4) / *unregistered hooks* (#8) — structural; fix before anything else.
2. **Triage the warnings** — hand each to the skill that owns it, don't fix by hand here:
   - broken links · orphans · index drift · frontmatter → `/brain:lint`.
   - log gaps · uncommitted `.brain/` → `/brain:wrap` (log + commit).
   - specs without a test plan → `/brain:plan` (complete the Test plan section).
   - WIP over limit or idle projects → close/pause a workstream in `projects/`.
   - instinct-queue overflow → ask the curator to promote or drop `instincts/pending/`.
   - schema drift → offer `/brain:init --update`.
   - near the search ceiling → offer to enable qmd (manual §8).
3. **Report** the health line and the model-mix, then do (or offer) the top 1–3 fixes. Don't
   silently auto-fix structural things — surface them and let the curator steer.

**Done when:** criticals are fixed or explicitly accepted, the top warnings are routed to their
skills, and `sessions/health.json` reflects the current state (re-run to refresh it).
