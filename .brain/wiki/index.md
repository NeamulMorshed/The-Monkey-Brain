---
title: "Index — The Monkey Brain (engine)"
type: index
status: active
tags: [index, navigation, moc]
created: 2026-09-15
updated: 2026-09-15
source_count: 0
page_count: 8
---

# 🐵 The Monkey Brain (engine) — Index

The content catalog for this brain. **Read this first** on any query to locate pages, then drill
in. Updated on every ingest. Chronological view: [[log]]. Live tables: [[dashboard]].

> **Stats:** 0 sources · 8 pages · created 2026-09-15.

So far this brain records the engine's own develop-lifecycle runs (research, reviews, ADRs) and
one full health audit. It holds no compiled sources yet — the engine's ROADMAP, README and hook
architecture are the first ingest candidates ([[brain-health-audit]] finding 6).

---

## 📥 Sources
_None yet._

## 🧠 Concepts
_None yet._

## 🏷️ Entities
_None yet._

## 🔬 Syntheses
- [[develop-lifecycle-fixes-review]] — AC-by-AC verification of the lifecycle fixes; 2 P0 / 1 P1 / 5 P2 found and fixed in review (2026-09-15)
- [[research-first-routing-review]] — AC-by-AC verification of research-first routing; 0 P0 / 6 P1 / 4 P2 found and fixed in review (2026-09-15)
- [[brain-correctness-review]] — AC-by-AC verification of brain correctness (0.30.0); 0 P0 / 2 P1 / 4 P2 found, fixed in review (2026-09-15)

## 📐 Decisions
- [[research-first-entry-is-advisory]] — the lifecycle enters at research by default, as a routing default with a curator skip, not a gate (2026-09-15)
- [[spec-scope-globs-gate-ownership]] — specs claim the files their gates own via `scope:` globs; unclaimed paths fall back to every open spec (2026-09-15)
- [[one-stop-message-for-wrap-nudges]] — the three Stop-time reminders block once, together (2026-09-15)
- [[resume-resolver-prefers-real-narrative]] — one resume file for every hook, chosen by a real narrative before location; a seed stays silent (2026-09-15)
- [[model-block-every-dispatch]] — every unpinned main-model dispatch is blocked, forks exempt; fork phantoms leave no ledger line (2026-09-15)

## 🧪 Research
- [[develop-lifecycle-dogfood]] — does research → plan → build → review → loop → wrap work end to end on this repo; 16 cited findings, 4 fixes recommended (2026-09-15)
- [[research-first-entry]] — why generic dev intent enters at plan, not research; 13 findings, recommends a research-first router default with an explicit curator skip (2026-09-15)
- [[brain-health-audit]] — full audit of standard, hooks, skills, MCP, dependency plugins, token cost and model routing; 2 P0 / 8 P1 / 15 P2, three specs recommended (2026-09-15)
