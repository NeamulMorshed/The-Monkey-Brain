---
description: Show real token usage for this project from Claude Code's own transcripts — per day, per model, per git branch, the subagent share, and the prompt-cache hit ratio — then explain what to change. Use when the user asks for a token report, token usage or spend, the cache-hit ratio, or why sessions feel expensive.
argument-hint: "[--days N]"
model: sonnet
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
- **By model** should follow the routing policy: routine work on Sonnet, triage on Haiku,
  judgment on the main model. A main-model share far above that means work is being done on the
  expensive model by default.
- **Subagents** show how much fan-out costs; `.brain/sessions/agents.md` has each dispatch's
  outcome and token count.

## Steps

1. Lead with the headline: total tokens, cache-hit ratio, and the biggest model or branch share.
2. Name at most three concrete changes that would cut cost, each tied to a number in the report.
   If everything looks healthy, say so in one line.
3. A report is a read: it files nothing and needs no log entry.
