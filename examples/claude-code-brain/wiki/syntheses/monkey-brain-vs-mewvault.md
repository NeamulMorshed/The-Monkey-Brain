---
title: "Monkey Brain v2 vs the Benchmarks (MewVault · Caveman · ui-ux-pro-max)"
type: synthesis
status: active
tags: [comparison, competitive-analysis, enforcement, token-discipline, expertise-packs, roadmap]
created: 2026-07-17
updated: 2026-07-17
sources: ["[[mewvault-readme]]", "[[caveman-readme]]", "[[ui-ux-pro-max-readme]]", "[[llm-wiki]]"]
related: ["[[mewvault]]", "[[caveman]]", "[[ui-ux-pro-max]]", "[[domain-expertise-packs]]", "[[llm-wiki-pattern]]", "[[hooks]]", "[[claude-md-vs-skills-vs-hooks]]"]
aliases: ["monkey brain vs mewvault", "v2 competitive analysis", "the benchmarks"]
question: "What does each studied benchmark solve, what does Monkey Brain v2 adopt from each, and where does it beat them?"
---

# Monkey Brain v2 vs the Benchmarks

The filed-back research behind the engine's `ROADMAP.md` v0.2 (repo root — outside this
vault). Three tools were ingested as benchmarks, each the best-in-class at exactly one thing.
The competitive triangle: **[[mewvault]] enforces quality · [[caveman]] enforces economy ·
the [[llm-wiki-pattern]] compounds knowledge** — Monkey Brain v2 is one portable plugin doing
all three, with [[ui-ux-pro-max]] defining the [[domain-expertise-packs|expertise-pack]]
format it generalizes.

## The triangle

| Benchmark | Superpower | Blind spot |
| --- | --- | --- |
| [[mewvault]] | **Enforcement over advice**: 7 lifecycle [[hooks]], OS-level gates (plan/TDD/audit/secrets/immutability), tiers, 15-check doctor, 3k budgeted injection | One fixed workspace; its wiki is a session-end **synced read layer**, not compiled knowledge |
| [[caveman]] | **Token economy with receipts**: ~65% output compression, ~46% permanent memory-file compression, honest accounting | Output-side only; brings no knowledge model and no enforcement |
| [[ui-ux-pro-max]] | **Packaged domain expertise**: 161 reasoning rules + data + BM25 + anti-patterns + checklist, auto-activating | **Frozen at publish** — recommendations never learn from use |

## What v2 adopts, traced to sources

- From [[mewvault-readme]] — `PreToolUse` gates as the quality floor; the **3,000-token
  budgeted, cache-aware injection** (static first, drop whole sections over budget); project
  **tiers** scaling gate strictness; the **instinct** pipeline (corrections → rules);
  spec-driven ACs (AC-1…, Given/When/Then) with verified wrap; the doctor pattern; and the
  hard-won cache rule: *optimize by injecting less, never by transforming the prompt.*
- From [[caveman-readme]] — `/brain:compress` (permanent memory-file input savings),
  `/brain:terse` (output mode), savings **receipts** in the doctor, and the **compression
  guard**: terseness applies to prose, never to code/commands/errors/specs.
- From [[ui-ux-pro-max-readme]] — the pack anatomy (`SKILL.md + data/ + templates/ +
  checklist.md`), BM25-in-a-skill ([[search-tooling]]), industry anti-pattern lists (which
  seed instincts), and the pre-delivery checklist as a wrap gate.

## Where v2 differentiates (the scorecard)

| Dimension | MewVault | Monkey Brain v2 |
| --- | --- | --- |
| Portability | Fixed workspace of silos | **Plugin — any repo, any machine; `.brain/` travels with the project's git** |
| Knowledge | Wiki synced at session end | **Compile-time [[llm-wiki-pattern|LLM wiki]]: cross-links, contradiction flags, provenance frontmatter at ingest** |
| Token economy | 3k budget injection | Budget injection **+ Caveman-style output/memory compression + deferred [[mcp-tool-search|MCP tools]]** |
| Enforcement | 7 hooks, hard gates | Same gate set **+ self-healing wiki checks (PostToolUse fixes in-turn)** |
| Capability breadth | Impeccable design + Godot | **Bundled marketplace plugins routed by task type + compounding [[domain-expertise-packs]]** |
| Model economics | Requires naming a model per dispatch | **Routing policy (right model by default) + parallel fan-out + cost receipts** |
| Activation | Phrase triggers | **Five layers: triggers + description matching + path matching + always-on gates + deferred depth** |
| Cross-project learning | One workspace, shared by design | **Federated instances + upstream promotion — learnings propagate via the engine, knowledge never bleeds** |

## The one-line reconciliation

MewVault proves rules must be [[hooks|hooks]], not prose ([[claude-md-vs-skills-vs-hooks]]).
Caveman proves economy needs receipts, not vibes. ui-ux-pro-max proves expertise can ship as
data + search. The [[llm-wiki-pattern]] proves knowledge should compile, not retrieve. v2's
bet is that these four are **complementary mechanisms of one engine**, not competing products.

## Sources
- [[mewvault-readme]], [[caveman-readme]], [[ui-ux-pro-max-readme]], [[llm-wiki]]
