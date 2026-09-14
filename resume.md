---
title: "Resume — The Monkey Brain (engine)"
type: resume
updated: 2026-09-15 05:30
---

## Where we left off
**2026-09-15 — plugin v0.27.0, built on `main`, not yet committed.** Curator asked "when will
the brain ask for a commit/push?" — answer was: only on-demand (`/brain:doctor` check 7) or
inside `/brain:wrap` itself; the automatic Stop hook never checked git at all. Curator agreed
the gap was worth closing: extended `hooks/scripts/wrap.js`'s existing Stop-time reminder
pattern (unlogged-wiki-work nudge, decision-distillation nudge) with a third nudge, `gitCheck()`
— runs `git status --porcelain -- .` scoped to the brain dir (same check as `doctor.js` #7),
blocks ONCE per session pointing at `/brain:wrap` or a manual commit, and stays silent when
`.brain/` isn't in a git repo or git isn't installed. Still **advisory only** — it never runs
`git commit`/`git push` itself, same "brain records, curator acts" boundary as `pr.js` and the
MCP registry. Zero changes to `doctor.js` or any other hook. Selftest **350 → 354**.

- [ ] Commit + push v0.27.0 (holding for the curator's go-ahead — not committed automatically).

**2026-09-15 — plugin v0.26.0, built on `main`, committed (`05a1c58`), pushed to `origin/main`.**
Curator asked for **gh-based PR review integration**. Extended `/brain:review` rather than adding a new skill:
its Scope step now takes a PR number/URL and runs the new `hooks/scripts/pr.js` (wraps `gh pr
view/checks/diff`) for the PR's metadata, live CI check status and diff in one read-only call
— a green CI summary counts as the "green CI" evidence step 2 already asks for. Asked the
curator up front whether PR mode should be able to post back to GitHub (`gh pr comment`/
`review`) or stay fetch-only; chose **read-only** — `pr.js` has no write call anywhere, posting
stays a manual curator action, same posture as the MCP registry never running a `setup_hint`
itself. `pr.js` fails open with a plain-text message when `gh` is missing/unauthenticated (the
binary name is overridable via `MONKEY_BRAIN_GH_CMD`, which selftest uses to hit that path
deterministically without touching a real `gh`). **Zero changes to any core hook.** Design
written to `ROADMAP.md` first (this repo's convention), then built. Selftest **344 → 350**;
both manifests validate `--strict`. `gh` 2.96.0 is installed and authenticated on this machine.

- [ ] Dogfood PR mode against a real open PR once one exists (the authenticated fetch path
  isn't exercised in selftest, same posture as git/qmd).

**2026-09-15 — plugin v0.25.0 on `main`, pushed (8450044), CI green.** Built the **MCP
capability registry**: extends the P6 capability-plugin contract ("plugins do the craft; the
brain records the knowledge") to MCP servers. `skills/init/recommended-mcp-servers.json`
curates five launch entries — Supabase + Firebase (schema/migration/auth decisions →
`decisions/` ADRs, live shape → `wiki/entities/`), Figma + Framer (design-system decisions →
`decisions/`, same precedence as ui-ux-pro-max/frontend-design), Vercel (deploy config →
`decisions/`, live status → `projects/`) — Notion deferred (content-source shape needs a
different filing story: raw-source ingestion, not ADRs). `scripts/mcp-servers.js` renders the
curated list and detects which are already configured in a project's `.mcp.json` (excluding
the brain's own `brain-search`), with a generic "no filing rules yet" fallback for any
connected server outside the curated set — fails open on a missing/malformed `.mcp.json`.
`/brain:init` step 6b offers the set exactly like it offers plugins: never installs, never
touches a credential, just hands over `setup_hint` for the curator to run and confirm
themselves. Instance manual §9 states the same contract for both. **Zero changes to any core
hook** (`brain-status`/`guards`/`wiki-check`/`trigger-router`/`doctor`) — filing stays
advisory, picked up the same way plugin output already is. Design written to `ROADMAP.md`
first (this repo's convention — no separate spec doc), approved, then built directly.
Selftest **331 → 344**; both manifests validate `--strict`.

**2026-09-14 — plugin v0.24.0 on `main`, pushed (b0f7500), CI green.** Everything from v2
(Phases 1–9), v3 (P10–P17: recall, receipts, loops, blast radius, daily drivers, learned bans,
team mode, life packs) and v0.23.0 Home is merged on `main`. This session fixed the curator's
complaint *"the brain starts developing automatically without creating any plan"*: the
trigger-router only reached `/brain:plan` when a prompt literally said "spec", and the plan gate
in `guards.js` only fires against a spec that already exists — so "add a login feature" went
straight to code. Now the router's **last rule catches generic development intent** (dev verb
within ~60 chars of a dev noun), reads the open specs, and injects *plan before build*: no open
specs → `brain:plan` now; open specs listed with tier/phase → `brain:build <slug>` if one covers
the request, else `brain:plan` first. Questions (why/what/how…) stay silent; still advisory.
The competitor vault was re-checked for this and has the same gap (its dev triggers go straight
to coding; only its top tier hard-gates). The **hard-gate variant** (block new code files when
no open spec exists) was offered and **not adopted** — revisit only if the advisory hint gets
ignored in practice. Selftest **331 GREEN**; both manifests validate `--strict`.

- [ ] Watch whether the plan-before-build hint is actually followed in dogfood sessions; if not, add the `guards.js` hard gate (new code file + zero open specs → block).
- [x] `examples/claude-code-brain/sessions/health.json` — added `sessions/.gitignore` to the example brain (it was missing the one every scaffolded instance ships via `schema/brain-template`), matching `plugin/skills/init/brain-template` and `schema/brain-template` (a530223).
- [ ] MCP capability registry (v0.25.0) is built and tested but not yet dogfooded on a real project's `.mcp.json` with a real Supabase/Figma/etc. connection — verify the `/brain:init` step 6b offer reads well in practice.
- [ ] Notion MCP integration — deferred; needs its own design (content-source filing: raw-source ingestion via `/brain:ingest`, not `decisions/` ADRs).

### Earlier history (v2 build, 2026-07)
**P9** dogfooded the engine on a fresh scratch brain (scaffold → **lint-clean +
doctor-clean**; **7/7 enforcement gates fire**) and, in doing so, **found + fixed a real parser
bug** — escaped-pipe wikilinks in markdown tables (`[[page\|Label]]`) were false-positive
"broken" in `lint.js`/`doctor.js`/`wiki-check.js`; fixed all three, so the example brain now
lints CLEAN. Root README + `schema/CLAUDE.md` got the v2.0 pass.
**P8** shipped `/brain:doctor` — `doctor.js` runs 15 deterministic health checks (links,
orphans, stale flags, index freshness, clippings, log gaps, uncommitted, hook registration,
injection budget, semantic index, WIP, instinct queue, specs-without-tests, **open P0s**, schema
version) + model-mix, injected via `` !`…` ``; it writes `sessions/health.json` and **hook #1
brain-status surfaces open failures next session**; criticals gate wrap. Selftest 144 → **156
GREEN**. **P7** codified the product & game pipelines (`/brain:game` concept→GDD→prototype→
playtest→balance; `templates/gdd.md`; manual §10). **P6.5** shipped the product-design pack
(5-phase process + `data/` + `templates/` + `checklist.md` P0 gate). **P6** was the
bundled-plugin manifest. `skills/init/recommended-plugins.json` lists the nine capability
plugins (github, frontend-design, superpowers, security-guidance, product-tracking-skills,
code-modernization, productivity, product-management, ui-ux-pro-max), each mapped to the
`.brain/` folder its output is filed into; `scripts/plugins.js` renders the offer
(`--verbose`/`--json`); `/brain:init` step 6 offers the relevant subset and installs
model-driven via `/plugin` (never silent, skipped on `--update`); instance-manual **§9
"Capability plugins (the craft layer)"** states the contract — *plugins do the craft; the
brain records the knowledge* — with the per-plugin filing map + precedence chain. Selftest
120 → **127 GREEN**; both manifests validate `--strict`. Full history below and in
`ROADMAP.md`. — Earlier context (Phases 1–5.5, plugin v0.8.0): Phase 5
memory & context engineering landed in five per-step commits: **instinct auto-detection**
(`instinct-track.js` — 3+-session edits → `instincts/pending/` advisory), **decision
auto-distillation** (`wrap.js` Stop nudge after build/review + `brain-status` "Decisions
(the why)" surfacing + `/brain:wrap` step), **opt-in qmd semantic search**
(`qmd-mcp.js` → the `brain-search` MCP in `.mcp.json`, dormant unless `.qmd`/`MONKEY_BRAIN_QMD`
+ qmd on PATH; stdlib no-op server otherwise; SessionEnd re-index; §8 documented),
**compaction survival** (`snapshot.js` now carries active specs/projects), and
**budget-receipt groundwork** (`brain-status` writes `sessions/injection-stats.json`).
Then **Phase 5.5 model routing** (v0.8.0): `model:`/`effort:` frontmatter on all 11 skills
(judgment→main model+high effort; routine `ingest`/`research`/`build`→Sonnet; `terse`→Haiku),
two Sonnet subagents (`brain-researcher` read-only slice + `brain-librarian` batch ingest),
and fan-out patterns documented in the skills. Selftest **120/120 GREEN**; `claude plugin
validate --strict` passes. Full history: `ROADMAP.md` → Execution status + Session log.

## Task log (auto)
- [2026-07-17] ✔ P9.2 benchmark ingests + syntheses (4 commits)
- [2026-07-17] ✔ P1 plugin skeleton + MIT license
- [2026-07-17] ✔ P2 hooks #1/#3/#4 (v0.2.0, selftest green)
- [2026-07-17] ✔ P2 hook #8 resume system (v0.3.0)
- [2026-07-17] ✔ P3 core skills /brain:{init,ingest,query,lint,wrap} (v0.4.0)
- [2026-07-17] ✔ P2 complete — hooks #2/#5/#6/#7 (selftest 79/79)
- [2026-07-17] ✔ P4 schema v2 + tier gates + migration (v0.5.0, selftest 88/88)
- [2026-07-17] ✔ P3 complete — research/plan/build/review + terse/compress (v0.6.0, selftest 95/95)
- [2026-07-17] ✔ P5 complete — memory engineering: instinct-track, decision distillation, opt-in qmd MCP, snapshot specs/projects, injection receipts (v0.7.0, selftest 115/115)
- [2026-07-17] ✔ P5.5 complete — model routing frontmatter (11 skills) + brain-researcher/brain-librarian Sonnet agents + fan-out patterns (v0.8.0, selftest 120/120)
- [2026-07-18] ✔ P6 complete — bundled-plugin manifest (9 recommended plugins + plugins.js renderer + /brain:init offer + instance-manual §9 recording contract) (v0.9.0, selftest 127/127)
- [2026-07-18] ✔ P6.5 complete — product-design pack (5-phase process + data/ [Nielsen+WCAG+methods] + templates/ + checklist.md P0 gate; pack: field → /brain:wrap gate; router phrases) (v0.10.0, selftest 137/137)
- [2026-07-18] ✔ P7 complete — product & game pipelines (/brain:game concept→GDD→prototype→playtest→balance; gdd.md template; §10 manual; router game phrases) (v0.11.0, selftest 144/144)
- [2026-07-18] ✔ P8 complete — /brain:doctor 15-check health monitor (doctor.js injected; sessions/health.json surfaced by hook #1; open P0s gate wrap; model-mix; router doctor phrases) (v0.12.0, selftest 156/156)
- [2026-07-18] ✔ P9 dogfood + docs — fresh scaffold lint+doctor clean, 7/7 gates fire; fixed escaped-pipe wikilink false-positives in lint/doctor/wiki-check (example brain now clean); README + schema v2.0 pass (selftest 158/158); PR to main pending
- [2026-09-13] ✔ v3 P10–P17 + v0.23.0 Home merged and pushed to main (selftest 319)
- [2026-09-14] ✔ plan-before-build — router's last rule sends generic dev intent through /brain:plan (or /brain:build when an open spec covers it); competitor vault re-checked, same gap there (v0.24.0, b0f7500, pushed, CI green, selftest 331)
- [2026-09-14 03:06] ■ session ended (clear)
- [2026-09-14 03:08] ■ session ended (other)
- [2026-09-14 03:19] ■ session ended (other)
- [2026-09-14 03:27] ■ session ended (other)
- [2026-09-15 03:37] ■ session ended (clear)
- [2026-09-15 03:50] ■ session ended (prompt_input_exit)
- [2026-09-15 03:55] ■ session ended (other)
- [2026-09-15 04:13] ■ session ended (other)
