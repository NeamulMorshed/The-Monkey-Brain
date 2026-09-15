---
title: "Source — Root README (The Monkey Brain engine)"
type: source
status: active
tags: [readme, plugin-architecture, quickstart, skills, hooks, capability-plugins, mcp]
created: 2026-09-16
updated: 2026-09-16
raw: "../../raw-sources/engine-readme.md"
origin: "README.md (engine repo root)"
related: ["[[session-injection]]", "[[trigger-router]]", "[[plan-and-tdd-gates]]", "[[wiki-self-healing]]", "[[model-routing]]", "[[recall-and-search]]", "[[bounded-loops]]", "[[develop-lifecycle-stages]]", "[[doctor-health-checks]]", "[[claude-code]]", "[[github-plugin]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]"]
aliases: ["README.md", "root README"]
---

# Source — Root README (The Monkey Brain engine)

> **Raw source:** [raw snapshot](../../raw-sources/engine-readme.md) · **Origin:** README.md (engine repo root) · **Ingested:** 2026-09-16

## TL;DR
The engine's public front door: what it is (an LLM-wiki plugin per Karpathy's pattern, "you
curate, the engine maintains"), a two-command quickstart, the full feature list, architecture
diagrams (engine vs. instances, knowledge loop, development loop), a complete reference of all
25 skills / 10 hook events (11 scripts) / capability plugins / MCP servers, a six-step user
guide, requirements, and a pointer to the 66-page worked example brain.

## Key takeaways
- **Positioning:** "You curate (sources, questions, approval); the engine maintains
  (summarize, cross-reference, file, enforce)." Three pillars: **compound** (LLM wiki),
  **enforce** (hooks/gates over advice), **economize** (token discipline, model routing,
  deferred tools). One engine repo scaffolds many isolated `.brain/` instances — each commits
  with its own project, no cross-project knowledge bleed.
- **Quickstart:** `/plugin marketplace add NeamulMorshed/The-Monkey-Brain` then
  `/plugin install brain@monkey-brain` — that single install also installs+enables **four**
  capability plugins (github, frontend-design, superpowers, security-guidance — needs Python
  3.10+); `/brain:init` offers the rest, code-modernization included; `/plugin install
  brain-all@monkey-brain` is the opt-in everything-bundle. Then natural phrases ("start a brain
  here", "ingest this", "what do we know about X?", "lint the brain", "wrap up") route via the
  trigger hook, or call `/brain:*` skills directly.
- **Knowledge loop:** ingest (source → immutable `raw-sources/` → wiki page + 5–10 cross-links
  → index/log) · query (index-first, cites, novel answers filed to `syntheses/`) · lint
  (mechanical scan then reasoning over contradictions/staleness) · wrap (verify, index, log,
  commit). Development loop layers on top: research → plan (spec, numbered ACs + tier, curator
  approval) → build (test-first) → review (AC-by-AC, files ADRs + instincts).
- **Enforcement fires regardless of routing** — a table ties each hook moment to what it
  enforces: session start (budgeted status injection), any prompt (phrase routing), any write
  (secrets/immutability/append-only/plan-gate/TDD-gate), any wiki write (self-healing
  links/orphans), compaction/session end (snapshot, log, index refresh).
- **Five-layer activation** (install once → session awareness → three routers [deterministic
  phrases, model-driven descriptions, path/context matchers] → always-on gates → depth on
  demand) and a **model-routing table**: scripts (0 tokens, deterministic checks) → Haiku
  (triage) → Sonnet (routine execution, e.g. ingest/research reads/build) → main model /
  Opus-Fable (judgment: plans, reviews, reconciliation).
- **Full inventory as documented here:** **25 `/brain:*` skills** across Knowledge SDLC (init,
  ingest, query, brief, lint, wrap, doctor), Development lifecycle (research, plan, build,
  review, loop), Daily drivers (digest, dump, dashboard, home, ci, lock), Token discipline
  (terse, compress, usage), Domain work (product-design, game, learn, career) · **10 lifecycle
  hook events / 11 Node scripts** · **2 Sonnet subagents** (`brain-librarian`, `brain-researcher`)
  · **1 MCP** (`brain-search`: `brain_search`/`brain_brief`, hands off to qmd when opted in).
- **Structure** documented includes a machine-level `~/.claude/monkey-brain/` registry
  (`projects.json`, `home.html` for `/brain:home`) alongside the engine repo layout
  (`plugin/`, `bootstrap/`, `schema/`, `examples/`) and the per-project `.brain/` instance,
  which now includes `private/` (career pack), `learning/` (SM-2 decks) and `LOCK.md`
  (team-mode) beyond the original v2 layout.
- **Capability plugins / MCP servers:** "plugins do the craft; the brain records the
  knowledge," same contract extended to MCP servers (brain never installs/configures/touches
  credentials). Curated MCP set: Supabase, Firebase, Figma, Framer, Vercel — filed to
  `decisions/`/`wiki/entities/`/`projects/`; anything else connected still surfaces via a
  generic "no filing rules yet" note. Notion is explicitly deferred (content-source shaped,
  not dev-infra shaped).
- **Requirements:** Claude Code, Node.js ≥ 18 (the one hook runtime, no npm deps), Git;
  Obsidian optional (Dataview for dashboards, Marp for decks); PowerShell/bash only for the
  legacy `bootstrap/` scripts. Example brain: `examples/claude-code-brain/` — 15 sources / 66
  cross-linked, lint-clean pages.
- **Credits:** built on Karpathy's LLM Wiki pattern (lineage: Vannevar Bush's 1945 Memex);
  design sharpened against three studied projects — Caveman (token economy), an
  enforcement-focused Claude Code workspace (hard gates), and ui-ux-pro-max (domain-expertise
  packs).

## Concepts this touches
- [[session-injection]] — "budgeted session-start context injection (≤3k tokens)" feature bullet
- [[trigger-router]] — phrase-routing quickstart examples and the enforcement table's "you type a phrase" row
- [[plan-and-tdd-gates]] — the enforcement table's "any write" row (secrets/immutable/append-only/plan/TDD)
- [[wiki-self-healing]] — "self-healing wiki checks repair broken links/orphans in the same turn"
- [[model-routing]] — the model-routing table reproduced verbatim from the manual's §5
- [[recall-and-search]] — "always-on recall" feature bullet (`brain_search`, `/brain:brief`)
- [[bounded-loops]] — "loops that stop" feature bullet (`/brain:loop`)
- [[develop-lifecycle-stages]] — the development-loop section and the "build with it" table
- [[doctor-health-checks]] — "19 deterministic checks" health-monitoring bullet

## Contradictions / notes
> ⚠️ **Version badge is stale.** The badge at the top reads `Plugin v0.29.1`; at the time of
> this snapshot (2026-09-16) the plugin was 0.31.0–0.32.0 — the badge wasn't bumped through the
> last releases (`review: brain-correctness` 0.30.0, `build: token-diet` AC-1…9 0.31.0,
> `build: engine-knowledge` 0.32.0 per `git log`). Cosmetic but visible to anyone reading the
> repo front page.
>
> ⚠️ **Internal contradiction on the bundled-plugin count.** The Quickstart section says the
> install "installs and enables **four** capability plugins... github, frontend-design,
> superpowers, security-guidance... `/brain:init` offers the rest, **code-modernization
> included**" — this matches the live `plugin.json` `dependencies` array (4 entries, confirmed
> on disk). But the Features section's bullet claims "**5 ship with it**" and the **Capability
> plugins → "Ship automatically"** table lists **five** rows, wrongly including
> `code-modernization` alongside the real four. `code-modernization` should be in the
> "Offered, not forced" table (making that one 5 entries) — this looks like the doc not being
> updated in every place after the dependency set was finalized at four. Flag for
> [[code-modernization-plugin]] too: it is **offered**, not bundled.
>
> Cross-checked and **confirmed current** (not stale): "25 `/brain:*` skills" (25
> `plugin/skills/*/SKILL.md` dirs on disk), "10 lifecycle hook events (11 scripts)"
> (`plugin/hooks/hooks.json`: SessionStart/UserPromptSubmit/PreToolUse/PostToolUse/
> TaskCreated/TaskCompleted/Stop/SubagentStop/PreCompact/SessionEnd = 10 events, 11 unique
> scripts), and doctor's "19 checks."

## Sources
Raw: [raw snapshot](../../raw-sources/engine-readme.md) (`raw-sources/engine-readme.md`,
snapshotted 2026-09-16 from `README.md`). Cross-checked against
`plugin/.claude-plugin/plugin.json` (0.31.0–0.32.0 at the time of this snapshot, 2026-09-16),
`plugin/hooks/hooks.json`, and `plugin/skills/*/SKILL.md` on disk 2026-09-16; see
[[engine-roadmap]] for the design history behind these features.
