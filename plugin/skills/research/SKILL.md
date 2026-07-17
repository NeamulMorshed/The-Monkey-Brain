---
description: Investigate a topic for the project and file the findings into the Monkey Brain — wiki first, then codebase, then web — as a wiki/research/ page with sources and a recommendation. Use when the user says "research X", asks to investigate options or approaches before building, or a plan needs evidence. Requires a .brain/ (offer /brain:init when missing).
argument-hint: "<topic or question>"
---

# /brain:research — investigate, then file it

Research that isn't filed evaporates. This skill runs the research step of the develop
lifecycle (instance manual §4) and always ends with a `wiki/research/` page.

## Steps

1. **Frame it.** One sentence: what must we find out, and for which spec / project /
   decision. Confirm scope with the curator if it's fuzzy.
2. **Check the brain first.** Read `wiki/index.md`; drill into relevant pages. What is
   already known gets cited, not re-researched. Note the real gaps — they are the
   research questions.
3. **Gather in cost order:**
   - **Codebase** — search the project for prior art, constraints, existing patterns.
   - **Web** — for external facts (APIs, libraries, pricing, standards); prefer primary
     sources; capture the URL for every claim.
   Stay on the question — timebox rabbit holes, and say plainly when evidence is thin.
4. **File the page:** `wiki/research/<kebab-topic>.md` from `templates/research.md` —
   every finding cites its source (wiki page or URL), plus one clear **Recommendation**
   section. Link it from the index's Research section and related concept/spec pages
   (reciprocal — the wiki-check hook blocks orphans).
5. **Bookkeeping:** refresh index counts/`updated`, append `wiki/log.md`
   `## [YYYY-MM-DD] research | <topic>`, offer commit `research: <topic>`.
6. **Hand off:** if this feeds a feature, offer `/brain:plan <feature>` next — the spec
   will cite this page.

**Done when:** the research page exists, is linked and indexed, every finding has a
source, and the log entry + commit round it off.
