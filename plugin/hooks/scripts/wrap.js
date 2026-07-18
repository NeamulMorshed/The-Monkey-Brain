#!/usr/bin/env node
/**
 * wrap.js — hook #6 (Stop + SessionEnd).
 *
 * "Everything leaves a trace" (ROADMAP design principle 4), split by what a
 * script may own:
 *
 *   Stop (the REMINDERS): if wiki pages changed after the last log write, block
 *   the stop ONCE per session with instructions to append the log entry (or
 *   run /brain:wrap). Then, if the last logged step was build/review but no ADR
 *   was distilled to decisions/, block ONCE to prompt capturing the "why"
 *   (Phase 5 auto-distillation). The narrative itself belongs to the model — a
 *   script only notices it is missing.
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
const lib = require(path.join(__dirname, 'lib.js'));

/** Wiki work is "unlogged" when a page changed this much after the last log write. */
const GRACE_MS = 90_000;
/** An ADR filed within this window of the build/review log entry counts as "distilled". */
const DECIDE_GRACE_MS = 15 * 60_000;

function newestWikiMtime(wikiDir, logPath) {
  let newest = 0;
  for (const f of lib.listFilesRecursive(wikiDir, '.md')) {
    if (path.resolve(f) === logPath) continue;
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

function stopCheck(input, brain) {
  if (input.stop_hook_active) return;
  const marker = path.join(os.tmpdir(), `mb-wrap-${String(input.session_id || 'nosession').replace(/[^\w-]/g, '')}`);
  if (fs.existsSync(marker)) return;

  const logPath = path.resolve(path.join(brain, 'wiki', 'log.md'));
  if (!fs.existsSync(logPath)) return;
  const logM = fs.statSync(logPath).mtimeMs;
  const wikiM = newestWikiMtime(path.join(brain, 'wiki'), logPath);
  if (wikiM - logM <= GRACE_MS) return;

  fs.writeFileSync(marker, '');
  lib.succeed({
    decision: 'block',
    reason:
      `🐵 wrap[log]: wiki pages changed after the last wiki/log.md entry — the audit trail is behind. ` +
      `Append \`## [${lib.today()}] <ingest|query|lint|session> | <what happened>\` to wiki/log.md ` +
      `(append-only), make sure index counts are current, then finish. ` +
      `(Or run /brain:wrap for the full definition-of-done. This reminder fires once per session.)`,
  });
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
  if (input.stop_hook_active) return;
  const decisionsDir = path.join(brain, 'decisions');
  if (!fs.existsSync(decisionsDir)) return;
  const marker = path.join(os.tmpdir(), `mb-decide-${String(input.session_id || 'nosession').replace(/[^\w-]/g, '')}`);
  if (fs.existsSync(marker)) return;

  const logPath = path.resolve(path.join(brain, 'wiki', 'log.md'));
  const logText = lib.readTextSafe(logPath);
  if (!logText) return;
  const heads = [...logText.matchAll(/^##\s*\[[^\]]*\]\s*([A-Za-z]+)\s*\|/gm)].map((x) => x[1].toLowerCase());
  const last = heads.length ? heads[heads.length - 1] : '';
  if (last !== 'build' && last !== 'review') return;

  let logM = 0;
  try { logM = fs.statSync(logPath).mtimeMs; } catch { return; }
  const decM = newestMtimeUnder(decisionsDir); // 0 when empty
  if (logM - decM <= DECIDE_GRACE_MS) return;   // an ADR is ~as fresh as the build/review

  fs.writeFileSync(marker, '');
  lib.succeed({
    decision: 'block',
    reason:
      `🐵 wrap[decisions]: the last logged step was \`${last}\`, but no ADR was filed to decisions/ since. ` +
      `Distill this session's key decisions — the "why", not just the "what" — into ` +
      `decisions/<slug>.md (template: templates/decision.md) so the reasoning survives every future session. ` +
      `(Or run /brain:wrap. This reminder fires once per session.)`,
  });
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
    stopCheck(input, brain);   // may block+exit; otherwise fall through
    decisionCheck(input, brain);
  } else if (evt === 'SessionEnd') {
    refreshIndex(brain);
    reindex(brain);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
