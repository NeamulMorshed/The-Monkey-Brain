#!/usr/bin/env node
/**
 * new-brain.js — scaffold engine behind /brain:init (ROADMAP Phase 3).
 *
 * Cross-platform Node port of bootstrap/new-brain.ps1 so the skill works from
 * a marketplace install (only plugin/ ships — bootstrap/ stays the human-run
 * wrapper in the engine repo). Stdlib only, Node >= 18.
 *
 * Modes:
 *   --project <path> [--name <display>]   create <path>/.brain from the template
 *   --project <path> --update             refresh CLAUDE.md + templates/ only
 *                                         (adds resume.md when missing; never
 *                                         touches wiki/, raw-sources/, memory/)
 *   --project <path> --force              recreate, discarding knowledge (careful)
 *   --sync-template                       engine-repo dev only: re-copy
 *                                         schema/brain-template → the bundled
 *                                         copy next to this skill
 *
 * Template resolution: bundled copy (plugin/skills/init/brain-template) first,
 * falling back to the engine repo layout (schema/brain-template) when running
 * from a git clone. schema/brain-template is the canonical master; selftest.js
 * fails when the bundle drifts (fix with --sync-template).
 */
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const a = { project: null, name: null, update: false, force: false, sync: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--project') a.project = argv[++i];
    else if (t === '--name') a.name = argv[++i];
    else if (t === '--update') a.update = true;
    else if (t === '--force') a.force = true;
    else if (t === '--sync-template') a.sync = true;
    else fail(`Unknown argument: ${t}`);
  }
  return a;
}

function fail(msg) {
  console.error(`new-brain: ${msg}`);
  process.exit(1);
}

const BUNDLED = path.join(__dirname, '..', 'brain-template');

/** Walk up from this file to the engine repo root (dev-clone fallback). */
function findEngineRoot() {
  let dir = __dirname;
  for (;;) {
    if (
      fs.existsSync(path.join(dir, 'schema', 'brain-template')) &&
      fs.existsSync(path.join(dir, '.claude-plugin', 'marketplace.json'))
    )
      return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function resolveTemplate() {
  if (fs.existsSync(path.join(BUNDLED, 'CLAUDE.md'))) return BUNDLED;
  const engine = findEngineRoot();
  if (engine) return path.join(engine, 'schema', 'brain-template');
  return null;
}

function expandPlaceholders(file, name, date) {
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.split('{{PROJECT}}').join(name).split('{{DATE}}').join(date), 'utf8');
}

function mdFilesUnder(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...mdFilesUnder(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function main() {
  const a = parseArgs(process.argv.slice(2));

  if (a.sync) {
    const engine = findEngineRoot();
    if (!engine) fail('--sync-template only works inside the engine repo (schema/brain-template not found above this file).');
    const master = path.join(engine, 'schema', 'brain-template');
    fs.rmSync(BUNDLED, { recursive: true, force: true });
    fs.cpSync(master, BUNDLED, { recursive: true });
    const n = mdFilesUnder(BUNDLED).length;
    console.log(`Synced schema/brain-template → ${path.relative(engine, BUNDLED)} (${n} md files).`);
    return;
  }

  if (!a.project) fail('--project <path> is required.');
  if (!fs.existsSync(a.project)) fail(`Project path does not exist: ${a.project}`);
  const project = path.resolve(a.project);
  const brain = path.join(project, '.brain');
  const name = a.name && a.name.trim() ? a.name.trim() : path.basename(project);
  const date = today();
  const template = resolveTemplate();
  if (!template) fail('No brain template found (bundled copy missing and not inside the engine repo).');

  if (a.update) {
    if (!fs.existsSync(brain)) fail(`No .brain at ${brain} to update. Run without --update to create it.`);
    fs.copyFileSync(path.join(template, 'CLAUDE.md'), path.join(brain, 'CLAUDE.md'));
    expandPlaceholders(path.join(brain, 'CLAUDE.md'), name, date);
    fs.cpSync(path.join(template, 'templates'), path.join(brain, 'templates'), { recursive: true });
    for (const f of mdFilesUnder(path.join(brain, 'templates'))) expandPlaceholders(f, name, date);
    // resume.md holds live work state: add only when missing, never overwrite.
    const resumeSrc = path.join(template, 'resume.md');
    const resumeDst = path.join(brain, 'resume.md');
    if (fs.existsSync(resumeSrc) && !fs.existsSync(resumeDst)) {
      fs.copyFileSync(resumeSrc, resumeDst);
      expandPlaceholders(resumeDst, name, date);
      console.log('Added resume.md (new in schema).');
    }
    console.log(`Refreshed schema in ${brain} for '${name}' (knowledge left untouched).`);
    return;
  }

  if (fs.existsSync(brain)) {
    if (a.force) fs.rmSync(brain, { recursive: true, force: true });
    else fail(`.brain already exists at ${brain}. Use --update to refresh schema, or --force to recreate.`);
  }

  fs.cpSync(template, brain, { recursive: true });
  for (const f of mdFilesUnder(brain)) expandPlaceholders(f, name, date);

  const pages = mdFilesUnder(path.join(brain, 'wiki')).length;
  console.log(`Created .brain for '${name}' (${pages} seed pages) at ${brain}`);
  console.log('Next:');
  console.log('  1. Ensure a root CLAUDE.md imports it: @.brain/CLAUDE.md');
  console.log('  2. Drop a doc in .brain/raw-sources/ (or Clippings/, or paste in chat) and say "ingest this"');
  console.log('  3. Open .brain/ as an Obsidian vault to browse the graph');
}

main();
