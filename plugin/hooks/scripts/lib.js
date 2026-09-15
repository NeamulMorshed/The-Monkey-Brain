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

/**
 * Is a project-relative path (as `path.relative(projectRoot, abs)` returns it) inside the project?
 * Outside: `..`, `../…`, an absolute path, or a drive-letter path (Windows returns one across
 * drives). A folder merely named `..odd` is inside. The one containment test for every gate (v0.30.0).
 */
function inProject(rel) {
  const r = String(rel || '').split('\\').join('/');
  return r !== '..' && !r.startsWith('../') && !r.startsWith('/') && !/^[A-Za-z]:/.test(r) && !path.isAbsolute(r);
}

/** The body of a `## heading` section (up to the next `## `), or null when the heading is absent. */
function mdSection(text, heading) {
  const lines = String(text || '').split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith(`## ${heading}`));
  if (at < 0) return null;
  const out = [];
  for (let i = at + 1; i < lines.length && !/^## /.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n').trim();
}

/** Placeholder narratives written by /brain:init's template and by the resume hook's own seed. */
const SEED_NARRATIVE = /^_(Nothing yet\b|Auto-created by the Monkey Brain resume hook)[\s\S]*_$/;

/**
 * True when a resume.md still holds only its seed (v0.30.0): "Where we left off" is empty or a seed
 * placeholder and "Next steps" has nothing but `- [ ] …`. The task log never counts — hooks write it.
 * A file with neither heading is someone's own format, never a seed.
 */
function isSeedResume(text) {
  const body = String(text || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const where = mdSection(body, 'Where we left off');
  const next = mdSection(body, 'Next steps');
  if (where === null && next === null) return false;
  const whereSeed = !where || SEED_NARRATIVE.test(where);
  const nextSeed = !next || next.split(/\r?\n/).every((l) => !l.trim() || /^\s*-\s*\[ \]\s*…\s*$/.test(l));
  return whereSeed && nextSeed;
}

/**
 * The project's resume file — the ONE file every reader and writer uses (v0.30.0): resume.js
 * injects it, resume-log.js appends to it, snapshot.js copies its next steps. Candidates are
 * <brain>/resume.md then <cwd>/resume.md; the first existing file with a real narrative wins, else
 * the first existing file, else — only with `create`, inside a brain — the brain path; else null.
 * Preferring a real narrative over location lets a brain seeded beside an older root resume.md
 * recover without a migration.
 */
function resumePath(cwd, opts = {}) {
  const brain = findBrainDir(cwd);
  const candidates = [];
  if (brain) candidates.push(path.join(brain, 'resume.md'));
  candidates.push(path.join(path.resolve(cwd || process.cwd()), 'resume.md'));
  const existing = candidates.filter((c) => fs.existsSync(c));
  const real = existing.find((c) => !isSeedResume(readTextSafe(c)));
  if (real) return real;
  if (existing.length) return existing[0];
  return opts.create && brain ? candidates[0] : null;
}

const CLOSED_INLINE = /(resolved|accepted|closed|fixed|✅|~~)/i;
const CLOSING_HEADING = /\b(fixed|resolved|closed|accepted|done)\b/i;

/**
 * Open P0 findings in a markdown page (v0.30.0) — the one detector doctor #14, loops and digests
 * share. A line mentioning P0 is closed inline (resolved / accepted / closed / fixed / ✅ / ~~) or by
 * its section: a heading containing fixed / resolved / closed / accepted / done closes every line
 * beneath it until the next heading of the same or higher level. "0 P0" / "no P0" are counts, not
 * findings; fenced code is skipped. Returns the open lines.
 */
function openP0Lines(text) {
  const out = [];
  let closedAt = 0; // level of the heading that closed the current section; 0 = open
  let fence = false;
  for (const line of String(text || '').split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      if (closedAt && h[1].length <= closedAt) closedAt = 0;
      if (!closedAt && CLOSING_HEADING.test(h[2])) { closedAt = h[1].length; continue; }
    }
    if (closedAt || !/\bP0\b/.test(line)) continue;
    if (/\b(0|no|zero)\s+P0s?\b/i.test(line) || CLOSED_INLINE.test(line)) continue;
    out.push(line);
  }
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
  inProject,
  mdSection,
  isSeedResume,
  resumePath,
  openP0Lines,
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
