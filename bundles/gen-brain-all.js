#!/usr/bin/env node
/**
 * gen-brain-all.js — regenerates the brain-all bundle's dependency list from
 * Anthropic's official marketplace catalog (claude-plugins-official).
 *
 *   node bundles/gen-brain-all.js           rewrite bundles/brain-all/.claude-plugin/plugin.json
 *   node bundles/gen-brain-all.js --check   exit 1 if the bundle drifted from the catalog
 *   --from <marketplace.json>               catalog to read (default: Claude Code's local cache;
 *                                           refresh it first: claude plugin marketplace update claude-plugins-official)
 *
 * A dependency the catalog drops leaves brain-all unloadable for every user
 * (dependency-unsatisfied) — run --check before each release.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const OFFICIAL = 'claude-plugins-official';
// Output styles contradict the brain's default terse mode.
const EXCLUDE = new Set(['explanatory-output-style', 'learning-output-style']);
const MANIFEST = path.join(__dirname, 'brain-all', '.claude-plugin', 'plugin.json');

const argv = process.argv.slice(2);
const fromIdx = argv.indexOf('--from');
const catalogPath = fromIdx >= 0
  ? argv[fromIdx + 1]
  : path.join(os.homedir(), '.claude', 'plugins', 'marketplaces', OFFICIAL, '.claude-plugin', 'marketplace.json');

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error(`gen-brain-all: cannot read the ${OFFICIAL} catalog at ${catalogPath} (${e.message}) — start claude once, or pass --from <marketplace.json>`);
  process.exit(1);
}

const names = catalog.plugins.map((p) => p.name).filter((n) => !EXCLUDE.has(n)).sort();
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const current = (manifest.dependencies || []).filter((d) => typeof d === 'object').map((d) => d.name);

if (argv.includes('--check')) {
  const gone = current.filter((n) => !names.includes(n));
  const added = names.filter((n) => !current.includes(n));
  console.log(`brain-all: ${current.length} official deps · catalog has ${names.length} (after ${EXCLUDE.size} exclusions)`);
  if (gone.length) console.log(`  dropped from the catalog (breaks the bundle): ${gone.join(', ')}`);
  if (added.length) console.log(`  new in the catalog: ${added.join(', ')}`);
  process.exit(gone.length || added.length ? 1 : 0);
}

manifest.dependencies = ['brain', ...names.map((name) => ({ name, marketplace: OFFICIAL }))];
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`brain-all: wrote brain + ${names.length} official dependencies (${[...EXCLUDE].join(', ')} excluded)`);
