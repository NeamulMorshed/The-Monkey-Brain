#!/usr/bin/env node
/**
 * selftest.js — end-to-end tests for the Phase 2 hooks.
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
  check('within budget', (ctx.length / 4) <= 3000, `${Math.ceil(ctx.length / 4)} tokens`);

  r = run('brain-status.js', evt({ cwd: os.tmpdir(), hook_event_name: 'SessionStart' }));
  check('silent no-op without a brain', r.status === 0 && r.stdout === '', `status=${r.status} stdout=${JSON.stringify(r.stdout)}`);

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

  write('.brain/specs/big-feature.md', '---\ntitle: "Big Feature"\ntier: architecture\nstatus: active\nplan_approved: true\n---\n\n- AC-1 …\n');
  r = run('guards.js', evt({ hook_event_name: 'PreToolUse', tool_name: 'Write', tool_input: { file_path: path.join(PROJ, 'src', 'main.js'), content: 'code' } }));
  check('plan gate opens once approved', r.status === 0, `status=${r.status} stderr=${r.stderr}`);

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
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}

console.log(failures === 0 ? '\nselftest: ALL GREEN' : `\nselftest: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
