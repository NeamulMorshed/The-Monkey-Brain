---
title: "Spec — Motion & video skill packs"
type: spec
status: active
tier: feature
phase: review
plan_approved: false
tdd: true
scope: [plugin/skills/init/recommended-skills.json, plugin/skills/init/scripts/skills.js, plugin/skills/init/SKILL.md, plugin/hooks/scripts/trigger-router.js, plugin/hooks/scripts/brain-status.js, plugin/skills/review/SKILL.md, plugin/skills/plan/SKILL.md, schema/brain-template/**, plugin/skills/init/brain-template/**, plugin/hooks/scripts/selftest.js, plugin/README.md, plugin/skills/README.md, README.md, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**]
created: 2026-11-09
updated: 2026-11-09
related: ["[[motion-and-video-skills]]", "[[trigger-router]]", "[[develop-lifecycle-stages]]", "[[session-injection]]"]
---

# Motion & video skill packs — spec

## Problem
The curator wants three external skill sets — a GSAP/Framer scroll-animation skill, Remotion's video
skills and Emil Kowalski's design-engineering skills — usable in any brain project, **working under the
brain's rules** rather than beside them. Installed raw, they'd load 32 skill descriptions every turn,
route themselves ahead of the brain's lifecycle, open with scripted greetings that break terse mode,
and leave their audits, reviews and library choices unrecorded ([[motion-and-video-skills]]).

## Goals / Non-goals
- Goal: `/brain:init` offers three **packs** (web-motion, video, mobile-motion) per project, installed only on the curator's yes.
- Goal: once installed, the router points motion/video prompts at the pack — below the brain's own workflows.
- Goal: every pack output has a brain home (research, spec, review, ADR, pending instinct) and motion specs have a test plan that fits motion.
- Non-goal: vendoring the skills' files into the plugin (upstream stays the source; Remotion's licence forbids it anyway).
- Non-goal: a `/brain:video` pipeline — a follow-up spec once the video pack is in real use.
- Non-goal: installing anything, or running `npx`, without an explicit yes; licence advice beyond Remotion's note.

## Acceptance criteria

**Manifest and offer**
- **AC-1** ✅ (selftest AC-1 x6: 3 packs, fields, licence_note, 13 Remotion skills) — `plugin/skills/init/recommended-skills.json` (schema_version, updated, contract) lists three packs. Each pack has `id`, `title`, `when` (the work it serves), `source` (repo URL + licence), `skills` (names), `install_hint` (instructions-only command), `context_cost` (approx. tokens of descriptions per turn) and `filing` (where each kind of output goes). `video` carries a `licence_note` on Remotion's company licence.
- **AC-2** ✅ (selftest AC-2 x9 + skills.test.js: table, --verbose, --json, installed/partial, ~/.claude, fail-open) — `plugin/skills/init/scripts/skills.js` renders the offer: a table by default, `--verbose` adds filing lines, `--json` prints the manifest. With `--project <root>` it marks each pack installed / partial / not installed, from `<root>/.claude/skills/<name>/SKILL.md` and `~/.claude/skills/<name>/SKILL.md`. A missing or malformed manifest or skills dir fails open (no crash).
- **AC-3** ✅ (selftest AC-3 x2) — A skill installed in either skills dir that no pack lists shows under "detected, no filing rules yet", like `mcp-servers.js` does for servers.
- **AC-4** ✅ (selftest AC-4 x4: init step 6c after MCP offer, yes-only, new-brain.js untouched) — `/brain:init` SKILL.md offers the packs after the MCP offer: shows `skills.js --project`, the context cost and Remotion's licence note, and runs a pack's `install_hint` **only after the curator says yes to that pack**; it never installs by default. Scaffolding (`new-brain.js`) is unchanged.

**Routing**
- **AC-5** ✅ (selftest AC-5 x13: router matrix, installed vs not) — The router adds one craft line when a motion/video prompt matches: scroll / parallax / "animate on scroll" / entrance / transition / easing / "make it feel smooth" → web-motion; "react native|expo" + animation/gesture → mobile-motion; make/create/render + video, or "remotion" → video. Installed pack → the line names its skills; not installed → it offers the pack via `/brain:init`.
- **AC-6** ✅ (selftest AC-6 x4) — The craft line ranks below the brain's workflows: a prompt that also matches a brain rule (e.g. the dev catch-all → research) keeps that rule's line first and adds the craft line after it. Questions stay silent, as today. At most one craft line per prompt.

**Filing and review**
- **AC-7** ✅ (selftest AC-7 x2: schema + bundled reference.md) — `reference.md` §9 (schema template, synced to the bundled copy) adds the packs' filing rules: `improve-animations` audit → `wiki/research/`, each plan → a spec with ACs; `review-animations` / `break-ui` / `animation-performance` findings → the spec's `wiki/syntheses/<x>-review` with P0–P2 (an open P0 gates `/brain:wrap`); library / easing choices and `pick-ui-library` → `decisions/` ADRs; `prototype` variants → a labelled spike, the chosen one → a spec; Remotion renders → `projects/` status, video style choices → ADRs.
- **AC-8** ✅ (selftest AC-8) — `/brain:review` SKILL.md: when the spec's scope touches motion code and web-motion is installed, run `review-animations` as an extra reviewer and file its findings in the same review page.
- **AC-9** ✅ (selftest AC-9) — `/brain:plan` SKILL.md and the spec template: a motion spec's test plan names a visual check (recording or screenshots per state), a performance check (compositor-only properties, no dropped frames in a trace) and `prefers-reduced-motion`; motion-only source may use `tdd: false` when the review AC requires a `review-animations` pass.

**Taste rules and terse mode**
- **AC-10** ✅ (selftest AC-10 x6) — `skills.js --seed-instincts <pack> --brain <path>` writes the pack's curated rules (web-motion: ≤ 6, e.g. ease-out on enter, never animate keyboard-initiated actions) to `instincts/pending/` in the instinct template format, citing the source; it skips existing files and never writes `instincts/active/`.
- **AC-11** ✅ (selftest AC-11 x2, within 3000 tokens) — The session-start terse rules gain one line: a skill that opens with a scripted greeting or "Initial Response" is followed for its substance, not its greeting. The injection stays within budget (doctor #9).

**Release**
- **AC-12** ✅ (selftest ALL GREEN 664, validate --strict x2, lint --strict clean, 0.35.0 everywhere; pushed-CI part open (not pushed)) — selftest ALL GREEN; both manifests `--strict`; 0.35.0 in both manifests, the CHANGELOG and the README badge; README, plugin README and skills README mention the packs; pushed CI green.

## Test plan
- AC-1: selftest loads the manifest — three packs, every required field, `licence_note` on video, URLs and skill names non-empty.
- AC-2–3: selftest runs `skills.js` against fixtures — empty project (all "not installed"), one pack fully and one partly installed under a temp `.claude/skills/`, an uncurated skill (detected fallback), a malformed manifest via env override (fails open), `--json` parses.
- AC-4, AC-7–9: selftest greps the SKILL.md / reference.md / template text for the offer step, the yes-only install rule, each filing rule, the review step and the motion test-plan terms; template sync check stays green.
- AC-5–6: selftest router matrix — ≥ 3 positives per pack, ordering when a brain rule also matches, question → silent, installed vs not-installed wording, an unrelated prompt → no craft line.
- AC-10: selftest seeds into a temp brain — files in `pending/` only, re-run adds nothing, active/ untouched.
- AC-11: selftest asserts the line in the startup injection and the budget check.
- AC-12: CI `run:` steps locally, validate `--strict` ×2, `gh run list` after push.
- Manual, once: install the web-motion pack in a scratch project with the real `install_hint` and confirm `skills.js --project` reports it installed (records the exact `npx skills` syntax that works).

## Build notes (2026-11-09)
- Verified CLI: `npx skills add <repo> --skill <names> -a claude-code -y` copies into `./.claude/skills/<name>` (tested in a temp dir with emilkowalski/skills).
- Deviation: video source is the official `remotion-dev/skills` mirror (same 13 skills) rather than the monorepo path.
- Deviation: `skills.test.js` smoke test added beside skills.js because the TDD gate wants a companion; full matrix is in selftest.
- AC-12 "pushed CI green" stays open: not pushed per instruction.

## Notes & links
- Research: [[motion-and-video-skills]]. Pattern copied from `recommended-mcp-servers.json` + `mcp-servers.js`.
- Sizing: `graph.js radius` → "touches 4 file(s) across 2 module(s) · 1 file type(s) · score 8 · dependents: none · suggested tier: feature · model: sonnet to build, opus or fable to review".
- Tier `feature`: additive, no dependents; TDD gate on; `plan_approved` stays false (feature tier needs verbal agreement only).
