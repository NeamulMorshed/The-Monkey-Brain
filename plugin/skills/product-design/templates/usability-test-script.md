---
title: "Usability test script — <feature>"
type: synthesis
status: draft
tags: [usability-test, validation, product-design]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
related: []
aliases: []
---

# Usability test — <feature>

**Goal:** the one decision this test should inform.
**Participants:** 5 target users (Nielsen: 5 finds ~85% of issues). Screener: <who qualifies>.
**Method:** moderated / unmoderated · think-aloud.

## Warm-up (2 min)
Put them at ease; "we're testing the design, not you; think out loud; there are no wrong answers."

## Tasks (realistic, no leading language)
For each task: a scenario, the trigger, and the **success criterion** (what "done" means).

1. **Task:** "<scenario that ends with a goal, e.g. 'you want to …'>"
   - Success = …
   - Watch for: hesitation, wrong turns, requests for help.
2. **Task:** …
3. **Task:** …

## Metrics
- **Task success rate** (pass / partial / fail) · **time on task** · **errors** ·
  **SEQ** (Single Ease Question, 1–7, after each task).

## Debrief
- Most confusing part? Most valuable? Anything missing? Would they use it?

## After the session → file back
Aggregate results into `wiki/syntheses/usability-<feature>.md`: rank issues by frequency ×
severity. Failed core tasks = **P0** (gate `/brain:wrap`). Fixes land now or become spec items;
recurring UX mistakes seed `instincts/pending/`.
