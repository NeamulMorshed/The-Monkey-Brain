---
description: Investigate a topic and file the findings into the Monkey Brain — wiki, then codebase, then web — as a wiki/research/ page with sources and a recommendation. Use for "research X", comparing options before building, or when a plan needs evidence.
argument-hint: "<topic or question>"
effort: medium
---

# /brain:research — investigate, then file it

> **Fan-out:** only when the question splits into more than two independent slices (wiki /
> codebase / web / competitor), dispatch one `brain-researcher` subagent (sonnet, read-only)
> per slice in one message so they run concurrently; then synthesize their cited findings here
> on the session model (opus or fable for research — manual §5) and file the single
> `wiki/research/` page. Don't re-read what a slice already covered.

Research that isn't filed evaporates. This skill runs the research step of the develop
lifecycle (instance manual §4) and always ends with a `wiki/research/` page.

## Steps

1. **Frame it.** One sentence: what must we find out, and for which spec / project /
   decision. Confirm scope with the curator if it's fuzzy.
2. **Check the brain first.** Read `wiki/index.md`; drill into relevant pages. What is
   already known gets cited, not re-researched. Note the real gaps — they are the
   research questions. **Early exit:** if a `wiki/research/` page already answers the
   question, cite it, add nothing, and hand it to `/brain:plan` instead of re-running.
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

## Validation mode — "validate <idea>"

A feasibility scan with a verdict, filed as `wiki/research/validate-<idea>.md`:

- **Problem & who has it** — is the pain real and frequent? Evidence, not enthusiasm.
- **Competitors & substitutes** — who solves it today, how well, at what price (fan out
  `brain-researcher` for the teardowns).
- **Market signal** — searches, communities, pricing pages, reviews; say when it's thin.
- **Effort** — if it touches this codebase, size it with
  `node "${CLAUDE_SKILL_DIR}/../../hooks/scripts/graph.js" radius <files or keywords>`.
- **Risks** — technical, legal, distribution.
- **Recommendation: pursue, park, or kill** — one word, then the single reason that decides it,
  and what evidence would change the call.
