#!/usr/bin/env node
/**
 * lock.js — a git-native work lock for teams sharing one brain (v3 P16).
 *
 * The lock is a committed file, .brain/LOCK.md: who holds it, on what scope
 * (the whole brain, or one spec), and until when. Pushing it is how teammates
 * see it: their session start shows the lock, and guards.js keeps their writes
 * out of the locked scope until it expires or is released. Identity is
 * MONKEY_BRAIN_AUTHOR, else git's user.email / user.name, else the OS user.
 *
 *   node lock.js acquire <brain|spec-slug> [--hours N] [--note "…"] [--force]
 *   node lock.js release [--force]
 *   node lock.js status
 *
 * Library: readLock(brain) · identity(root) · inScope(lock, relFromBrain) · describeLock(lock, me) · local(iso)
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));

const lockFile = (brain) => path.join(brain, 'LOCK.md');

function identity(root) {
  if (process.env.MONKEY_BRAIN_AUTHOR) return process.env.MONKEY_BRAIN_AUTHOR.trim();
  for (const key of ['user.email', 'user.name']) {
    const r = spawnSync('git', ['config', key], { cwd: root, encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  try { return os.userInfo().username; } catch { return 'unknown'; }
}

function local(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function readLock(brain) {
  const text = lib.readTextSafe(lockFile(brain));
  if (!text) return null;
  const fm = lib.parseFrontmatter(text);
  const until = Date.parse(fm.until);
  return {
    author: String(fm.author || 'unknown'),
    scope: String(fm.scope || 'brain'),
    since: String(fm.since || ''),
    until: String(fm.until || ''),
    note: String(fm.note || ''),
    active: !isNaN(until) && until > Date.now(),
  };
}

/** Is a brain-relative path inside the lock's scope? The append-only log is always free. */
function inScope(lock, rel) {
  if (lock.scope === 'brain') return /^(wiki|specs|decisions|projects|memory|instincts)\//.test(rel) && rel !== 'wiki/log.md';
  return rel === `specs/${lock.scope}.md` || rel === `projects/${lock.scope}.md`;
}

function describeLock(lock, me) {
  if (!lock) return 'No lock — the brain is free.';
  const who = lock.author === me ? 'You hold' : `${lock.author} holds`;
  return lock.active
    ? `🔒 ${who} the lock on ${lock.scope} until ${local(lock.until)}${lock.note ? ` — ${lock.note}` : ''}.`
    : `🔓 ${lock.author}'s lock on ${lock.scope} expired ${local(lock.until)} — free to take over.`;
}

function acquire(brain, scope, opts = {}) {
  if (!/^[\w.-]+$/.test(scope || '')) throw new Error('lock what? "brain" for everything, or a spec slug');
  const me = identity(path.dirname(brain));
  const cur = readLock(brain);
  if (cur && cur.active && cur.author !== me && !opts.force) {
    throw new Error(`${cur.author} holds the lock on ${cur.scope} until ${local(cur.until)}${cur.note ? ` (${cur.note})` : ''} — coordinate first; once agreed, --force takes it over`);
  }
  const since = new Date();
  const until = new Date(since.getTime() + (opts.hours || 8) * 3600000);
  const note = String(opts.note || '').replace(/["\r\n]/g, ' ').trim().slice(0, 200);
  const what = scope === 'brain' ? 'the whole brain' : `the \`${scope}\` spec`;
  fs.writeFileSync(
    lockFile(brain),
    `---\ntitle: "Work lock"\ntype: lock\nauthor: "${me}"\nscope: ${scope}\nsince: ${since.toISOString()}\nuntil: ${until.toISOString()}\nnote: "${note}"\n---\n\n` +
      `${me} is working on ${what} until ${local(until.toISOString())}.${note ? ` ${note}.` : ''}\n` +
      `Commit and push this file so teammates see it; \`/brain:lock release\` when done.\n`,
    'utf8'
  );
  return readLock(brain);
}

function release(brain, opts = {}) {
  const cur = readLock(brain);
  if (!cur) return 'No lock to release.';
  const me = identity(path.dirname(brain));
  if (cur.active && cur.author !== me && !opts.force) {
    throw new Error(`${cur.author} holds this lock until ${local(cur.until)} — only they release it (or --force once you've agreed)`);
  }
  fs.rmSync(lockFile(brain));
  return `Released ${cur.author}'s lock on ${cur.scope}. Commit and push so teammates see it's free.`;
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const brain = opt('--brain') ? path.resolve(opt('--brain')) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here — run /brain:init first.');
    return;
  }
  const [cmd, scope] = argv;
  try {
    if (cmd === 'acquire') {
      const l = acquire(brain, scope, { hours: Number(opt('--hours')) || 0, note: opt('--note'), force: argv.includes('--force') });
      console.log(`${describeLock(l, l.author)} Commit and push LOCK.md now — it only protects you once teammates have pulled it.`);
    } else if (cmd === 'release') {
      console.log(release(brain, { force: argv.includes('--force') }));
    } else if (!cmd || cmd === 'status') {
      console.log(describeLock(readLock(brain), identity(path.dirname(brain))));
    } else {
      console.error('usage: lock.js acquire <brain|spec-slug> [--hours N] [--note "…"] [--force] | release [--force] | status');
      process.exit(1);
    }
  } catch (e) {
    console.error(`lock: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { readLock, identity, inScope, describeLock, local };
