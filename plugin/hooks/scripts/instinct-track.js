#!/usr/bin/env node
/**
 * instinct-track.js — hook (PostToolUse on Write|Edit|MultiEdit).
 *
 * The Gap-#9 feedback loop, mechanized (ROADMAP Phase 5 item 1): "3+ rewrites
 * of the same file → candidate rule in instincts/pending/". A script cannot
 * judge whether an edit is a *correction* — so it uses the lowest-noise proxy
 * it CAN see: how many DISTINCT sessions have revised the same file. A file
 * touched across three separate sessions is a real trouble spot; iterating on
 * it many times within one session is not. Counts live in
 * .brain/sessions/edit-counts.json (increment at most once per file per
 * session).
 *
 * At the threshold (default 3 sessions; MONKEY_BRAIN_INSTINCT_THRESHOLD) the
 * hook emits a ONCE-PER-FILE advisory (never a block) suggesting an instinct in
 * instincts/pending/ — the model/curator decides if a rule is really warranted.
 * "Scripts notice; the model writes the rule" (mirrors wrap.js).
 *
 * Never counted: hook-written / always-changing files (log, index, dashboard,
 * resume, sessions/, Clippings/) and the counts file itself. Outside a brain,
 * on a deleted/foreign file, or on any internal error: silent no-op, exit 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

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

async function main() {
  const input = await lib.readStdinJson();
  const fp = (input.tool_input || {}).file_path;
  if (!fp) return;
  const abs = path.resolve(fp);
  if (!fs.existsSync(abs)) return; // deleted or moved — nothing to tally

  // Anchor the counter to the project's brain; the tracked file may live
  // anywhere in the project (source code included), keyed by its path
  // relative to the project root (the brain's parent).
  const brain = lib.findBrainDir(path.dirname(abs));
  if (!brain) return;
  const projectRoot = path.dirname(brain);
  const relProject = path.relative(projectRoot, abs);
  if (relProject.startsWith('..')) return; // outside this project

  // Exempt hook-written / always-changing files under the brain.
  if (abs.startsWith(brain + path.sep) && isExempt(path.relative(brain, abs))) return;

  const session = String(input.session_id || 'nosession');
  const dir = path.join(brain, 'sessions');
  const store = path.join(dir, 'edit-counts.json');
  const key = relProject.split(path.sep).join('/');

  const data = lib.readJsonSafe(store, {}) || {};
  const rec = data[key] || { count: 0, lastSession: null, flagged: false };

  // Count distinct editing sessions, not raw edits: only a new session bumps it.
  if (rec.lastSession !== session) {
    rec.count += 1;
    rec.lastSession = session;
  }
  data[key] = rec;

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(store, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch {
    return; // can't persist → don't advise on a number we didn't save
  }

  if (rec.count >= THRESHOLD && !rec.flagged) {
    rec.flagged = true;
    data[key] = rec;
    try {
      fs.writeFileSync(store, JSON.stringify(data, null, 2) + '\n', 'utf8');
    } catch {}
    lib.succeed({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          `🐵 instinct-track: \`${key}\` has been revised across ${rec.count} separate sessions. ` +
          `If the same kind of fix keeps recurring here, capture it as a rule in \`instincts/pending/\` ` +
          `(template: \`templates/instinct.md\`) so it sticks and auto-injects at session start — ` +
          `the curator promotes it to \`instincts/active/\`. (Advisory, fires once per file.)`,
      },
    });
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
