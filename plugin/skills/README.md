# skills/ — the /brain:* verbs (Phase 3)

Each skill is a `<name>/SKILL.md` directory here, invoked as `/brain:<name>`
(the `brain` plugin name is the namespace prefix). Natural-phrase triggers
(hook #2 `trigger-router`) are the primary UX; commands are the explicit form.

| Skill | Purpose | Status |
| --- | --- | --- |
| `init` | Scaffold `.brain/` — self-contained: bundled `brain-template/` + `scripts/new-brain.js` (marketplace installs don't ship `bootstrap/`); wires the root `@.brain/CLAUDE.md` import | ✅ |
| `ingest` | The 8-step compile of a source into the wiki (hook #4 checks every page) | ✅ |
| `query` | Index-first answering with citations; novel answers filed back to `syntheses/` | ✅ |
| `lint` | Mechanical scan (`scripts/lint.js`, injected via `` !`…` ``) + reasoning over contradictions/staleness | ✅ |
| `wrap` | Definition-of-done: verify, sync log + index + resume narrative, commit | ✅ |
| `research` | Web + codebase research filed to `wiki/research/` with sources + recommendation | ✅ |
| `plan` | Spec with numbered acceptance criteria + tier; approval stays curator-owned | ✅ |
| `build` | Test-first loop against a spec's ACs (works with the TDD/plan gates) | ✅ |
| `review` | AC verification + code review filed back (synthesis page, ADRs, instinct candidates) | ✅ |
| `terse` | Caveman-style session output compression (code/commands never compressed) | ✅ |
| `compress` | Permanent instruction-file compression with before/after receipts | ✅ |
| `doctor` | Health monitor with token receipts (Phase 8) | ⬜ |
| `packs/<domain>/` | Domain expertise packs — product-design first (Phase 6.5) | ⬜ |

Conventions: SKILL.md < 150 lines (body stays in context); bundled scripts run
via `${CLAUDE_SKILL_DIR}` and are covered by `hooks/scripts/selftest.js`;
`schema/brain-template/` stays the canonical template master
(`new-brain.js --sync-template` refreshes the bundle; selftest fails on drift).
