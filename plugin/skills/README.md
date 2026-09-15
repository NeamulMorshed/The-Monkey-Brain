# skills/ — the /brain:* verbs (Phase 3)

Each skill is a `<name>/SKILL.md` directory here, invoked as `/brain:<name>`
(the `brain` plugin name is the namespace prefix). Natural-phrase triggers
(hook #2 `trigger-router`) are the primary UX; commands are the explicit form.

| Skill | Purpose | Status |
| --- | --- | --- |
| `init` | Scaffold `.brain/` — self-contained: bundled `brain-template/` + `scripts/new-brain.js` (marketplace installs don't ship `bootstrap/`); wires the root `@.brain/CLAUDE.md` import; offers the recommended capability plugins (`recommended-plugins.json` + `scripts/plugins.js`) | ✅ |
| `ingest` | The 8-step compile of a source into the wiki (hook #4 checks every page) | ✅ |
| `query` | Index-first answering with citations; novel answers filed back to `syntheses/` | ✅ |
| `brief` | Cited context pack (≤ ~2k tokens) from built-in BM25 recall over the compiled layers (`hooks/scripts/search.js`) — the command form of the `brain_brief` MCP tool | ✅ |
| `lint` | Mechanical scan (`scripts/lint.js`, injected via `` !`…` ``) + reasoning over contradictions/staleness | ✅ |
| `wrap` | Definition-of-done: verify, sync log + index + resume narrative, commit | ✅ |
| `research` | Web + codebase research filed to `wiki/research/` with sources + recommendation | ✅ |
| `plan` | Spec with numbered acceptance criteria + tier (suggested by the `hooks/scripts/graph.js` blast radius); approval stays curator-owned | ✅ |
| `build` | Test-first loop against a spec's ACs (works with the TDD/plan gates) | ✅ |
| `review` | AC verification + code review filed back (synthesis page, ADRs, instinct candidates — with a `ban:` pattern when the correction is one); works the instinct queue (`hooks/scripts/instincts.js`: rank, promote, prune); PR mode reads a live GitHub PR's diff + CI checks via `hooks/scripts/pr.js` (read-only — never posts back) | ✅ |
| `loop` | Bounded build / research / design loops (`hooks/scripts/loop.js`) that stop on the brain's own criteria — every AC ✅, a stable recommendation, no open P0 — with livelock, stall and tick-cap halts | ✅ |
| `terse` | Caveman-style output compression, **on by default** (hook #1 injects the rules); the skill toggles it off/on (code/commands never compressed) | ✅ |
| `compress` | Permanent instruction-file compression with before/after receipts | ✅ |
| `product-design` | First domain-expertise **pack** — 5-phase process + `data/` (methods, Nielsen heuristics, WCAG) + `templates/` + `checklist.md` (the `/brain:wrap` gate) + `bans.json` (UI anti-patterns flagged on write) | ✅ |
| `game` | Game pipeline — concept → GDD (`templates/gdd.md`) → prototype spec → build → playtest (ingested) → balance ADRs | ✅ |
| `doctor` | 19-check health monitor (`scripts/doctor.js`, injected) → writes `sessions/health.json`; hook #1 surfaces failures next session | ✅ |
| `digest` | Standup / weekly review (`hooks/scripts/digest.js`): blocked · done (log + git) · in flight, filed to `sessions/` | ✅ |
| `dump` | Classify a loose note and file each part (decision ADR, memory, workstream Next, ideas page, Clippings, instinct) | ✅ |
| `dashboard` | One-page offline HTML overview of the brain (`hooks/scripts/dashboard.js`, injected) → `sessions/dashboard.html` | ✅ |
| `home` | Cross-project dashboard (`hooks/scripts/home.js` + `registry.js`) — every `.brain/` this machine has opened, its health/open work, and combined token usage → `~/.claude/monkey-brain/home.html` | ✅ |
| `ci` | GitHub Actions workflow from the detected stack — Node, Python, Go, .NET, Rust (`hooks/scripts/ci.js`); never overwrites without asking | ✅ |
| `lock` | Team work lock (`hooks/scripts/lock.js`): a committed, expiring `LOCK.md` on a spec or the whole brain; teammates see it at session start and guards keep their writes out of its scope | ✅ |
| `learn` | Life pack: SM-2 spaced repetition (`scripts/srs.js`; only due cards enter context) + one new concept per session compiled into the wiki | ✅ |
| `career` | Life pack: case studies (assembled → drafted → publishable, hook-gated on `confidentiality: cleared`), CV variants, skill matrix, grounded mock interviews — all in the never-committed `private/` | ✅ |
| `usage` | Real token receipts from Claude Code's own transcripts (`hooks/scripts/usage.js`, injected): per day, model and branch, cache-hit ratio, subagent share | ✅ |

Conventions: SKILL.md < 150 lines (body stays in context); bundled scripts run
via `${CLAUDE_SKILL_DIR}` and are covered by `hooks/scripts/selftest.js`;
`schema/brain-template/` stays the canonical template master
(`new-brain.js --sync-template` refreshes the bundle; selftest fails on drift).

## Model routing

The policy is the one table in the instance manual §5 (`init/brain-template/CLAUDE.md`);
this section only records how the skills implement it. **No skill switches the main
thread** — prompt caches are per model, so a switch re-writes the whole context (~160k
tokens measured per switch); a skill that pins `model:` also sets `context: fork` and runs
as a subagent on a fresh context. Hook #7 `agent-track` requires an explicit `model` on
every main-model agent dispatch.

| Work class | Skills | Frontmatter | Why |
| --- | --- | --- | --- |
| **Judgment & synthesis** | `plan` · `review` · `loop` · `career` · `wrap` · `query` · `lint` · `compress` · `product-design` · `game` · `doctor` | `effort: high`, session model | plans, final review, reconciliation, compression, design — never downgraded |
| **Session work** | `research` · `ingest` · `dump` · `learn` · `init` · `ci` · `terse` · `lock` | `effort: medium` / `low`, session model | interactive or conversation-bound; a pin here would be a main-thread switch |
| **Forked routine** | `build` · `digest` · `usage` | `model: sonnet` · `context: fork` | test-first implementation and reports run in a Sonnet subagent |
| **Forked trivial** | `brief` · `dashboard` · `home` | `model: haiku` · `context: fork` | a script builds the pack or page; Haiku presents it |

**Parallel fan-out** (subagents in `../agents/`, run concurrently; only summaries
return): `research` fans out to **`brain-researcher`** (Sonnet, read-only) when a question
splits into more than two independent slices, and synthesizes on the session model; batch
`ingest` delegates to **`brain-librarian`** (Sonnet); a `build` fork is reviewed by
`review` on a different model family. See the Agents section in `../README.md`.

## Capability plugins (Phase 6)

The skills own the brain's *knowledge* workflows; **craft** (UI builds, security
audits, PR flows, PRDs…) is done by external **capability plugins**.
`init/recommended-plugins.json` is the authoritative set of nine: four (`auto_install: true` — `github`,
`frontend-design`, `superpowers`, `security-guidance`, which needs Python 3.10+) ship as
dependencies of the brain plugin; `/brain:init` offers the rest (`code-modernization`,
`product-tracking-skills`, `productivity`, `product-management`, `ui-ux-pro-max`). `init/scripts/plugins.js` renders the set
(✓ = ships with brain). The contract — **plugins do the craft; the brain records the knowledge** —
means every plugin output that is a decision, finding, or artifact is filed into a
named `.brain/` folder by the brain's skills and hooks (the manifest maps each
plugin to its target folder; the brain's `reference.md` §9 states the rule and the
precedence chain). Plugins auto-activate by their own descriptions; the
trigger-router only nudges the brain's own workflows.

## MCP servers (MCP capability registry, v0.25.0)

Same contract, extended to MCP servers: *MCP servers do the craft; the brain records the
knowledge.* `init/recommended-mcp-servers.json` is the curated set (Supabase, Firebase,
Figma, Framer, Vercel — Notion deferred, content-source-shaped rather than dev-infra-shaped).
`init/scripts/mcp-servers.js` renders it and marks which curated servers are already in the
project's `.mcp.json` (✓); any configured server outside the curated set still surfaces under
a generic fallback. Unlike plugins, the brain never installs a server or touches a credential —
it only hands over each entry's `setup_hint` for the curator to run themselves. No core hook
(`brain-status`/`guards`/`wiki-check`/`trigger-router`/`doctor`) is touched by this feature.

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

## Domain pipelines (Phase 7)

Both pipelines reuse the develop lifecycle exactly as instance manual §4 defines it, with a
domain-shaped front end; `reference.md` §10 documents them. The lifecycle enters at `research` by
default (the trigger-router sends development intent there); the curator says "skip research"
to enter at `plan`.

- **Product:** a PRD (`product-management` plugin → `raw-sources/` → ingest) in front of
  the §4 lifecycle, `product-tracking` plans in `projects/` behind it. No new skill.
- **Game:** `/brain:game` — concept → **GDD** (`templates/gdd.md`: MDA, core loop,
  progression, art direction) → prototype spec (`/brain:plan`, tiered) → build →
  **playtest** (each ingested as a raw source) → **balance** (each a `decisions/`
  ADR). Engine entity pages (godot / unity / web) live in `wiki/entities/`.
