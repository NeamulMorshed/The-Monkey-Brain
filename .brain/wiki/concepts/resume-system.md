---
title: "Resume System"
type: concept
status: active
tags: [hooks, resume, session-continuity, compaction]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[engine-resume-history]]", "[[brain-health-audit]]", "[[brain-correctness-review]]"]
related: ["[[session-injection]]", "[[stop-nudges]]", "[[bounded-loops]]", "[[develop-lifecycle-stages]]", "[[claude-code]]"]
aliases: ["resume.md", "resumePath"]
---

# Resume System

How the brain survives `/clear`, a fresh terminal, and mid-session compaction: one resume file
per project, chosen by whichever candidate actually holds a narrative, read at session start,
auto-logged by task events, and snapshotted before compaction. See ADR
[[resume-resolver-prefers-real-narrative]] for why "real narrative before location" won over a
migration.

## What it is
Three cooperating hook scripts — `resume.js` (reader), `resume-log.js` (auto-updater),
`snapshot.js` (pre-compaction backup) — plus shared helpers in `lib.js`, all resolving to the
**same** resume file via `lib.resumePath()`. The file has model-owned narrative sections
("Where we left off", "Next steps") and a hook-written "Task log (auto)" section that no script
ever writes prose into.

## How it works
- **File resolution — `lib.resumePath(cwd, opts)`** (`lib.js:220-230`): candidates are
  `<brain>/resume.md` then `<project-root>/resume.md` (the brain's parent, or `cwd` when there
  is no brain). Among the **existing** candidates, the first whose content is **not a seed**
  wins (`lib.isSeedResume`); else the first existing file; else — only for writers, only inside
  a brain, only with `{ create: true }` — the brain path, to be created by the caller.
- **Seed detection — `lib.isSeedResume(text)`** (`lib.js:194-210`): a file is a seed when
  "Where we left off" is empty or matches `SEED_NARRATIVE` (the init template's placeholder or
  the hook's own auto-created line) *and* "Next steps" has nothing but `- [ ] …`; a file with
  neither heading is a seed only if a hook-written task log is *all* it contains. The
  hook-written task log itself never counts toward "real" content.
- **Reader — `resume.js`** (SessionStart, matcher `startup|clear` only — compaction and resume
  sources already carry context forward): finds the file via `lib.resumePath`, stays silent on
  no file or a seed (`lib.isSeedResume`), else splits the body on `## ` headings
  (`splitSections`), tags narrative sections priority 1 and a trimmed task-log tail (last 5
  entries, `TAIL_LINES`) priority 2, and injects them with a header plus a directive: **ask the
  user whether to continue from these notes or start fresh**.
- **Auto-updater — `resume-log.js`** (`TaskCreated`/`TaskCompleted`/`SessionEnd`): appends one
  line to `## Task log (auto)` per event (`+` created, `✔` completed, `■` session ended) and
  bumps the frontmatter `updated:` stamp — zero model tokens. `locate()` calls
  `lib.resumePath(cwd, { create: true })` and, only inside a brain with no existing file,
  writes a `seed()` template first. Outside a brain it only appends to an *already-existing*
  root `resume.md` — it never litters a foreign repo.
- **Pre-compaction snapshot — `snapshot.js`** (`PreCompact`): writes a timestamped
  `sessions/<date>-<hms>-precompact.md` containing the resume file's open "Next steps" (skipped
  entirely if the resume file is still a seed) and last-5 task-log lines, plus in-flight specs,
  projects, recent wiki-log heads and Clippings backlog — the deterministic pointers a script
  *can* preserve, since it cannot write narrative itself.
- **`/brain:wrap`** updates the narrative sections of whichever file `resumePath` named (the
  ADR calls this out explicitly: two files can coexist, and "the" file is whichever holds the
  real narrative) — a script cannot write prose, so this step stays model-owned.

## Knobs
- `MONKEY_BRAIN_RESUME_BUDGET` (default 1200 tokens) — `resume.js`'s own injection cap,
  independent of `brain-status.js`'s 3000-token budget (`[[session-injection]]`).
- `TAIL_LINES = 5` — how many task-log entries `resume.js` keeps when injecting.
- Budget degradation (`resume.js:73-83`): drop priority-2 chunks first; if still over budget,
  hard-truncate remaining text to `maxChars` with a pointer back to the file — the ask-directive
  is never dropped.
- `SEED_NARRATIVE` (`lib.js:186`) — the regex defining placeholder text; a new seed wording must
  be added here or it will be read as real content and injected every session.

## Cost
Reader injection is capped at 1200 tokens (separate budget from the 3000-token status block),
only on `startup|clear` sessions, and only when the file holds real content — silent (zero
tokens) on a seed. `resume-log.js` and `snapshot.js` add no model tokens; they are pure file
writes.

## Gotchas & history
- v0.3.0 (Roadmap Phase 2, hook #8) shipped the original reader/auto-logger pair, each with its
  own "brain copy first, root copy second" lookup.
- **The bug (`brain-health-audit` P0 #1):** `/brain:init` seeded an empty `.brain/resume.md`
  beside a repo whose *real* narrative lived in a 16.8 KB root `resume.md` — from then on every
  session got the empty template plus "continue from these notes, or start fresh?" about notes
  that did not exist.
- **v0.30.0 fix:** `lib.resumePath()` became the single resolver for all three scripts,
  content-first (`lib.isSeedResume`) rather than location-first; `resume.js` now stays silent on
  a seed. See ADR [[resume-resolver-prefers-real-narrative]] for the full context/decision/
  consequences (accepted 2026-09-15).
- **Independent review fix (`brain-correctness-review`, same release):** `lib.resumePath()` was
  made to look *beside the brain*, not the current working directory, so a subdirectory session
  still finds the root narrative.
- `engine-resume-history` (this project's own root `resume.md`, ingested as a raw source) is a
  live example of the format in practice: a "Where we left off" narrative, a checkbox "Next
  steps" list, and a long hook-written "Task log (auto)" tail with `✔`/`+`/`■` markers exactly
  as `resume-log.js` writes them.

## Related
- [[session-injection]] — the sibling `SessionStart` hook (`brain-status.js`) that always runs;
  `resume.js` only runs on `startup|clear`.
- [[stop-nudges]] — `wrap[log]`'s git-dirty check (`lib.brainGitDirty`) explicitly excludes
  `resume.md` since these hooks own writing it.
- [[bounded-loops]] — loop state also needs to survive `/clear`; ticks are logged to the spec
  and to `resume.md` for the same reason.
- [[develop-lifecycle-stages]] — `/brain:wrap` (the lifecycle's closing step) is what updates
  the narrative sections this system reads.
- [[claude-code]] — the host whose `SessionStart`/`PreCompact`/`TaskCreated`/`TaskCompleted`/
  `SessionEnd` hook events drive all three scripts.
