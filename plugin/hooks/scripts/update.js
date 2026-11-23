#!/usr/bin/env node
/**
 * update.js — the engine behind /brain:update.
 *
 * One command that brings the `brain` plugin AND every brain on this machine up to date:
 *   --check   refresh the marketplace, then print one plan (changes nothing but the marketplace clone)
 *   --apply   run the plan: plugin update (only when behind), then `new-brain.js --update` per brain
 *
 * Nothing partial: a failure before the plugin update (no `claude`, offline marketplace refresh,
 * unreadable plugin list) changes nothing; a failed plugin update refreshes no brain. One brain's
 * failure never stops the others. A brain with uncommitted `.brain/` work is skipped, never
 * refreshed on top of it. Knowledge is never touched (`new-brain.js --update` rewrites CLAUDE.md,
 * reference.md and templates/ only).
 *
 * Testable: `main({ argv, run, configDir, today, out })` takes an injected command runner.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_ID = 'brain@monkey-brain';
const MARKETPLACE = 'monkey-brain';
const WIN = process.platform === 'win32';
/** The files `new-brain.js --update` overwrites; uncommitted edits here would be lost. */
const OWNED = ['.brain/CLAUDE.md', '.brain/reference.md', '.brain/templates'];
const DIRTY = 'uncommitted changes to CLAUDE.md, reference.md or templates/';

/** Default runner: never throws; only `claude` (possibly a .cmd shim on Windows) uses a shell. */
function defaultRun(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 180000, shell: WIN && cmd === 'claude' });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error || null };
}

function defaultConfigDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function fm(file, key) {
  try {
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(file, 'utf8'));
    const line = m && new RegExp('^' + key + ':\\s*(.+?)\\s*$', 'm').exec(m[1]);
    return line ? line[1].replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
}

/** -1 / 0 / 1 for dotted numeric versions. */
function cmpVersion(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

class Abort extends Error {}

const ok = (r) => r && !r.error && r.status === 0;
const why = (r) => ((r.error && r.error.message) || r.stderr || r.stdout || '').trim().slice(0, 200);

function installedPlugin(run) {
  const r = run('claude', ['plugin', 'list', '--json']);
  if (r.error) throw new Abort('cannot read the installed plugin list: ' + (r.error.code === 'ENOENT' ? '`claude` is not on PATH' : r.error.message));
  if (!ok(r)) throw new Abort('`claude plugin list --json` failed: ' + why(r));
  let list;
  try { list = JSON.parse(r.stdout); } catch { throw new Abort('`claude plugin list --json` returned unreadable output'); }
  const p = (Array.isArray(list) ? list : []).find((x) => x && x.id === PLUGIN_ID);
  if (!p || !p.version || !p.installPath) throw new Abort(`${PLUGIN_ID} is not installed (or its install path is unknown)`);
  return p;
}

/** Gather the facts and compute the plan. Throws Abort for anything that must stop before changes. */
function plan({ run, configDir }) {
  const probe = run('claude', ['--version']);
  if (probe.error) throw new Abort(probe.error.code === 'ENOENT' ? '`claude` is not on PATH — cannot refresh the marketplace' : probe.error.message);
  const mr = run('claude', ['plugin', 'marketplace', 'update', MARKETPLACE]);
  if (!ok(mr)) throw new Abort('marketplace refresh failed (offline?): ' + why(mr));

  const installed = installedPlugin(run);
  const mpDir = path.join(configDir, 'plugins', 'marketplaces', MARKETPLACE);
  let latest = '';
  try {
    const mk = JSON.parse(fs.readFileSync(path.join(mpDir, '.claude-plugin', 'marketplace.json'), 'utf8'));
    latest = String(((mk.plugins || []).find((x) => x.name === 'brain') || {}).version || '');
  } catch {}
  if (!latest) throw new Abort('cannot read the latest brain version from the refreshed marketplace');

  const behind = cmpVersion(installed.version, latest) < 0;
  const engineOf = (tpl) => fm(path.join(tpl, 'CLAUDE.md'), 'engine_version');
  const latestSchema =
    engineOf(path.join(mpDir, 'plugin', 'skills', 'init', 'brain-template')) || engineOf(path.join(installed.installPath, 'skills', 'init', 'brain-template'));
  if (!latestSchema) throw new Abort('cannot read the latest engine schema version');

  // Read the registry file directly: registry.list() silently prunes roots that are gone, and the plan must name them.
  let reg = {};
  try { reg = JSON.parse(fs.readFileSync(path.join(configDir, 'monkey-brain', 'projects.json'), 'utf8')) || {}; } catch {}
  const refresh = [];
  const skipped = [];
  const missing = [];
  for (const [key, v] of Object.entries(reg)) {
    if (!v || !v.root) continue;
    const name = v.name || path.basename(v.root);
    if (!fs.existsSync(path.join(v.root, '.brain', 'CLAUDE.md'))) { missing.push(key); continue; }
    const g = run('git', ['-C', v.root, 'rev-parse', '--is-inside-work-tree']);
    if (ok(g) && g.stdout.trim() === 'true') {
      // Only what the refresh rewrites counts: hook-written sessions/ and wiki work are always dirty in an active brain.
      const st = run('git', ['-C', v.root, 'status', '--porcelain', '--', ...OWNED]);
      if (ok(st) && st.stdout.trim()) { skipped.push({ name, root: v.root, reason: DIRTY }); continue; }
    }
    const schema = fm(path.join(v.root, '.brain', 'CLAUDE.md'), 'engine_version') || '?';
    // A newer plugin may change templates without a schema bump, so every clean brain is refreshed when the plugin is behind.
    if (behind || schema !== latestSchema) refresh.push({ name, root: v.root, schema });
  }
  return { installed, latest, behind, latestSchema, refresh, skipped, missing };
}

/** Drop registry entries whose folder (or brain) is gone — what registry.list() does, under the injected config dir. */
function pruneMissing(configDir, keys) {
  if (!keys.length) return;
  const f = path.join(configDir, 'monkey-brain', 'projects.json');
  try {
    const reg = JSON.parse(fs.readFileSync(f, 'utf8')) || {};
    for (const k of keys) delete reg[k];
    fs.writeFileSync(f, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  } catch {}
}

function render(p) {
  const L = [p.behind ? `plugin ${p.installed.version} → ${p.latest}` : `plugin ${p.installed.version} is current`];
  if (p.refresh.length) {
    L.push(`brains to refresh (${p.refresh.length}):`);
    for (const b of p.refresh) L.push(`  - ${b.name} (${b.root}) schema ${b.schema} → ${p.latestSchema}`);
  }
  if (p.skipped.length) {
    L.push(`skipped (${p.skipped.length}):`);
    for (const b of p.skipped) L.push(`  - ${b.name} (${b.root}): ${b.reason}`);
  }
  if (p.missing.length) L.push(`${p.missing.length} registered folder(s) no longer exist — dropped from the registry on --apply`);
  if (!p.behind && !p.refresh.length) L.push('everything is up to date');
  return L;
}

function appendLog(root, latest, date) {
  const f = path.join(root, '.brain', 'wiki', 'log.md');
  if (!fs.existsSync(f)) return false;
  let t = fs.readFileSync(f, 'utf8');
  if (!t.endsWith('\n')) t += '\n';
  fs.writeFileSync(f, `${t}\n## [${date}] schema | /brain:update → engine ${latest}\nRefreshed CLAUDE.md, reference.md and templates/ (knowledge untouched).\n`, 'utf8');
  return true;
}

function main(opts) {
  const o = opts || {};
  const run = o.run || defaultRun;
  const out = o.out || ((s) => console.log(s));
  const configDir = o.configDir || defaultConfigDir();
  const date = o.today || new Date().toISOString().slice(0, 10);
  const argv = o.argv || process.argv.slice(2);
  const apply = argv.includes('--apply');
  if (!apply && !argv.includes('--check')) { out('usage: update.js --check | --apply'); return 2; }

  let p;
  try { p = plan({ run, configDir }); } catch (e) {
    if (!(e instanceof Abort)) throw e;
    out('update aborted, nothing changed: ' + e.message);
    return 1;
  }
  for (const l of render(p)) out(l);
  if (apply) pruneMissing(configDir, p.missing);
  if (!apply || (!p.behind && !p.refresh.length)) return 0;

  let installPath = p.installed.installPath;
  if (p.behind) {
    const u = run('claude', ['plugin', 'update', PLUGIN_ID]);
    if (!ok(u)) { out('plugin update failed, no brain refreshed: ' + why(u)); return 1; }
    try { installPath = installedPlugin(run).installPath; } catch (e) {
      out('plugin updated, but ' + e.message + ' — no brain refreshed; run /brain:init --update per project');
      return 1;
    }
    out(`plugin updated to ${p.latest}`);
  }

  const script = path.join(installPath, 'skills', 'init', 'scripts', 'new-brain.js');
  let failed = 0;
  out('results:');
  for (const b of p.refresh) {
    const r = run(process.execPath, [script, '--update', '--project', b.root]);
    if (!ok(r)) { failed++; out(`  - ${b.name}: FAILED — ${why(r).slice(0, 160)}`); continue; }
    let logged = false;
    try { logged = appendLog(b.root, p.latestSchema, date); } catch {}
    out(`  - ${b.name}: refreshed to schema ${p.latestSchema}${logged ? '' : ' (no wiki/log.md to log in)'}`);
  }
  for (const b of p.skipped) out(`  - ${b.name}: skipped — ${b.reason}`);
  if (p.behind) out('restart Claude Code to load the new hooks and skills');
  return failed ? 1 : 0;
}

if (require.main === module) {
  try { process.exit(main()); } catch (e) { console.error('update.js: ' + e.message); process.exit(1); }
}

module.exports = { main, plan, cmpVersion };
