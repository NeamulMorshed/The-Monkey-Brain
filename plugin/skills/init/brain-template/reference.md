---
title: "{{PROJECT}} — Brain Reference"
type: schema
status: living
tags: [schema, reference, monkey-brain]
created: {{DATE}}
updated: {{DATE}}
engine_version: 2.1
---

# 🐵 {{PROJECT}} — Brain Reference

The on-demand half of the operating manual ([CLAUDE.md](CLAUDE.md)): read the section a task
needs; nothing here loads by itself. Section numbers match the manual.

---

## 4. More commands

**Daily:** `/brain:digest` (standup; `week` for the weekly review) · `/brain:dump` (file a loose
note where it belongs) · `/brain:dashboard` (one-page HTML overview) · `/brain:ci` (CI from the
detected stack) · `/brain:usage` (real token receipts) · `/brain:doctor` (19-check health).
Idea validation, URL critiques and meeting prep are modes of `/brain:research`,
`/brain:product-design` and `/brain:brief`. Running loops show at session start; a spec the plan
gate blocks twice lands in `sessions/review-required.md` for the curator.

**Life packs (optional):** `/brain:learn` (spaced repetition — only due cards enter context) ·
`/brain:career` (case studies, CV, skill matrix, mock interviews) in `private/`, which is never
committed with the project or indexed; an uncleared case study can't leave it.

## 7. Team mode

`wiki/log.md`, `sessions/agents.md` and `sessions/review-required.md` merge with git's union
driver (`.gitattributes`), so parallel log entries never conflict; per-machine caches in
`sessions/` (graph, dashboard, receipts, health, loops) stay out of git. Before a long change,
`/brain:lock <spec|brain>` and push `LOCK.md`: teammates see the lock at session start, and the
hooks keep their writes out of the locked scope until it's released or expires.

## 8. Semantic search with qmd

Past ~100 sources, add meaning-based matches:

1. Install qmd — `npm i -g @tobilu/qmd` (needs Node ≥ 22).
2. Index this wiki — `qmd collection add ./wiki` then `qmd update && qmd embed`.
3. Turn it on — create an empty **`.qmd`** marker in this brain (or set `MONKEY_BRAIN_QMD=1`).

`brain-search` then hands off to qmd (its `query` / `get` tools, deferred by Tool Search), and
the session-end hook keeps that index fresh.

**Knobs:** `MONKEY_BRAIN_RECALL=0` turns first-prompt recall off; `MONKEY_BRAIN_CONTEXT_NUDGE`
sets the context-size nudge threshold in tokens (default 150000, `0` off);
`MONKEY_BRAIN_MODEL_BLOCK=0` lifts the per-dispatch model block (manual §5).

---

## 9. Capability plugins & MCP servers (the craft layer)

Craft is done by **capability plugins**. Four ship with the brain plugin as its dependencies —
github, frontend-design, superpowers and security-guidance (which needs Python 3.10+) —
installed and enabled with it; `/brain:init` offers the rest (code-modernization,
ui-ux-pro-max, product-management, …). The rule: **plugins do the craft; the brain records the knowledge** —
every plugin output that is a decision, a finding, or a durable artifact is filed into a
`.brain/` folder by my skills and hooks, so the capability stays transient while its knowledge
compounds here:

- design-system & UI decisions (ui-ux-pro-max / frontend-design) → `decisions/` ADRs; their
  anti-patterns seed `instincts/pending/`.
- security findings (security-guidance) → `wiki/`; open **P0s gate `/brain:wrap`**.
- reviews & PR links (github) → `wiki/syntheses/`; workstream status → `projects/`.
- PRDs (product-management) → `raw-sources/` → ingested; tracking plans → `projects/`;
  migration notes (code-modernization) → `wiki/research/`.
- superpowers — a brainstorming design → `wiki/research/<topic>.md` (or the Notes of the spec it
  feeds); a written plan → the spec it implements (ACs, test plan, notes); a root cause from
  systematic debugging → `wiki/`. The plugin keeps its own copies under `docs/superpowers/`; the
  wiki-check hook names the brain home for each one it writes.

Plugins auto-activate by their own descriptions; the trigger-router routes **my** workflows.
When a plugin and one of mine both apply, precedence is: **deterministic trigger > domain
pack > domain skill > craft plugin > general model**.

**MCP servers (the connected-data layer).** Same contract, extended to MCP servers: I never
install one, run its setup command, or touch a credential — I only recognize servers the
curator already connected and know where their output belongs. `/brain:init` offers the
curated set (`recommended-mcp-servers.json`; currently Supabase, Firebase, Figma, Framer,
Vercel) and marks which are already in this project's `.mcp.json`.

- Supabase / Firebase — schema, migration, auth, and hosting decisions → `decisions/` ADRs;
  the live project shape → `wiki/entities/`.
- Figma / Framer — design-system decisions pulled from the tool → `decisions/` ADRs (same
  folder frontend-design/ui-ux-pro-max write to; the MCP server supplies design context,
  those plugins still own implementation decisions).
- Vercel — deploy config decisions → `decisions/` ADRs; live deployment/build status →
  `projects/`.

A connected MCP server outside this curated set still gets surfaced (generic "no filing
rules yet" note) rather than going unmentioned — treat its output as a finding and file it
by hand until it earns a curated entry.

---

## 10. Domain pipelines (products & games)

Both pipelines reuse the develop lifecycle (manual §4) — research is always filed, plans always
carry numbered ACs, approval always gates architecture-tier code — with a domain-shaped front end.

**Product:** the §4 develop lifecycle with a PRD in front and tracking behind.
`/brain:research` files the idea to `wiki/research/` → the `product-management` plugin drafts a
PRD into `raw-sources/` → `/brain:ingest` compiles it → then §4 as written (plan → build →
review), with `product-tracking` plans living in `projects/`. No special skill — it's the
standard lifecycle composed.

**Game:** concept → GDD → prototype spec → build → playtest → balance. Run `/brain:game`.
The **GDD** (`templates/gdd.md`) captures concept, MDA, core loop, progression, art direction;
its open questions become the **prototype spec**'s ACs (`/brain:plan`, tiered); `/brain:build`
implements against an engine entity page ([[godot]] / [[unity]] / web in `wiki/entities/`);
each **playtest** is ingested as a raw source; each **balance** decision is a `decisions/` ADR.

Everything files back — the wiki-check hook blocks orphans, and `/brain:wrap` closes each phase.
