#!/usr/bin/env node
/**
 * wrap.js — hook #6 (Stop + SessionEnd).
 *
 * "Everything leaves a trace" (ROADMAP design principle 4), split by what a
 * script may own:
 *
 *   Stop (the REMINDER): if wiki pages changed after the last log write, block
 *   the stop ONCE per session with instructions to append the log entry (or
 *   run /brain:wrap). The narrative itself belongs to the model — a script
 *   only notices it is missing.
 *
 *   SessionEnd (the MECHANIC): self-heal wiki/index.md frontmatter stats
 *   (source_count / page_count / updated) from the filesystem — deterministic
 *   bookkeeping, zero model tokens. (Semantic re-index lands with qmd, P5.)
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

async function main() {
  const input = await lib.readStdinJson();
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;
  const evt = input.hook_event_name || '';
  if (evt === 'Stop') stopCheck(input, brain);
  else if (evt === 'SessionEnd') refreshIndex(brain);
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
