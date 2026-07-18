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

function write(rel, content) {
  const p = path.join(PROJ, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function run(script, evt) {
  return spawnSync(process.execPath, [path.join(HERE, script)], {
    input: JSON.stringify(evt),
    encoding: 'utf8',
    timeout: 20000,
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
  '---\ntitle: "Todo Page"\ntype: concept\nupdated: 2026-07-17\n---\n\nLinks [[index]] and a TODO marker: [[missing-target]]. Code is ignored: `[[not-a-link]]`.\n'
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

  r = run('brain-status.js', evt({ cwd: os.tmpdir(), hook_event_name: 'SessionStart' }));
  check('silent no-op without a brain', r.status === 0 && r.stdout === '', `status=${r.status} stdout=${JSON.stringify(r.stdout)}`);

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
  check('"lint the brain" routes to brain:lint', t.ctx.includes('brain:lint'), t.ctx);
  t = routed('what does the brain know about hooks?');
  check('"what does the brain know" routes to brain:query', t.ctx.includes('brain:query'), t.ctx);
  t = routed('refactor the parser and add tests');
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
  t = routed('compress the CLAUDE.md file');
  check('"compress CLAUDE.md" routes to brain:compress', t.ctx.includes('brain:compress'), t.ctx);

  // ---------- /brain:lint mechanical scan ----------
  console.log('lint.js (skill /brain:lint, mechanical layer)');
  const LINT = path.join(SKILLS, 'lint', 'scripts', 'lint.js');
  let lr = spawnSync(process.execPath, [LINT, '--brain', BRAIN], { encoding: 'utf8', timeout: 20000 });
  check('reports the orphan page', lr.stdout.includes('orphan-page'), lr.stdout.slice(0, 300));
  check('reports the broken TODO link', lr.stdout.includes('missing-target'));
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

  // ---------- qmd-mcp: semantic-search MCP wrapper, dormant until enabled (P5.3) ----------
  console.log('qmd-mcp.js (semantic search MCP — dormant stub until enabled)');
  const QMDMCP = path.join(HERE, 'qmd-mcp.js');
  const rpcLines =
    [
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {} } }),
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    ].join('\n') + '\n';
  const parseRpc = (stdout) => (stdout || '').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const runMcp = () => spawnSync(process.execPath, [QMDMCP], { input: rpcLines, cwd: PROJ, encoding: 'utf8', timeout: 15000, env: { ...process.env, MONKEY_BRAIN_QMD: '' } });
  // Reliable shell-free PATH scan (mirrors the wrapper), so the guard below is deterministic.
  const qmdOnPath = () => {
    const win = process.platform === 'win32';
    const names = win ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').map((e) => 'qmd' + e.trim().toLowerCase()) : ['qmd'];
    return (process.env.PATH || '').split(path.delimiter).filter(Boolean).some((d) => names.some((n) => { try { return fs.statSync(path.join(d, n)).isFile(); } catch { return false; } }));
  };
  let q = runMcp();
  let qm = parseRpc(q.stdout);
  const initResp = qm.find((m) => m.id === 1);
  const listResp = qm.find((m) => m.id === 2);
  check('qmd-mcp is a valid MCP server (initialize → serverInfo brain-search)', !!(initResp && initResp.result && initResp.result.serverInfo && initResp.result.serverInfo.name === 'brain-search'), (q.stdout || '').slice(0, 200));
  check('qmd-mcp exposes zero tools when not enabled (dormant)', !!(listResp && listResp.result && Array.isArray(listResp.result.tools) && listResp.result.tools.length === 0), (q.stdout || '').slice(0, 200));
  check('qmd-mcp never replies to notifications', qm.every((m) => m.id === 1 || m.id === 2));
  check('qmd-mcp exits cleanly on stdin close', q.status === 0, `status=${q.status} stderr=${(q.stderr || '').slice(0, 150)}`);
  if (!qmdOnPath()) {
    fs.writeFileSync(path.join(BRAIN, '.qmd'), '');
    q = runMcp();
    qm = parseRpc(q.stdout);
    check('opted-in but qmd absent falls back to the dormant stub (never crashes)', q.status === 0 && qm.some((m) => m.id === 1 && m.result), `status=${q.status}`);
    fs.rmSync(path.join(BRAIN, '.qmd'), { force: true });
  } else {
    check('qmd installed — real handoff path (stub-fallback test skipped)', true);
  }

  // ---------- skill routing frontmatter (P5.5) ----------
  console.log('skill routing frontmatter (P5.5 model/effort policy)');
  const MODELS = new Set(['haiku', 'sonnet', 'opus']);
  const EFFORTS = new Set(['low', 'medium', 'high']);
  const routing = {
    build: { model: 'sonnet', effort: 'medium' },
    ingest: { model: 'sonnet', effort: 'medium' },
    research: { model: 'sonnet', effort: 'medium' },
    init: { model: 'sonnet', effort: 'low' },
    terse: { model: 'haiku', effort: 'low' },
    plan: { effort: 'high' },
    review: { effort: 'high' },
    wrap: { effort: 'high' },
    query: { effort: 'high' },
    lint: { effort: 'high' },
    compress: { effort: 'high' },
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
  check('all 11 skills declare the expected model/effort routing', routingOk === Object.keys(routing).length, routingBad.join(' '));
  const judgmentPinned = ['plan', 'review', 'wrap', 'query', 'lint', 'compress'].filter((n) => fmGet(fs.readFileSync(path.join(SKILLS, n, 'SKILL.md'), 'utf8'), 'model') !== undefined);
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

  // ---------- no-brain /brain:init offer (activation fallback) ----------
  console.log('brain-status.js — no-brain offer');
  const PLAIN_E = path.join(ROOT, 'plain-e');
  fs.mkdirSync(PLAIN_E, { recursive: true });
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'startup' });
  out = {}; try { out = JSON.parse(r.stdout || '{}'); } catch {}
  check('startup without a brain offers /brain:init', ((out.hookSpecificOutput || {}).additionalContext || '').includes('/brain:init'), (r.stdout || '').slice(0, 150));
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'resume' });
  check('offer only on startup source', r.status === 0 && r.stdout === '');
  fs.writeFileSync(path.join(PLAIN_E, '.no-brain'), '');
  r = run('brain-status.js', { cwd: PLAIN_E, hook_event_name: 'SessionStart', source: 'startup' });
  check('.no-brain silences the offer', r.status === 0 && r.stdout === '');
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
  try {
    for (const f of fs.readdirSync(os.tmpdir())) {
      if (f.startsWith(`mb-wrap-st${process.pid}`) || f.startsWith(`mb-agent-st${process.pid}`) || f.startsWith(`mb-decide-st${process.pid}`)) {
        fs.rmSync(path.join(os.tmpdir(), f), { force: true });
      }
    }
  } catch {}
}

console.log(failures === 0 ? '\nselftest: ALL GREEN' : `\nselftest: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
