---
title: "Source — Engine Resume History (resume.md narrative)"
type: source
status: active
tags: [resume, session-history, engine, narrative, curator-decisions]
created: 2026-09-16
updated: 2026-09-16
raw: "../../raw-sources/engine-resume-history.md"
origin: "resume.md"
related: ["[[trigger-router]]", "[[develop-lifecycle-stages]]", "[[plan-and-tdd-gates]]", "[[doctor-health-checks]]", "[[stop-nudges]]", "[[recall-and-search]]", "[[github-plugin]]", "[[research-first-entry]]", "[[develop-lifecycle-dogfood]]", "[[research-first-routing-review]]", "[[develop-lifecycle-fixes-review]]", "[[brain-correctness-review]]", "[[brain-health-audit]]", "[[research-first-routing]]", "[[develop-lifecycle-fixes]]", "[[brain-correctness]]", "[[token-diet]]", "[[engine-changelog]]", "[[engine-roadmap]]"]
aliases: ["resume.md", "resume history"]
---

# Source — Engine Resume History (resume.md narrative)

> **Raw source:** [[engine-resume-history]] · **Origin:** `resume.md` · **Ingested:** 2026-09-16

## TL;DR
The root `resume.md`'s "Where we left off" narrative, in the curator's/maintainer's own prose,
up to **v0.29.1** (`updated: 2026-09-15 10:15`). It covers five same-day 2026-09-15 sessions
(0.29.1 → 0.28.0 → 0.27.0 → 0.26.0 → 0.25.0, newest first) plus a compressed "earlier history"
paragraph for the whole v2 build (2026-07, P1–P9) and v0.24.0/v0.24.1's router fix, then an
auto-appended task log of session-end markers. It is **stale**: two more releases (0.30.0,
0.31.0) shipped after this file's last update — see Contradictions.

## Key takeaways
- **The lifecycle audits itself, live, in-session** — every 2026-09-15 entry (down to 0.25.0)
  is written as `/brain:research` → `/brain:plan` → `/brain:build` → `/brain:review`, each
  stage's actual output cited inline (spec names, ADR names, P0/P1/P2 counts), not just a
  changelog restatement — [[develop-lifecycle-stages]] and [[develop-lifecycle-dogfood]].
- **Curator decisions are recorded in first person**, not paraphrased: "by default the brain
  should start from research for this life cycle; if a user doesn't want to research they can
  skip this" (0.29.0, [[research-first-entry]]); "dogfood the lifecycle itself" (0.28.0,
  choosing `scope:` globs over workstream matching); PR review should be "read-only" — no
  `gh pr comment`/`review` (0.26.0), same posture as the MCP registry never running its own
  `setup_hint` (0.25.0).
- **A recurring open item survives at least three sessions unresolved**: "Doctor/lint check 1
  counts wiki `[[links]]` to `decisions/`/`specs/` as broken — spec it" appears verbatim in the
  v0.29.1, v0.28.0, *and* v0.24.0 entries and is never checked off in this file.
- **"Dogfood debts" is a standing category**: PR-review mode on a real open PR, and the MCP
  registry against a real `.mcp.json`, are logged as built-but-unverified across four separate
  session entries (0.29.1, 0.28.0, 0.26.0, and the older 0.24.0/0.25.0 entry) — the feature
  shipping and the feature being exercised for real are tracked as distinct done-states.
- Selftest count climbs 331 → 417 across the file's span, matching [[engine-changelog]]'s count
  for the same versions.

## Timeline (newest first, as narrated)

| Session (dated) | What ran | Curator decision / framing (own words where quoted) | Open next steps *at the time* |
| --- | --- | --- | --- |
| **2026-09-15, v0.29.1** | Pushed + reinstalled v0.29.0; installed cache's selftest threw ENOENT (AC-8 drift check read `schema/`, absent from marketplace installs); guarded, shipped 0.29.1 | Fix-forward, no new decision | Watch research-first default in real sessions, extend `SKIP_RE`; doctor/lint check-1 link-scope; PR/MCP dogfood debts |
| **2026-09-15, v0.29.0** | `/brain:research` (2 slices → [[research-first-entry]]) → `/brain:plan` (`specs/research-first-routing.md`, feature tier, 10 ACs, approved as drafted) → `/brain:build` (19 red→green) → `/brain:review` (opus + live probes: 0 P0, 6 P1, 4 P2, all fixed) → spec closed `done` | *"by default the brain should start from research for this life cycle; if a user doesn't want to research they can skip this"* — router's catch-all flips from plan-first (0.24.0) to research-first | (rolled into the 0.29.1 entry above) |
| **2026-09-15, v0.28.0** | First-ever `/brain:init` scaffold of `.brain/` **on the engine repo itself**; `/brain:research` (3 slices, 16 findings → [[develop-lifecycle-dogfood]]) → `/brain:plan` (`specs/develop-lifecycle-fixes.md`, feature tier, 12 ACs) → `/brain:build` (red 15 → green) → `/brain:review` (opus adversarial: **2 P0** in the glob matcher, 1 P1, 5 P2, all fixed) → spec `done` | *"dogfood the lifecycle itself"*; chose `scope:` globs over workstream matching for gate scoping | Push v0.28.0 ✅ same session; reinstall locally ✅; doctor/lint check-1 link-scope; PR/MCP dogfood debts |
| **2026-09-15, v0.27.0** | Extended `wrap.js`'s Stop nudge with a third check, `gitCheck()` | Answered the curator's own question — *"when will the brain ask for a commit/push?"* — by closing the gap: previously only on-demand (`/brain:doctor` #7) or inside `/brain:wrap` | Commit + push v0.27.0 — done same day, folded into the 0.28.0 push |
| **2026-09-15, v0.26.0** | Extended `/brain:review`'s Scope step with `pr.js` (wraps `gh pr view/checks/diff`) | Curator asked for gh-based PR review; explicitly asked read-only vs. posting-back and **chose read-only** — no write call anywhere in `pr.js`; design written to `ROADMAP.md` first (repo convention) | Dogfood PR mode against a real open PR once one exists |
| **2026-09-15, v0.25.0** | Built the MCP capability registry (`recommended-mcp-servers.json`, `mcp-servers.js`, `/brain:init` step 6b) | Extends the P6 capability-plugin contract to MCP servers; Notion deferred as a design call (content-source shape needs raw-source ingestion, not ADRs) | (folded into 0.24.0 entry's open list below) |
| **2026-09-14, v0.24.0** | Router's last rule catches generic dev intent → routes to `/brain:plan` first | Fixed the curator's complaint *"the brain starts developing automatically without creating any plan"*; a hard-gate variant (block new code with zero open specs) was **offered and explicitly not adopted** — "revisit only if the advisory hint gets ignored in practice" | Watch whether the hint is followed (else add hard gate) — *superseded* by 0.29.0's research-first redesign, not literally resolved; MCP registry not yet dogfooded on a real `.mcp.json`; Notion MCP deferred |
| **Earlier v2 build, 2026-07 (P1–P9)** | Condensed in the file itself: P9 dogfood found + fixed the escaped-pipe wikilink bug (example brain now lints clean, 7/7 gates fire); P8 shipped `/brain:doctor` (15 checks, `sessions/health.json` surfaced next session); P7 product/game pipelines; P6.5 product-design pack; P6 bundled-plugin manifest; P5.5 model routing + two Sonnet subagents; P5 memory engineering (instinct-track, decision distillation, opt-in qmd, snapshot, injection receipts) | No single quoted decision; narrated as a phase checklist | (see task log) |

## Status of open items, checked against [[engine-changelog]]
- ✅ **Done**: pushing/reinstalling v0.24.0 → v0.29.1 (each session's own push/reinstall
  checkbox) — confirmed by the changelog's version sequence and matching selftest counts.
- ✅ **Done**: `examples/claude-code-brain/sessions/health.json` gitignore parity (checked off
  in the v0.24.0 entry itself).
- 🔁 **Superseded, not literally resolved**: "watch whether plan-before-build is followed, else
  hard-gate it" (0.24.0) — 0.29.0 replaced the mechanism (research-first entry) rather than
  hard-gating the old one; the changelog never records the hard-gate variant being built.
- ⏳ **Still open as of this source's own last entry, and not closed by any later changelog
  entry through 0.31.0**: doctor/lint check-1 counting `decisions/`/`specs/` links as broken;
  PR-review-mode and MCP-registry "real-world" dogfood debts; Notion MCP integration (deferred,
  no design started); watching the research-first default's phrasing coverage (`SKIP_RE`).
- ➕ **Resolved by releases this narrative never reached**: v0.30.0's brain-correctness audit
  (`wiki/research/brain-health-audit.md`, see [[brain-health-audit]] and
  [[brain-correctness-review]]) fixes the resume-resolver and gate-path-scoping classes of bug
  this very file's mechanism depends on; v0.31.0 ([[token-diet]]) is a further pass this
  narrative has no entry for at all.

## Contradictions / notes
> ⚠️ **This raw source is stale relative to [[engine-changelog]].** `resume.md`'s last
> `updated:` stamp is 2026-09-15 10:15 and its narrative ends at v0.29.1; the changelog records
> two further same-day releases, v0.30.0 (brain correctness) and v0.31.0 (token diet), plus
> specs [[brain-correctness]] and [[token-diet]] and reviews [[brain-correctness-review]]. Any
> "current state" read from this file alone (selftest 417, v0.29.1 installed, open items as
> listed above) should be treated as a snapshot in time, not the brain's present state — read
> [[engine-changelog]] for the current version.
> ⚠️ The recurring "doctor/lint check-1 link-scope" and "dogfood debts" open items, repeated
> verbatim across three-plus sessions in this file, never gained a spec name in the visible
> narrative — worth flagging on [[plan-and-tdd-gates]]/[[doctor-health-checks]] as backlog items
> the lifecycle itself hasn't yet routed through `/brain:plan`.

## Sources
[[engine-resume-history]] (raw) · cross-checked against [[engine-changelog]] and (for the
sessions it narrates) [[research-first-entry]], [[develop-lifecycle-dogfood]],
[[research-first-routing-review]], [[develop-lifecycle-fixes-review]] at ingest time
(2026-09-16). See also [[engine-roadmap]].
