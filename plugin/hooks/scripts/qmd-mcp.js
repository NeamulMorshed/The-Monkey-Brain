#!/usr/bin/env node
/**
 * qmd-mcp.js — the `brain-search` MCP server wrapper (ROADMAP Phase 5 item 3).
 *
 * Semantic search over the wiki is a DELIBERATELY-DEFERRED, opt-in upgrade
 * (schema §8: "the index file is the search engine until the wiki outgrows it,
 * ~100 sources"). So this wrapper is bundled in .mcp.json but stays dormant
 * unless a brain is present AND opted in AND qmd is installed:
 *
 *   opted-in + qmd present  → hand off to the real `qmd mcp` (query/get/…),
 *                             deferred into context by Tool Search like any MCP.
 *   otherwise               → run a tiny stdlib no-op MCP server (valid
 *                             protocol, ZERO tools) so Claude Code never shows a
 *                             failed/broken server — the cost of "bundled but
 *                             dormant" is one idle, tool-less server.
 *
 * Opt-in: an empty `.qmd` marker in the brain, or MONKEY_BRAIN_QMD=1.
 * Enable qmd: `npm i -g @tobilu/qmd` → `qmd collection add ./wiki` →
 * `qmd update && qmd embed` (see the instance CLAUDE.md §8).
 *
 * MCP stdio transport = newline-delimited JSON-RPC 2.0. Any error → dormant
 * stub; this process must never crash a session.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lib = require(path.join(__dirname, 'lib.js'));

const WIN = process.platform === 'win32';
const VERSION = (lib.readJsonSafe(path.join(__dirname, '..', '..', '.claude-plugin', 'plugin.json'), {}) || {}).version || '0';

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
 * safe here because qmdInstalled() already confirmed it exists, so the shell
 * can't "succeed" on a missing binary. Falls back to the stub on spawn error.
 */
function handoff(brain) {
  const child = spawn('qmd', ['mcp'], { cwd: brain, stdio: 'inherit', shell: WIN, windowsHide: true, env: process.env });
  child.on('error', () => runStub());
  child.on('exit', (code) => process.exit(code == null ? 0 : code));
}

/** Minimal no-op MCP server: speaks the protocol, exposes no tools. */
function runStub() {
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
      handle(msg, send);
    }
  });
  process.stdin.on('end', () => process.exit(0));
  process.stdin.on('error', () => process.exit(0));
}

function handle(msg, send) {
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) return; // JSON-RPC notification → no reply
  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: (params && params.protocolVersion) || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'brain-search', version: VERSION },
        instructions:
          'Semantic search is not enabled for this brain. The index file is the search engine ' +
          'until the wiki outgrows it (~100 sources); past that, enable qmd + an empty .qmd marker ' +
          '(or MONKEY_BRAIN_QMD=1) — see the instance CLAUDE.md §8.',
      },
    });
  } else if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: [] } });
  } else if (method === 'ping') {
    send({ jsonrpc: '2.0', id, result: {} });
  } else if (method === 'tools/call') {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'semantic search is not enabled for this brain' } });
  } else {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } });
  }
}

function main() {
  let brain = null;
  try { brain = lib.findBrainDir(process.cwd()); } catch {}
  if (brain && optedIn(brain) && qmdInstalled()) handoff(brain);
  else runStub();
}

main();
