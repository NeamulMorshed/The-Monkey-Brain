---
title: "Spec — Brain correctness: resume, gates, health signal, Stop nudges"
type: spec
status: done
tier: architecture
phase: done
audit_score: "done — 0 open findings (0 P0, 2 P1, 4 P2 found in review; 5 fixed + pinned, 1 declined with reason; selftest 463 green)"
plan_approved: true
tdd: true
scope: [plugin/hooks/scripts/lib.js, plugin/hooks/scripts/resume.js, plugin/hooks/scripts/resume-log.js, plugin/hooks/scripts/snapshot.js, plugin/hooks/scripts/guards.js, plugin/hooks/scripts/agent-track.js, plugin/hooks/scripts/wrap.js, plugin/hooks/scripts/wiki-check.js, plugin/hooks/scripts/loop.js, plugin/hooks/scripts/digest.js, plugin/hooks/scripts/selftest.js, plugin/skills/doctor/**, plugin/skills/lint/**, plugin/skills/wrap/**, plugin/agents/**, plugin/skills/init/brain-template/templates/**, schema/brain-template/templates/**, plugin/README.md, README.md, plugin/CHANGELOG.md, plugin/.claude-plugin/**, .claude-plugin/**]
created: 2026-09-15
updated: 2026-09-15
related: ["[[brain-health-audit]]", "[[token-diet]]", "[[engine-knowledge]]"]
---

# Brain correctness — spec

## Problem
The brain gives itself wrong signals and has two real holes ([[brain-health-audit]]): every session is handed an empty resume template and asked "continue or start fresh?" while the real notes sit unread; the plan and TDD gates switch off for any project stored under a `test`/`tests`/`spec(s)` folder; doctor raises a false critical for fixed P0s and cannot see failed dispatches behind phantom lines; the Stop hook blocks on files the hooks themselves wrote; the model-routing block stops only one dispatch per session.

## Goals / Non-goals
- Goal: one resume file per project, read and written by the same rule, silent when there is nothing to resume.
- Goal: gates judge a path by where it sits inside the project, never by folders above it.
- Goal: doctor's criticals and dispatch outcomes are trustworthy.
- Goal: the Stop nudges fire only for work the model or curator did.
- Non-goal: model-routing policy, token diet, skill descriptions ([[token-diet]]).
- Non-goal: link resolution across `specs/`/`decisions/`, router fixes, engine knowledge ([[engine-knowledge]]).

## Acceptance criteria

**Resume (P0 #1)**
- **AC-1** ✅ `lib.resumePath: a real root narrative beats a seeded brain copy` · `resume.js injects the real root narrative…` · `resume-log.js appends to the same file resume.js read` · `snapshot.js copies next steps from the same file` · `both narratives real → the brain copy wins` — `lib.resumePath(cwd, { create })` is the single resolver used by `resume.js`, `resume-log.js` and `snapshot.js`. Candidates `<brain>/resume.md` then `<project>/resume.md`: it returns the first existing file whose narrative is not the seed, else the first existing file, else (only with `create`) the brain path. Both present with a seed brain copy and a real root copy → all three hooks use the root copy; both real → the brain copy.
- **AC-2** ✅ `lib.isSeedResume: the template seed … is a seed` · `a seed-only resume (even with task-log lines) injects nothing` — `lib.isSeedResume(text)` is true when "Where we left off" is empty or only a seed placeholder line (`_Nothing yet…` / `_Auto-created…`) and "Next steps" has no item besides `- [ ] …`. `resume.js` injects nothing when the resolved file is a seed, even if its task log has lines.
- **AC-3** ✅ `/brain:wrap updates the resume file the hook reported, 2–4 lines, history to the log` — `/brain:wrap` step 3 names "the resume file the session-start hook reported" (no engine-repo special case), keeps the narrative to 2–4 lines, and sends history to `wiki/log.md`.

**Gates (P0 #2, P2 #15-16)**
- **AC-4** ✅ `a project under a parent folder named specs is still plan-gated` · `a test file inside that project still passes the gates` — The plan and TDD gates call `isTestPath` on the project-relative path. A project under a parent folder named `specs` with an unapproved architecture spec: `src/core.js` is blocked (exit 2); `tests/x.test.js` inside the project still passes.
- **AC-5** ✅ `lib.inProject: inside, "..odd", "..", "../x", absolute and drive-letter paths` · `guards: the tier gates and the learned-bans guard share lib.inProject` — `lib.inProject(rel)` is the one containment test (`..`, `../…`, absolute, or a drive-letter path → outside); the plan/TDD gates and the learned-bans guard both use it, so a cross-drive path never triggers a ban.
- **AC-6** ✅ `the log updated: exemption needs an updated: date on both sides` — The log's `updated:` exemption requires the new text to be an `updated: <date>` line too; editing it to anything else is blocked.

**Health signal (P1 #3)**
- **AC-7** ✅ four `openP0Lines:` checks · `doctor 14 ignores fixed P0s and still flags open ones` · `doctor, loop and digest share lib.openP0Lines` — `lib.openP0Lines(text)` is section-aware: a heading whose text contains fixed / resolved / closed / accepted / done closes P0 mentions beneath it until the next heading of the same or higher level; `0 P0` / `no P0` never count; the inline exclusions stay. Doctor #14, `loop.js` and `digest.js` use it. "## Findings (all fixed)" + "**P0 — x** Fix: y" → ok; "## Findings" + "**P0 — x**" → critical.
- **AC-8** ✅ `a typeless SubagentStop with no transcript records leaves no ledger line` · `doctor 18 ignores legacy phantom lines, so real empties still warn` — `agent-track` writes no outcome line for a SubagentStop with an empty `agent_type` whose transcript yields no records. Doctor #18 ignores legacy lines of the form `· agent · on unknown · 0 tokens · 0 turn(s)`; 4 real outcomes (2 empty) among 16 legacy phantoms → warn.
- **AC-9** ✅ `doctor 19: no detected stack but a workflow present → ok, naming it` — Doctor #19: no stack detected but `.github/workflows/*.y(a)ml` present → `ok`, naming the workflow files.

**Model block (P1 #10)**
- **AC-10** ✅ `heavy dispatch without model blocks, naming the routing policy (not a once-per-session rule)` · `every model-less heavy dispatch is blocked, not only the first` · `forks pass` — Every model-less dispatch of a heavy type is blocked (no once-per-session marker); `fork` is not a heavy type (Claude Code ignores a model override on forks). Two consecutive model-less `general-purpose` dispatches both exit 2; the message no longer says "once per session".

**Stop nudges (P1 #5)**
- **AC-11** ✅ `hook-owned changes (sessions/, resume.md) and an index-only refresh never nudge` · `a real wiki page newer than the log still nudges wrap[log] and wrap[git]` — `wrap[git]` ignores hook-owned paths (`sessions/**`, `resume.md`); `wrap[log]` ignores `index.md` (SessionEnd rewrites it). Only `sessions/agents.md` + `resume.md` dirty → no git nudge; `index.md` newer than the log → no log nudge; a real wiki page newer → the log nudge still fires.

**Links, agent, docs (P2 #17, P1 #9, P2 #19-20)**
- **AC-12** ✅ `a table-escaped [[slug\|Alias]] link counts as inbound` — `wiki-check`'s orphan scan accepts a table-escaped link `[[slug\|Alias]]` as inbound.
- **AC-13** ✅ `brain-librarian: no Skill call it cannot make, WebFetch for URLs, all 8 ingest steps inline` — `brain-librarian` no longer tells itself to invoke a Skill it cannot call: it lists `/brain:ingest`'s 8 steps inline (discuss skipped in batch, commit left to the lead) and has `WebFetch` for URL sources.
- **AC-14** ✅ `spec template cites manual §5 for tiers` · `wiki-check and lint cite §6…` · `READMEs say 10 hook events and hard-code no selftest count` — Section references match the manual: the spec template says tiers are "manual §5" (both template masters and this brain's `templates/spec.md`); `wiki-check.js` and `lint.js` cite §6 for TODO markers and orphans. The READMEs' hook-event count equals the number of events in `hooks.json` and no README hard-codes a selftest count.
- **AC-15** ✅ reviewer re-ran: selftest 463 ALL GREEN · `claude plugin validate --strict` ×2 · CHANGELOG + manifests 0.30.0 · doctor #14 none — Release: selftest ALL GREEN; both manifests `claude plugin validate --strict`; CHANGELOG `0.30.0`; both manifests `0.30.0`; doctor on this repo's brain reports no open-P0 critical. *(Build evidence: selftest ALL GREEN, 447 checks; both manifests 0.30.0; CHANGELOG 0.30.0; repo doctor on `.brain` → `14. open-p0: none`. Left for the reviewer to re-run, never tick from here.)*

## Test plan
Selftest additions, written red first: AC-1 both-files fixture through all three hooks; AC-2 seed-only and seed+task-log fixtures; AC-3 wrap SKILL text check; AC-4 a second project under `<tmp>/specs/…`; AC-5 `lib.inProject` table incl. `D:/x`; AC-6 two log edits; AC-7 three fixture pages through doctor and `loop.openP0Lines`; AC-8 phantom SubagentStop + mixed ledger through doctor; AC-9 workflow-only project; AC-10 two dispatches + fork; AC-11 git-dirty and mtime fixtures; AC-12 table-link orphan fixture; AC-13 agent-definition check; AC-14 template/README checks; AC-15 the release checklist run by the reviewer.

## Notes & links
- Research: [[brain-health-audit]] (P0 #1-2, P1 #3, #5, #9, #10, P2 #15-17, #19-20).
- Tier: `graph.js radius` → "touches 27 file(s) across 4 module(s) · 1 file type(s) · score 108 · suggested tier: architecture" (the width is `lib.js`, which every hook imports).
- Approval: the curator, after reading the audit that recommended exactly this spec, said "do all of these one by one, on your own" (2026-09-15) and repeated "do one by one, on your own". Recorded as `plan_approved: true` on that word.
- Decision: the resume resolver prefers a real narrative over location, so existing brains with a root `resume.md` and a seeded brain copy recover without a migration.
- **Build (2026-09-15):** 19 checks red first (plus one renamed identifier crash in the new selftest block), then green; selftest 417 → 447 ALL GREEN.
- **Review (2026-09-15):** [[brain-correctness-review]] — 0 P0, 2 P1, 4 P2; five fixed and pinned (selftest 447 → 463), one declined with reason.
- **Build deviations:** (1) doctor #7 got the same hook-owned filter as `wrap[git]`, and a `-- .` pathspec — it counted changes anywhere in the repo while saying "in .brain/". (2) lint and doctor orphan scans got the same `\|` fix as wiki-check, so the three never disagree. (3) `loop.openP0(line)` stays exported for compatibility but delegates to `lib.openP0Lines`. Live on this repo after build: doctor 0 critical (was 1), #18 "10 done" (phantoms gone), #19 "CI present (selftest.yml)", and `resume.js` injects the root narrative instead of the seed.
