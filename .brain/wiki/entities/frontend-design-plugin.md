---
title: "Frontend Design (capability plugin)"
type: entity
status: active
tags: [plugin, frontend-design, ui, capability-plugin]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-readme]]", "[[brain-health-audit]]"]
related: ["[[claude-code]]", "[[github-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[instincts-and-bans]]"]
aliases: [frontend-design plugin]
---

# Frontend Design (capability plugin)

An official Anthropic capability plugin that fires on **any UI build** — it executes the frontend
implementation work inside [[claude-code]].

## How the brain uses it

Per `.brain/reference.md` §9's precedence chain (*deterministic trigger > domain pack > domain
skill > craft plugin > general model*), frontend-design is a **craft plugin**: it *executes* a
build, but does not *decide* the design system. When the offered `ui-ux-pro-max` domain pack is
present, `ui-ux-pro-max` decides the design system (palette / style / type / industry reasoning)
and frontend-design builds against that decision — "domain pack > craft plugin."

Its output is filed:
- Design-system + component decisions → `decisions/` as ADRs.
- `audit_score` → the workstream's `projects/` status page.
- Anti-patterns it surfaces seed `instincts/pending/` ([[instincts-and-bans]]).

## Setup & requirements

One of the **four capability plugins auto-installed** as a dependency of `brain`
(`plugin/.claude-plugin/plugin.json` → `frontend-design` from `claude-plugins-official`) —
installed and enabled the moment `brain` is installed. No runtime or credential requirement is
documented for it in the engine's own sources.

## Gotchas

- Not among the plugins [[brain-health-audit]] found broken on the audited machine (that list is
  `github` — MCP token — and `security-guidance` — missing Python); no cache directory for
  `frontend-design` was found on this machine either, so its live health here is unverified —
  flag for a future `/brain:doctor` dependency-health check ([[doctor-health-checks]]), same as
  `github`.
- Precedence is easy to get backwards: frontend-design **executes**, it does not **decide** — the
  design-system choice belongs to `ui-ux-pro-max` (or, absent that pack, is made ad hoc and
  should still land as a `decisions/` ADR).

## Related
- [[claude-code]] — the host platform.
- [[github-plugin]] · [[superpowers-plugin]] · [[security-guidance-plugin]] ·
  [[code-modernization-plugin]] — the other capability plugins under the same craft/knowledge
  contract.
- [[instincts-and-bans]] — where its anti-patterns are filed.
