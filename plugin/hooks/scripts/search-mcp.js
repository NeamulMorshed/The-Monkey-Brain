#!/usr/bin/env node
/**
 * search-mcp.js — the `brain-search` MCP server (v3 P10; qmd wrapper since P5).
 *
 * In a project with a .brain/:
 *   default                 → built-in recall: `brain_search` (ranked pages +
 *                             snippets) and `brain_brief` (a cited ≤2k-token
 *                             pack), BM25 over the compiled layers via
 *                             search.js — fresh from the files on every call.
 *   opted-in + qmd present  → hand off to the real `qmd mcp` for meaning-based
 *                             (vector) search.
 * Without a brain it exposes zero tools and no instructions, so brainless
 * projects pay nothing.
 *
 * Opt-in to qmd: an empty `.qmd` marker in the brain, or MONKEY_BRAIN_QMD=1
 * (reference.md §8). MCP stdio transport = newline-delimited JSON-RPC
 * 2.0. This process must never crash a session: errors become tool errors.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));
const recall = require(path.join(__dirname, 'search.js'));

const WIN = process.platform === 'win32';
const VERSION = (lib.readJsonSafe(path.join(__dirname, '..', '..', '.claude-plugin', 'plugin.json'), {}) || {}).version || '0';

const TOOLS = [
  {
    name: 'brain_search',
    description:
      "Search this project's Monkey Brain — compiled wiki pages, decisions (ADRs), specs, project status and memory — and get ranked pages with snippets. Use before re-deriving anything the project may already know.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to search for' },
        limit: { type: 'integer', minimum: 1, maximum: 20, description: 'Maximum results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'brain_brief',
    description:
      "A context pack of at most ~2k tokens on a topic from this project's Monkey Brain: the best-matching excerpts from the top pages, each cited as [[slug]].",
    inputSchema: {
      type: 'object',
      properties: { topic: { type: 'string', description: 'What to brief on' } },
      required: ['topic'],
    },
  },
];

function optedIn(brain) {
  if (process.env.MONKEY_BRAIN_QMD === '1') return true;
  return !!(brain && fs.existsSync(path.join(brain, '.qmd')));
}

/**
 * True if `qmd` is on PATH. Shell-free lookup (not `spawnSync('qmd',…,{shell})`
 * — under a Windows shell that returns success even when qmd is ABSENT, which
 * would trigger a broken handoff). Honors PATHEXT so qmd.cmd/qmd.exe count.
 */
function qmdInstalled() {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const names = WIN
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').map((e) => 'qmd' + e.trim().toLowerCase())
    : ['qmd'];
  for (const d of dirs) {
    for (const n of names) {
      try { if (fs.statSync(path.join(d, n)).isFile()) return true; } catch {}
    }
  }
  return false;
}

/**
 * Hand the stdio channel to the real qmd MCP server. Spawns bare `qmd` via the
 * shell (resolves qmd.cmd on Windows and avoids quoting PATHs with spaces) —
 * safe here because qmdInstalled() already confirmed it exists. Falls back to
 * the built-in server on spawn error.
 */
function handoff(brain) {
  const child = spawn('qmd', ['mcp'], { cwd: brain, stdio: 'inherit', shell: WIN, windowsHide: true, env: process.env });
  child.on('error', () => serve(brain));
  child.on('exit', (code) => process.exit(code == null ? 0 : code));
}

function serve(brain) {
  const send = (obj) => {
    try { process.stdout.write(JSON.stringify(obj) + '\n'); } catch {}
  };
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; }
      handle(msg, send, brain);
    }
  });
  process.stdin.on('end', () => process.exit(0));
  process.stdin.on('error', () => process.exit(0));
}

function callTool(brain, name, args) {
  const text = (s) => ({ content: [{ type: 'text', text: s }] });
  const fail = (s) => ({ content: [{ type: 'text', text: s }], isError: true });
  if (!brain) return fail('No Monkey Brain in this project — run /brain:init first.');
  try {
    if (name === 'brain_search') {
      const query = String((args && args.query) || '').trim();
      if (!query) return fail('brain_search needs a non-empty "query".');
      const limit = Math.min(20, Math.max(1, Number(args.limit) || 5));
      return text(recall.format(query, recall.search(brain, query, { limit })));
    }
    if (name === 'brain_brief') {
      const topic = String((args && args.topic) || '').trim();
      if (!topic) return fail('brain_brief needs a non-empty "topic".');
      return text(recall.brief(brain, topic));
    }
    return fail(`Unknown tool: ${name}`);
  } catch (e) {
    return fail(`brain-search failed: ${e.message}`);
  }
}

function handle(msg, send, brain) {
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) return; // JSON-RPC notification → no reply
  if (method === 'initialize') {
    const result = {
      protocolVersion: (params && params.protocolVersion) || '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'brain-search', version: VERSION },
    };
    if (brain) {
      result.instructions =
        'This project has a Monkey Brain. Before substantive work, call brain_search (ranked pages + snippets) ' +
        'or brain_brief (a cited pack of at most ~2k tokens) rather than re-deriving what the project already knows. ' +
        'Built-in full-text search; past ~100 sources, qmd adds meaning-based matches (reference.md §8).';
    }
    send({ jsonrpc: '2.0', id, result });
  } else if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: brain ? TOOLS : [] } });
  } else if (method === 'ping') {
    send({ jsonrpc: '2.0', id, result: {} });
  } else if (method === 'tools/call') {
    send({ jsonrpc: '2.0', id, result: callTool(brain, params && params.name, params && params.arguments) });
  } else {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } });
  }
}

function main() {
  let brain = null;
  try { brain = lib.findBrainDir(process.cwd()); } catch {}
  if (brain && optedIn(brain) && qmdInstalled()) handoff(brain);
  else serve(brain);
}

main();
