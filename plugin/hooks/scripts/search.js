#!/usr/bin/env node
/**
 * search.js — built-in full-text recall over a Monkey Brain (v3 P10).
 *
 * Pure-Node BM25 over the compiled layers (wiki/, decisions/, specs/,
 * projects/, memory/) — never raw-sources/, Clippings/, templates, or the
 * index/log hubs, so every hit is a compiled page with provenance. Rebuilt from
 * the files on every call: it can't go stale, and a few hundred pages index in
 * well under a second. qmd (reference.md §8) stays the opt-in vector upgrade.
 *
 *   node search.js "<query>" [--limit N] [--json] [--brain DIR]
 *   node search.js --brief "<topic>" [--budget TOKENS] [--brain DIR]
 *
 * Library: search(brain, query, {limit}) · brief(brain, topic, {budget}) ·
 * format(query, hits) · terms(text). Stdlib only, Node >= 18.
 */
'use strict';

const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const LAYERS = ['wiki', 'decisions', 'specs', 'projects', 'memory'];
const SKIP = new Set(['wiki/index.md', 'wiki/log.md', 'wiki/dashboard.md']);
const STOP = new Set((
  'a an and are as at be but by can could do does for from had has have how i if in into is it its me my ' +
  'of on or our please should so tell than that the their them then there these they this to us was we ' +
  'what when where which who why will with would you your about just also want need show give brief'
).split(' '));
const K1 = 1.2;
const B = 0.75;

function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function terms(text) {
  const out = [];
  for (const m of String(text || '').toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)) {
    if (m[0].length < 2 || STOP.has(m[0])) continue;
    out.push(stem(m[0]));
  }
  return out;
}

function stripFrontmatter(text) {
  const m = /^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/.exec(text);
  return m ? text.slice(m[0].length) : text;
}

function loadDocs(brain) {
  const docs = [];
  for (const layer of LAYERS) {
    for (const file of lib.listFilesRecursive(path.join(brain, layer), '.md')) {
      const rel = path.relative(brain, file).split(path.sep).join('/');
      if (SKIP.has(rel) || /(^|\/)templates\//.test(rel)) continue;
      const text = lib.readTextSafe(file);
      const fm = lib.parseFrontmatter(text);
      const body = stripFrontmatter(text);
      const title = String(fm.title || path.basename(file, '.md'));
      const tf = new Map();
      const add = (words, weight) => { for (const w of words) tf.set(w, (tf.get(w) || 0) + weight); };
      add(terms(body), 1);
      add(terms(title), 3);
      add(terms(`${fm.aliases || ''} ${fm.tags || ''}`), 2);
      let len = 0;
      for (const v of tf.values()) len += v;
      docs.push({ rel, slug: path.basename(file, '.md'), title, type: String(fm.type || layer), body, tf, len });
    }
  }
  return docs;
}

function rank(docs, query) {
  const q = [...new Set(terms(query))];
  if (!q.length || !docs.length) return { q, hits: [] };
  const n = docs.length;
  const avgdl = docs.reduce((s, d) => s + d.len, 0) / n || 1;
  const idf = new Map(q.map((t) => {
    const df = docs.reduce((c, d) => c + (d.tf.has(t) ? 1 : 0), 0);
    return [t, Math.log(1 + (n - df + 0.5) / (df + 0.5))];
  }));
  const hits = [];
  for (const doc of docs) {
    let score = 0;
    let matched = 0;
    for (const t of q) {
      const f = doc.tf.get(t);
      if (!f) continue;
      matched++;
      score += (idf.get(t) * f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.len) / avgdl));
    }
    if (score > 0) hits.push({ doc, score, matched });
  }
  hits.sort((a, b) => b.score - a.score || b.matched - a.matched);
  return { q, hits };
}

// Paragraphs as plain text: heading lines and table separator rows dropped, so
// excerpts never collide with the brief's own headings.
function blocks(body) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.split(/\r?\n/).filter((l) => !/^\s*#{1,6}\s/.test(l) && !/^\s*\|?\s*:?-{3,}/.test(l)).join(' '))
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function bestBlocks(doc, q, count) {
  const want = new Set(q);
  return blocks(doc.body)
    .map((text, i) => ({ text, i, hits: new Set(terms(text).filter((w) => want.has(w))).size }))
    .filter((b) => b.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.i - b.i)
    .slice(0, count);
}

function clip(text, max) {
  return text.length <= max ? text : text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function search(brain, query, opts = {}) {
  const limit = opts.limit || 5;
  const { q, hits } = rank(loadDocs(brain), query);
  return hits.slice(0, limit).map(({ doc, score, matched }) => {
    const best = bestBlocks(doc, q, 1)[0];
    return {
      path: doc.rel,
      slug: doc.slug,
      title: doc.title,
      type: doc.type,
      score: Math.round(score * 100) / 100,
      matched,
      terms: q.length,
      snippet: clip(best ? best.text : blocks(doc.body)[0] || '', 240),
    };
  });
}

function brief(brain, topic, opts = {}) {
  const budget = opts.budget || 2000;
  const { q, hits } = rank(loadDocs(brain), topic);
  if (!hits.length) return `No pages in this brain match "${topic}" — try other words, or ingest a source on it.`;
  const head = `# Brief: ${topic}\n${hits.length} matching page(s), best first. Cite as [[slug]].`;
  const pieces = [head];
  const reserve = 40;
  let used = lib.estimateTokens(head);
  let shown = 0;
  for (const { doc } of hits) {
    const best = bestBlocks(doc, q, 2);
    const excerpts = (best.length ? best.map((b) => b.text) : [blocks(doc.body)[0] || '']).map((t) => clip(t, 700));
    let piece = `## ${doc.title} — \`${doc.rel}\` · [[${doc.slug}]]\n${excerpts.join('\n\n')}`;
    const room = budget - reserve - used;
    if (lib.estimateTokens(piece) > room) {
      if (shown) break;
      piece = clip(piece, room * 4);
    }
    pieces.push(piece);
    used += lib.estimateTokens(piece) + 1;
    shown++;
  }
  if (shown < hits.length) pieces.push(`_${hits.length - shown} more page(s) matched — brain_search lists them._`);
  return pieces.join('\n\n');
}

function format(query, hits) {
  if (!hits.length) return `No pages in this brain match "${query}".`;
  return hits.map((h, i) => `${i + 1}. ${h.title} — \`${h.path}\` [[${h.slug}]]\n   ${h.snippet}`).join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const valued = new Set(['--brain', '--limit', '--budget']);
  const opt = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    if (valued.has(argv[i])) i++;
    else if (!argv[i].startsWith('--')) words.push(argv[i]);
  }
  const text = words.join(' ').trim();
  const brain = opt('--brain') ? path.resolve(opt('--brain')) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here (no .brain/ up the tree) — run /brain:init first.');
    return;
  }
  if (!text) {
    console.error('usage: search.js "<query>" [--limit N] [--json] | --brief "<topic>" [--budget TOKENS]');
    process.exit(1);
  }
  if (argv.includes('--brief')) {
    console.log(brief(brain, text, { budget: Number(opt('--budget')) || 2000 }));
    return;
  }
  const hits = search(brain, text, { limit: Number(opt('--limit')) || 5 });
  if (argv.includes('--json')) process.stdout.write(JSON.stringify(hits, null, 2) + '\n');
  else console.log(format(text, hits));
}

if (require.main === module) main();

module.exports = { search, brief, format, terms };
