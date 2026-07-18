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
 *                   (docs/tests exempt).
 *   5. TDD GATE   — feature+ tier specs (schema §4.4): creating a NEW project
 *                   code file with no test companion is blocked (same-dir
 *                   <name>.test/.spec, sibling __tests__/, or a root-level
 *                   test|tests|spec|specs dir). Spec `tdd: false` opts out;
 *                   quick tier is advisory-only.
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

/** Is this path a test file (by directory or by naming convention)? */
function isTestPath(abs) {
  const base = path.basename(abs);
  return (
    /(^|[\\/])(tests?|__tests__|specs?)([\\/])/i.test(abs) ||
    /(\.|_|-)(test|spec)\.[^.]+$/i.test(base) ||
    /^test_/i.test(base) ||
    /^(test|spec)s?\.[^.]+$/i.test(base)
  );
}

/** Recognized code extensions for the TDD gate (config/docs/styles stay free). */
const CODE_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|py|go|rs|java|kt|rb|cs|c|h|cc|cpp|hpp|swift|php)$/i;

/** Does a test companion exist for this source file? Cheap, bounded lookups. */
function hasTestCompanion(projRoot, abs) {
  const base = path.basename(abs).replace(/\.[^.]+$/, '').toLowerCase();
  const dir = path.dirname(abs);
  try {
    for (const f of fs.readdirSync(dir)) {
      const fl = f.toLowerCase();
      if (fl.startsWith(`${base}.test.`) || fl.startsWith(`${base}.spec.`)) return true;
    }
  } catch {}
  try {
    if (fs.readdirSync(path.join(dir, '__tests__')).some((f) => f.toLowerCase().includes(base))) return true;
  } catch {}
  for (const name of ['test', 'tests', 'spec', 'specs', '__tests__']) {
    const td = path.join(projRoot, name);
    if (!fs.existsSync(td)) continue;
    if (lib.listFilesRecursive(td).some((f) => path.basename(f).toLowerCase().includes(base))) return true;
  }
  return false;
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

  // 4+5) TIER GATES — plan + TDD on project source writes (schema §4.4).
  const pbrain = brain || lib.findBrainDir(input.cwd);
  if (pbrain && !abs.startsWith(pbrain + path.sep)) {
    const specsDir = path.join(pbrain, 'specs');
    const isDoc = /\.(md|mdx|txt|rst)$/i.test(abs);
    if (fs.existsSync(specsDir) && !isDoc && !isTestPath(abs)) {
      const specs = lib
        .listFilesRecursive(specsDir, '.md')
        .map((f) => ({ f, fm: lib.parseFrontmatter(lib.readTextSafe(f)) }))
        .filter((s) => !['done', 'closed', 'superseded'].includes(String(s.fm.status)));

      // 4) PLAN GATE — architecture tier needs curator approval before source writes.
      for (const s of specs) {
        if (String(s.fm.tier) === 'architecture' && s.fm.plan_approved !== true) {
          lib.block(
            `🐵 guard[plan]: architecture-tier spec \`${path.basename(s.f)}\` is not approved ` +
              `(missing \`plan_approved: true\`). Get the curator's explicit approval on the spec before ` +
              `writing source files — or lower the spec's tier if this is not architecture-level work.`
          );
        }
      }

      // 5) TDD GATE — feature+ tiers: a NEW code file needs a test companion first.
      const isNewFile = tool === 'Write' && !fs.existsSync(abs);
      const gated = specs.find(
        (s) => ['feature', 'architecture'].includes(String(s.fm.tier)) && s.fm.tdd !== false
      );
      if (isNewFile && CODE_EXT.test(abs) && gated && !hasTestCompanion(path.dirname(pbrain), abs)) {
        lib.block(
          `🐵 guard[tdd]: spec \`${path.basename(gated.f)}\` is tier ${gated.fm.tier} — write the failing test FIRST. ` +
            `No test found for \`${path.basename(abs)}\` (looked for <name>.test/.spec beside it, a sibling __tests__/, ` +
            `and test|tests|spec|specs dirs at the project root). Create the test, then this file — ` +
            `or set \`tdd: false\` in the spec / lower its tier to quick if TDD genuinely doesn't apply.`
        );
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
