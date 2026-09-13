#!/usr/bin/env node
/**
 * graph.js — zero-dependency import graph + blast radius (v3 P13).
 *
 * Scans a project's source (JS/TS, Python, Go, C#) for imports, resolves the
 * ones that point inside the project, and caches the graph in
 * .brain/sessions/graph.json keyed by file mtime, so a rebuild only re-reads
 * files that changed. `radius` walks dependents (who imports the anchors) up
 * to 2 hops and scores the change — files × modules (directories) spanned ×
 * file types — into a suggested tier and model. /brain:plan uses the same
 * signal to pick a spec's tier, so a wide radius arms the plan gate.
 *
 *   node graph.js build [--root DIR]
 *   node graph.js radius <file|dir|keyword>... [--depth N] [--json] [--root DIR]
 *
 * Library: build(root, brain) · radius(graph, anchors, depth) · anchorsFor(graph, args)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', 'vendor', 'venv', 'env', '__pycache__', 'target',
  'bin', 'obj', 'coverage',
]);
const SOURCE = /\.(js|jsx|ts|tsx|mjs|cjs|py|go|cs)$/i;
const JS_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const MAX_FILES = 20000;
const posix = path.posix;

const relOf = (root, abs) => path.relative(root, abs).split(path.sep).join('/');

function walk(root) {
  const out = [];
  const stack = [root];
  while (stack.length && out.length < MAX_FILES) {
    const dir = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) stack.push(path.join(dir, e.name));
      } else if (SOURCE.test(e.name) && !e.name.endsWith('.d.ts')) {
        out.push(path.join(dir, e.name));
      }
    }
  }
  return out;
}

/** Raw import specifiers in one file, by language. */
function specifiers(file, text) {
  const ext = path.extname(file).toLowerCase();
  const out = [];
  if (ext === '.py') {
    for (const m of text.matchAll(/^\s*from\s+(\.*[\w.]*)\s+import\s+\(?([\w\s,*]+)/gm)) {
      out.push(m[1]);
      for (const name of m[2].split(',').map((s) => s.trim().split(/\s+/)[0]).filter((s) => s && s !== '*')) {
        out.push(/^\.+$/.test(m[1]) ? m[1] + name : `${m[1]}.${name}`);
      }
    }
    for (const m of text.matchAll(/^\s*import\s+([\w.]+(?:\s*,\s*[\w.]+)*)/gm)) {
      for (const p of m[1].split(',')) out.push(p.trim());
    }
  } else if (ext === '.go') {
    for (const m of text.matchAll(/import\s*\(([\s\S]*?)\)/g)) for (const q of m[1].matchAll(/"([^"]+)"/g)) out.push(q[1]);
    for (const m of text.matchAll(/import\s+(?:[\w.]+\s+)?"([^"]+)"/g)) out.push(m[1]);
  } else if (ext === '.cs') {
    for (const m of text.matchAll(/^\s*using\s+(?:static\s+)?([\w.]+)\s*;/gm)) out.push(m[1]);
  } else {
    for (const m of text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) out.push(m[1]);
    for (const m of text.matchAll(/\bimport\s+['"]([^'"]+)['"]/g)) out.push(m[1]);
    for (const m of text.matchAll(/\b(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1]);
    // CommonJS tooling idiom: require(path.join(__dirname, '..', 'lib.js')).
    for (const m of text.matchAll(/\b(?:require|import)\s*\(\s*path\.(?:join|resolve)\s*\(\s*__dirname((?:\s*,\s*['"][^'"]+['"])+)\s*\)\s*\)/g)) {
      out.push('./' + [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((q) => q[1]).join('/'));
    }
  }
  return [...new Set(out)];
}

/** Maps (file, specifier) → project files it refers to. */
function resolver(root, entries) {
  const has = new Set(Object.keys(entries));
  const goModule = (/^module\s+(\S+)/m.exec(lib.readTextSafe(path.join(root, 'go.mod'))) || [])[1] || '';
  const goDirs = new Map();
  const namespaces = new Map();
  for (const [rel, e] of Object.entries(entries)) {
    if (rel.endsWith('.go') && !rel.endsWith('_test.go')) {
      const d = posix.dirname(rel);
      if (!goDirs.has(d)) goDirs.set(d, []);
      goDirs.get(d).push(rel);
    }
    if (e.ns) {
      if (!namespaces.has(e.ns)) namespaces.set(e.ns, []);
      namespaces.get(e.ns).push(rel);
    }
  }
  const first = (cands) => { const hit = cands.find((c) => has.has(c)); return hit ? [hit] : []; };

  return (rel, spec) => {
    const ext = posix.extname(rel).toLowerCase();
    if (ext === '.py') {
      const dots = (/^\.*/.exec(spec) || [''])[0].length;
      const parts = spec.slice(dots).split('.').filter(Boolean);
      if (dots) {
        let base = posix.dirname(rel);
        for (let i = 1; i < dots; i++) base = posix.dirname(base);
        const stem = posix.join(base, ...parts);
        return first(parts.length ? [`${stem}.py`, `${stem}/__init__.py`] : [posix.join(base, '__init__.py')]);
      }
      const stem = parts.join('/');
      return first([`${stem}.py`, `${stem}/__init__.py`, `src/${stem}.py`, `src/${stem}/__init__.py`]);
    }
    if (ext === '.go') {
      if (!goModule || (spec !== goModule && !spec.startsWith(goModule + '/'))) return [];
      return (goDirs.get(spec === goModule ? '.' : spec.slice(goModule.length + 1)) || []).filter((f) => f !== rel);
    }
    if (ext === '.cs') return (namespaces.get(spec) || []).filter((f) => f !== rel);
    if (!spec.startsWith('.')) return [];
    const base = posix.normalize(posix.join(posix.dirname(rel), spec));
    if (base.startsWith('..')) return [];
    const noJs = base.replace(/\.(m|c)?js$/, '');
    return first([
      base,
      ...JS_EXT.map((e) => noJs + e),
      ...JS_EXT.map((e) => `${base}/index${e}`),
    ]);
  };
}

function build(root, brain) {
  const t0 = Date.now();
  const cacheFile = brain ? path.join(brain, 'sessions', 'graph.json') : null;
  const cache = (cacheFile && lib.readJsonSafe(cacheFile, null)) || {};
  const prev = cache.root === path.resolve(root) ? cache.files || {} : {};
  const entries = {};
  let reused = 0;
  const files = walk(root);
  for (const f of files) {
    const rel = relOf(root, f);
    let mtime = 0;
    try { mtime = fs.statSync(f).mtimeMs; } catch {}
    if (prev[rel] && prev[rel].mtime === mtime) {
      entries[rel] = prev[rel];
      reused++;
      continue;
    }
    const text = lib.readTextSafe(f);
    const ns = /\.cs$/i.test(f) ? (/^\s*namespace\s+([\w.]+)/m.exec(text) || [])[1] || '' : '';
    entries[rel] = { mtime, specs: specifiers(f, text), ns };
  }
  const resolve = resolver(root, entries);
  const edges = {};
  let imports = 0;
  for (const [rel, e] of Object.entries(entries)) {
    const targets = new Set();
    for (const s of e.specs) for (const t of resolve(rel, s)) if (t !== rel) targets.add(t);
    edges[rel] = [...targets];
    imports += targets.size;
  }
  const graph = { builtAt: new Date().toISOString(), root: path.resolve(root), files: entries, edges };
  if (cacheFile) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(graph) + '\n', 'utf8');
    } catch {}
  }
  return { graph, stats: { files: files.length, imports, reused, ms: Date.now() - t0 } };
}

/** Files named by path, by directory, or by a keyword in the path. */
function anchorsFor(graph, args) {
  const all = Object.keys(graph.files);
  const out = new Set();
  for (const a of args) {
    const rel = relOf(graph.root, path.resolve(a));
    if (graph.files[rel]) { out.add(rel); continue; }
    const inside = rel && !rel.startsWith('..') ? all.filter((f) => f.startsWith(rel.replace(/\/$/, '') + '/')) : [];
    const matches = inside.length ? inside : all.filter((f) => f.toLowerCase().includes(a.toLowerCase()));
    for (const f of matches) out.add(f);
  }
  return [...out];
}

function radius(graph, anchors, depth = 2) {
  const dependentsOf = new Map();
  for (const [from, tos] of Object.entries(graph.edges)) {
    for (const to of tos) {
      if (!dependentsOf.has(to)) dependentsOf.set(to, []);
      dependentsOf.get(to).push(from);
    }
  }
  const hops = new Map(anchors.map((a) => [a, 0]));
  let frontier = [...anchors];
  for (let d = 1; d <= depth; d++) {
    const next = [];
    for (const f of frontier) {
      for (const dep of dependentsOf.get(f) || []) {
        if (!hops.has(dep)) { hops.set(dep, d); next.push(dep); }
      }
    }
    frontier = next;
  }
  const files = [...hops.keys()];
  const modules = [...new Set(files.map((f) => posix.dirname(f)))];
  const types = [...new Set(files.map((f) => posix.extname(f).toLowerCase()))];
  const score = files.length * modules.length * types.length;
  const tier = !files.length ? 'unknown' : score <= 3 ? 'quick' : score <= 45 ? 'feature' : 'architecture';
  const model = {
    unknown: '—',
    quick: 'sonnet (routine work)',
    feature: 'sonnet to build, the main model to review',
    architecture: 'the main model to plan and review; sonnet for AC slices',
  }[tier];
  const dependents = files.filter((f) => hops.get(f) > 0).sort((a, b) => hops.get(a) - hops.get(b) || a.localeCompare(b));
  return { anchors, files, dependents, hops: Object.fromEntries(hops), modules, types, score, tier, model };
}

function format(r, stats) {
  if (!r.anchors.length) return '🧭 No source files match those anchors — pass file paths, directories, or a keyword from file names.';
  const list = (xs, n) => xs.slice(0, n).join(', ') + (xs.length > n ? ` (+${xs.length - n} more)` : '');
  return [
    `🧭 Blast radius — ${list(r.anchors, 3)}`,
    `   touches ${r.files.length} file(s) across ${r.modules.length} module(s) · ${r.types.length} file type(s) · score ${r.score}`,
    `   dependents (≤ 2 hops): ${r.dependents.length ? list(r.dependents, 8) : 'none'}`,
    `   suggested tier: ${r.tier}${r.tier === 'architecture' ? ' (arms the plan gate)' : ''} · model: ${r.model}`,
    `   graph: ${stats.files} files · ${stats.imports} internal imports · ${stats.reused} reused from cache · ${stats.ms} ms`,
  ].join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const valued = new Set(['--root', '--depth']);
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    if (valued.has(argv[i])) i++;
    else if (!argv[i].startsWith('--')) words.push(argv[i]);
  }
  const [cmd, ...args] = words;
  const brain = lib.findBrainDir(process.cwd());
  const root = path.resolve(opt('--root') || (brain ? path.dirname(brain) : process.cwd()));
  const cacheBrain = brain && path.dirname(brain) === root ? brain : null;
  if (cmd === 'build') {
    const { stats } = build(root, cacheBrain);
    console.log(`🧭 graph: ${stats.files} files · ${stats.imports} internal imports · ${stats.reused} reused from cache · ${stats.ms} ms`);
  } else if (cmd === 'radius' && args.length) {
    const { graph, stats } = build(root, cacheBrain);
    const r = radius(graph, anchorsFor(graph, args), Number(opt('--depth')) || 2);
    if (argv.includes('--json')) process.stdout.write(JSON.stringify({ ...r, stats }, null, 2) + '\n');
    else console.log(format(r, stats));
  } else {
    console.error('usage: graph.js build [--root DIR] | radius <file|dir|keyword>... [--depth N] [--json] [--root DIR]');
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { build, radius, anchorsFor };
