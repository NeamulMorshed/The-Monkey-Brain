#!/usr/bin/env node
/**
 * selftest.js — end-to-end tests for the hooks (Phase 2, all 8) and the
 * Phase 3 skill scripts (init scaffold, lint scan, template-sync guard).
 *
 * Builds a throwaway .brain fixture in the OS temp dir, pipes synthetic hook
 * events into each script exactly as Claude Code would (JSON on stdin), and
 * asserts exit codes + output. Run: `node plugin/hooks/scripts/selftest.js`.
 * Exit 0 = all green; non-zero = failures (listed).
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const SKILLS = path.join(HERE, '..', '..', 'skills');
const ROOT = path.join(os.tmpdir(), `mb-selftest-${process.pid}`);
const PROJ = path.join(ROOT, 'project');
const BRAIN = path.join(PROJ, '.brain');

// Isolate every child process from the real ~/.claude for the whole run — new-brain.js
// and brain-status.js write to the cross-project registry (registry.js), and dozens of
// selftest calls scaffold scratch brains; without this they'd pollute the real user's
// ~/.claude/monkey-brain/projects.json. Individual tests may still override CLAUDE_CONFIG_DIR
// per-call (e.g. the usage.js tests) — an explicit env always wins over this default.
const GLOBAL_CFG = path.join(os.tmpdir(), `mb-selftest-cfg-${process.pid}`);
process.env.CLAUDE_CONFIG_DIR = GLOBAL_CFG;

function write(rel, content) {
  const p = path.join(PROJ, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function run(script, evt, env) {
  return spawnSync(process.execPath, [path.join(HERE, script)], {
    input: JSON.stringify(evt),
    encoding: 'utf8',
    timeout: 20000,
    env: env ? { ...process.env, ...env } : undefined,
  });
}

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ---------- fixture ----------
write('.brain/CLAUDE.md', '# Test brain manual\n');
write('.brain/Clippings/one.md', '# clipped\n');
write('.brain/raw-sources/existing.md', 'immutable source\n');
write(
  '.brain/wiki/index.md',
  '---\ntitle: "Index"\ntype: index\nstatus: active\nsource_count: 1\npage_count: 5\nupdated: 2026-07-17\n---\n\nSee [[log]], [[a-page]], [[todo-page]].\n'
);
write(
  '.brain/wiki/log.md',
  '---\ntitle: "Log"\ntype: log\nupdated: 2026-07-17\n---\n\n## [2026-07-17] feat | scaffold\nBuilt [[a-page]] and [[todo-page]].\n\n## [2026-07-17] ingest | one\nSecond entry.\n'
);
write(
  '.brain/wiki/concepts/a-page.md',
  '---\ntitle: "A Page"\ntype: concept\nupdated: 2026-07-17\naliases: ["the a page"]\n---\n\nLinks back to [[index]].\n'
);
write(
  '.brain/wiki/concepts/orphan-page.md',
  '---\ntitle: "Orphan"\ntype: concept\nupdated: 2026-07-17\n---\n\nNobody links me. See [[index]].\n'
);
write(
  '.brain/wiki/concepts/todo-page.md',
  '---\ntitle: "Todo Page"\ntype: concept\nupdated: 2026-07-17\n---\n\nLinks [[index]] and a TODO marker: [[missing-target]]. Code is ignored: `[[not-a-link]]`. In a table cell the pipe is escaped: [[a-page\\|the A page]].\n'
);
write('project-notes.md', '# notes outside the brain\n');
write(
  '.brain/projects/site.md',
  '---\ntitle: "Site"\ntype: project\nstatus: active\ntier: feature\nphase: build\n---\n\nWorkstream.\n'
);

const evt = (extra) => ({ cwd: PROJ, session_id: 'selftest', ...extra });

try {
  // ---------- hook #1: brain-status ----------
  console.log('brain-status.js (#1 SessionStart)');
  let r = run('brain-status.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }));
  let out = {};
  try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const ctx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('exit 0 with a brain', r.status === 0, `status=${r.status}`);
  check('injects identity + manual', ctx.includes('Monkey Brain') && ctx.includes('CLAUDE.md'));
  check('injects index stats', ctx.includes('1 sources') && ctx.includes('5 wiki pages'));
  check('flags unprocessed Clippings', ctx.includes('📎') && ctx.includes('1 unprocessed'));
  check('includes recent log heads', ctx.includes('ingest | one'));
  check('lists active projects with tier/phase', ctx.includes('Active projects') && ctx.includes('site') && ctx.includes('feature'), ctx.slice(0, 400));
  check('within budget', (ctx.length / 4) <= 3000, `${Math.ceil(ctx.length / 4)} tokens`);
  check('injects terse-mode rules by default (from the terse skill)', ctx.includes('Terse mode — on by default') && ctx.includes('The compression guard'), ctx.slice(0, 300));

  fs.writeFileSync(path.join(PROJ, '.no-terse'), '');
  r = run('brain-status.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }));
  check('.no-terse at the project root turns terse off', r.status === 0 && r.stdout.includes('brain status') && !r.stdout.includes('Terse mode'), (r.stdout || '').slice(0, 200));
  fs.rmSync(path.join(PROJ, '.no-terse'), { force: true });

  r = run('brain-status.js', evt({ cwd: os.tmpdir(), hook_event_name: 'SessionStart' }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const nctx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('no brain, non-startup: terse rules only (no status, no offer)', r.status === 0 && nctx.includes('Terse mode') && !nctx.includes('brain status') && !nctx.includes('/brain:init'), `status=${r.status} ${nctx.slice(0, 150)}`);
  r = run('brain-status.js', evt({ cwd: os.tmpdir(), hook_event_name: 'SessionStart' }), { MONKEY_BRAIN_TERSE: '0' });
  check('MONKEY_BRAIN_TERSE=0 turns terse off (silent without a brain)', r.status === 0 && r.stdout === '', `status=${r.status} stdout=${JSON.stringify(r.stdout)}`);

  // Budget-receipt groundwork (P5.5): the startup injection above left a receipt.
  const ISTATS = path.join(BRAIN, 'sessions', 'injection-stats.json');
  check('brain-status writes an injection-stats receipt', fs.existsSync(ISTATS), 'no injection-stats.json');
  if (fs.existsSync(ISTATS)) {
    const st = JSON.parse(fs.readFileSync(ISTATS, 'utf8'));
    const last = Array.isArray(st) ? st[st.length - 1] : {};
    check('receipt records numeric tokens/budget + section accounting', typeof last.tokens === 'number' && last.tokens > 0 && typeof last.budget === 'number' && last.sections_kept <= last.sections_total, JSON.stringify(last));
    check('receipt was NOT injected into context (zero added tokens)', !ctx.includes('injection-stats') && !ctx.includes('sections_kept'));
  }

  // ---------- hook #3: guards ----------
  console.log('guards.js (#3 PreToolUse)');
  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'raw-sources', 'existing.md'), old_string: 'immutable', new_string: 'changed' } }));
  check('blocks Edit of existing raw source', r.status === 2 && /immutab/i.test(r.stderr), `status=${r.status}`);

  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(BRAIN, 'raw-sources', 'brand-new.md'), content: 'a new source is the ingest flow' } }));
  check('allows Write of NEW raw source', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(BRAIN, 'wiki', 'log.md'), content: 'rewritten!' } }));
  check('blocks full rewrite of log.md', r.status === 2 && /append-only/.test(r.stderr), `status=${r.status}`);

  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'wiki', 'log.md'), old_string: 'Second entry.', new_string: 'Rewrote history.' } }));
  check('blocks destructive Edit of log.md', r.status === 2 && /append-only/.test(r.stderr), `status=${r.status}`);

  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'wiki', 'log.md'), old_string: 'Second entry.', new_string: 'Second entry.\n\n## [2026-07-17] query | appended\nNew entry.' } }));
  check('allows appending Edit to log.md', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'wiki', 'log.md'), old_string: 'updated: 2026-07-17', new_string: 'updated: 2026-07-18' } }));
  check('allows log frontmatter date bump', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

  const fakeKey = 'sk-' + 'a1B2c3D4e5F6g7H8i9J0'.repeat(2);
  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'app.js'), content: `const k = "${fakeKey}";` } }));
  check('blocks secrets anywhere', r.status === 2 && /secret/i.test(r.stderr), `status=${r.status}`);

  // Plan gate: unapproved architecture spec blocks source writes, not docs.
  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: architecture\nstatus: active\n---\n\n- AC-1 …\n');
  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'src', 'main.js'), content: 'code' } }));
  check('plan gate blocks source write while unapproved', r.status === 2 && /plan/.test(r.stderr), `status=${r.status}`);

  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'notes.md'), content: 'docs are exempt' } }));
  check('plan gate exempts docs', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

  // tdd: false isolates this check to the plan gate (the TDD gate has its own below).
  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: architecture\nstatus: active\nplan_approved: true\ntdd: false\n---\n\n- AC-1 …\n');
  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'src', 'main.js'), content: 'code' } }));
  check('plan gate opens once approved', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

  // TDD gate (feature+ tiers, schema §4.4): new code files need a test companion.
  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: feature\nstatus: active\n---\n\n- AC-1 …\n');
  const tddEvt = (file) => evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, file), content: 'export {}' } });
  r = run('guards.js', tddEvt('src/widget.js'));
  check('TDD gate blocks a new source file without a test', r.status === 2 && /tdd/i.test(r.stderr), `status=${r.status}`);
  write('tests/widget.test.js', 'test("w", () => {});\n');
  r = run('guards.js', tddEvt('src/widget.js'));
  check('a test companion opens the TDD gate', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
  write('src/legacy.js', 'existing file\n');
  r = run('guards.js', tddEvt('src/legacy.js'));
  check('TDD gate skips existing files', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
  r = run('guards.js', tddEvt('tests/more.test.js'));
  check('test files themselves are exempt', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: quick\nstatus: active\n---\n\n- AC-1 …\n');
  r = run('guards.js', tddEvt('src/another.js'));
  check('quick tier has no TDD gate', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: feature\nstatus: active\ntdd: false\n---\n\n- AC-1 …\n');
  r = run('guards.js', tddEvt('src/another.js'));
  check('spec tdd:false opts out of the gate', r.status === 0, `status=${r.status} stderr=${r.stderr}`);
  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: architecture\nstatus: active\nplan_approved: true\n---\n\n- AC-1 …\n');

  // ---------- hook #4: wiki-check ----------
  console.log('wiki-check.js (#4 PostToolUse)');
  r = run('wiki-check.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'wiki', 'concepts', 'a-page.md') } }));
  check('clean linked page is silent', r.status === 0 && r.stdout === '', `status=${r.status} stdout=${r.stdout}`);

  r = run('wiki-check.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: path.join(BRAIN, 'wiki', 'concepts', 'orphan-page.md') } }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  check('orphan page → decision block', out.decision === 'block' && /inbound/.test(out.reason || ''), r.stdout);

  r = run('wiki-check.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: path.join(BRAIN, 'wiki', 'concepts', 'todo-page.md') } }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const adv = (out.hookSpecificOutput || {}).additionalContext || '';
  check('TODO link → advisory, not block', !out.decision && adv.includes('missing-target'), r.stdout);
  check('code spans ignored', !adv.includes('not-a-link'));
  check('escaped-pipe table wikilink resolves (not flagged)', !adv.includes('a-page'), adv);

  r = run('wiki-check.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'project-notes.md') } }));
  check('non-wiki .md is a silent no-op', r.status === 0 && r.stdout === '', `status=${r.status}`);

  r = run('wiki-check.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'wiki', 'index.md') } }));
  check('index is orphan-exempt', r.status === 0 && r.stdout === '', `status=${r.status} stdout=${r.stdout}`);

  // ---------- hook #8: resume system ----------
  console.log('resume.js / resume-log.js (#8 SessionStart + task events)');
  const RESUME = path.join(BRAIN, 'resume.md');

  r = run('resume.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }));
  check('silent when no resume.md exists', r.status === 0 && r.stdout === '', `status=${r.status} stdout=${JSON.stringify(r.stdout)}`);

  r = run('resume-log.js', evt({ hook_event_name: 'TaskCompleted', task: { subject: 'Build Phase 3 skills' } }));
  check('TaskCompleted auto-creates resume.md inside a brain', r.status === 0 && fs.existsSync(RESUME), `status=${r.status}`);
  let resumeText = fs.existsSync(RESUME) ? fs.readFileSync(RESUME, 'utf8') : '';
  check('task line appended under Task log', /## Task log \(auto\)[\s\S]*✔ Build Phase 3 skills/.test(resumeText), resumeText.slice(-200));
  check('frontmatter updated stamp bumped', /updated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(resumeText));

  r = run('resume-log.js', evt({ hook_event_name: 'SessionEnd', reason: 'exit' }));
  resumeText = fs.existsSync(RESUME) ? fs.readFileSync(RESUME, 'utf8') : '';
  check('SessionEnd stamps the log', r.status === 0 && /■ session ended \(exit\)/.test(resumeText), `status=${r.status}`);

  const PLAIN_D = path.join(ROOT, 'plain-d');
  fs.mkdirSync(PLAIN_D, { recursive: true });
  r = run('resume-log.js', { cwd: PLAIN_D, hook_event_name: 'TaskCompleted', task: { subject: 'x' } });
  check('no auto-create outside a brain', r.status === 0 && !fs.existsSync(path.join(PLAIN_D, 'resume.md')), `status=${r.status}`);

  fs.writeFileSync(
    RESUME,
    '---\ntitle: "Resume — project"\ntype: resume\nupdated: 2026-07-17 21:40\n---\n\n## Where we left off\nBuilt hooks 1/3/4.\n\n## Next steps\n- [ ] Phase 3 skills\n\n## Task log (auto)\n- [2026-07-17 20:00] ✔ old entry\n',
    'utf8'
  );
  r = run('resume.js', evt({ hook_event_name: 'SessionStart', source: 'clear' }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const rctx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('injects resume header (📌 + updated stamp)', rctx.includes('📌') && rctx.includes('2026-07-17 21:40'));
  check('injects the ask-the-user directive', /ask the user/.test(rctx) && /continue from these notes/.test(rctx));
  check('injects Next steps content', rctx.includes('Phase 3 skills'));

  r = run('resume.js', evt({ hook_event_name: 'SessionStart', source: 'compact' }));
  check('silent on compact source', r.status === 0 && r.stdout === '', `status=${r.status}`);

  const PLAIN_C = path.join(ROOT, 'plain-c');
  fs.mkdirSync(PLAIN_C, { recursive: true });
  fs.writeFileSync(path.join(PLAIN_C, 'resume.md'), '---\nupdated: 2026-07-17\n---\n\n## Next steps\n- [ ] root fallback works\n', 'utf8');
  r = run('resume.js', { cwd: PLAIN_C, hook_event_name: 'SessionStart', source: 'startup' });
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  check('root resume.md fallback (brainless project)', ((out.hookSpecificOutput || {}).additionalContext || '').includes('root fallback works'), (r.stdout || '').slice(0, 200));

  fs.writeFileSync(
    RESUME,
    '---\nupdated: 2026-07-17 22:00\n---\n\n## Where we left off\n' + 'monkey banana '.repeat(900) + '\n\n## Next steps\n- [ ] tiny\n',
    'utf8'
  );
  r = run('resume.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const bigCtx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('oversized resume stays within budget', bigCtx.length > 0 && Math.ceil(bigCtx.length / 4) <= 1280, `${Math.ceil(bigCtx.length / 4)} tokens`);
  check('truncation points back to the file', bigCtx.includes('truncated'));

  // ---------- hook #2: trigger-router ----------
  console.log('trigger-router.js (#2 UserPromptSubmit)');
  const routed = (prompt, cwd) => {
    const rr = run('trigger-router.js', { cwd: cwd || PROJ, hook_event_name: 'UserPromptSubmit', prompt });
    let o = {}; try { o = JSON.parse(rr.stdout || '{}'); } catch {}
    return { r: rr, ctx: (o.hookSpecificOutput || {}).additionalContext || '' };
  };
  let t = routed('please ingest this article into the brain');
  check('"ingest this" routes to brain:ingest', t.ctx.includes('brain:ingest'), t.ctx);
  t = routed("ok let's wrap it up for today");
  check('"wrap it up" routes to brain:wrap', t.ctx.includes('brain:wrap'), t.ctx);
  t = routed('can you lint the brain');
  check('"lint the brain" routes to brain:lint', t.ctx.includes('brain:lint') && !t.ctx.includes('brain:doctor'), t.ctx);
  t = routed('run the brain doctor');
  check('"brain doctor" routes to brain:doctor', t.ctx.includes('brain:doctor'), t.ctx);
  t = routed('is the brain healthy?');
  check('"is the brain healthy" routes to brain:doctor', t.ctx.includes('brain:doctor'), t.ctx);
  t = routed('what does the brain know about hooks?');
  check('"what does the brain know" routes to brain:query', t.ctx.includes('brain:query'), t.ctx);
  t = routed('thanks, that looks great');
  check('unrelated prompt is silent', t.r.status === 0 && t.r.stdout === '', t.r.stdout);
  t = routed('/brain:lint');
  check('explicit slash command is silent', t.r.status === 0 && t.r.stdout === '');
  const PLAIN_R = path.join(ROOT, 'plain-r');
  fs.mkdirSync(PLAIN_R, { recursive: true });
  t = routed('ingest this doc', PLAIN_R);
  check('brain-needing phrase without a brain suggests init', t.ctx.includes('brain:init'), t.ctx);
  fs.writeFileSync(path.join(PLAIN_R, '.no-brain'), '');
  t = routed('ingest this doc', PLAIN_R);
  check('.no-brain marker silences the suggestion', t.r.status === 0 && t.r.stdout === '');
  t = routed('set up a monkey brain here please', PLAIN_R);
  check('explicit "set up a brain" still routes to init', t.ctx.includes('brain:init'), t.ctx);
  t = routed('research competitor pricing models');
  check('"research X" routes to brain:research', t.ctx.includes('brain:research'), t.ctx);
  t = routed('write a spec for user billing');
  check('"write a spec" routes to brain:plan', t.ctx.includes('brain:plan'), t.ctx);
  t = routed('implement the spec now');
  check('"implement the spec" routes to brain:build', t.ctx.includes('brain:build'), t.ctx);
  t = routed('please review the changes on this branch');
  check('"review the changes" routes to brain:review', t.ctx.includes('brain:review'), t.ctx);
  t = routed('be terse from now on');
  check('"be terse" routes to brain:terse', t.ctx.includes('brain:terse'), t.ctx);
  t = routed('be terse from now on', PLAIN_R);
  check('terse routes even without a brain', t.ctx.includes('brain:terse'), t.ctx);
  t = routed('ok, be more verbose again');
  check('"more verbose" routes to brain:terse (the off switch)', t.ctx.includes('brain:terse'), t.ctx);
  t = routed('brief me on the billing decisions');
  check('"brief me on X" routes to brain:brief', t.ctx.includes('brain:brief'), t.ctx);
  t = routed('show me a token usage report', PLAIN_R);
  check('"token usage report" routes to brain:usage (no brain needed)', t.ctx.includes('brain:usage'), t.ctx);
  t = routed('keep going until the tests pass');
  check('"keep going until…" routes to brain:loop', t.ctx.includes('brain:loop'), t.ctx);
  for (const [phrase, skill, cwd] of [
    ['standup', 'digest'],
    ["let's do the weekly review", 'digest'],
    ['dump — we decided to use Postgres for billing', 'dump'],
    ['show me the dashboard', 'dashboard'],
    ['set up CI for this repo', 'ci', PLAIN_R],
    ['validate this idea: a CLI for invoices', 'research'],
    ['critique https://example.com', 'product-design'],
    ['prep me for the meeting with Acme', 'brief'],
  ]) {
    t = routed(phrase, cwd);
    check(`"${phrase}" routes to brain:${skill}`, t.ctx.includes(`brain:${skill}`), t.ctx);
  }
  t = routed('build an analytics dashboard page for sales');
  check('an app "dashboard" feature does not route to the brain dashboard', !t.ctx.includes('brain:dashboard'), t.ctx);

  // plan-before-build: development intent phrased without "spec" still goes through brain:plan.
  const BIG = path.join(BRAIN, 'specs', 'big-feature.md');
  const bigText = fs.readFileSync(BIG, 'utf8');
  fs.rmSync(BIG);
  for (const phrase of ['add a login feature', 'fix the crash on upload', 'refactor the parser and add tests', 'can you build the settings page?']) {
    t = routed(phrase);
    check(`"${phrase}" routes to brain:plan (plan before build)`, t.ctx.includes('brain:plan') && /plan before build/i.test(t.ctx) && /Open specs: none/.test(t.ctx), t.ctx);
  }
  for (const phrase of ['why does the build fail on upload?', 'how do I add a feature flag here?', 'explain the parser module']) {
    t = routed(phrase);
    check(`question "${phrase}" is silent`, t.r.status === 0 && t.r.stdout === '', t.r.stdout);
  }
  t = routed('add a login feature', PLAIN_R);
  check('development intent without a brain stays silent (.no-brain)', t.r.status === 0 && t.r.stdout === '', t.r.stdout);
  fs.rmSync(path.join(PLAIN_R, '.no-brain'));
  t = routed('add a login feature', PLAIN_R);
  check('development intent without a brain suggests init first', t.ctx.includes('brain:init') && t.ctx.includes('brain:plan'), t.ctx);
  fs.writeFileSync(path.join(PLAIN_R, '.no-brain'), '');
  write('.brain/specs/login-expiry.md', '---\ntitle: "Login expiry"\ntype: spec\nstatus: active\ntier: feature\nphase: build\n---\n\n- AC-1 …\n');
  write('.brain/specs/old-thing.md', '---\ntitle: "Old"\ntype: spec\nstatus: done\ntier: quick\n---\n\n- AC-1 …\n');
  t = routed('add a login feature');
  check('with open specs the hint lists them and offers brain:build', t.ctx.includes('login-expiry') && t.ctx.includes('feature') && t.ctx.includes('brain:build') && t.ctx.includes('brain:plan') && !t.ctx.includes('old-thing'), t.ctx);
  fs.rmSync(path.join(BRAIN, 'specs', 'login-expiry.md'));
  fs.rmSync(path.join(BRAIN, 'specs', 'old-thing.md'));
  fs.writeFileSync(BIG, bigText, 'utf8');
  t = routed('write a spec for user billing');
  check('"write a spec" still wins over the generic dev rule', t.ctx.includes('brain:plan') && !/plan before build/i.test(t.ctx), t.ctx);
  t = routed('implement the spec now');
  check('"implement the spec" still wins over the generic dev rule', t.ctx.includes('brain:build') && !/plan before build/i.test(t.ctx), t.ctx);
  for (const phrase of ['lock the billing spec', 'who has the lock', 'release the lock']) {
    t = routed(phrase);
    check(`"${phrase}" routes to brain:lock`, t.ctx.includes('brain:lock'), t.ctx);
  }
  t = routed('fix the lock screen bug');
  check('app "lock screen" work does not route to the team lock', !t.ctx.includes('brain:lock'), t.ctx);
  for (const [phrase, skill] of [['practice japanese flashcards', 'learn'], ['write a case study about the billing launch', 'career'], ['run a mock interview', 'career']]) {
    t = routed(phrase);
    check(`"${phrase}" routes to brain:${skill}`, t.ctx.includes(`brain:${skill}`), t.ctx);
  }
  t = routed('what is the best practice for caching');
  check('"best practice" does not route to the learn pack', !t.ctx.includes('brain:learn'), t.ctx);
  t = routed('compress the CLAUDE.md file');
  check('"compress CLAUDE.md" routes to brain:compress', t.ctx.includes('brain:compress'), t.ctx);
  t = routed('design a product for our new users');
  check('"design a product" routes to brain:product-design', t.ctx.includes('brain:product-design'), t.ctx);
  t = routed('create personas from our interviews');
  check('"create personas" routes to brain:product-design', t.ctx.includes('brain:product-design'), t.ctx);
  t = routed('start a game concept about space monkeys');
  check('"start a game" routes to brain:game', t.ctx.includes('brain:game'), t.ctx);
  t = routed('write a GDD and design the core loop');
  check('"GDD / core loop" routes to brain:game', t.ctx.includes('brain:game'), t.ctx);

  // ---------- /brain:lint mechanical scan ----------
  console.log('lint.js (skill /brain:lint, mechanical layer)');
  const LINT = path.join(SKILLS, 'lint', 'scripts', 'lint.js');
  let lr = spawnSync(process.execPath, [LINT, '--brain', BRAIN], { encoding: 'utf8', timeout: 20000 });
  check('reports the orphan page', lr.stdout.includes('orphan-page'), lr.stdout.slice(0, 300));
  check('reports the broken TODO link', lr.stdout.includes('missing-target'));
  check('escaped-pipe table wikilink resolves (not broken)', !/a-page\\/.test(lr.stdout), lr.stdout.slice(0, 400));
  check('index in sync initially', lr.stdout.includes('Index stats: in sync'));
  check('default exit 0 despite issues (injection-safe)', lr.status === 0, `status=${lr.status}`);
  lr = spawnSync(process.execPath, [LINT, '--brain', BRAIN, '--strict'], { encoding: 'utf8', timeout: 20000 });
  check('--strict exits 1 on issues', lr.status === 1, `status=${lr.status}`);
  write('.brain/raw-sources/second-source.md', 'another immutable source\n');
  lr = spawnSync(process.execPath, [LINT, '--brain', BRAIN], { encoding: 'utf8', timeout: 20000 });
  check('detects index stat drift', /INDEX drift/.test(lr.stdout) && lr.stdout.includes('actual raw sources: 2'), lr.stdout.slice(-400));

  // ---------- hook #6: wrap ----------
  console.log('wrap.js (#6 Stop + SessionEnd)');
  const LOGP = path.join(BRAIN, 'wiki', 'log.md');
  const past = new Date(Date.now() - 10 * 60 * 1000);
  fs.utimesSync(LOGP, past, past);
  let w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}w1` }));
  out = {}; try { out = JSON.parse(w.stdout || '{}'); } catch {}
  check('unlogged wiki work blocks stop once', out.decision === 'block' && /log\.md/.test(out.reason || ''), (w.stdout || '').slice(0, 200));
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}w1` }));
  check('second stop same session is silent (marker)', w.status === 0 && w.stdout === '');
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}w2`, stop_hook_active: true }));
  check('stop_hook_active is never re-blocked', w.status === 0 && w.stdout === '');
  const nowD = new Date();
  fs.utimesSync(LOGP, nowD, nowD);
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}w3` }));
  check('fresh log ⇒ silent stop', w.status === 0 && w.stdout === '');
  const IDXP = path.join(BRAIN, 'wiki', 'index.md');
  let idxText = fs.readFileSync(IDXP, 'utf8')
    .replace(/^source_count:.*$/m, 'source_count: 99')
    .replace(/^page_count:.*$/m, 'page_count: 99');
  fs.writeFileSync(IDXP, idxText, 'utf8');
  w = run('wrap.js', evt({ hook_event_name: 'SessionEnd' }));
  idxText = fs.readFileSync(IDXP, 'utf8');
  check('SessionEnd self-heals index counts', /source_count: 2/.test(idxText) && /page_count: 5/.test(idxText), idxText.slice(0, 220));
  check('index body preserved on self-heal', idxText.includes('[[a-page]]'));

  // decision distillation nudge + surfacing (P5.2)
  fs.mkdirSync(path.join(BRAIN, 'decisions'), { recursive: true });
  fs.appendFileSync(LOGP, '\n## [2026-07-17] build | widget feature\nImplemented AC-1..3.\n');
  const nowW = new Date();
  fs.utimesSync(LOGP, nowW, nowW);
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}d1` }));
  out = {}; try { out = JSON.parse(w.stdout || '{}'); } catch {}
  check('build/review session without an ADR nudges to distill decisions', out.decision === 'block' && /decisions\//.test(out.reason || '') && /ADR/i.test(out.reason || ''), (w.stdout || '').slice(0, 200));
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}d1` }));
  check('decision nudge fires once per session (marker)', w.status === 0 && w.stdout === '');
  const ADRP = path.join(BRAIN, 'decisions', 'use-widgets.md');
  fs.writeFileSync(ADRP, '---\ntitle: "ADR — use widgets"\ntype: decision\nstatus: accepted\nupdated: 2026-07-17\n---\n\n## Decision\nUse widgets.\n', 'utf8');
  const nowA = new Date();
  fs.utimesSync(ADRP, nowA, nowA);
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}d2` }));
  check('a fresh ADR silences the decision nudge', w.status === 0 && w.stdout === '', (w.stdout || '').slice(0, 200));
  r = run('brain-status.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const dctx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('brain-status surfaces recent decisions/ ADRs', dctx.includes('Decisions (the why)') && dctx.includes('use widgets'), dctx.slice(0, 400));

  // uncommitted-.brain/-changes nudge (wrap.js gitCheck, mirrors doctor.js #7)
  w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}g0` }));
  check('a brain outside any git repo stays silent', w.status === 0 && w.stdout === '', (w.stdout || '').slice(0, 200));
  if (spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0) {
    const GB = path.join(ROOT, 'gitbrain');
    fs.mkdirSync(GB, { recursive: true });
    const gitb = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@x', '-c', 'init.defaultBranch=main', ...a], { cwd: GB, encoding: 'utf8', timeout: 15000 });
    gitb('init', '-q');
    fs.writeFileSync(path.join(GB, 'CLAUDE.md'), '# scratch\n');
    gitb('add', '-A');
    gitb('commit', '-q', '-m', 'init');
    fs.writeFileSync(path.join(GB, 'wiki-note.md'), 'dirty change\n');
    w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}g1` }), { MONKEY_BRAIN_DIR: GB });
    out = {}; try { out = JSON.parse(w.stdout || '{}'); } catch {}
    check('uncommitted .brain/ changes block stop once', out.decision === 'block' && /uncommitted/.test(out.reason || '') && /brain:wrap/.test(out.reason || ''), (w.stdout || '').slice(0, 200));
    w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}g1` }), { MONKEY_BRAIN_DIR: GB });
    check('git nudge fires once per session (marker)', w.status === 0 && w.stdout === '', (w.stdout || '').slice(0, 200));
    gitb('add', '-A');
    gitb('commit', '-q', '-m', 'commit the change');
    w = run('wrap.js', evt({ hook_event_name: 'Stop', session_id: `st${process.pid}g2` }), { MONKEY_BRAIN_DIR: GB });
    check('a clean git tree stays silent', w.status === 0 && w.stdout === '', (w.stdout || '').slice(0, 200));
    fs.rmSync(GB, { recursive: true, force: true });
  } else {
    check('git not installed — git-uncommitted nudge test skipped', true);
  }

  // ---------- hook #5: snapshot ----------
  console.log('snapshot.js (#5 PreCompact)');
  let s = run('snapshot.js', evt({ hook_event_name: 'PreCompact', trigger: 'auto', session_id: 'snap1' }));
  const SESS = path.join(BRAIN, 'sessions');
  const snaps = fs.existsSync(SESS) ? fs.readdirSync(SESS).filter((f) => f.endsWith('-precompact.md')) : [];
  check('writes a snapshot into .brain/sessions/', s.status === 0 && snaps.length === 1, `status=${s.status} snaps=${snaps.length}`);
  const snapText = snaps.length ? fs.readFileSync(path.join(SESS, snaps[0]), 'utf8') : '';
  check('snapshot carries open next steps', snapText.includes('tiny'), snapText.slice(0, 200));
  check('snapshot carries recent wiki log heads', snapText.includes('ingest | one'));
  check('snapshot carries active specs in flight', snapText.includes('Active specs') && snapText.includes('big-feature'), snapText.slice(0, 500));
  check('snapshot carries active projects', snapText.includes('Active projects') && snapText.includes('site'));
  s = run('snapshot.js', { cwd: PLAIN_D, hook_event_name: 'PreCompact', trigger: 'manual' });
  check('no brain ⇒ no snapshot, silent', s.status === 0 && s.stdout === '', `status=${s.status}`);

  // ---------- hook #7: agent-track ----------
  console.log('agent-track.js (#7 PreToolUse Agent)');
  const asess = `st${process.pid}a1`;
  let a = run('agent-track.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Agent', session_id: asess, tool_input: { subagent_type: 'general-purpose', description: 'research fan-out' } }));
  check('heavy dispatch without model blocks once', a.status === 2 && /model/.test(a.stderr), `status=${a.status}`);
  a = run('agent-track.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Agent', session_id: asess, tool_input: { subagent_type: 'general-purpose', model: 'sonnet', description: 'research fan-out' } }));
  check('explicit model passes', a.status === 0, `status=${a.status} stderr=${a.stderr}`);
  a = run('agent-track.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Agent', session_id: asess, tool_input: { subagent_type: 'claude', description: 'still no model' } }));
  check('block fires only once per session', a.status === 0, `status=${a.status}`);
  a = run('agent-track.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Agent', session_id: `st${process.pid}a2`, tool_input: { subagent_type: 'Explore', prompt: 'find the config' } }));
  check('pinned-model agent types pass unblocked', a.status === 0, `status=${a.status} stderr=${a.stderr}`);
  const agentsText = fs.readFileSync(path.join(BRAIN, 'sessions', 'agents.md'), 'utf8');
  check('dispatches logged (incl. blocked)', /⛔ blocked/.test(agentsText) && /model: sonnet/.test(agentsText) && /Explore/.test(agentsText), agentsText.slice(-200));
  a = run('agent-track.js', { cwd: PLAIN_D, hook_event_name: 'PreToolUse', tool_name: 'Agent', session_id: 'ax', tool_input: { subagent_type: 'general-purpose' } });
  check('no brain ⇒ agent tracking silent', a.status === 0 && a.stderr === '', `status=${a.status}`);

  // ---------- instinct-track: repeated-edit → instinct advisory (P5.1) ----------
  console.log('instinct-track.js (PostToolUse — repeated cross-session edits → instinct)');
  write('src/hotspot.js', 'export const v = 1;\n');
  const HOT = path.join(PROJ, 'src', 'hotspot.js');
  const itrack = (sid, file) =>
    run('instinct-track.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Edit', session_id: sid, tool_input: { file_path: file || HOT } }));
  const itCtx = (rr) => { let o = {}; try { o = JSON.parse(rr.stdout || '{}'); } catch {} return (o.hookSpecificOutput || {}).additionalContext || ''; };
  let it = itrack('mb-s1');
  check('1st session edit is silent', it.status === 0 && it.stdout === '', `stdout=${it.stdout}`);
  it = itrack('mb-s1');
  check('same-session re-edit does not advance the count', it.status === 0 && it.stdout === '');
  it = itrack('mb-s2');
  check('2nd distinct session still silent (below threshold)', it.status === 0 && it.stdout === '');
  it = itrack('mb-s3');
  check('3rd distinct session fires the instinct advisory', /instinct/i.test(itCtx(it)) && itCtx(it).includes('hotspot.js'), (it.stdout || '').slice(0, 200));
  it = itrack('mb-s4');
  check('advisory fires once per file (4th session silent)', it.status === 0 && it.stdout === '');
  const ECJSON = path.join(BRAIN, 'sessions', 'edit-counts.json');
  for (const sid of ['e1', 'e2', 'e3', 'e4']) run('instinct-track.js', evt({ hook_event_name: 'PostToolUse', session_id: sid, tool_input: { file_path: path.join(BRAIN, 'wiki', 'log.md') } }));
  const ecData = JSON.parse(fs.readFileSync(ECJSON, 'utf8'));
  check('exempt bookkeeping files (log.md) are never tracked', !Object.keys(ecData).some((k) => k.endsWith('log.md')), Object.keys(ecData).join(','));
  fs.writeFileSync(path.join(PLAIN_D, 'foo.js'), 'export {}\n', 'utf8');
  it = run('instinct-track.js', { cwd: PLAIN_D, hook_event_name: 'PostToolUse', session_id: 's', tool_input: { file_path: path.join(PLAIN_D, 'foo.js') } });
  check('no brain ⇒ instinct-track silent', it.status === 0 && it.stdout === '', `status=${it.status}`);

  // ---------- search-mcp: the brain-search MCP server (built-in recall; qmd opt-in) ----------
  console.log('search-mcp.js (brain-search MCP — built-in recall, qmd opt-in)');
  const SEARCHMCP = path.join(HERE, 'search-mcp.js');
  const rpcLines =
    [
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {} } }),
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
      JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'brain_search', arguments: { query: 'escaped pipe table' } } }),
      JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'brain_brief', arguments: { topic: 'orphan page' } } }),
      JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'brain_search', arguments: {} } }),
    ].join('\n') + '\n';
  const parseRpc = (stdout) => (stdout || '').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const runMcp = (cwd) => spawnSync(process.execPath, [SEARCHMCP], { input: rpcLines, cwd: cwd || PROJ, encoding: 'utf8', timeout: 15000, env: { ...process.env, MONKEY_BRAIN_QMD: '' } });
  // Reliable shell-free PATH scan (mirrors the wrapper), so the guard below is deterministic.
  const qmdOnPath = () => {
    const win = process.platform === 'win32';
    const names = win ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').map((e) => 'qmd' + e.trim().toLowerCase()) : ['qmd'];
    return (process.env.PATH || '').split(path.delimiter).filter(Boolean).some((d) => names.some((n) => { try { return fs.statSync(path.join(d, n)).isFile(); } catch { return false; } }));
  };
  let q = runMcp();
  let qm = parseRpc(q.stdout);
  const byId = (id) => qm.find((m) => m.id === id) || {};
  const toolText = (m) => ((((m.result || {}).content || [])[0]) || {}).text || '';
  const init1 = byId(1).result || {};
  check('brain-search is a valid MCP server (serverInfo + recall instructions)', !!(init1.serverInfo && init1.serverInfo.name === 'brain-search' && /brain_search/.test(init1.instructions || '')), (q.stdout || '').slice(0, 200));
  const toolNames = ((byId(2).result || {}).tools || []).map((t) => t.name);
  check('brain-search serves brain_search + brain_brief by default', toolNames.includes('brain_search') && toolNames.includes('brain_brief'), toolNames.join(','));
  check('brain_search call returns the matching page', /todo-page/.test(toolText(byId(3))) && !(byId(3).result || {}).isError, toolText(byId(3)).slice(0, 200));
  check('brain_brief call returns a cited pack', /\[\[orphan-page\]\]/.test(toolText(byId(4))), toolText(byId(4)).slice(0, 200));
  check('a bad tool call is a tool error, not a crash', !!(byId(5).result && byId(5).result.isError), JSON.stringify(byId(5)).slice(0, 200));
  check('brain-search never replies to notifications', qm.every((m) => [1, 2, 3, 4, 5].includes(m.id)));
  check('brain-search exits cleanly on stdin close', q.status === 0, `status=${q.status} stderr=${(q.stderr || '').slice(0, 150)}`);
  q = runMcp(os.tmpdir());
  qm = parseRpc(q.stdout);
  check('without a brain: zero tools and no instructions', ((byId(2).result || {}).tools || []).length === 0 && !(byId(1).result || {}).instructions, (q.stdout || '').slice(0, 200));
  if (!qmdOnPath()) {
    fs.writeFileSync(path.join(BRAIN, '.qmd'), '');
    q = runMcp();
    qm = parseRpc(q.stdout);
    check('opted into qmd but qmd absent → built-in recall still serves', q.status === 0 && ((byId(2).result || {}).tools || []).length === 2, `status=${q.status}`);
    fs.rmSync(path.join(BRAIN, '.qmd'), { force: true });
  } else {
    check('qmd installed — real handoff path (fallback test skipped)', true);
  }

  // ---------- Monkey Brain Home: registry.js + home.js + registration wiring ----------
  console.log('registry.js + home.js (cross-project dashboard)');
  const HOMEJS = path.join(HERE, 'home.js');
  const REGCFG = path.join(ROOT, 'regcfg');
  const regEnv = { CLAUDE_CONFIG_DIR: REGCFG };
  const REGFILE = path.join(REGCFG, 'monkey-brain', 'projects.json');

  let hr = spawnSync(process.execPath, [HOMEJS], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...regEnv } });
  check('home.js with an empty registry writes a friendly empty state', hr.status === 0 && /0 project\(s\)/.test(hr.stdout) && fs.existsSync(path.join(REGCFG, 'monkey-brain', 'home.html')), hr.stdout);
  check('the empty-state page names /brain:init as the way in', /No projects registered yet/.test(fs.readFileSync(path.join(REGCFG, 'monkey-brain', 'home.html'), 'utf8')));

  const PA = path.join(ROOT, 'proj-a');
  const PB = path.join(ROOT, 'proj-b');
  for (const p of [PA, PB]) fs.mkdirSync(p, { recursive: true });
  let initR = spawnSync(process.execPath, [path.join(SKILLS, 'init', 'scripts', 'new-brain.js'), '--project', PA, '--name', 'Project A'], { encoding: 'utf8', timeout: 30000, env: { ...process.env, ...regEnv } });
  check('/brain:init registers the new project', initR.status === 0 && fs.existsSync(REGFILE) && JSON.parse(fs.readFileSync(REGFILE, 'utf8'))[Object.keys(JSON.parse(fs.readFileSync(REGFILE, 'utf8')))[0]].name === 'Project A', initR.stdout + initR.stderr);
  initR = spawnSync(process.execPath, [path.join(SKILLS, 'init', 'scripts', 'new-brain.js'), '--project', PB], { encoding: 'utf8', timeout: 30000, env: { ...process.env, ...regEnv } });
  check('init also registers unnamed projects, defaulting to the folder name', initR.status === 0 && Object.values(JSON.parse(fs.readFileSync(REGFILE, 'utf8'))).some((v) => v.name === path.basename(PB)), initR.stdout + initR.stderr);

  // Project A: a doctor run with a P0 (critical) and a real usage transcript.
  const writeRel = (root, rel, content) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content, 'utf8'); };
  writeRel(PA, '.brain/projects/x.md', '---\ntitle: "X"\ntype: project\nstatus: active\n---\n\n## Blockers\n- P0: broken auth (open)\n');
  const dr2 = spawnSync(process.execPath, [path.join(SKILLS, 'doctor', 'scripts', 'doctor.js'), '--brain', path.join(PA, '.brain'), '--json'], { encoding: 'utf8', timeout: 30000 });
  check('doctor ran on project A and wrote a health report', dr2.status === 0 && fs.existsSync(path.join(PA, '.brain', 'sessions', 'health.json')), dr2.stderr);
  // A transcript for project A, in the same CLAUDE_CONFIG_DIR the registry lives in (usage.js reads CLAUDE_CONFIG_DIR too).
  const encA = path.resolve(PA).replace(/[^A-Za-z0-9]/g, '-');
  writeRel(
    REGCFG,
    path.join('projects', encA, 's1.jsonl'),
    JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), cwd: PA, isSidechain: false, message: { id: 'hm1', model: 'claude-sonnet-5', usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 990, output_tokens: 20 } } }) + '\n'
  );

  hr = spawnSync(process.execPath, [HOMEJS], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...regEnv } });
  check('home.js aggregates 2 projects, newest-active first', hr.status === 0 && /2 project\(s\)/.test(hr.stdout), hr.stdout);
  const homeHtml = fs.readFileSync(path.join(REGCFG, 'monkey-brain', 'home.html'), 'utf8');
  check('project A shows Critical (open P0) and its real token total (1,020)', /Project A[\s\S]*?class="pill critical"/.test(homeHtml) && /1,020/.test(homeHtml), homeHtml.length);
  check('project B shows as not checked yet (no doctor run there)', /Not checked yet/.test(homeHtml), 'no "Not checked yet" pill found');
  check('the needs-attention section names project A', /Needs attention[\s\S]*?Project A/.test(homeHtml), homeHtml.slice(homeHtml.indexOf('Needs attention'), homeHtml.indexOf('Needs attention') + 300));
  check('home.js HTML-escapes project names (no raw script injection)', !/<script>/i.test(homeHtml) || /&lt;script&gt;/.test(homeHtml));

  // Deregistration: a project whose .brain/ is gone drops out of the next list().
  fs.rmSync(path.join(PB, '.brain'), { recursive: true, force: true });
  hr = spawnSync(process.execPath, [HOMEJS], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...regEnv } });
  check('a deleted .brain/ self-prunes from the registry', hr.status === 0 && /1 project\(s\)/.test(hr.stdout), hr.stdout);

  // brain-status.js touches (and lazily registers) a brain it finds, independent of init.
  const PC = path.join(ROOT, 'proj-c');
  fs.mkdirSync(path.join(PC, '.brain'), { recursive: true });
  fs.writeFileSync(path.join(PC, '.brain', 'CLAUDE.md'), '# c\n');
  run('brain-status.js', { cwd: PC, hook_event_name: 'SessionStart', source: 'startup' }, regEnv);
  check('brain-status registers a brain it finds, even without going through init', Object.values(JSON.parse(fs.readFileSync(REGFILE, 'utf8'))).some((v) => path.resolve(v.root) === path.resolve(PC)), fs.readFileSync(REGFILE, 'utf8'));

  let t2 = routed('show me all my brains');
  check('"all my brains" routes to brain:home', t2.ctx.includes('brain:home'), t2.ctx);
  t2 = routed('give me a dashboard across all my projects');
  check('"dashboard across all my projects" routes to brain:home', t2.ctx.includes('brain:home'), t2.ctx);
  t2 = routed('show me the dashboard');
  check('"show me the dashboard" (no "all") still routes to the per-project brain:dashboard', t2.ctx.includes('brain:dashboard') && !t2.ctx.includes('brain:home'), t2.ctx);

  for (const p of [PA, PB, PC]) fs.rmSync(p, { recursive: true, force: true });
  fs.rmSync(REGCFG, { recursive: true, force: true });

  // ---------- skill routing frontmatter (P5.5) ----------
  console.log('skill routing frontmatter (P5.5 model/effort policy)');
  const MODELS = new Set(['haiku', 'sonnet', 'opus']);
  const EFFORTS = new Set(['low', 'medium', 'high']);
  const routing = {
    home: { model: 'haiku', effort: 'low' },
    build: { model: 'sonnet', effort: 'medium' },
    ingest: { model: 'sonnet', effort: 'medium' },
    research: { model: 'sonnet', effort: 'medium' },
    init: { model: 'sonnet', effort: 'low' },
    terse: { model: 'haiku', effort: 'low' },
    brief: { model: 'sonnet', effort: 'low' },
    usage: { model: 'sonnet', effort: 'low' },
    loop: { effort: 'high' },
    digest: { model: 'sonnet', effort: 'low' },
    dump: { model: 'sonnet', effort: 'medium' },
    dashboard: { model: 'haiku', effort: 'low' },
    ci: { model: 'sonnet', effort: 'low' },
    lock: { model: 'haiku', effort: 'low' },
    learn: { model: 'sonnet', effort: 'medium' },
    career: { effort: 'high' },
    plan: { effort: 'high' },
    review: { effort: 'high' },
    wrap: { effort: 'high' },
    query: { effort: 'high' },
    lint: { effort: 'high' },
    compress: { effort: 'high' },
    'product-design': { effort: 'high' },
    game: { effort: 'high' },
    doctor: { effort: 'high' },
  };
  const fmGet = (text, key) => { const head = text.split(/\r?\n---/)[0] || ''; const m = new RegExp(`^${key}:\\s*(\\S+)\\s*$`, 'm').exec(head); return m ? m[1] : undefined; };
  let routingOk = 0;
  const routingBad = [];
  for (const name of Object.keys(routing)) {
    const p = path.join(SKILLS, name, 'SKILL.md');
    const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const model = fmGet(text, 'model');
    const effort = fmGet(text, 'effort');
    const exp = routing[name];
    const modelOk = exp.model ? model === exp.model : model === undefined;
    const effortOk = effort === exp.effort && EFFORTS.has(effort) && (model === undefined || MODELS.has(model));
    if (modelOk && effortOk) routingOk++;
    else routingBad.push(`${name}(model=${model},effort=${effort})`);
  }
  check(`all ${Object.keys(routing).length} skills declare the expected model/effort routing`, routingOk === Object.keys(routing).length, routingBad.join(' '));
  const judgmentPinned = ['plan', 'review', 'wrap', 'query', 'lint', 'compress', 'product-design', 'game', 'doctor'].filter((n) => fmGet(fs.readFileSync(path.join(SKILLS, n, 'SKILL.md'), 'utf8'), 'model') !== undefined);
  check('judgment skills inherit the main model (no downgrade)', judgmentPinned.length === 0, `pinned: ${judgmentPinned.join(',')}`);

  // Sonnet fan-out subagents (P5.5)
  const AGENTS = path.join(HERE, '..', '..', 'agents');
  for (const [aname, readOnly] of [['brain-librarian', false], ['brain-researcher', true]]) {
    const ap = path.join(AGENTS, aname + '.md');
    const atext = fs.existsSync(ap) ? fs.readFileSync(ap, 'utf8') : '';
    const ahead = atext.split(/\r?\n---/)[0] || '';
    const aname2 = fmGet(atext, 'name');
    const amodel = fmGet(atext, 'model');
    const hasDesc = /^description:\s*\S/m.test(ahead);
    const toolsLine = (/^tools:\s*(.+)$/m.exec(ahead) || [])[1] || '';
    check(`agent ${aname}: name + description + model:sonnet`, aname2 === aname && amodel === 'sonnet' && hasDesc, `name=${aname2} model=${amodel} desc=${hasDesc}`);
    if (readOnly) check(`agent ${aname} is read-only (no Write/Edit tools)`, toolsLine !== '' && !/\bWrite\b|\bEdit\b/.test(toolsLine), `tools=${toolsLine}`);
  }

  // ---------- /brain:init scaffold ----------
  console.log('new-brain.js (skill /brain:init scaffold)');
  const INITP = path.join(ROOT, 'init-proj');
  fs.mkdirSync(INITP, { recursive: true });
  const NEWBRAIN = path.join(SKILLS, 'init', 'scripts', 'new-brain.js');
  const NB = path.join(INITP, '.brain');
  let n = spawnSync(process.execPath, [NEWBRAIN, '--project', INITP, '--name', 'Widget Co'], { encoding: 'utf8', timeout: 20000 });
  check('scaffolds a fresh .brain', n.status === 0 && fs.existsSync(path.join(NB, 'CLAUDE.md')), `status=${n.status} ${n.stderr}`);
  const claudeMd = fs.existsSync(path.join(NB, 'CLAUDE.md')) ? fs.readFileSync(path.join(NB, 'CLAUDE.md'), 'utf8') : '';
  check('placeholders expanded', claudeMd.includes('Widget Co') && !claudeMd.includes('{{PROJECT}}'));
  check('seed wiki + staging + resume in place', ['wiki/index.md', 'wiki/log.md', 'wiki/dashboard.md', 'Clippings/.gitignore', 'resume.md', 'templates/source.md'].every((f) => fs.existsSync(path.join(NB, f))));
  check('v2 record layers scaffolded', ['specs/.gitkeep', 'projects/.gitkeep', 'sessions/.gitkeep', 'decisions/.gitkeep', 'instincts/pending/.gitkeep', 'instincts/active/.gitkeep', 'wiki/research/.gitkeep', 'templates/spec.md', 'templates/decision.md', 'templates/project-status.md', 'templates/instinct.md', 'templates/research.md'].every((f) => fs.existsSync(path.join(NB, f))));
  lr = spawnSync(process.execPath, [LINT, '--brain', NB, '--strict'], { encoding: 'utf8', timeout: 20000 });
  check('fresh scaffold lints clean (strict)', lr.status === 0 && /LINT CLEAN/.test(lr.stdout), lr.stdout.slice(-200));
  n = spawnSync(process.execPath, [NEWBRAIN, '--project', INITP], { encoding: 'utf8', timeout: 20000 });
  check('refuses to overwrite without --force', n.status === 1 && /--update/.test(n.stderr), `status=${n.status}`);
  fs.writeFileSync(path.join(NB, 'wiki', 'concepts', 'my-knowledge.md'), '---\ntype: concept\nupdated: 2026-07-17\n---\n\nSee [[index]].\n', 'utf8');
  n = spawnSync(process.execPath, [NEWBRAIN, '--project', INITP, '--name', 'Widget Co', '--update'], { encoding: 'utf8', timeout: 20000 });
  check('--update keeps knowledge, refreshes schema', n.status === 0 && fs.existsSync(path.join(NB, 'wiki', 'concepts', 'my-knowledge.md')) && fs.readFileSync(path.join(NB, 'CLAUDE.md'), 'utf8').includes('Widget Co'), `status=${n.status} ${n.stderr}`);
  // v1 → v2 migration: strip the v2 layers, --update must restore structure only.
  for (const d of ['specs', 'projects', 'sessions', 'decisions', 'instincts', path.join('wiki', 'research')]) {
    fs.rmSync(path.join(NB, d), { recursive: true, force: true });
  }
  fs.rmSync(path.join(NB, 'templates', 'spec.md'), { force: true });
  n = spawnSync(process.execPath, [NEWBRAIN, '--project', INITP, '--name', 'Widget Co', '--update'], { encoding: 'utf8', timeout: 20000 });
  const v2dirs = ['specs', 'projects', 'sessions', 'decisions', path.join('instincts', 'pending'), path.join('instincts', 'active'), path.join('wiki', 'research')];
  check('--update migrates v1 → v2 structure', n.status === 0 && v2dirs.every((d) => fs.existsSync(path.join(NB, d, '.gitkeep'))) && fs.existsSync(path.join(NB, 'templates', 'spec.md')), `status=${n.status} ${n.stdout.slice(0, 200)}`);
  check('migration leaves knowledge untouched', fs.existsSync(path.join(NB, 'wiki', 'concepts', 'my-knowledge.md')));
  const master = path.resolve(HERE, '..', '..', '..', 'schema', 'brain-template');
  const bundled = path.join(SKILLS, 'init', 'brain-template');
  if (fs.existsSync(master)) {
    const listRel = (d) => {
      const acc = [];
      (function walk(p) {
        for (const e of fs.readdirSync(p, { withFileTypes: true })) {
          const fp = path.join(p, e.name);
          if (e.isDirectory()) walk(fp);
          else acc.push(path.relative(d, fp).split(path.sep).join('/'));
        }
      })(d);
      return acc.sort();
    };
    const mFiles = listRel(master);
    const bFiles = fs.existsSync(bundled) ? listRel(bundled) : [];
    const sameSet = JSON.stringify(mFiles) === JSON.stringify(bFiles);
    const sameBytes = sameSet && mFiles.every((f) => fs.readFileSync(path.join(master, f)).equals(fs.readFileSync(path.join(bundled, f))));
    check('bundled template in sync with schema/brain-template (fix: new-brain.js --sync-template)', sameSet && sameBytes, sameSet ? 'content differs' : 'file sets differ');
  }

  // ---------- recommended-plugins manifest + offer (Phase 6) ----------
  console.log('recommended-plugins.json + plugins.js (/brain:init capability-plugin offer)');
  const PMANIFEST = path.join(SKILLS, 'init', 'recommended-plugins.json');
  const PLUGINSJS = path.join(SKILLS, 'init', 'scripts', 'plugins.js');
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(PMANIFEST, 'utf8')); } catch {}
  const plist = Array.isArray(manifest.plugins) ? manifest.plugins : [];
  const expectedPlugins = ['github', 'frontend-design', 'superpowers', 'security-guidance', 'product-tracking-skills', 'code-modernization', 'productivity', 'product-management', 'ui-ux-pro-max'];
  check('manifest lists all 9 recommended plugins', plist.length === 9 && expectedPlugins.every((n) => plist.some((p) => p.name === n)), plist.map((p) => p.name).join(','));
  check('every plugin declares category/fires_on/brain_integration/records', plist.length > 0 && plist.every((p) => p.category && p.fires_on && p.brain_integration && Array.isArray(p.records) && p.records.length && p.records.every((r) => r.what && r.to)), 'missing fields');
  check('every record target is a real .brain/ folder', plist.length > 0 && plist.every((p) => p.records.every((r) => /^(wiki\/|raw-sources\/|specs\/|projects\/|sessions\/|decisions\/|instincts\/)/.test(r.to))), 'bad record target');
  check('manifest states the "brain records the knowledge" contract', /records the knowledge/i.test(manifest.contract || ''));
  let pj = spawnSync(process.execPath, [PLUGINSJS], { encoding: 'utf8', timeout: 15000 });
  check('plugins.js lists every plugin + contract, exit 0', pj.status === 0 && expectedPlugins.every((n) => pj.stdout.includes(n)) && /records the knowledge/i.test(pj.stdout), `status=${pj.status} ${(pj.stderr || '').slice(0, 120)}`);
  pj = spawnSync(process.execPath, [PLUGINSJS, '--json'], { encoding: 'utf8', timeout: 15000 });
  let pjJson = {}; try { pjJson = JSON.parse(pj.stdout); } catch {}
  check('plugins.js --json emits the parseable manifest', pj.status === 0 && Array.isArray(pjJson.plugins) && pjJson.plugins.length === 9, `status=${pj.status}`);
  const tmplManual = fs.readFileSync(path.join(bundled, 'CLAUDE.md'), 'utf8');
  check('instance manual §9 states the plugin recording contract', /##\s*9\.\s*Capability plugins/.test(tmplManual) && /records the knowledge/i.test(tmplManual), 'no §9 contract');
  let pmeta = {}; try { pmeta = JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', '.claude-plugin', 'plugin.json'), 'utf8')); } catch {}
  const pdeps = Array.isArray(pmeta.dependencies) ? pmeta.dependencies : [];
  const autoNames = plist.filter((p) => p.auto_install).map((p) => p.name);
  check('plugin.json dependencies == the manifest\'s auto_install set, all from claude-plugins-official', autoNames.length > 0 && pdeps.length === autoNames.length && pdeps.every((d) => d.marketplace === 'claude-plugins-official' && autoNames.includes(d.name)), JSON.stringify(pdeps));
  pj = spawnSync(process.execPath, [PLUGINSJS], { encoding: 'utf8', timeout: 15000 });
  check('plugins.js marks the auto-installed plugins with ✓', autoNames.every((n) => pj.stdout.split('\n').some((l) => l.startsWith('✓') && l.includes(n))) && /brain-all@monkey-brain/.test(pj.stdout), pj.stdout.slice(0, 300));
  const MKT = path.join(HERE, '..', '..', '..', '.claude-plugin', 'marketplace.json');
  if (fs.existsSync(MKT)) {
    let mkt = {}; try { mkt = JSON.parse(fs.readFileSync(MKT, 'utf8')); } catch {}
    check('marketplace allowlists claude-plugins-official for dependencies', (mkt.allowCrossMarketplaceDependenciesOn || []).includes('claude-plugins-official'), JSON.stringify(mkt.allowCrossMarketplaceDependenciesOn));
    let bundle = {}; try { bundle = JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', '..', 'bundles', 'brain-all', '.claude-plugin', 'plugin.json'), 'utf8')); } catch {}
    const bdeps = Array.isArray(bundle.dependencies) ? bundle.dependencies : [];
    const bnames = bdeps.slice(1).map((d) => d.name);
    check('brain-all bundle = brain + official plugins (incl. the core five, no output styles, no dupes)', (mkt.plugins || []).some((p) => p.name === 'brain-all') && bdeps[0] === 'brain' && bdeps.slice(1).every((d) => d.marketplace === 'claude-plugins-official') && autoNames.every((n) => bnames.includes(n)) && !bnames.some((n) => /output-style/.test(n)) && new Set(bnames).size === bnames.length, `deps=${bdeps.length}`);
  }

  // ---------- recommended-mcp-servers manifest + offer (MCP capability registry, v0.25.0) ----------
  console.log('recommended-mcp-servers.json + mcp-servers.js (/brain:init MCP-server offer)');
  const MMANIFEST = path.join(SKILLS, 'init', 'recommended-mcp-servers.json');
  const MCPJS = path.join(SKILLS, 'init', 'scripts', 'mcp-servers.js');
  let mmanifest = {};
  try { mmanifest = JSON.parse(fs.readFileSync(MMANIFEST, 'utf8')); } catch {}
  const slist = Array.isArray(mmanifest.servers) ? mmanifest.servers : [];
  const expectedServers = ['supabase', 'firebase', 'figma', 'framer', 'vercel'];
  check('manifest lists all 5 recommended MCP servers', slist.length === 5 && expectedServers.every((n) => slist.some((s) => s.name === n)), slist.map((s) => s.name).join(','));
  check('every server declares category/fires_on/brain_integration/records/setup_hint', slist.length > 0 && slist.every((s) => s.category && s.fires_on && s.brain_integration && s.setup_hint && Array.isArray(s.records) && s.records.length && s.records.every((r) => r.what && r.to)), 'missing fields');
  check('every record target is a real .brain/ folder', slist.length > 0 && slist.every((s) => s.records.every((r) => /^(wiki\/|raw-sources\/|specs\/|projects\/|sessions\/|decisions\/|instincts\/)/.test(r.to))), 'bad record target');
  check('manifest states the "brain records the knowledge" contract', /records the knowledge/i.test(mmanifest.contract || ''));
  check('no setup_hint contains a literal secret (env-var placeholders only)', slist.every((s) => !/=\s*['"]?(sk-|sbp_|glpat-|ghp_)/i.test(s.setup_hint) ), 'a setup_hint looks like it embeds a real token');
  let mj = spawnSync(process.execPath, [MCPJS], { encoding: 'utf8', timeout: 15000 });
  check('mcp-servers.js lists every server + contract, exit 0', mj.status === 0 && expectedServers.every((n) => mj.stdout.includes(n)) && /records the knowledge/i.test(mj.stdout), `status=${mj.status} ${(mj.stderr || '').slice(0, 120)}`);
  mj = spawnSync(process.execPath, [MCPJS, '--json'], { encoding: 'utf8', timeout: 15000 });
  let mjJson = {}; try { mjJson = JSON.parse(mj.stdout); } catch {}
  check('mcp-servers.js --json emits the parseable manifest', mj.status === 0 && Array.isArray(mjJson.servers) && mjJson.servers.length === 5, `status=${mj.status}`);
  check('instance manual §9 states the MCP recording contract', /MCP servers \(the connected-data layer\)/.test(tmplManual) && /Supabase, Firebase, Figma, Framer,?\s*\n?\s*Vercel/.test(tmplManual), 'no MCP subsection in §9');

  // Detection: a fixture .mcp.json with one curated + one unrecognized + the brain's own server.
  writeRel(PA, '.mcp.json', JSON.stringify({ mcpServers: { supabase: { command: 'npx' }, 'brain-search': { command: 'node' }, 'some-random-server': { command: 'npx' } } }, null, 2));
  mj = spawnSync(process.execPath, [MCPJS, '--project', PA], { encoding: 'utf8', timeout: 15000 });
  check('mcp-servers.js marks a configured curated server with ✓', mj.status === 0 && mj.stdout.split('\n').some((l) => l.startsWith('✓') && l.includes('supabase')), mj.stdout.slice(0, 300));
  check('mcp-servers.js excludes brain-search (the brain\'s own server) from detection', !mj.stdout.includes('brain-search'), mj.stdout.slice(0, 300));
  check('mcp-servers.js surfaces an uncurated configured server under the generic fallback', mj.status === 0 && /no filing rules yet/i.test(mj.stdout) && mj.stdout.includes('some-random-server'), mj.stdout.slice(0, 300));
  fs.rmSync(path.join(PA, '.mcp.json'), { force: true });
  mj = spawnSync(process.execPath, [MCPJS, '--project', PA], { encoding: 'utf8', timeout: 15000 });
  check('mcp-servers.js is a silent no-crash no-op with no .mcp.json present', mj.status === 0 && !/no filing rules yet/i.test(mj.stdout), `status=${mj.status} ${(mj.stderr || '').slice(0, 120)}`);
  writeRel(PA, '.mcp.json', '{not valid json');
  mj = spawnSync(process.execPath, [MCPJS, '--project', PA], { encoding: 'utf8', timeout: 15000 });
  check('mcp-servers.js fails open on a malformed .mcp.json (never crashes)', mj.status === 0, `status=${mj.status} ${(mj.stderr || '').slice(0, 120)}`);
  fs.rmSync(path.join(PA, '.mcp.json'), { force: true });

  // ---------- product-design pack (Phase 6.5) ----------
  console.log('product-design pack (skills/product-design — first domain-expertise pack)');
  const PDDIR = path.join(SKILLS, 'product-design');
  const pdSkill = fs.existsSync(path.join(PDDIR, 'SKILL.md')) ? fs.readFileSync(path.join(PDDIR, 'SKILL.md'), 'utf8') : '';
  check('pack skill exists with description + effort:high', /^description:\s*\S/m.test(pdSkill.split(/\r?\n---/)[0] || '') && fmGet(pdSkill, 'effort') === 'high', 'SKILL.md frontmatter');
  check('pack SKILL.md stays under 150 lines', pdSkill && pdSkill.split('\n').length <= 150, `${pdSkill.split('\n').length} lines`);
  check('pack ships data/ knowledge (methods, heuristics, accessibility)', ['methods', 'heuristics', 'accessibility'].every((f) => fs.existsSync(path.join(PDDIR, 'data', f + '.md'))));
  check('pack ships templates/ deliverables (persona, journey-map, hmw, usability-test-script)', ['persona', 'journey-map', 'hmw', 'usability-test-script'].every((f) => fs.existsSync(path.join(PDDIR, 'templates', f + '.md'))));
  const pdCheck = fs.existsSync(path.join(PDDIR, 'checklist.md')) ? fs.readFileSync(path.join(PDDIR, 'checklist.md'), 'utf8') : '';
  check('pack checklist.md is a wrap-read gate with P0 items', pdCheck.includes('/brain:wrap') && pdCheck.includes('(P0)') && /blocks wrap/i.test(pdCheck), 'checklist gate');
  check('pack data cites real standards (Nielsen heuristics + WCAG POUR)', /Nielsen/.test(fs.readFileSync(path.join(PDDIR, 'data', 'heuristics.md'), 'utf8')) && /Perceivable|WCAG/.test(fs.readFileSync(path.join(PDDIR, 'data', 'accessibility.md'), 'utf8')));
  const wrapSkill = fs.readFileSync(path.join(SKILLS, 'wrap', 'SKILL.md'), 'utf8');
  check('/brain:wrap runs the active pack checklist gate', /pack:/.test(wrapSkill) && /checklist\.md/.test(wrapSkill) && /P0/.test(wrapSkill), 'wrap pack gate');
  const psTmpl = fs.readFileSync(path.join(bundled, 'templates', 'project-status.md'), 'utf8');
  check('project-status template carries the pack: field', /^pack:/m.test(psTmpl), 'no pack field');

  // ---------- product & game pipelines (Phase 7) ----------
  console.log('game pipeline + pipelines doc (Phase 7)');
  const gameSkill = fs.existsSync(path.join(SKILLS, 'game', 'SKILL.md')) ? fs.readFileSync(path.join(SKILLS, 'game', 'SKILL.md'), 'utf8') : '';
  check('game skill exists with description + effort:high', /^description:\s*\S/m.test(gameSkill.split(/\r?\n---/)[0] || '') && fmGet(gameSkill, 'effort') === 'high', 'game SKILL.md frontmatter');
  check('game SKILL.md stays under 150 lines', gameSkill && gameSkill.split('\n').length <= 150, `${gameSkill.split('\n').length} lines`);
  check('game skill walks GDD → prototype spec → playtest → balance ADR', /templates\/gdd\.md/.test(gameSkill) && /prototype/i.test(gameSkill) && /playtest/i.test(gameSkill) && /decisions\//.test(gameSkill), 'pipeline steps');
  const gddTmpl = fs.existsSync(path.join(bundled, 'templates', 'gdd.md')) ? fs.readFileSync(path.join(bundled, 'templates', 'gdd.md'), 'utf8') : '';
  check('GDD template ships (type: gdd, MDA + core loop)', /^type:\s*gdd/m.test(gddTmpl) && /MDA/.test(gddTmpl) && /core loop/i.test(gddTmpl), 'gdd template');
  check('instance manual §10 documents product + game pipelines', /##\s*10\.\s*Domain pipelines/.test(tmplManual) && /Product:/.test(tmplManual) && /Game:/.test(tmplManual), 'no §10 pipelines');

  // ---------- /brain:doctor 18-check health monitor (Phase 8 + v3 P11) ----------
  console.log('doctor.js (skill /brain:doctor — 15 health checks + health.json surfacing)');
  const DOCTOR = path.join(SKILLS, 'doctor', 'scripts', 'doctor.js');
  let dr = spawnSync(process.execPath, [DOCTOR, '--brain', BRAIN], { encoding: 'utf8', timeout: 20000 });
  check('doctor runs all 19 checks, exit 0 by default', dr.status === 0 && /19-check health/.test(dr.stdout) && /1\. broken-links/.test(dr.stdout) && /15\. schema-version/.test(dr.stdout) && /19\. ci-presence/.test(dr.stdout), `status=${dr.status} ${(dr.stderr || '').slice(0, 120)}`);
  const HEALTHP = path.join(BRAIN, 'sessions', 'health.json');
  check('doctor writes sessions/health.json', fs.existsSync(HEALTHP), 'no health.json');
  let dj = spawnSync(process.execPath, [DOCTOR, '--brain', BRAIN, '--json'], { encoding: 'utf8', timeout: 20000 });
  let hrep = {}; try { hrep = JSON.parse(dj.stdout); } catch {}
  check('doctor --json reports exactly 19 findings + numeric counts', Array.isArray(hrep.findings) && hrep.findings.length === 19 && typeof hrep.ok === 'number' && typeof hrep.crit === 'number', `findings=${(hrep.findings || []).length}`);
  check('doctor flags the fixture orphan (check 2)', (hrep.findings || []).some((f) => f.check === 'orphans' && f.level === 'warn' && /orphan-page/.test(f.detail)), JSON.stringify((hrep.findings || []).find((f) => f.check === 'orphans')));
  check('doctor flags a feature+ spec with no test plan (check 13)', (hrep.findings || []).some((f) => f.check === 'specs-without-tests' && f.level === 'warn'), 'no specs-without-tests warn');
  check('doctor reports model-mix from agents.md', typeof hrep.model_mix === 'string' && /sonnet/.test(hrep.model_mix), hrep.model_mix);
  write('.brain/projects/security.md', '---\ntitle: "Security"\ntype: project\nstatus: active\ntier: feature\n---\n\n## Blockers\n- P0: SQL injection in login (open)\n');
  dj = spawnSync(process.execPath, [DOCTOR, '--brain', BRAIN, '--json'], { encoding: 'utf8', timeout: 20000 });
  hrep = {}; try { hrep = JSON.parse(dj.stdout); } catch {}
  check('an open P0 finding is critical (check 14, gates wrap)', (hrep.findings || []).some((f) => f.check === 'open-p0' && f.level === 'crit' && /security/.test(f.detail)), JSON.stringify((hrep.findings || []).find((f) => f.check === 'open-p0')));
  r = run('brain-status.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }));
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const hctx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('brain-status surfaces the doctor health report next session', hctx.includes('🩺 Health') && /critical/.test(hctx), hctx.slice(0, 300));
  dr = spawnSync(process.execPath, [DOCTOR, '--brain', BRAIN, '--strict'], { encoding: 'utf8', timeout: 20000 });
  check('doctor --strict exits 1 when warnings/criticals exist', dr.status === 1, `status=${dr.status}`);
  dr = spawnSync(process.execPath, [DOCTOR, '--brain', os.tmpdir()], { encoding: 'utf8', timeout: 20000 });
  check('doctor is a silent no-op without a brain', dr.status === 0 && /No Monkey Brain/.test(dr.stdout), `status=${dr.status}`);

  // ---------- v3 P17: life packs (learn · career) ----------
  console.log('learn (srs.js) + career privacy (v3 P17 — life packs)');
  const SRS = path.join(SKILLS, 'learn', 'scripts', 'srs.js');
  const srs = (day, ...a) => spawnSync(process.execPath, [SRS, ...a], { cwd: PROJ, encoding: 'utf8', timeout: 15000, env: { ...process.env, MONKEY_BRAIN_TODAY: day } });
  srs('2026-03-01', 'add', 'jp', '食べる', 'to eat');
  srs('2026-03-01', 'add', 'jp', '飲む', 'to drink');
  let sr2 = srs('2026-03-01', 'due', 'jp');
  check('new cards are due the day they are added', /2 due in jp/.test(sr2.stdout) && /#1 · front: 食べる · back: to eat/.test(sr2.stdout), sr2.stdout + sr2.stderr);
  sr2 = srs('2026-03-01', 'grade', 'jp', '1', '5');
  check('SM-2: a first correct answer → due tomorrow, ease up', /next due 2026-03-02 \(interval 1d · ease 2\.6\)/.test(sr2.stdout), sr2.stdout + sr2.stderr);
  sr2 = srs('2026-03-02', 'grade', 'jp', '1', '5');
  check('SM-2: the second correct answer → 6 days', /next due 2026-03-08 \(interval 6d · ease 2\.7\)/.test(sr2.stdout), sr2.stdout);
  sr2 = srs('2026-03-08', 'grade', 'jp', '1', '4');
  check('SM-2: then interval × ease (6 × 2.7 → 16 days)', /next due 2026-03-24 \(interval 16d · ease 2\.7\)/.test(sr2.stdout), sr2.stdout);
  sr2 = srs('2026-03-24', 'grade', 'jp', '1', '2');
  check('SM-2: a failed recall restarts the card and keeps its ease', /next due 2026-03-25 \(interval 1d · ease 2\.7 · 1 lapse\(s\)\)/.test(sr2.stdout), sr2.stdout);
  for (let i = 0; i < 30; i++) srs('2026-03-01', 'add', 'big', `word ${i}`, `meaning ${i}`);
  sr2 = srs('2026-03-01', 'due', 'big', '--limit', '5');
  check('only due cards enter context, capped by --limit', /30 due in big \(showing 5\)/.test(sr2.stdout) && (sr2.stdout.match(/^#\d+ ·/gm) || []).length === 5, sr2.stdout.slice(0, 200));
  sr2 = srs('2026-03-01', 'stats');
  check('stats summarise every deck', /jp: 2 card\(s\)/.test(sr2.stdout) && /big: 30 card\(s\)/.test(sr2.stdout), sr2.stdout);

  const caseText = (status, conf) => `---\ntitle: "Case study — billing"\ntype: case-study\nstatus: ${status}         # assembled | drafted | publishable\nconfidentiality: ${conf}  # pending | cleared\n---\n\n# Billing\n`;
  const caseWrite = (rel, content) => run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, rel), content } }));
  let cw = caseWrite('.brain/private/cases/billing.md', caseText('drafted', 'pending'));
  check('a drafted case study writes freely inside private/', cw.status === 0, `status=${cw.status} ${cw.stderr}`);
  cw = caseWrite('.brain/private/cases/billing.md', caseText('publishable', 'pending'));
  check('publishable without confidentiality: cleared is refused', cw.status === 2 && /guard\[career\]/.test(cw.stderr) && /publishable/.test(cw.stderr), `status=${cw.status} ${cw.stderr}`);
  cw = caseWrite('.brain/private/cases/billing.md', caseText('publishable', 'cleared'));
  check('a cleared case study can be publishable', cw.status === 0, `status=${cw.status} ${cw.stderr}`);
  cw = caseWrite('site/billing.md', caseText('drafted', 'pending'));
  check('an uncleared case study cannot leave private/', cw.status === 2 && /stays in `\.brain\/private\/`/.test(cw.stderr), `status=${cw.status} ${cw.stderr}`);
  write('.brain/private/cases/billing.md', caseText('drafted', 'pending'));
  cw = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'private', 'cases', 'billing.md'), old_string: 'status: drafted', new_string: 'status: publishable' } }));
  check('an Edit that flips a case study to publishable is caught too', cw.status === 2 && /guard\[career\]/.test(cw.stderr), `status=${cw.status} ${cw.stderr}`);
  write('.brain/private/cases/secret.md', '---\ntitle: "Secret"\ntype: case-study\nconfidentiality: pending\n---\n\nzanzibarquux client revenue numbers\n');
  const privSearch = spawnSync(process.execPath, [path.join(HERE, 'search.js'), 'zanzibarquux', '--json'], { cwd: PROJ, encoding: 'utf8', timeout: 15000 });
  let privHits = null; try { privHits = JSON.parse(privSearch.stdout); } catch {}
  check('private/ is never indexed by search', Array.isArray(privHits) && privHits.length === 0, privSearch.stdout);
  const NB17 = path.join(ROOT, 'nb17');
  fs.mkdirSync(NB17, { recursive: true });
  spawnSync(process.execPath, [path.join(SKILLS, 'init', 'scripts', 'new-brain.js'), '--project', NB17], { encoding: 'utf8', timeout: 30000 });
  let privIgnore = ''; try { privIgnore = fs.readFileSync(path.join(NB17, '.brain', 'private', '.gitignore'), 'utf8'); } catch {}
  check('new brains keep private/ out of git', /^\*$/m.test(privIgnore), privIgnore || 'no private/.gitignore');
  for (const d of [path.join(BRAIN, 'private'), path.join(BRAIN, 'learning'), NB17, path.join(PROJ, 'site')]) fs.rmSync(d, { recursive: true, force: true });

  // ---------- v3 P16: team mode (lock.js · union merges · per-machine ignores) ----------
  console.log('lock.js + union merges + per-author digests (v3 P16 — team mode)');
  const ymd = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const lk = (who, ...a) => spawnSync(process.execPath, [path.join(HERE, 'lock.js'), ...a], { cwd: PROJ, encoding: 'utf8', timeout: 15000, env: { ...process.env, MONKEY_BRAIN_AUTHOR: who } });
  const LOCKF = path.join(BRAIN, 'LOCK.md');
  write('.brain/specs/billing.md', '---\ntitle: "Billing"\ntype: spec\nstatus: active\ntier: quick\n---\n\n## Acceptance criteria\n- **AC-1** — a\n');
  let lkr = lk('alice@team.dev', 'acquire', 'billing', '--hours', '2', '--note', 'reworking invoices');
  check('acquire writes LOCK.md with author, scope and expiry', lkr.status === 0 && fs.existsSync(LOCKF) && /author: "alice@team\.dev"/.test(fs.readFileSync(LOCKF, 'utf8')) && /scope: billing/.test(fs.readFileSync(LOCKF, 'utf8')), lkr.stdout + lkr.stderr);
  lkr = lk('bob@team.dev', 'acquire', 'billing');
  check('a teammate cannot take an active lock without --force', lkr.status === 1 && /alice@team\.dev holds the lock on billing/.test(lkr.stderr), lkr.stderr);
  const lockedEdit = (who) => run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(BRAIN, 'specs', 'billing.md'), old_string: '— a', new_string: '— b' } }), { MONKEY_BRAIN_AUTHOR: who });
  let le = lockedEdit('bob@team.dev');
  check('guards keep a teammate\'s writes out of the locked scope', le.status === 2 && /guard\[lock\]/.test(le.stderr) && /alice@team\.dev/.test(le.stderr), `status=${le.status} ${le.stderr}`);
  le = lockedEdit('alice@team.dev');
  check('the lock holder writes freely', le.status === 0, `status=${le.status} ${le.stderr}`);
  const statusAs = (who) => { const s = run('brain-status.js', evt({ hook_event_name: 'SessionStart', source: 'startup' }), { MONKEY_BRAIN_AUTHOR: who }); try { return JSON.parse(s.stdout).hookSpecificOutput.additionalContext || ''; } catch { return ''; } };
  let sa = statusAs('bob@team.dev');
  check('a teammate sees the lock at session start', /🔒 alice@team\.dev holds the lock on billing/.test(sa), sa.slice(0, 300));
  sa = statusAs('alice@team.dev');
  check('the holder is reminded to release it', /🔒 You hold the lock on billing/.test(sa), sa.slice(0, 300));
  lkr = lk('bob@team.dev', 'release');
  check('only the holder releases an active lock', lkr.status === 1 && fs.existsSync(LOCKF), lkr.stderr);
  fs.writeFileSync(LOCKF, '---\ntitle: "Work lock"\ntype: lock\nauthor: "alice@team.dev"\nscope: brain\nsince: 2026-01-01T00:00:00.000Z\nuntil: 2026-01-01T08:00:00.000Z\nnote: ""\n---\n', 'utf8');
  sa = statusAs('bob@team.dev');
  check('an expired lock shows as free at session start', /🔓 alice@team\.dev's lock on brain expired/.test(sa), sa.slice(0, 300));
  le = lockedEdit('bob@team.dev');
  check('an expired lock no longer blocks writes', le.status === 0, `status=${le.status} ${le.stderr}`);
  lkr = lk('bob@team.dev', 'acquire', 'brain');
  check('an expired lock can be taken over', lkr.status === 0 && /You hold the lock on brain/.test(lkr.stdout), lkr.stdout + lkr.stderr);
  lkr = lk('bob@team.dev', 'release');
  check('release removes LOCK.md', lkr.status === 0 && !fs.existsSync(LOCKF), lkr.stdout + lkr.stderr);

  const digestAs = (who) => spawnSync(process.execPath, [path.join(HERE, 'digest.js')], { cwd: PROJ, encoding: 'utf8', timeout: 30000, env: { ...process.env, MONKEY_BRAIN_AUTHOR: who } });
  digestAs('alice@team.dev');
  const bobDigest = digestAs('bob@team.dev');
  const bobFile = path.join(BRAIN, 'sessions', `standup-${ymd}-bob.md`);
  check('a teammate\'s same-day digest never overwrites yours', fs.existsSync(path.join(BRAIN, 'sessions', `standup-${ymd}.md`)) && fs.existsSync(bobFile) && /author: "bob@team\.dev"/.test(fs.readFileSync(bobFile, 'utf8')), bobDigest.stdout.slice(-200));

  const UPD = path.join(ROOT, 'upd');
  fs.mkdirSync(path.join(UPD, '.brain', 'wiki'), { recursive: true });
  fs.writeFileSync(path.join(UPD, '.brain', 'CLAUDE.md'), '# an older brain\n');
  const up = spawnSync(process.execPath, [path.join(SKILLS, 'init', 'scripts', 'new-brain.js'), '--project', UPD, '--update'], { encoding: 'utf8', timeout: 30000 });
  check('--update adds the team files to an existing brain', up.status === 0 && fs.existsSync(path.join(UPD, '.brain', '.gitattributes')) && fs.existsSync(path.join(UPD, '.brain', 'sessions', '.gitignore')), up.stdout + up.stderr);

  if (spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0) {
    const GT = path.join(ROOT, 'gitteam');
    const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@x', '-c', 'init.defaultBranch=main', '-c', 'core.autocrlf=false', ...a], { cwd, encoding: 'utf8', timeout: 30000 });
    fs.mkdirSync(GT, { recursive: true });
    git(GT, 'init', '-q', '--bare', 'origin.git');
    git(GT, 'clone', '-q', 'origin.git', 'a');
    const CA = path.join(GT, 'a');
    const CB = path.join(GT, 'b');
    spawnSync(process.execPath, [path.join(SKILLS, 'init', 'scripts', 'new-brain.js'), '--project', CA], { encoding: 'utf8', timeout: 30000 });
    git(CA, 'add', '-A');
    git(CA, 'commit', '-q', '-m', 'brain');
    git(CA, 'push', '-q', 'origin', 'HEAD:main');
    git(GT, 'clone', '-q', 'origin.git', 'b');
    fs.appendFileSync(path.join(CA, '.brain', 'wiki', 'log.md'), '\n## [2026-09-13] build | from alice\n');
    git(CA, 'commit', '-q', '-am', 'alice');
    git(CA, 'push', '-q', 'origin', 'HEAD:main');
    fs.appendFileSync(path.join(CB, '.brain', 'wiki', 'log.md'), '\n## [2026-09-13] build | from bob\n');
    git(CB, 'commit', '-q', '-am', 'bob');
    const pulled = git(CB, 'pull', '-q', '--no-rebase', '--no-edit', 'origin', 'main');
    const mergedLog = fs.readFileSync(path.join(CB, '.brain', 'wiki', 'log.md'), 'utf8');
    check('two teammates\' log entries merge without a conflict (union driver)', pulled.status === 0 && /from alice/.test(mergedLog) && /from bob/.test(mergedLog) && !/^(<<<<<<<|>>>>>>>)/m.test(mergedLog), (pulled.stderr || pulled.stdout || '').slice(0, 300));
    fs.writeFileSync(path.join(CA, '.brain', 'sessions', 'graph.json'), '{}');
    fs.writeFileSync(path.join(CA, '.brain', 'sessions', 'agents.md'), '# dispatch log\n');
    const porcelain = git(CA, 'status', '--porcelain').stdout;
    check('per-machine caches stay out of git; shared logs are tracked', !/graph\.json/.test(porcelain) && /agents\.md/.test(porcelain), porcelain);
  } else {
    check('git not installed — union-merge test skipped', true);
  }
  for (const f of ['specs/billing.md', `sessions/standup-${ymd}.md`, `sessions/standup-${ymd}-bob.md`]) fs.rmSync(path.join(BRAIN, f), { force: true });
  fs.rmSync(UPD, { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, 'gitteam'), { recursive: true, force: true });

  // ---------- v3 P15: learned bans (bans.js · instincts.js) + frontmatter comments ----------
  console.log('bans.js + instincts.js + frontmatter comments (v3 P15 — learned bans)');
  const todayStr = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  write('.brain/specs/commented.md', '---\ntitle: "Commented"\ntype: spec\nstatus: active            # draft | active | done\ntier: architecture       # quick | feature | architecture\nplan_approved: false     # the curator flips this\n---\n\n## Acceptance criteria\n- **AC-1** — a\n');
  let gc = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'app', 'core.js'), content: 'x' } }));
  check('gates read a spec\'s tier through template comments (plan gate fires)', gc.status === 2 && /commented\.md/.test(gc.stderr), `status=${gc.status} ${gc.stderr}`);
  fs.rmSync(path.join(BRAIN, 'specs', 'commented.md'), { force: true });
  fs.rmSync(path.join(BRAIN, 'sessions', 'gate-blocks.json'), { force: true });

  const instinctFile = (name, fmLines, rule) => write(`.brain/instincts/active/${name}.md`, `---\ntitle: "Instinct — ${name}"\ntype: instinct\nstatus: active\n${fmLines}\n---\n\n# ${name}\n\n**Rule:** ${rule}\n`);
  instinctFile('no-console-log', "ban: 'console\\.log\\('\nban_paths: '\\.(js|ts)$'\nenforce: warn", 'Use the project logger, not console.log.');
  instinctFile('no-eval', "ban: 'eval\\('\nenforce: block", 'Never call eval — parse instead.');
  const postWrite = (rel, content) => {
    write(rel, content);
    const r = run('instinct-track.js', evt({ hook_event_name: 'PostToolUse', tool_name: 'Write', session_id: `st${process.pid}-ban`, tool_input: { file_path: path.join(PROJ, rel), content } }));
    try { return JSON.parse(r.stdout).hookSpecificOutput.additionalContext || ''; } catch { return r.stdout || ''; }
  };
  let bctx = postWrite('app/log.js', 'const a = 1;\nconsole.log("hi")\n');
  check('a warn ban is reported right after the write, with its line', /learned bans/.test(bctx) && /no-console-log/.test(bctx) && /line 2 of the new text/.test(bctx), bctx);
  bctx = postWrite('app/note.md', 'console.log("hi")\n');
  check('ban_paths scopes a ban (a .md file is not checked)', !/no-console-log/.test(bctx), bctx);
  write('app/x.js', '// placeholder\n');
  const guardWrite = (content) => run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'app', 'x.js'), content } }));
  let bg = guardWrite('const v = eval(input);\n');
  check('a block ban refuses the write before it happens', bg.status === 2 && /guard\[instinct\]/.test(bg.stderr) && /no-eval/.test(bg.stderr), `status=${bg.status} ${bg.stderr}`);
  bg = guardWrite('const v = JSON.parse(input);\n');
  check('clean code passes the ban guard', bg.status === 0, `status=${bg.status} ${bg.stderr}`);
  write('.brain/projects/looks.md', '---\ntitle: "Looks"\ntype: project\nstatus: active\npack: product-design     # governs this workstream\n---\n');
  bctx = postWrite('app/card.css', '.card { backdrop-filter: blur(8px); }\n');
  check('a declared pack contributes its bans (product-design: glassmorphism)', /glassmorphism/.test(bctx) && /product-design pack/.test(bctx), bctx);
  fs.rmSync(path.join(BRAIN, 'projects', 'looks.md'), { force: true });
  bctx = postWrite('app/card.css', '.card { backdrop-filter: blur(8px); }\n');
  check('without the pack declared, its bans stay off', !/glassmorphism/.test(bctx), bctx);
  let bst = ''; try { bst = JSON.parse(run('brain-status.js', evt({ hook_event_name: 'SessionStart', source: 'startup' })).stdout).hookSpecificOutput.additionalContext; } catch {}
  check('session start lists the learned bans', /Learned bans:\*\* 2 pattern\(s\)/.test(bst), bst.slice(0, 400));

  write('.brain/instincts/pending/use-zod.md', '---\ntitle: "Instinct — use zod"\ntype: instinct\nstatus: pending\nconfidence:               # blank → derived from evidence\ncreated: 2026-01-01\nevidence: [a, b, c, d]\n---\n\n**Rule:** validate input with zod.\n');
  write('.brain/instincts/pending/maybe.md', `---\ntitle: "Instinct — maybe"\ntype: instinct\nstatus: pending\ncreated: ${todayStr}\nevidence: [a]\n---\n\n**Rule:** maybe.\n`);
  const inst = (...a) => spawnSync(process.execPath, [path.join(HERE, 'instincts.js'), ...a], { cwd: PROJ, encoding: 'utf8', timeout: 15000 });
  let ir = inst('status');
  check('the instinct queue ranks by confidence and flags promote / stale', /use-zod — 0\.85 → promote\? · stale/.test(ir.stdout) && /maybe — 0\.40/.test(ir.stdout) && ir.stdout.indexOf('use-zod') < ir.stdout.indexOf('maybe —'), ir.stdout);
  ir = inst('promote', 'use-zod');
  const promoted = path.join(BRAIN, 'instincts', 'active', 'use-zod.md');
  check('promote moves a rule to active/ and marks it active', ir.status === 0 && fs.existsSync(promoted) && /^status: active/m.test(fs.readFileSync(promoted, 'utf8')), ir.stdout + ir.stderr);
  ir = inst('prune', 'maybe');
  check('prune keeps the rule on record in pruned/', ir.status === 0 && fs.existsSync(path.join(BRAIN, 'instincts', 'pruned', 'maybe.md')) && !fs.existsSync(path.join(BRAIN, 'instincts', 'pending', 'maybe.md')), ir.stdout + ir.stderr);
  ir = inst('test', path.join(PROJ, 'app', 'log.js'));
  check('instincts test shows which bans fire on a file', /no-console-log/.test(ir.stdout), ir.stdout);
  instinctFile('broken', "ban: '([unclosed'", 'A broken pattern.');
  ir = inst('status');
  check('an invalid ban pattern is reported, never fatal', ir.status === 0 && /invalid ban patterns.*broken/.test(ir.stdout), ir.stdout);
  bg = guardWrite('ok\n');
  check('the hooks skip an invalid ban instead of failing', bg.status === 0, `status=${bg.status} ${bg.stderr}`);
  for (const f of ['instincts/active/no-console-log.md', 'instincts/active/no-eval.md', 'instincts/active/use-zod.md', 'instincts/active/broken.md', 'instincts/pruned/maybe.md']) fs.rmSync(path.join(BRAIN, f), { force: true });
  fs.rmSync(path.join(PROJ, 'app'), { recursive: true, force: true });

  // ---------- v3 P14: daily-driver workflows (digest · dashboard · ci · doctor 19) ----------
  console.log('digest.js + dashboard.js + ci.js + doctor 19 (v3 P14 — daily workflows)');
  const hookRun = (script, args, cwd) => spawnSync(process.execPath, [path.join(HERE, script), ...args], { cwd: cwd || PROJ, encoding: 'utf8', timeout: 30000 });
  const localDay = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  write('.brain/specs/daily.md', '---\ntitle: "Daily"\ntype: spec\nstatus: active\ntier: quick\nphase: build\n---\n\n## Acceptance criteria\n- **AC-1** — a ✅ t\n- **AC-2** — b\n');
  fs.appendFileSync(path.join(BRAIN, 'wiki', 'log.md'), `\n## [${localDay}] build | daily digest test\n`, 'utf8');
  let dg = hookRun('digest.js', []);
  const iBlocked = dg.stdout.indexOf('## Blocked'), iDone = dg.stdout.indexOf('## Done since'), iFlight = dg.stdout.indexOf('## In flight');
  check('standup: blocked first, then done, then in flight', dg.status === 0 && iBlocked >= 0 && iBlocked < iDone && iDone < iFlight, dg.stdout.slice(0, 300) || dg.stderr);
  check('standup shows today\'s log work and open specs with AC progress', /build \| daily digest test/.test(dg.stdout) && /`daily` — quick · phase build · ACs 1\/2/.test(dg.stdout), dg.stdout.slice(0, 600));
  check('standup lists open P0s as blockers', /security: P0: SQL injection/.test(dg.stdout), dg.stdout.slice(0, 400));
  const standupFile = path.join(BRAIN, 'sessions', `standup-${localDay}.md`);
  check('standup files itself to sessions/', fs.existsSync(standupFile) && /type: standup/.test(fs.readFileSync(standupFile, 'utf8')), standupFile);
  dg = hookRun('digest.js', ['--week', '--no-file']);
  check('weekly review adds decisions, closed specs and housekeeping (no file with --no-file)', /## Decisions this week/.test(dg.stdout) && /## Specs closed/.test(dg.stdout) && /instinct queue/.test(dg.stdout) && !fs.existsSync(path.join(BRAIN, 'sessions', `weekly-${localDay}.md`)), dg.stdout.slice(-400));

  write('.brain/projects/xss.md', '---\ntitle: "<script>alert(1)</script>"\ntype: project\nstatus: paused\n---\n');
  const db = hookRun('dashboard.js', []);
  const dashFile = path.join(BRAIN, 'sessions', 'dashboard.html');
  const html = fs.existsSync(dashFile) ? fs.readFileSync(dashFile, 'utf8') : '';
  check('dashboard writes one self-contained HTML page', db.status === 0 && /Dashboard written/.test(db.stdout) && /<title>/.test(html) && !/(src|href)="https?:/.test(html), db.stdout || db.stderr);
  check('dashboard escapes brain text (no script injection)', html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !html.includes('<script>alert(1)'), 'unescaped content');
  check('dashboard shows open specs with AC progress', /daily<\/code> · quick · build · ACs 1\/2/.test(html), 'no spec row');

  const CIP = path.join(ROOT, 'cip');
  fs.mkdirSync(path.join(CIP, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(CIP, 'package.json'), JSON.stringify({ scripts: { test: 'node t.js', lint: 'eslint .', build: 'tsc' } }));
  fs.writeFileSync(path.join(CIP, 'package-lock.json'), '{}');
  fs.writeFileSync(path.join(CIP, 'requirements.txt'), '');
  fs.writeFileSync(path.join(CIP, 'go.mod'), 'module example.com/x\n');
  fs.writeFileSync(path.join(CIP, 'App.csproj'), '<Project />');
  fs.writeFileSync(path.join(CIP, 'Cargo.toml'), '[package]\nname = "x"\n');
  let cr = hookRun('ci.js', ['--dry-run', '--root', CIP]);
  check('ci detects Node, Python, Go, .NET and Rust with the right steps', /Node \(install, lint, test, build\)/.test(cr.stdout) && /Python \(install, test\)/.test(cr.stdout) && /Go \(vet, test, build\)/.test(cr.stdout) && /\.NET \(restore, build, test\)/.test(cr.stdout) && /Rust \(build, test\)/.test(cr.stdout) && /npm ci/.test(cr.stdout), cr.stdout.slice(0, 300));
  check('ci --dry-run writes nothing', !fs.existsSync(path.join(CIP, '.github')), 'wrote on dry run');
  cr = hookRun('ci.js', ['--root', CIP]);
  const ciYml = path.join(CIP, '.github', 'workflows', 'ci.yml');
  check('ci writes .github/workflows/ci.yml', fs.existsSync(ciYml) && /actions\/setup-node@v4/.test(fs.readFileSync(ciYml, 'utf8')) && /go-version-file: "go\.mod"/.test(fs.readFileSync(ciYml, 'utf8')), cr.stdout);
  cr = hookRun('ci.js', ['--root', CIP]);
  check('ci never overwrites an existing workflow without --force', /already exists — left untouched/.test(cr.stdout), cr.stdout);

  const ciFinding = () => {
    const d = spawnSync(process.execPath, [path.join(SKILLS, 'doctor', 'scripts', 'doctor.js'), '--brain', BRAIN, '--json'], { encoding: 'utf8', timeout: 30000 });
    let o = {}; try { o = JSON.parse(d.stdout); } catch {}
    return (o.findings || []).find((f) => f.check === 'ci-presence') || {};
  };
  fs.writeFileSync(path.join(PROJ, 'package.json'), JSON.stringify({ scripts: { test: 'node t.js' } }));
  check('doctor 19: a code project without CI warns', ciFinding().level === 'warn', JSON.stringify(ciFinding()));
  fs.mkdirSync(path.join(PROJ, '.github', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(PROJ, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
  check('doctor 19: CI present → ok', ciFinding().level === 'ok', JSON.stringify(ciFinding()));
  for (const f of ['.brain/specs/daily.md', '.brain/projects/xss.md', `.brain/sessions/standup-${localDay}.md`, '.brain/sessions/dashboard.html', 'package.json']) fs.rmSync(path.join(PROJ, f), { force: true });
  fs.rmSync(path.join(PROJ, '.github'), { recursive: true, force: true });
  fs.rmSync(CIP, { recursive: true, force: true });

  // ---------- Post-v3: gh-based PR review (pr.js) ----------
  console.log('pr.js (Post-v3 — read-only gh PR fetch for /brain:review)');
  const prLib = require(path.join(HERE, 'pr.js'));
  check('summarize() renders an error result verbatim', prLib.summarize({ ok: false, error: 'gh is not authenticated — run `gh auth login` first.' }) === 'gh is not authenticated — run `gh auth login` first.', 'mismatch');
  const okResult = {
    ok: true,
    pr: { number: 42, title: 'Add widget', url: 'https://github.com/x/y/pull/42', state: 'OPEN', isDraft: false, headRefName: 'feat/widget', baseRefName: 'main', author: { login: 'octocat' } },
    checks: [{ name: 'build', bucket: 'pass' }, { name: 'lint', bucket: 'fail' }],
    diff: '--- a/x.js\n+++ b/x.js\n',
  };
  const okSummary = prLib.summarize(okResult);
  check('summarize() reports PR metadata, CI check counts and the diff', /PR #42: Add widget/.test(okSummary) && /feat\/widget -> main/.test(okSummary) && /1 pass, 1 fail/.test(okSummary) && /✓ build \(pass\)/.test(okSummary) && /✗ lint \(fail\)/.test(okSummary) && okSummary.includes(okResult.diff), okSummary);
  check('summarize() marks a draft PR', /\(draft\)/.test(prLib.summarize({ ...okResult, pr: { ...okResult.pr, isDraft: true } })), 'draft marker missing');
  check('summarize() handles no reported checks', /CI checks: none reported\./.test(prLib.summarize({ ...okResult, checks: [] })), 'missing none-reported line');
  let pr = spawnSync(process.execPath, [path.join(HERE, 'pr.js'), '123'], { encoding: 'utf8', timeout: 15000, env: { ...process.env, MONKEY_BRAIN_GH_CMD: 'mb-no-such-gh-xyz' } });
  check('pr.js reports gh missing rather than crashing', pr.status === 0 && /gh CLI not found/.test(pr.stdout), pr.stdout + pr.stderr);
  pr = spawnSync(process.execPath, [path.join(HERE, 'pr.js'), '123', '--json'], { encoding: 'utf8', timeout: 15000, env: { ...process.env, MONKEY_BRAIN_GH_CMD: 'mb-no-such-gh-xyz' } });
  let prJson = {}; try { prJson = JSON.parse(pr.stdout); } catch {}
  check('pr.js --json returns { ok:false, error } instead of throwing', prJson.ok === false && /gh CLI not found/.test(prJson.error || ''), pr.stdout);

  // ---------- v3 P13: blast-radius routing (graph.js) ----------
  console.log('graph.js (v3 P13 — blast-radius routing)');
  const GRAPHJS = path.join(HERE, 'graph.js');
  const gr = (...args) => spawnSync(process.execPath, [GRAPHJS, ...args], { cwd: PROJ, encoding: 'utf8', timeout: 30000 });
  const codeFiles = {
    'src/a.js': "const b = require('./b');\n",
    'src/b.js': "import c from './c.js';\nexport default c;\n",
    'src/c.js': 'export default 1;\n',
    'lib/d.ts': "import c from '../src/c';\n",
    'pkg/__init__.py': '',
    'pkg/m.py': 'from . import n\n',
    'pkg/n.py': 'X = 1\n',
    'go.mod': 'module example.com/app\n',
    'svc/s.go': 'package svc\n\nimport (\n\t"fmt"\n\t"example.com/app/util"\n)\n',
    'util/u.go': 'package util\n',
    'cs/A.cs': 'namespace App.Core { class A {} }\n',
    'cs/B.cs': 'using App.Core;\nnamespace App.Web { class B {} }\n',
    'scripts/run.js': "const h = require(path.join(__dirname, '..', 'shared', 'h.js'));\n",
    'shared/h.js': 'module.exports = 1;\n',
    'node_modules/x/index.js': "require('../../src/a');\n",
  };
  for (const [rel, body] of Object.entries(codeFiles)) write(rel, body);
  const radiusOf = (...anchors) => { const r = gr('radius', ...anchors, '--json'); try { return JSON.parse(r.stdout); } catch { return { err: r.stderr || r.stdout }; } };
  let gj = radiusOf('src/c.js');
  check('JS/TS: dependents within 2 hops (require, import, ../ paths)', JSON.stringify(gj.dependents) === JSON.stringify(['lib/d.ts', 'src/b.js', 'src/a.js']), JSON.stringify(gj.dependents || gj.err));
  check('score = files × modules × types → tier', gj.score === 16 && gj.tier === 'feature', `score=${gj.score} tier=${gj.tier}`);
  check('node_modules is never scanned', !JSON.stringify(gj).includes('node_modules'), 'node_modules leaked into the graph');
  gj = radiusOf('pkg/n.py');
  check('Python: "from . import n" resolves', (gj.dependents || []).includes('pkg/m.py'), JSON.stringify(gj.dependents || gj.err));
  gj = radiusOf('util');
  check('Go: module-path imports resolve via go.mod (directory anchor)', (gj.anchors || []).includes('util/u.go') && (gj.dependents || []).includes('svc/s.go'), JSON.stringify(gj.anchors || gj.err));
  gj = radiusOf('cs/A.cs');
  check('C#: using → namespace resolves', (gj.dependents || []).includes('cs/B.cs'), JSON.stringify(gj.dependents || gj.err));
  gj = radiusOf('shared/h.js');
  check('CommonJS: require(path.join(__dirname, …)) resolves', (gj.dependents || []).includes('scripts/run.js'), JSON.stringify(gj.dependents || gj.err));
  gj = radiusOf('src/a.js');
  check('a leaf nobody imports is quick tier', gj.tier === 'quick' && gj.dependents.length === 0, `tier=${gj.tier}`);
  let gb = gr('radius', 'src/c.js');
  check('radius prints the tier and model line', /suggested tier: feature · model: sonnet to build/.test(gb.stdout), gb.stdout);
  gb = gr('build');
  const reusedN = Number((/(\d+) reused from cache/.exec(gb.stdout) || [])[1] || 0);
  check('the graph is cached in sessions/graph.json and reused', fs.existsSync(path.join(BRAIN, 'sessions', 'graph.json')) && reusedN >= 10, gb.stdout);
  const PERF = path.join(ROOT, 'perf');
  for (let i = 0; i < 1000; i++) {
    const d = path.join(PERF, `m${i % 20}`);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, `f${i}.js`), i ? `import x from '../m${(i - 1) % 20}/f${i - 1}.js';\n` : 'export default 0;\n');
  }
  const tPerf = Date.now();
  gb = spawnSync(process.execPath, [GRAPHJS, 'build', '--root', PERF], { encoding: 'utf8', timeout: 30000 });
  const perfMs = Date.now() - tPerf;
  check('scanning 1,000 files takes under 2 s', gb.status === 0 && /1000 files · 999 internal imports/.test(gb.stdout) && perfMs < 2000, `${perfMs} ms · ${(gb.stdout || gb.stderr).trim()}`);
  check('/brain:plan sizes specs with graph.js', /graph\.js" radius/.test(fs.readFileSync(path.join(SKILLS, 'plan', 'SKILL.md'), 'utf8')));
  for (const d of ['src', 'lib', 'pkg', 'svc', 'util', 'cs', 'scripts', 'shared', 'node_modules']) fs.rmSync(path.join(PROJ, d), { recursive: true, force: true });
  fs.rmSync(path.join(PROJ, 'go.mod'), { force: true });
  fs.rmSync(path.join(BRAIN, 'sessions', 'graph.json'), { force: true });
  fs.rmSync(PERF, { recursive: true, force: true });

  // ---------- v3 P12: loops that stop (loop.js · verifier family · plan-gate escalation) ----------
  console.log('loop.js + verifier family + plan-gate escalation (v3 P12 — loops that stop)');
  const LOOPJS = path.join(HERE, 'loop.js');
  const lp = (...args) => spawnSync(process.execPath, [LOOPJS, ...args], { cwd: PROJ, encoding: 'utf8', timeout: 15000 });
  const statusCtx = (source) => { const s = run('brain-status.js', evt({ hook_event_name: 'SessionStart', source })); try { return JSON.parse(s.stdout).hookSpecificOutput.additionalContext || ''; } catch { return ''; } };
  const specText = (acs) => `---\ntitle: "Loopy"\ntype: spec\nstatus: active\ntier: quick\n---\n\n## Acceptance criteria\n${acs}\n\n## Notes & links\nnone\n`;
  const specPath = path.join(BRAIN, 'specs', 'loopy.md');
  write('.brain/specs/loopy.md', specText('- **AC-1** — a\n- **AC-2** — b'));
  lr = lp('start', 'spec', 'loopy', '--generator', 'sonnet');
  check('loop starts and states its stop condition', lr.status === 0 && /every AC in specs\/loopy\.md/.test(lr.stdout), lr.stdout + lr.stderr);
  lr = lp('tick', 'spec-loopy', '--summary', 'wrote the AC-1 test');
  check('a tick without progress continues', lr.status === 0 && /continue — tick 1\/12 · ACs 0\/2 · no progress/.test(lr.stdout), lr.stdout + lr.stderr);
  lr = lp('start', 'spec', 'loopy');
  check('a running loop cannot be started twice', lr.status === 1 && /already running/.test(lr.stderr), lr.stderr);
  check('running loops show in session-start status (survive /clear)', /Loops running:.*spec-loopy/.test(statusCtx('clear')), statusCtx('clear').slice(0, 300));
  const dispatch = (model, description) => run('agent-track.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose', model, description } }));
  let va = dispatch('sonnet', 'verify the loopy ACs');
  check('a same-family verifier is blocked while a loop runs', va.status === 2 && /same model family/.test(va.stderr), `status=${va.status} ${va.stderr}`);
  va = dispatch('opus', 'verify the loopy ACs');
  check('a verifier on another model family passes', va.status === 0, `status=${va.status} ${va.stderr}`);
  va = dispatch('sonnet', 'implement the checkout flow');
  check('non-verification work on the generator family passes', va.status === 0, `status=${va.status} ${va.stderr}`);
  const markAc = (n) => fs.writeFileSync(specPath, fs.readFileSync(specPath, 'utf8').replace(new RegExp(`(\\*\\*AC-${n}\\*\\* — \\w)`), '$1 ✅ test'), 'utf8');
  markAc(1);
  lr = lp('tick', 'spec-loopy', '--summary', 'AC-1 green');
  check('progress is read from the spec\'s ✅ marks', /continue — tick 2\/12 · ACs 1\/2\s*$/.test(lr.stdout), lr.stdout);
  markAc(2);
  lr = lp('tick', 'spec-loopy', '--summary', 'AC-2 green');
  check('the loop stops itself when every AC is ✅', /✅ done at tick 3 — ACs 2\/2/.test(lr.stdout), lr.stdout);
  check('each tick is logged in the spec\'s Loop log', (fs.readFileSync(specPath, 'utf8').match(/^- tick \d/gm) || []).length === 3, fs.readFileSync(specPath, 'utf8').slice(-300));
  write('.brain/specs/loopy2.md', specText('- **AC-1** — a'));
  lp('start', 'spec', 'loopy2', '--max-no-progress', '9');
  lp('tick', 'spec-loopy2', '--summary', 'same failing test');
  lp('tick', 'spec-loopy2', '--summary', 'same failing test');
  lr = lp('tick', 'spec-loopy2', '--summary', 'Same   failing test');
  check('three identical results halt the loop (livelock)', /halted at tick 3 — livelock/.test(lr.stdout), lr.stdout);
  write('.brain/specs/loopy3.md', specText('- **AC-1** — a'));
  lp('start', 'spec', 'loopy3');
  lp('tick', 'spec-loopy3', '--summary', 'try one');
  lp('tick', 'spec-loopy3', '--summary', 'try two');
  lr = lp('tick', 'spec-loopy3', '--summary', 'try three');
  check('three ticks without progress halt the loop (stall)', /halted at tick 3 — stalled/.test(lr.stdout), lr.stdout);
  write('.brain/specs/loopy4.md', specText('- **AC-1** — a'));
  lp('start', 'spec', 'loopy4', '--max-ticks', '2', '--max-no-progress', '9');
  lp('tick', 'spec-loopy4', '--summary', 'one');
  lr = lp('tick', 'spec-loopy4', '--summary', 'two');
  check('the tick cap halts the loop', /halted at tick 2 — tick cap \(2\)/.test(lr.stdout), lr.stdout);
  lp('start', 'research', 'caching');
  lr = lp('tick', 'research-caching', '--summary', 'read three sources');
  check('a research loop continues while there is no page', /continue — tick 1\/12 · no page yet/.test(lr.stdout), lr.stdout);
  write('.brain/wiki/research/caching.md', '---\ntitle: "Caching"\ntype: research\n---\n\n## Findings\nx\n\n## Recommendation\nUse the prompt cache.\n');
  lp('tick', 'research-caching', '--summary', 'drafted the page');
  lr = lp('tick', 'research-caching', '--summary', 're-read it, no changes');
  check('a research loop stops once the recommendation is stable', /✅ done at tick 3 — recommendation drafted/.test(lr.stdout), lr.stdout);
  write('.brain/projects/look.md', '---\ntitle: "Look"\ntype: project\nstatus: paused\n---\n\n## Findings\n- P0: contrast fails on buttons (open)\n');
  lp('start', 'design', 'look');
  lr = lp('tick', 'design-look', '--summary', 'critiqued the buttons');
  check('a design loop continues while a P0 is open', /continue — tick 1\/12 · 1 open P0/.test(lr.stdout), lr.stdout);
  write('.brain/projects/look.md', '---\ntitle: "Look"\ntype: project\nstatus: paused\n---\n\n## Findings\n- P0: contrast fails on buttons (fixed)\n');
  lr = lp('tick', 'design-look', '--summary', 'raised contrast to 4.5:1');
  check('a design loop stops when no P0 is open', /✅ done at tick 2 — 0 open P0/.test(lr.stdout), lr.stdout);

  write('.brain/specs/arch-x.md', '---\ntitle: "Arch"\ntype: spec\nstatus: active\ntier: architecture\nplan_approved: false\n---\n\n## Acceptance criteria\n- **AC-1** — a\n');
  const srcWrite = () => run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'src', 'engine.js'), content: 'x' } }));
  let gw = srcWrite();
  check('plan gate: the first block does not escalate', gw.status === 2 && /arch-x\.md/.test(gw.stderr) && !/block #/.test(gw.stderr), gw.stderr);
  gw = srcWrite();
  const rrPath = path.join(BRAIN, 'sessions', 'review-required.md');
  check('plan gate: the second block escalates to review-required', gw.status === 2 && /block #2 on this spec/.test(gw.stderr) && fs.existsSync(rrPath) && /arch-x\.md/.test(fs.readFileSync(rrPath, 'utf8')), gw.stderr);
  check('review-required surfaces at the next session start', /Review required:.*arch-x\.md/.test(statusCtx('startup')), statusCtx('startup').slice(0, 400));
  for (const f of ['specs/loopy.md', 'specs/loopy2.md', 'specs/loopy3.md', 'specs/loopy4.md', 'specs/arch-x.md', 'wiki/research/caching.md', 'projects/look.md', 'sessions/gate-blocks.json', 'sessions/review-required.md']) fs.rmSync(path.join(BRAIN, f), { force: true });
  fs.rmSync(path.join(BRAIN, 'sessions', 'loops'), { recursive: true, force: true });

  // ---------- v3 P11: real receipts (usage.js · SubagentStop outcomes · doctor 16–18) ----------
  console.log('usage.js + agent outcomes + doctor 16–18 (v3 P11 — real receipts)');
  const USAGEJS = path.join(HERE, 'usage.js');
  const CCFG = path.join(ROOT, 'ccfg');
  const TDIR = path.join(CCFG, 'projects', path.resolve(PROJ).replace(/[^A-Za-z0-9]/g, '-'));
  const nowIso = new Date().toISOString();
  const oldIso = new Date(Date.now() - 30 * 86400000).toISOString();
  const aLine = (id, ts, model, u, extra) => JSON.stringify({ type: 'assistant', timestamp: ts, cwd: PROJ, gitBranch: 'main', isSidechain: false, ...extra, message: { id, model, usage: { input_tokens: u[0], cache_creation_input_tokens: u[1], cache_read_input_tokens: u[2], output_tokens: u[3] } } });
  fs.mkdirSync(path.join(TDIR, 's1', 'subagents'), { recursive: true });
  const m1 = aLine('m1', nowIso, 'claude-sonnet-5', [100, 1000, 9000, 50]);
  fs.writeFileSync(path.join(TDIR, 's1.jsonl'), [JSON.stringify({ type: 'user', timestamp: nowIso, message: { content: 'hi' } }), m1, m1, aLine('m2', nowIso, 'claude-haiku-4-5', [10, 0, 890, 5]), aLine('m0', oldIso, 'claude-sonnet-5', [999, 999, 999, 999])].join('\n') + '\n');
  const SUBT = path.join(TDIR, 's1', 'subagents', 'agent-x1.jsonl');
  fs.writeFileSync(SUBT, aLine('m3', nowIso, 'claude-haiku-4-5', [5, 0, 95, 20], { isSidechain: true }) + '\n');
  const ccEnv = { CLAUDE_CONFIG_DIR: CCFG, ANTHROPIC_BASE_URL: '' };
  let ur = spawnSync(process.execPath, [USAGEJS, '--project', PROJ, '--json'], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...ccEnv } });
  let uj = {}; try { uj = JSON.parse(ur.stdout); } catch {}
  const ut = uj.totals || {};
  check('usage totals real transcript tokens, deduped per API response', ur.status === 0 && uj.calls === 3 && ut.input === 115 && ut.cacheWrite === 1000 && ut.cacheRead === 9985 && ut.output === 75, JSON.stringify(ut));
  check('usage reports cache-hit ratio, subagent share, sessions', Math.abs((uj.hitRatio || 0) - 9985 / 11100) < 1e-9 && uj.subagentShare > 0 && uj.sessions === 1, `hit=${uj.hitRatio} sub=${uj.subagentShare} sessions=${uj.sessions}`);
  check('usage breaks tokens down by model and branch', !!(uj.byModel && uj.byModel['claude-haiku-4-5'] && uj.byBranch && uj.byBranch.main), JSON.stringify(uj.byModel));
  ur = spawnSync(process.execPath, [USAGEJS, '--project', PROJ], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...ccEnv } });
  check('usage prints a readable report', ur.status === 0 && /cache-hit 90%/.test(ur.stdout) && /total/.test(ur.stdout), (ur.stdout || '').slice(0, 200));
  if (process.platform === 'win32') {
    const lowerDir = path.join(CCFG, 'projects', path.basename(TDIR).toLowerCase());
    fs.renameSync(TDIR, lowerDir);
    ur = spawnSync(process.execPath, [USAGEJS, '--project', PROJ, '--json'], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...ccEnv } });
    uj = {}; try { uj = JSON.parse(ur.stdout); } catch {}
    fs.renameSync(lowerDir, TDIR);
    check('usage finds the transcript folder case-insensitively on Windows', uj.calls === 3, `calls=${uj.calls}`);
  }

  const AGLOG = path.join(BRAIN, 'sessions', 'agents.md');
  const agentStop = (extra) => run('agent-track.js', { cwd: PROJ, session_id: `st${process.pid}`, hook_event_name: 'SubagentStop', agent_id: 'x1', agent_type: 'Explore', ...extra });
  const lastAgentLine = () => { try { return fs.readFileSync(AGLOG, 'utf8').trim().split('\n').pop(); } catch { return ''; } };
  let ar = agentStop({ last_assistant_message: 'found 3 files', agent_transcript_path: SUBT });
  check('SubagentStop logs outcome, real tokens and model', ar.status === 0 && ar.stdout === '' && /↳ done · Explore · on claude-haiku-4-5 · 120 tokens · 1 turn/.test(lastAgentLine()), lastAgentLine());
  ar = agentStop({ last_assistant_message: '', transcript_path: path.join(TDIR, 's1.jsonl') });
  check('SubagentStop finds the transcript from the session path; empty result logged', ar.status === 0 && /↳ empty · Explore · on claude-haiku-4-5 · 120 tokens/.test(lastAgentLine()), lastAgentLine());

  const DOCTOR2 = path.join(SKILLS, 'doctor', 'scripts', 'doctor.js');
  const docFindings = (env) => {
    const d = spawnSync(process.execPath, [DOCTOR2, '--brain', BRAIN, '--json'], { encoding: 'utf8', timeout: 30000, env: { ...process.env, ...env } });
    let o = {}; try { o = JSON.parse(d.stdout); } catch {}
    return o.findings || [];
  };
  const finding = (list, name) => list.find((f) => f.check === name) || {};
  let dfs = docFindings(ccEnv);
  check('doctor 16: no proxy → cache-safety ok', finding(dfs, 'cache-safety').level === 'ok', JSON.stringify(finding(dfs, 'cache-safety')));
  check('doctor 17: cache-hit ratio from real transcripts', finding(dfs, 'cache-hit').level === 'ok' && /90%/.test(finding(dfs, 'cache-hit').detail || ''), JSON.stringify(finding(dfs, 'cache-hit')));
  check('doctor 18: dispatch outcomes from the ledger', finding(dfs, 'dispatch-outcomes').level === 'ok' && /1 done · 1 returned nothing/.test(finding(dfs, 'dispatch-outcomes').detail || ''), JSON.stringify(finding(dfs, 'dispatch-outcomes')));
  dfs = docFindings({ ...ccEnv, ANTHROPIC_BASE_URL: 'https://llm-proxy.example.com' });
  check('doctor 16: a non-Anthropic base URL warns', finding(dfs, 'cache-safety').level === 'warn', JSON.stringify(finding(dfs, 'cache-safety')));
  fs.appendFileSync(AGLOG, '- [x] ↳ empty · a\n- [x] ↳ empty · b\n- [x] ↳ empty · c\n', 'utf8');
  dfs = docFindings(ccEnv);
  check('doctor 18: frequent empty results warn', finding(dfs, 'dispatch-outcomes').level === 'warn', JSON.stringify(finding(dfs, 'dispatch-outcomes')));

  // ---------- v3 P10: built-in recall (search.js · recall hook) ----------
  console.log('search.js + recall.js (v3 P10 — always-on recall)');
  const SEARCHJS = path.join(HERE, 'search.js');
  const srch = (args, cwd) => spawnSync(process.execPath, [SEARCHJS, ...args], { cwd: cwd || PROJ, encoding: 'utf8', timeout: 15000 });
  let sr = srch(['escaped pipe table', '--json']);
  let sj = []; try { sj = JSON.parse(sr.stdout); } catch {}
  check('search ranks the matching page first, with a snippet', sr.status === 0 && sj[0] && sj[0].path === 'wiki/concepts/todo-page.md' && sj[0].snippet.length > 0, (sr.stdout || sr.stderr || '').slice(0, 200));
  sr = srch(['immutable source index log', '--json']);
  sj = []; try { sj = JSON.parse(sr.stdout); } catch {}
  check('search skips raw-sources and the index/log hubs', sr.status === 0 && !sj.some((h) => /^raw-sources\/|^wiki\/(index|log)\.md$/.test(h.path)), JSON.stringify(sj.map((h) => h.path)));
  sr = srch(['--brief', 'orphan page links']);
  check('brief cites pages as [[slug]]', sr.status === 0 && /\[\[orphan-page\]\]/.test(sr.stdout), (sr.stdout || '').slice(0, 200));
  write('.brain/wiki/concepts/big-page.md', '---\ntitle: "Big"\ntype: concept\n---\n\n' + Array.from({ length: 40 }, () => 'banana split recipe '.repeat(60)).join('\n\n') + '\n');
  sr = srch(['--brief', 'banana recipe']);
  check('brief stays within ~2k tokens on huge pages', sr.status === 0 && /\[\[big-page\]\]/.test(sr.stdout) && Math.ceil(sr.stdout.length / 4) <= 2000, `${Math.ceil((sr.stdout || '').length / 4)} tokens`);
  fs.rmSync(path.join(BRAIN, 'wiki', 'concepts', 'big-page.md'), { force: true });
  sr = srch(['anything'], os.tmpdir());
  check('search is a friendly no-op without a brain', sr.status === 0 && /No Monkey Brain/.test(sr.stdout), `status=${sr.status}`);

  const recalled = (prompt, sid, env, cwd) => {
    const rr = run('recall.js', { cwd: cwd || PROJ, hook_event_name: 'UserPromptSubmit', session_id: `st${process.pid}-${sid}`, prompt }, env);
    let o = {}; try { o = JSON.parse(rr.stdout || '{}'); } catch {}
    return { r: rr, ctx: (o.hookSpecificOutput || {}).additionalContext || '' };
  };
  let rc = recalled('how does the escaped pipe in a table cell work', 'a');
  check('first prompt gets brain recall (matching page, small)', rc.ctx.includes('Brain recall') && rc.ctx.includes('todo-page.md') && Math.ceil(rc.ctx.length / 4) <= 600, rc.ctx.slice(0, 200) || rc.r.stdout);
  rc = recalled('and the escaped pipe in a table cell again', 'a');
  check('recall fires on the first prompt only', rc.r.status === 0 && rc.r.stdout === '');
  rc = recalled('/brain:lint', 'b');
  check('recall ignores slash commands', rc.r.status === 0 && rc.r.stdout === '');
  rc = recalled('quantum chromodynamics lattice gauge', 'c');
  check('recall stays silent when nothing matches', rc.r.status === 0 && rc.r.stdout === '');
  rc = recalled('how does the escaped pipe in a table cell work', 'd', { MONKEY_BRAIN_RECALL: '0' });
  check('MONKEY_BRAIN_RECALL=0 turns recall off', rc.r.status === 0 && rc.r.stdout === '');
  rc = recalled('how does the escaped pipe in a table cell work', 'e', undefined, os.tmpdir());
  check('recall is silent without a brain', rc.r.status === 0 && rc.r.stdout === '');

  // ---------- no-brain /brain:init offer (activation fallback) ----------
  console.log('brain-status.js — no-brain offer');
  const PLAIN_E = path.join(ROOT, 'plain-e');
  fs.mkdirSync(PLAIN_E, { recursive: true });
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'startup' });
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  const ectx = (out.hookSpecificOutput || {}).additionalContext || '';
  check('startup without a brain offers /brain:init', ectx.includes('/brain:init'), (r.stdout || '').slice(0, 150));
  check('startup without a brain also injects terse rules', ectx.includes('Terse mode'), ectx.slice(0, 150));
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'resume' });
  check('offer only on startup source (terse still on)', r.status === 0 && !r.stdout.includes('/brain:init') && r.stdout.includes('Terse mode'));
  fs.writeFileSync(path.join(PLAIN_E, '.no-brain'), '');
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'startup' });
  check('.no-brain silences the offer (terse stays on)', r.status === 0 && !r.stdout.includes('/brain:init') && r.stdout.includes('Terse mode'));
  fs.writeFileSync(path.join(PLAIN_E, '.no-terse'), '');
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'startup' });
  check('.no-brain + .no-terse → fully silent', r.status === 0 && r.stdout === '');
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
  fs.rmSync(GLOBAL_CFG, { recursive: true, force: true });
  try {
    for (const f of fs.readdirSync(os.tmpdir())) {
      if (f.startsWith(`mb-recall-st${process.pid}`) || f.startsWith(`mb-wrap-st${process.pid}`) || f.startsWith(`mb-agent-st${process.pid}`) || f.startsWith(`mb-decide-st${process.pid}`)) {
        fs.rmSync(path.join(os.tmpdir(), f), { force: true });
      }
    }
  } catch {}
}

console.log(failures === 0 ? '\nselftest: ALL GREEN' : `\nselftest: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
