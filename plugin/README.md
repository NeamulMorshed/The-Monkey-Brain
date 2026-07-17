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
│   ├── hooks.json               # registers all 8 hooks               ✅ Phase 2 complete
│   └── scripts/                 # Node runtime (stdlib-only): lib,
│                                #   #1 brain-status (+ no-brain offer),
│                                #   #2 trigger-router, #3 guards,
│                                #   #4 wiki-check, #5 snapshot,
│                                #   #6 wrap, #7 agent-track,
│                                #   #8 resume + resume-log,
│                                #   selftest (79 checks)              ✅
├── skills/                      # /brain:* skills                     🔶 Phase 3 (core 5 ✅)
│   ├── init/                    #   + bundled brain-template + scaffold script
│   ├── ingest/  query/  wrap/
│   └── lint/                    #   + mechanical lint.js (injected via !`…`)
├── agents/                      # brain-librarian, brain-researcher   ⬜ Phase 3–5.5
└── .mcp.json                    # qmd semantic search                 ⬜ Phase 5
```

### The 8 hooks (Phase 2, complete)

| # | Event | Script | Does |
| --- | --- | --- | --- |
| 1 | SessionStart | `brain-status` | budgeted ≤3k status block; `/brain:init` offer in brainless projects (`.no-brain` silences) |
| 2 | UserPromptSubmit | `trigger-router` | natural phrases → `/brain:*` routing hints (never blocks) |
| 3 | PreToolUse Write\|Edit | `guards` | secrets everywhere · raw-sources add-only · log append-only · plan gate |
| 4 | PostToolUse Write\|Edit | `wiki-check` | self-healing wiki: frontmatter/orphan block, TODO links advisory |
| 5 | PreCompact | `snapshot` | deterministic working-state snapshot → `.brain/sessions/` |
| 6 | Stop + SessionEnd | `wrap` | once-per-session unlogged-work stop gate; index stat self-heal |
| 7 | PreToolUse Agent | `agent-track` | dispatch log → `sessions/agents.md`; heavy spawns need an explicit model (once-per-session gate) |
| 8 | SessionStart + Task events | `resume` / `resume-log` | resume.md injection + ask-to-continue; auto task log |

### The core skills (Phase 3, first tranche)

`/brain:init` (self-contained scaffold — bundled template + Node script, works
from a marketplace install) · `/brain:ingest` (8-step compile) · `/brain:query`
(index-first + file-back) · `/brain:lint` (mechanical scan injected, reasoning
follows) · `/brain:wrap` (definition-of-done). Remaining Phase 3:
research / plan / build / review + terse / compress (after the Phase 4 schema).

### Planned agents (Phase 3–5.5)

| Agent | Model | Role |
| --- | --- | --- |
| `brain-librarian` | Sonnet | Batch-compile sources in isolated context; the main session sees only log entries |
| `brain-researcher` | Sonnet | Research fan-out over sources/codebase; summaries return for main-model synthesis |

`agents/` is created when the first definition lands — every `.md` inside it is
parsed as an agent (validated by `--strict`), so the folder holds no README.
Every dispatch declares its model explicitly; hook #7 (`agent-track`) logs it.

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
  events (79 checks).
- **Template bundling:** `schema/brain-template/` is the canonical master;
  `skills/init/brain-template/` is the copy that ships with installs. Selftest
  fails on drift — refresh with
  `node skills/init/scripts/new-brain.js --sync-template`.
- **Resume system (hook #8):** `resume.md` is the live work-in-progress
  pointer. `resume.js` injects it on fresh sessions (startup/clear) and asks
  whether to continue; `resume-log.js` appends task/session events to its
  `## Task log (auto)` automatically. The narrative sections belong to the
  model — `/brain:wrap` (Phase 3) rewrites them at session end.
