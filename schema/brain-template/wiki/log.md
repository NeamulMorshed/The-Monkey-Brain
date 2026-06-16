---
title: "Log — {{PROJECT}}"
type: log
status: active
tags: [log, audit, chronological]
created: {{DATE}}
updated: {{DATE}}
---

# 🐵 {{PROJECT}} — Log

Append-only audit trail. Newest at the bottom. Each entry is prefixed for grep:
`grep "^## \[" log.md | tail -5`. Prefixes: `ingest | query | lint | schema | feat`.

---

## [{{DATE}}] feat | Brain scaffolded
Created an empty Monkey Brain instance for **{{PROJECT}}** from the engine template. Ready to
ingest its first source.
