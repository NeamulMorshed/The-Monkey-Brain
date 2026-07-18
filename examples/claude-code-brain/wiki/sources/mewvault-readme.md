---
title: "Source — MewVault README"
type: source
status: active
tags: [mewvault, enforcement, hooks, gates, tiers, memory, workspace]
created: 2026-07-17
updated: 2026-07-17
raw: "../../raw-sources/MewVault README.md"
origin: "https://github.com/mewking2099/MewVault"
related: ["[[mewvault]]", "[[hooks]]", "[[claude-md-vs-skills-vs-hooks]]", "[[memory]]", "[[monkey-brain-vs-mewvault]]"]
aliases: ["mewvault readme"]
---

# MewVault README

> **Raw source:** [MewVault README.md](../../raw-sources/MewVault%20README.md) · **Origin:** github.com/mewking2099/MewVault · **Ingested:** 2026-07-17

## TL;DR
A "federated AI workspace for Claude Code": independent git silos, automatic session-start
context injection, and — its defining trait — **enforcement over advice**: hard `PreToolUse`
gates Claude cannot talk its way past. "Plain English in, verified work out." Ingested as the
**quality-enforcement benchmark** for the Monkey Brain v2 roadmap (see
[[monkey-brain-vs-mewvault]]).

## Key takeaways
- **Seven lifecycle [[hooks]]** registered once (`mew harness install`): session-start
  (`UserPromptSubmit`: context injection first prompt only, trigger routing, doctor spawn),
  session-end (`Stop`: auto-wrap log, wiki sync, memory indexing), pre-tool-use (all gates),
  agent-track ×2 (`PreToolUse` Task: dispatch ledger + model gate; `SubagentStop`: completion
  log), post-tool-use (activity tracking, correction signals, design guard), pre-compact
  (semantic snapshot before [[compaction]]).
- **The gates** (every one an OS-level block): plan-approval (no code on architecture tier
  until `plan_approved: true`), TDD (no source file without a test, derived from the spec's
  acceptance criteria), design audit (no handoff with `open_p0 > 0`), secrets patterns
  (`sk-`, `ghp_`, `AKIA`), immutability (`raw/` and direct wiki writes blocked), model routing
  (agent dispatches must name a model), UI anti-pattern bans (flagged back into context).
- **Token budget:** the first prompt gets ONE context block hard-capped at **3,000 tokens**.
  Static content (rules, persona) leads so it hits the prompt cache; dynamic (status,
  instincts, health) follows. Over budget → whole low-priority sections drop; trigger
  instructions and the session card are never truncated. Later prompts inject nothing but
  matched triggers.
- **Prompt-cache postmortem rule** (learned "the expensive way"): never put a
  compressing/rewriting proxy between Claude Code and the API — cache reads cost ~0.1× input;
  anything that mutates the prompt prefix re-bills the whole conversation every turn.
  **"Optimize by injecting less, never by transforming the prompt."**
- **No commands to memorise:** natural phrases ("standup", "wrap up", "spec user-billing",
  "doctor", "weekly review") detected by the session hook and routed to workflows/CLI.
- **Project tiers** with matching gate strictness: *pounce* (<2h, TDD warns), *stalk*
  (multi-session; verbal plan approval, TDD blocks), *mewking* (architecture/risky; hard plan
  gate, two blocked attempts auto-write `REVIEW_REQUIRED.md`).
- **Spec-driven development:** brief → `specs/<feature>.md` with numbered acceptance criteria
  (AC-1…, Given/When/Then) → *your* approval → tests from the criteria → implementation until
  green → verified wrap ("AC-1 ✓ AC-2 ✓", typecheck/lint/test/build; failures tag the log
  `[incomplete]`) → CI as the final verifier.
- **Semantic memory:** SQLite-vec + Ollama embeddings exposed as an [[mcp|MCP]] server;
  auto re-indexed on wiki sync; every session instructed to *consult memory before
  substantive work*.
- **Instinct system:** 3+ rapid rewrites of the same file → candidate rule in
  `instincts/pending/` (deduped, queue capped); promoted instincts inject at every session
  start. Corrections become rules.
- **15-check doctor** runs detached on the first prompt; problems notify the OS and inject a
  `## Vault Health` section into the *next* session. Checks are token-health-first: cache
  safety, cache-hit ratio from real transcripts, injection size (it runs the hook and
  measures), WIP limits (max 3 active projects, none idle 21+ days), index freshness.
- **MewWiki** is the Obsidian **read layer** — decisions/logs/knowledge flow into it at
  session end and get semantically indexed. You browse it; Claude maintains it.

## Concepts this touches
- [[hooks]] / [[hook-events]] — a production seven-hook enforcement architecture
- [[claude-md-vs-skills-vs-hooks]] — "guardrails belong in hooks" validated at workspace scale
- [[memory]] — semantic memory + the instinct pipeline as additional memory tiers
- [[context-window]] — the 3k budgeted, cache-aware injection order
- [[compaction]] — pre-compact semantic snapshots
- [[mcp]] / [[subagents]] — memory as MCP server; dispatch ledger + model gate

## Contradictions / notes
> ⚠️ Design difference, not contradiction: MewVault **syncs** its wiki at session end (mewwiki
> is a read layer); the [[llm-wiki-pattern]] **compiles** knowledge at ingest time with
> cross-links, contradiction flags, and provenance frontmatter. The Monkey Brain v2 roadmap
> adopts MewVault's gates, budgeted injection, tiers, instincts, and doctor — while keeping
> compile-time knowledge and adding plugin portability. Full scorecard:
> [[monkey-brain-vs-mewvault]].

## Pages updated on ingest
- [[index]], [[mewvault]], [[hooks]], [[claude-md-vs-skills-vs-hooks]], [[memory]], [[entities]]
