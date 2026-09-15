---
title: "Security Guidance (capability plugin)"
type: entity
status: active
tags: [plugin, security-guidance, security, python, capability-plugin]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-readme]]", "[[brain-health-audit]]", "[[engine-changelog]]"]
related: ["[[claude-code]]", "[[github-plugin]]", "[[frontend-design-plugin]]", "[[superpowers-plugin]]", "[[code-modernization-plugin]]", "[[doctor-health-checks]]", "[[develop-lifecycle-stages]]"]
aliases: [security-guidance plugin, security-guidance]
---

# Security Guidance (capability plugin)

Version 2.0.8, by David Dworken (Anthropic). Its manifest: "Security review for Claude-generated
code. Pattern-based warnings on edits, LLM-powered diff review on Stop, and an agentic commit
reviewer that catches injection, XSS, SSRF, hardcoded secrets, and 25+ other vulnerability
classes." Fires on **auth / crypto / input-handling code**.

## How the brain uses it

Three review layers, per its own README: (1) instant regex pattern warnings on `Edit`/`Write` for
~25 known-dangerous patterns (`yaml.load`, `pickle.load` on untrusted data, raw `innerHTML`,
hardcoded secrets…); (2) on `Stop`, the diff goes to a fast LLM call (Opus 4.7 by default,
`SECURITY_REVIEW_MODEL`) whose high-severity findings feed back to Claude before the response is
shown; (3) on `git commit`, an SDK-driven agentic reviewer traces data flow across files
(`Read`/`Grep`/`Glob`) to catch multi-file vulnerabilities (IDOR, auth bypass, cross-file SSRF)
that pattern matching misses.

Findings are filed as wiki pages (`wiki/syntheses/`); **open P0 findings gate `/brain:wrap`
exactly like a hard security-audit gate** — same mechanism as `projects/` P0 gating elsewhere in
the develop lifecycle ([[develop-lifecycle-stages]]).

## Setup & requirements

- One of the **four capability plugins auto-installed** as a dependency of `brain`
  (`plugin/.claude-plugin/plugin.json` → `security-guidance` from `claude-plugins-official`).
- **Requires Python ≥ 3.10** on `PATH` (`python`, `python3`, or `py -3`) — `claude_agent_sdk`
  needs 3.10+; below that, `pip install` fails and the LLM-powered review (Stop / commit / push)
  silently no-ops while the pattern-regex layer keeps working. Also needs a working Claude API
  path (subscription, API key, or 3rd-party provider config).
- The interpreter shim `hooks/sg-python.sh` probes candidates in order (`python3.13` down to
  `python3.10`, then bare `python3`/`python`/`py -3`) specifically to route around the Windows
  Microsoft Store `python3` stub, which exits silently (code 49) in non-TTY subprocess context;
  it also forces `PYTHONUTF8=1` and converts Git-Bash POSIX paths to native Windows form via
  `cygpath -w` before exec, since a raw `/c/Users/...` path fed to a Windows `python.exe`
  resolves to the wrong drive root and ENOENTs every Edit/Write/MultiEdit until restart.
- Config is entirely env vars — `SECURITY_GUIDANCE_DISABLE=1` (kill switch),
  `ENABLE_PATTERN_RULES=0`, `ENABLE_CODE_SECURITY_REVIEW=0`, `ENABLE_STOP_REVIEW=0`,
  `ENABLE_COMMIT_REVIEW=0`, `SG_DUAL_OR=on` (two parallel review calls, ~2× cost, a few more
  points of recall) — none required for default behavior. Org policy files
  (`claude-security-guidance.md` at user/project/project-local scope) feed the LLM diff review's
  prompt, concatenated user → project → project-local, truncated from the tail past an 8 KB
  budget.

## Gotchas

- **Never runs on the audited machine** ([[brain-health-audit]] finding 8): no Python 3
  interpreter is found (non-blocking error logged on every prompt and edit across 14 transcripts).
  The "open P0s gate wrap" security net the engine's own manual promises has therefore never
  actually fired here. Doctor does not check for this — recommended fix: a doctor #20
  "dependency health" check (interpreter present, required env vars set, MCP connect state) and
  `/brain:init` asking before enabling a dependency needing a runtime ([[doctor-health-checks]]).
- Because the failure is silent per-call rather than a loud one-time error, a missing Python
  install is easy to miss for a long time — as it was here.

## Related
- [[claude-code]] — the host platform.
- [[github-plugin]] · [[frontend-design-plugin]] · [[superpowers-plugin]] ·
  [[code-modernization-plugin]] — the other capability plugins under the same craft/knowledge
  contract.
- [[doctor-health-checks]] — where dependency health should be (but isn't yet) checked.
- [[develop-lifecycle-stages]] — where its P0 findings gate `/brain:wrap`.
