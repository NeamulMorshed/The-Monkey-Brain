# Changelog — brain plugin

## 0.7.0 — 2026-07-17 (Phase 5: memory & context engineering)

The three memory tiers (wiki · decisions/memory · instincts) become
self-feeding, semantic search is bundled but opt-in, and every injection now
leaves a receipt.

- **Instinct auto-detection** (`instinct-track.js`, PostToolUse): the Gap-#9
  loop mechanized — tallies edits per file across **distinct sessions** in
  `sessions/edit-counts.json`; at 3+ (`MONKEY_BRAIN_INSTINCT_THRESHOLD`) it
  emits a **once-per-file advisory** to file a rule in `instincts/pending/`
  (never a block; bookkeeping files exempt). Scripts notice; the model writes
  the rule.
- **Auto-distillation** (`wrap.js` Stop + `brain-status.js`): after a session
  whose last logged step was `build|review`, the wrap hook blocks **once** if
  no ADR was filed to `decisions/` near that entry — prompting the model to
  distill the "why". `brain-status` gains a **"Decisions (the why)"** section
  so recent ADRs are injected every session; `/brain:wrap`'s definition-of-done
  now includes distilling decisions.
- **Semantic search — opt-in qmd** (`qmd-mcp.js` + `.mcp.json`): a
  `brain-search` MCP wrapper, dormant by default (schema §8: qmd is deferred
  until the wiki outgrows the index ~100 sources). Hands off to real
  `qmd mcp` only when a brain is present **+ opted in** (empty `.qmd` marker or
  `MONKEY_BRAIN_QMD=1`) **+ qmd on PATH**; otherwise a stdlib no-op MCP server
  (valid protocol, zero tools) so no session shows a failed server. `wrap.js`
  SessionEnd runs a detached `qmd update` re-index when opted in;
  `brain-status` surfaces the enabled state or nudges to enable near the
  ceiling. Instance CLAUDE.md §8 documents the steps.
- **Compaction survival** (`snapshot.js`): PreCompact snapshots now also carry
  **active specs and projects** (tier/phase/approval) — the in-flight work most
  costly to lose, not just the next steps.
- **Budget-receipt groundwork** (`brain-status.js`): each injection's size
  (tokens, budget, sections kept/dropped) is appended to
  `sessions/injection-stats.json` (rolling last 20) for the future
  `/brain:doctor` — zero added tokens.
- Selftest 95 → **115 checks** (instinct-track ×7, decisions ×4, qmd-mcp ×5,
  snapshot ×2, receipts ×3); plugin validates `--strict`.

## 0.6.0 — 2026-07-17 (Phase 3 complete: develop lifecycle + token discipline)

- **Develop-lifecycle skills** (the v2 schema's verbs):
  - **`/brain:research`** — wiki-first, then codebase, then web; every finding
    cited; filed to `wiki/research/` with a Recommendation; hands off to plan.
  - **`/brain:plan`** — `specs/<feature>.md` with numbered ACs, test plan, and
    tier + rationale; **approval stays curator-owned** (`plan_approved: true`
    only after explicit approval in conversation — never self-set); creates the
    `projects/` workstream page.
  - **`/brain:build`** — red→green→refactor against the ACs in slices; treats
    the TDD gate as the reminder it is; progress ticked in the spec; ADRs
    distilled to `decisions/`; log + commit per milestone.
  - **`/brain:review`** — AC-by-AC verification with evidence (runs the suite
    itself), severity-ordered code review, findings **filed back**: review
    synthesis page, `decisions/` ADRs, 3+-repeat corrections drafted to
    `instincts/pending/` (the Gap-#9 feedback loop starts working); closes the
    spec honestly (`status`/`phase`/`audit_score`).
- **Token-discipline skills** (Caveman-inspired):
  - **`/brain:terse`** — session output-compression mode with the compression
    guard (code, commands, paths, errors, ACs never compressed); `off` to end.
  - **`/brain:compress`** — permanent instruction-file compression (CLAUDE.md,
    memory, rules; never wiki knowledge pages) with before→after byte/token
    receipts and a no-loss verification step.
- **trigger-router** learns the new phrases: "research X", "write/draft a
  spec", "implement the spec", "review the changes", "be terse" (works
  brainless), "compress CLAUDE.md".
- Selftest 88 → **95 checks**.

## 0.5.0 — 2026-07-17 (Phase 4: schema v2 + tier gates)

- **Schema v2 template** (master `schema/brain-template/`, bundle re-synced):
  new record layers `specs/`, `projects/`, `sessions/`, `decisions/`,
  `instincts/{pending,active}/`, `wiki/research/`; new templates `spec`
  (numbered ACs, `tier`, `plan_approved`, `tdd`), `decision` (ADR),
  `project-status`, `instinct`, `research`; log prefixes extended with
  `session | research | plan | build | review`; instance CLAUDE.md rewritten
  at `engine_version: 2.0` (records table, develop lifecycle, tier table).
  Engine master `schema/CLAUDE.md` bumped to v2.0 with the same conventions —
  section numbers kept stable (hooks/skills cite them).
- **Migration:** `new-brain.js --update` and `bootstrap/new-brain.ps1 -Update`
  now ensure every template directory exists and add missing structural files
  (`.gitkeep`, `Clippings/.gitignore`) — seed wiki pages are never added to an
  existing brain, knowledge is never touched.
- **TDD gate** (guards rule 5, schema §4.4): while an active
  feature/architecture-tier spec exists (without `tdd: false`), creating a NEW
  project code file with no test companion is blocked — looks for same-dir
  `<name>.test/.spec`, a sibling `__tests__/`, and root-level
  `test|tests|spec|specs` dirs. Quick tier stays advisory-only. Test-file
  detection strengthened for both gates (`foo.spec.ts`, `test_foo.py`,
  `test.js` now recognized).
- **brain-status:** new "Active projects" section (tier · phase per
  workstream, read from `projects/`).
- Selftest 79 → **88 checks** (TDD gate ×6, projects section, v2 scaffold,
  v1→v2 migration ×2).

## 0.4.0 — 2026-07-17 (Phase 3 core skills + Phase 2 hook set complete)

**Skills — the SDLC verbs land** (`/brain:*`, all auto-activating):

- **`/brain:init`** — self-contained scaffold: bundled `brain-template/` +
  `scripts/new-brain.js` (Node port of `bootstrap/new-brain.ps1`; create /
  `--update` / `--force` / `--sync-template`), because marketplace installs
  ship only `plugin/`. Wires the root `@.brain/CLAUDE.md` import, honors and
  clears `.no-brain`. `schema/brain-template/` remains the canonical master —
  selftest fails when the bundle drifts.
- **`/brain:ingest`** — the 8-step compile checklist (canonicalize → summary →
  5–10+ cross-links → index → log → commit), batch/Clippings modes, gate-aware.
- **`/brain:query`** — index-first retrieval with citations; novel answers
  filed back to `syntheses/` (plain lookups stay lightweight).
- **`/brain:lint`** — `scripts/lint.js` mechanical scan injected via `` !`…` ``
  preprocessing (broken links, orphans, frontmatter gaps, index drift,
  Clippings backlog, strays; `--strict` for CI), then the model's reasoning
  pass (contradictions, staleness, gaps).
- **`/brain:wrap`** — definition-of-done: verify honestly, sync log + index +
  resume narrative, commit with vault conventions.

**Hooks — Phase 2 set complete (8/8):**

- **#2 `trigger-router.js`** (UserPromptSubmit): deterministic natural-phrase
  routing to the skills ("ingest this", "wrap up", "lint the brain", "what
  does the brain know", "set up a brain"). Never blocks; suggests
  `/brain:init` when a brain-needing phrase fires in a brainless project.
- **#5 `snapshot.js`** (PreCompact): deterministic working-state snapshot
  (resume next steps + task-log tail, wiki log heads, backlog) to
  `.brain/sessions/` before compaction.
- **#6 `wrap.js`** (Stop + SessionEnd): once-per-session stop gate when wiki
  pages changed after the last `log.md` entry; SessionEnd self-heals
  `index.md` `source_count`/`page_count`/`updated` from the filesystem.
- **#7 `agent-track.js`** (PreToolUse Agent|Task): every dispatch logged to
  `.brain/sessions/agents.md`; heavy dispatches without an explicit model
  blocked once per session with the routing table (haiku triage · sonnet
  routine · main-model judgment).
- **#1 `brain-status.js`** grew the no-brain fallback: one-line `/brain:init`
  offer on startup in brainless projects; `.no-brain` marker silences forever.

Selftest grows 36 → **79 checks** (router, wrap, snapshot, agent-track,
lint scan, init scaffold, template-sync guard, no-brain offer).

## 0.3.0 — 2026-07-17 (Phase 2, hook #8: resume system)

- **Hook #8a `resume.js`** (SessionStart, matcher `startup|clear`): finds
  `resume.md` (`.brain/resume.md`, falling back to the project root — works in
  brainless projects too) and injects it with a directive to **ask the user
  whether to continue from the notes or start fresh**. Own budget (≤1,200
  tokens): task log trimmed to its tail first, narrative hard-truncated with a
  pointer to the file; the ask-directive is never dropped. Silent when no file
  exists, on resume/compact sources, and on any internal error.
- **Hook #8b `resume-log.js`** (TaskCreated / TaskCompleted / SessionEnd):
  deterministically appends one line per event to `## Task log (auto)` and
  bumps the frontmatter `updated:` stamp — zero model tokens. Inside a brain
  the first event auto-creates `resume.md` from a seed; outside a brain it only
  appends to an existing file (never litters foreign repos).
- `schema/brain-template/resume.md` seeded (with `{{PROJECT}}`/`{{DATE}}`);
  `new-brain.ps1 -Update` now adds `resume.md` to existing brains when missing
  (never overwrites live state).
- Selftest grows to 36 checks (13 new resume cases).

## 0.2.0 — 2026-07-17 (Phase 2, first tranche)

- **Hook #1 `brain-status.js`** (SessionStart): detects `.brain/` and injects a
  budgeted status block (≤3,000 tokens; whole low-priority sections drop first,
  identity/index lines never): operating manual pointer, index stats,
  unprocessed Clippings, active specs + instincts, recent log, memory pointer.
  Silent in projects without a brain.
- **Hook #3 `guards.js`** (PreToolUse on Write|Edit|MultiEdit): secret patterns
  blocked everywhere; `raw-sources/` add-only (edits to existing sources
  blocked); `wiki/log.md` append-only (insertions and `updated:` bumps only);
  architecture-tier plan gate — dormant until `specs/` exists (Phase 4).
- **Hook #4 `wiki-check.js`** (PostToolUse): self-healing wiki — missing
  frontmatter and orphan pages block back into context for same-turn fixes;
  unresolved `[[links]]` are advisory only (deliberate TODO markers stay legal,
  schema §5). Aliases and folder-qualified links resolve; code spans ignored.
- **`selftest.js`**: fixture-based end-to-end suite, 23 checks
  (`node hooks/scripts/selftest.js`).
- `lib.js`: added `readTextSafe`, `parseFrontmatter`, `listFilesRecursive`.

## 0.1.0 — 2026-07-17 (Phase 1 skeleton)

- Plugin manifest (`brain`, displayName "The Monkey Brain") and repo-root
  marketplace manifest (`monkey-brain`) — the repo doubles as its own
  marketplace.
- Node hook runtime foundation: `hooks/scripts/lib.js` (stdin JSON, `.brain/`
  discovery with graceful degradation, token estimate, hook exit-code
  protocol, self-test). `hooks/hooks.json` registered empty — hooks land in
  Phase 2.
- Placeholders documenting what lands where: `skills/` (Phase 3), `agents/`
  (Phase 3–5.5), `.mcp.json` (Phase 5 qmd).
- MIT licensed: `LICENSE` at the repo root and in `plugin/` (the copy that
  ships with installs), `license` field in both manifests.
