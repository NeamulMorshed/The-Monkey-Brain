# The Monkey Brain — plugin (`brain@monkey-brain`)

The plugin distribution of the Monkey Brain engine (ROADMAP Phase 1+). Install
once at user scope; every project gets the brain automatically, while each
project's knowledge stays isolated in its own `.brain/` instance committed with
that project's repo.

## Install

```
/plugin marketplace add NeamulMorshed/The-Monkey-Brain
/plugin install brain@monkey-brain
```

Skill commands are namespaced `/brain:*` (plugin name `brain`; the marketplace
is `monkey-brain`). Natural phrases ("ingest this", "wrap up", "lint the
brain") are the primary interface — the trigger-router hook maps them to the
skills deterministically.

## Layout & phase status

```
plugin/
├── .claude-plugin/plugin.json   # manifest (name: brain)              ✅ Phase 1
├── hooks/
│   ├── hooks.json               # registers 8 hook events             ✅ Phase 2+5
│   └── scripts/                 # Node runtime (stdlib-only): lib,
│                                #   #1 brain-status (+ decisions +
│                                #     injection receipts), #2 trigger-
│                                #     router, #3 guards, #4 wiki-check
│                                #     + instinct-track, #5 snapshot,
│                                #   #6 wrap (+ decision nudge + qmd
│                                #     re-index), #7 agent-track,
│                                #   #8 resume+resume-log; qmd-mcp;
│                                #   selftest (120 checks)             ✅
├── skills/                      # /brain:* skills                     ✅ Phase 3 complete
│   ├── init/                    #   + bundled brain-template + scaffold script
│   ├── ingest/  query/  wrap/
│   ├── lint/                    #   + mechanical lint.js (injected via !`…`)
│   ├── research/  plan/  build/  review/    # develop lifecycle (v2 schema)
│   └── terse/  compress/        #   token discipline (Caveman-inspired)
├── agents/                      # brain-librarian, brain-researcher   ✅ Phase 5.5
└── .mcp.json                    # brain-search (opt-in qmd)           ✅ Phase 5
```

### The hooks (Phase 2 + Phase 5)

| # | Event | Script | Does |
| --- | --- | --- | --- |
| 1 | SessionStart | `brain-status` | budgeted ≤3k status block (index, specs, projects, instincts, **decisions**, semantic-search state); `/brain:init` offer in brainless projects; writes an **injection-size receipt** to `sessions/injection-stats.json` |
| 2 | UserPromptSubmit | `trigger-router` | natural phrases → `/brain:*` routing hints (never blocks) |
| 3 | PreToolUse Write\|Edit | `guards` | secrets everywhere · raw-sources add-only · log append-only · plan gate (architecture tier) · TDD gate (feature+ tiers, new code files need a test) |
| 4 | PostToolUse Write\|Edit | `wiki-check` + `instinct-track` | self-healing wiki (frontmatter/orphan block, TODO advisory); **instinct advisory** when a file is revised across 3+ sessions |
| 5 | PreCompact | `snapshot` | working-state snapshot (next steps, **active specs/projects**, log heads) → `.brain/sessions/` |
| 6 | Stop + SessionEnd | `wrap` | once-per-session unlogged-work stop gate + **decision-distillation nudge**; index stat self-heal; **`qmd update` re-index** when opted in |
| 7 | PreToolUse Agent | `agent-track` | dispatch log → `sessions/agents.md`; heavy spawns need an explicit model (once-per-session gate) |
| 8 | SessionStart + Task events | `resume` / `resume-log` | resume.md injection + ask-to-continue; auto task log |

Plus **`qmd-mcp`** — the opt-in `brain-search` MCP server registered in `.mcp.json`,
dormant unless the brain enables qmd (`.qmd` marker / `MONKEY_BRAIN_QMD=1` + qmd on PATH).

### The skills (Phase 3, complete)

**Knowledge SDLC:** `/brain:init` (self-contained scaffold — bundled template +
Node script, works from a marketplace install) · `/brain:ingest` (8-step
compile) · `/brain:query` (index-first + file-back) · `/brain:lint` (mechanical
scan injected, reasoning follows) · `/brain:wrap` (definition-of-done).
**Develop lifecycle:** `/brain:research` (filed to `wiki/research/`) ·
`/brain:plan` (numbered ACs + tier, curator-owned approval) · `/brain:build`
(test-first against the ACs) · `/brain:review` (verification + findings filed
back, feeding `decisions/` and `instincts/`). **Token discipline:**
`/brain:terse` (session output compression) · `/brain:compress` (permanent
instruction-file compression with receipts).

### Agents (Phase 5.5)

Sonnet fan-out workers the skills delegate to — routine and parallel work runs in
isolated context windows while the main model keeps the conversation and does the
judgment. Each pins its own `model:`, so hook #7 lets it through (still logging the
dispatch to `sessions/agents.md`).

| Agent | Model | Role |
| --- | --- | --- |
| `brain-librarian` | Sonnet | Batch-compile sources in isolated context (8-step ingest); the main session sees only log entries |
| `brain-researcher` | Sonnet | Read-only research fan-out over wiki/codebase/web; cited summaries return for main-model synthesis |

**Fan-out patterns:** research fan-out (N `brain-researcher` in parallel →
main-model synthesis) · batch ingest (one `brain-librarian` per source) ·
build+review pair (Sonnet implementer vs main-model auditor) · competing
hypotheses (two models, main adjudicates). Spawn concurrently by dispatching in
one message; the routing table lives in `skills/README.md`.

Every `.md` in `agents/` is parsed as an agent (validated by `--strict`), so the
folder holds **no README** — this section is its documentation.

The repo root's `.claude-plugin/marketplace.json` makes this repository its own
marketplace. `bootstrap/` stays the scaffolding engine — `/brain:init` (Phase 3)
wraps it.

## Requirements

- Claude Code (hooks, skills, plugins).
- **Node.js >= 18** for hook scripts — one runtime on Windows/macOS/Linux, no
  npm dependencies (`node hooks/scripts/lib.js` runs a self-test).

## Development

- Hook scripts live in `hooks/scripts/`, share `lib.js`, and are referenced
  from `hooks/hooks.json` as `node "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/<x>.js"`.
- Hooks must **degrade gracefully** when `.brain/` (or a Phase 4 folder like
  `specs/`) doesn't exist — `lib.findBrainDir()` returning `null` means do
  nothing, never error.
- Validate before committing: `claude plugin validate ./plugin --strict` and
  `claude plugin validate . --strict` (marketplace).
- Test before committing: `node hooks/scripts/selftest.js` — builds a temp
  `.brain` fixture and drives every hook and skill script with synthetic
  events (120 checks), and checks skill routing frontmatter + agent definitions.
- **Template bundling:** `schema/brain-template/` is the canonical master;
  `skills/init/brain-template/` is the copy that ships with installs. Selftest
  fails on drift — refresh with
  `node skills/init/scripts/new-brain.js --sync-template`.
- **Resume system (hook #8):** `resume.md` is the live work-in-progress
  pointer. `resume.js` injects it on fresh sessions (startup/clear) and asks
  whether to continue; `resume-log.js` appends task/session events to its
  `## Task log (auto)` automatically. The narrative sections belong to the
  model — `/brain:wrap` (Phase 3) rewrites them at session end.
