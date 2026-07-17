#!/usr/bin/env node
/**
 * resume.js — hook #8a (SessionStart, matcher: startup|clear).
 *
 * The READER of the resume system: if the project has a resume.md, inject it
 * at session start together with a directive telling Claude to ASK the user
 * whether to continue from those notes. Fires only on fresh contexts
 * (startup / clear) — on resume/compact the context already survives.
 *
 * Lookup order: <brain>/resume.md (via .brain discovery), then ./resume.md in
 * the project root — the feature works even in projects without a brain.
 * No file → silent no-op. Own budget (default 1200 tokens,
 * MONKEY_BRAIN_RESUME_BUDGET): the task log is trimmed to its last lines
 * first, then narrative is hard-truncated with a pointer to the file — the
 * ask-directive is never dropped. Any internal error → silent exit 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const BUDGET = Number(process.env.MONKEY_BRAIN_RESUME_BUDGET || 1200);
const TAIL_LINES = 5;

function findResume(cwd) {
  const brain = lib.findBrainDir(cwd);
  const candidates = [];
  if (brain) candidates.push(path.join(brain, 'resume.md'));
  candidates.push(path.join(path.resolve(cwd || process.cwd()), 'resume.md'));
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

/** Split a markdown body into { heading, text } chunks on '## ' headings. */
function splitSections(body) {
  const out = [{ heading: '', lines: [] }];
  for (const ln of body.split(/\r?\n/)) {
    if (/^## /.test(ln)) out.push({ heading: ln.replace(/^## /, '').trim(), lines: [ln] });
    else out[out.length - 1].lines.push(ln);
  }
  return out.map((s) => ({ heading: s.heading, text: s.lines.join('\n').trim() }));
}

async function main() {
  const input = await lib.readStdinJson();
  if (input.source && !['startup', 'clear'].includes(input.source)) return;
  const file = findResume(input.cwd);
  if (!file) return;

  const raw = lib.readTextSafe(file);
  if (!raw.trim()) return;
  const fm = lib.parseFrontmatter(raw);
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const rel = (path.relative(path.resolve(input.cwd || process.cwd()), file) || 'resume.md')
    .split(path.sep)
    .join('/');

  // Narrative sections are priority 1; preamble and the task log are 2.
  const chunks = [];
  for (const s of splitSections(body)) {
    if (!s.text) continue;
    if (/^task log/i.test(s.heading)) {
      const entries = s.text.split(/\r?\n/).filter((l) => /^\s*-\s/.test(l));
      const tail = entries.slice(-TAIL_LINES);
      if (tail.length) chunks.push({ pr: 2, text: [`## Task log (last ${tail.length})`, ...tail].join('\n') });
    } else {
      chunks.push({ pr: s.heading ? 1 : 2, text: s.text });
    }
  }

  const header = `## 📌 Resume — previous work notes found (\`${rel}\`${fm.updated ? `, updated ${fm.updated}` : ''})`;
  const directive =
    `**Before starting other work, briefly ask the user: continue from these notes, or start fresh?** ` +
    `If continuing, follow *Next steps*; keep \`${rel}\` current as work completes ` +
    `(task hooks append its log automatically — update the narrative sections when wrapping up).`;

  const render = (arr) => [header, ...arr.map((c) => c.text), directive].join('\n\n');
  let keep = chunks.slice();
  while (lib.estimateTokens(render(keep)) > BUDGET && keep.some((c) => c.pr === 2)) {
    keep.splice(keep.map((c) => c.pr).lastIndexOf(2), 1);
  }
  if (lib.estimateTokens(render(keep)) > BUDGET) {
    const maxChars = Math.max(200, BUDGET * 4 - (header.length + directive.length + 80));
    const truncated =
      keep.map((c) => c.text).join('\n\n').slice(0, maxChars) +
      `\n…(truncated — read \`${rel}\` for the rest)`;
    keep = [{ pr: 1, text: truncated }];
  }

  lib.succeed({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: render(keep) },
  });
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
