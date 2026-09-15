---
title: "ADR — Change model by forking or dispatching, never by switching the main thread"
type: decision
status: accepted
created: 2026-09-15
updated: 2026-09-15
sources: ["[[brain-health-audit]]", "[[token-diet]]"]
related: ["[[brain-health-audit]]", "[[token-diet]]", "[[model-block-every-dispatch]]"]
---

# Change model by forking or dispatching, never by switching the main thread

## Context
Ten skills pinned a cheaper model (`model: sonnet` / `haiku`) so routine work would not run on the expensive session model. Claude Code applies a skill's `model:` only to the turn that invokes it, then reverts — and prompt caches are per model. Over 15 sessions, the 8 main-thread model switches wrote ~163k cache tokens each (a normal call writes ~4k) and caused 25 % of all main-thread cache writes; one Opus → Sonnet skill switch re-wrote 488,844 tokens ([[brain-health-audit]], "Measured switch cost"). A pin that saves money on a small context costs money on a long one. The docs also confirmed that a skill's `model:` does not fire `PreModelSwitch`, so a hook cannot catch these switches, and that `context: fork` makes `model:` apply to a forked subagent instead.

## Decision
The instance manual §5 holds one model-routing table (work class → where → model → effort; Haiku, Sonnet, Opus, Fable), cited by every hook and skill that mentions models. A skill may pin `model:` only together with `context: fork` — `build`, `digest`, `usage` (Sonnet) and `brief`, `dashboard`, `home` (Haiku) run as forks on a fresh context. Every other skill runs on the session model; judgment skills stay at `effort: high`. The curator picks the session model at the start of a session by the day's work; a context-size nudge (`recall.js`) says "don't switch models mid-session" when context is large.

## Consequences
Easier: routine work still runs on a cheaper model, with no cache re-write, and research synthesis really does run on the session model the curator chose. Harder: a forked skill does not see the conversation — it must read its inputs (the spec, the transcript, the brain) from files, which these six already do; interactive skills (`ingest`, `init`, `dump`, `learn`, `ci`, `lock`, `terse`) cannot be forked and now cost the session model. Watch: a new skill that pins a model without `context: fork` fails the selftest rule check; if Claude Code ever shares caches across models or lets a hook set the model, revisit.
