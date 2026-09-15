---
description: Run the 20-check health report on the project's Monkey Brain (links, orphans, index, log gaps, hooks, budget, open P0s, schema, cache, CI) and triage the fixes. Use for "brain doctor", "check brain health", "is the brain healthy", or before a release.
argument-hint: "[--strict]"
effort: high
---

# /brain:doctor — full health report

The health monitor of the brain (ROADMAP Phase 8, receipts added in v3 P11). The 20-check mechanical scan below ran
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
   - past ~100 pages → offer qmd for meaning-based search (`reference.md` §8).
   - proxy in front of the API (#16) → confirm it passes requests through unchanged, or remove it.
   - low cache-hit ratio (#17) → `/brain:usage` for the breakdown and the likely cause.
   - subagents returning nothing (#18) → review those dispatches' prompts and models in
     `sessions/agents.md`.
   - a code project with no CI (#19) → `/brain:ci`.
   - a dependency that cannot run (#20) → install what it names (Python 3.10+ for
     security-guidance, a `GITHUB_PERSONAL_ACCESS_TOKEN` for the github MCP), or disable that plugin.
3. **Report** the health line and the model-mix, then do (or offer) the top 1–3 fixes. Don't
   silently auto-fix structural things — surface them and let the curator steer.

**Done when:** criticals are fixed or explicitly accepted, the top warnings are routed to their
skills, and `sessions/health.json` reflects the current state (re-run to refresh it).
