#!/usr/bin/env node
/**
 * mcp-servers.js — reads recommended-mcp-servers.json and renders the MCP
 * capability offer for /brain:init (ROADMAP "MCP capability registry", v0.25.0).
 * Mirrors plugins.js exactly, extended from Claude Code plugins to MCP servers.
 *
 * Stdlib only, Node >= 18.
 *
 * Modes:
 *   node mcp-servers.js [--project <root>]            pretty table (default)
 *   node mcp-servers.js [--project <root>] --verbose   + each server's brain-integration line
 *   node mcp-servers.js --json                         raw manifest (no project scan)
 *
 * Detects which curated servers are already configured by reading the
 * project's .mcp.json (mcpServers keys) — never installs, never touches a
 * credential. Any configured server outside the curated list surfaces under
 * a generic "detected, no filing rules yet" fallback so nothing connected is
 * silently invisible. Fails open: a missing/malformed .mcp.json is treated
 * as "no servers configured", never a crash.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, '..', 'recommended-mcp-servers.json');
const OWN_SERVER = 'brain-search'; // the brain's own MCP server — not a foreign capability

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}

function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function configuredServers(projectRoot) {
  if (!projectRoot) return [];
  const cfg = readJsonSafe(path.join(projectRoot, '.mcp.json'), {});
  const servers = (cfg && typeof cfg === 'object' && cfg.mcpServers) || {};
  return Object.keys(servers).filter((n) => n !== OWN_SERVER);
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function render(manifest, opts) {
  const configured = new Set(opts.configured || []);
  const curatedNames = new Set(manifest.servers.map((s) => s.name));
  const unrecognized = [...configured].filter((n) => !curatedNames.has(n));

  const lines = [];
  lines.push('🐵 Recommended MCP servers — the connected-data layer for this brain');
  lines.push(`Contract: ${manifest.contract}`);
  lines.push('');
  const catW = Math.max(...manifest.servers.map((s) => s.category.length), 8);
  const nameW = Math.max(...manifest.servers.map((s) => s.name.length), 12);
  for (const s of manifest.servers) {
    const to = (s.records || []).map((r) => r.to).join(', ');
    const mark = configured.has(s.name) ? '✓' : ' ';
    lines.push(`${mark} ${pad(s.category, catW)}  ${pad(s.name, nameW)}  ${pad(s.fires_on, 40)} → ${to}`);
    if (opts.verbose) {
      lines.push(`  ${' '.repeat(catW + nameW + 4)}${s.brain_integration}`);
      if (s.precedence) lines.push(`  ${' '.repeat(catW + nameW + 4)}↳ precedence: ${s.precedence}`);
      lines.push(`  ${' '.repeat(catW + nameW + 4)}setup: ${s.setup_hint}`);
    }
  }
  lines.push('');
  lines.push('✓ already configured in this project\'s .mcp.json.');
  lines.push('Offer the rest by handing over setup_hint — confirm the exact command with the curator; the brain never runs it or touches a credential.');
  if (unrecognized.length) {
    lines.push('');
    lines.push(`Detected but not yet in the curated registry (no filing rules yet): ${unrecognized.join(', ')}`);
  }
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  let manifest;
  try {
    manifest = loadManifest();
  } catch (e) {
    console.error(`mcp-servers: cannot read recommended-mcp-servers.json (${e.message})`);
    process.exit(1);
  }
  if (argv.includes('--json')) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
    return;
  }
  const projectIdx = argv.indexOf('--project');
  const projectRoot = projectIdx !== -1 ? path.resolve(argv[projectIdx + 1]) : process.cwd();
  const configured = configuredServers(projectRoot);
  console.log(render(manifest, { verbose: argv.includes('--verbose'), configured }));
}

if (require.main === module) main();

module.exports = { loadManifest, render, configuredServers, MANIFEST };
