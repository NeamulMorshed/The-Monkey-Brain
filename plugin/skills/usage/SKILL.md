---
description: Real token usage for this project from Claude Code's transcripts — per day, model and branch, subagent share, cache-hit ratio — and what to change. Use for a token report, token spend, the cache-hit ratio, or why sessions feel expensive.
argument-hint: "[--days N]"
model: sonnet
context: fork
effort: low
---

# /brain:usage — token receipts

Receipts, not estimates (v3 P11): the report below was built from this project's transcripts
before you read this, deduplicated per API response. Nothing is sent anywhere.

!`node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/usage.js"`

For a different window, re-run with `--days N` (e.g. `--days 30`) via the same script.

## How to read it

- **Cache-hit** is cache reads ÷ all input tokens. Healthy sessions sit at **80% or more**;
  cached input costs about a tenth of fresh input.
- **Cache-write** spikes mean the prompt prefix changed: `/clear`, compaction, enabling or
  disabling plugins or MCP servers mid-session, editing `CLAUDE.md` mid-session, or a proxy
  rewriting requests (`/brain:doctor` check 16 flags that).
- **By model** should follow the routing table (manual §5): triage on Haiku, reading fan-out and
  coding on Sonnet, judgment on Opus or Fable. A top-tier share far above that means work runs on
  the expensive model by default; every mid-session model switch also re-writes the whole cache.
- **Subagents** show how much fan-out costs; `.brain/sessions/agents.md` has each dispatch's
  outcome and token count.

## Steps

1. Lead with the headline: total tokens, cache-hit ratio, and the biggest model or branch share.
2. Name at most three concrete changes that would cut cost, each tied to a number in the report.
   If everything looks healthy, say so in one line.
3. A report is a read: it files nothing and needs no log entry.
