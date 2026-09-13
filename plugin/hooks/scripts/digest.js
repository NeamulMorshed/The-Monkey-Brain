#!/usr/bin/env node
/**
 * digest.js — standup and weekly review from the brain (v3 P14).
 *
 * Blocked first (open P0s, review-required specs, the last doctor report, idle
 * workstreams), then Done (log entries + git commits in the window), then In
 * flight (running loops, open specs with AC progress, active workstreams' next
 * step). The weekly review adds decisions made, specs closed, the instinct
 * queue and real token usage. Files the digest to sessions/ unless --no-file.
 *
 *   node digest.js [--week] [--no-file] [--brain DIR]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));
const loops = require(path.join(__dirname, 'loop.js'));
const usage = require(path.join(__dirname, 'usage.js'));

const DAY = 86400000;
const dayOf = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const mtime = (f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
const isOpen = (status) => !['done', 'closed', 'superseded', 'paused'].includes(String(status));

function docs(brain, dir) {
  return lib
    .listFilesRecursive(path.join(brain, dir), '.md')
    .filter((f) => !/(^|[\\/])templates([\\/])/.test(f))
    .map((f) => {
      const raw = lib.readTextSafe(f);
      return { f, name: path.basename(f, '.md'), raw, fm: lib.parseFrontmatter(raw) };
    });
}

function nextStep(raw) {
  const m = /##\s*Next\s*\n([\s\S]*?)(?:\n##\s|$)/i.exec(raw);
  return (m ? m[1] : '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*]|\d+\.)\s*/, '').trim())
    .find((l) => l && !/^ordered and small/i.test(l)) || '';
}

function digest(brain, opts = {}) {
  const week = !!opts.week;
  const now = new Date();
  const since = new Date(now.getTime() - (week ? 7 : 1) * DAY);
  const sinceDay = dayOf(since);
  const root = path.dirname(brain);
  const title = week ? `Weekly review — week to ${dayOf(now)}` : `Standup — ${dayOf(now)}`;

  const specs = docs(brain, 'specs');
  const openSpecs = specs.filter((s) => isOpen(s.fm.status));
  const projects = docs(brain, 'projects');
  const active = projects.filter((p) => String(p.fm.status || 'active') === 'active');

  // Blocked
  const p0 = [];
  for (const d of [...projects, ...openSpecs, ...docs(brain, path.join('wiki', 'syntheses'))]) {
    for (const line of d.raw.split('\n')) {
      if (loops.openP0(line)) p0.push(`- ${d.name}: ${line.replace(/^\s*[-*]\s*/, '').trim().slice(0, 120)}`);
    }
  }
  const blocks = lib.readJsonSafe(path.join(brain, 'sessions', 'gate-blocks.json'), {}) || {};
  const review = Object.entries(blocks)
    .filter(([spec, n]) => n >= 2 && openSpecs.some((s) => `${s.name}.md` === spec && s.fm.plan_approved !== true))
    .map(([spec, n]) => `- \`${spec}\` — the plan gate blocked it ${n}×; needs the curator`);
  const health = lib.readJsonSafe(path.join(brain, 'sessions', 'health.json'), null);
  const healthLine = health && (Number(health.crit) || Number(health.warn))
    ? [`- last doctor run: ${health.crit} critical · ${health.warn} warning(s) — /brain:doctor`]
    : [];
  const idle = active
    .filter((p) => { const t = Date.parse(p.fm.updated); return !isNaN(t) && now - t > 21 * DAY; })
    .map((p) => `- ${p.fm.title || p.name} — idle since ${p.fm.updated}`);

  // Done
  const logged = (lib.readTextSafe(path.join(brain, 'wiki', 'log.md')).match(/^## \[(\d{4}-\d{2}-\d{2})\][^\n]*/gm) || [])
    .filter((h) => h.slice(4, 14) >= sinceDay)
    .map((h) => `- ${h.replace(/^## /, '')}`);
  const git = spawnSync('git', ['-C', root, 'log', `--since=${since.toISOString()}`, '--pretty=format:%h %s', '-n', '30'], { encoding: 'utf8' });
  const commits = git.status === 0
    ? git.stdout.split('\n').filter(Boolean).map((l) => { const i = l.indexOf(' '); return `- \`${l.slice(0, i)}\` ${l.slice(i + 1)}`; })
    : [];

  // In flight
  const loopLines = loops.activeLoops(brain).map((l) => `- 🔁 ${loops.describe(l)}`);
  const specLines = openSpecs.map((s) => {
    const p = loops.acProgress(s.raw);
    return `- \`${s.name}\` — ${s.fm.tier || '?'} · phase ${s.fm.phase || '?'}${p.total ? ` · ACs ${p.done}/${p.total}` : ''}`;
  });
  const projLines = active.map((p) => {
    const next = nextStep(p.raw);
    return `- **${p.fm.title || p.name}** — phase ${p.fm.phase || '?'}${next ? ` · next: ${next}` : ''}`;
  });

  const section = (heading, items, empty) => [`## ${heading}`, ...(items.length ? items : [`- ${empty}`]), ''];
  const out = [`# ${title}`, ''];
  out.push(...section('Blocked', [...p0, ...review, ...healthLine, ...idle], 'nothing blocked'));
  out.push(...section(`Done since ${sinceDay}`, [...logged, ...commits], 'no logged work or commits'));
  out.push(...section('In flight', [...loopLines, ...specLines, ...projLines], 'no running loops, open specs or active workstreams'));
  if (week) {
    const decisions = docs(brain, 'decisions').filter((d) => mtime(d.f) >= since.getTime()).map((d) => `- ${d.fm.title || d.name}`);
    const closed = specs.filter((s) => String(s.fm.status) === 'done' && mtime(s.f) >= since.getTime()).map((s) => `- \`${s.name}\``);
    const pending = lib.listFilesRecursive(path.join(brain, 'instincts', 'pending'), '.md').length;
    const u = usage.summarize(root, { days: 7 });
    out.push(...section('Decisions this week', decisions, 'none recorded'));
    out.push(...section('Specs closed', closed, 'none'));
    out.push(...section('Housekeeping', [
      `- instinct queue: ${pending} pending${pending ? ' — promote or drop them in /brain:review' : ''}`,
      `- tokens (7 days): ${u.calls ? `${Math.round(u.totals.all).toLocaleString('en-US')} across ${u.calls} API calls · cache-hit ${Math.round((u.hitRatio || 0) * 100)}%` : 'no transcripts found for this project'}`,
    ], ''));
  }
  const kind = week ? 'weekly' : 'standup';
  return { title, kind, day: dayOf(now), text: out.join('\n').trim() + '\n', file: path.join(brain, 'sessions', `${kind}-${dayOf(now)}.md`) };
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--brain');
  const brain = i >= 0 ? path.resolve(argv[i + 1]) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here — run /brain:init first.');
    return;
  }
  const d = digest(brain, { week: argv.includes('--week') });
  let note = '';
  if (!argv.includes('--no-file')) {
    fs.mkdirSync(path.dirname(d.file), { recursive: true });
    fs.writeFileSync(d.file, `---\ntitle: "${d.title}"\ntype: ${d.kind}\ndate: ${d.day}\n---\n\n${d.text}`, 'utf8');
    note = `\n_Filed to ${path.relative(path.dirname(brain), d.file).split(path.sep).join('/')}._`;
  }
  console.log(d.text + note);
}

if (require.main === module) main();

module.exports = { digest };
