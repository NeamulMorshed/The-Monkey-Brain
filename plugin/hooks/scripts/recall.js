#!/usr/bin/env node
/**
 * recall.js — first-prompt recall (UserPromptSubmit, v3 P10).
 *
 * On the first natural-language prompt of a session, searches the brain for it
 * and injects up to 3 matching pages (title, path, one-line snippet), so the
 * session starts from what the project already knows instead of re-deriving it.
 *
 * Silent when: no brain · a slash command · not the session's first prompt ·
 * fewer than 2 meaningful words · no page matches at least 2 of them ·
 * MONKEY_BRAIN_RECALL=0. Output stays near 300 tokens. Any error → silent exit 0.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const { search, terms } = require(path.join(__dirname, 'search.js'));

async function main() {
  if (process.env.MONKEY_BRAIN_RECALL === '0') return;
  const input = await lib.readStdinJson();
  const prompt = String(input.prompt || '').trim();
  if (!prompt || prompt.startsWith('/')) return;
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;

  const marker = path.join(os.tmpdir(), `mb-recall-${String(input.session_id || 'nosession').replace(/[^\w-]/g, '')}`);
  if (fs.existsSync(marker)) return;
  try { fs.writeFileSync(marker, new Date().toISOString()); } catch {}

  const words = new Set(terms(prompt));
  if (words.size < 2) return;
  const hits = search(brain, prompt, { limit: 8 }).filter((h) => h.matched >= 2).slice(0, 3);
  if (!hits.length) return;

  const cwd = input.cwd || process.cwd();
  const lines = hits.map((h) => {
    const where = path.relative(cwd, path.join(brain, h.path)).split(path.sep).join('/');
    return `- **${h.title}** — \`${where}\`: ${h.snippet.slice(0, 200)}`;
  });
  lib.succeed({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `🧠 Brain recall — pages matching this prompt (read them before re-deriving; brain_search finds more):\n${lines.join('\n')}`,
    },
  });
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
