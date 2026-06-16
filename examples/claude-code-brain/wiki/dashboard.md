---
title: "Dashboard — The Monkey Brain"
type: dashboard
status: active
tags: [dashboard, dataview, navigation, moc]
created: 2026-06-17
updated: 2026-06-17
related: ["[[index]]", "[[log]]", "[[dataview]]"]
---

# 📊 The Monkey Brain — Dashboard

Live views over page [[dataview|frontmatter]]. **Requires the Obsidian Dataview plugin** —
the code blocks below render as tables/lists inside Obsidian; on GitHub they show as source.
For the hand-maintained catalog, see [[index]]; for history, [[log]].

> If these blocks show as raw text, enable **Settings → Community plugins → Dataview**.

---

## 🩺 Health — needs attention
Pages that are stubs, drafts, stale, or superseded (should normally be empty).

```dataview
TABLE status, type, updated
FROM "wiki"
WHERE status = "stub" OR status = "draft" OR status = "stale" OR status = "superseded"
SORT status ASC
```

---

## 📥 Sources, newest first

```dataview
TABLE origin AS "Origin", updated AS "Updated"
FROM "wiki/sources"
SORT updated DESC, file.name ASC
```

---

## 🧠 Concepts by tag cluster

```dataview
TABLE status, tags
FROM "wiki/concepts"
WHERE type = "concept"
SORT file.name ASC
```

---

## 🏷️ Entities

```dataview
TABLE sources AS "Backed by"
FROM "wiki/entities"
WHERE type = "entity"
SORT file.name ASC
```

---

## 🔬 Syntheses (filed-back answers)

```dataview
TABLE question AS "Captured question", updated
FROM "wiki/syntheses"
WHERE type = "synthesis"
SORT updated DESC
```

---

## 🕸️ Most-referenced pages (hubs)

```dataview
TABLE length(file.inlinks) AS "Inbound links"
FROM "wiki"
WHERE type != "dashboard"
SORT length(file.inlinks) DESC
LIMIT 12
```

---

## 🚧 Orphans (zero inbound links)
Should be empty — flagged by [[lint-test|lint]] if not.

```dataview
LIST
FROM "wiki"
WHERE length(file.inlinks) = 0 AND file.name != "index" AND file.name != "log" AND file.name != "dashboard"
```

---

## ⏱️ Recently updated

```dataview
TABLE type, updated
FROM "wiki"
SORT updated DESC
LIMIT 10
```
