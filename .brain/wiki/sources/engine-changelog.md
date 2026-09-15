---
title: "Source — Engine Changelog (plugin/CHANGELOG.md)"
type: source
status: active
tags: [changelog, engine, release-history, plugin]
created: 2026-09-16
updated: 2026-09-16
raw: "../../raw-sources/engine-changelog.md"
origin: "plugin/CHANGELOG.md"
related: ["[[session-injection]]", "[[resume-system]]", "[[stop-nudges]]", "[[trigger-router]]", "[[recall-and-search]]", "[[model-routing]]", "[[plan-and-tdd-gates]]", "[[instincts-and-bans]]", "[[team-lock]]", "[[wiki-self-healing]]", "[[doctor-health-checks]]", "[[bounded-loops]]", "[[develop-lifecycle-stages]]", "[[claude-code]]", "[[github-plugin]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[engine-resume-history]]", "[[engine-roadmap]]", "[[engine-readme]]"]
aliases: ["changelog", "CHANGELOG.md"]
---

# Source — Engine Changelog (plugin/CHANGELOG.md)

> **Raw source:** [raw snapshot](../../raw-sources/engine-changelog.md) · **Origin:** `plugin/CHANGELOG.md` · **Ingested:** 2026-09-16

## TL;DR
33 releases (0.1.0 → 0.31.0, all 2026-07-17 through 2026-09-15) trace the engine from a bare
plugin skeleton to a self-dogfooding SDLC brain: hooks (8), skills/`/brain:*` verbs, tier
gates, memory engineering, v3's seven competitive gaps (recall, receipts, loops, blast-radius
sizing, daily drivers, learned bans, team mode, life packs), and — in the newest three — the
brain auditing and fixing itself (research-first routing, a correctness audit, and a token-diet
pass). Selftest count is the running quality signal: 23 → 417 checks over the series through
0.29.0/0.29.1 — this raw snapshot (up to 0.31.0) states no further count for 0.30.0 or 0.31.0,
so **the changelog is not the source of truth for the current selftest total**; past this
snapshot it kept climbing (447 then 463 at 0.30.0, 485 then 501 at 0.31.0 — review fixes add
checks within a release — then 513 at 0.32.0).

## Key takeaways
- **Self-hosting inflection at 0.28.0** (2026-09-15): the engine gets its own `.brain/` and the
  develop lifecycle is dogfooded on this repo for the first time — every release from 0.28.0
  onward is itself a `research → plan → build → review` cycle filed into this brain.
- **Two correctness passes stack on the same day** (0.30.0, 0.31.0, both 2026-09-15): a full
  health audit (`wiki/research/brain-health-audit.md`) fixed resume-file resolution, gate path
  scoping, and a health-signal false-positive; token-diet then cut always-loaded footprint
  ~38% (26.5 KB → ~16.5 KB) and added one model-routing table plus a context-size nudge.
- **v3 (P10–P17, 0.15.0–0.22.0)** closed seven gaps found in a competitive re-benchmark against
  a rival vault in one dense run on 2026-09-13: recall, real token receipts, bounded loops,
  blast-radius tier sizing, daily-driver workflows, learned bans, team mode, life packs.
- **Router correctness was fixed twice** — 0.24.0 (send generic dev intent to `/brain:plan`
  first) then 0.29.0 (send it to `/brain:research` first, plan only after) — the second
  supersedes the first's catch-all behavior; see [[trigger-router]].
- **Parser/gate bugs found by dogfooding, not design review**: 0.28.0's review found 2 P0s in
  the glob-matcher scope engine; 0.20.0 found the plan/TDD gates silently never fired on specs
  that kept the template's inline YAML comments; 0.12.1 found escaped-pipe `[[link\|label]]`
  false positives across all three link parsers.

## Release table (newest first)
| Version | Date | Headline | Subsystem |
| --- | --- | --- | --- |
| 0.31.0 | 2026-09-15 | Token diet: one model-routing table, context nudge, lighter always-loaded footprint | [[model-routing]] |
| 0.30.0 | 2026-09-15 | Brain correctness: single resume resolver, project-relative gate paths, section-aware health signal, consolidated Stop nudges | [[doctor-health-checks]] (also [[resume-system]], [[plan-and-tdd-gates]], [[stop-nudges]]) |
| 0.29.1 | 2026-09-15 | Selftest fixed for marketplace installs (schema-drift check guarded) | engine build/selftest tooling |
| 0.29.0 | 2026-09-15 | Lifecycle enters at `/brain:research` by default; curator-skip phrases enter at plan | [[trigger-router]] |
| 0.28.0 | 2026-09-15 | First dogfood of the develop lifecycle on this repo; gate scoping, review hand-off, one Stop message | [[develop-lifecycle-stages]] |
| 0.27.0 | 2026-09-15 | Automatic Stop-time uncommitted-`.brain/`-changes nudge | [[stop-nudges]] |
| 0.26.0 | 2026-09-15 | `gh`-based read-only PR review mode for `/brain:review` | [[develop-lifecycle-stages]] ([[github-plugin]]) |
| 0.25.0 | 2026-09-15 | MCP capability registry (Supabase/Firebase/Figma/Framer/Vercel filing map) | capability-plugin / MCP filing layer |
| 0.24.1 | 2026-09-14 | Plans are Markdown-only — the spec file *is* the plan, no artifact page | [[develop-lifecycle-stages]] |
| 0.24.0 | 2026-09-14 | Router catches generic dev intent and routes to `/brain:plan` before code | [[trigger-router]] / [[plan-and-tdd-gates]] |
| 0.23.0 | 2026-09-13 | Monkey Brain Home: cross-project registry + offline dashboard HTML | cross-project registry (no dedicated concept page) |
| 0.22.0 | 2026-09-13 | v3 P17: life packs — `/brain:learn` (SRS) and `/brain:career`, v3 complete | life packs (`private/`, no dedicated concept page) |
| 0.21.0 | 2026-09-13 | v3 P16: team mode — union-merged logs, `/brain:lock` | [[team-lock]] |
| 0.20.0 | 2026-09-13 | v3 P15: learned bans; fixed inline-YAML-comment gate bug | [[instincts-and-bans]] |
| 0.19.0 | 2026-09-13 | v3 P14: daily-driver workflows — digest, dump, dashboard, CI | daily-driver workflows (no dedicated concept page) |
| 0.18.0 | 2026-09-13 | v3 P13: blast-radius routing (`graph.js radius`) sizes tier + model | [[plan-and-tdd-gates]] |
| 0.17.0 | 2026-09-13 | v3 P12: bounded `/brain:loop` (spec/research/design types) | [[bounded-loops]] |
| 0.16.0 | 2026-09-13 | v3 P11: real token receipts from Claude Code transcripts | [[session-injection]] |
| 0.15.0 | 2026-09-13 | v3 P10: always-on BM25 recall; `brain-search` MCP; `/brain:brief` | [[recall-and-search]] |
| 0.14.0 | 2026-09-13 | Five capability plugins ship with `brain`; `brain-all` bundle | [[github-plugin]], [[frontend-design-plugin]], [[superpowers-plugin]], [[security-guidance-plugin]], [[code-modernization-plugin]] |
| 0.13.0 | 2026-09-13 | Terse output mode on by default | [[session-injection]] |
| 0.12.1 | 2026-07-18 | Phase 9 dogfood: fixed escaped-pipe `[[link\|label]]` false positives | [[wiki-self-healing]] |
| 0.12.0 | 2026-07-18 | Phase 8: `/brain:doctor` — 15 health checks + `sessions/health.json` surfaced next session | [[doctor-health-checks]] |
| 0.11.0 | 2026-07-18 | Phase 7: product & game pipelines (`/brain:game`, GDD template) | [[develop-lifecycle-stages]] |
| 0.10.0 | 2026-07-18 | Phase 6.5: product-design expertise pack (5-phase process, P0 checklist gate) | domain expertise pack format (no dedicated concept page) |
| 0.9.0 | 2026-07-18 | Phase 6: bundled-plugin manifest; `/brain:init` offers 9 capability plugins | [[github-plugin]], [[superpowers-plugin]] et al. |
| 0.8.0 | 2026-07-17 | Phase 5.5: model routing frontmatter + Sonnet fan-out agents | [[model-routing]] |
| 0.7.0 | 2026-07-17 | Phase 5: instinct auto-detection, decision auto-distillation, opt-in qmd, injection receipts | [[instincts-and-bans]] ([[session-injection]], [[recall-and-search]]) |
| 0.6.0 | 2026-07-17 | Phase 3 complete: research/plan/build/review skills + terse/compress | [[develop-lifecycle-stages]] |
| 0.5.0 | 2026-07-17 | Phase 4: schema v2 + TDD gate + architecture plan gate | [[plan-and-tdd-gates]] |
| 0.4.0 | 2026-07-17 | Core skills (`init/ingest/query/lint/wrap`) + hooks #2/#5/#6/#7 complete | [[trigger-router]] ([[wiki-self-healing]]) |
| 0.3.0 | 2026-07-17 | Phase 2: resume system (hooks #8a/#8b) | [[resume-system]] |
| 0.2.0 | 2026-07-17 | Phase 2 first tranche: status injection, guards, self-healing wiki-check | [[wiki-self-healing]] |
| 0.1.0 | 2026-07-17 | Phase 1: plugin skeleton, hook runtime foundation, MIT license | plugin skeleton (no dedicated concept page) |

## Concepts and entities this touches
- [[model-routing]] — introduced 0.8.0 (per-skill `model`/`effort` frontmatter), consolidated
  into one table by 0.31.0 (token diet); the "never switch model mid-thread" rule is stated
  once now.
- [[resume-system]] — built 0.3.0; 0.30.0 fixed `lib.resumePath()` to a single resolver so a
  seeded brain doesn't shadow an older root `resume.md`.
- [[stop-nudges]] — 0.4.0 wrap Stop gate → 0.27.0 adds a git-uncommitted nudge → 0.28.0
  consolidates all three into one message → 0.30.0 fixes which writes they should ignore.
- [[trigger-router]] — 0.4.0 first router hook → 0.24.0 catches generic dev intent → 0.29.0
  flips the default entry point to research (supersedes 0.24.0's plan-first catch-all).
- [[recall-and-search]] — 0.15.0 built-in BM25 + `brain-search` MCP, replacing the earlier
  0.7.0 opt-in-only qmd wrapper as the default (qmd becomes an upgrade past ~100 pages).
- [[plan-and-tdd-gates]] — 0.5.0 introduces both gates; 0.18.0 adds blast-radius tier sizing;
  0.20.0 fixes a bug where inline YAML comments silently disabled both gates; 0.28.0 adds
  `scope:` globs so open specs don't cross-block; 0.30.0 fixes gate path-scoping on Windows.
- [[instincts-and-bans]] — 0.7.0 instinct auto-detection → 0.20.0 learned bans (`ban:`,
  `enforce: warn|block`) and the instinct queue with confidence/promote/stale.
- [[team-lock]] — 0.21.0, v3 P16: union-merge git attributes + `/brain:lock`.
- [[wiki-self-healing]] — 0.2.0 `wiki-check.js` → 0.12.1 fixes escaped-pipe link false
  positives across lint/doctor/wiki-check.
- [[doctor-health-checks]] — 0.12.0 ships 15 checks → 0.16.0 grows to 18 → 0.30.0 makes the
  open-P0 signal section-aware (fixed findings stop counting as critical).
- [[bounded-loops]] — 0.17.0, v3 P12: spec/research/design loop types with livelock/stall/tick
  guards and plan-gate escalation to `sessions/review-required.md`.
- [[develop-lifecycle-stages]] — 0.6.0 ships the four skills → 0.11.0 layers product/game
  pipelines on top → 0.24.1 fixes "the spec *is* the plan" → 0.28.0 is the lifecycle's first
  self-dogfood, fixing its own hand-offs.
- Entities [[claude-code]] (the host — resume/context/transcript integration throughout),
  [[github-plugin]] (0.26.0 PR review, 0.14.0 bundling), [[frontend-design-plugin]],
  [[superpowers-plugin]], [[security-guidance-plugin]], [[code-modernization-plugin]] (all
  four bundled at 0.14.0; `code-modernization` moved to opt-in offer at 0.31.0's token diet).

## Contradictions / notes
> ⚠️ [[engine-resume-history]] (the `resume.md` narrative snapshot) stops at v0.29.1
> (`updated: 2026-09-15 10:15`) and never narrates 0.30.0 or 0.31.0 — both released later the
> same day per this changelog and per `git log` (`build: token-diet (0.31.0)` and
> `review: brain-correctness … (0.30.0)` are the two most recent commits before this ingest).
> Treat the resume narrative's "current state" claims (417 selftest, v0.29.1 installed) as
> **stale** relative to this changelog; the changelog is authoritative for version/selftest
> counts.
> ⚠️ 0.29.0 (research-first default) functionally supersedes 0.24.0's "plan before build"
> catch-all — same router rule, opposite default entry stage. Not a contradiction in the
> source, just a documented policy reversal worth flagging on [[trigger-router]].

## Sources
[raw snapshot](../../raw-sources/engine-changelog.md) · cross-checked against
[[engine-resume-history]] and git log at ingest time (2026-09-16). See also [[engine-roadmap]],
[[engine-readme]].
