---
title: "Source — Enhancement Roadmap (Monkey Brain v2)"
type: source
status: active
tags: [roadmap, plugin-architecture, engine-history, phases, hooks, skills, activation]
created: 2026-09-16
updated: 2026-09-16
raw: "../../raw-sources/engine-roadmap.md"
origin: "ROADMAP.md (engine repo root)"
related: ["[[session-injection]]", "[[resume-system]]", "[[stop-nudges]]", "[[trigger-router]]", "[[recall-and-search]]", "[[model-routing]]", "[[plan-and-tdd-gates]]", "[[instincts-and-bans]]", "[[team-lock]]", "[[wiki-self-healing]]", "[[doctor-health-checks]]", "[[bounded-loops]]", "[[develop-lifecycle-stages]]", "[[claude-code]]", "[[github-plugin]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[engine-changelog]]", "[[engine-resume-history]]", "[[brain-health-audit]]"]
aliases: ["ROADMAP.md", "enhancement roadmap"]
---

# Source — Enhancement Roadmap (Monkey Brain v2)

> **Raw source:** [raw snapshot](../../raw-sources/engine-roadmap.md) · **Origin:** ROADMAP.md (engine repo root) · **Ingested:** 2026-09-16

## TL;DR
The engine's own step-by-step design log: six design principles, a five-layer activation
architecture, a "quality triangle" (context × tokens × output), and an append-only execution
tracker running Phases 1–9 (plugin skeleton → dogfood, v0.2.0→v0.12.1) then v3 (P10–P17,
v0.15.0→v0.22.0, closing seven gaps vs. a studied competitor vault) then three post-v3 features
up to v0.26.0. A gap-analysis table and a competitor scorecard justify every phase.

## Key takeaways
- **Phases 1–9** (2026-07-17→19, v0.2.0→v0.12.1, selftest 23→158): plugin skeleton (P1) →
  8/8 hooks (P2) → 11 skills incl. develop lifecycle (P3) → schema v2 record layers + tiers
  (P4) → memory/instincts/qmd-opt-in (P5) → model routing + 2 subagents (P5.5) → 9-plugin
  recommended manifest (P6) → first domain-expertise pack, product-design (P6.5) → product/game
  pipelines (P7) → `/brain:doctor` 15 checks (P8) → dogfood + PR merge to `main` (P9), fixing a
  real escaped-pipe wikilink bug (`[[page\|Label]]`) across lint/doctor/wiki-check.
- **v0.13.0–v0.14.0** (2026-09-13): terse output on by default (session injection carries the
  `## Rules` of `skills/terse/SKILL.md`); core capability plugins moved into `plugin.json`
  `dependencies` (this entry names **five**: github, frontend-design, superpowers,
  security-guidance, code-modernization — see ⚠️ below) + opt-in `bundles/brain-all`.
- **v3 "Closing the Gap" (P10–P17)**, re-benchmarked 2026-09-13 against a competitor vault,
  all shipped same-day on `v3-plugin-upgrade` → merged to `main`: P10 always-on BM25 recall
  (`brain_search`/`brain_brief`, no DB, v0.15.0) · P11 real receipts (transcript usage,
  cache-hit ratio, `SubagentStop` outcome ledger, 3-OS CI, v0.16.0) · P12 loops that stop
  (AC-terminated, livelock/stall/tick-cap halts, verifier ≠ generator family, v0.17.0) · P13
  blast-radius model/tier routing (`graph.js`, zero deps, v0.18.0) · P14 daily drivers
  (digest/dump/dashboard/ci, v0.19.0) · P15 learned bans (`ban:` patterns, confidence scores,
  v0.20.0) · P16 team mode (git-native lock, union-merged logs, v0.21.0) · P17 life packs
  (learn/career, private/, v0.22.0). Selftest 168 → 304.
- **Post-v3** (2026-09-13→15): Monkey Brain Home (v0.23.0, `~/.claude/monkey-brain/`
  cross-machine registry + `/brain:home`, selftest → 319) · MCP capability registry (v0.25.0,
  `recommended-mcp-servers.json` — supabase/firebase/figma/framer/vercel, detect-never-install,
  selftest → 344) · gh-based PR review (v0.26.0, read-only `pr.js` wraps `gh pr view/checks/diff`,
  never posts back, selftest → 350). **This is where the roadmap's tracker ends** — see ⚠️ below.
- **Six design principles**: enforcement over advice · budgeted injection instead of literal
  reads · cache-aware injection order (static first) · everything leaves a trace via hooks ·
  the plugin *is* the distribution (install once, instances travel with each project's git) ·
  differentiate not imitate (federated instances + upstream promotion vs. one shared workspace).
- **Activation architecture** — five layers, each catching what the last missed: (1) plugin
  present in every session, (2) SessionStart awareness, (3) three routers — deterministic
  trigger phrases, model-driven skill descriptions, path/context matchers, (4) enforcement
  gates fire regardless of routing, (5) depth on demand (packs/MCP deferred). Precedence:
  `deterministic trigger > domain pack > domain skill > craft plugin > general model`.
- **Quality triangle**: keeping context (budgeted injection, PreCompact snapshots, decision
  distillation), reducing tokens (deferred tools, `/brain:compress`, `/brain:terse`, model
  routing), best output quality (gates, packs, filed-back knowledge) — the compression guard
  never touches code/specs/ACs, only prose.
- **Gap analysis** (14 gaps, v1 → v2) and a **9-dimension competitor scorecard** (portability,
  knowledge, token economy, enforcement, capability breadth, auditability, model economics,
  activation, cross-project learning) frame every phase's justification.
- **Not copied** from the studied competitor: its fixed single-workspace design, the
  Python/Ollama/ChromaDB/LiteLLM stack, third-party model proxies, macOS-only notifications,
  and its code itself (unlicensed — ideas only).

## Concepts this touches
- [[session-injection]] — design principle 2/3 (budgeted status, cache-aware order) is this page's origin
- [[resume-system]] — hook #8 spec'd in Phase 2's table; P12 extends ticks into `resume.md`
- [[stop-nudges]] — hook #6 `wrap.js` spec'd in Phase 2; P5.2 auto-distillation nudge
- [[trigger-router]] — hook #2 spec'd in Phase 2; P10 adds `recall.js` alongside it
- [[recall-and-search]] — P10 (always-on BM25 recall) is this concept's full design rationale
- [[model-routing]] — Phase 5.5's routing policy table + P13 blast-radius scanner
- [[plan-and-tdd-gates]] — Phase 2 hook #3 `guards.js`; Phase 4 tiers; P15 adds `ban:` refusals
- [[instincts-and-bans]] — Phase 5.1 auto-detection; P15 learned bans design
- [[team-lock]] — P16 team mode (git-native lock, union-merged logs)
- [[wiki-self-healing]] — Phase 2 hook #4 `wiki-check.js`; the P9 escaped-pipe bugfix
- [[doctor-health-checks]] — Phase 8 (target 15 checks) → P14 adds check 19
- [[bounded-loops]] — P12's full design (stop predicates, livelock/stall/tick-cap)
- [[develop-lifecycle-stages]] — Phase 3's research→plan→build→review skills

## Contradictions / notes
> ⚠️ **Roadmap tracker is itself stale relative to the live engine.** The execution table ends
> at Post-v3 gh-based PR review, **v0.26.0** (2026-09-15, selftest 350). At the time of this
> snapshot (2026-09-16) the plugin was 0.31.0–0.32.0 — later work (e.g. `build: token-diet`
> 0.31.0, `review: brain-correctness` 0.30.0, `build: engine-knowledge` 0.32.0 per `git log`)
> postdates this source and isn't recorded here; treat those versions via [[engine-changelog]],
> not this page.
>
> ⚠️ **Dependency-count drift.** The v0.14.0 tracker row states `plugin.json` `dependencies` =
> **five** plugins — github, frontend-design, superpowers, security-guidance, **and
> code-modernization**. The live `plugin/.claude-plugin/plugin.json` lists only **four**
> (`github`, `frontend-design`, `superpowers`, `security-guidance`) — `code-modernization` is
> offered via `/brain:init`, not bundled. This matches [[engine-readme]]'s Quickstart wording
> but contradicts that same source's "Ship automatically" table and its "5 ship with it"
> feature bullet (see [[engine-readme]]'s own contradiction note). This roadmap entry was
> likely accurate the day it was written and never updated when the dependency set changed.
>
> Frontmatter on the raw file reads `type: schema`, `status: draft` — despite being the
> authoritative, mostly-complete build log; left as-is (raw-sources is immutable).

## Sources
Raw: [raw snapshot](../../raw-sources/engine-roadmap.md) (`raw-sources/engine-roadmap.md`,
snapshotted 2026-09-16 from `ROADMAP.md`). Cross-checked against
`plugin/.claude-plugin/plugin.json` (0.31.0–0.32.0 at the time of this snapshot,
2026-09-16), `plugin/hooks/hooks.json` (10 events / 11 scripts), and `plugin/skills/*/SKILL.md`
(25 skills) on disk 2026-09-16.
