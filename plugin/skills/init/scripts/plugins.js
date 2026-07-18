#!/usr/bin/env node
/**
 * plugins.js — reads recommended-plugins.json and prints the capability-plugin
 * offer for /brain:init (ROADMAP Phase 6). The manifest is the data; this is the
 * deterministic presenter, in the same spirit as lint.js (a script does the
 * mechanical part, the skill does the judgment — which subset to offer).
 *
 * Stdlib only, Node >= 18.
 *
 * Modes:
 *   node plugins.js            pretty table for the init offer (default)
 *   node plugins.js --verbose  + each plugin's brain-integration line
 *   node plugins.js --json     raw manifest (for the doctor / programmatic use)
 *
 * The contract this encodes: plugins do the craft; the brain records the
 * knowledge. Every entry names the .brain/ folder its output is filed into.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, '..', 'recommended-plugins.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function render(manifest, opts) {
  const lines = [];
  lines.push('🐵 Recommended capability plugins — the craft layer for this brain');
  lines.push(`Contract: ${manifest.contract}`);
  lines.push('');
  const catW = Math.max(...manifest.plugins.map((p) => p.category.length), 8);
  const nameW = Math.max(...manifest.plugins.map((p) => p.name.length), 12);
  for (const p of manifest.plugins) {
    const to = (p.records || []).map((r) => r.to).join(', ');
    lines.push(`  ${pad(p.category, catW)}  ${pad(p.name, nameW)}  ${pad(p.fires_on, 28)} → ${to}`);
    if (opts.verbose) {
      lines.push(`  ${' '.repeat(catW + nameW + 4)}${p.brain_integration}`);
      if (p.precedence) lines.push(`  ${' '.repeat(catW + nameW + 4)}↳ precedence: ${p.precedence}`);
    }
  }
  lines.push('');
  lines.push(`Install with /plugin (${manifest.install.how.split('.')[0]}).`);
  lines.push('/brain:init offers these — confirm the exact command with the curator before installing.');
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  let manifest;
  try {
    manifest = loadManifest();
  } catch (e) {
    console.error(`plugins: cannot read recommended-plugins.json (${e.message})`);
    process.exit(1);
  }
  if (argv.includes('--json')) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
    return;
  }
  console.log(render(manifest, { verbose: argv.includes('--verbose') }));
}

if (require.main === module) main();

module.exports = { loadManifest, render, MANIFEST };
