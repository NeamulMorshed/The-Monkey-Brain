---
description: Learning pack — spaced-repetition drills (SM-2) plus one new concept per session, compiled into the brain; only due cards enter context. Use for "practice <topic>", "drill my cards", "flashcards" or "spaced repetition".
argument-hint: "<deck or topic>"
effort: medium
---

# /brain:learn — drill, learn one thing, practise

A learning repo (or any project) gets a `learning/` folder of decks. The driver is
`node "${CLAUDE_SKILL_DIR}/scripts/srs.js"` (below: `srs.js`).

## A session

1. **Drill what's due:** `srs.js due <deck>` — only due cards, at most 20. For each card show
   the **front**, wait for the answer, then reveal the back and grade honestly with
   `srs.js grade <deck> <id> <0-5>` (0 blank · 1–2 wrong · 3 right with effort · 4 right ·
   5 instant). Below 3 restarts the card.
2. **One new concept.** Teach one thing, then compile it into the brain: a
   `wiki/concepts/<slug>.md` page (sources cited) linked from the index, plus 3–5 cards with
   `srs.js add <deck> "<front>" "<back>"`.
3. **Practise it:** a short exercise that uses the new concept together with a card from step 1
   (for a language: three sentences one step above the learner's level, then a
   micro-conversation).
4. **Wrap:** `srs.js stats <deck>`, then append `wiki/log.md`
   `## [YYYY-MM-DD] session | learn: <deck> — <n> reviewed, <m> new` and offer a commit.

**Reference facts are verified, never invented.** Vocabulary, grammar, formulas and dates come
from a source in `raw-sources/` (a dictionary export, a textbook chapter, docs), cited on the
concept page. If there's no source for a fact, say so rather than guess.
