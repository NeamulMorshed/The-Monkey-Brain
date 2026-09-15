---
title: "Model Routing"
type: concept
status: active
tags: [model-routing, agent-track, cost, dispatch]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]"]
related: ["[[trigger-router]]", "[[recall-and-search]]", "[[bounded-loops]]", "[[claude-code]]", "[[superpowers-plugin]]", "[[token-diet]]"]
aliases: [agent-track.js, model block, routing table, model routing policy]
---

# Model Routing

The brain's one policy for which model does which work, and the machinery that enforces and
measures it: a routing table in `.brain/CLAUDE.md` §5, a hook (`agent-track.js`) that blocks
unpinned heavy dispatches and logs every outcome, and a hard rule — change model by forking or
dispatching, never by switching the main thread mid-session.

## How it works
- **The routing table** (instance `CLAUDE.md` §5): deterministic checks (doctor, lint, graph,
  usage data) run as Node scripts, no model. Triage/classification → subagent, haiku. Reading
  fan-out (research slices, sweeps, batch ingest) and coding (build ACs, CI, scaffolds) →
  subagent or forked skill, sonnet, medium effort. Research synthesis, planning, architecture →
  main session, opus (fable for architecture tier), high effort. Review / adversarial audit →
  subagent, **a model family other than the builder's** (loop rule, below). Conversation → the
  session model chosen at session start.
- **`agent-track.js`** is hook #7, on `PreToolUse` for `Agent|Task` and on `SubagentStop`
  (P2, v0.4.0 for the dispatch log; P11, v0.16.0 for outcomes — [[engine-roadmap]]).
  - **Every dispatch is logged** to `sessions/agents.md` — type, model, purpose (`appendLog`,
    `:122-126`). `HEAVY_TYPES` (`:37`) = `''`, `general-purpose`, `claude`, `Plan` — agent types
    that silently default to the expensive main model when no `model` is given.
  - **Unpinned heavy dispatches are blocked** (`willBlock`, `:119`, `lib.block(...)` `:129-135`):
    a `Task`/`Agent` call of a `HEAVY_TYPES` type with no explicit `model` param is refused,
    citing the routing table, unless `MONKEY_BRAIN_MODEL_BLOCK=0`. Forks are exempt — Claude
    Code ignores a model override on a fork, so blocking one would only force a meaningless
    parameter.
  - **Loop verifier ≠ generator family** (P12, v0.17.0, `:106-116`): while a spec/research loop
    is running, a dispatch whose type or description reads as review work (`VERIFYING` regex —
    `verif*/review*/audit*/critique*/check(s|ing)?`) is blocked if its `model`'s family
    (`loops.family()`, `opus/sonnet/haiku/fable` by substring) matches the loop's generator
    family — a same-family verifier tends to miss the same mistakes. See [[bounded-loops]].
  - **SubagentStop records the outcome** (`recordOutcome`, `:63-89`): done/empty from
    `last_assistant_message`, the model(s) that actually ran and the real token count, read
    from the subagent's own transcript (`usage.readTranscript`). Claude Code's internal forks
    (no `agent_type`, no transcript) leave no line — logging them as "done" used to drown real
    outcomes in doctor check 18's window (fixed v0.30.0, see Gotchas).
- **Skill-level pinning**: a skill's `model:` frontmatter applies only together with
  `context: fork`. As of 0.31.0 only **`build`** does this (`model: sonnet`, `effort: medium`,
  `context: fork` in `plugin/skills/build/SKILL.md`) — a forked skill runs on a fresh context
  and can't see the conversation, so it reads its inputs from files, and gets the active
  instincts injected via `instincts.js active` since a fork misses the session-start
  injection. Every other skill (`digest`, `usage`, `brief`, `dashboard`, `home` included) lost
  its pin at the same release and runs on the session model.

## Knobs
- `MONKEY_BRAIN_MODEL_BLOCK=0` — opts a dispatch out of the unpinned-heavy-type block, for
  third-party plugins that dispatch without a model.
- The `model` param on the `Agent`/`Task` tool call itself — the only way to satisfy the block.
- A skill's `model:` + `context: fork` frontmatter pair — the only sanctioned way to pin a
  cheaper model; `context: fork` without it runs on the session model.

## Cost
Model switching is the expensive knob, not model choice itself: [[brain-health-audit]]
measured, over 15 sessions, same-model calls writing **4,286** cache tokens on average versus
**8** main-thread model switches writing **162,732** on average — **25% of all main-thread
cache writes** (1.30 M tokens) from those 8 switches alone. One opus → sonnet switch (a
`model: sonnet` skill invoked mid-session without `context: fork`) re-wrote **488,844** tokens
in a single call. This is why forking, not switching, is the rule — see
[[fork-not-switch-model-routing]].

## Gotchas & history
- **[[model-block-every-dispatch]]**: the block used to fire only once per session (a temp-dir
  marker) — "one corrective retry, then the session is left alone." The audit caught the leak
  live: a model-less dispatch was blocked while its parallel sibling ran unpinned on the main
  model. The same version also logged Claude Code's internal forks as successful dispatches (61
  of 69 outcome lines), hiding real empty results from doctor check 18. v0.30.0 made the block
  apply to *every* unpinned heavy dispatch and stopped logging forks as dispatches.
- **[[fork-not-switch-model-routing]]**: ten skills originally pinned a cheaper `model:` with no
  `context: fork`; Claude Code applies a skill's `model:` only to the invoking turn then
  reverts to the session model, and a skill's `model:` switch does not fire `PreModelSwitch`,
  so no hook can catch it after the fact. The fix moved only `build` to `context: fork` and
  left every other skill on the session model.
- [[recall-and-search]]'s context nudge repeats "don't switch models mid-session" once context
  passes threshold — the same finding, surfaced at the point it's most likely to be ignored.
- The routing table itself lives in exactly one place (`CLAUDE.md` §5) specifically so hooks
  and skills cite it rather than restate it — a second copy is how table and code drift.

## Related
- [[trigger-router]] — advisory routing of *workflows*; this is enforced routing of *models*
- [[recall-and-search]] — the context nudge that echoes the no-mid-session-switch rule
- [[bounded-loops]] — the verifier-≠-generator-family rule inside `/brain:loop`
- [[claude-code]] — the host whose fork/model-override semantics this whole policy works around
- [[superpowers-plugin]] — a craft plugin whose dispatches, if any, are still subject to this block
- [[token-diet]] — the spec whose audit findings motivated the every-dispatch fix and the context nudge

## Sources
- [[engine-roadmap]] · [[engine-changelog]] · [[brain-health-audit]] · [[model-block-every-dispatch]] · [[fork-not-switch-model-routing]] · [[token-diet]]
