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
is `monkey-brain`). Natural phrases ("ingest this", "wrap up", "doctor") are
the primary interface once the Phase 2 trigger-router hook lands.

## Layout & phase status

```
plugin/
├── .claude-plugin/plugin.json   # manifest (name: brain)          ✅ Phase 1
├── hooks/
│   ├── hooks.json               # registers #1 / #3 / #4              ✅ Phase 2 (tranche 1)
│   └── scripts/                 # Node runtime (stdlib-only): lib,
│                                #   brain-status, guards, wiki-check,
│                                #   selftest (23 checks)              ✅
├── skills/                      # /brain:* skills                  ⬜ Phase 3
├── agents/                      # brain-librarian, brain-researcher ⬜ Phase 3–5.5
└── .mcp.json                    # qmd semantic search              ⬜ Phase 5
```

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
  `.brain` fixture and drives every hook with synthetic events (23 checks).
