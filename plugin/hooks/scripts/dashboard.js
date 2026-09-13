#!/usr/bin/env node
/**
 * dashboard.js — one self-contained HTML overview of a brain (v3 P14).
 *
 * Index stats, open specs with AC progress, running loops, workstreams, the
 * last doctor report, recent log and decisions, and 7-day token usage. No
 * external resources (it opens offline and is safe to attach); every piece of
 * brain text is HTML-escaped. Writes .brain/sessions/dashboard.html.
 *
 *   node dashboard.js [--open] [--brain DIR]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));
const loops = require(path.join(__dirname, 'loop.js'));
const usage = require(path.join(__dirname, 'usage.js'));

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mtime = (f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
const docs = (brain, dir) =>
  lib.listFilesRecursive(path.join(brain, dir), '.md')
    .filter((f) => !/(^|[\\/])templates([\\/])/.test(f))
    .map((f) => { const raw = lib.readTextSafe(f); return { f, name: path.basename(f, '.md'), raw, fm: lib.parseFrontmatter(raw) }; });

function collect(brain) {
  const root = path.dirname(brain);
  const idx = lib.parseFrontmatter(lib.readTextSafe(path.join(brain, 'wiki', 'index.md')));
  const specs = docs(brain, 'specs');
  const openSpecs = specs.filter((s) => !['done', 'closed', 'superseded'].includes(String(s.fm.status)));
  const projects = docs(brain, 'projects');
  const decisions = docs(brain, 'decisions').sort((a, b) => mtime(b.f) - mtime(a.f));
  const u = usage.summarize(root, { days: 7 });
  return {
    project: path.basename(root),
    at: new Date(),
    sources: idx.source_count ?? '—',
    pages: lib.listFilesRecursive(path.join(brain, 'wiki'), '.md').length,
    decisions,
    openSpecs,
    doneSpecs: specs.length - openSpecs.length,
    projects,
    instinctsActive: lib.listFilesRecursive(path.join(brain, 'instincts', 'active'), '.md').length,
    instinctsPending: lib.listFilesRecursive(path.join(brain, 'instincts', 'pending'), '.md').length,
    clippings: lib.listFilesRecursive(path.join(brain, 'Clippings'), '.md').length,
    log: (lib.readTextSafe(path.join(brain, 'wiki', 'log.md')).match(/^## \[.*$/gm) || []).slice(-12).reverse().map((h) => h.replace(/^## /, '')),
    health: lib.readJsonSafe(path.join(brain, 'sessions', 'health.json'), null),
    loops: loops.activeLoops(brain),
    usage: u,
  };
}

function render(d) {
  const tile = (value, label) => `<div class="tile"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  const list = (items, empty) => (items.length ? `<ul>${items.join('')}</ul>` : `<p class="muted">${esc(empty)}</p>`);
  const hr = d.usage.calls ? `${Math.round((d.usage.hitRatio || 0) * 100)}%` : '—';
  const tokens = d.usage.calls ? Math.round(d.usage.totals.all).toLocaleString('en-US') : '—';
  const healthLevel = !d.health ? 'muted' : Number(d.health.crit) ? 'crit' : Number(d.health.warn) ? 'warn' : 'ok';
  const healthText = !d.health
    ? 'No doctor report yet — run /brain:doctor.'
    : `${d.health.crit} critical · ${d.health.warn} warning(s) · ${d.health.ok} ok — as of ${String(d.health.at || '').slice(0, 10)}`;
  const findings = d.health && Array.isArray(d.health.findings)
    ? d.health.findings.filter((f) => f.level === 'crit' || f.level === 'warn').slice(0, 6)
      .map((f) => `<li class="${f.level}"><b>${esc(f.check)}</b> — ${esc(f.detail)}</li>`)
    : [];
  const specs = d.openSpecs.map((s) => {
    const p = loops.acProgress(s.raw);
    const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    return `<li><code>${esc(s.name)}</code> · ${esc(s.fm.tier || '?')} · ${esc(s.fm.phase || '?')}${p.total ? ` · ACs ${p.done}/${p.total}` : ''}` +
      (p.total ? `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>` : '') + '</li>';
  });
  const projects = d.projects.map((p) => `<li><b>${esc(p.fm.title || p.name)}</b> · ${esc(p.fm.status || 'active')} · phase ${esc(p.fm.phase || '?')}${p.fm.updated ? ` · updated ${esc(p.fm.updated)}` : ''}</li>`);
  const byModel = Object.entries(d.usage.byModel || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([m, v]) => `<li>${esc(m)} — ${Math.round((v / (d.usage.totals.all || 1)) * 100)}%</li>`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.project)} — Monkey Brain</title>
<style>
  :root { --bg:#f5f7f6; --card:#ffffff; --ink:#18221f; --muted:#5b6964; --rule:#d7dfdb; --accent:#1d6b58; --warn:#8a5a00; --crit:#b42318; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1513; --card:#161e1b; --ink:#e1e9e5; --muted:#98a7a1; --rule:#27332f; --accent:#62c5a8; --warn:#e3b341; --crit:#f97066; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 20px 56px; background: var(--bg); color: var(--ink); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
  h1 { margin: 0; font-size: 1.75rem; letter-spacing: -0.01em; }
  header p, .muted { margin: 4px 0 0; color: var(--muted); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
  .tile { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 12px 14px; }
  .tile b { display: block; font-size: 1.45rem; font-variant-numeric: tabular-nums; }
  .tile span { color: var(--muted); font-size: 0.85rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  section { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 16px 18px; min-width: 0; }
  h2 { margin: 0 0 10px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
  ul { margin: 0; padding-left: 18px; } li { margin: 5px 0; overflow-wrap: anywhere; }
  code { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: 0.9em; }
  .bar { height: 6px; background: var(--rule); border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .bar span { display: block; height: 100%; background: var(--accent); }
  .crit { color: var(--crit); } .warn { color: var(--warn); } .ok { color: var(--accent); }
</style>
</head>
<body>
<main>
  <header>
    <h1>${esc(d.project)}</h1>
    <p>Monkey Brain dashboard · generated ${esc(d.at.toISOString().slice(0, 16).replace('T', ' '))} UTC</p>
  </header>
  <div class="tiles">
    ${tile(d.sources, 'sources')}${tile(d.pages, 'wiki pages')}${tile(d.decisions.length, 'decisions')}
    ${tile(d.openSpecs.length, 'open specs')}${tile(d.projects.filter((p) => String(p.fm.status || 'active') === 'active').length, 'active workstreams')}
    ${tile(`${d.instinctsActive} / ${d.instinctsPending}`, 'instincts active / pending')}${tile(tokens, 'tokens, 7 days')}${tile(hr, 'cache-hit, 7 days')}
  </div>
  <div class="grid">
    <section><h2>Health</h2><p class="${healthLevel}">${esc(healthText)}</p>${findings.length ? `<ul>${findings.join('')}</ul>` : ''}</section>
    <section><h2>Open specs</h2>${list(specs, 'No open specs.')}</section>
    <section><h2>Loops running</h2>${list(d.loops.map((l) => `<li>${esc(loops.describe(l))}</li>`), 'No loops running.')}</section>
    <section><h2>Workstreams</h2>${list(projects, 'No workstreams yet.')}</section>
    <section><h2>Recent log</h2>${list(d.log.map((h) => `<li>${esc(h)}</li>`), 'The log is empty.')}</section>
    <section><h2>Latest decisions</h2>${list(d.decisions.slice(0, 6).map((x) => `<li>${esc(x.fm.title || x.name)}</li>`), 'No decisions recorded.')}</section>
    <section><h2>Tokens by model, 7 days</h2>${list(byModel, 'No transcripts found for this project.')}</section>
    <section><h2>Backlog</h2><ul><li>${esc(d.clippings)} clipping(s) waiting to be ingested</li><li>${esc(d.doneSpecs)} spec(s) closed</li></ul></section>
  </div>
</main>
</body>
</html>
`;
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--brain');
  const brain = i >= 0 ? path.resolve(argv[i + 1]) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here — run /brain:init first.');
    return;
  }
  const d = collect(brain);
  const file = path.join(brain, 'sessions', 'dashboard.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, render(d), 'utf8');
  console.log(
    `🗂 Dashboard written to ${file} — ${d.pages} wiki pages · ${d.openSpecs.length} open spec(s) · ` +
      `${d.loops.length} loop(s) running · health ${d.health ? `${d.health.crit} crit / ${d.health.warn} warn` : 'not checked yet'}`
  );
  if (argv.includes('--open')) {
    const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', file]] : process.platform === 'darwin' ? ['open', [file]] : ['xdg-open', [file]];
    try { spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch {}
  }
}

if (require.main === module) main();

module.exports = { collect, render };
