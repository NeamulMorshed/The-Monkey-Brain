---
description: File a loose note where it belongs in the Monkey Brain — a decision as an ADR, a fact in memory/, a next step on its workstream, an idea, a link in Clippings/, a repeated correction as an instinct. Use for "dump", "jot this down", "we decided …".
argument-hint: "<the note>"
effort: medium
---

# /brain:dump — classify and file a note

Loose notes are where decisions get lost. Split the note into its parts and file each one
where the brain will find it again.

| The part is… | File it to | How |
| --- | --- | --- |
| a **decision** ("we decided / chose / will use …") | `decisions/<slug>.md` | ADR from `templates/decision.md`: context, the decision, consequences; `status: accepted` |
| a **fact** about the project, people or constraints | `memory/<slug>.md` (or the matching wiki page) | one fact per note; update an existing page rather than duplicate |
| a **next step** / task | the workstream's `projects/<ws>.md` → `## Next` | ordered, small, one line each |
| an **idea** to explore | `wiki/research/ideas.md` (create it, linked from the index) | one bullet: the idea + why it might matter; `/brain:research` later |
| a **link or document** to read | `Clippings/` | a stub with the URL; ingest later |
| a **correction** ("don't do X, do Y") | `instincts/pending/<rule>.md` | template `instinct.md`; the curator promotes it |

## Steps

1. **Split and classify** the note; if a part is ambiguous, ask one short question rather than
   guess (a decision filed as an idea gets lost).
2. **Search before writing** — `brain_search` for the topic, so you update the page that exists
   instead of creating a duplicate. Link what you file to what it touches (no orphans).
3. **Log once:** append `wiki/log.md` → `## [YYYY-MM-DD] session | dump: <one-line summary>`.
4. **Report** in one line per part: what went where. Offer a commit `session: dump — <summary>`.
