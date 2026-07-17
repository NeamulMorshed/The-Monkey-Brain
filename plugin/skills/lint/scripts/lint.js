#!/usr/bin/env node
/**
 * lint.js — the mechanical layer of /brain:lint (ROADMAP Phase 3).
 *
 * Deterministic vault scan, zero model tokens: broken [[wikilinks]], orphan
 * pages, frontmatter gaps, index stat drift, Clippings backlog, stray root
 * files. The SKILL.md injects this output via !` ` preprocessing; the model
 * then does the reasoning layer (contradictions, staleness, gaps).
 *
 * Usage: node lint.js [--brain <path>] [--strict]
 *   --brain   explicit brain root (default: walk up from cwd like the hooks)
 *   --strict  exit 1 when issues were found (CI use); default always exits 0
 *             so skill preprocessing never breaks.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, '..', '..', '..', 'hooks', 'scripts', 'lib.js'));

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const brainArg = args.includes('--brain') ? args[args.indexOf('--brain') + 1] : null;

const brain = brainArg ? path.resolve(brainArg) : lib.findBrainDir(process.cwd());
if (!brain || !fs.existsSync(path.join(brain, 'wiki'))) {
  console.log('No Monkey Brain found (no .brain/ with a wiki/ from here up). Run /brain:init first.');
  process.exit(0);
}

const wikiDir = path.join(brain, 'wiki');
const files = lib.listFilesRecursive(wikiDir, '.md');
const ORPHAN_EXEMPT = new Set(['index', 'log', 'dashboard']);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function extractAliases(fmAliases) {
  const out = [];
  for (const m of String(fmAliases || '').matchAll(/"([^"]+)"|'([^']+)'/g)) out.push(m[1] || m[2]);
  return out;
}

// ---- inventory --------------------------------------------------------------
const byFolder = {};
const slugs = new Set();
const qualified = new Set();
const aliases = new Set();
const pages = []; // { file, rel, slug, raw, fm }
for (const f of files) {
  const rel = path.relative(wikiDir, f).split(path.sep).join('/');
  const folder = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : '(root)';
  byFolder[folder] = (byFolder[folder] || 0) + 1;
  const raw = lib.readTextSafe(f);
  const fm = lib.parseFrontmatter(raw);
  slugs.add(path.basename(f, '.md'));
  qualified.add(rel.replace(/\.md$/, ''));
  for (const a of extractAliases(fm.aliases)) aliases.add(a.toLowerCase());
  pages.push({ file: f, rel, slug: path.basename(f, '.md'), raw, fm });
}

const issues = [];
const out = [];
out.push(`🐵 brain lint — mechanical scan of ${brain}`);
out.push(`Pages: ${files.length} (${Object.entries(byFolder).map(([k, v]) => `${k} ${v}`).join(' · ')})`);

// ---- broken links -----------------------------------------------------------
const resolves = (t) =>
  qualified.has(t) || slugs.has(t) || slugs.has(t.split('/').pop()) || aliases.has(t.toLowerCase());
const broken = new Map(); // target -> Set(referrers)
for (const p of pages) {
  const stripped = p.raw.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of stripped.matchAll(/\[\[([^[\]]+)\]\]/g)) {
    const t = m[1].split('|')[0].split('#')[0].trim();
    if (t && !resolves(t)) {
      if (!broken.has(t)) broken.set(t, new Set());
      broken.get(t).add(p.rel);
    }
  }
}
if (broken.size) {
  issues.push('broken links');
  out.push(`\nBROKEN [[links]] (${broken.size}) — TODO markers are legal, everything else needs a fix:`);
  for (const [t, refs] of [...broken].sort()) out.push(`  [[${t}]] ← ${[...refs].join(', ')}`);
} else out.push('\nBroken [[links]]: none');

// ---- orphans ----------------------------------------------------------------
const orphans = [];
for (const p of pages) {
  if (ORPHAN_EXEMPT.has(p.slug)) continue;
  const needles = [new RegExp(`\\[\\[(?:[^\\]]*/)?${esc(p.slug)}(?:[|#\\]])`)];
  for (const a of extractAliases(p.fm.aliases)) needles.push(new RegExp(`\\[\\[${esc(a)}(?:[|#\\]])`, 'i'));
  const linked = pages.some((q) => q.file !== p.file && needles.some((re) => re.test(q.raw)));
  if (!linked) orphans.push(p.rel);
}
if (orphans.length) {
  issues.push('orphans');
  out.push(`\nORPHANS (no inbound links, §5): ${orphans.join(', ')}`);
} else out.push('Orphans: none');

// ---- frontmatter gaps -------------------------------------------------------
const fmGaps = [];
for (const p of pages) {
  const miss = [];
  if (!/^---/.test(p.raw)) miss.push('frontmatter');
  else {
    if (!p.fm.type) miss.push('type');
    if (!p.fm.updated) miss.push('updated');
  }
  if (miss.length) fmGaps.push(`${p.rel} (missing ${miss.join(', ')})`);
}
if (fmGaps.length) {
  issues.push('frontmatter gaps');
  out.push(`\nFRONTMATTER gaps (§3): ${fmGaps.join('; ')}`);
} else out.push('Frontmatter: complete');

// ---- index drift ------------------------------------------------------------
const rawSources = lib
  .listFilesRecursive(path.join(brain, 'raw-sources'), '.md')
  .filter((f) => !f.split(path.sep).includes('assets'));
const idx = pages.find((p) => p.rel === 'index.md');
if (idx) {
  const drift = [];
  if (idx.fm.source_count !== undefined && idx.fm.source_count !== rawSources.length)
    drift.push(`source_count says ${idx.fm.source_count}, actual raw sources: ${rawSources.length}`);
  if (idx.fm.page_count !== undefined && idx.fm.page_count !== files.length)
    drift.push(`page_count says ${idx.fm.page_count}, actual wiki pages: ${files.length}`);
  if (drift.length) {
    issues.push('index drift');
    out.push(`\nINDEX drift: ${drift.join('; ')} — fix wiki/index.md frontmatter (+ \`updated:\`)`);
  } else out.push('Index stats: in sync');
} else {
  issues.push('missing index');
  out.push('\nINDEX: wiki/index.md is missing');
}

// ---- clippings backlog ------------------------------------------------------
let clippings = 0;
try {
  clippings = fs.readdirSync(path.join(brain, 'Clippings')).filter((f) => f.endsWith('.md')).length;
} catch {}
if (clippings) out.push(`Clippings backlog: ${clippings} unprocessed (offer /brain:ingest clippings)`);

// ---- stray root files -------------------------------------------------------
const LEGIT_ROOT = new Set(['README.md', 'CLAUDE.md', 'resume.md']);
const strays = [];
try {
  for (const e of fs.readdirSync(brain, { withFileTypes: true })) {
    if (!e.isDirectory() && e.name.endsWith('.md') && !LEGIT_ROOT.has(e.name)) {
      const size = fs.statSync(path.join(brain, e.name)).size;
      strays.push(`${e.name} (${size} bytes${size === 0 ? ' — Obsidian artifact, delete it' : ''})`);
    }
  }
} catch {}
if (strays.length) {
  issues.push('stray root files');
  out.push(`\nSTRAY brain-root .md: ${strays.join(', ')}`);
}

// ---- verdict ----------------------------------------------------------------
out.push(
  issues.length
    ? `\nLINT: ${issues.length} issue group(s) — ${issues.join(', ')}. Fix (or justify) each, then do the reasoning pass.`
    : '\nLINT CLEAN (mechanical layer) — continue with the reasoning pass: contradictions, staleness, missing pages, gaps.'
);
console.log(out.join('\n'));
process.exit(strict && issues.length ? 1 : 0);
