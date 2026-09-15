#!/usr/bin/env node
/**
 * wrap.js — hook #6 (Stop + SessionEnd).
 *
 * "Everything leaves a trace" (ROADMAP design principle 4), split by what a
 * script may own:
 *
 *   Stop (the REMINDERS): three checks, each shown at most ONCE per session —
 *   wiki pages changed after the last log write (append the log entry, or run
 *   /brain:wrap); the last logged step was build/review but no ADR was distilled
 *   to decisions/ (Phase 5 auto-distillation); .brain/ has uncommitted git
 *   changes (same check as doctor.js #7, just automatic). Since v0.28.0 all three
 *   run on every Stop and block ONCE with every unmet item listed, so a clean
 *   wrap never needs three Stop attempts. The narrative itself belongs to the
 *   model, and the commit itself belongs to the curator — a script only notices
 *   either is missing, never writes or commits itself.
 *
 *   SessionEnd (the MECHANIC): self-heal wiki/index.md frontmatter stats
 *   (source_count / page_count / updated) from the filesystem — deterministic
 *   bookkeeping, zero model tokens. Plus, when the brain opted into qmd, a
 *   detached `qmd update` re-index so new pages are searchable next session.
 *
 * Loop protection on Stop: stop_hook_active input flag + a once-per-session
 * marker file in the OS temp dir. Outside a brain, or on any internal error:
 * silent exit 0 — this hook must never trap a session.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));

/** Wiki work is "unlogged" when a page changed this much after the last log write. */
const GRACE_MS = 90_000;
/** An ADR filed within this window of the build/review log entry counts as "distilled". */
const DECIDE_GRACE_MS = 15 * 60_000;

function newestWikiMtime(wikiDir, logPath) {
  // index.md is skipped too: SessionEnd's refreshIndex rewrites it after the log (v0.30.0).
  const idxPath = path.join(path.dirname(logPath), 'index.md');
  let newest = 0;
  for (const f of lib.listFilesRecursive(wikiDir, '.md')) {
    const abs = path.resolve(f);
    if (abs === logPath || abs === idxPath) continue;
    try {
      const m = fs.statSync(f).mtimeMs;
      if (m > newest) newest = m;
    } catch {}
  }
  return newest;
}

function newestMtimeUnder(dir) {
  let newest = 0;
  for (const f of lib.listFilesRecursive(dir, '.md')) {
    try {
      const m = fs.statSync(f).mtimeMs;
      if (m > newest) newest = m;
    } catch {}
  }
  return newest;
}

/**
 * Each Stop check returns { marker, reason } when its item is unmet and not yet shown this
 * session, else null. main() runs all three, writes every returned marker, and blocks ONCE
 * with the reasons joined — one Stop attempt surfaces everything (v0.28.0), instead of one
 * check per attempt.
 */
function sessionMarker(prefix, input) {
  return path.join(os.tmpdir(), `${prefix}-${String(input.session_id || 'nosession').replace(/[^\w-]/g, '')}`);
}

function stopCheck(input, brain) {
  if (input.stop_hook_active) return null;
  const marker = sessionMarker('mb-wrap', input);
  if (fs.existsSync(marker)) return null;

  const logPath = path.resolve(path.join(brain, 'wiki', 'log.md'));
  if (!fs.existsSync(logPath)) return null;
  const logM = fs.statSync(logPath).mtimeMs;
  const wikiM = newestWikiMtime(path.join(brain, 'wiki'), logPath);
  if (wikiM - logM <= GRACE_MS) return null;

  return {
    marker,
    reason:
      `🐵 wrap[log]: wiki pages changed after the last wiki/log.md entry — the audit trail is behind. ` +
      `Append \`## [${lib.today()}] <ingest|query|lint|session> | <what happened>\` to wiki/log.md ` +
      `(append-only), make sure index counts are current, then finish. ` +
      `(Or run /brain:wrap for the full definition-of-done. This reminder fires once per session.)`,
  };
}

/**
 * Auto-distillation nudge (ROADMAP Phase 5 item 2). After a session whose LAST
 * logged step was `build |` or `review |`, if no ADR was filed to decisions/
 * within ~15 min of that log entry, block the stop ONCE to prompt distilling
 * the "why" into decisions/. The script only notices the gap — the model writes
 * the ADR (same split as the log reminder). Uses relative mtimes only (no
 * session clock), matching stopCheck. Pre-v2 brains (no decisions/) opt out.
 */
function decisionCheck(input, brain) {
  if (input.stop_hook_active) return null;
  const decisionsDir = path.join(brain, 'decisions');
  if (!fs.existsSync(decisionsDir)) return null;
  const marker = sessionMarker('mb-decide', input);
  if (fs.existsSync(marker)) return null;

  const logPath = path.resolve(path.join(brain, 'wiki', 'log.md'));
  const logText = lib.readTextSafe(logPath);
  if (!logText) return null;
  const heads = [...logText.matchAll(/^##\s*\[[^\]]*\]\s*([A-Za-z]+)\s*\|/gm)].map((x) => x[1].toLowerCase());
  const last = heads.length ? heads[heads.length - 1] : '';
  if (last !== 'build' && last !== 'review') return null;

  let logM = 0;
  try { logM = fs.statSync(logPath).mtimeMs; } catch { return null; }
  const decM = newestMtimeUnder(decisionsDir); // 0 when empty
  if (logM - decM <= DECIDE_GRACE_MS) return null; // an ADR is ~as fresh as the build/review

  return {
    marker,
    reason:
      `🐵 wrap[decisions]: the last logged step was \`${last}\`, but no ADR was filed to decisions/ since. ` +
      `Distill this session's key decisions — the "why", not just the "what" — into ` +
      `decisions/<slug>.md (template: templates/decision.md) so the reasoning survives every future session. ` +
      `(Or run /brain:wrap. This reminder fires once per session.)`,
  };
}

/**
 * Uncommitted .brain/ changes nudge. Mirrors doctor.js check #7 ("uncommitted"),
 * but fires automatically on Stop instead of waiting for a manual /brain:doctor
 * run — the audit trail can otherwise sit unsaved for sessions at a time.
 * Advisory only: it never runs git commit/push itself (brain records, curator
 * acts — same boundary as pr.js and the MCP registry). Silent when .brain/
 * isn't inside a git repo, or git isn't installed.
 */
function gitCheck(input, brain) {
  if (input.stop_hook_active) return null;
  const marker = sessionMarker('mb-gitcheck', input);
  if (fs.existsSync(marker)) return null;

  // .brain/ only, minus hook-owned files; null outside a git repo or without git — silent.
  const git = lib.brainGitDirty(brain);
  const dirty = git ? git.count : 0;
  if (!dirty) return null;

  return {
    marker,
    reason:
      `🐵 wrap[git]: ${dirty} uncommitted change(s) in .brain/ — the trail is written but not saved. ` +
      `Run /brain:wrap to commit with the vault's conventions (or commit it yourself). ` +
      `(This reminder fires once per session.)`,
  };
}

/** Run every Stop check, remember each shown item for the session, block once with all of them. */
function stopNudges(input, brain) {
  const unmet = [stopCheck, decisionCheck, gitCheck].map((fn) => fn(input, brain)).filter(Boolean);
  if (!unmet.length) return;
  for (const u of unmet) {
    try { fs.writeFileSync(u.marker, ''); } catch {}
  }
  lib.succeed({ decision: 'block', reason: unmet.map((u) => u.reason).join('\n\n') });
}

function refreshIndex(brain) {
  const idxPath = path.join(brain, 'wiki', 'index.md');
  let text = lib.readTextSafe(idxPath);
  if (!text) return;
  const fm = lib.parseFrontmatter(text);
  if (fm.source_count === undefined && fm.page_count === undefined) return;

  const srcCount = lib
    .listFilesRecursive(path.join(brain, 'raw-sources'), '.md')
    .filter((f) => !f.split(path.sep).includes('assets')).length;
  const pageCount = lib.listFilesRecursive(path.join(brain, 'wiki'), '.md').length;
  if (fm.source_count === srcCount && fm.page_count === pageCount) return;

  // Rewrite only the three frontmatter lines; never touch the body.
  const m = /^---\r?\n[\s\S]*?\r?\n---/.exec(text);
  if (!m) return;
  let head = m[0]
    .replace(/^source_count:.*$/m, `source_count: ${srcCount}`)
    .replace(/^page_count:.*$/m, `page_count: ${pageCount}`)
    .replace(/^updated:.*$/m, `updated: ${lib.today()}`);
  fs.writeFileSync(idxPath, head + text.slice(m[0].length), 'utf8');
}

/**
 * Semantic-search re-index (Phase 5 item 3). Only when the brain opted into qmd
 * (empty `.qmd` marker or MONKEY_BRAIN_QMD=1): spawn `qmd update` DETACHED so
 * fresh pages are searchable next session. Best-effort — if qmd isn't installed
 * the spawn errors and is swallowed; never affects the hook's exit.
 */
function reindex(brain) {
  try {
    if (process.env.MONKEY_BRAIN_QMD !== '1' && !fs.existsSync(path.join(brain, '.qmd'))) return;
    const { spawn } = require('child_process');
    const c = spawn('qmd', ['update'], {
      cwd: brain,
      stdio: 'ignore',
      shell: process.platform === 'win32',
      windowsHide: true,
      detached: true,
    });
    c.on('error', () => {});
    c.unref();
  } catch {}
}

async function main() {
  const input = await lib.readStdinJson();
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;
  const evt = input.hook_event_name || '';
  if (evt === 'Stop') {
    stopNudges(input, brain); // one block listing every unmet item, each shown once per session
  } else if (evt === 'SessionEnd') {
    refreshIndex(brain);
    reindex(brain);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
