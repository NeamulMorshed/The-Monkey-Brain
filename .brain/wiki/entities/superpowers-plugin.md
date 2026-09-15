---
title: "Superpowers (capability plugin)"
type: entity
status: active
tags: [plugin, superpowers, tdd, debugging, capability-plugin]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-readme]]", "[[brain-health-audit]]", "[[engine-changelog]]"]
related: ["[[claude-code]]", "[[github-plugin]]", "[[frontend-design-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[develop-lifecycle-stages]]", "[[plan-and-tdd-gates]]", "[[instincts-and-bans]]", "[[engine-knowledge]]"]
aliases: [superpowers plugin, superpowers]
---

# Superpowers (capability plugin)

Version 6.3.0, by Jesse Vincent (`github.com/obra/superpowers`). Its own manifest describes it as
a "core skills library for Claude Code: TDD, debugging, collaboration patterns, and proven
techniques." Inside the brain it fires on **build / debug phases** and supplies the TDD
methodology behind `/brain:build` ([[plan-and-tdd-gates]], [[develop-lifecycle-stages]]).

## How the brain uses it

Per `.brain/reference.md` §9: root-cause findings from debugging are filed as `wiki/` pages, and
repeated corrections it surfaces seed `instincts/pending/` ([[instincts-and-bans]]).

**Its own skills write outside `.brain/` by default.** Superpowers' `brainstorming` skill writes a
design doc to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`; its `writing-plans` skill
writes to `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` (verified in the plugin's own cache:
`docs/superpowers/plans/…` and `docs/superpowers/specs/…` hold its historical design/plan docs).
Neither location is seen by the plan/TDD gates, the index, `/brain:query` recall, or `brain_search`
— a second, parallel lifecycle the brain's SDLC ([[develop-lifecycle-stages]]) does not know about.

## Setup & requirements

One of the **four capability plugins auto-installed** as a dependency of `brain`
(`plugin/.claude-plugin/plugin.json` → `superpowers` from `claude-plugins-official`) — installed
and enabled the moment `brain` is installed. No runtime/credential requirement beyond Claude Code
itself.

## Gotchas

- **Two lifecycles, now bridged** ([[brain-health-audit]] finding 7). The curator's standing
  rule is to always invoke `superpowers:brainstorming` before building, even when the design was
  already agreed in chat — but no brain skill used to map its outputs anywhere in `.brain/`, so
  every feature risked a design doc that the brain's own gates, search, and index never saw. The
  audit's fix shipped in 0.32.0 (`specs/engine-knowledge.md` AC-4, built, not merely planned):
  `.brain/reference.md` §9 now maps superpowers outputs into the brain (a brainstorming design →
  the spec's Notes or `wiki/research/`; a written plan → the spec; a systematic-debugging root
  cause → `wiki/`), and the wiki-check hook gives an advisory on any write under
  `docs/superpowers/` in a brain project, naming where it belongs.
- Works correctly as a plugin on this machine — unlike `github` and `security-guidance`, it is
  not among the audit's list of dead dependencies, but it "runs a second lifecycle outside
  `.brain/`" per the audit's summary table.

## Related
- [[claude-code]] — the host platform.
- [[github-plugin]] · [[frontend-design-plugin]] · [[security-guidance-plugin]] ·
  [[code-modernization-plugin]] — the other capability plugins under the same craft/knowledge
  contract.
- [[develop-lifecycle-stages]] · [[plan-and-tdd-gates]] — the brain lifecycle its TDD methodology
  underlies.
- [[instincts-and-bans]] — where its repeated-correction findings are meant to seed rules.
- [[engine-knowledge]] — the spec adding the superpowers-output filing rule (AC-4).
