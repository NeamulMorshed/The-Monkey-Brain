#!/usr/bin/env node
/**
 * resume-log.js — hook #8b (TaskCreated / TaskCompleted / SessionEnd).
 *
 * The AUTO-UPDATER of the resume system: appends one line per task event to
 * the "## Task log (auto)" section of resume.md and bumps the frontmatter
 * `updated:` stamp — deterministic, zero model tokens. The narrative sections
 * ("Where we left off", "Next steps") belong to the model (/brain:wrap or a
 * manual update); a script cannot write narrative, only events.
 *
 * File resolution mirrors resume.js. Auto-creation: inside a brain the first
 * event CREATES <brain>/resume.md from a seed; outside a brain the hook only
 * appends to an already-existing ./resume.md (never litters foreign repos).
 * This hook must never disturb a session: every path exits 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Best-effort task label across possible event payload shapes. */
function taskLabel(input) {
  for (const t of [input.task, input.tool_input, input]) {
    if (!t || typeof t !== 'object') continue;
    for (const k of ['subject', 'title', 'description', 'name', 'prompt']) {
      const v = t[k];
      if (typeof v === 'string' && v.trim()) return v.trim().replace(/\s+/g, ' ').slice(0, 100);
    }
  }
  return '(task)';
}

const HEADING = '## Task log (auto)';

const seed = (title) => `---
title: "Resume — ${title}"
type: resume
updated: ${stamp()}
---

## Where we left off
_Auto-created by the Monkey Brain resume hook. Update this narrative when wrapping up._

## Next steps
- [ ] …

${HEADING}
`;

function locate(cwd) {
  const brain = lib.findBrainDir(cwd);
  const inBrain = brain ? path.join(brain, 'resume.md') : null;
  if (inBrain && fs.existsSync(inBrain)) return inBrain;
  const inRoot = path.join(path.resolve(cwd || process.cwd()), 'resume.md');
  if (fs.existsSync(inRoot)) return inRoot;
  if (inBrain) {
    fs.writeFileSync(inBrain, seed(path.basename(path.dirname(brain))), 'utf8');
    return inBrain;
  }
  return null;
}

function appendToTaskLog(file, line) {
  let text = lib.readTextSafe(file);
  if (!text) return;
  if (!text.includes(HEADING)) text = text.replace(/\s*$/, `\n\n${HEADING}\n`);
  const lines = text.split(/\r?\n/);
  const hIdx = lines.findIndex((l) => l.trim() === HEADING);
  let end = lines.length;
  for (let i = hIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  let insertAt = end;
  while (insertAt > hIdx + 1 && lines[insertAt - 1].trim() === '') insertAt--;
  lines.splice(insertAt, 0, line);
  const out = lines.join('\n').replace(/^updated:.*$/m, `updated: ${stamp()}`);
  fs.writeFileSync(file, out, 'utf8');
}

async function main() {
  const input = await lib.readStdinJson();
  const evt = input.hook_event_name || '';
  let line = null;
  if (evt === 'TaskCompleted') line = `- [${stamp()}] ✔ ${taskLabel(input)}`;
  else if (evt === 'TaskCreated') line = `- [${stamp()}] + ${taskLabel(input)}`;
  else if (evt === 'SessionEnd') line = `- [${stamp()}] ■ session ended${input.reason ? ` (${input.reason})` : ''}`;
  if (!line) return;
  const file = locate(input.cwd);
  if (!file) return;
  appendToTaskLog(file, line);
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
