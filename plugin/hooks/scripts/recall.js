#!/usr/bin/env node
/**
 * recall.js — first-prompt recall + context-size nudge (UserPromptSubmit, v3 P10 / v0.31.0).
 *
 * Recall: on the first natural-language prompt of a session, searches the brain for it and
 * injects up to 3 matching pages (title, path, one-line snippet), so the session starts from
 * what the project already knows instead of re-deriving it. Silent when: a slash command · not
 * the session's first prompt · fewer than 2 meaningful words · no page matches at least 2 of
 * them · MONKEY_BRAIN_RECALL=0. Output stays near 300 tokens.
 *
 * Context nudge (token-diet AC-4): every API call re-reads the whole context, so past ~150k
 * tokens a wrap + /clear at the next milestone is the biggest saving there is. The hook reads
 * the last main-thread `usage` in transcript_path (input + cache-read + cache-write) and adds
 * one line once per 100k band per session. MONKEY_BRAIN_CONTEXT_NUDGE sets the threshold
 * (0 disables). No transcript, or below the threshold → nothing.
 *
 * No brain → silent. Any error → silent exit 0.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const { search, terms } = require(path.join(__dirname, 'search.js'));

const NUDGE_AT = Number(process.env.MONKEY_BRAIN_CONTEXT_NUDGE ?? 150000);
const BAND = 100000;
const TAIL_BYTES = 512 * 1024;

const sid = (input) => String(input.session_id || 'nosession').replace(/[^\w-]/g, '');

/** Context size of the session's last main-thread API call, from the transcript's tail; 0 when unknown. */
function contextTokens(file) {
  if (!file) return 0;
  let text = '';
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      const len = Math.min(size, TAIL_BYTES);
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, size - len);
      text = buf.toString('utf8');
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return 0;
  }
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"usage"')) continue;
    let j;
    try { j = JSON.parse(lines[i]); } catch { continue; }
    if (j.type !== 'assistant' || j.isSidechain || !j.message || !j.message.usage) continue;
    const u = j.message.usage;
    return (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
  }
  return 0;
}

/** One line once per 100k band past the threshold, per session; '' otherwise. */
function contextNudge(input) {
  if (!(NUDGE_AT > 0)) return '';
  const tokens = contextTokens(input.transcript_path);
  if (tokens < NUDGE_AT) return '';
  const band = Math.floor((tokens - NUDGE_AT) / BAND);
  const marker = path.join(os.tmpdir(), `mb-ctx-${sid(input)}`);
  const seen = lib.readTextSafe(marker).trim();
  if (seen !== '' && Number(seen) >= band) return '';
  try { fs.writeFileSync(marker, String(band)); } catch {}
  return (
    `🐵 context ≈ ${Math.round(tokens / 1000)}k tokens — every API call re-reads all of it. ` +
    `At the next milestone run /brain:wrap, then /clear: the resume file carries the state. ` +
    `Don't switch models mid-session — a switch re-writes the whole cache (manual §5).`
  );
}

/** First-prompt recall; '' when silent. */
function recall(input, prompt, brain) {
  if (process.env.MONKEY_BRAIN_RECALL === '0') return '';
  const marker = path.join(os.tmpdir(), `mb-recall-${sid(input)}`);
  if (fs.existsSync(marker)) return '';
  try { fs.writeFileSync(marker, new Date().toISOString()); } catch {}

  const words = new Set(terms(prompt));
  if (words.size < 2) return '';
  const hits = search(brain, prompt, { limit: 8 }).filter((h) => h.matched >= 2).slice(0, 3);
  if (!hits.length) return '';

  const cwd = input.cwd || process.cwd();
  const lines = hits.map((h) => {
    const where = path.relative(cwd, path.join(brain, h.path)).split(path.sep).join('/');
    return `- **${h.title}** — \`${where}\`: ${h.snippet.slice(0, 200)}`;
  });
  return `🧠 Brain recall — pages matching this prompt (read them before re-deriving; brain_search finds more):\n${lines.join('\n')}`;
}

async function main() {
  const input = await lib.readStdinJson();
  const prompt = String(input.prompt || '').trim();
  if (!prompt || prompt.startsWith('/')) return;
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;

  const notes = [contextNudge(input), recall(input, prompt, brain)].filter(Boolean);
  if (!notes.length) return;
  lib.succeed({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: notes.join('\n\n') } });
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
