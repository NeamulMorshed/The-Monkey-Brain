#!/usr/bin/env node
/**
 * snapshot.js — hook #5 (PreCompact).
 *
 * Compaction survival (ROADMAP Phase 2 #5 / Phase 5): before the context is
 * summarized, write a deterministic snapshot of the working state to
 * .brain/sessions/ so nothing is lost if the summary drops it. A script can't
 * write narrative — it preserves the live pointers instead: resume.md's open
 * next steps + task-log tail, the in-flight specs/projects, the wiki log's
 * recent heads, and the backlog.
 *
 * The sessions/ folder is created on demand (its full role arrives with the
 * Phase 4 schema; adding files early is harmless — knowledge is never touched).
 * Never blocks compaction: every path exits 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

function findResume(cwd, brain) {
  const candidates = [];
  if (brain) candidates.push(path.join(brain, 'resume.md'));
  candidates.push(path.join(path.resolve(cwd || process.cwd()), 'resume.md'));
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function section(text, heading) {
  const re = new RegExp(`^## ${heading}[^\\n]*$`, 'im');
  const m = re.exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = /^## /m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

async function main() {
  const input = await lib.readStdinJson();
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;

  const dir = path.join(brain, 'sessions');
  fs.mkdirSync(dir, { recursive: true });

  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const hm = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const file = path.join(dir, `${lib.today()}-${hm}-precompact.md`);

  const out = [
    '---',
    `title: "Pre-compaction snapshot"`,
    'type: session-snapshot',
    `session: ${input.session_id || 'unknown'}`,
    `trigger: ${input.trigger || 'unknown'}`,
    `created: ${lib.today()} ${p(d.getHours())}:${p(d.getMinutes())}`,
    '---',
    '',
    'Context was about to be compacted; this file preserves the live working state.',
  ];

  const resumeFile = findResume(input.cwd, brain);
  if (resumeFile) {
    const resume = lib.readTextSafe(resumeFile);
    const next = section(resume, 'Next steps');
    if (next) out.push('', '## Open next steps (from resume.md)', next);
    const tail = section(resume, 'Task log')
      .split(/\r?\n/)
      .filter((l) => /^\s*-\s/.test(l))
      .slice(-5);
    if (tail.length) out.push('', '## Recent task log', ...tail);
  }

  // In-flight work items — the "what was I building" most costly to lose.
  const specLines = [];
  for (const f of lib.listFilesRecursive(path.join(brain, 'specs'), '.md')) {
    const fm = lib.parseFrontmatter(lib.readTextSafe(f));
    if (['done', 'closed', 'superseded'].includes(String(fm.status))) continue;
    specLines.push(`- \`${path.basename(f, '.md')}\` — tier: ${fm.tier ?? '?'} · phase: ${fm.phase ?? '?'} · plan_approved: ${fm.plan_approved === true}`);
  }
  if (specLines.length) out.push('', '## Active specs (in flight)', ...specLines.slice(0, 8));

  const projLines = [];
  for (const f of lib.listFilesRecursive(path.join(brain, 'projects'), '.md')) {
    const fm = lib.parseFrontmatter(lib.readTextSafe(f));
    if (['done', 'paused'].includes(String(fm.status))) continue;
    projLines.push(`- \`${path.basename(f, '.md')}\` — tier: ${fm.tier ?? '?'} · phase: ${fm.phase ?? '?'}`);
  }
  if (projLines.length) out.push('', '## Active projects', ...projLines.slice(0, 8));

  const logHeads = (lib.readTextSafe(path.join(brain, 'wiki', 'log.md')).match(/^## \[.*$/gm) || []).slice(-3);
  if (logHeads.length) out.push('', '## Recent wiki log', ...logHeads.map((h) => `- ${h.replace(/^## /, '')}`));

  let clippings = 0;
  try {
    clippings = fs.readdirSync(path.join(brain, 'Clippings')).filter((f) => f.endsWith('.md')).length;
  } catch {}
  if (clippings) out.push('', `## Backlog`, `- Clippings: ${clippings} unprocessed`);

  fs.writeFileSync(file, out.join('\n') + '\n', 'utf8');
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
