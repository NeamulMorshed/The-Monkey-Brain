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
 * the last real main-thread `usage` in transcript_path (input + cache-read + cache-write) and
 * adds one line once per 100k band per session — also on slash commands. The band marker resets
 * when context drops below the threshold (after /compact), a context that shrank by 40 %+ yet is
 * still large nudges again, and a marker older than 12 h (a resumed session) is ignored.
 * MONKEY_BRAIN_CONTEXT_NUDGE sets the threshold in tokens (0 or a negative disables; empty or
 * unparseable → the 150k default). No transcript, or below the threshold → nothing.
 *
 * No brain → silent. Any error → silent exit 0.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const { search, terms } = require(path.join(__dirname, 'search.js'));

const NUDGE_RAW = process.env.MONKEY_BRAIN_CONTEXT_NUDGE;
const NUDGE_AT = NUDGE_RAW === undefined || NUDGE_RAW.trim() === '' || !Number.isFinite(Number(NUDGE_RAW)) ? 150000 : Number(NUDGE_RAW);
const BAND = 100000;
const WINDOW = 512 * 1024;
const STALE_MS = 12 * 3600 * 1000;

const sid = (input) => String(input.session_id || 'nosession').replace(/[^\w-]/g, '');

/** The last real main-thread context size in a chunk of transcript: skips subagents, synthetic and zero-usage entries. */
function lastMainUsage(text) {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"usage"')) continue;
    let j;
    try { j = JSON.parse(lines[i]); } catch { continue; }
    if (j.type !== 'assistant' || j.isSidechain || !j.message || !j.message.usage || j.message.model === '<synthetic>') continue;
    const u = j.message.usage;
    const total = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    if (total > 0) return total;
  }
  return 0;
}

/** Context size of the session's last main-thread API call, from the transcript's tail; 0 when unknown. */
function contextTokens(file) {
  if (!file) return 0;
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      for (const win of [WINDOW, 2 * WINDOW]) { // a huge trailing tool result can fill the first window
        const len = Math.min(size, win);
        const buf = Buffer.alloc(len);
        fs.readSync(fd, buf, 0, len, size - len);
        const tokens = lastMainUsage(buf.toString('utf8'));
        if (tokens || len === size) return tokens;
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {}
  return 0;
}

/** One line per 100k band past the threshold, per session (see the header); '' otherwise. */
function contextNudge(input) {
  if (!(NUDGE_AT > 0)) return '';
  const tokens = contextTokens(input.transcript_path);
  const marker = path.join(os.tmpdir(), `mb-ctx-${sid(input)}`);
  if (tokens < NUDGE_AT) {
    // Below the threshold (a fresh session, or after /compact): forget the band, so the next crossing nudges.
    if (tokens > 0) { try { fs.rmSync(marker, { force: true }); } catch {} }
    return '';
  }
  const band = Math.floor((tokens - NUDGE_AT) / BAND);
  let seenBand = -1;
  let seenTokens = 0;
  try {
    if (Date.now() - fs.statSync(marker).mtimeMs < STALE_MS) {
      const [b, t] = lib.readTextSafe(marker).trim().split(':').map(Number);
      if (Number.isFinite(b)) { seenBand = b; seenTokens = Number.isFinite(t) ? t : 0; }
    }
  } catch {}
  const shrank = seenTokens > 0 && tokens < seenTokens * 0.6; // compacted, yet still large
  if (band <= seenBand && !shrank) return '';
  try { fs.writeFileSync(marker, `${band}:${tokens}`); } catch {}
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
  if (!prompt) return;
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;

  const notes = [contextNudge(input)];
  if (!prompt.startsWith('/')) notes.push(recall(input, prompt, brain)); // recall skips slash commands; the nudge does not
  const text = notes.filter(Boolean).join('\n\n');
  if (!text) return;
  lib.succeed({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } });
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
