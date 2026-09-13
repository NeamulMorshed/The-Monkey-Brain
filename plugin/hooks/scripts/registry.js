#!/usr/bin/env node
/**
 * registry.js — the cross-project registry behind /brain:home.
 *
 * Every `.brain/` on the machine, in one place: ~/.claude/monkey-brain/
 * projects.json (or under CLAUDE_CONFIG_DIR), keyed by the project root's
 * resolved path (case-folded on Windows, since its filesystem is
 * case-insensitive). `register()` is called by new-brain.js when a brain is
 * scaffolded or updated; `touch()` is called by brain-status.js on every
 * session start, so a brain that predates this feature — or one nobody ever
 * re-inits — still shows up the next time someone opens it. `list()` prunes
 * entries whose `.brain/CLAUDE.md` is gone (moved, deleted, never committed
 * on this machine) before returning them, newest-active first.
 *
 * Best-effort by design: every function swallows its own I/O errors rather
 * than let a registry write break the hook or skill that called it.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const WIN = process.platform === 'win32';

function configDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function registryFile() {
  return path.join(configDir(), 'monkey-brain', 'projects.json');
}

const keyOf = (root) => { const r = path.resolve(root); return WIN ? r.toLowerCase() : r; };

function load() {
  try { return JSON.parse(fs.readFileSync(registryFile(), 'utf8')) || {}; } catch { return {}; }
}

function save(reg) {
  try {
    const f = registryFile();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  } catch {}
}

/** Add or refresh a project. `name` defaults to the root folder's basename. */
function register(root, name) {
  try {
    const reg = load();
    const k = keyOf(root);
    const now = new Date().toISOString();
    const prior = reg[k];
    reg[k] = {
      root: path.resolve(root),
      name: (name && String(name).trim()) || (prior && prior.name) || path.basename(path.resolve(root)),
      firstSeen: (prior && prior.firstSeen) || now,
      lastSeen: now,
    };
    save(reg);
  } catch {}
}

/** Bump lastSeen for an already-registered project; registers it if it wasn't. */
function touch(root) {
  try {
    const reg = load();
    const k = keyOf(root);
    if (!reg[k]) return register(root);
    reg[k].lastSeen = new Date().toISOString();
    save(reg);
  } catch {}
}

/** Every project whose `.brain/` still exists, newest-active first. Self-prunes the rest. */
function list() {
  try {
    const reg = load();
    const out = [];
    let changed = false;
    for (const [k, v] of Object.entries(reg)) {
      if (v && v.root && fs.existsSync(path.join(v.root, '.brain', 'CLAUDE.md'))) out.push(v);
      else { delete reg[k]; changed = true; }
    }
    if (changed) save(reg);
    out.sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));
    return out;
  } catch {
    return [];
  }
}

module.exports = { register, touch, list, registryFile };
