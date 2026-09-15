---
title: "GitHub (capability plugin)"
type: entity
status: active
tags: [plugin, github, pr, ci, mcp, capability-plugin]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-readme]]", "[[brain-health-audit]]", "[[engine-resume-history]]"]
related: ["[[claude-code]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[security-guidance-plugin]]", "[[code-modernization-plugin]]", "[[develop-lifecycle-stages]]", "[[doctor-health-checks]]", "[[engine-resume-history]]"]
aliases: [github plugin]
---

# GitHub (capability plugin)

An official Anthropic capability plugin (`claude-plugins-official`) that handles PR, issue, and
CI work inside [[claude-code]] — code review flow, PR links, and repo interactions. It ships its
own MCP server for talking to GitHub.

## How the brain uses it

Fires on PR / issue / CI work. Per the contract in `.brain/reference.md` §9 — *plugins do the
craft; the brain records the knowledge* — its output is filed:

- Review synthesis + PR link → `wiki/syntheses/`.
- Workstream status → `projects/`.

In the develop lifecycle ([[develop-lifecycle-stages]]), `/brain:review` reads a PR's diff and CI
checks via `gh` (read-only) as part of AC-by-AC verification. `pr.js` is deliberately read-only —
no `gh pr comment`/`review`/`merge` call anywhere in the brain; posting to a PR is the curator's
own action, per their explicit choice recorded in [[engine-resume-history]] (the 0.26.0 entry:
"explicitly asked read-only vs. posting-back and chose read-only").

## Setup & requirements

- One of the **four capability plugins auto-installed** as a dependency of `brain`
  (`plugin/.claude-plugin/plugin.json` → `github` from `claude-plugins-official`) — installed and
  enabled the moment `brain` is installed, no extra step.
- Requires its own MCP server, which needs a `GITHUB_PERSONAL_ACCESS_TOKEN` credential — the
  brain never sets this itself (§9's MCP contract: it recognizes a connected server, never
  installs one or touches a credential).

## Gotchas

- **Dead on the audited machine.** [[brain-health-audit]] finding 8: the `github` MCP server
  fails at connect on every session — `GITHUB_PERSONAL_ACCESS_TOKEN` unset — and doctor does not
  check for it. The audit's recommendation: a doctor "dependency health" check (interpreter /
  runtime present, required env vars set, MCP connect state) and `/brain:init` asking before
  enabling a dependency that needs a token, neither built yet.
- Dead dependencies are otherwise invisible: nothing in the session surfaces that the plugin is
  silently non-functional beyond a per-call connect error.

## Related
- [[claude-code]] — the host platform whose MCP surface this plugin's server uses.
- [[frontend-design-plugin]] · [[superpowers-plugin]] · [[security-guidance-plugin]] ·
  [[code-modernization-plugin]] — the other capability plugins under the same craft/knowledge
  contract.
- [[develop-lifecycle-stages]] — where `/brain:review` touches PR flow via `pr.js`.
- [[doctor-health-checks]] — where dependency health should be (but isn't yet) checked.
- [[engine-resume-history]] — records the curator's read-only choice for PR review (0.26.0).
