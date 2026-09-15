---
title: "Recall and Search"
type: concept
status: active
tags: [search, recall, bm25, mcp, context-management]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]"]
related: ["[[trigger-router]]", "[[model-routing]]", "[[session-injection]]", "[[resume-system]]", "[[stop-nudges]]", "[[claude-code]]", "[[token-diet]]"]
aliases: [search.js, search-mcp.js, recall.js, brain_search, brain_brief, brain-search MCP]
---

# Recall and Search

The brain's built-in, always-on recall layer (P10, v0.15.0 — [[engine-roadmap]]): a pure-Node
BM25 index over the compiled brain, served both as an MCP tool pair and injected automatically
on a session's first prompt. No install, no re-indexing — it reads the files fresh on every
call. qmd (`reference.md` §8) is the opt-in vector-search upgrade past ~100 sources.

## How it works
- **`search.js`** (`plugin/hooks/scripts/search.js`) indexes `wiki/`, `decisions/`, `specs/`,
  `projects/`, `memory/` (`LAYERS`, `:22`), explicitly skipping `wiki/index.md`, `wiki/log.md`,
  `wiki/dashboard.md` and any `templates/` path (`:23,57`) — every hit is a compiled page with
  provenance, never a hub or a template. Classic BM25 (`K1=1.2`, `B=0.75`, `:29-30,75-98`) over
  term-frequency maps built per doc, title weighted ×3 and tags/aliases ×2 over body ×1
  (`:61-66`). `search(brain, query, {limit})` returns ranked hits with a best-matching-paragraph
  snippet (`bestBlocks`, `:110-117`); `brief(brain, topic, {budget})` packs the best 1-2
  excerpts per page into a token budget (default 2000, `:141-165`), stopping before it would
  need to truncate a page that already contributed. CLI: `node search.js "<query>" [--limit N]
  [--json]` and `--brief "<topic>" [--budget N]`.
- **`search-mcp.js`** is the `brain-search` MCP server (stdio, newline-delimited JSON-RPC 2.0).
  With a `.brain/` present it serves two tools: `brain_search` (ranked pages + snippets, limit
  1-20) and `brain_brief` (a ≤~2k-token cited pack) — both thin wrappers over `search.js`
  (`callTool`, `:113-133`). Without a brain it exposes **zero tools and no instructions**
  (`:152`), so brainless projects pay nothing. `qmdInstalled()` (`:66-77`) does a shell-free
  PATH/PATHEXT scan (a Windows shell can report `qmd` present when it is absent) and, when the
  brain has opted in, `handoff()` (`:85-89`) spawns the real `qmd mcp` and hands it the stdio
  channel, falling back to the built-in server on spawn error.
- **`recall.js`** is hook logic on `UserPromptSubmit` with two independent jobs:
  1. **First-prompt recall** (`recall()`, `:80-98`): on a session's first natural-language
     prompt (temp-dir marker per `session_id`), if the prompt yields ≥2 meaningful terms,
     searches the brain and injects up to 3 matches (`matched >= 2`) as title/path/snippet —
     "read these before re-deriving." Silent on slash commands, repeat prompts, thin prompts,
     no hits, or `MONKEY_BRAIN_RECALL=0`.
  2. **Context-size nudge** (`contextNudge()`, `:64-78`): reads the last main-thread `usage`
     block from the transcript tail (512 KB, `:29,34-61`) — `input + cache_read + cache_creation`
     tokens — and once context passes `MONKEY_BRAIN_CONTEXT_NUDGE` (default 150,000) prints one
     line suggesting `/brain:wrap` then `/clear`, once per 100k-token band per session (its own
     temp-dir marker). The line also repeats manual §5's "don't switch models mid-session" —
     see [[model-routing]].

## Knobs
- `MONKEY_BRAIN_RECALL=0` — disables first-prompt recall only.
- `MONKEY_BRAIN_CONTEXT_NUDGE` — token threshold for the context nudge; `0` disables it.
- `.qmd` marker file (or `MONKEY_BRAIN_QMD=1`) — opts `search-mcp.js` into the qmd handoff.
- `--limit`, `--budget`, `--json` — `search.js` CLI flags; `brain_search`'s `limit` (1-20) is
  the MCP-tool equivalent.

## Cost
BM25 rebuilds from files on every call — no persisted index, so it can never go stale, and a
few hundred pages index in well under a second (measured ~100 ms at 69 pages, P10 note in
[[engine-roadmap]]). The bigger number recall.js's nudge is aimed at: **context re-read per API
call measured ~270k tokens** (239.5 M cache-read ÷ 910 calls) in [[brain-health-audit]] — the
nudge exists because that cost recurs on *every* call for the rest of the session, dwarfing the
~2k a `brain_brief` costs once.

## Gotchas & history
- `search-mcp.js` replaced an earlier `qmd-mcp.js` at P10 (v0.15.0) — qmd went from the only
  option to the opt-in upgrade, built-in BM25 became the default.
- The context nudge is [[token-diet]] AC-4, added v0.31.0, directly answering the audit's
  "shorter contexts is the dominant lever" finding in [[brain-health-audit]] — a fixed ~7-10k of
  per-session overhead is noise next to ~270k re-read per call.
- `recall.js` and `trigger-router.js` are two independent hooks on the same `UserPromptSubmit`
  event — [[trigger-router]] never reads the wiki for recall purposes (only
  `wiki/research/` frontmatter for its own related-research citation); this is the layer that
  actually surfaces arbitrary matching pages.
- Search never indexes `raw-sources/` or `Clippings/` — only compiled layers, so an
  un-ingested source is invisible to `brain_search` until [[wiki-self-healing]]'s ingest flow
  compiles it.

## Related
- [[trigger-router]] — the sibling `UserPromptSubmit` hook; routing hint vs. recall injection
- [[model-routing]] — the nudge's "don't switch models mid-session" line, and the switch-cost numbers it's citing
- [[session-injection]] — session-start context vs. this hook's per-prompt injection
- [[resume-system]] — the resume file the context nudge points to after `/brain:wrap` + `/clear`
- [[stop-nudges]] — the other nudge family, on session/subagent stop rather than prompt submit
- [[claude-code]] — the MCP stdio host and the `UserPromptSubmit`/`additionalContext` mechanism
- [[token-diet]] — the spec that added the context nudge (AC-4)

## Sources
- [[engine-roadmap]] · [[engine-changelog]] · [[brain-health-audit]] · [[token-diet]]
