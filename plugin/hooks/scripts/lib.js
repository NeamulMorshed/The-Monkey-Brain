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
const SEED_NARRATIVE = /^_(Nothing yet\b|Auto-created by the Monkey Brain resume hook)[^_]*_$/; // one italic span only

/**
 * True when a resume.md still holds only its seed (v0.30.0): "Where we left off" is empty or a seed
 * placeholder and "Next steps" has nothing but `- [ ] …`. The task log never counts — hooks write it.
 * With neither heading, the file is a seed only when a hook-written task log is all it holds;
 * any other content is someone's own format.
 */
function isSeedResume(text) {
  const body = String(text || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const where = mdSection(body, 'Where we left off');
  const next = mdSection(body, 'Next steps');
  if (where === null && next === null) {
    let inLog = false;
    const rest = [];
    for (const l of body.split(/\r?\n/)) {
      if (/^## /.test(l)) inLog = /^## Task log/.test(l);
      if (!inLog && l.trim()) rest.push(l);
    }
    return rest.length === 0 && /^## Task log/m.test(body);
  }
  const whereSeed = !where || SEED_NARRATIVE.test(where);
  const nextSeed = !next || next.split(/\r?\n/).every((l) => !l.trim() || /^\s*-\s*\[ \]\s*…\s*$/.test(l));
  return whereSeed && nextSeed;
}

/**
 * The project's resume file — the ONE file every reader and writer uses (v0.30.0): resume.js
 * injects it, resume-log.js appends to it, snapshot.js copies its next steps. Candidates are
 * <brain>/resume.md then <project>/resume.md (the brain's parent; the cwd without a brain); the first existing file with a real narrative wins, else
 * the first existing file, else — only with `create`, inside a brain — the brain path; else null.
 * Preferring a real narrative over location lets a brain seeded beside an older root resume.md
 * recover without a migration.
 */
function resumePath(cwd, opts = {}) {
  const brain = findBrainDir(cwd);
  const candidates = [];
  if (brain) candidates.push(path.join(brain, 'resume.md'));
  candidates.push(path.join(brain ? path.dirname(brain) : path.resolve(cwd || process.cwd()), 'resume.md'));
  const existing = candidates.filter((c) => fs.existsSync(c));
  const real = existing.find((c) => !isSeedResume(readTextSafe(c)));
  if (real) return real;
  if (existing.length) return existing[0];
  return opts.create && brain ? candidates[0] : null;
}

/** A P0 line closed inline: a closing word (not "not fixed", not "unresolved"), ✅, or strikethrough. */
const CLOSED_INLINE = /(?<!\bnot\s)\b(resolved|accepted|closed|fixed)\b|✅|~~/i;
/** A heading closes its section only with an explicit status marker at its end — "(all fixed)",
 *  "— resolved", ": done", or a bare "Done" — and never when it also negates. */
const CLOSING_HEADING = /(?:^|[(\[,:;—–-]\s*)(?:all\s+|now\s+)?(?:fixed|resolved|closed|accepted|done)\s*[)\]]?\s*$/i;
const NEGATED_HEADING = /\b(not|none|yet|to be|once|until|pending|open|unresolved|todo)\b/i;
/** "0 P0", "no P0s" — counts, not findings. */
const P0_COUNT = /\b(?:0|no|zero)\s+P0s?\b/gi;

/**
 * Open P0 findings in a markdown page (v0.30.0) — the one detector doctor #14, loops and digests
 * share. A line mentioning P0 is closed inline (CLOSED_INLINE) or by its section: a closing heading
 * (CLOSING_HEADING, not NEGATED_HEADING) closes every line beneath it until the next heading of the
 * same or higher level. Count phrases are ignored, but a real finding beside one still counts.
 * Fenced code is skipped; an unclosed fence at the end is not a fence, so one stray fence cannot
 * hide the rest of a page. Returns the open lines.
 */
function openP0Lines(text) {
  const lines = String(text || '').split(/\r?\n/);
  const fenceAt = lines.map((l, i) => (/^\s*```/.test(l) ? i : -1)).filter((i) => i >= 0);
  if (fenceAt.length % 2) fenceAt.pop();
  const fences = new Set(fenceAt);
  const out = [];
  let closedAt = 0; // level of the heading that closed the current section; 0 = open
  let fence = false;
  lines.forEach((line, i) => {
    if (fences.has(i)) { fence = !fence; return; }
    if (fence) return;
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      if (closedAt && h[1].length <= closedAt) closedAt = 0;
      const title = h[2].trim();
      if (!closedAt && CLOSING_HEADING.test(title) && !NEGATED_HEADING.test(title)) { closedAt = h[1].length; return; }
    }
    if (closedAt || !/\bP0\b/.test(line.replace(P0_COUNT, ''))) return;
    if (CLOSED_INLINE.test(line)) return;
    out.push(line);
  });
  return out;
}

/**
 * Uncommitted changes inside a brain, minus the files the hooks write themselves (v0.30.0):
 * sessions/ (agent ledger, snapshots) and resume.md (its task log). The pathspecs are relative to
 * the brain, so a wiki page named resume.md or a folder named sessions elsewhere still counts.
 * Returns { count }, or null when the brain is not in a git repo (or git is unavailable).
 */
function brainGitDirty(brain) {
  let git;
  try {
    git = require('child_process').spawnSync(
      'git',
      ['-C', brain, 'status', '--porcelain', '--untracked-files=all', '--', '.', ':(exclude)sessions', ':(exclude)resume.md'],
      { encoding: 'utf8', timeout: 8000 }
    );
  } catch {
    return null;
  }
  if (!git || git.status !== 0) return null;
  return { count: git.stdout.split('\n').filter((l) => l.trim()).length };
}

/** Records a [[link]] may point at besides wiki pages (v0.32.0) — the ones the skills tell the model to link. */
const RECORD_DIRS = ['specs', 'decisions', 'projects'];

/**
 * The brain's link inventory (v0.32.0) — the one map wiki-check, lint and doctor resolve [[links]]
 * against. Wiki pages (wiki/**) resolve by slug, folder-qualified name ("concepts/x") and alias;
 * spec, decision and project records by slug, "specs/x"-style name and alias. Templates, sessions
 * and raw sources are never link targets. hasInbound(page): does another wiki page or a record link
 * to this page? — only wiki pages can be orphans, but a link from a spec or an ADR counts.
 * Returns { pages, records, resolves(target), hasInbound(page) }; pages are { file, rel, slug, raw, fm }.
 */
function linkIndex(brain) {
  const wikiDir = path.join(brain, 'wiki');
  const pages = [];
  const records = [];
  const slugs = new Set();
  const qualified = new Set();
  const aliases = new Set();
  for (const f of listFilesRecursive(wikiDir, '.md')) {
    const rel = path.relative(wikiDir, f).split(path.sep).join('/');
    const raw = readTextSafe(f);
    const fm = parseFrontmatter(raw);
    const slug = path.basename(f, '.md');
    slugs.add(slug);
    qualified.add(rel.replace(/\.md$/, ''));
    for (const a of extractAliases(fm.aliases)) aliases.add(a.toLowerCase());
    pages.push({ file: f, rel, slug, raw, fm });
  }
  for (const dir of RECORD_DIRS) {
    for (const f of listFilesRecursive(path.join(brain, dir), '.md')) {
      const slug = path.basename(f, '.md');
      const raw = readTextSafe(f);
      slugs.add(slug);
      qualified.add(`${dir}/${slug}`);
      for (const a of extractAliases(parseFrontmatter(raw).aliases)) aliases.add(a.toLowerCase());
      records.push({ file: f, rel: `${dir}/${slug}`, slug, raw });
    }
  }
  const resolves = (t) => qualified.has(t) || slugs.has(t) || slugs.has(String(t).split('/').pop()) || aliases.has(String(t).toLowerCase());
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasInbound = (page) => {
    const link = (name, flags) => new RegExp(`\\[\\[(?:[^\\]]*/)?${esc(name)}(?:\\\\?\\||#|\\])`, flags); // `\|` = table-escaped pipe
    const needles = [link(page.slug)];
    for (const a of extractAliases(page.fm && page.fm.aliases)) needles.push(link(a, 'i'));
    const self = path.resolve(page.file);
    return [...pages, ...records].some((q) => path.resolve(q.file) !== self && needles.some((re) => re.test(q.raw)));
  };
  return { pages, records, resolves, hasInbound };
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
  brainGitDirty,
  linkIndex,
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
