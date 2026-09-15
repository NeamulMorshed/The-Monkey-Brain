---
description: Turn a feature idea into specs/<feature>.md with numbered acceptance criteria (AC-1…) and a tier — the record the plan and TDD gates read. Use when the user says "spec X", "write/draft a spec", "plan the feature", or before any non-trivial implementation. Architecture tiers need explicit curator approval; only the curator's word flips plan_approved.
argument-hint: "<feature>"
effort: high
---

# /brain:plan — a spec the gates can read

Numbered acceptance criteria, a tier, and a truthful approval field — that is what turns
"plan" from advice into enforcement (instance manual §4–§5).

## Steps

1. **Gather context:** `wiki/index.md` → related research / concept / decision pages.
   **Research comes first:** a `feature` or `architecture` spec with no `wiki/research/`
   page to cite **must run `/brain:research` first** — unless the curator said to skip it
   in this conversation ("skip research", "just build it"), in which case record the skip
   and their words in the spec's Notes. `quick` tier is exempt; research on a two-hour fix
   is waste.
2. **Draft `specs/<kebab-feature>.md`** from `templates/spec.md`:
   - **Problem / Goals / Non-goals** in curator language.
   - **Acceptance criteria** — numbered `AC-1, AC-2…`, each observable and testable;
     they are the contract `/brain:build` works and `/brain:review` verifies.
   - **Test plan** — how each AC will be proven.
   - **Tier** (manual §5) with one line of rationale: `quick` (<2h, advisory only) ·
     `feature` (TDD gate on) · `architecture` (hard plan gate + TDD gate).
   - **Markdown only.** The spec file *is* the plan — don't also publish it as a web page
     or artifact unless the curator asks. The gates, `/brain:build` and `/brain:review`
     read the Markdown; a page is a second copy that drifts.
   - **Size it with the code graph** before settling the tier:
     `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/graph.js" radius <files, dirs or keywords the feature touches>`.
     It walks everything that imports those files (2 hops) and suggests a tier and model.
     Use its suggestion unless you have a reason not to, and paste its "touches … score"
     line into the spec's Notes as the rationale. A wide radius means `architecture`, which
     arms the plan gate.
   - **Scope the gates** — fill the spec's `scope:` list with the files and directories
     from the radius output (project-relative globs, e.g. `src/auth/**`,
     `plugin/hooks/scripts/guards.js`). The plan and TDD gates then consult this spec
     only for writes inside that scope, so a second open spec isn't blocked by this one.
     A write no open spec claims is still checked against every open spec.
3. **Review with the curator.** Walk the ACs and the tier together; adjust until they
   agree this is the feature they meant.
4. **Approval — curator-owned, never self-set:**
   - `architecture`: source writes stay blocked until the spec carries
     `plan_approved: true`. Set that field **only after the curator explicitly approves
     in conversation** — quoting their approval in the log entry is good practice.
   - `feature` / `quick`: verbal agreement suffices; leave `plan_approved: false`.
5. **Workstream record:** create or update `projects/<workstream>.md`
   (template `project-status.md`): tier, `phase: plan`, link to the spec.
6. **Bookkeeping:** append `wiki/log.md` `## [YYYY-MM-DD] plan | <feature>`, offer
   commit `plan: <feature>`. Then offer `/brain:build <spec>`.

**Done when:** the spec exists with numbered ACs + test plan + tier, the curator has
seen it, the approval state is recorded truthfully, and log + commit are done.
