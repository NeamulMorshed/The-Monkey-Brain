---
title: "Spec — Token diet: model routing, context nudge, lighter manual and skill listing"
type: spec
status: done
tier: feature
phase: done
audit_score: "done — 0 open findings (0 P0, 3 P1, 9 P2 found in review; all fixed and pinned except one tracked in router-and-drift; selftest 501 green)"
plan_approved: false
tdd: true
scope: [plugin/skills/**, plugin/agents/**, plugin/hooks/scripts/recall.js, plugin/hooks/scripts/lib.js, plugin/hooks/scripts/agent-track.js, plugin/hooks/scripts/graph.js, plugin/hooks/scripts/selftest.js, plugin/.claude-plugin/**, .claude-plugin/**, schema/brain-template/**, plugin/README.md, README.md, plugin/CHANGELOG.md]
created: 2026-09-15
updated: 2026-09-15
related: [brain-health-audit, brain-correctness, engine-knowledge]
---

# Token diet — spec

## Problem
Tokens go where the brain does not look ([[brain-health-audit]], "Token & context economics" and "Model routing"). Every API call re-reads ~270k tokens of context, and the brain never says when a session has grown past the point where wrap + `/clear` would pay. Mid-session model switches caused 25 % of all cache writes (~163k tokens each), and ten skills pin a model on the main thread, so every invocation is such a switch — twice, since the model reverts next turn. The model policy lives in four places with four wordings and no Fable; research is pinned to Sonnet while its docs promise main-model synthesis. The fixed overhead the brain adds to every session — the 15.9 KB manual and 9.9 KB of skill descriptions — is ~6.6k tokens, a third of which is rarely needed. A dependency plugin loads into every brain whether it uses it or not.

## Goals / Non-goals
- Goal: one model-routing table, and a rule that model changes happen in a fork or subagent, never as a main-thread switch.
- Goal: the brain tells the curator when context has grown large enough that wrap + `/clear` saves tokens.
- Goal: a leaner always-loaded manual and skill listing, with nothing lost — moved sections stay one link away.
- Goal: dependencies are only what every brain needs.
- Non-goal: a `PreModelSwitch` hook — skill `model:` switches do not fire it, and its `ask` value is undocumented (Notes).
- Non-goal: link resolution, router fixes, doctor dependency health, engine knowledge ([[engine-knowledge]]).

## Acceptance criteria

**Model routing**
- **AC-1** ✅ `manual §5 holds the one model-routing table: haiku, sonnet, opus, fable, fork-not-switch, effort medium` · `agent-track, graph.js, skills README and /brain:usage cite manual §5` — Manual §5 holds the one model-routing table: work class → where it runs → model → effort, naming haiku, sonnet, opus and fable, with the rule "change model by forking or dispatching, never by a main-thread switch in a long session" and `effortLevel: medium` as the recommended default. `agent-track`'s block message, `graph.js`'s model suggestion, `skills/README.md` and `/brain:usage` cite "manual §5" instead of restating their own policy.
- **AC-2** ✅ `all 25 skills declare the expected model/context/effort routing` · `no skill switches the main thread: every model: pin comes with context: fork` — No skill switches the main thread: every SKILL.md with a `model:` line also has `context: fork`. Forked: `build` (sonnet, medium), `digest` and `usage` (sonnet, low), `brief`, `dashboard`, `home` (haiku, low). Pin dropped, session model inherited: `research`, `ingest`, `dump`, `init`, `learn`, `ci`, `terse`, `lock`. Judgment skills stay unpinned at `effort: high`.
- **AC-3** ✅ `/brain:research synthesizes on the session model, fans out only past two independent slices` — `/brain:research` synthesizes on the session model (its pin is gone, so the "main model" promise is true) and fans out `brain-researcher` (sonnet) only when the question splits into more than two independent slices; the lead does not re-read what a slice covers.

**Context management**
- **AC-4** ✅ five `context nudge:` checks (silent below 150k · the 160k line · sidechain ignored · once per band · env off + missing transcript) — `recall.js` reads the last main-thread assistant `usage` in `transcript_path` (input + cache-read + cache-write). At ≥ 150k tokens (`MONKEY_BRAIN_CONTEXT_NUDGE`, `0` disables) it injects one line — context size, "every call re-reads it", "at the next milestone `/brain:wrap`, then `/clear` — the resume file carries the state", "don't switch models mid-session" — once per 100k band per session. Below the threshold, or with no readable transcript, it adds nothing. Recall's own first-prompt behaviour is unchanged.

**Fixed overhead**
- **AC-5** ✅ `manual ≤ 10,000 bytes (now 9858), engine_version 2.1, pointing at reference.md` · `reference.md ships in the template…` · `/brain:init creates reference.md and --update refreshes it` · `--update keeps the brain's display name…` · `lint does not flag reference.md…` · `skills, hooks and the skills README cite reference.md…` · the three `reference.md §9/§10` contract checks — The brain template gains `reference.md` holding the moved material: §9 capability plugins & MCP contracts, §10 domain pipelines, the qmd setup steps, the team-mode paragraph, and the daily / life-pack command lists. The manual keeps one pointer line per moved section and is ≤ 10,000 bytes. `/brain:init` creates `reference.md`; `--update` refreshes it. `engine_version` becomes 2.1. Skills that cited manual §8–§10 cite `reference.md`.
- **AC-6** ✅ `skill descriptions ≤ 300 B each, no "Requires a .brain/", total ≤ 6,500 (now 5959)` — Every skill description is ≤ 300 bytes, none repeats "Requires a .brain/", and all 25 total ≤ 6,500 bytes.
- **AC-7** ✅ `always-loaded bytes 16550 ≤ 17,491` — Always-loaded bytes (manual + 25 skill descriptions + 2 agent descriptions) drop by ≥ 9,000 from the 0.29.1 baseline of 26,491.

**Dependencies**
- **AC-8** ✅ `4 bundled plugins: code-modernization offered, security-guidance stays and notes Python 3` · `READMEs, reference.md and the skills README state four bundled plugins` · the existing deps-vs-manifest check — `plugin.json` depends on `github`, `frontend-design`, `superpowers` and `security-guidance`; `code-modernization` (15 skills + 8 agents in every request's listing, used by few brains) is offered by `/brain:init` (`auto_install: false`). The manifest notes that security-guidance needs Python 3. READMEs, `reference.md` and the init skill state 4 bundled plugins.

**Cheaper instructions**
- **AC-9** ✅ `ingest cross-links every page the source genuinely informs — no "5–10+" quota` · `/brain:lint reasons over the flagged pages and the named scope only` · `/brain:wrap reuses a verification already run this session` — Ingest cross-links "every page the source genuinely informs" (skill, manual, librarian — no "5–10+" quota); `/brain:lint`'s reasoning pass covers flagged pages and the named scope, not the whole wiki; `/brain:wrap` reuses a verification already run this session after the last source change instead of re-running it.

**Release**
- **AC-10** ✅ reviewer re-ran: selftest 501 ALL GREEN · `--strict` ×2 · 0.31.0 · this brain at engine v2.1 with reference.md — selftest ALL GREEN; both manifests `--strict`; CHANGELOG and manifests `0.31.0`; this repo's brain refreshed with `new-brain.js --update` (manual v2.1 + `reference.md`). *(Build evidence: selftest ALL GREEN; both manifests `--strict`; 0.31.0 in both manifests and the CHANGELOG; `.brain/CLAUDE.md` engine_version 2.1 + `.brain/reference.md` present. Left for the reviewer to re-run.)*

## Test plan
Selftest, red first: AC-1 manual table + four citing surfaces; AC-2 the routing table in selftest rewritten + a rule check "model ⇒ context: fork"; AC-3 research SKILL text; AC-4 fixture transcripts at 90k / 160k / 260k and a missing path through `recall.js`, band marker per session; AC-5 manual size, pointer lines, `reference.md` in the template, init create + `--update` refresh, the §9/§10 contract checks moved to `reference.md`; AC-6 description sizes; AC-7 byte sum; AC-8 the existing deps-vs-manifest check plus a "4 bundled" text check; AC-9 three text checks; AC-10 the release run by the reviewer.

## Notes & links
- Research: [[brain-health-audit]] (model routing, token & context economics, levers 1–7).
- Tier: `graph.js radius` → "touches 9 file(s) across 5 module(s) · 1 file type(s) · score 45 · suggested tier: feature". The graph counts JS imports only; most of this change is Markdown, and no new code file is planned.
- Approval: feature tier, verbal suffices (manual §5); the curator said "do all of these one by one, on your own" after the audit recommended this spec. `plan_approved` stays false as the manual requires for this tier.
- Dropped from the audit: a `PreModelSwitch` hook. Per the hooks reference, a skill's `model:` frontmatter does not fire it, and only the `deny` decision is documented; blocking a curator's own `/model` is not the brain's call. The fork rule (AC-2) plus the context nudge (AC-4) cover the cost.
- AC-8 revised before build (2026-09-15): the curator installed Python ("I have installed python"), so `security-guidance` — the security net the manual's P0 gate relies on — stays a bundled dependency; only `code-modernization` is demoted. The audit had proposed demoting both.
- The context nudge lives in `recall.js` (already a per-prompt hook) rather than a new script: no new hook process per prompt, and no new file for the TDD gate.
- **Build (2026-09-15):** 21 checks red first, then green; selftest 463 → 485 ALL GREEN (one more pinned in-build, below — written alongside its fix, so it never ran red first). Always-loaded bytes 26,491 → 16,550. ADR [[fork-not-switch-model-routing]].
- **Review (2026-09-16):** [[token-diet-review]] — 0 P0, 3 P1, 9 P2. **AC-2 amended in review:** only `build` forks; `brief`, `digest`, `usage`, `dashboard` and `home` run unpinned (a fork adds a subagent bootstrap and cannot see the conversation, for no gain when a `!` script does the work). selftest 485 → 501.
- **Build deviations:** (1) the build ran on the main model without re-invoking `/brain:build`, whose `model: sonnet` pin (pre-AC-2) would have been exactly the mid-session switch this spec removes. (2) Running `new-brain.js --update` on this repo renamed the brain to its folder name — `--update` ignored the existing `project:` name. Fixed and pinned (`--update keeps the brain's display name…`). (3) `lint.js` also whitelists `LOCK.md` at the brain root (the team lock lives there). (4) Doc accuracy beyond the ACs: plugin README hook rows 2/7/8 and the install paragraph.
