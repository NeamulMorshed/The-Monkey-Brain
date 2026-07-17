# Changelog — brain plugin

## 0.3.0 — 2026-07-17 (Phase 2, hook #8: resume system)

- **Hook #8a `resume.js`** (SessionStart, matcher `startup|clear`): finds
  `resume.md` (`.brain/resume.md`, falling back to the project root — works in
  brainless projects too) and injects it with a directive to **ask the user
  whether to continue from the notes or start fresh**. Own budget (≤1,200
  tokens): task log trimmed to its tail first, narrative hard-truncated with a
  pointer to the file; the ask-directive is never dropped. Silent when no file
  exists, on resume/compact sources, and on any internal error.
- **Hook #8b `resume-log.js`** (TaskCreated / TaskCompleted / SessionEnd):
  deterministically appends one line per event to `## Task log (auto)` and
  bumps the frontmatter `updated:` stamp — zero model tokens. Inside a brain
  the first event auto-creates `resume.md` from a seed; outside a brain it only
  appends to an existing file (never litters foreign repos).
- `schema/brain-template/resume.md` seeded (with `{{PROJECT}}`/`{{DATE}}`);
  `new-brain.ps1 -Update` now adds `resume.md` to existing brains when missing
  (never overwrites live state).
- Selftest grows to 36 checks (13 new resume cases).

## 0.2.0 — 2026-07-17 (Phase 2, first tranche)

- **Hook #1 `brain-status.js`** (SessionStart): detects `.brain/` and injects a
  budgeted status block (≤3,000 tokens; whole low-priority sections drop first,
  identity/index lines never): operating manual pointer, index stats,
  unprocessed Clippings, active specs + instincts, recent log, memory pointer.
  Silent in projects without a brain.
- **Hook #3 `guards.js`** (PreToolUse on Write|Edit|MultiEdit): secret patterns
  blocked everywhere; `raw-sources/` add-only (edits to existing sources
  blocked); `wiki/log.md` append-only (insertions and `updated:` bumps only);
  architecture-tier plan gate — dormant until `specs/` exists (Phase 4).
- **Hook #4 `wiki-check.js`** (PostToolUse): self-healing wiki — missing
  frontmatter and orphan pages block back into context for same-turn fixes;
  unresolved `[[links]]` are advisory only (deliberate TODO markers stay legal,
  schema §5). Aliases and folder-qualified links resolve; code spans ignored.
- **`selftest.js`**: fixture-based end-to-end suite, 23 checks
  (`node hooks/scripts/selftest.js`).
- `lib.js`: added `readTextSafe`, `parseFrontmatter`, `listFilesRecursive`.

## 0.1.0 — 2026-07-17 (Phase 1 skeleton)

- Plugin manifest (`brain`, displayName "The Monkey Brain") and repo-root
  marketplace manifest (`monkey-brain`) — the repo doubles as its own
  marketplace.
- Node hook runtime foundation: `hooks/scripts/lib.js` (stdin JSON, `.brain/`
  discovery with graceful degradation, token estimate, hook exit-code
  protocol, self-test). `hooks/hooks.json` registered empty — hooks land in
  Phase 2.
- Placeholders documenting what lands where: `skills/` (Phase 3), `agents/`
  (Phase 3–5.5), `.mcp.json` (Phase 5 qmd).
- MIT licensed: `LICENSE` at the repo root and in `plugin/` (the copy that
  ships with installs), `license` field in both manifests.
