---
title: "Index — The Monkey Brain (engine)"
type: index
status: active
tags: [index, navigation, moc]
created: 2026-09-15
updated: 2026-09-16
source_count: 4
page_count: 33
---

# 🐵 The Monkey Brain (engine) — Index

The content catalog for this brain. **Read this first** on any query to locate pages, then drill
in. Updated on every ingest. Chronological view: [[log]]. Live tables: [[dashboard]].

> **Stats:** 4 sources · 33 pages · created 2026-09-15.

The engine's own knowledge base: its roadmap, README, changelog and resume history (sources),
one page per subsystem (concepts), Claude Code and the capability plugins (entities), and the
develop-lifecycle runs that changed it (research, reviews, ADRs).

---

## 📥 Sources
Dated snapshots (2026-09-16) of the engine's own documents.
- [[engine-roadmap]] — `ROADMAP.md`: phases 1–9, v3 (P10–P17), post-v3 work, design principles, the execution tracker
- [[engine-readme]] — root `README.md`: what the engine is, quickstart, features, the plugin set
- [[engine-changelog]] — `plugin/CHANGELOG.md`: every release, what changed and why
- [[engine-resume-history]] — the root `resume.md` narratives up to 0.29.1, before the resume moved into the brain

## 🧠 Concepts
How the engine works, one subsystem per page.
- [[session-injection]] — `brain-status.js`: the budgeted session-start status block, terse rules, receipts
- [[resume-system]] — `resume.js` / `resume-log.js` / `snapshot.js` and the one resume resolver
- [[stop-nudges]] — `wrap.js`: the one Stop message (log · decisions · git) and SessionEnd self-heal
- [[trigger-router]] — `trigger-router.js`: prompt → `/brain:*` routing, research-first entry, skip phrases
- [[recall-and-search]] — `search.js`, `search-mcp.js`, `recall.js`: BM25 recall, `brain_brief`, the context nudge
- [[model-routing]] — the manual §5 table, `agent-track.js`, fork-not-switch, the outcome ledger
- [[plan-and-tdd-gates]] — `guards.js`: plan gate, TDD gate, scope globs, raw-sources and log guards, secrets
- [[instincts-and-bans]] — `instincts.js`, `instinct-track.js`, `bans.js`: learned rules and enforced patterns
- [[team-lock]] — `lock.js`: the committed, expiring `LOCK.md`
- [[wiki-self-healing]] — `wiki-check.js` + `lint.js`: links, orphans, frontmatter, the shared link index
- [[doctor-health-checks]] — `doctor.js`: the 19 checks and `sessions/health.json`
- [[bounded-loops]] — `loop.js`: build / research / design loops that know when to stop
- [[develop-lifecycle-stages]] — research → plan → build → review → wrap, the gates and hand-offs

## 🏷️ Entities
- [[claude-code]] — the host: hooks, skills, subagents, plugins, MCP, prompt caching
- [[github-plugin]] — bundled capability plugin: PRs, issues, CI (its MCP needs a token)
- [[frontend-design-plugin]] — bundled capability plugin: UI builds
- [[superpowers-plugin]] — bundled capability plugin: brainstorming, TDD, debugging, plans
- [[security-guidance-plugin]] — bundled capability plugin: security patterns and review (needs Python 3.10+)
- [[code-modernization-plugin]] — offered capability plugin: legacy discovery and migration

## 🔬 Syntheses
- [[develop-lifecycle-fixes-review]] — AC-by-AC verification of the lifecycle fixes; 2 P0 / 1 P1 / 5 P2 found and fixed in review (2026-09-15)
- [[research-first-routing-review]] — AC-by-AC verification of research-first routing; 0 P0 / 6 P1 / 4 P2 found and fixed in review (2026-09-15)
- [[brain-correctness-review]] — AC-by-AC verification of brain correctness (0.30.0); 0 P0 / 2 P1 / 4 P2 found, fixed in review (2026-09-15)
- [[token-diet-review]] — AC-by-AC verification of the token diet (0.31.0); 0 P0 / 3 P1 / 9 P2, fixed in review; only `build` forks (2026-09-16)
- [[engine-knowledge-review]] — AC-by-AC verification of engine knowledge (0.32.0); 0 P0 / 3 P1 / 13 P2, code and 14 pages fixed in review (2026-09-16)

## 📐 Decisions
- [[fork-not-switch-model-routing]] — change model by forking or dispatching, never by switching the main thread; only `build` forks (2026-09-15, amended 2026-09-16)
- [[links-resolve-across-records]] — wikilinks resolve across wiki pages and spec, decision and project records; one shared index (2026-09-16)
- [[router-ignores-questions-and-reports]] — the router acts on the curator's instructions only: questions, pasted reports and incidental nouns never route (2026-09-16)
- [[research-first-entry-is-advisory]] — the lifecycle enters at research by default, as a routing default with a curator skip, not a gate (2026-09-15)
- [[spec-scope-globs-gate-ownership]] — specs claim the files their gates own via `scope:` globs; unclaimed paths fall back to every open spec (2026-09-15)
- [[one-stop-message-for-wrap-nudges]] — the three Stop-time reminders block once, together (2026-09-15)
- [[resume-resolver-prefers-real-narrative]] — one resume file for every hook, chosen by a real narrative before location; a seed stays silent (2026-09-15)
- [[model-block-every-dispatch]] — every unpinned main-model dispatch is blocked, forks exempt; fork phantoms leave no ledger line (2026-09-15)

## 🧪 Research
- [[develop-lifecycle-dogfood]] — does research → plan → build → review → loop → wrap work end to end on this repo; 16 cited findings, 4 fixes recommended (2026-09-15)
- [[research-first-entry]] — why generic dev intent enters at plan, not research; 13 findings, recommends a research-first router default with an explicit curator skip (2026-09-15)
- [[brain-health-audit]] — full audit of standard, hooks, skills, MCP, dependency plugins, token cost and model routing; 2 P0 / 8 P1 / 15 P2, three specs recommended (2026-09-15)
