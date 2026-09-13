#!/usr/bin/env node
/**
 * instinct-track.js — hook (PostToolUse on Write|Edit|MultiEdit).
 *
 * Two jobs, both advisory (never a block):
 *
 * 1. Learned bans (v3 P15) — the text this write added is checked against the
 *    `warn`-level bans (active instincts with `ban:`, and the bans.json of any
 *    pack a workstream declares); matches come back in the same turn so the
 *    model fixes them. `enforce: block` bans are refused earlier, in guards.js.
 *
 * 2. The Gap-#9 feedback loop (ROADMAP Phase 5 item 1): "3+ rewrites of the
 *    same file → candidate rule in instincts/pending/". A script cannot judge
 *    whether an edit is a *correction*, so it uses the lowest-noise proxy it
 *    CAN see: how many DISTINCT sessions have revised the same file. Counts
 *    live in .brain/sessions/edit-counts.json (at most once per file per
 *    session); at the threshold (default 3; MONKEY_BRAIN_INSTINCT_THRESHOLD) it
 *    suggests an instinct once per file. "Scripts notice; the model writes the rule."
 *
 * Never counted: hook-written / always-changing files (log, index, dashboard,
 * resume, sessions/, Clippings/). Outside a brain, on a deleted/foreign file,
 * or on any internal error: silent no-op, exit 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const bans = require(path.join(__dirname, 'bans.js'));

const THRESHOLD = Math.max(2, Number(process.env.MONKEY_BRAIN_INSTINCT_THRESHOLD || 3));

/** Paths (relative to the brain) whose churn is bookkeeping, not correction. */
function isExempt(relFromBrain) {
  const rel = relFromBrain.split(path.sep).join('/');
  return (
    rel === 'resume.md' ||
    rel === 'wiki/log.md' ||
    rel === 'wiki/index.md' ||
    rel === 'wiki/dashboard.md' ||
    rel.startsWith('sessions/') ||
    rel.startsWith('Clippings/') ||
    rel.startsWith('.git/')
  );
}

/** Count this session's revision of `key`; returns the advisory when it first crosses the threshold. */
function countSession(brain, key, session) {
  const dir = path.join(brain, 'sessions');
  const store = path.join(dir, 'edit-counts.json');
  const data = lib.readJsonSafe(store, {}) || {};
  const rec = data[key] || { count: 0, lastSession: null, flagged: false };
  if (rec.lastSession !== session) {
    rec.count += 1;
    rec.lastSession = session;
  }
  const fire = rec.count >= THRESHOLD && !rec.flagged;
  if (fire) rec.flagged = true;
  data[key] = rec;
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(store, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch {
    return ''; // can't persist → don't advise on a number we didn't save
  }
  return fire
    ? `🐵 instinct-track: \`${key}\` has been revised across ${rec.count} separate sessions. ` +
        `If the same kind of fix keeps recurring here, capture it as a rule in \`instincts/pending/\` ` +
        `(template: \`templates/instinct.md\`) so it sticks and auto-injects at session start — ` +
        `the curator promotes it to \`instincts/active/\`. (Advisory, fires once per file.)`
    : '';
}

async function main() {
  const input = await lib.readStdinJson();
  const ti = input.tool_input || {};
  const fp = ti.file_path;
  if (!fp) return;
  const abs = path.resolve(fp);
  if (!fs.existsSync(abs)) return; // deleted or moved — nothing to tally

  // Anchor to the project's brain; the file may live anywhere in the project,
  // keyed by its path relative to the project root (the brain's parent).
  const brain = lib.findBrainDir(path.dirname(abs));
  if (!brain) return;
  const relProject = path.relative(path.dirname(brain), abs);
  if (relProject.startsWith('..')) return; // outside this project
  const key = relProject.split(path.sep).join('/');
  const inBrain = abs.startsWith(brain + path.sep);
  const notes = [];

  if (!inBrain) {
    const added = typeof ti.content === 'string'
      ? ti.content
      : Array.isArray(ti.edits) ? ti.edits.map((e) => e.new_string || '').join('\n') : ti.new_string || '';
    const hits = bans.findMatches(added, key, bans.loadBans(brain).filter((b) => b.enforce !== 'block'));
    if (hits.length) {
      notes.push(
        `🐵 learned bans — this write to \`${key}\` adds: ` +
          hits.map((h) => `\`${h.ban.name}\` (${h.ban.source}; line ${h.line} of the new text: "${h.snippet}") — ${h.ban.rule}`).join(' · ') +
          ' Fix it now unless the curator has accepted an exception.'
      );
    }
  }

  if (!(inBrain && isExempt(path.relative(brain, abs)))) {
    const advisory = countSession(brain, key, String(input.session_id || 'nosession'));
    if (advisory) notes.push(advisory);
  }

  if (notes.length) {
    lib.succeed({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: notes.join('\n\n') } });
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
