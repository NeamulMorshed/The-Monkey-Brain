# Example brain — "How Claude Code works"

This is a **complete, worked Monkey Brain instance** built as a reference sample. It ingested
16 sources (Karpathy's llm-wiki founding pattern, 10 Claude Code documentation pages, the qmd
README, the Bush 1945 Memex citation stub, and the v2 benchmark trio — Caveman, MewVault,
ui-ux-pro-max) into 69 fully cross-linked, lint-clean wiki pages.

Use it to see what a mature brain looks like before you start your own:

- [`wiki/index.md`](wiki/index.md) — the content catalog (start here)
- [`wiki/log.md`](wiki/log.md) — the chronological audit trail of every ingest/lint
- [`wiki/dashboard.md`](wiki/dashboard.md) — live Dataview tables (open in Obsidian)
- [`wiki/syntheses/vault-overview-deck.md`](wiki/syntheses/vault-overview-deck.md) — a Marp slide tour
- [`raw-sources/`](raw-sources/) — the immutable source clippings it was compiled from

This is **demo content**, not the engine. The reusable tool lives in [`../../schema/`](../../schema/)
and [`../../bootstrap/`](../../bootstrap/). To start your own brain in a project, run
`bootstrap/new-brain.ps1` — see the top-level [README](../../README.md).

> Note: this example's `schema/CLAUDE.md` conventions live at the engine level
> ([`../../schema/CLAUDE.md`](../../schema/CLAUDE.md)); this folder is just the resulting wiki +
> sources, so you can browse a finished brain.
