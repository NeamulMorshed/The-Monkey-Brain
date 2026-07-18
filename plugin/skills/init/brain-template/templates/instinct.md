---
title: "Instinct — <rule name>"
type: instinct
status: pending           # pending (maintainer-proposed) | active (curator-promoted)
trigger: "<when it applies: paths, phrases, task types>"
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
session-start status block injects every session.
