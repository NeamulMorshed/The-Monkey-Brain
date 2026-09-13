#!/usr/bin/env node
/**
 * loop.js — bounded work loops that know when to stop (v3 P12).
 *
 * Three loop types, each with a stop condition read from the brain itself:
 *   spec      spec → build → verify       done when every AC in specs/<slug>.md is ✅
 *   research  research → synthesise        done when wiki/research/<slug>.md has a
 *                                           Recommendation and stops changing
 *   design    design → critique → refine   done when projects/<slug>.md has no open P0
 * Each tick is also checked for livelock (the same summary 3 ticks running),
 * stalls (no progress for --max-no-progress ticks) and the --max-ticks cap.
 * State lives in .brain/sessions/loops/<id>.json, so a loop survives /clear and
 * compaction (brain-status surfaces running loops); spec loops also append each
 * tick to the spec's "## Loop log".
 *
 *   node loop.js start <spec|research|design> <slug> [--generator MODEL] [--max-ticks N] [--max-no-progress N]
 *   node loop.js tick <id> --summary "<what changed this iteration>"
 *   node loop.js status [id]
 *   node loop.js stop <id> [--reason TEXT]
 *
 * Library: activeLoops(brain) · family(model) · describe(loop). Stdlib only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lib = require(path.join(__dirname, 'lib.js'));

const TYPES = {
  spec: 'spec → build → verify',
  research: 'research → synthesise',
  design: 'design → critique → refine',
};
const openP0 = (line) => /\bP0\b/.test(line) && !/(resolved|accepted|closed|fixed|✅|~~)/i.test(line);
const loopsDir = (brain) => path.join(brain, 'sessions', 'loops');
const loopFile = (brain, id) => path.join(loopsDir(brain), `${id}.json`);
const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const squash = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

function family(model) {
  const m = String(model || '').toLowerCase();
  for (const f of ['opus', 'sonnet', 'haiku', 'fable']) if (m.includes(f)) return f;
  return m;
}

function target(brain, loop) {
  if (loop.type === 'spec') return path.join(brain, 'specs', `${loop.anchor}.md`);
  if (loop.type === 'research') return path.join(brain, 'wiki', 'research', `${loop.anchor}.md`);
  return path.join(brain, 'projects', `${loop.anchor}.md`);
}

function stopRule(loop) {
  if (loop.type === 'spec') return `every AC in specs/${loop.anchor}.md marked ✅`;
  if (loop.type === 'research') return `wiki/research/${loop.anchor}.md has a Recommendation and stops changing`;
  return `no open P0 in projects/${loop.anchor}.md`;
}

function section(text, heading) {
  const m = new RegExp(`##\\s*${heading}\\s*([\\s\\S]*?)(?:\\n##\\s|$)`, 'i').exec(text);
  return m ? m[1] : '';
}

/** The loop's progress metric and stop condition, measured from the brain now. */
function measure(brain, loop) {
  const text = lib.readTextSafe(target(brain, loop));
  if (loop.type === 'spec') {
    const acs = section(text, 'Acceptance criteria').split('\n').filter((l) => /\bAC-\d+\b/.test(l));
    const done = acs.filter((l) => /✅|\[x\]/i.test(l)).length;
    return { metric: done, label: `ACs ${done}/${acs.length}`, met: acs.length > 0 && done === acs.length };
  }
  if (loop.type === 'research') {
    const pageHash = text ? hash(text) : '';
    const prev = loop.ticks.length ? loop.ticks[loop.ticks.length - 1].pageHash : null;
    const recommended = !!section(text, 'Recommendation').trim();
    const label = !text ? 'no page yet' : recommended ? 'recommendation drafted' : 'page drafted';
    return { metric: pageHash, pageHash, label, met: recommended && pageHash === prev };
  }
  const open = text.split('\n').filter(openP0).length;
  return { metric: -open, label: `${open} open P0`, met: !!text && open === 0 };
}

const improved = (type, prev, now) => (type === 'research' ? now !== prev : now > prev);

function save(brain, loop) {
  fs.mkdirSync(loopsDir(brain), { recursive: true });
  fs.writeFileSync(loopFile(brain, loop.id), JSON.stringify(loop, null, 2) + '\n', 'utf8');
}

function load(brain, id) {
  const loop = lib.readJsonSafe(loopFile(brain, id), null);
  if (!loop) throw new Error(`no loop "${id}" — \`loop.js status\` lists them`);
  return loop;
}

function start(brain, type, anchor, opts = {}) {
  if (!TYPES[type]) throw new Error(`unknown loop type "${type}" — use spec, research or design`);
  if (!/^[\w.-]+$/.test(anchor || '')) throw new Error('give the loop a slug (letters, digits, dot, dash, underscore)');
  const id = `${type}-${anchor}`;
  const existing = lib.readJsonSafe(loopFile(brain, id), null);
  if (existing && existing.status === 'running') {
    throw new Error(`loop ${id} is already running (tick ${existing.ticks.length}/${existing.maxTicks})`);
  }
  const loop = {
    id,
    type,
    anchor,
    generator: opts.generator || '',
    maxTicks: opts.maxTicks || 12,
    maxNoProgress: opts.maxNoProgress || 3,
    status: 'running',
    reason: '',
    started: new Date().toISOString(),
    ticks: [],
  };
  if (type === 'spec' && !fs.existsSync(target(brain, loop))) {
    throw new Error(`no spec at specs/${anchor}.md — write it with /brain:plan first`);
  }
  loop.baseline = measure(brain, loop).metric;
  save(brain, loop);
  return loop;
}

function localStamp(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function appendLoopLog(file, t) {
  const text = lib.readTextSafe(file);
  if (!text) return;
  const line = `- tick ${t.n} · ${localStamp(t.at)} · ${t.summary} · ${t.label}`;
  const i = text.indexOf('\n## Loop log');
  if (i < 0) {
    fs.writeFileSync(file, text.replace(/\s*$/, '\n\n## Loop log\n') + line + '\n', 'utf8');
    return;
  }
  const next = text.indexOf('\n## ', i + 1);
  const at = next < 0 ? text.length : next;
  fs.writeFileSync(file, text.slice(0, at).replace(/\s*$/, '\n') + line + '\n' + text.slice(at), 'utf8');
}

function tick(brain, id, summary) {
  const loop = load(brain, id);
  if (loop.status !== 'running') {
    throw new Error(`loop ${id} is ${loop.status}${loop.reason ? ` (${loop.reason})` : ''} — change the plan, then start a new one`);
  }
  if (!squash(summary)) throw new Error('tick needs --summary "<what changed this iteration>"');
  const m = measure(brain, loop);
  const prev = loop.ticks.length ? loop.ticks[loop.ticks.length - 1].metric : loop.baseline;
  const t = {
    n: loop.ticks.length + 1,
    at: new Date().toISOString(),
    summary: String(summary).trim().slice(0, 200),
    hash: hash(squash(summary)),
    metric: m.metric,
    label: m.label,
    progress: improved(loop.type, prev, m.metric),
  };
  if (m.pageHash !== undefined) t.pageHash = m.pageHash;
  loop.ticks.push(t);
  const last3 = loop.ticks.slice(-3);
  const stalled = loop.ticks.length >= loop.maxNoProgress && loop.ticks.slice(-loop.maxNoProgress).every((x) => !x.progress);
  if (m.met) {
    loop.status = 'done';
    loop.reason = m.label;
  } else if (last3.length === 3 && last3.every((x) => x.hash === last3[0].hash)) {
    loop.status = 'halted';
    loop.reason = 'livelock — the same result 3 ticks running';
  } else if (stalled) {
    loop.status = 'halted';
    loop.reason = `stalled — no progress in ${loop.maxNoProgress} ticks`;
  } else if (loop.ticks.length >= loop.maxTicks) {
    loop.status = 'halted';
    loop.reason = `tick cap (${loop.maxTicks}) reached`;
  }
  save(brain, loop);
  if (loop.type === 'spec') appendLoopLog(target(brain, loop), t);
  return loop;
}

function stop(brain, id, reason) {
  const loop = load(brain, id);
  loop.status = 'stopped';
  loop.reason = reason || 'stopped by the curator';
  save(brain, loop);
  return loop;
}

function allLoops(brain) {
  let files = [];
  try { files = fs.readdirSync(loopsDir(brain)).filter((f) => f.endsWith('.json')); } catch {}
  return files.map((f) => lib.readJsonSafe(path.join(loopsDir(brain), f), null)).filter(Boolean);
}

const activeLoops = (brain) => allLoops(brain).filter((l) => l.status === 'running');

function describe(loop) {
  const last = loop.ticks[loop.ticks.length - 1];
  return `${loop.id} [${loop.status}] ${TYPES[loop.type]} · tick ${loop.ticks.length}/${loop.maxTicks}` +
    `${last ? ` · ${last.label}` : ''}${loop.reason && (!last || loop.reason !== last.label) ? ` · ${loop.reason}` : ''}`;
}

function verdict(loop) {
  const t = loop.ticks[loop.ticks.length - 1];
  if (loop.status === 'done') {
    return `✅ done at tick ${t.n} — ${loop.reason}. Next: ${loop.type === 'spec' ? '/brain:review' : '/brain:wrap'}.`;
  }
  if (loop.status === 'halted') {
    return `⛔ halted at tick ${t.n} — ${loop.reason}. Stop and report the last ticks to the curator; change the plan before looping again.`;
  }
  return `↻ continue — tick ${t.n}/${loop.maxTicks} · ${t.label}${t.progress ? '' : ' · no progress this tick'}`;
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const [cmd, a, b] = argv;
  const brain = opt('--brain') ? path.resolve(opt('--brain')) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here — run /brain:init first.');
    return;
  }
  try {
    if (cmd === 'start') {
      const l = start(brain, a, b, {
        generator: opt('--generator'),
        maxTicks: Number(opt('--max-ticks')) || 0,
        maxNoProgress: Number(opt('--max-no-progress')) || 0,
      });
      console.log(
        `↻ started ${l.id} (${TYPES[l.type]}) · stops when ${stopRule(l)} · caps: ${l.maxTicks} ticks, ` +
          `${l.maxNoProgress} without progress${l.generator ? ` · generator ${l.generator} — verify on another model family` : ''}`
      );
    } else if (cmd === 'tick') {
      console.log(verdict(tick(brain, a, opt('--summary'))));
    } else if (cmd === 'stop') {
      console.log(describe(stop(brain, a, opt('--reason'))));
    } else if (cmd === 'status') {
      const loops = a && !a.startsWith('--') ? [load(brain, a)] : allLoops(brain);
      console.log(loops.length ? loops.map(describe).join('\n') : 'No loops yet — `loop.js start <spec|research|design> <slug>`.');
    } else {
      console.error('usage: loop.js start <spec|research|design> <slug> [--generator MODEL] [--max-ticks N] [--max-no-progress N] | tick <id> --summary "…" | status [id] | stop <id> [--reason …]');
      process.exit(1);
    }
  } catch (e) {
    console.error(`loop: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { activeLoops, family, describe };
