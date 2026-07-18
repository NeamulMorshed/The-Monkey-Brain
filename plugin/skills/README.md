# skills/ — the /brain:* verbs (Phase 3)

Each skill is a `<name>/SKILL.md` directory here, invoked as `/brain:<name>`
(the `brain` plugin name is the namespace prefix). Natural-phrase triggers
(hook #2 `trigger-router`) are the primary UX; commands are the explicit form.

| Skill | Purpose | Status |
| --- | --- | --- |
| `init` | Scaffold `.brain/` — self-contained: bundled `brain-template/` + `scripts/new-brain.js` (marketplace installs don't ship `bootstrap/`); wires the root `@.brain/CLAUDE.md` import; offers the recommended capability plugins (`recommended-plugins.json` + `scripts/plugins.js`) | ✅ |
| `ingest` | The 8-step compile of a source into the wiki (hook #4 checks every page) | ✅ |
| `query` | Index-first answering with citations; novel answers filed back to `syntheses/` | ✅ |
| `lint` | Mechanical scan (`scripts/lint.js`, injected via `` !`…` ``) + reasoning over contradictions/staleness | ✅ |
| `wrap` | Definition-of-done: verify, sync log + index + resume narrative, commit | ✅ |
| `research` | Web + codebase research filed to `wiki/research/` with sources + recommendation | ✅ |
| `plan` | Spec with numbered acceptance criteria + tier; approval stays curator-owned | ✅ |
| `build` | Test-first loop against a spec's ACs (works with the TDD/plan gates) | ✅ |
| `review` | AC verification + code review filed back (synthesis page, ADRs, instinct candidates) | ✅ |
| `terse` | Caveman-style session output compression (code/commands never compressed) | ✅ |
| `compress` | Permanent instruction-file compression with before/after receipts | ✅ |
| `product-design` | First domain-expertise **pack** — 5-phase process + `data/` (methods, Nielsen heuristics, WCAG) + `templates/` + `checklist.md` (the `/brain:wrap` gate) | ✅ |
| `doctor` | Health monitor with token receipts (Phase 8) | ⬜ |

Conventions: SKILL.md < 150 lines (body stays in context); bundled scripts run
via `${CLAUDE_SKILL_DIR}` and are covered by `hooks/scripts/selftest.js`;
`schema/brain-template/` stays the canonical template master
(`new-brain.js --sync-template` refreshes the bundle; selftest fails on drift).

## Model routing (Phase 5.5)

Each skill declares its place in the routing policy via `model:` / `effort:`
frontmatter, so the right model does each kind of work **by default** (and the
`effort` budget is spent only where judgment lives). Hook #7 `agent-track`
enforces the same policy on subagent dispatches; deterministic checks already
run in scripts at zero model cost.

| Work class | Skills | Frontmatter | Why |
| --- | --- | --- | --- |
| **Judgment & synthesis** | `plan` · `review` · `wrap` · `query` · `lint` · `compress` · `product-design` | `effort: high` (model inherits the session's main model) | architecture plans, final review, wrap verification, contradiction reconciliation, meaning-preserving compression, design reasoning — never downgraded |
| **Routine execution** | `ingest` · `research` · `build` | `model: sonnet` · `effort: medium` | summaries, research reads, standard implementation — pinned to Sonnet regardless of the session model |
| **Mechanical** | `init` | `model: sonnet` · `effort: low` | scaffolding runs a Node script; little reasoning |
| **Trivial** | `terse` | `model: haiku` · `effort: low` | flips an output mode |

**Parallel fan-out** (subagents in `../agents/`, run concurrently; only summaries
return): `research` fans out to **`brain-researcher`** (Sonnet, read-only) and
synthesizes on the main model; batch `ingest` delegates to **`brain-librarian`**
(Sonnet) so the main session sees only log entries; `build` + `review` pair a
Sonnet implementer with a main-model auditor. See the Agents section in
`../README.md` and the definitions in `../agents/`.

## Capability plugins (Phase 6)

The skills own the brain's *knowledge* workflows; **craft** (UI builds, security
audits, PR flows, PRDs…) is done by external **capability plugins** that
`/brain:init` offers. `init/recommended-plugins.json` is the authoritative set of
nine (`github`, `frontend-design`, `superpowers`, `security-guidance`,
`product-tracking-skills`, `code-modernization`, `productivity`,
`product-management`, `ui-ux-pro-max`); `init/scripts/plugins.js` renders the
offer. The contract — **plugins do the craft; the brain records the knowledge** —
means every plugin output that is a decision, finding, or artifact is filed into a
named `.brain/` folder by the brain's skills and hooks (the manifest maps each
plugin to its target folder; the instance manual's §9 states the rule and the
precedence chain). Plugins auto-activate by their own descriptions; the
trigger-router only nudges the brain's own workflows.

## Domain-expertise packs (Phase 6.5)

Where capability plugins are external, **packs** are hosted by the engine and
**compound** — every recommendation files back into the instance. A pack is a
skill with a bundled knowledge structure:

```
<pack>/
├── SKILL.md      # the process (phases, when to auto-activate) + routing frontmatter
├── data/         # searchable domain knowledge (markdown tables; qmd-indexable)
├── templates/    # deliverable skeletons (persona, journey map, GDD…)
└── checklist.md  # the validation gate /brain:wrap runs when a workstream sets `pack:`
```

First pack: **`product-design/`** — discovery → definition → ideation → design →
validation, with Nielsen + WCAG knowledge and a P0-gating checklist. A workstream
opts in via `pack: <name>` in its `projects/` status page; `/brain:wrap` then runs
that pack's `checklist.md` and blocks "done" on open P0s (like security P0s). Later
packs (game design, analytics) reuse the same shape.
