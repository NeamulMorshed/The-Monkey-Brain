# Changelog — brain plugin

## 0.28.0 — 2026-09-15 (develop lifecycle fixes — first dogfood of the lifecycle on this repo)

The engine repo now carries its own `.brain/`, and the first thing run through it was the
develop lifecycle itself (`research → plan → build → review → wrap`, filed as
`wiki/research/develop-lifecycle-dogfood.md` and `specs/develop-lifecycle-fixes.md`). Four
things a curator tripped over, fixed:

- **Gate scoping (`hooks/scripts/guards.js`, `lib.js`)** — a spec may declare `scope:`
  (project-relative globs: `**` spans directories, a bare path claims itself and everything
  beneath it). The plan and TDD gates consult only the open specs whose scope claims the
  written path; a path no spec claims is still checked against every open spec, so brains
  without `scope:` fields see no change. Writes outside the project root are never gated.
  `lib.parseFrontmatter` now returns inline `[a, b]` and block `- item` lists as arrays
  (`wiki-check.js` alias extraction updated to match). `templates/spec.md` carries a
  commented `scope: []` line and `/brain:plan` fills it from the `graph.js radius` output.
- **Review hand-off (`skills/review`, `wrap`, `build`)** — `/brain:review` now has two named
  exits: any failed AC → `phase: build`, blockers listed under `## Blockers` in the spec,
  offer `/brain:build <slug>`; all green → `status: done`, offer `/brain:wrap`. `/brain:wrap`
  trusts a `done` spec and re-verifies only `active` ones, reporting (never resolving) a
  disagreement. `/brain:build` states it never sets `plan_approved` and starts from the
  spec's `## Blockers` when one exists.
- **One Stop message (`hooks/scripts/wrap.js`)** — the three Stop-time checks (log lag,
  missing ADR, uncommitted `.brain/`) now all run on every Stop and block once with every
  unmet item listed, each still shown at most once per session. Previously each check exited
  on first hit, so a clean wrap could take three Stop attempts.
- **One lifecycle definition (instance manual §4)** — §4 now states the four stages, their
  hand-offs, and where `/brain:loop`, `/brain:wrap`, `/brain:digest` and `/brain:dump` sit
  around them; §10, `skills/README.md` and the plugin README cite §4 instead of restating a
  different sequence.
- **Review fixes (same release):** the first glob→regex builder ran rewrite passes that clobbered
  each other, so `src/**/*.js` matched nothing and `src/auth/**` only one level deep — an
  unapproved architecture spec could be bypassed by a sibling spec's literal scope. Replaced by a
  single-pass tokenizer (`globToRegExp`) that also escapes `[`/`]` (an unbalanced bracket used to
  throw and fail-open every gate). `lib.extractAliases` is now shared by wiki-check, doctor and
  lint (the latter two still expected string aliases). Parser edge cases: `[0-9]+` and `[WIP] thing`
  stay scalars, comments after inline lists and `#` inside quotes survive, quoted commas don't
  split, a nested map no longer leaks `- item` lines into the previous key, column-0 block lists
  parse, `bans.compile` tolerates an array from an unquoted `ban: [0-9]`, and a project directory
  named `..x` is still inside the project.
- Selftest 354 → 390 (gate scoping + glob semantics ×17, frontmatter lists + edge cases ×12,
  consolidated Stop ×2, lifecycle docs ×8).

## 0.27.0 — 2026-09-15 (automatic uncommitted-changes nudge)

The automatic Stop hook now also reminds you when `.brain/` has uncommitted git changes,
instead of that check only existing inside an on-demand `/brain:doctor` run.

- **`hooks/scripts/wrap.js`** — new `gitCheck()`, a third Stop-time reminder alongside the
  existing "wiki changed but not logged" and "build/review with no ADR" nudges. Runs `git
  status --porcelain -- .` scoped to the brain dir (mirrors `doctor.js` check #7), blocks
  ONCE per session pointing at `/brain:wrap` or a manual commit, and stays silent when
  `.brain/` isn't inside a git repo or git isn't installed. Advisory only — it never runs
  `git commit`/`git push` itself; the brain still never touches git on its own, it just tells
  you sooner. Zero changes to `/brain:doctor` or any other hook.
- Selftest 350 → 354.

## 0.26.0 — 2026-09-15 (gh-based PR review)

Read-only GitHub PR support for `/brain:review`: fetch a live PR's diff and CI check status
via `gh`, review it exactly like any other scope, and file the same synthesis page — the
brain never posts anything back to GitHub.

- **`hooks/scripts/pr.js`** — wraps `gh pr view/checks/diff` (`node pr.js <ref> [--json]
  [--no-diff]`; no ref = current branch's PR). Fails open with a plain-text message when `gh`
  is missing or unauthenticated; the binary name is overridable via `MONKEY_BRAIN_GH_CMD` for
  deterministic selftest coverage. No write calls anywhere — no `gh pr comment` / `gh pr
  review` / `gh pr merge`; posting to GitHub stays a manual curator action.
- **`skills/review/SKILL.md`** — step 1 (Scope) gains a PR-mode branch: a PR number, URL, or
  "review the PR" runs `pr.js` for metadata + CI checks + diff in one call; a green CI summary
  counts as the "green CI" evidence step 2 already asks for. Step 4's review-page bullet notes
  the PR URL + CI summary get filed the same as any other scope.
- Selftest 344 → 350.

## 0.25.0 — 2026-09-15 (MCP capability registry)

Capability-awareness for MCP servers, mirroring the P6 capability-plugin registry: "MCP
servers do the craft; the brain records the knowledge." The brain never installs a server,
runs its setup command, or touches a credential — it only recognizes servers the curator
already connected and knows which `.brain/` folder their output belongs in.

- **`skills/init/recommended-mcp-servers.json`** — a curated registry (same shape as
  `recommended-plugins.json`) with five launch entries: Supabase and Firebase (schema/
  migration/auth decisions → `decisions/` ADRs, live shape → `wiki/entities/`), Figma and
  Framer (design-system decisions → `decisions/`, same precedence as ui-ux-pro-max/
  frontend-design — the MCP server supplies design context, those plugins still decide the
  build), and Vercel (deploy config → `decisions/`, live deployment status → `projects/`).
  Notion is deferred — a content-source-shaped MCP needs a different filing story
  (raw-source ingestion, not ADRs) than the dev-infra-shaped five above.
- **`skills/init/scripts/mcp-servers.js`** — renders the curated list and reads the
  project's `.mcp.json` (`mcpServers` keys, excluding the brain's own `brain-search`) to mark
  which curated servers are already configured; any configured server outside the curated set
  surfaces under a generic "no filing rules yet" fallback instead of going unmentioned. Fails
  open on a missing/malformed `.mcp.json` — never crashes `/brain:init`.
- **`/brain:init` step 6b** — offers the curated set right after the existing capability-plugin
  offer; hands over each entry's `setup_hint` (an env-var placeholder, never a literal secret)
  for the curator to run and confirm themselves.
- Instance manual **§9** — "Capability plugins & MCP servers (the craft layer)" states the
  same recording contract for both.
- Zero changes to `brain-status.js`, `guards.js`, `wiki-check.js`, `trigger-router.js`, or
  `doctor.js` — filing stays advisory, picked up by the brain's own skills exactly like plugin
  output already is; no hook watches MCP tool calls.
- Selftest 331 → 344.

## 0.24.1 — 2026-09-14 (plans are Markdown)

- `/brain:plan` and the instance manual (§4 Develop) now say the spec file *is* the plan:
  Markdown only, no web page or artifact unless the curator asks. Claude Code's own
  publishing guidance nudges the model to publish plans as pages; the gates, `/brain:build`
  and `/brain:review` read the Markdown, so a page is a second copy that drifts.
- Caveman is credited, not recommended: the brain already ships its token trio (terse,
  `/brain:compress`, `/brain:usage`), and running both pays for the rules twice per turn.

## 0.24.0 — 2026-09-14 (plan before build)

The router only sent work through `/brain:plan` when the prompt literally said "spec", and the
plan gate in `guards.js` only fires against a spec that already exists — so "add a login
feature" went straight to code with no spec ever written.

- **`hooks/scripts/trigger-router.js`** — a last-position rule catches generic development
  intent (a dev verb — build/implement/add/fix/refactor/… — within ~60 chars of a dev noun —
  feature/endpoint/page/bug/module/…). It reads the open specs (status not
  done/closed/superseded) and injects: *plan before build — no source change without a spec*;
  with no open specs → invoke `brain:plan` now; with open specs → the list with tier/phase, and
  `brain:build <slug>` if one covers the request, else `brain:plan` first. The curator can waive
  it explicitly in the message. Question-shaped prompts (why/what/how/explain…) stay silent;
  every specific workflow above it ("write a spec", "implement the spec", game, product-design…)
  still wins first. Still advisory — the router never blocks.
- Selftest 319 → 331.

## 0.23.0 — 2026-09-13 (Monkey Brain Home: a per-user dashboard)

`/brain:dashboard` shows one project. Nothing showed all of them — until now.

- **`hooks/scripts/registry.js`** — a lightweight cross-project registry at
  `~/.claude/monkey-brain/projects.json` (or under `CLAUDE_CONFIG_DIR`), keyed by each project's
  resolved path (case-folded on Windows). `/brain:init` (`new-brain.js`, both create and
  `--update` paths) registers a project the moment it scaffolds or refreshes a brain; hook #1
  `brain-status` also touches the registry on every session start, so a brain that predates this
  feature — or was never re-inited — still shows up the next time someone opens it. Listing
  self-prunes any entry whose `.brain/` is gone.
- **`/brain:home`** + `hooks/scripts/home.js` — one self-contained, offline HTML page
  (`~/.claude/monkey-brain/home.html`) aggregating every registered project still on disk: a
  health-status pill from its last doctor run, open-spec and running-loop counts, and real token
  usage + cache-hit ratio (same source as `/brain:usage`) — per project and combined. A "needs
  attention" section rolls up anything critical or awaiting curator review across every project
  at a glance. All project text is HTML-escaped.
- Router: "show all my brains", "dashboard across all my projects", "monkey brain home" — with a
  guard so a plain "show me the dashboard" still means the current project's own
  `/brain:dashboard`.
- Selftest isolated from the real `~/.claude` for the whole run (`CLAUDE_CONFIG_DIR` pointed at a
  throwaway temp dir globally) — without that, every scratch brain the suite scaffolds would have
  registered itself in the real user's registry. Verified end to end against this repo, too:
  scaffold → register → generate → self-prune on delete, all for real. Selftest 304 → 319.

## 0.22.0 — 2026-09-13 (v3 P17: life packs — v3 complete)

Two optional packs for the work around the work.

- **`/brain:learn`** — spaced repetition with SM-2 (`skills/learn/scripts/srs.js`): decks in
  `.brain/learning/<deck>.json`; `due` prints only due cards (capped, default 20), so a drill costs
  the same however large the deck grows; grades below 3 restart a card with its ease kept, 3–5
  grow the interval (1 → 6 → interval × ease). Each session also compiles one new concept into
  the wiki, and reference facts must come from a cited source, never invented.
- **`/brain:career`** — case studies built from the brain's own specs, reviews and ADRs
  (assembled → drafted → publishable), a master CV with role variants, an evidence-backed skill
  matrix, and mock interviews grounded in real decisions. Everything lives in `.brain/private/`,
  which new brains gitignore and search never indexes. **Guards:** a case study can't be
  `publishable` without `confidentiality: cleared`, and an uncleared one can't be written outside
  `private/` — Edits are checked against the file's resulting text.
- The idea hub needs no new skill: `/brain:dump` captures ideas, and `/brain:research` validation
  mode decides pursue / park / kill.
- Router: "practice <language> flashcards", "spaced repetition", "case study", "mock interview",
  "update my CV" — with a guard so "best practice" stays out of the learn pack.
- Selftest 286 → **304 checks**. **v3 is complete:** P10–P17 close all seven gaps from the
  competitive re-benchmark.

## 0.21.0 — 2026-09-13 (v3 P16: team mode)

One brain, several people, no merge fights.

- **Union merges** — new brains ship `.gitattributes` so `wiki/log.md`, `sessions/agents.md` and
  `sessions/review-required.md` merge with git's built-in union driver: two people logging work
  in parallel never conflict. Verified end to end in the selftest with a bare repo and two clones.
- **Per-machine caches stay local** — `sessions/.gitignore` keeps the graph cache, dashboard,
  injection receipts, edit counts, health report, gate counters and loop state out of git.
- **`/brain:lock`** (`hooks/scripts/lock.js`) — a committed, expiring `LOCK.md` on one spec or
  the whole brain (`acquire` / `release` / `status`, default 8 hours; identity from
  `MONKEY_BRAIN_AUTHOR`, then git's user.email / user.name). Teammates see it at session start
  (`brain-status`, never dropped by the budget), and `guards` keeps their writes out of the
  locked scope until it's released or expires; taking over needs `--force` after agreeing.
- **Per-author digests** — a teammate's same-day standup is never overwritten: the second
  author's file gets a name suffix, and every digest records its author.
- `/brain:init --update` adds `.gitattributes` and `sessions/.gitignore` to existing brains;
  instance manual §7 explains working as a team. Router: "lock the <x> spec", "who has the lock",
  "release the lock" — with a guard so app "lock screen" work stays app work.
- Selftest 267 → **286 checks**.

## 0.20.0 — 2026-09-13 (v3 P15: learned bans)

A correction made three times becomes a rule; a rule with a pattern becomes enforcement.

- **Fixed: the gates missed specs that keep the template's comments.** `lib.parseFrontmatter`
  didn't strip YAML inline comments, so a spec line like
  `tier: architecture   # quick | feature | architecture` parsed as the whole string and **the plan
  and TDD gates never fired** for that spec (the P9 dogfood specs had no comments, which hid it).
  Unquoted values now drop a `#` comment that follows whitespace, as YAML does; quoted values are
  untouched. Regression tests in `lib.js` and the selftest.
- **Learned bans** (`hooks/scripts/bans.js`) — an active instinct can carry `ban:` (a
  single-quoted regex), `ban_paths:` (a regex on the project path) and `enforce: warn|block`.
  `warn` matches in the text a write adds are reported right after it (instinct-track), with the
  line; `block` matches are refused before the write (guards). Invalid patterns are skipped, never
  fatal.
- **Pack bans** — the product-design pack ships `bans.json` (gradient text, glassmorphism, radii
  over 16px, accent side-stripes, tracking over 0.15em), active while a workstream declares
  `pack: product-design`.
- **The instinct queue** (`hooks/scripts/instincts.js`) — `status` ranks pending rules by
  confidence (explicit, or from the evidence count) and flags `promote?` (≥ 0.8) and stale
  (> 30 days); plus `promote`, `prune` (kept in `pruned/`) and `test <file>`. `/brain:review`
  works the queue; promotion stays the curator's call.
- `brain-status` lists how many learned bans are enforced; the instinct template gains
  `confidence`, `ban`, `ban_paths` and `enforce`.
- Selftest 253 → **267 checks**; the example brain still lints clean under the new parser.

## 0.19.0 — 2026-09-13 (v3 P14: daily-driver workflows)

The everyday rituals, each reading the compiled brain and filing its result back.

- **`/brain:digest`** (`hooks/scripts/digest.js`) — standup (24 h) or weekly review (`week`):
  **Blocked** first (open P0s, specs the plan gate keeps blocking, the last doctor report,
  workstreams idle 21+ days), then **Done** (log entries + git commits in the window), then
  **In flight** (running loops, open specs with AC progress, each workstream's next step). The
  weekly adds decisions made, specs closed, the instinct queue and real token usage. Filed to
  `sessions/standup-<date>.md` / `weekly-<date>.md`.
- **`/brain:dump`** — classify a loose note and file each part where the brain will find it:
  decision → `decisions/` ADR · fact → `memory/` · next step → the workstream's `## Next` · idea
  → `wiki/research/ideas.md` · link → `Clippings/` · correction → `instincts/pending/`.
- **`/brain:dashboard`** (`dashboard.js`) — one self-contained, offline HTML page
  (`sessions/dashboard.html`): index stats, open specs with AC progress bars, loops,
  workstreams, health, recent log and decisions, 7-day tokens by model. All brain text is
  HTML-escaped; `--open` opens it in the default browser.
- **`/brain:ci`** (`ci.js`) — GitHub Actions from the detected stack: Node (npm / pnpm / yarn,
  running whichever of lint, typecheck, test and build exist), Python, Go, .NET and Rust.
  Previews with `--dry-run`; never overwrites without `--force`. **Doctor check 19** warns on a
  code project with no CI.
- **Modes, not more skills** — to keep the always-on skill list small, idea validation (pursue /
  park / kill) lives in `/brain:research`, URL critiques (P0–P3, heuristics + WCAG) in
  `/brain:product-design`, and meeting prep in `/brain:brief`.
- Router: standup, weekly review, dump / "we decided", dashboard, set up CI, validate this idea,
  critique <url>, meeting prep — with a guard so an app's "analytics dashboard" feature doesn't
  route to the brain dashboard.
- Selftest 230 → **253 checks**.

## 0.18.0 — 2026-09-13 (v3 P13: blast-radius routing)

Size a change from the code it actually touches, before choosing the gate.

- **`hooks/scripts/graph.js`** — a zero-dependency import-graph scanner for JS/TS (ES imports,
  `require`, dynamic `import()`, and the CommonJS `require(path.join(__dirname, …))` idiom),
  Python (absolute and relative imports), Go (module paths via `go.mod`) and C# (`using` →
  `namespace`). It skips `node_modules`, build output and dot-folders, and caches the graph in
  `sessions/graph.json` keyed by file mtime, so a rebuild re-reads only what changed. 1,000 files
  scan in well under 2 s.
- **`radius`** walks everything that imports the anchors (2 hops) and scores files × directories
  × file types into a suggested tier — `quick` ≤ 3 · `feature` ≤ 45 · `architecture` above, which
  arms the plan gate — and a model.
- **`/brain:plan`** runs it before settling a spec's tier and records the radius line as the
  rationale; instance manual §5 explains the sizing.
- The smoke test on this repo first reported 0 internal imports — every hook loads its helpers
  with `require(path.join(__dirname, …))` — so the scanner learned that idiom; `lib.js` now shows
  18 dependents (architecture) and `search.js` 2 (quick).
- Selftest 218 → **230 checks**.

## 0.17.0 — 2026-09-13 (v3 P12: loops that stop)

Autonomous iteration with a stop condition the brain supplies, not the token budget.

- **`/brain:loop`** + `hooks/scripts/loop.js` — three loop types: `spec` (build → verify; done
  when every AC in the spec is ✅), `research` (done when `wiki/research/<slug>.md` has a
  Recommendation and stops changing) and `design` (done when the project page has no open P0).
  Each tick is checked for livelock (the same result 3 ticks running), stalls
  (`--max-no-progress`, default 3) and a tick cap (`--max-ticks`, default 12). State lives in
  `sessions/loops/`; spec loops log every tick in the spec's `## Loop log`.
- **Survives `/clear` and compaction** — `brain-status` lists running loops at every session start.
- **Verifier ≠ generator** — while a loop started with `--generator` runs, `agent-track` blocks a
  verify / review / audit dispatch on the same model family.
- **Plan-gate escalation** — the second time the plan gate blocks source writes for the same
  unapproved architecture spec, `guards` tells the model to stop retrying, writes
  `sessions/review-required.md`, and `brain-status` surfaces it next session.
- Router: "keep going until…", "loop until…", "iterate … until" → `/brain:loop`. Instance manual
  §4 notes loops and the escalation.
- Selftest 197 → **218 checks** (217 off Windows).

## 0.16.0 — 2026-09-13 (v3 P11: real receipts)

Token accounting from Claude Code's own transcripts instead of estimates.

- **`/brain:usage`** (`hooks/scripts/usage.js`, injected) — tokens per day, model and git
  branch, the prompt-cache hit ratio (cache reads ÷ all input) and the subagent share, read
  from `~/.claude/projects/<project>/` transcripts and each session's `subagents/`. Every API
  response is logged once per content block, so totals dedupe by message id. Honors
  `CLAUDE_CONFIG_DIR`, and matches the transcript folder case-insensitively on Windows (Claude
  Code records `f--…` for `F:\…` — the smoke test on this repo's live session caught it).
  About 100 ms on a session of 67 API calls.
- **Outcome ledger** — hook #7 `agent-track` also runs on `SubagentStop`: each finished
  subagent adds a `↳ done|empty` line to `sessions/agents.md` with the model(s) that actually
  ran and its real token count from its own transcript.
- **Doctor 15 → 18 checks:** 16 cache safety (warns when `ANTHROPIC_BASE_URL`, from the
  environment or settings, routes through a non-Anthropic host); 17 cache-hit ratio over 7
  days (warn < 50%, info < 80%); 18 dispatch outcomes (warn when ≥ 25% of the last 20
  subagents returned nothing).
- **CI** — `.github/workflows/selftest.yml` runs the hook self-check, the selftest and a strict
  lint of the example brain on Windows, macOS and Linux × Node 18 and 22.
- Router: "token usage / token report / cache hit" → `/brain:usage` (no brain needed). Hook
  events 8 → 9.
- Selftest 184 → **197 checks** (196 off Windows).

## 0.15.0 — 2026-09-13 (v3 P10: always-on recall)

Always-on recall like a competitor's, without its database, embedding server, or install steps.

- **Built-in recall** (`hooks/scripts/search.js`) — pure-Node BM25 over the compiled layers
  (`wiki/`, `decisions/`, `specs/`, `projects/`, `memory/`; never `raw-sources/` or the
  index/log hubs), read fresh from the files on every call, so it can't go stale. About
  100 ms on the 69-page example brain.
- **The `brain-search` MCP serves it by default** (`search-mcp.js`, replacing `qmd-mcp.js`):
  `brain_search` (ranked pages + snippets) and `brain_brief` (a cited pack of at most ~2k
  tokens). Opting into qmd still hands off to vector search; without a brain the server
  exposes zero tools and no instructions.
- **`/brain:brief <topic>`** — the command form of the pack (`model: sonnet`, `effort: low`);
  the router sends "brief me on X" / "catch me up on X" to it.
- **First-prompt recall** (`recall.js`, UserPromptSubmit) — a session's first natural-language
  prompt is searched against the brain, and up to 3 pages matching at least 2 of its words
  are injected (~300 tokens). `MONKEY_BRAIN_RECALL=0` turns it off.
- `brain-status` names the search tools every session; doctor check 10 reports built-in
  coverage (qmd is now an `info`-level upgrade past ~100 pages, not a warning); hook
  registration expects `recall`. Instance manual §8 rewritten.
- Selftest 168 → **184 checks**.

## 0.14.0 — 2026-09-13 (capability plugins ship with brain + brain-all bundle)

Installing `brain` now installs the core craft layer too — no separate step.

- **Five plugin dependencies** in `.claude-plugin/plugin.json` — github,
  frontend-design, superpowers, security-guidance, code-modernization — resolved
  from `claude-plugins-official` and enabled together with brain. The marketplace
  allowlists that source (`allowCrossMarketplaceDependenciesOn`). They are the
  `auto_install: true` entries of `recommended-plugins.json`; selftest keeps the two
  in sync. If the official marketplace is missing (network/policy), brain reports a
  dependency error until it is added.
- **`brain-all` opt-in bundle** (`bundles/brain-all/`, `/plugin install
  brain-all@monkey-brain`) — brain plus every official plugin (293 at generation),
  minus `explanatory-output-style` / `learning-output-style`, which contradict the
  default terse mode. `bundles/gen-brain-all.js` regenerates it from the official
  catalog; `--check` exits 1 on drift — run it before each release, because a
  plugin the catalog drops makes the whole bundle unloadable.
- `/brain:init` step 6 and `plugins.js` mark the five as ✓ shipped (mention, don't
  offer) and name the bundle; instance manual §9 updated.
- Selftest 164 → **168 checks**.

## 0.13.0 — 2026-09-13 (terse mode on by default)

Terse output no longer needs activating — installing the plugin turns it on.

- **Hook #1 `brain-status` injects the terse rules at every session start**, in
  every project (brain or no brain) and on every source (startup/resume/clear/
  compact, so it survives compaction). The rules are read at runtime from the
  `## Rules` section of `skills/terse/SKILL.md` — one source, no drift. In a
  brain, the block is priority 0 (never dropped by the injection budget).
- **Opt out:** `/brain:terse off` for the session; an empty `.no-terse` file at the
  project root, or `MONKEY_BRAIN_TERSE=0`, turns it off permanently.
- `/brain:terse` is now the toggle (off / back on); the trigger-router also routes
  "more verbose" / "normal verbosity" to it.
- Selftest 158 → **164 checks**.

## 0.12.1 — 2026-07-18 (Phase 9: dogfood — escaped-pipe wikilink fix)

Dogfooding the engine on a fresh brain (scaffold → lint-clean + doctor-clean;
7/7 enforcement gates fire) surfaced a real parser bug, now fixed.

- **Escaped-pipe wikilinks in tables** — a link like `[[page\|Label]]` inside a
  markdown table (where the display pipe must be escaped as `\|`) was parsed by
  splitting on `|` only, leaving a dangling `\` so the target read as `page\` and
  was wrongly reported **broken**. Fixed the target extraction (`split(/\\?\|/)`)
  in all three link parsers — `lint.js`, `doctor.js`, and `wiki-check.js`. The
  bundled 69-page example brain, which had 16 such false positives, now lints
  **clean** (0 broken, 0 orphans) under `--strict`.
- Selftest 156 → **158 checks** (escaped-pipe regression in lint + wiki-check).

## 0.12.0 — 2026-07-18 (Phase 8: /brain:doctor health monitor)

Fifteen deterministic health checks (benchmark parity), with receipts, and a
report that the next session's status block surfaces on its own.

- **`/brain:doctor`** (`skills/doctor/` + `scripts/doctor.js`) — the mechanical
  scan is injected via `` !`…` `` (zero model tokens), then the skill triages.
  The 15 checks: **1** broken links · **2** orphans · **3** stale/contradiction
  flags · **4** index freshness vs page count · **5** Clippings backlog · **6**
  log gaps (session activity newer than the log) · **7** uncommitted `.brain/` ·
  **8** hook registration · **9** injection size vs budget (reads
  `injection-stats.json`) · **10** semantic-index freshness · **11** WIP limits
  (≤3 active, none idle 21+ days) · **12** instinct-queue overflow · **13** specs
  without a test plan · **14** open **P0** findings · **15** schema version vs
  engine — plus a **model-mix** line from `sessions/agents.md`. Levels
  `ok · info · warn · crit`; **criticals gate `/brain:wrap`**.
- **Health report surfaced next session:** `doctor.js` writes
  `sessions/health.json`; **hook #1 `brain-status`** reads it and injects a compact
  `🩺 Health` line (counts + top findings + staleness) whenever the last run had
  open warnings/criticals — so failures carry into the next session for free.
- **Routing:** `effort: high` (main-model triage); the trigger-router now routes
  "brain doctor / brain health / is the brain healthy / health-check the brain" →
  `/brain:doctor` (and keeps "lint the brain" → `/brain:lint`).
- `--strict` exits nonzero on any warning/critical (CI); `--json` emits the report.
- Selftest 144 → **156 checks** (doctor ×10, router ×2); both manifests validate
  `--strict`.

## 0.11.0 — 2026-07-18 (Phase 7: product & game pipelines)

Two domain pipelines codified on top of the develop lifecycle — research always
filed, plans always with numbered ACs, approval always gating architecture code.

- **`/brain:game`** (`skills/game/`) — the game pipeline: concept → **GDD** →
  prototype spec → build → **playtest** → **balance**. The GDD captures concept /
  MDA / core loop / progression / art direction; its open questions become the
  prototype spec's acceptance criteria (`/brain:plan`, tiered); each playtest is
  **ingested as a raw source** so observations are searchable; each balance
  decision is a `decisions/` ADR. `effort: high`, main model (design judgment).
- **GDD template** `templates/gdd.md` (schema master + bundle, re-synced) —
  `type: gdd`, MDA framework, core-loop framing, mechanics table, progression &
  economy, win/loss, art direction, scope/platform with engine entity links
  (godot / unity / web). Every brain now carries it (distributed by
  `/brain:init --update`).
- **The product pipeline** (idea → PRD → spec → build → track → wrap) needs no new
  skill — it's the standard lifecycle composed with the `product-management` /
  `product-tracking` capability plugins. Documented alongside the game pipeline in
  the instance manual's new **§10 "Domain pipelines"**.
- **Router** routes "start/design/prototype a game", "GDD", "core loop",
  "playtest", "game balance" → `/brain:game`.
- Selftest 137 → **144 checks** (game skill ×3, GDD template ×1, §10 ×1, router
  ×2, routing map now 13 skills); both manifests validate `--strict`.

## 0.10.0 — 2026-07-18 (Phase 6.5: product-design expertise pack)

The first **domain-expertise pack** — packaged process + searchable knowledge
that runs on top of the brain and files every artifact back. Generalizes the
ui-ux-pro-max pattern into a reusable format.

- **`/brain:product-design`** (`skills/product-design/`) — a five-phase
  industry-standard process (discovery → definition → ideation → design →
  validation), each phase filing to the right `.brain/` folder (research →
  `wiki/research/`, personas/journeys → `wiki/syntheses/`, decisions →
  `decisions/`, anti-patterns → `instincts/pending/`). Hands the visual build to
  `ui-ux-pro-max` (design system) + `frontend-design` (build) with the brain's
  accumulated context injected. `effort: high`, main model (judgment).
- **Pack format** (`SKILL.md` + `data/` + `templates/` + `checklist.md`) — the
  reusable shape for later packs (game design, analytics):
  - `data/`: `methods.md` (JTBD, Crazy 8s, SCAMPER, Double Diamond, dot-voting…),
    `heuristics.md` (Nielsen's 10, with severities), `accessibility.md` (WCAG 2.2
    AA under POUR).
  - `templates/`: `persona`, `journey-map`, `hmw` (problem statement + How-Might-We),
    `usability-test-script`.
  - `checklist.md`: the **validation gate** — when a workstream's project-status
    names `pack: product-design`, `/brain:wrap` runs it and **open P0 findings block
    "done"** (Nielsen catastrophes, Level-A a11y failures on core tasks, structural
    design decisions with no ADR) — exactly like security P0s.
- **Wiring:** new `pack:` field on the project-status template (schema master +
  bundle, re-synced); `/brain:wrap` step 1 runs the active pack's checklist gate;
  the trigger-router routes "design a product / create personas / user journey /
  how-might-we / usability test / accessibility audit" → `/brain:product-design`.
- Selftest 127 → **137 checks** (pack structure ×7, router ×2, routing map now 12
  skills); both manifests validate `--strict`.

## 0.9.0 — 2026-07-18 (Phase 6: bundled-plugin manifest)

Capability plugins do the craft; the brain records the knowledge. `/brain:init`
now offers a curated set, and every plugin's output has a named home in `.brain/`.

- **Recommended-plugins manifest** (`skills/init/recommended-plugins.json`): the
  authoritative set of nine capability plugins — `github`, `frontend-design`,
  `superpowers`, `security-guidance`, `product-tracking-skills`,
  `code-modernization`, `productivity`, `product-management`, and
  `ui-ux-pro-max` — each with its category, what it auto-fires on, a
  brain-integration note, and the exact `.brain/` folder(s) its decisions,
  findings, and artifacts get **filed back into**.
- **`scripts/plugins.js`** renders the offer deterministically (`--verbose` adds
  the integration notes, `--json` dumps the manifest for the future
  `/brain:doctor`) — the same script-does-the-mechanics / skill-does-the-judgment
  split as `lint.js`.
- **`/brain:init` step 6** now offers the set: it lists them, recommends only the
  ones relevant to the project, and installs **model-driven** via `/plugin` after
  confirming the current command with the curator (marketplace names evolve) —
  never silently. Skipped on `--update`.
- **Instance manual §9 "Capability plugins (the craft layer)"** (schema master +
  bundle, re-synced) states the contract — *plugins do the craft; the brain
  records the knowledge* — with the per-plugin filing map and the precedence
  chain (deterministic trigger > domain pack > domain skill > craft plugin >
  general model).
- Selftest 120 → **127 checks** (manifest shape ×4, `plugins.js` ×2, §9 ×1);
  both manifests validate `--strict`.

## 0.8.0 — 2026-07-17 (Phase 5.5: model routing & parallel fan-out)

The right model does each kind of work by default, and routine work can fan out
to Sonnet subagents in parallel.

- **Routing frontmatter across all 11 skills** (`model`/`effort` are honored
  skill fields): judgment & synthesis (`plan`, `review`, `wrap`, `query`,
  `lint`, `compress`) run at `effort: high` on the session's main model — never
  downgraded; routine execution (`ingest`, `research`, `build`) pins
  `model: sonnet` · `effort: medium`; `init` sonnet/low; `terse` haiku/low.
  Hook #7 already enforces the same policy on subagent dispatches.
- **Two Sonnet fan-out subagents** (`agents/`): `brain-researcher` (read-only —
  one focused research slice → cited findings; spawn several in parallel) and
  `brain-librarian` (batch ingest — the 8-step compile in an isolated window,
  respecting raw-sources immutability + append-only log). Each pins
  `model: sonnet`, so hook #7 passes them through while still logging the
  dispatch to `sessions/agents.md`.
- **Fan-out patterns documented** in the skills + READMEs: research fan-out (N
  researchers → main-model synthesis), batch ingest (one librarian per source),
  build+review pair (Sonnet implementer vs main-model auditor), competing
  hypotheses. Spawn concurrently in one message; only summaries return.
- Routing table in `skills/README.md`; agents in `README.md`.
- Selftest 115 → **120 checks** (routing ×2, agents ×3); validates `--strict`.

## 0.7.0 — 2026-07-17 (Phase 5: memory & context engineering)

The three memory tiers (wiki · decisions/memory · instincts) become
self-feeding, semantic search is bundled but opt-in, and every injection now
leaves a receipt.

- **Instinct auto-detection** (`instinct-track.js`, PostToolUse): the Gap-#9
  loop mechanized — tallies edits per file across **distinct sessions** in
  `sessions/edit-counts.json`; at 3+ (`MONKEY_BRAIN_INSTINCT_THRESHOLD`) it
  emits a **once-per-file advisory** to file a rule in `instincts/pending/`
  (never a block; bookkeeping files exempt). Scripts notice; the model writes
  the rule.
- **Auto-distillation** (`wrap.js` Stop + `brain-status.js`): after a session
  whose last logged step was `build|review`, the wrap hook blocks **once** if
  no ADR was filed to `decisions/` near that entry — prompting the model to
  distill the "why". `brain-status` gains a **"Decisions (the why)"** section
  so recent ADRs are injected every session; `/brain:wrap`'s definition-of-done
  now includes distilling decisions.
- **Semantic search — opt-in qmd** (`qmd-mcp.js` + `.mcp.json`): a
  `brain-search` MCP wrapper, dormant by default (schema §8: qmd is deferred
  until the wiki outgrows the index ~100 sources). Hands off to real
  `qmd mcp` only when a brain is present **+ opted in** (empty `.qmd` marker or
  `MONKEY_BRAIN_QMD=1`) **+ qmd on PATH**; otherwise a stdlib no-op MCP server
  (valid protocol, zero tools) so no session shows a failed server. `wrap.js`
  SessionEnd runs a detached `qmd update` re-index when opted in;
  `brain-status` surfaces the enabled state or nudges to enable near the
  ceiling. Instance CLAUDE.md §8 documents the steps.
- **Compaction survival** (`snapshot.js`): PreCompact snapshots now also carry
  **active specs and projects** (tier/phase/approval) — the in-flight work most
  costly to lose, not just the next steps.
- **Budget-receipt groundwork** (`brain-status.js`): each injection's size
  (tokens, budget, sections kept/dropped) is appended to
  `sessions/injection-stats.json` (rolling last 20) for the future
  `/brain:doctor` — zero added tokens.
- Selftest 95 → **115 checks** (instinct-track ×7, decisions ×4, qmd-mcp ×5,
  snapshot ×2, receipts ×3); plugin validates `--strict`.

## 0.6.0 — 2026-07-17 (Phase 3 complete: develop lifecycle + token discipline)

- **Develop-lifecycle skills** (the v2 schema's verbs):
  - **`/brain:research`** — wiki-first, then codebase, then web; every finding
    cited; filed to `wiki/research/` with a Recommendation; hands off to plan.
  - **`/brain:plan`** — `specs/<feature>.md` with numbered ACs, test plan, and
    tier + rationale; **approval stays curator-owned** (`plan_approved: true`
    only after explicit approval in conversation — never self-set); creates the
    `projects/` workstream page.
  - **`/brain:build`** — red→green→refactor against the ACs in slices; treats
    the TDD gate as the reminder it is; progress ticked in the spec; ADRs
    distilled to `decisions/`; log + commit per milestone.
  - **`/brain:review`** — AC-by-AC verification with evidence (runs the suite
    itself), severity-ordered code review, findings **filed back**: review
    synthesis page, `decisions/` ADRs, 3+-repeat corrections drafted to
    `instincts/pending/` (the Gap-#9 feedback loop starts working); closes the
    spec honestly (`status`/`phase`/`audit_score`).
- **Token-discipline skills** (Caveman-inspired):
  - **`/brain:terse`** — session output-compression mode with the compression
    guard (code, commands, paths, errors, ACs never compressed); `off` to end.
  - **`/brain:compress`** — permanent instruction-file compression (CLAUDE.md,
    memory, rules; never wiki knowledge pages) with before→after byte/token
    receipts and a no-loss verification step.
- **trigger-router** learns the new phrases: "research X", "write/draft a
  spec", "implement the spec", "review the changes", "be terse" (works
  brainless), "compress CLAUDE.md".
- Selftest 88 → **95 checks**.

## 0.5.0 — 2026-07-17 (Phase 4: schema v2 + tier gates)

- **Schema v2 template** (master `schema/brain-template/`, bundle re-synced):
  new record layers `specs/`, `projects/`, `sessions/`, `decisions/`,
  `instincts/{pending,active}/`, `wiki/research/`; new templates `spec`
  (numbered ACs, `tier`, `plan_approved`, `tdd`), `decision` (ADR),
  `project-status`, `instinct`, `research`; log prefixes extended with
  `session | research | plan | build | review`; instance CLAUDE.md rewritten
  at `engine_version: 2.0` (records table, develop lifecycle, tier table).
  Engine master `schema/CLAUDE.md` bumped to v2.0 with the same conventions —
  section numbers kept stable (hooks/skills cite them).
- **Migration:** `new-brain.js --update` and `bootstrap/new-brain.ps1 -Update`
  now ensure every template directory exists and add missing structural files
  (`.gitkeep`, `Clippings/.gitignore`) — seed wiki pages are never added to an
  existing brain, knowledge is never touched.
- **TDD gate** (guards rule 5, schema §4.4): while an active
  feature/architecture-tier spec exists (without `tdd: false`), creating a NEW
  project code file with no test companion is blocked — looks for same-dir
  `<name>.test/.spec`, a sibling `__tests__/`, and root-level
  `test|tests|spec|specs` dirs. Quick tier stays advisory-only. Test-file
  detection strengthened for both gates (`foo.spec.ts`, `test_foo.py`,
  `test.js` now recognized).
- **brain-status:** new "Active projects" section (tier · phase per
  workstream, read from `projects/`).
- Selftest 79 → **88 checks** (TDD gate ×6, projects section, v2 scaffold,
  v1→v2 migration ×2).

## 0.4.0 — 2026-07-17 (Phase 3 core skills + Phase 2 hook set complete)

**Skills — the SDLC verbs land** (`/brain:*`, all auto-activating):

- **`/brain:init`** — self-contained scaffold: bundled `brain-template/` +
  `scripts/new-brain.js` (Node port of `bootstrap/new-brain.ps1`; create /
  `--update` / `--force` / `--sync-template`), because marketplace installs
  ship only `plugin/`. Wires the root `@.brain/CLAUDE.md` import, honors and
  clears `.no-brain`. `schema/brain-template/` remains the canonical master —
  selftest fails when the bundle drifts.
- **`/brain:ingest`** — the 8-step compile checklist (canonicalize → summary →
  5–10+ cross-links → index → log → commit), batch/Clippings modes, gate-aware.
- **`/brain:query`** — index-first retrieval with citations; novel answers
  filed back to `syntheses/` (plain lookups stay lightweight).
- **`/brain:lint`** — `scripts/lint.js` mechanical scan injected via `` !`…` ``
  preprocessing (broken links, orphans, frontmatter gaps, index drift,
  Clippings backlog, strays; `--strict` for CI), then the model's reasoning
  pass (contradictions, staleness, gaps).
- **`/brain:wrap`** — definition-of-done: verify honestly, sync log + index +
  resume narrative, commit with vault conventions.

**Hooks — Phase 2 set complete (8/8):**

- **#2 `trigger-router.js`** (UserPromptSubmit): deterministic natural-phrase
  routing to the skills ("ingest this", "wrap up", "lint the brain", "what
  does the brain know", "set up a brain"). Never blocks; suggests
  `/brain:init` when a brain-needing phrase fires in a brainless project.
- **#5 `snapshot.js`** (PreCompact): deterministic working-state snapshot
  (resume next steps + task-log tail, wiki log heads, backlog) to
  `.brain/sessions/` before compaction.
- **#6 `wrap.js`** (Stop + SessionEnd): once-per-session stop gate when wiki
  pages changed after the last `log.md` entry; SessionEnd self-heals
  `index.md` `source_count`/`page_count`/`updated` from the filesystem.
- **#7 `agent-track.js`** (PreToolUse Agent|Task): every dispatch logged to
  `.brain/sessions/agents.md`; heavy dispatches without an explicit model
  blocked once per session with the routing table (haiku triage · sonnet
  routine · main-model judgment).
- **#1 `brain-status.js`** grew the no-brain fallback: one-line `/brain:init`
  offer on startup in brainless projects; `.no-brain` marker silences forever.

Selftest grows 36 → **79 checks** (router, wrap, snapshot, agent-track,
lint scan, init scaffold, template-sync guard, no-brain offer).

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
