#!/usr/bin/env node
/**
 * skills.js — reads recommended-skills.json and renders the skill-pack offer for
 * /brain:init (spec motion-skill-packs, v0.35.0). Mirrors mcp-servers.js, extended from
 * MCP servers to Claude Code skill packs.
 *
 * Stdlib only, Node >= 18.
 *
 *   node skills.js [--project <root>]                   pretty table (default)
 *   node skills.js [--project <root>] --verbose         + filing lines, hint, licence note
 *   node skills.js --json                               raw manifest
 *   node skills.js --seed-instincts <pack> --brain <p>  write the pack's curated rules to
 *                                                       <brain>/instincts/pending/ (never active/)
 *
 * Detection reads <root>/.claude/skills/<name>/SKILL.md and ~/.claude/skills/<name>/SKILL.md;
 * it never installs anything. Any installed skill outside every pack surfaces under "detected,
 * no filing rules yet". Fails open: a missing/malformed manifest or skills dir never crashes.
 *
 * Env (tests): MONKEY_BRAIN_HOME overrides the home dir; MONKEY_BRAIN_SKILLS_MANIFEST the manifest path.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const MANIFEST = path.join(__dirname, '..', 'recommended-skills.json');

function manifestPath() {
  return process.env.MONKEY_BRAIN_SKILLS_MANIFEST || MANIFEST;
}

function loadManifest(file) {
  return JSON.parse(fs.readFileSync(file || manifestPath(), 'utf8'));
}

/** The manifest, or null when missing/malformed/shape-wrong. */
function loadManifestSafe(file) {
  try {
    const m = loadManifest(file);
    return m && Array.isArray(m.packs) && m.packs.every((p) => p && p.id && Array.isArray(p.skills)) ? m : null;
  } catch {
    return null;
  }
}

function skillDirs(projectRoot) {
  const dirs = [];
  if (projectRoot) dirs.push(path.join(projectRoot, '.claude', 'skills'));
  dirs.push(path.join(process.env.MONKEY_BRAIN_HOME || os.homedir(), '.claude', 'skills'));
  return dirs;
}

/** Names of installed skills (a dir holding SKILL.md) in the project and user skills dirs. */
function installedSkills(projectRoot) {
  const names = new Set();
  for (const dir of skillDirs(projectRoot)) {
    try {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if ((e.isDirectory() || e.isSymbolicLink()) && fs.existsSync(path.join(dir, e.name, 'SKILL.md'))) names.add(e.name);
      }
    } catch {}
  }
  return names;
}

/** { state: 'installed' | 'partial' | 'none', have: [installed skill names of the pack] }. */
function packStatus(pack, installed) {
  const have = (pack.skills || []).filter((s) => installed.has(s));
  const state = have.length === 0 ? 'none' : have.length === pack.skills.length ? 'installed' : 'partial';
  return { state, have };
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function render(manifest, opts) {
  const installed = opts.installed || new Set();
  const packs = manifest.packs;
  const curated = new Set(packs.flatMap((p) => p.skills || []));
  const unrecognized = [...installed].filter((n) => !curated.has(n)).sort();
  const idW = Math.max(...packs.map((p) => p.id.length), 8);
  const indent = ' '.repeat(idW + 2);

  const lines = [];
  lines.push('🐵 Recommended skill packs - the craft layer for motion and video');
  lines.push(`Contract: ${manifest.contract}`);
  lines.push('');
  for (const p of packs) {
    const st = packStatus(p, installed);
    const label = st.state === 'installed' ? '✓ installed' : st.state === 'partial' ? `~ partial (${st.have.length}/${p.skills.length})` : '  not installed';
    lines.push(`${pad(p.id, idW)}  ${pad(label, 18)}  ${p.when}`);
    lines.push(`${indent}${p.skills.length} skills · ${p.context_cost}`);
    if (opts.verbose) {
      for (const f of p.filing || []) lines.push(`${indent}files: ${f.what} -> ${f.to}`);
      if (p.design_companion) lines.push(`${indent}pairs with: ${p.design_companion}`);
      if (p.licence_note) lines.push(`${indent}licence: ${p.licence_note}`);
      lines.push(`${indent}install: ${p.install_hint}`);
    }
  }
  lines.push('');
  lines.push('✓ every skill of the pack is installed (project or user scope).');
  lines.push('Offer a pack by handing over its install_hint; run it only after the curator says yes to that pack. The brain never installs by default.');
  if (unrecognized.length) {
    lines.push('');
    lines.push(`Detected but not in any pack (no filing rules yet): ${unrecognized.join(', ')}`);
  }
  return lines.join('\n');
}

function instinctFile(pack, rule, today) {
  const src = (pack.source && pack.source[0] && pack.source[0].repo) || pack.id;
  return [
    '---',
    `title: "Instinct - ${rule.name}"`,
    'type: instinct',
    'status: pending',
    `trigger: "${String(rule.trigger).replace(/"/g, "'")}"`,
    'confidence:',
    'enforce: warn',
    `created: ${today}`,
    `updated: ${today}`,
    'evidence: []',
    '---',
    '',
    `# ${rule.name}`,
    '',
    `**Rule:** ${rule.rule}`,
    '',
    `**Why:** ${rule.why}`,
    '',
    `**Scope:** ${rule.scope}`,
    '',
    `Source: curated from ${src} (the ${pack.id} skill pack); verify against upstream before promoting. Seeded by \`skills.js --seed-instincts\`; the curator promotes it to \`instincts/active/\`.`,
    '',
  ].join('\n');
}

/** Write a pack's curated rules to <brain>/instincts/pending/, skipping existing files. */
function seedInstincts(manifest, packId, brain) {
  const pack = manifest.packs.find((p) => p.id === packId);
  if (!pack) return { error: `unknown pack "${packId}" (known: ${manifest.packs.map((p) => p.id).join(', ')})` };
  const rules = (pack.instincts || []).slice(0, 6);
  if (!rules.length) return { error: `pack "${packId}" has no curated rules to seed` };
  if (!brain || !fs.existsSync(brain) || !fs.statSync(brain).isDirectory()) return { error: `brain directory not found: ${brain || '(none given)'}` };
  const dir = path.join(brain, 'instincts', 'pending');
  fs.mkdirSync(dir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const written = [];
  const skipped = [];
  for (const rule of rules) {
    const file = path.join(dir, `${rule.name}.md`);
    if (fs.existsSync(file) || fs.existsSync(path.join(brain, 'instincts', 'active', `${rule.name}.md`))) {
      skipped.push(rule.name);
      continue;
    }
    fs.writeFileSync(file, instinctFile(pack, rule, today), 'utf8');
    written.push(rule.name);
  }
  return { written, skipped };
}

function arg(argv, flag) {
  const i = argv.indexOf(flag);
  return i !== -1 ? argv[i + 1] : undefined;
}

function main() {
  const argv = process.argv.slice(2);
  const manifest = loadManifestSafe();
  if (!manifest) {
    console.log('skills: cannot read a valid recommended-skills.json manifest - no skill packs to offer.');
    if (argv.includes('--seed-instincts')) process.exit(1);
    return;
  }
  if (argv.includes('--json')) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
    return;
  }
  if (argv.includes('--seed-instincts')) {
    const brain = arg(argv, '--brain');
    const res = seedInstincts(manifest, arg(argv, '--seed-instincts'), brain ? path.resolve(brain) : '');
    if (res.error) {
      console.error(`skills: ${res.error}`);
      process.exit(1);
    }
    console.log(`seeded ${res.written.length} rule(s) into instincts/pending/${res.written.length ? ': ' + res.written.join(', ') : ''}${res.skipped.length ? `; skipped (already present): ${res.skipped.join(', ')}` : ''}`);
    return;
  }
  const project = arg(argv, '--project');
  const root = project ? path.resolve(project) : process.cwd();
  console.log(render(manifest, { verbose: argv.includes('--verbose'), installed: installedSkills(root) }));
}

if (require.main === module) main();

module.exports = { loadManifest, loadManifestSafe, installedSkills, packStatus, render, seedInstincts, MANIFEST };
