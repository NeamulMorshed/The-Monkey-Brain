#!/usr/bin/env node
/**
 * lib.js — shared runtime for Monkey Brain hook scripts.
 *
 * Single cross-platform runtime (Node >= 18, stdlib only — no npm installs),
 * per ROADMAP Phase 1 item 4. Every Phase 2 hook script requires this file:
 *
 *   const lib = require(require('path').join(__dirname, 'lib.js'));
 *
 * Hook protocol (see wiki/concepts/hooks in the example brain):
 *   - Input:  hook event JSON arrives on stdin.
 *   - Output: exit 0 + optional stdout JSON = success / decisions.
 *             exit 2 + stderr text        = BLOCKING error (text goes to Claude).
 *             any other exit               = non-blocking error (logged only).
 */
'use strict';

const fs = require('fs');
const path = require('path');

/** Exit codes of the Claude Code hook protocol. */
const EXIT = { OK: 0, BLOCK: 2 };

/** Read the hook's event JSON from stdin. Resolves {} on empty/invalid input. */
function readStdinJson() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

/**
 * Locate the project's .brain/ instance.
 * Order: MONKEY_BRAIN_DIR env override, then walk up from startDir (like
 * CLAUDE.md resolution). Returns the absolute .brain path, or null — hooks
 * must degrade gracefully in projects without a brain.
 */
function findBrainDir(startDir) {
  if (process.env.MONKEY_BRAIN_DIR && fs.existsSync(process.env.MONKEY_BRAIN_DIR)) {
    return path.resolve(process.env.MONKEY_BRAIN_DIR);
  }
  let dir = path.resolve(startDir || process.cwd());
  for (;;) {
    const candidate = path.join(dir, '.brain');
    if (fs.existsSync(path.join(candidate, 'CLAUDE.md'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Parse a JSON file; return fallback (default null) on any failure. */
function readJsonSafe(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Read a text file as UTF-8; return '' on any failure. */
function readTextSafe(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Parse simple YAML frontmatter (the wiki's schema §3 subset).
 * Returns {} when there is no leading --- block. Quoted strings are unquoted;
 * true/false and integers are typed; inline `[a, "b"]` and block `- item` lists
 * become arrays of such scalars (v0.28.0); anything else (dates, nested maps)
 * stays a raw string the caller can regex.
 */
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text || ''));
  if (!m) return {};
  const fm = {};
  let listKey = null; // a bare `key:` that a block-style `- item` list may be filling
  for (const line of m[1].split(/\r?\n/)) {
    const item = listKey && /^\s*-\s+(.*)$/.exec(line); // indented or column-0 items (both valid YAML)
    if (item) {
      if (!Array.isArray(fm[listKey])) fm[listKey] = [];
      fm[listKey].push(scalar(item[1]));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) {
      listKey = null; // anything else (a nested map line, a blank) ends a pending block list
      continue;
    }
    let v = kv[2].trim();
    const list = /^\[/.test(v) && /^\[[\s\S]*\]\s*(#.*)?$/.exec(v);
    if (list) {
      // Inline `[a, "b #c", c]` list → array of scalars (`[]` stays empty). Only when the value is
      // exactly one bracketed list plus an optional comment: `[0-9]+` or `[WIP] thing` stay scalars.
      v = v.slice(0, v.lastIndexOf(']') + 1);
      listKey = null;
      const inner = v.slice(1, -1).trim();
      fm[kv[1]] = inner ? splitTopLevel(inner).map((x) => scalar(x)) : [];
      continue;
    }
    // YAML inline comment: an unquoted `#` after whitespace (templates annotate fields this way).
    if (!/^["']/.test(v)) v = v.replace(/(^|\s+)#.*$/, '').trim();
    if (v === '') {
      // Bare `key:` — an empty value ('') unless `- item` lines follow, which turn it into a list.
      fm[kv[1]] = '';
      listKey = kv[1];
      continue;
    }
    listKey = null;
    fm[kv[1]] = scalar(v);
  }
  return fm;
}

/** Split an inline list body on commas that sit outside quotes. */
function splitTopLevel(s) {
  const out = [];
  let cur = '';
  let q = null;
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === ',') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== '');
}

/** One YAML scalar: strip quotes, coerce booleans and integers, leave everything else a string. */
function scalar(raw) {
  let v = String(raw).trim();
  if (!/^["']/.test(v)) v = v.replace(/(^|\s+)#.*$/, '').trim();
  if ((/^".*"$/.test(v)) || (/^'.*'$/.test(v))) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

/**
 * Aliases from a page's `aliases:` field — an array (v0.28.0 parser) or the older string form
 * where only quoted entries count. Shared by wiki-check, doctor and lint.
 */
function extractAliases(fmAliases) {
  if (Array.isArray(fmAliases)) return fmAliases.map((a) => String(a).trim()).filter(Boolean);
  const out = [];
  for (const m of String(fmAliases || '').matchAll(/"([^"]+)"|'([^']+)'/g)) out.push(m[1] || m[2]);
  return out;
}

/** All files under dir (recursive), optionally filtered by extension. */
function listFilesRecursive(dir, ext) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursive(p, ext));
    else if (!ext || e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

/**
 * Rough token estimate (chars / 4). Good enough to enforce the Phase 2
 * injection budget; receipts use real counts later (Phase 8 doctor).
 */
function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

/** Today as YYYY-MM-DD (local time) — the wiki's date convention. */
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Emit stdout JSON (decisions / additionalContext) and exit 0. */
function succeed(output) {
  if (output !== undefined) process.stdout.write(JSON.stringify(output));
  process.exit(EXIT.OK);
}

/** Block the event: reason goes to Claude via stderr, exit 2. */
function block(reason) {
  process.stderr.write(String(reason));
  process.exit(EXIT.BLOCK);
}

module.exports = {
  EXIT,
  readStdinJson,
  findBrainDir,
  readJsonSafe,
  readTextSafe,
  parseFrontmatter,
  extractAliases,
  listFilesRecursive,
  estimateTokens,
  today,
  succeed,
  block,
};

// Self-test: `node lib.js` prints OK without touching anything.
if (require.main === module) {
  const assert = require('assert');
  assert.strictEqual(estimateTokens('abcdefgh'), 2);
  assert.strictEqual(estimateTokens(''), 0);
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(readJsonSafe(path.join(__dirname, 'no-such-file.json'), 'fb'), 'fb');
  assert.strictEqual(readTextSafe(path.join(__dirname, 'no-such-file.md')), '');
  const fm = parseFrontmatter('---\ntitle: "T"\ntype: concept\nplan_approved: true\npage_count: 69\n---\nbody');
  assert.deepStrictEqual(fm, { title: 'T', type: 'concept', plan_approved: true, page_count: 69 });
  assert.deepStrictEqual(parseFrontmatter('no frontmatter'), {});
  assert.deepStrictEqual(parseFrontmatter("---\ntier: architecture   # quick | feature\npack:   # optional\nban: 'a#b'\nurl: x#y\n---"), { tier: 'architecture', pack: '', ban: 'a#b', url: 'x#y' });
  assert.ok(listFilesRecursive(__dirname, '.js').some((f) => f.endsWith('lib.js')));
  assert.strictEqual(typeof findBrainDir, 'function');
  console.log('lib.js self-test OK');
}
