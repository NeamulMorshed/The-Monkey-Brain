#!/usr/bin/env node
/**
 * home.js — Monkey Brain Home: every project on this machine, one page.
 *
 * Where /brain:dashboard summarizes one .brain/, this summarizes every
 * .brain/ the registry (registry.js) knows about: health, open specs,
 * running loops, and token usage per project and combined over the window.
 * No external resources (opens offline); every piece of project text is
 * HTML-escaped. Writes <config dir>/monkey-brain/home.html.
 *
 *   node home.js [--open] [--days N]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));
const registry = require(path.join(__dirname, 'registry.js'));
const usage = require(path.join(__dirname, 'usage.js'));
const loops = require(path.join(__dirname, 'loop.js'));

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function openSpecCount(brain) {
  return lib.listFilesRecursive(path.join(brain, 'specs'), '.md')
    .filter((f) => !/(^|[\\/])templates([\\/])/.test(f))
    .map((f) => lib.parseFrontmatter(lib.readTextSafe(f)))
    .filter((fm) => !['done', 'closed', 'superseded'].includes(String(fm.status))).length;
}

function statusOf(health, reviewRequired) {
  if (reviewRequired) return 'attention';
  if (!health) return 'unknown';
  if (Number(health.crit)) return 'critical';
  if (Number(health.warn)) return 'warning';
  return 'healthy';
}

function summarize(entry, days) {
  const brain = path.join(entry.root, '.brain');
  const health = lib.readJsonSafe(path.join(brain, 'sessions', 'health.json'), null);
  const reviewRequired = fs.existsSync(path.join(brain, 'sessions', 'review-required.md'));
  const u = usage.summarize(entry.root, { days });
  return {
    name: entry.name,
    root: entry.root,
    lastSeen: entry.lastSeen,
    status: statusOf(health, reviewRequired),
    health,
    reviewRequired,
    openSpecs: openSpecCount(brain),
    loops: loops.activeLoops(brain).length,
    tokens: u.totals.all,
    calls: u.calls,
    hitRatio: u.hitRatio,
  };
}

function collect(days) {
  const entries = registry.list();
  const projects = entries.map((e) => summarize(e, days));
  const totalTokens = projects.reduce((s, p) => s + p.tokens, 0);
  const totalCalls = projects.reduce((s, p) => s + p.calls, 0);
  const weightedReads = projects.reduce((s, p) => s + (p.calls ? p.hitRatio * p.calls : 0), 0);
  return {
    at: new Date(),
    days,
    projects,
    totalTokens,
    totalCalls,
    hitRatio: totalCalls ? weightedReads / totalCalls : null,
    attention: projects.filter((p) => p.status === 'critical' || p.status === 'attention'),
  };
}

const STATUS_LABEL = { critical: 'Critical', warning: 'Warning', attention: 'Needs review', healthy: 'Healthy', unknown: 'Not checked yet' };
const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '—' : d.toISOString().slice(0, 16).replace('T', ' '); };
const fmtNum = (n) => Math.round(n).toLocaleString('en-US');

function render(d) {
  const tile = (value, label) => `<div class="tile"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  const rows = d.projects.map((p) => `
    <tr>
      <td><b>${esc(p.name)}</b><br><code class="path">${esc(p.root)}</code></td>
      <td><span class="pill ${p.status}">${esc(STATUS_LABEL[p.status])}</span></td>
      <td class="num">${p.openSpecs}</td>
      <td class="num">${p.loops}</td>
      <td class="num">${p.calls ? fmtNum(p.tokens) : '—'}</td>
      <td class="num">${p.calls ? `${Math.round((p.hitRatio || 0) * 100)}%` : '—'}</td>
      <td>${esc(fmtDate(p.lastSeen))}</td>
    </tr>`).join('');
  const attention = d.attention.length
    ? `<ul>${d.attention.map((p) => `<li><b>${esc(p.name)}</b> — ${esc(STATUS_LABEL[p.status])}${p.reviewRequired ? ' · a spec needs the curator’s review' : ''}</li>`).join('')}</ul>`
    : '<p class="muted">Nothing needs attention right now.</p>';
  const empty = !d.projects.length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monkey Brain Home</title>
<style>
  :root { --bg:#f5f7f6; --card:#ffffff; --ink:#18221f; --muted:#5b6964; --rule:#d7dfdb; --accent:#1d6b58; --warn:#8a5a00; --crit:#b42318; --info:#3f68b0; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1513; --card:#161e1b; --ink:#e1e9e5; --muted:#98a7a1; --rule:#27332f; --accent:#62c5a8; --warn:#e3b341; --crit:#f97066; --info:#8fb2f2; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 20px 56px; background: var(--bg); color: var(--ink); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
  h1 { margin: 0; font-size: 1.75rem; letter-spacing: -0.01em; }
  header p, .muted { margin: 4px 0 0; color: var(--muted); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .tile { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 12px 14px; }
  .tile b { display: block; font-size: 1.45rem; font-variant-numeric: tabular-nums; }
  .tile span { color: var(--muted); font-size: 0.85rem; }
  section { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 16px 18px; }
  h2 { margin: 0 0 10px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 640px; font-size: 0.92rem; }
  th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--rule); }
  tr:last-child td { border-bottom: 0; }
  th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  code.path { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: 0.82em; color: var(--muted); overflow-wrap: anywhere; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
  .pill.healthy { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
  .pill.warning { background: color-mix(in srgb, var(--warn) 20%, transparent); color: var(--warn); }
  .pill.critical, .pill.attention { background: color-mix(in srgb, var(--crit) 18%, transparent); color: var(--crit); }
  .pill.unknown { background: color-mix(in srgb, var(--info) 16%, transparent); color: var(--info); }
  ul { margin: 0; padding-left: 18px; } li { margin: 5px 0; }
  .empty { text-align: center; padding: 48px 16px; color: var(--muted); }
</style>
</head>
<body>
<main>
  <header>
    <h1>🐵 Monkey Brain Home</h1>
    <p>${d.projects.length} project(s) registered · tokens over the last ${d.days} day(s) · generated ${esc(d.at.toISOString().slice(0, 16).replace('T', ' '))} UTC</p>
  </header>
  <div class="tiles">
    ${tile(d.projects.length, 'projects')}
    ${tile(d.totalCalls ? fmtNum(d.totalTokens) : '—', `tokens, ${d.days}d`)}
    ${tile(d.totalCalls ? `${Math.round((d.hitRatio || 0) * 100)}%` : '—', 'cache-hit, blended')}
    ${tile(d.attention.length, 'need attention')}
  </div>
  <section>
    <h2>Needs attention</h2>
    ${attention}
  </section>
  <section>
    <h2>Projects</h2>
    ${empty
      ? `<div class="empty">No projects registered yet. Run <code>/brain:init</code> in a project, or just open one that already has a <code>.brain/</code> — it registers itself.</div>`
      : `<div class="table-scroll"><table>
          <thead><tr><th>Project</th><th>Status</th><th class="num">Open specs</th><th class="num">Loops</th><th class="num">Tokens</th><th class="num">Cache-hit</th><th>Last active</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`}
  </section>
  <p class="muted">Open a project and run <code>/brain:dashboard</code> for its full detail — specs, decisions, recent log.</p>
</main>
</body>
</html>
`;
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--days');
  const days = i >= 0 ? Number(argv[i + 1]) || 7 : 7;
  const d = collect(days);
  const file = path.join(path.dirname(registry.registryFile()), 'home.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, render(d), 'utf8');
  console.log(
    `🐵 Monkey Brain Home written to ${file} — ${d.projects.length} project(s) · ` +
      `${d.attention.length} need attention` +
      (d.totalCalls ? ` · ${fmtNum(d.totalTokens)} tokens over ${days}d` : '')
  );
  if (argv.includes('--open')) {
    const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', file]] : process.platform === 'darwin' ? ['open', [file]] : ['xdg-open', [file]];
    try { spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref(); } catch {}
  }
}

if (require.main === module) main();

module.exports = { collect, render, summarize, statusOf };
