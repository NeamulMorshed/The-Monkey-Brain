# 🐵 The Monkey Brain

A reusable **knowledge engine** you drop into any product or project. Each project gets its own
isolated, compounding wiki — its own topics, context, and memories — maintained by an LLM
(Claude Code) instead of by you.

Built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):
instead of re-retrieving from raw documents on every question (RAG), the LLM **incrementally
builds and maintains a persistent, interlinked markdown wiki**. Knowledge is compiled once and
kept current — cross-references, contradiction flags, and synthesis already exist before you ask.

> **You curate** (sources, questions, direction). **The LLM maintains** (summarizing,
> cross-referencing, filing, linting). **Obsidian is the IDE; the wiki is the codebase.**

---

## Engine vs. instances

This repo is **the engine** — the reusable tool. It does not hold your project knowledge.
Each project gets an **instance**: a `.brain/` folder scaffolded into that project, holding its
own sources, wiki, and memories, fully isolated from every other project.

```
The-Monkey-Brain/               ← THE ENGINE (this repo)
├── README.md                   ← you are here
├── bootstrap/
│   ├── new-brain.ps1 / .sh     ← scaffold (or refresh) a .brain in a project
│   └── lint-brain.ps1          ← health-check any brain (broken links, orphans)
├── schema/
│   ├── CLAUDE.md               ← canonical operating manual (the method)
│   ├── templates/              ← page skeletons (source/concept/entity/synthesis)
│   └── brain-template/         ← exactly what gets copied into a new .brain
└── examples/
    └── claude-code-brain/      ← a complete worked brain (60 pages) to learn from

<your-project>/.brain/          ← AN INSTANCE (created by the script; committed with the project)
├── CLAUDE.md                   ← loads when you run `claude` at the project root
├── raw-sources/                ← immutable inputs
├── wiki/ {index,log,dashboard, sources,concepts,entities,syntheses}
└── memory/                     ← durable project facts/decisions
```

Knowledge never mixes between projects. Improvements to the **method** are made once here and
pulled into instances with `-Update` (which never touches accumulated knowledge).

---

## Quickstart

### 1. Start a brain in a project
```powershell
# Windows / PowerShell
.\bootstrap\new-brain.ps1 -Project "C:\code\myproduct" -Name "MyProduct"
```
```bash
# macOS / Linux
./bootstrap/new-brain.sh /code/myproduct "MyProduct"
```
This creates `myproduct/.brain/` — an empty, project-named brain.

### 2. Use it
```powershell
cd C:\code\myproduct
claude            # .brain\CLAUDE.md loads as the operating manual
```
- Drop a doc/article/spec into `.brain\raw-sources\` (or paste it in chat) → say **"ingest this"**.
- Ask questions → answers cite the wiki; good answers get **filed back** as new pages.
- Say **"lint the brain"** periodically to catch contradictions, orphans, and stale claims.

Open `.brain\` as an Obsidian vault to browse the graph, dashboard, and links.

### 3. Maintain the method
```powershell
.\bootstrap\new-brain.ps1 -Project "C:\code\myproduct" -Update   # refresh schema only
.\bootstrap\lint-brain.ps1 -Brain "C:\code\myproduct\.brain"      # health-check
```

---

## Design decisions

| Decision | Choice |
| --- | --- |
| Distribution | **Bootstrap script** — engine is the master; instances scaffolded from templates. |
| Location | **`.brain/` inside the project**, committed with the project's repo. |
| Driver | **Claude Code opened per project** — the instance's `CLAUDE.md` auto-loads. |
| Isolation | Each `.brain/` is a separate graph/log/memory. No cross-project bleed. |
| Example | The Claude Code knowledge brain (60 pages) is bundled under `examples/`. |

### Loading caveat
Claude Code reads `CLAUDE.md` from the working directory **up to the repo root**, so launching
`claude` at the project root loads `.brain/CLAUDE.md` only if `.brain` is on that path. If your
brain's manual doesn't load (check with `/memory`), either launch `claude` from inside `.brain\`,
or add a one-line root `CLAUDE.md` containing `@.brain/CLAUDE.md` so it always imports.

---

## What a finished brain looks like

See [`examples/claude-code-brain/`](examples/claude-code-brain/) — a real brain that compiled 12
sources into 60 cross-linked, lint-clean pages (0 broken links, 0 orphans), complete with a
Mermaid index map, a Dataview dashboard, and a Marp overview deck. Start at its
[`wiki/index.md`](examples/claude-code-brain/wiki/index.md).

---

## Requirements
- **Claude Code** (drives ingest/query/lint).
- **Obsidian** (optional, to browse) with **Dataview** (dashboards) and optionally **Marp** (decks).
- **PowerShell** (Windows) or **bash** (macOS/Linux) for the bootstrap/lint scripts.
- **Git** to version each project's `.brain/` alongside its code.
