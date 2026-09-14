#!/usr/bin/env node
/**
 * pr.js — read-only GitHub PR fetch for /brain:review (Post-v3 gh-based PR review).
 *
 * Wraps `gh pr view/diff/checks` so /brain:review can review a live PR — its diff,
 * metadata and CI check status — instead of only a local branch/spec diff. This is
 * the "green CI" evidence /brain:ci and /brain:review already talk about, now
 * readable straight from GitHub. Deliberately read-only: no `gh pr comment` / `gh pr
 * review` / `gh pr merge` here or anywhere else in the brain — posting to a PR is a
 * curator's own action outside this script.
 *
 *   node pr.js <ref> [--json] [--no-diff]
 *
 * <ref>: a PR number ("123" or "#123"), a PR URL, or omitted to use the current
 * branch's PR (gh's own resolution). Fails open with a plain-text message — never
 * throws — when `gh` isn't installed, isn't authenticated, or the ref has no PR.
 * The gh binary name is overridable via MONKEY_BRAIN_GH_CMD (selftest uses this to
 * exercise the "not found" path deterministically, without touching a real gh).
 *
 * Library: fetchPR(ref, opts) → { ok, error? , pr?, checks?, diff? }; summarize(result)
 * → the human-readable report this CLI prints by default.
 */
'use strict';

const { spawnSync } = require('child_process');

const GH_CMD = process.env.MONKEY_BRAIN_GH_CMD || 'gh';

function run(args) {
  const r = spawnSync(GH_CMD, args, { encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

function ghAvailable() {
  const r = run(['--version']);
  return !r.error && r.status === 0;
}

function ghAuthed() {
  const r = run(['auth', 'status']);
  return !r.error && r.status === 0;
}

/** Fetch a PR's metadata, CI check status and (unless opts.noDiff) its diff. Read-only. */
function fetchPR(ref, opts = {}) {
  if (!ghAvailable()) {
    return { ok: false, error: 'gh CLI not found — install it (https://cli.github.com) to use PR mode.' };
  }
  if (!ghAuthed()) {
    return { ok: false, error: 'gh is not authenticated — run `gh auth login` first.' };
  }

  const args = ref ? [String(ref)] : [];
  const viewFields = 'number,title,url,state,author,baseRefName,headRefName,body,isDraft';
  const view = run(['pr', 'view', ...args, '--json', viewFields]);
  if (view.status !== 0) {
    return { ok: false, error: (view.stderr || view.stdout || 'gh pr view failed').trim() };
  }
  let pr;
  try {
    pr = JSON.parse(view.stdout);
  } catch {
    return { ok: false, error: 'gh pr view returned non-JSON output.' };
  }

  // gh pr checks exits non-zero when a check is failing/pending — that's data, not a script error.
  const checksRun = run(['pr', 'checks', ...args, '--json', 'name,state,bucket,link']);
  let checks = [];
  if (checksRun.stdout) {
    try { checks = JSON.parse(checksRun.stdout); } catch { checks = []; }
  }

  let diff = null;
  if (!opts.noDiff) {
    const diffRun = run(['pr', 'diff', ...args]);
    diff = diffRun.status === 0 ? diffRun.stdout : null;
  }

  return { ok: true, pr, checks, diff };
}

/** Render a fetchPR() result as the plain-text report the CLI prints by default. */
function summarize(result) {
  if (!result.ok) return result.error;
  const { pr, checks, diff } = result;
  const lines = [];
  lines.push(`PR #${pr.number}: ${pr.title}${pr.isDraft ? ' (draft)' : ''}`);
  lines.push(`${pr.headRefName} -> ${pr.baseRefName} · ${pr.state} · ${(pr.author && pr.author.login) || 'unknown'} · ${pr.url}`);
  if (checks.length) {
    const bucket = (c) => c.bucket || c.state || 'unknown';
    const counts = checks.reduce((acc, c) => {
      const b = bucket(c);
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {});
    lines.push(`CI checks: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
    for (const c of checks) {
      const b = bucket(c);
      const mark = b === 'pass' ? '✓' : b === 'fail' ? '✗' : '…';
      lines.push(`  ${mark} ${c.name} (${b})`);
    }
  } else {
    lines.push('CI checks: none reported.');
  }
  if (diff !== null) lines.push('', '--- diff ---', diff);
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const noDiff = argv.includes('--no-diff');
  const ref = argv.find((a) => !a.startsWith('--'));
  const result = fetchPR(ref, { noDiff });
  if (json) {
    console.log(JSON.stringify(result));
    return;
  }
  console.log(summarize(result));
}

if (require.main === module) main();

module.exports = { fetchPR, summarize };
