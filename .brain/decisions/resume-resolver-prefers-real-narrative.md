---
title: "ADR — One resume file, chosen by content before location"
type: decision
status: accepted
created: 2026-09-15
updated: 2026-09-15
sources: ["[[brain-health-audit]]", "[[brain-correctness]]"]
related: ["[[brain-health-audit]]", "[[brain-correctness]]"]
---

# One resume file, chosen by content before location

## Context
Three hooks each had their own resume lookup (`resume.js`, `resume-log.js`, `snapshot.js`), all "brain copy first, root copy second", while `/brain:wrap` told the model to write the root `resume.md` in the engine repo. `/brain:init` then seeded an empty `.brain/resume.md` beside this repo's real 16.8 KB root narrative, and from that moment every session was injected the empty template plus "continue from these notes, or start fresh?" ([[brain-health-audit]] P0 #1). Two fixes were possible: a migration that moves the root narrative into the brain, or a resolver that decides by content.

## Decision
One resolver, `lib.resumePath(cwd, { create })`, serves every reader and writer. Candidates stay `<brain>/resume.md` then `./resume.md`; the first existing file whose narrative is **not the seed** wins, else the first existing file, else (writers only, inside a brain) the brain path is created. `lib.isSeedResume` defines a seed: "Where we left off" empty or a known placeholder and "Next steps" only `- [ ] …`; the hook-written task log never counts, and a file with neither heading is someone's own format, never a seed. `resume.js` stays silent on a seed.

## Consequences
Easier: brains seeded beside an older root resume recover with no migration and no curator action; the question "continue?" is only asked when there is something to continue. Harder: two files can still exist; whichever holds the real narrative is "the" file, so `/brain:wrap` must update the file the session-start hook named (step 3 now says so). Watch: a new resume placeholder text must be added to `SEED_NARRATIVE`, or a fresh seed will read as a real narrative and be injected.
