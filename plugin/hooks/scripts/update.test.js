#!/usr/bin/env node
/**
 * update.test.js — AC-1..6 of specs/brain-update.md. Run: node update.test.js
 * Real git and real temp dirs; only `claude` and the new-brain.js refresh are faked.
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const update = require('./update.js');

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'));
const w = (p, t) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t, 'utf8'); };
const git = (cwd, ...a) => spawnSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
const manual = (v) => `---\ntitle: "m"\nengine_version: ${v}\n---\n# m\n`;

function world(name, { installed, latest, schema }) {
  const dir = path.join(ROOT, name);
  const cfg = path.join(dir, 'cfg');
  const mp = path.join(cfg, 'plugins', 'marketplaces', 'monkey-brain');
  w(path.join(mp, '.claude-plugin', 'marketplace.json'), JSON.stringify({ plugins: [{ name: 'brain', version: latest }] }));
  w(path.join(mp, 'plugin', 'skills', 'init', 'brain-template', 'CLAUDE.md'), manual(schema.latest));
  const reg = {};
  const addBrain = (id, { gitInit, commit, dirty, schemaV }) => {
    const root = path.join(dir, id);
    w(path.join(root, '.brain', 'CLAUDE.md'), manual(schemaV || schema.brains));
    w(path.join(root, '.brain', 'wiki', 'log.md'), '# log\n');
    if (gitInit) { git(root, 'init', '-q'); if (commit) { git(root, 'add', '-A'); git(root, 'commit', '-qm', 'x'); } }
    if (dirty) w(path.join(root, '.brain', 'wiki', 'new.md'), 'dirty\n');
    reg[id] = { root, name: id };
    return root;
  };
  return { dir, cfg, addBrain, save: () => w(path.join(cfg, 'monkey-brain', 'projects.json'), JSON.stringify(reg)), installed };
}

/** A runner: fake `claude`, fake new-brain.js under the fake install dirs, real git. */
function runner(wd, { missing, offline, failUpdate, failBrain } = {}) {
  const calls = [];
  let version = wd.installed;
  const run = (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (cmd === 'claude') {
      if (missing) return { status: null, stdout: '', stderr: '', error: Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' }) };
      if (args[0] === '--version') return { status: 0, stdout: '1', stderr: '' };
      if (args[1] === 'marketplace') return offline ? { status: 1, stdout: '', stderr: 'offline' } : { status: 0, stdout: 'ok', stderr: '' };
      if (args[1] === 'update') { if (failUpdate) return { status: 1, stdout: '', stderr: 'boom' }; version = 'NEW'; return { status: 0, stdout: 'ok', stderr: '' }; }
      if (args[1] === 'list') return { status: 0, stdout: JSON.stringify([{ id: 'brain@monkey-brain', version: version === 'NEW' ? '0.36.0' : wd.installed, installPath: path.join(wd.dir, version === 'NEW' ? 'new' : 'old') }]), stderr: '' };
    }
    if (cmd === process.execPath && args[0].includes(path.join(wd.dir, path.sep))) {
      if (failBrain && args.includes(failBrain)) return { status: 1, stdout: '', stderr: 'refresh broke' };
      return { status: 0, stdout: 'refreshed', stderr: '' };
    }
    const r = spawnSync(cmd, args, { encoding: 'utf8' });
    return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error || null };
  };
  return { run, calls };
}

const exec = (wd, argv, opts) => {
  const r = runner(wd, opts);
  const lines = [];
  const code = update.main({ argv, run: r.run, configDir: wd.cfg, today: '2026-11-24', out: (s) => lines.push(s) });
  return { code, text: lines.join('\n'), calls: r.calls };
};

try {
  // AC-1 + AC-2 + AC-4 + AC-6: behind, four kinds of brain
  const A = world('a', { installed: '0.35.1', latest: '0.36.0', schema: { latest: '2.2', brains: '2.1' } });
  const clean = A.addBrain('clean', { gitInit: true, commit: true });
  const dirty = A.addBrain('dirty', { gitInit: true, commit: true, dirty: true });
  const nogit = A.addBrain('nogit', {});
  A.save();
  // a registered root that no longer exists
  const regFile = path.join(A.cfg, 'monkey-brain', 'projects.json');
  const reg = JSON.parse(fs.readFileSync(regFile, 'utf8'));
  reg.gone = { root: path.join(A.dir, 'gone'), name: 'gone' };
  fs.writeFileSync(regFile, JSON.stringify(reg));

  let r = exec(A, ['--check']);
  assert.strictEqual(r.code, 0);
  assert.ok(/plugin 0\.35\.1 → 0\.36\.0/.test(r.text), 'plan names the plugin move: ' + r.text);
  assert.ok(/clean/.test(r.text) && /nogit/.test(r.text), 'clean + non-git brains are refreshed');
  assert.ok(/dirty[^\n]*uncommitted \.brain\/ changes/.test(r.text), 'dirty brain skipped with reason');
  assert.ok(/gone[^\n]*missing/.test(r.text), 'missing root skipped');
  assert.ok(!r.calls.some((c) => /plugin update/.test(c) || /new-brain/.test(c)), '--check changes nothing');
  assert.ok(r.calls.some((c) => /marketplace update monkey-brain/.test(c)), 'marketplace refreshed');
  assert.strictEqual(fs.readFileSync(path.join(clean, '.brain', 'wiki', 'log.md'), 'utf8'), '# log\n');

  r = exec(A, ['--apply']);
  assert.strictEqual(r.code, 0, r.text);
  const upd = r.calls.findIndex((c) => /plugin update brain@monkey-brain/.test(c));
  const nb = r.calls.filter((c) => c.includes(path.join(A.dir, 'new', 'skills', 'init', 'scripts', 'new-brain.js')) && /--update --project/.test(c));
  assert.ok(upd >= 0, 'plugin updated');
  assert.strictEqual(nb.length, 2, 'two brains refreshed with the NEW version\'s new-brain.js: ' + r.calls.join('\n'));
  assert.ok(r.calls.indexOf(nb[0]) > upd, 'refresh runs after the plugin update');
  assert.ok(!r.calls.some((c) => c.includes(dirty + ' ') && /new-brain/.test(c)) && !nb.some((c) => c.endsWith(dirty)), 'dirty brain not refreshed');
  assert.ok(/## \[2026-11-24\] schema \| \/brain:update → engine 2\.2/.test(fs.readFileSync(path.join(clean, '.brain', 'wiki', 'log.md'), 'utf8')), 'log entry written');
  assert.ok(/## \[2026-11-24\] schema/.test(fs.readFileSync(path.join(nogit, '.brain', 'wiki', 'log.md'), 'utf8')));
  assert.ok(!/schema \|/.test(fs.readFileSync(path.join(dirty, '.brain', 'wiki', 'log.md'), 'utf8')), 'skipped brain not logged');
  assert.ok(/restart Claude Code to load the new hooks and skills\s*$/.test(r.text), 'ends with the restart line');

  // AC-5: one brain failing does not stop the others
  const A2 = world('a2', { installed: '0.35.1', latest: '0.36.0', schema: { latest: '2.2', brains: '2.1' } });
  const f1 = A2.addBrain('one', {}); const f2 = A2.addBrain('two', {}); A2.save();
  r = exec(A2, ['--apply'], { failBrain: f1 });
  assert.notStrictEqual(r.code, 0);
  assert.ok(/one: FAILED/.test(r.text) && /two: refreshed/.test(r.text), r.text);
  assert.ok(/schema \|/.test(fs.readFileSync(path.join(f2, '.brain', 'wiki', 'log.md'), 'utf8')));
  assert.ok(!/schema \|/.test(fs.readFileSync(path.join(f1, '.brain', 'wiki', 'log.md'), 'utf8')), 'failed brain not logged');

  // AC-5: claude missing, offline, plugin update failing
  for (const [opts, re] of [[{ missing: true }, /not on PATH/], [{ offline: true }, /marketplace refresh failed/]]) {
    r = exec(A2, ['--apply'], opts);
    assert.notStrictEqual(r.code, 0);
    assert.ok(re.test(r.text), r.text);
    assert.ok(!r.calls.some((c) => /plugin update|new-brain/.test(c)), 'nothing run after an early failure');
  }
  r = exec(A2, ['--apply'], { failUpdate: true });
  assert.notStrictEqual(r.code, 0);
  assert.ok(/plugin update failed/.test(r.text) && !r.calls.some((c) => /new-brain/.test(c)), 'failed plugin update refreshes no brain');

  // AC-3: current plugin + equal schemas -> up to date, --apply runs no update/refresh
  const B = world('b', { installed: '0.36.0', latest: '0.36.0', schema: { latest: '2.1', brains: '2.1' } });
  B.addBrain('ok', { gitInit: true, commit: true }); B.save();
  r = exec(B, ['--apply']);
  assert.strictEqual(r.code, 0);
  assert.ok(/plugin 0\.36\.0 is current/.test(r.text) && /everything is up to date/.test(r.text), r.text);
  assert.ok(!r.calls.some((c) => /plugin update|new-brain/.test(c)), 'no command run');

  // plugin current but one brain behind on schema -> refreshed, no plugin update, no restart line
  const C = world('c', { installed: '0.36.0', latest: '0.36.0', schema: { latest: '2.2', brains: '2.1' } });
  C.addBrain('old', {}); C.save();
  r = exec(C, ['--apply']);
  assert.ok(!r.calls.some((c) => /plugin update/.test(c)) && r.calls.some((c) => /new-brain/.test(c)) && !/restart/.test(r.text), r.text);

  console.log('update.test.js: ok');
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}
