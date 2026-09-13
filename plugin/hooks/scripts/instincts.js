#!/usr/bin/env node
/**
 * instincts.js — the instinct queue: rank, promote, prune, test (v3 P15).
 *
 * Confidence is the instinct's own `confidence:` or, failing that, its evidence
 * count (0 → 0.25 · 1 → 0.4 · 2 → 0.6 · 3 → 0.75 · 4 → 0.85 · 5+ → 0.9).
 * Pending rules at ≥ 0.8 are marked "promote?"; pending rules older than 30
 * days "stale — prune?". Promotion is the curator's call: /brain:review asks
 * before running `promote`.
 *
 *   node instincts.js status
 *   node instincts.js promote <name>   pending → active (the hooks then enforce its ban)
 *   node instincts.js prune <name>     pending → pruned/ (kept for the record)
 *   node instincts.js test <file>      which active bans would fire on this file
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const bans = require(path.join(__dirname, 'bans.js'));

const DAY = 86400000;
const BY_EVIDENCE = [0.25, 0.4, 0.6, 0.75, 0.85];

function evidenceCount(raw) {
  const inline = /^evidence:\s*\[(.*)\]\s*$/m.exec(raw);
  if (inline) return inline[1].split(',').map((s) => s.trim()).filter(Boolean).length;
  const block = /^evidence:\s*\r?\n((?:[ \t]+-[ \t].*\r?\n?)+)/m.exec(raw);
  return block ? block[1].split('\n').filter((l) => /^\s+-\s/.test(l)).length : 0;
}

function confidence(raw, fm) {
  const c = Number(fm.confidence);
  if (fm.confidence !== undefined && fm.confidence !== '' && !isNaN(c)) return Math.max(0, Math.min(1, c));
  const n = evidenceCount(raw);
  return n >= BY_EVIDENCE.length ? 0.9 : BY_EVIDENCE[n];
}

function read(brain, dir) {
  return lib.listFilesRecursive(path.join(brain, 'instincts', dir), '.md').map((f) => {
    const raw = lib.readTextSafe(f);
    const fm = lib.parseFrontmatter(raw);
    let born = Date.parse(fm.created);
    if (isNaN(born)) { try { born = fs.statSync(f).mtimeMs; } catch { born = Date.now(); } }
    return { name: path.basename(f, '.md'), fm, confidence: confidence(raw, fm), ageDays: Math.floor((Date.now() - born) / DAY) };
  });
}

function status(brain) {
  const active = read(brain, 'active');
  const pending = read(brain, 'pending').sort((a, b) => b.confidence - a.confidence);
  const invalid = bans.loadBans(brain).filter((b) => b.invalid).map((b) => b.name);
  const lines = [`🧠 Instincts — ${active.length} active · ${pending.length} pending`];
  if (active.length) {
    lines.push('active:');
    for (const i of active) {
      lines.push(`  ${i.name} — confidence ${i.confidence.toFixed(2)}${i.fm.ban ? ` · ban (${String(i.fm.enforce) === 'block' ? 'block' : 'warn'})` : ''}`);
    }
  }
  if (pending.length) {
    lines.push('pending (highest confidence first):');
    for (const i of pending) {
      lines.push(
        `  ${i.name} — ${i.confidence.toFixed(2)}${i.confidence >= 0.8 ? ' → promote?' : ''}` +
          `${i.ageDays > 30 ? ` · stale (${i.ageDays} days) — prune?` : ''}${i.fm.ban ? ' · carries a ban' : ''}`
      );
    }
  }
  if (invalid.length) lines.push(`invalid ban patterns (the hooks ignore them): ${invalid.join(', ')}`);
  return lines.join('\n');
}

function move(brain, name, from, to, newStatus) {
  if (!/^[\w.-]+$/.test(name || '')) throw new Error('name the instinct (its file name, without .md)');
  const src = path.join(brain, 'instincts', from, `${name}.md`);
  if (!fs.existsSync(src)) throw new Error(`no instincts/${from}/${name}.md`);
  const dest = path.join(brain, 'instincts', to, `${name}.md`);
  if (fs.existsSync(dest)) throw new Error(`instincts/${to}/${name}.md already exists`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const text = lib.readTextSafe(src)
    .replace(/^status:.*$/m, `status: ${newStatus}`)
    .replace(/^updated:.*$/m, `updated: ${lib.today()}`);
  fs.writeFileSync(dest, text, 'utf8');
  fs.rmSync(src);
  return path.relative(brain, dest).split(path.sep).join('/');
}

function test(brain, file) {
  const abs = path.resolve(file);
  const rel = path.relative(path.dirname(brain), abs).split(path.sep).join('/');
  const hits = bans.findMatches(lib.readTextSafe(abs), rel, bans.loadBans(brain));
  if (!hits.length) return `No active ban matches ${rel}.`;
  return hits.map((h) => `${h.ban.enforce === 'block' ? '⛔' : '⚠'} ${h.ban.name} (${h.ban.source}) — line ${h.line}: ${h.snippet}`).join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--brain');
  const brain = i >= 0 ? path.resolve(argv[i + 1]) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here — run /brain:init first.');
    return;
  }
  const [cmd, arg] = argv.filter((a, n) => !(a === '--brain' || argv[n - 1] === '--brain'));
  try {
    if (!cmd || cmd === 'status') console.log(status(brain));
    else if (cmd === 'promote') console.log(`Promoted → ${move(brain, arg, 'pending', 'active', 'active')} — its rule injects every session${read(brain, 'active').some((x) => x.name === arg && x.fm.ban) ? ' and its ban is enforced on writes' : ''}.`);
    else if (cmd === 'prune') console.log(`Pruned → ${move(brain, arg, 'pending', 'pruned', 'pruned')}.`);
    else if (cmd === 'test' && arg) console.log(test(brain, arg));
    else {
      console.error('usage: instincts.js status | promote <name> | prune <name> | test <file>');
      process.exit(1);
    }
  } catch (e) {
    console.error(`instincts: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { status, confidence };
