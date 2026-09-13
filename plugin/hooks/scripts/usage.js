#!/usr/bin/env node
/**
 * usage.js — real token receipts from Claude Code's own transcripts (v3 P11).
 *
 * Reads <config>/projects/<encoded project path>/*.jsonl plus each session's
 * subagents/agent-*.jsonl, dedupes the per-content-block repeats of every API
 * response by message id, and totals input / cache-write / cache-read / output
 * tokens per day, model and git branch — with the prompt-cache hit ratio
 * (cache reads ÷ all input). Honors CLAUDE_CONFIG_DIR. Stdlib only, Node >= 18.
 *
 *   node usage.js [--days N] [--project DIR] [--json]
 *
 * Library: summarize(root, {days}) · readTranscript(file) · format(summary)
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const WIN = process.platform === 'win32';
const KEYS = ['input', 'cacheWrite', 'cacheRead', 'output'];
const configDir = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const encode = (dir) => path.resolve(dir).replace(/[^A-Za-z0-9]/g, '-');
const norm = (p) => (WIN ? path.resolve(p).toLowerCase() : path.resolve(p));

function localDay(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Every assistant API response in one transcript file (repeats included). */
function readTranscript(file) {
  const out = [];
  for (const line of lib.readTextSafe(file).split('\n')) {
    if (!line.includes('"usage"')) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const m = e.message;
    if (e.type !== 'assistant' || !m || !m.usage) continue;
    const u = m.usage;
    out.push({
      id: m.id || e.requestId || e.uuid,
      ts: e.timestamp,
      model: m.model || 'unknown',
      branch: e.gitBranch || '',
      cwd: e.cwd || '',
      sidechain: !!e.isSidechain,
      input: u.input_tokens || 0,
      cacheWrite: u.cache_creation_input_tokens || 0,
      cacheRead: u.cache_read_input_tokens || 0,
      output: u.output_tokens || 0,
    });
  }
  return out;
}

/** Transcript folders for a project: its own, plus sessions started in subfolders. */
function transcriptFiles(root) {
  const base = path.join(configDir(), 'projects');
  // Windows paths are case-insensitive, so the folder's recorded case may differ from ours.
  const fold = (s) => (WIN ? s.toLowerCase() : s);
  const enc = fold(encode(root));
  let dirs = [];
  try {
    dirs = fs.readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && (fold(d.name) === enc || fold(d.name).startsWith(enc + '-')))
      .map((d) => path.join(base, d.name));
  } catch {}
  return dirs.flatMap((d) => lib.listFilesRecursive(d, '.jsonl'));
}

function summarize(root, opts = {}) {
  const days = opts.days || 7;
  const since = Date.now() - days * 86400000;
  const rootN = norm(root);
  const under = (p) => { const n = norm(p); return n === rootN || n.startsWith(rootN + path.sep); };
  const seen = new Set();
  const sessions = new Set();
  const totals = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  const byDay = {};
  const byModel = {};
  const byBranch = {};
  let calls = 0;
  let sideTokens = 0;
  for (const file of transcriptFiles(root)) {
    let mt = 0;
    try { mt = fs.statSync(file).mtimeMs; } catch {}
    if (mt < since) continue;
    for (const r of readTranscript(file)) {
      const t = Date.parse(r.ts);
      if (isNaN(t) || t < since || seen.has(r.id)) continue;
      if (r.cwd && !under(r.cwd)) continue;
      seen.add(r.id);
      calls++;
      if (!r.sidechain) sessions.add(file);
      const all = r.input + r.cacheWrite + r.cacheRead + r.output;
      const day = (byDay[localDay(r.ts)] ||= { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
      for (const k of KEYS) { totals[k] += r[k]; day[k] += r[k]; }
      byModel[r.model] = (byModel[r.model] || 0) + all;
      if (r.branch) byBranch[r.branch] = (byBranch[r.branch] || 0) + all;
      if (r.sidechain) sideTokens += all;
    }
  }
  const all = totals.input + totals.cacheWrite + totals.cacheRead + totals.output;
  const inputAll = totals.input + totals.cacheWrite + totals.cacheRead;
  return {
    root: path.resolve(root),
    days,
    sessions: sessions.size,
    calls,
    totals: { ...totals, all },
    hitRatio: inputAll ? totals.cacheRead / inputAll : null,
    subagentShare: all ? sideTokens / all : 0,
    byDay,
    byModel,
    byBranch,
  };
}

const num = (x) => Math.round(x).toLocaleString('en-US');
const pct = (x) => `${Math.round(x * 100)}%`;
const shares = (map, all) =>
  Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${pct(v / all)}`).join(' · ') || '—';

function format(s) {
  if (!s.calls) return `📊 No Claude Code usage recorded for ${s.root} in the last ${s.days} day(s).`;
  const col = (v, w) => String(v).padStart(w);
  const row = (label, v) => `  ${label.padEnd(10)}  ${col(num(v.input), 12)}  ${col(num(v.cacheWrite), 13)}  ${col(num(v.cacheRead), 14)}  ${col(num(v.output), 11)}`;
  const lines = [
    `📊 Token usage — ${s.root} · last ${s.days} day(s)`,
    `   ${s.sessions} session(s) · ${num(s.calls)} API call(s) · cache-hit ${s.hitRatio === null ? '—' : pct(s.hitRatio)} (cache reads ÷ all input; healthy ≥ 80%)`,
    '',
    `  ${'day'.padEnd(10)}  ${col('input', 12)}  ${col('cache-write', 13)}  ${col('cache-read', 14)}  ${col('output', 11)}`,
  ];
  for (const d of Object.keys(s.byDay).sort()) lines.push(row(d, s.byDay[d]));
  lines.push(row('total', s.totals));
  lines.push(
    '',
    `  by model:   ${shares(s.byModel, s.totals.all)}   (share of all tokens)`,
    `  by branch:  ${shares(s.byBranch, s.totals.all)}`,
    `  subagents:  ${pct(s.subagentShare)} of tokens`
  );
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  let root = opt('--project');
  if (!root) {
    const brain = lib.findBrainDir(process.cwd());
    root = brain ? path.dirname(brain) : process.cwd();
  }
  const s = summarize(root, { days: Number(opt('--days')) || 7 });
  if (argv.includes('--json')) process.stdout.write(JSON.stringify(s, null, 2) + '\n');
  else console.log(format(s));
}

if (require.main === module) main();

module.exports = { summarize, readTranscript, format, encode };
