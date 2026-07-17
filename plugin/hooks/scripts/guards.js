#!/usr/bin/env node
/**
 * guards.js — hook #3 (PreToolUse on Write|Edit|MultiEdit).
 *
 * The enforcement layer (ROADMAP Phase 2 #3) — "enforcement over advice":
 *   1. SECRETS    — any write whose content matches key patterns is blocked,
 *                   inside or outside the brain.
 *   2. IMMUTABILITY — .brain/raw-sources/** : new files may be added (that IS
 *                   the ingest flow); existing files are never modified.
 *   3. LOG        — .brain/wiki/log.md is append-only: full rewrites blocked;
 *                   edits must be pure insertions (new_string contains
 *                   old_string) or a frontmatter `updated:` date bump.
 *   4. PLAN GATE  — while an architecture-tier spec in .brain/specs/ lacks
 *                   plan_approved: true, project source writes are blocked
 *                   (docs/tests exempt). Dormant until Phase 4 creates specs/.
 *
 * Gates degrade gracefully: no .brain/ (or no specs/) → the rule is skipped.
 * Blocking = exit 2 with the reason on stderr (shown to Claude).
 * On unexpected internal error: fail-open with exit 1 (non-blocking, logged).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const SECRET_PATTERNS = [
  [/\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/, 'an API key (`sk-…`)'],
  [/\bghp_[A-Za-z0-9]{30,}\b/, 'a GitHub personal access token'],
  [/\bgithub_pat_[A-Za-z0-9_]{30,}\b/, 'a GitHub fine-grained token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key ID'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY( BLOCK)?-----/, 'private key material'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
  [/\bglpat-[A-Za-z0-9_-]{20,}\b/, 'a GitLab token'],
];

/** Every piece of new text this tool call would write. */
function gatherNewText(ti) {
  if (typeof ti.content === 'string') return ti.content;
  if (Array.isArray(ti.edits)) return ti.edits.map((e) => e.new_string || '').join('\n');
  return ti.new_string || '';
}

/** Append-only rule for one edit pair. */
function editIsAppendOnly(oldS, newS) {
  if (String(newS).includes(String(oldS))) return true; // pure insertion
  return /^updated:\s*["']?\d{4}-\d{2}-\d{2}["']?$/.test(String(oldS).trim()); // frontmatter bump
}

async function main() {
  const input = await lib.readStdinJson();
  const ti = input.tool_input || {};
  const tool = input.tool_name || '';
  const fp = ti.file_path;
  if (!fp) return;
  const abs = path.resolve(fp);

  // 1) SECRETS — applies everywhere.
  const newText = gatherNewText(ti);
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(newText)) {
      lib.block(
        `🐵 guard[secrets]: write to ${fp} blocked — the content matches ${label}. ` +
          `Never write secrets into files: use an environment variable or a secret manager and reference it instead.`
      );
    }
  }

  // Brain-layer rules — only when the target file lives inside a .brain/.
  const brain = lib.findBrainDir(path.dirname(abs));
  if (brain && abs.startsWith(brain + path.sep)) {
    const rel = path.relative(brain, abs).split(path.sep).join('/');

    // 2) IMMUTABILITY — raw-sources/: add-only.
    if (rel.startsWith('raw-sources/')) {
      const exists = fs.existsSync(abs);
      if (tool !== 'Write' || exists) {
        lib.block(
          `🐵 guard[immutability]: ${rel} is in the immutable raw-sources layer (schema §1). ` +
            `Existing sources are never modified — file corrections in wiki pages instead. ` +
            `New sources may be added as new files via the ingest flow.`
        );
      }
    }

    // 3) LOG — append-only.
    if (rel === 'wiki/log.md') {
      if (tool === 'Write' && fs.existsSync(abs)) {
        lib.block(
          `🐵 guard[log]: wiki/log.md is append-only — rewriting the whole file is blocked. ` +
            `Use Edit to append the new entry after the last one.`
        );
      }
      const pairs = Array.isArray(ti.edits)
        ? ti.edits.map((e) => [e.old_string || '', e.new_string || ''])
        : tool === 'Edit'
          ? [[ti.old_string || '', ti.new_string || '']]
          : [];
      for (const [oldS, newS] of pairs) {
        if (!editIsAppendOnly(oldS, newS)) {
          lib.block(
            `🐵 guard[log]: wiki/log.md is append-only — this edit removes existing text. ` +
              `Append instead (new_string must contain old_string unchanged), or only bump the frontmatter \`updated:\` date.`
          );
        }
      }
    }
  }

  // 4) PLAN GATE — project source writes while an architecture-tier spec is unapproved.
  const pbrain = brain || lib.findBrainDir(input.cwd);
  if (pbrain && !abs.startsWith(pbrain + path.sep)) {
    const specsDir = path.join(pbrain, 'specs');
    const isDoc = /\.(md|mdx|txt|rst)$/i.test(abs);
    const isTest = /(^|[\\/])(tests?|__tests__|spec|specs)([\\/]|\.)/i.test(abs);
    if (fs.existsSync(specsDir) && !isDoc && !isTest) {
      for (const f of lib.listFilesRecursive(specsDir, '.md')) {
        const fm = lib.parseFrontmatter(lib.readTextSafe(f));
        const active = !['done', 'closed', 'superseded'].includes(String(fm.status));
        if (String(fm.tier) === 'architecture' && active && fm.plan_approved !== true) {
          lib.block(
            `🐵 guard[plan]: architecture-tier spec \`${path.basename(f)}\` is not approved ` +
              `(missing \`plan_approved: true\`). Get the curator's explicit approval on the spec before ` +
              `writing source files — or lower the spec's tier if this is not architecture-level work.`
          );
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    process.stderr.write(`guards.js internal error (fail-open): ${e.message}`);
    process.exit(1);
  });
