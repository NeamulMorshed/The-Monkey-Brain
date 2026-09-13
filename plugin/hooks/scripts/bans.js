#!/usr/bin/env node
/**
 * bans.js — learned bans: patterns the brain won't let back in (v3 P15).
 *
 * Two sources, both plain data:
 *   - active instincts (instincts/active/*.md) whose frontmatter carries `ban:`
 *     (a regex, single-quoted in YAML), optional `ban_paths:` (a regex on the
 *     project-relative path) and `enforce: warn|block` (default warn);
 *   - a pack's bans.json (e.g. the product-design pack's UI anti-patterns),
 *     active while a workstream in projects/ declares that pack.
 * guards.js refuses `enforce: block` matches before the write; instinct-track.js
 * reports `warn` matches right after it. Invalid patterns are skipped, never fatal.
 *
 * Library: loadBans(brain) · findMatches(text, relPath, bans)
 */
'use strict';

const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const SKILLS = path.join(__dirname, '..', '..', 'skills');

/** Compile a pattern; a doubled backslash (YAML double quotes) collapses to one. */
function compile(src) {
  if (!src) return null;
  try { return new RegExp(String(src).replace(/\\\\/g, '\\'), 'i'); } catch { return null; }
}

function fromInstincts(brain) {
  const out = [];
  for (const f of lib.listFilesRecursive(path.join(brain, 'instincts', 'active'), '.md')) {
    const text = lib.readTextSafe(f);
    const fm = lib.parseFrontmatter(text);
    if (!fm.ban) continue;
    const re = compile(fm.ban);
    const rule = ((/\*\*Rule:\*\*\s*(.+)/.exec(text) || [])[1] || fm.title || path.basename(f, '.md')).trim();
    out.push({
      name: path.basename(f, '.md'),
      source: `instincts/active/${path.basename(f)}`,
      re,
      paths: compile(fm.ban_paths),
      enforce: String(fm.enforce) === 'block' ? 'block' : 'warn',
      rule,
      invalid: !re,
    });
  }
  return out;
}

function fromPacks(brain) {
  const packs = new Set(
    lib.listFilesRecursive(path.join(brain, 'projects'), '.md')
      .map((f) => lib.parseFrontmatter(lib.readTextSafe(f)))
      .filter((fm) => fm.pack && String(fm.status || 'active') === 'active')
      .map((fm) => String(fm.pack))
  );
  const out = [];
  for (const pack of packs) {
    if (!/^[\w-]+$/.test(pack)) continue;
    const data = lib.readJsonSafe(path.join(SKILLS, pack, 'bans.json'), null);
    for (const b of data && Array.isArray(data.bans) ? data.bans : []) {
      const re = compile(b.pattern);
      out.push({
        name: b.id,
        source: `${pack} pack`,
        re,
        paths: compile(b.paths || data.paths),
        enforce: b.enforce === 'block' ? 'block' : 'warn',
        rule: b.rule || '',
        invalid: !re,
      });
    }
  }
  return out;
}

const loadBans = (brain) => [...fromInstincts(brain), ...fromPacks(brain)];

/** First matching line per ban, in `text`, for a file at project-relative `relPath`. */
function findMatches(text, relPath, bans) {
  const hits = [];
  const lines = String(text || '').split(/\r?\n/);
  for (const b of bans) {
    if (!b.re || (b.paths && !b.paths.test(relPath))) continue;
    const i = lines.findIndex((l) => b.re.test(l));
    if (i >= 0) hits.push({ ban: b, line: i + 1, snippet: lines[i].trim().slice(0, 120) });
  }
  return hits;
}

module.exports = { loadBans, findMatches };
