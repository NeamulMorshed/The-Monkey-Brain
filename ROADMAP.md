---
title: "Enhancement Roadmap — Monkey Brain v2"
type: schema
status: draft
tags: [roadmap, plugin, hooks, skills, mcp, context-engineering]
created: 2026-07-17
updated: 2026-07-18
version: 0.3
---

# 🐵 Monkey Brain v2 — Enhancement Roadmap

Step-by-step guide to evolve the Monkey Brain from a **method + bootstrap script** into a
**self-enforcing, token-disciplined, full-lifecycle knowledge engine** that works automatically
in any project or product — development, products, and games.

**References studied:**
- [Caveman](https://github.com/juliusbrussee/caveman) — token discipline: ~65% output
  compression, `/caveman-compress` cuts memory-file input tokens ~46% *permanently*,
  cache-aware design, stats receipts.
- [MewVault](https://github.com/mewking2099/MewVault) — the quality bar: *enforcement over
  advice*. 7 lifecycle hooks, hard quality gates (plan-before-code, TDD, secrets,
  immutability), spec-driven workflow, project tiers, semantic memory (SQLite-vec MCP),
  instinct system, 15-check doctor, 3k-token budgeted session injection.
- [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — the **domain
  expertise pack** pattern: searchable design knowledge (161 industry reasoning rules, 84 UI
  styles, 192 palettes, 74 font pairings, 98 UX guidelines, anti-pattern lists) + BM25 search
  script + reasoning layer, auto-activating on UI/UX requests. Architecturally a mini Monkey
  Brain (data + search + filed recommendations), pre-compiled for one domain — validates our
  engine and defines the pack format we generalize in Phase 6.5.
- Our own wiki: `claude-md-vs-skills-vs-hooks`, `hooks`, `skill-authoring`, `plugins`,
  `mcp-tool-search`, `search-tooling` (qmd upgrade path), `schema/CLAUDE.md` §8.

**North star:** MewVault enforces quality; Caveman enforces economy; the LLM wiki compounds
knowledge. Monkey Brain v2 does all three in one plugin, portable to any project.

---

## Execution status (tracker — update per commit; any session can resume from here)

| Step | Status | Notes |
| --- | --- | --- |
| **P9.2** Research ingests: Caveman, MewVault, ui-ux-pro-max → example brain; filed `monkey-brain-vs-mewvault` synthesis + `domain-expertise-packs` concept | ✅ 2026-07-17 | 4 commits (`ingest:` ×3, `query:` ×1); vault 16 sources / 69 pages |
| **P1** Plugin skeleton: `plugin/` (plugin.json, hooks.json, skills/, agents/, .mcp.json), root `marketplace.json`, Node hook runtime | ✅ 2026-07-17 | plugin named **`brain`** (→ `/brain:*` commands), displayName "The Monkey Brain", marketplace **`monkey-brain`** → install `brain@monkey-brain`; both manifests pass `claude plugin validate --strict`; MIT licensed; Node.js 24.18.0 LTS installed 2026-07-17 |
| **P2** Hooks — #1 brain-status, #3 guards, #4 wiki-check, #8 resume; then #2 trigger-router, #6 wrap, #5 snapshot, #7 agent-track | ✅ 2026-07-17 | **Complete, 8/8.** #1/#3/#4/#8 v0.3.0; #2/#5/#6/#7 v0.4.0 — trigger routing (phrases → skills), pre-compact snapshots → `sessions/`, once-per-session unlogged-work stop gate + SessionEnd index-stat self-heal, agent dispatch log + explicit-model gate. #1 grew the no-brain `/brain:init` offer (`.no-brain` silences). Selftest **79/79 GREEN** |
| **P3** Skills — init/ingest/query/lint/wrap → research/plan/build/review → terse/compress | ✅ 2026-07-17 | **Complete, 11 skills.** Core 5 (v0.4.0): `/brain:{init,ingest,query,lint,wrap}` — `init` self-contained (bundled template + Node `new-brain.js`; `--sync-template` guard), `lint` injects `scripts/lint.js` via `` !`…` ``. Develop lifecycle (v0.6.0): `/brain:{research,plan,build,review}` — research filed with sources; specs with AC-n + tier, **approval curator-owned**; build test-first with the gates; review files back (synthesis + ADRs + `instincts/pending/` — Gap #9 loop live). Token discipline (v0.6.0): `/brain:terse` (compression guard), `/brain:compress` (permanent, with receipts). Router phrases for all. Selftest **95/95 GREEN** |
| **P4** Schema v2 template: specs/ projects/ sessions/ decisions/ instincts/ + tiers; `-Update` migration | ✅ 2026-07-17 | v0.5.0 — record layers `specs/ projects/ sessions/ decisions/ instincts/{pending,active} wiki/research/` + templates (spec w/ AC-n·tier·`plan_approved`·`tdd`, decision/ADR, project-status, instinct, research); log prefixes `session\|research\|plan\|build\|review`; **tier gates live**: plan (architecture) + new **TDD gate** (feature+, new code files need a test companion; `tdd: false` opts out); both update paths (`-Update`/`--update`) migrate v1→v2 structure, never touching knowledge; CLAUDE.md ×2 → **v2.0** (section numbers stable); brain-status shows active projects. Selftest **88/88 GREEN** |
| **P5** Memory & context engineering: instinct auto-detection, decision auto-distillation, opt-in qmd semantic search, compaction survival, budget receipts | ✅ 2026-07-17 | v0.7.0 — `instinct-track.js` (3+-session edits → `instincts/pending/` advisory); `wrap.js` Stop distillation nudge + `brain-status` "Decisions (the why)" surfacing + `/brain:wrap` step; `qmd-mcp.js` `brain-search` MCP in `.mcp.json` — **dormant/opt-in** (`.qmd` marker or `MONKEY_BRAIN_QMD=1` + qmd on PATH), stdlib no-op server otherwise, SessionEnd `qmd update` re-index, §8 documented; `snapshot.js` now carries active specs/projects; `brain-status` writes `sessions/injection-stats.json` receipts. Selftest **115/115**, validates `--strict` |
| **P5.5** model routing & parallel fan-out | ✅ 2026-07-17 | v0.8.0 — `model:`/`effort:` on all 11 skills (judgment→main model+high effort; routine `ingest`/`research`/`build`→sonnet; `init` sonnet/low; `terse` haiku/low); `agents/brain-librarian.md` + `agents/brain-researcher.md` (both `model: sonnet`, hook #7 passes+logs them); fan-out patterns (research fan-out · batch ingest · build+review pair · competing hypotheses) documented in the skills + READMEs. Selftest **120/120**, validates `--strict` |
| **P6** Bundled-plugin manifest: `skills/init/recommended-plugins.json` (9 capability plugins) + `plugins.js` renderer + `/brain:init` offer step + instance-manual §9 recording contract | ✅ 2026-07-18 | v0.9.0 — "plugins do the craft; the brain records the knowledge": each plugin mapped to the `.brain/` folder its output files into; model-driven `/plugin` install (never silent), skipped on `--update`; §9 states the precedence chain; selftest **127/127**, validates `--strict` |
| **P6.5** product-design pack: first domain-expertise pack (`skills/product-design/` — 5-phase process + `data/` + `templates/` + `checklist.md` gate) | ✅ 2026-07-18 | v0.10.0 — pack format `SKILL.md`+`data/`+`templates/`+`checklist.md`; data cites Nielsen's 10 + WCAG 2.2 AA; `pack:` field on project-status → `/brain:wrap` runs the checklist, open **P0s block done** (like security); router routes design-process phrases; selftest **137/137**, validates `--strict` |
| **P7** Product & game pipelines: `/brain:game` (concept→GDD→prototype→build→playtest→balance) + `gdd.md` template + product-pipeline codified + instance-manual §10 | ✅ 2026-07-18 | v0.11.0 — both pipelines reuse research→plan→build→wrap; game adds the GDD (`type: gdd`, MDA/core-loop), playtests **ingested as sources**, balance as **ADRs**, engine entity pages; product pipeline is the lifecycle + product plugins (no new skill); router routes game phrases; selftest **144/144**, validates `--strict` |
| **P8** `/brain:doctor` (15 checks) + health-report surfacing | ✅ 2026-07-18 | v0.12.0 — `doctor.js` runs 15 deterministic checks (links · orphans · stale · index · clippings · log gaps · uncommitted · hooks · injection budget · semantic index · WIP · instinct queue · specs-without-tests · **open P0s** · schema version) + model-mix; injected via `` !`…` ``; writes `sessions/health.json` → **hook #1 surfaces failures next session**; criticals gate wrap; router routes doctor phrases; selftest **156/156**, validates `--strict` |
| **P9** Dogfood on scratch project → docs v2.0 → lint example brain → PR to `main` | 🔄 2026-07-18 | Dogfood ✅ (fresh scaffold lint-clean + doctor-clean 13/13; **7/7 enforcement gates fire** — plan · TDD · docs-exempt · secrets · immutability · append-only). Dogfooding **found + fixed a real parser bug**: `[[page\|label]]` links in markdown tables (escaped pipe) were false-positive "broken" in lint/doctor/wiki-check — fixed in all three, example brain now **lint-clean**. Root README + `schema/CLAUDE.md` v2.0 pass ✅. Selftest **158/158**. PR to `main`: pending curator |

### Session log (engine work, newest first — instances get `sessions/` in P4)

**[2026-07-18] Session 4 — Phases 6 + 6.5 + 7 + 8 + 9 (v0.9.0 → v0.12.0)**

*Phase 9 — dogfood + docs v2.0 (PR to main pending curator):*
- **Dogfooded the whole engine on a fresh scratch brain:** `new-brain.js` scaffold → the brain
  is **lint-clean and doctor-clean** (13/13 ok, schema matches engine); then drove `guards.js`
  through the develop lifecycle — **all 7 gates fire** (secrets · plan gate blocks unapproved
  architecture source · docs exempt · TDD gate blocks a testless source file · a test companion
  opens it · raw-sources immutable · log append-only).
- **Dogfooding found a real bug:** wikilinks inside markdown tables escape the pipe
  (`[[page\|Label]]`), and the link parser split on `|` only — leaving a dangling `\` so the
  target read as `page\` and was wrongly reported **broken**. This false-positived 16 links in
  the 69-page example brain. Fixed the target extraction (`split(/\\?\|/)`) in **all three**
  parsers — `lint.js`, `doctor.js`, `wiki-check.js`; added regression cases. The example brain
  now lints **CLEAN** (0 broken, 0 orphans) under `--strict`.
- **Docs v2.0 pass:** root README gains a prominent **"The plugin (v2)"** section (install + the
  14 skills / 10 hooks / packs / doctor), Node ≥ 18 requirement, and a refreshed layout line;
  `schema/CLAUDE.md` notes the plugin distribution and bumps its date.
- **Verified:** selftest 156 → **158 checks ALL GREEN** (escaped-pipe ×2); both manifests
  validate `--strict`. Branch `monkey-brain-enhancement` ready for the PR to `main`.

*Phase 8 — `/brain:doctor` health monitor (v0.12.0):*
- **`doctor.js`** runs **15 deterministic checks** (MewVault parity), zero model tokens,
  injected into the skill via `` !`…` `` like `lint.js`: broken links · orphans ·
  stale/contradiction flags · index freshness · Clippings backlog · log gaps (session activity
  newer than the log) · uncommitted `.brain/` · hook registration · injection size vs budget
  (from `injection-stats.json`) · semantic-index freshness · WIP limits (≤3 active, none idle
  21+ days) · instinct-queue overflow · specs without a test plan · **open P0 findings** ·
  schema version vs engine — plus a **model-mix** line from `sessions/agents.md`. Levels
  ok/info/warn/crit; **criticals gate `/brain:wrap`**.
- **Health carries to the next session:** `doctor.js` writes `sessions/health.json`; **hook #1
  `brain-status`** reads it and injects a compact `🩺 Health` line (counts · top findings ·
  staleness) whenever the last run had open warnings/criticals — the "failures inject a health
  report into the next session" design, at zero standing cost.
- **Routing:** `effort: high`; the trigger-router now sends "brain doctor / brain health / is
  the brain healthy / health-check the brain" → `/brain:doctor`, and keeps "lint the brain" →
  `/brain:lint` (the two were previously conflated). `--strict` (CI) exits nonzero on any
  warn/crit; `--json` emits the report. Smoke-tested on the 69-page example brain.
- **Verified:** selftest 144 → **156 checks ALL GREEN** (doctor ×10, router ×2); both manifests
  validate `--strict`.

*Phase 7 — product & game pipelines (v0.11.0):*
- **`/brain:game`** runs the game pipeline: concept → **GDD** → prototype spec → build →
  **playtest** → **balance**. The GDD (new `templates/gdd.md`, `type: gdd` — MDA, core loop,
  progression, art direction, engine entity links) captures the concept; its open questions
  become the prototype spec's ACs (`/brain:plan`, tiered); each playtest is **ingested as a raw
  source** so observations are searchable; each balance decision is a `decisions/` ADR.
  `effort: high`, main model (design judgment).
- **The product pipeline** (idea → PRD → spec → build → track → wrap) needs no new skill — the
  standard lifecycle composed with the `product-management` / `product-tracking` plugins. Both
  pipelines are documented in the instance manual's new **§10 "Domain pipelines"** (master +
  bundle re-synced); the shared spine is research→plan (filed research, numbered ACs, approval
  gates). Router routes game phrases (start/design a game, GDD, core loop, playtest, balance).
- **Verified:** selftest 137 → **144 checks ALL GREEN** (game skill ×3, GDD ×1, §10 ×1, router
  ×2); both manifests validate `--strict`.

*Phase 6.5 — product-design pack (v0.10.0), the first domain-expertise pack:*
- **`skills/product-design/`** runs a five-phase industry process (discovery → definition →
  ideation → design → validation), each phase filing to the right `.brain/` folder and handing
  the visual build to `ui-ux-pro-max` + `frontend-design` with the brain's context injected.
  `effort: high`, main model (design reasoning is judgment).
- **Pack format** = `SKILL.md` + `data/` + `templates/` + `checklist.md` — the reusable shape
  for later packs. `data/` carries real standards (Nielsen's 10 heuristics with severities;
  WCAG 2.2 AA under POUR; a methods catalog — JTBD, Crazy 8s, SCAMPER, Double Diamond,
  dot-voting). `templates/` = persona · journey-map · hmw (problem statement + How-Might-We) ·
  usability-test-script.
- **The validation gate:** new `pack:` field on the project-status template (master + bundle,
  re-synced); `/brain:wrap` step 1 opens the active pack's `checklist.md` and **blocks "done"
  on open P0s** (Nielsen catastrophes, Level-A a11y failures on core tasks, structural design
  decisions with no ADR) — the MewVault-style audit gate, generalized. Router routes
  "design a product / create personas / user journey / how-might-we / usability test /
  accessibility audit" → the pack.
- Docs: `skills/README.md` + `plugin/README.md` gain a Domain-expertise-packs section;
  CHANGELOG 0.10.0. Caught + fixed a YAML footgun (a `: ` in the description broke strict
  validation) — `claude plugin validate --strict` stays the frontmatter authority.
- **Verified:** selftest 127 → **137 checks ALL GREEN** (pack structure ×7, router ×2, routing
  map now 12 skills); both manifests validate `--strict`.

*Phase 6 — bundled-plugin manifest (v0.9.0):*
- **The manifest** (`skills/init/recommended-plugins.json`): the nine capability
  plugins from the roadmap's Phase 6 table, each carrying `category`, `fires_on`, a
  `brain_integration` note, and a structured `records[]` mapping every output to the
  `.brain/` folder it's **filed back into** (e.g. ui-ux-pro-max design choices →
  `decisions/`, its anti-patterns → `instincts/pending/`; security-guidance P0s gate
  `/brain:wrap`; PRDs → `raw-sources/` → ingested). Top-level `contract` states the rule.
- **`scripts/plugins.js`** — the deterministic renderer (default table · `--verbose`
  integration notes · `--json` for the P8 doctor), mirroring the lint.js split: the script
  does the mechanics, the skill decides which subset to offer.
- **`/brain:init` step 6** offers the set — lists them, recommends only what fits the
  project, installs **model-driven** via `/plugin` after confirming the current command with
  the curator (marketplace names evolve), never silently; skipped on `--update`.
- **Instance manual §9 "Capability plugins (the craft layer)"** (schema master edited then
  `--sync-template`'d to the bundle — byte-identical) states the contract + per-plugin filing
  map + precedence chain (deterministic trigger > domain pack > domain skill > craft plugin >
  general model). Docs: `skills/README.md` + `plugin/README.md` gain a Capability-plugins
  section; CHANGELOG 0.9.0.
- **Verified:** selftest 120 → **127 checks ALL GREEN** (manifest shape ×4, plugins.js ×2,
  §9 ×1); `claude plugin validate` passes `--strict` for both plugin and marketplace.

**[2026-07-17] Session 3 — Phases 5 + 5.5 (v0.7.0 → v0.8.0)**
- **P5.1 instinct auto-detection:** new `instinct-track.js` (PostToolUse) mechanizes the
  Gap-#9 loop — counts edits to each file across **distinct sessions** in
  `sessions/edit-counts.json` (once per file per session, the low-noise proxy for a
  recurring correction); at 3+ it fires a **once-per-file advisory** to file a rule in
  `instincts/pending/`. Never blocks; bookkeeping files exempt.
- **P5.2 auto-distillation:** `wrap.js` Stop now also blocks **once** when a session's last
  logged step was `build|review` but no ADR was filed to `decisions/` near it (relative
  mtimes, no session clock; pre-v2 brains opt out). `brain-status` gained a **"Decisions
  (the why)"** section (recent ADRs injected every session); `/brain:wrap` distills decisions.
- **P5.3 semantic search (opt-in qmd):** `qmd-mcp.js` = the `brain-search` MCP in
  `.mcp.json`, **dormant by default** per schema §8. Hands off to real `qmd mcp` only when
  brain + opt-in (`.qmd`/`MONKEY_BRAIN_QMD=1`) + qmd on PATH (shell-free scan avoids a
  Windows false-positive); else a stdlib no-op MCP server (zero tools) so no session shows a
  failed server. SessionEnd runs a detached `qmd update`; §8 documents enabling; bundle re-synced.
- **P5.4 compaction survival:** `snapshot.js` now also captures **active specs + projects**
  (tier/phase/approval) alongside the resume next-steps and log heads.
- **P5 item 5 — budget receipts (groundwork):** `brain-status` appends each injection's
  size to `sessions/injection-stats.json` (rolling 20) for the P8 doctor — zero added tokens.
- **Phase 5.5 — model routing & fan-out (v0.8.0):** `model:`/`effort:` frontmatter on all
  11 skills — judgment (`plan`/`review`/`wrap`/`query`/`lint`/`compress`) stays on the
  session's main model at `effort: high`; routine `ingest`/`research`/`build` pin
  `model: sonnet`; `init` sonnet/low, `terse` haiku/low. Two Sonnet subagents —
  `brain-researcher` (read-only research slice → cited findings) + `brain-librarian` (batch
  ingest in an isolated window) — which hook #7 passes through and logs. Fan-out patterns
  (research fan-out · batch ingest · build+review pair · competing hypotheses) documented in
  the skills + `skills/README.md` + `README.md`.
- **Verified:** selftest 95 → **120 checks ALL GREEN**; `claude plugin validate --strict`
  passes; seven per-step `feat:` commits (P5.1–P5.5, P5.5a/b) + trackers.

**[2026-07-17] Session 2 — Phases 2+3+4 completed (v0.4.0 → v0.6.0)**
- **P3 complete (v0.6.0):** develop-lifecycle skills `/brain:{research,plan,build,review}`
  — research wiki-first→codebase→web, every finding cited, filed to `wiki/research/`;
  plan writes `specs/` with AC-n + tier and keeps `plan_approved` **curator-owned**
  (never self-set); build runs red→green→refactor per AC treating the TDD gate as the
  reminder; review verifies AC-by-AC with evidence and files back (review synthesis,
  `decisions/` ADRs, 3+-repeat corrections → `instincts/pending/` — the Gap-#9 feedback
  loop is live). Token discipline: `/brain:terse` (output mode + compression guard),
  `/brain:compress` (permanent instruction-file compression with byte/token receipts).
  trigger-router learned the phrases ("research X", "write a spec", "implement the
  spec", "review the changes", "be terse" — works brainless, "compress CLAUDE.md").
  Selftest **95/95 GREEN**.
- **P4 schema v2 (v0.5.0):** template gains `specs/ projects/ sessions/ decisions/
  instincts/{pending,active} wiki/research/` with five new templates (spec/decision/
  project-status/instinct/research); instance CLAUDE.md rewritten at `engine_version: 2.0`
  (records table, develop lifecycle research→plan→build→review, tier table); engine
  `schema/CLAUDE.md` → v2.0 with section numbers kept stable (hooks/skills cite §1/§3/§4/§5).
  **Tier gates:** plan gate (architecture) joined by the **TDD gate** — feature+ specs block
  NEW code files lacking a test companion (same-dir `.test/.spec`, `__tests__/`, root test
  dirs; `tdd: false` opts out, quick tier advisory). Migration: `new-brain.js --update` and
  `new-brain.ps1 -Update` ensure template dirs + structural files, never seed wiki pages
  (verified on a real pre-v2 scratch brain). brain-status adds "Active projects" (tier·phase).
  Selftest **88/88 GREEN**.
- **P3 core skills:** `/brain:{init,ingest,query,lint,wrap}` shipped. `init` is
  self-contained — bundled `brain-template/` + Node `scripts/new-brain.js`
  (create / `--update` / `--force` / `--sync-template`) because marketplace installs ship
  only `plugin/`; `schema/brain-template/` remains the canonical master (selftest fails on
  drift). `lint` gets a mechanical scanner (`scripts/lint.js`: broken links, orphans,
  frontmatter gaps, index drift, Clippings backlog, strays; `--strict` for CI) injected
  via `` !`…` `` preprocessing before the model's reasoning pass.
- **P2 complete (8/8):** #2 `trigger-router` (UserPromptSubmit phrases → skill hints;
  suggests `/brain:init` in brainless projects), #5 `snapshot` (PreCompact working-state
  → `sessions/`), #6 `wrap` (Stop gate when wiki changed after last log entry, once per
  session; SessionEnd self-heals index `source_count`/`page_count`/`updated`),
  #7 `agent-track` (dispatches → `sessions/agents.md`; heavy spawns without an explicit
  model blocked once per session with the routing table). #1 `brain-status` grew the
  no-brain fallback offer (startup-only one-liner; `.no-brain` marker silences).
- **Verified:** selftest 36 → **79 checks ALL GREEN**; both manifests pass
  `claude plugin validate --strict`; a fresh `/brain:init` scaffold lints clean
  end-to-end (`lint.js --strict` exit 0).

**[2026-07-17] Session 1 — research → plugin → enforcement (9 commits)**
- **P9.2** Ingested the 3 benchmarks into `examples/claude-code-brain/` (now 16 sources /
  69 pages, lint-clean): Caveman `2095b5c` · MewVault `39361de` · ui-ux-pro-max `559830d`;
  filed `monkey-brain-vs-mewvault` + `domain-expertise-packs` `b224e18`; tracker `63839f0`.
- **P1** Plugin skeleton `47b0259`: plugin **`brain`** (displayName "The Monkey Brain") at
  `plugin/`; repo doubles as marketplace **`monkey-brain`** (`.claude-plugin/marketplace.json`)
  → install `brain@monkey-brain`, commands `/brain:*`. MIT license `f2e2835`.
- **Environment:** Node.js 24.18.0 LTS installed via winget (hook runtime; fresh PowerShell
  sessions may need a PATH refresh).
- **P2 tranche 1** `ce1a692` (plugin v0.2.0): hook #1 `brain-status` (budgeted ≤3k
  SessionStart injection), #3 `guards` (secrets everywhere · raw-sources add-only · log
  append-only · architecture plan gate), #4 `wiki-check` (self-healing: frontmatter/orphan
  failures block into context; TODO `[[links]]` advisory). **Verified:**
  `node plugin/hooks/scripts/selftest.js` → 23/23 GREEN; both manifests pass
  `claude plugin validate --strict`.
- **P2 hook #8 — resume system** (v0.3.0): `resume.js` injects `resume.md` into
  startup/clear sessions with an ask-to-continue directive (own ≤1.2k budget);
  `resume-log.js` auto-appends TaskCreated/TaskCompleted/SessionEnd lines and auto-creates
  the file inside brains; template seeded + `new-brain.ps1 -Update` migration; the engine
  repo root now carries its own `resume.md`. Selftest 36/36 GREEN.

**▶ Resume here (next session):** the live pointer is **`resume.md` at the repo root** —
hook #8 injects it and asks to continue once the plugin is installed; until then, read it
first. **Phases 1–9 are done** (plugin v0.12.1, **14 skills** with routing frontmatter incl. the
`product-design` pack + `game` pipeline + `doctor` health monitor, **2 Sonnet subagents**, 10 hook
scripts + 1 MCP wrapper, a 9-plugin recommended manifest, selftest **158/158**). P9 dogfooded the
engine end-to-end (fresh scaffold lint+doctor clean, 7/7 gates fire) and fixed the escaped-pipe
wikilink bug it surfaced; README + `schema/CLAUDE.md` got the v2.0 pass. **The only remaining step
is opening the PR** `monkey-brain-enhancement` → `main` (branch committed + green, ahead of
`origin`). Optional dogfood at any point:
`/plugin marketplace add "F:\The Monkey Brain\The-Monkey-Brain"` → `/plugin install brain@monkey-brain`.

---

## Design principles (decide these first — they resolve every later trade-off)

1. **Enforcement over advice.** Any rule that must hold every time becomes a hook or deny
   rule, never a CLAUDE.md sentence. (Our own synthesis page already says this.)
2. **"Read every .md before any task" = context engineering, not literal reads.** Literally
   reading the whole vault per task explodes tokens (anti-Caveman). Instead: a SessionStart
   hook injects a **budgeted brain-status block** (≤3,000 tokens: index stats, active
   tasks/specs, last log entries, pending clippings, relevant memories), the **index stays
   the map**, and **semantic search (qmd MCP)** makes any page reachable on demand. The brain
   is *always aware of everything* and *reads deeply only what the task needs*.
3. **Cache-aware injection order.** Static content (rules, persona, schema digest) first so
   the prompt cache hits; dynamic content (status, tasks, health) after. Over budget →
   low-priority sections drop entirely, never the trigger map.
4. **Everything leaves a trace.** Every session, ingest, plan, build, review appends to
   `log.md` / `sessions/` automatically via hooks — not by hoping the model remembers.
5. **The plugin is the engine's distribution.** Install once (user scope) → every project
   gets the brain automatically; `.brain/` instances stay isolated per project.
6. **Differentiate, don't imitate.** MewVault is the competitor benchmark, not the blueprint.
   Where they have one managed workspace, we have **federated instances + upstream
   promotion** (learnings flow back to the engine). Where they name a model, we ship a
   **routing policy**. Where they sync a wiki, we **compile** one.

---

## Activation architecture — how the right capability fires at the right time

"Works whenever needed in any project" is not one mechanism; it is **five layers**, each
catching what the previous one missed:

1. **Install once, present everywhere.** The plugin lives at user scope: its hooks, skills,
   agents, and MCP servers exist in every session of every project. The `.brain/` instance
   travels with each project's git.
2. **Awareness before the first task.** SessionStart injects the budgeted status block
   (state, tier, active specs, instincts) — routing decisions are made *with context*.
3. **Three complementary per-prompt routers:**
   - **Deterministic** — the trigger-router hook maps natural phrases ("ingest this",
     "spec user-billing", "wrap up", "standup", "doctor") to workflows. Guaranteed.
   - **Model-driven** — every skill/pack/plugin carries `description`/`when_to_use`;
     Claude auto-selects on task match ("build a landing page" → ui-ux-pro-max) without
     anyone naming it.
   - **Path/context-driven** — skill `paths` globs and hook matchers activate expertise
     from the *files being touched*: `auth/**` pulls security-guidance, `.tsx` pulls
     frontend rules, `wiki/**` pulls the link-checker.
4. **Enforcement fires regardless of routing.** Even if all three routers miss, PreToolUse
   gates (secrets, immutability, plan, TDD-by-tier) intercept at the tool-call level.
   Quality never depends on the right skill having loaded.
5. **Depth on demand.** Pack data and MCP tools stay deferred (Tool Search, qmd) until a
   task needs them — all capabilities available at near-zero token cost until activated.

**Activation matrix** (representative traces):

| Task signal | Routed by | What activates | What files back |
| --- | --- | --- | --- |
| "ingest this article" | trigger (L3a) | `/brain:ingest` | source page, cross-links, index, log |
| "build a landing page for my SaaS" | descriptions (L3b) | product-design pack → ui-ux-pro-max → frontend-design | decisions/ (design system ADR), instincts (anti-patterns) |
| "fix this login bug" | descriptions + paths (L3b+c) | superpowers debugging; security-guidance on `auth/**`; TDD gate | regression test, root-cause wiki page, correction → instincts/pending |
| "spec user-billing" | trigger (L3a) | `/brain:plan` | specs/ with ACs; plan gate armed |
| "start a game concept" | descriptions (L3b) | game pack (GDD) | projects/ entry with tier, GDD in wiki |
| edit under `wiki/**` | matcher (L3c) | link/orphan check (hook #4) | fixed in the same turn |
| any write, any task | gates (L4) | secrets/immutability/plan/TDD | violation → blocked + logged |
| deep vault question | deferred MCP (L5) | qmd semantic search | novel answer → syntheses/ |

**Precedence when multiple match** (process orchestrates, specialists execute):
`deterministic trigger > domain pack process > domain skill > craft plugin > general model`.
Overlapping activations are logged; `/brain:doctor` flags noisy overlaps for tuning.

**No-brain fallback:** SessionStart in a project without `.brain/` offers `/brain:init` in
one line (once per session; a `.no-brain` marker silences it permanently). Adoption is
automatic too, not remembered.

---

## The quality triangle — context × tokens × output quality

The three goals reinforce rather than compete, if the mechanisms are assigned correctly:

- **Keeping context** — budgeted SessionStart injection (static-first for prompt-cache
  hits); PreCompact snapshots to `sessions/`; decisions auto-distilled to `decisions/`;
  the wiki itself is the long-term context that survives every session.
- **Reducing tokens** — deferred tools/packs (load on activation, not at startup);
  `/brain:compress` on memory/CLAUDE.md files (permanent input savings); `/brain:terse`
  output mode; **model routing** (below) so cheap tokens do cheap work; doctor reports
  injection size, cache-hit ratio, and tokens saved (receipts, not vibes).
- **Best output quality** — gates make quality non-negotiable (plan/TDD/audit/secrets);
  packs inject domain expertise at the moment of use; filed-back knowledge means every
  output builds on all previous decisions; review passes run on the strongest model.
- **The compression guard:** compression never touches code, commands, error messages,
  specs, or acceptance criteria (byte-for-byte preserved) — terseness applies to prose,
  never to the artifacts quality depends on.

---

## Phase 1 — Repackage as a plugin

1. Create `plugin/` in this repo:
   ```
   plugin/
   ├── .claude-plugin/plugin.json      # name: brain (→ /brain:* namespace); displayName "The Monkey Brain"
   ├── skills/                         # Phase 3
   ├── hooks/hooks.json + scripts/     # Phase 2 (Node.js for cross-platform, like MewVault)
   ├── agents/                         # brain-librarian, brain-researcher
   └── .mcp.json                       # qmd semantic search (Phase 5)
   ```
2. Add `.claude-plugin/marketplace.json` at repo root so the repo doubles as a marketplace
   (`/plugin marketplace add NeamulMorshed/The-Monkey-Brain`).
3. Keep `bootstrap/` — `/brain:init` calls it via `${CLAUDE_SKILL_DIR}`.
4. Write hook scripts in **Node.js** (single runtime on Win/mac/Linux) instead of paired
   .ps1/.sh; keep `lint-brain.ps1` as a thin wrapper for humans.

## Phase 2 — Hooks: the enforcement layer (match & beat MewVault's 7)

| # | Event | Script | What it enforces / injects |
| --- | --- | --- | --- |
| 1 | `SessionStart` | `brain-status.js` | Detect `.brain/` → inject budgeted status block (stats, active specs/tasks, unprocessed `Clippings/`, last 3 log entries, active instincts). **Kills the CLAUDE.md loading caveat.** |
| 2 | `UserPromptSubmit` | `trigger-router.js` | Natural-phrase routing: "ingest this"→ingest skill, "wrap up"→wrap, "standup"→brief, "spec X"→plan skill, "lint the brain"→lint, "doctor"→health. No memorized commands. |
| 3 | `PreToolUse` (Edit\|Write) | `guards.js` | **Immutability**: deny writes to `.brain/raw-sources/**`; `log.md` append-only. **Secrets**: block content matching `sk-`, `ghp_`, `AKIA`, private-key headers. **Plan gate**: architecture-tier projects require `plan_approved: true` in the spec before source writes. **TDD gate** (feature+ tiers): warn/block source files without a test. |
| 4 | `PostToolUse` (wiki writes) | `wiki-check.js` | Link/orphan check on the touched page; failures land in context → self-healing same turn. Track activity for the session log. |
| 5 | `PreCompact` | `snapshot.js` | Write a semantic snapshot (open task, decisions, next steps) to `.brain/sessions/` so nothing is lost to compaction. |
| 6 | `Stop` / `SessionEnd` | `wrap.js` | Append session entry to `log.md`, refresh `index.md` stats, re-index semantic search, remind/perform conventional commit (`ingest:`/`query:`/`lint:`/`session:`). |
| 7 | `PreToolUse` (Agent) | `agent-track.js` | Log agent dispatches; require explicit model choice for expensive spawns. |
| 8 | `SessionStart` (startup\|clear) + `TaskCreated`/`TaskCompleted`/`SessionEnd` | `resume.js` + `resume-log.js` | **Resume system.** Reader: injects `resume.md` (`.brain/` or project root) into fresh sessions with a directive to **ask the user: continue or start fresh?** Auto-logger: appends one line per task/session event to `## Task log (auto)`, bumps `updated:`; auto-creates the file inside brains. Narrative sections stay model-owned (`/brain:wrap`). |

## Phase 3 — Skills: SDLC verbs + development workflows

**Brain SDLC** (namespaced `/brain:*`, auto-activating via `description`/`when_to_use`):
- `/brain:init` — scaffold `.brain/` (wraps bootstrap), drop root `@.brain/CLAUDE.md` import,
  offer the recommended plugin set (Phase 6).
- `/brain:ingest [path|url]` — the 8-step compile, now checklist-enforced by hook #4.
- `/brain:lint` — mechanical scan injected via `` !`node lint.js` `` first, then reasoning
  over contradictions/staleness.
- `/brain:query` + file-back — index-first answering; novel answers → `syntheses/`.
- `/brain:wrap` — definition-of-done: verify acceptance criteria, run typecheck/lint/test,
  update log + index, commit.
- `/brain:doctor` — health monitor (Phase 8).

**Development lifecycle** (the analysis → research → plan → build spine):
- `/brain:research <topic>` — web + codebase research, filed to `wiki/research/` with sources.
- `/brain:plan <feature>` — produce `specs/<feature>.md` with **numbered acceptance criteria**
  (AC-1, AC-2…) and tier; requires curator approval → sets `plan_approved: true`.
- `/brain:build <spec>` — TDD loop against the spec's criteria (superpowers plugin does the
  methodology; our skill wires it to the spec + gates).
- `/brain:review` — code review filed back as a wiki page + PR comments (github plugin).

**Token discipline (Caveman-inspired):**
- `/brain:terse [level]` — output-compression mode persisted per session.
- `/brain:compress <file>` — rewrite CLAUDE.md/memory/wiki hub pages tersely (~46% permanent
  input savings); run it on `brain-template/CLAUDE.md` itself.
- Keep every SKILL.md < 150 lines; details in referenced files loaded on demand.

## Phase 4 — Schema v2: brain-template upgrade

New instance layout (additions ★):
```
.brain/
├── CLAUDE.md            # slimmed: identity + layer map + trigger table (compressed)
├── Clippings/ raw-sources/ memory/
├── wiki/ {index,log,dashboard,sources,concepts,entities,syntheses, research★}
├── specs/★              # acceptance-criteria specs (plan gate reads these)
├── projects/★           # Project_Status.md per workstream: tier, phase, audit fields
├── sessions/★           # auto-written session logs + compaction snapshots
├── decisions/★          # ADRs distilled at session end
└── instincts/★          # {pending,active}/ auto-learned correction rules
```
- **Project tiers** (gate strictness): `quick` (<2h, warn only) · `feature` (plan verbal,
  TDD blocks) · `architecture` (hard plan gate).
- Frontmatter additions: `tier`, `phase`, `plan_approved`, `audit_score`.
- Log prefixes extended: `session |`, `research |`, `plan |`, `build |`, `review |`.
- Bump `schema/CLAUDE.md` to v2.0; `new-brain.ps1 -Update` migrates existing brains
  (creates missing folders, never touches knowledge).

## Phase 5 — Memory & context engineering

1. **Three memory tiers:** wiki (durable compiled knowledge) · `memory/` + `decisions/`
   (project facts, ADRs) · `instincts/` (auto-learned corrections: 3+ rewrites of the same
   file → candidate rule in `pending/`, curator promotes to `active/` → injected at start).
2. **Auto-distillation:** session-end hook extracts decisions made this session into
   `decisions/` and refreshes the memory index — no manual "remember this" needed.
3. **Semantic search:** bundle qmd as MCP in `.mcp.json` (BM25 + vector, on-device — already
   our documented §8 upgrade path). Instruction: *consult memory before substantive work.*
   Index refresh in the session-end hook. Deferred tool loading keeps context cost ~0.
4. **Compaction survival:** PreCompact snapshot (hook #5) + sessions/ folder.
5. **Budget receipts:** doctor reports injection size, cache-hit ratio, tokens saved
   (Caveman-style stats line).

## Phase 5.5 — Model routing & parallel orchestration

MewVault merely *requires* that agent dispatches name a model. We go further: a **routing
policy** that picks the right model by default, plus parallel multi-model patterns.

**Mechanisms** (all native Claude Code): skill frontmatter `model:` + `effort:`; subagent
frontmatter `model:`; Agent-tool `model` param per dispatch; hook `prompt` handlers run on
fast models; scripts run on no model at all.

**The routing policy** (encoded in skill/agent frontmatter, enforced by hook #7):

| Work class | Runs on | Examples |
| --- | --- | --- |
| Deterministic checks | **scripts — no model, 0 tokens** | lint, guards, stats, link checks, doctor mechanics |
| Classification & triage | **Haiku** | trigger routing (prompt hook), clipping triage, commit-message drafts |
| Routine execution | **Sonnet** | ingest summaries, research fan-out reads, standard implementation, batch librarian work |
| Judgment & synthesis | **main model (Opus/Fable)** | architecture plans, design-system reasoning, contradiction reconciliation, final review, wrap verification |

**Parallel multi-model patterns** (subagents run concurrently; only summaries return):
- **Research fan-out:** N Sonnet Explore agents scan sources/codebase in parallel → one
  main-model synthesis files the result. Wide coverage, narrow context cost.
- **Build + review pair:** Sonnet implementer works the spec while a main-model reviewer
  audits against acceptance criteria — disagreement surfaces before wrap, not after.
- **Batch ingest:** the `brain-librarian` (Sonnet) compiles multiple sources in parallel
  isolated windows; the main session only sees log entries.
- **Competing hypotheses:** two agents on different models attack the same bug/design
  question independently; the main model adjudicates. (Escalate to agent teams only when
  parallel subagents need to talk to each other.)

**Escalation & receipts:** skills declare `effort:` so heavy reasoning is spent only where
declared; hook #7 logs every dispatch's model + purpose; `/brain:doctor` reports model-mix
and cost per session — routing drift becomes visible, not felt.

## Phase 6 — Bundled capability plugins (auto-firing per task type)

Ship a **recommended-plugins manifest** the `/brain:init` skill offers to install (plugins
auto-activate by their own skill descriptions; our trigger-router nudges them):

| Plugin | Auto-fires when | Brain integration |
| --- | --- | --- |
| [github](https://claude.com/plugins/github) | PR/issue/CI work | reviews & PR links filed to wiki; wrap posts status |
| [frontend-design](https://claude.com/plugins/frontend-design) | any UI build | design decisions → `decisions/`; audit scores in Project_Status |
| [superpowers](https://claude.com/plugins/superpowers) | build/debug phases | TDD methodology behind `/brain:build` |
| [security-guidance](https://claude.com/plugins/security-guidance) | auth/crypto/input-handling code | findings filed as wiki pages; P0s block wrap (MewVault-style audit gate) |
| [product-tracking-skills](https://claude.com/plugins/product-tracking-skills) | product/metrics work | tracking plans live in `projects/` |
| [code-modernization](https://claude.com/plugins/code-modernization) | legacy refactors | migration notes → `wiki/research/` |
| [productivity](https://claude.com/plugins/productivity) | standup/planning triggers | feeds the "standup" brief |
| [product-management](https://claude.com/plugins/product-management) | PRD/roadmap requests | PRDs land in `raw-sources/` → ingested |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX design-system requests | decides the *design system* (frontend-design executes the *build*); palette/style/type choices → `decisions/`; its anti-patterns seed `instincts/` |

Rule: **plugins do the craft; the brain records the knowledge.** Every plugin output that
represents a decision, finding, or artifact gets filed into the instance by our skills/hooks.

## Phase 6.5 — Domain Expertise Packs (the ui-ux-pro-max pattern, generalized)

External plugins bring *workflows*; expertise packs bring **packaged domain knowledge**:
searchable data + industry-standard process + validation checklist, hosted by the engine.
Unlike standalone skills (static, frozen at publish), our packs **compound** — every
recommendation files back into the instance.

**Pack format** (`plugin/skills/packs/<domain>/`):
```
<domain>-pack/
├── SKILL.md            # the process (phases, methods, when to auto-activate)
├── data/               # searchable domain knowledge (qmd-indexed markdown tables)
├── templates/          # deliverable skeletons (persona, journey map, GDD…)
└── checklist.md        # validation gate — /brain:wrap reads this
```

**First pack — `/brain:product-design`** (industry-standard end-to-end process):
1. **Discovery** — stakeholder/user interviews, JTBD framing, competitor teardowns
   → filed to `wiki/research/`.
2. **Definition** — personas, user journey maps, problem statements, HMW questions
   → `specs/` with acceptance criteria.
3. **Ideation/brainstorming** — structured methods as sub-skills: Crazy 8s, SCAMPER,
   Double Diamond divergence/convergence, dot-voting → outputs filed as syntheses.
4. **Design** — hand off to ui-ux-pro-max (design system) + frontend-design (build), with
   the brain's accumulated context injected: brand decisions, past audit findings, banned
   patterns from `instincts/`.
5. **Validation** — Nielsen heuristic evaluation, WCAG accessibility pass, usability test
   scripts → findings gate `/brain:wrap` exactly like security P0s.

**Later packs, same format:** game design (GDD, MDA framework, playtest protocols — feeds
Phase 7), product analytics, brand/marketing.

**The differentiator:** their expertise is output; ours is memory. A palette choice from
ui-ux-pro-max is an ADR in `decisions/` that every future session knows about; a banned
anti-pattern becomes an active instinct rule the hooks enforce.

## Phase 7 — Domain workflows: products & games

- **Product pipeline:** idea (`wiki/research/`) → PRD (product-management → `raw-sources/` →
  ingest) → `/brain:plan` spec → `/brain:build` → track (product-tracking) → `/brain:wrap`.
- **Game pipeline:** concept → **GDD** template (`schema/templates/gdd.md`: loops, mechanics,
  progression, art direction) → prototype spec (tiered) → build → **playtest logs** filed as
  sources → balance decisions as ADRs. Engine entity pages (Godot/Unity/web) in `entities/`.
- **Analysis/research/planning process** codified once in `/brain:research` + `/brain:plan`
  and reused by both pipelines — research is always filed, plans always have numbered
  acceptance criteria, approval always gates architecture-tier code.

## Phase 8 — Quality & health: `/brain:doctor`

Automated checks (target 15, MewVault parity):
broken links · orphans · stale/contradiction flags · index freshness vs page count ·
Clippings backlog · log gaps (sessions without entries) · uncommitted `.brain/` changes ·
hook registration · injection size vs budget · semantic index freshness · WIP limits
(≤3 active projects, none idle 21+ days) · instinct-queue overflow · specs without tests ·
open P0 findings · schema version vs engine.
Failures inject a health report into the next session (hook #1 carries it).

## Phase 9 — Rollout (dogfood everything)

1. Work on `monkey-brain-enhancement`; **commit per phase step** with conventions.
2. **Ingest Caveman + MewVault as sources** into `examples/claude-code-brain/` — the
   competitor analysis becomes wiki knowledge (research → synthesis page:
   `monkey-brain-vs-mewvault`).
3. Build Phase 1–2 first (plugin skeleton + hooks 1, 3, 4 = biggest payoff), then 3, 4, 5;
   6–8 iterate after.
4. Test on a scratch project: `/brain:init` → ingest → plan → build a toy feature → wrap;
   verify every gate fires and every log updates.
5. Update README + `schema/CLAUDE.md` (v2.0), run `/brain:lint` on the example brain,
   open PR to `main`.

---

## Gap analysis — Monkey Brain v1, and this roadmap's own blind spots

| # | Gap | Severity | Fix (phase) |
| --- | --- | --- | --- |
| 1 | Loading caveat: brain invisible unless `.brain` on cwd→root path | High | SessionStart injection (P2 #1) |
| 2 | Every convention is advice — nothing enforced (immutability, no-orphans, log discipline) | High | Gates + wiki checks (P2) |
| 3 | No adoption path in brainless projects — the engine must be remembered | High | No-brain fallback offer (Activation arch.) |
| 4 | All bookkeeping (index/log/commit) relies on the model remembering §4.1 | High | Hooks #4/#6 automate it (P2) |
| 5 | No session continuity — compaction and session ends lose working state | High | PreCompact snapshots + `sessions/` (P5) |
| 6 | Everything runs on the main model — no cost/quality assignment, no parallelism | Med | Routing policy + fan-out (P5.5) |
| 7 | Index-only search ceiling (~100 sources) documented but unwired | Med | qmd MCP bundled (P5) |
| 8 | No precedence when multiple skills/packs match one task | Med | Precedence chain (Activation arch.) |
| 9 | No correction feedback loop — repeated fixes never become rules | Med | `instincts/` pipeline (P4/P5) |
| 10 | No project tiers or definition-of-done — same rigor for a typo and an architecture | Med | Tiers + wrap gate (P4) |
| 11 | No token accounting — savings and injection costs are invisible | Med | Doctor receipts (P5/P8) |
| 12 | PowerShell-only scripts — brains don't port to mac/Linux teammates | Med | Node.js hook runtime (P1) |
| 13 | Lint is manual and on-demand; staleness accumulates silently | Low | Doctor checks + health report injection (P8) |
| 14 | Isolation is total — patterns learned in one project never benefit others | Low | **Upstream promotion**: project-agnostic instincts & pack improvements flow to the engine repo, redistributed via `-Update`. Federated learning, still zero knowledge bleed — something MewVault's single workspace cannot do. |

## How we beat MewVault (the scorecard)

| Dimension | MewVault | Monkey Brain v2 |
| --- | --- | --- |
| Portability | Fixed workspace of silos | **Plugin — any repo, any machine, `.brain/` travels with the project's git** |
| Knowledge | Wiki synced at session end | **Full LLM-wiki SDLC: compile-time cross-linking, contradiction flags, provenance frontmatter** |
| Token economy | 3k budget injection | Budget injection **+ Caveman-style output/memory compression + deferred MCP tools** |
| Enforcement | 7 hooks, hard gates | Same gate set **+ self-healing wiki checks (PostToolUse fixes in-turn)** |
| Capability breadth | Impeccable design + Godot | **8 bundled marketplace plugins routed by task type** |
| Auditability | Generated logs | Logs **+ append-only guarantee (hook-enforced) + git commit conventions** |
| Model economics | Requires naming a model per dispatch | **Routing policy (right model by default) + parallel multi-model fan-out + effort control + cost receipts** |
| Activation | Phrase triggers | **Five-layer activation: triggers + description matching + path matching + always-on gates + deferred depth, with explicit precedence** |
| Cross-project learning | One workspace, shared by design | **Federated instances + upstream promotion — learnings propagate via the engine, knowledge never bleeds** |
