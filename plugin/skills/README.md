# skills/ — lands in Phase 3

Each skill is a `<name>/SKILL.md` directory here, invoked as `/brain:<name>`
(the `brain` plugin name is the namespace prefix). Natural-phrase triggers
(Phase 2 hook #2) are the primary UX; commands are the explicit form.

Planned set (ROADMAP Phase 3):

| Skill | Purpose |
| --- | --- |
| `init` | Scaffold `.brain/` (wraps `bootstrap/`), root `@.brain/CLAUDE.md` import, offer plugin manifest |
| `ingest` | The 8-step compile of a source into the wiki |
| `query` | Index-first answering; novel answers filed back to `syntheses/` |
| `lint` | Mechanical scan + reasoning over contradictions/staleness |
| `wrap` | Definition-of-done: verify ACs, run checks, update log + index, commit |
| `research` | Web + codebase research filed to `wiki/research/` |
| `plan` | Spec with numbered acceptance criteria; arms the plan gate |
| `build` | TDD loop against a spec's criteria |
| `review` | Code review filed back as a wiki page |
| `terse` / `compress` | Caveman-style output mode / permanent memory-file compression |
| `doctor` | Health monitor with token receipts (Phase 8) |
| `packs/<domain>/` | Domain expertise packs — product-design first (Phase 6.5) |
