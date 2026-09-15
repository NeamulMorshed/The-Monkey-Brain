---
title: "Wiki self-healing: link and orphan checks"
type: concept
status: active
tags: [hooks, wiki, links, lint, enforcement]
created: 2026-09-16
updated: 2026-09-16
sources: ["[[engine-roadmap]]", "[[engine-changelog]]", "[[brain-health-audit]]", "[[brain-correctness-review]]"]
related: ["[[doctor-health-checks]]", "[[plan-and-tdd-gates]]", "[[trigger-router]]", "[[develop-lifecycle-stages]]"]
aliases: [wiki-check, self-healing wiki]
---

# Wiki self-healing: link and orphan checks

What it is: the brain keeps its own graph consistent without a separate lint pass, by checking
every wiki page immediately after it is written and feeding failures back into the same turn
(ROADMAP Phase 2 hook #4, "self-healing wiki"). A second, on-demand layer (`/brain:lint`) scans
the whole vault mechanically for the same class of issues plus a few vault-wide ones.

## How it works
- **`plugin/hooks/scripts/wiki-check.js`** — a `PostToolUse` hook on `Write|Edit|MultiEdit`
  (registered in `plugin/hooks/hooks.json:64-70`), scoped to files under a brain's `wiki/`.
  On every such write it:
  - maps the vault's slugs, folder-qualified names and `aliases:` (`wiki-check.js:47-56`);
  - extracts the touched page's outbound `[[links]]`, stripping code spans/fences first
    (`wiki-check.js:58-65`);
  - checks frontmatter completeness — `type:` and `updated:` must be present (`:67-74`);
  - checks the page has ≥1 inbound `[[link]]` from elsewhere in the vault, exempting
    `index`/`log`/`dashboard` (`:76-91`); a table-escaped link (`[[slug\|Alias]]`, the pipe
    escaped by Obsidian inside a Markdown table) still counts as inbound (`:80`, fixed
    2026-07-19 — see Gotchas).
  - **BLOCK-level** — missing frontmatter fields or an orphan page: `decision: "block"` puts
    the reason back into context so the same turn fixes it (`:104-107`).
  - **ADVISORY** — unresolved `[[wikilinks]]` are reported via `additionalContext`, not
    blocked: a link to a not-yet-created page is a legal, deliberate TODO marker (manual §6)
    (`:100-102`, `:108-111`).
  - Outside a brain, outside `wiki/`, or on any internal error: silent no-op (`:18`, `:31-40`).
- **`plugin/skills/lint/scripts/lint.js`** — the mechanical layer of `/brain:lint`, injected
  into the skill via `` !`node lint.js` `` preprocessing so the model's reasoning pass (
  contradictions, staleness, gaps) starts from a clean mechanical report. It scans the whole
  `wiki/` tree for: broken `[[links]]` (target → referrers, `lint.js:61-79`), orphans
  (`:81-93`, same table-escape fix), frontmatter gaps (`:95-109`), `index.md` `source_count`/
  `page_count` drift (`:111-129`), a `Clippings/` backlog (`:131-136`), and stray root `.md`
  files that aren't `README.md`/`CLAUDE.md`/`reference.md`/`resume.md`/`LOCK.md`
  (`:138-152`, the legit-root set grew `LOCK.md` for the team lock in `brain-correctness`).
  `--strict` exits 1 on any issue group (CI use); default exit is always 0 so injection never
  breaks a skill run.
- Both scripts, plus `doctor.js` (see [[doctor-health-checks]]), share the same link/alias
  extraction logic (`lib.extractAliases`, shared since v0.28.0) so the three checkers agree.

## Knobs
- `ORPHAN_EXEMPT` (both scripts): `index`, `log`, `dashboard` — never flagged as orphans.
- `lint.js --brain <path>` overrides the walk-up brain discovery; `--strict` for CI.
- No environment variable disables wiki-check; it only fires on writes under `wiki/`.

## Cost
Zero model tokens for the mechanical layer — both are plain Node scripts. `wiki-check` adds one
hook invocation per wiki write; `lint.js`'s output is injected as literal text before the
model's reasoning pass, so its cost is the report size, not a subagent call.

## Gotchas & history
- **The `wiki/`-only link-index gap is fixed** ([[links-resolve-across-records]]). Through
  0.31.0, link resolution in all three checkers (wiki-check, lint, `doctor.js`) only indexed
  `wiki/**` — slugs, qualified paths and aliases — so a `[[link]]` to a `specs/`, `decisions/`
  or `projects/` record (e.g. this brain's own `[[token-diet]]` or `[[brain-correctness]]`
  specs) read as **broken**, even though the templates tell authors to link those records.
  Spec `[[engine-knowledge]]` closed the gap: `lib.linkIndex(brain)` is now the one inventory
  all three checkers consult — `wiki/**` plus `specs/`, `decisions/` and `projects/` records
  (never `templates/`), matched by slug, folder-qualified name and alias; orphan checks count
  an inbound link from any of those record kinds too. A follow-up review fix in the same
  release: `linkIndex` also resolves case-insensitively (as Obsidian does), reports slugs that
  name more than one file (a lint issue group and doctor check 1's ambiguous-link case), and
  resolves a `specs/x`-style link only to a spec named `x` (not a wiki page or another record
  kind that happens to share the tail segment).
- **Escaped-pipe table links** (`[[page\|Label]]`): dogfooding on a fresh scaffold (2026-07-19)
  found the parser splitting only on `|`, leaving a dangling `\` so the target read as `page\`
  and was wrongly reported broken — false-positived 16 links in the 69-page example brain at
  the time. Fixed in all three parsers (`split(/\\?\|/)`) with regression cases; the example
  brain went lint-clean under `--strict`.
- **Frontmatter comments hid tiers from every gate** (P15, v0.20.0): YAML inline comments on
  a spec's `tier:` line made it invisible to the plan/TDD gates — fixed in
  `lib.parseFrontmatter`, which wiki-check, lint and doctor all share.
- The review of `brain-correctness` (2026-09-15) tightened `openP0Lines` section-awareness
  used by [[doctor-health-checks]] and [[bounded-loops]] rather than wiki-check itself, but
  shares the same "one shared lib function, three consumers" pattern this page describes.

## Related
- [[doctor-health-checks]] — the periodic, 20-check superset that also reads these same link/
  orphan signals (checks 1–2) plus health that persists across sessions.
- [[plan-and-tdd-gates]] — the sibling enforcement layer for source writes, same hooks.json,
  different concern (immutability/tiers vs. graph consistency).
- [[engine-knowledge]] — the spec (in review) that fixed the `wiki/`-only link-index gap.
- [[links-resolve-across-records]] — the ADR for the link-index widening this page describes.
- [[trigger-router]] — routes "lint the brain" to `/brain:lint`, distinct from "brain doctor".
