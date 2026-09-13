---
title: "Instinct — <rule name>"
type: instinct
status: pending           # pending (maintainer-proposed) | active (curator-promoted)
trigger: "<when it applies: paths, phrases, task types>"
confidence:               # 0.0–1.0; leave blank to derive it from the evidence count
ban:                      # optional regex the hooks enforce once active, single-quoted: 'console\.log\('
ban_paths:                # optional regex on the project path, single-quoted: '\.(ts|tsx)$'
enforce: warn             # warn = flag right after the write · block = refuse the write (curator's call)
created: YYYY-MM-DD
updated: YYYY-MM-DD
evidence: []              # the 3+ corrections that earned this rule
---

# <Rule name>

**Rule:** the one-sentence correction to always apply.

**Why:** what kept going wrong without it.

**Scope:** where it applies — and where it does NOT.

Lifecycle: repeated corrections (3+ of the same kind) become a file in
`instincts/pending/`; the curator promotes to `instincts/active/`, which the
session-start status block injects every session. A rule with a `ban:` becomes
enforcement once active: `warn` flags matching writes, `block` refuses them.
