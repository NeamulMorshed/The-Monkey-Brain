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
 *                   (docs/tests exempt). The second block on the same spec is
 *                   escalated to .brain/sessions/review-required.md (v3 P12),
 *                   which brain-status surfaces next session.
 *   5. TDD GATE   — feature+ tier specs (schema §4.4): creating a NEW project
 *                   code file with no test companion is blocked (same-dir
 *                   <name>.test/.spec, sibling __tests__/, or a root-level
 *                   test|tests|spec|specs dir). Spec `tdd: false` opts out;
 *                   quick tier is advisory-only.
 *   6. LEARNED BANS — a project write whose new text matches an `enforce: block`
 *                   ban (an active instinct's `ban:`, or a declared pack's
 *                   bans.json) is refused (v3 P15). `warn` bans are reported
 *                   after the write by instinct-track.js.
 *   7. TEAM LOCK  — while a teammate's LOCK.md is active, writes inside its
 *                   scope (a spec, or the brain's knowledge layers) are
 *                   refused for everyone else (v3 P16).
 *   8. CAREER PRIVACY — a case study (`type: case-study`) whose
 *                   `confidentiality` isn't `cleared` can't be marked
 *                   publishable, and can't be written outside .brain/private/ (v3 P17).
 *
 * Gates degrade gracefully: no .brain/ (or no specs/) → the rule is skipped.
 * Blocking = exit 2 with the reason on stderr (shown to Claude).
 * On unexpected internal error: fail-open with exit 1 (non-blocking, logged).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const bans = require(path.join(__dirname, 'bans.js'));
const lockLib = require(path.join(__dirname, 'lock.js'));

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
  const bump = /^updated:\s*["']?\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?["']?$/; // a date, optionally with a time
  return bump.test(String(oldS).trim()) && bump.test(String(newS).trim()); // frontmatter date bump — a date on both sides
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

/** The file's full text after this call: Write content, or Edit/MultiEdit applied to the current file. */
function textAfter(abs, ti) {
  if (typeof ti.content === 'string') return ti.content;
  let text = lib.readTextSafe(abs);
  const edits = Array.isArray(ti.edits) ? ti.edits : [ti];
  for (const e of edits) {
    if (typeof e.old_string !== 'string') continue;
    const next = String(e.new_string || '');
    text = e.replace_all ? text.split(e.old_string).join(next) : text.replace(e.old_string, () => next);
  }
  return text;
}

/** Count a plan-gate block; the 2nd on one spec is written to review-required.md. */
function recordPlanBlock(brain, spec) {
  try {
    const dir = path.join(brain, 'sessions');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'gate-blocks.json');
    const counts = lib.readJsonSafe(file, {}) || {};
    counts[spec] = (counts[spec] || 0) + 1;
    fs.writeFileSync(file, JSON.stringify(counts, null, 2) + '\n', 'utf8');
    if (counts[spec] === 2) {
      const rr = path.join(dir, 'review-required.md');
      if (!fs.existsSync(rr)) {
        fs.writeFileSync(rr, '---\ntitle: "Review required"\ntype: review-required\n---\n\nSpecs the plan gate blocked twice. The curator approves, re-tiers, or re-plans each.\n\n', 'utf8');
      }
      fs.appendFileSync(rr, `- [${lib.today()}] \`${spec}\` — architecture tier, not approved; the plan gate blocked source writes twice\n`, 'utf8');
    }
    return counts[spec];
  } catch {
    return 0;
  }
}

/**
 * Does one of a spec's `scope:` globs claim this project-relative path? Globs: `**` spans
 * directories, `*` and `?` stay within one segment; a bare path with no glob characters
 * claims itself and everything beneath it (`src/auth` ≡ `src/auth/**`). No scope → false.
 */
function scopeMatches(scope, relProj) {
  const globs = Array.isArray(scope) ? scope : typeof scope === 'string' && scope.trim() ? [scope] : [];
  for (const g0 of globs) {
    const g = String(g0).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
    if (!g) continue;
    if (!/[*?[\]]/.test(g)) {
      if (relProj === g || relProj.startsWith(g + '/')) return true;
      continue;
    }
    if (globToRegExp(g).test(relProj)) return true;
  }
  return false;
}

/** One left-to-right pass over the glob, so no rewrite can touch another's output. */
function globToRegExp(g) {
  let out = '^';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') { i++; out += '(?:.*/)?'; } // `**/` — zero or more directories
        else out += '.*';                                  // `**` — anything, across segments
      } else out += '[^/]*';                               // `*` — within one segment
    } else if (c === '?') out += '[^/]';
    else out += /[.+^${}()|[\]\\]/.test(c) ? '\\' + c : c;
  }
  return new RegExp(out + '$');
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

  // 8) CAREER PRIVACY — case studies stay private until the owner clears them.
  const cbrain = lib.findBrainDir(path.dirname(abs)) || lib.findBrainDir(input.cwd);
  if (cbrain) {
    const privateDir = path.join(cbrain, 'private') + path.sep;
    if (newText.includes('case-study') || abs.startsWith(privateDir)) {
      const fm = lib.parseFrontmatter(textAfter(abs, ti));
      if (String(fm.type) === 'case-study' && String(fm.confidentiality) !== 'cleared') {
        const level = fm.confidentiality || 'pending';
        if (!abs.startsWith(privateDir)) {
          lib.block(
            `🐵 guard[career]: this is an uncleared case study (\`confidentiality: ${level}\`) — it stays in \`.brain/private/\` ` +
              `until the owner has cleared every name, number and client detail. Set \`confidentiality: cleared\` in the private copy first.`
          );
        }
        if (String(fm.status) === 'publishable') {
          lib.block(`🐵 guard[career]: a case study can't be \`publishable\` while \`confidentiality\` is \`${level}\` — the owner clears it first.`);
        }
      }
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

  // 7) TEAM LOCK — a teammate's active lock covers this brain file.
  if (brain && abs.startsWith(brain + path.sep)) {
    const lock = lockLib.readLock(brain);
    const relB = path.relative(brain, abs).split(path.sep).join('/');
    if (lock && lock.active && lockLib.inScope(lock, relB) && lock.author !== lockLib.identity(path.dirname(brain))) {
      lib.block(
        `🐵 guard[lock]: ${lock.author} holds the lock on \`${lock.scope}\` until ${lockLib.local(lock.until)}` +
          `${lock.note ? ` (${lock.note})` : ''} — \`${relB}\` is inside it. Coordinate with them first; once agreed, ` +
          `\`/brain:lock acquire ${lock.scope} --force\` takes it over.`
      );
    }
  }

  // 4+5) TIER GATES — plan + TDD on project source writes (schema §4.4).
  const pbrain = brain || lib.findBrainDir(input.cwd);
  if (pbrain && !abs.startsWith(pbrain + path.sep)) {
    const specsDir = path.join(pbrain, 'specs');
    const isDoc = /\.(md|mdx|txt|rst)$/i.test(abs);
    // Paths outside the project root (scratch dirs, other repos) belong to no spec — never gated.
    const relProj = path.relative(path.dirname(pbrain), abs).split(path.sep).join('/');
    // Test paths are judged inside the project: a parent folder named specs/ or tests/ above the
    // project root must never switch the gates off (v0.30.0).
    if (lib.inProject(relProj) && fs.existsSync(specsDir) && !isDoc && !isTestPath(relProj)) {
      const openSpecs = lib
        .listFilesRecursive(specsDir, '.md')
        .map((f) => ({ f, fm: lib.parseFrontmatter(lib.readTextSafe(f)) }))
        .filter((s) => !['done', 'closed', 'superseded'].includes(String(s.fm.status)));
      // Scoping (v0.28.0): a spec's `scope:` globs claim the files its gates own. When at least one
      // open spec claims this path, only the claiming specs are consulted; otherwise every open
      // spec is (the pre-scope behaviour, so brains without `scope:` fields see no change).
      const claiming = openSpecs.filter((s) => scopeMatches(s.fm.scope, relProj));
      const specs = claiming.length ? claiming : openSpecs;

      // 4) PLAN GATE — architecture tier needs curator approval before source writes.
      for (const s of specs) {
        if (String(s.fm.tier) === 'architecture' && s.fm.plan_approved !== true) {
          const n = recordPlanBlock(pbrain, path.basename(s.f));
          lib.block(
            `🐵 guard[plan]: architecture-tier spec \`${path.basename(s.f)}\` is not approved ` +
              `(missing \`plan_approved: true\`). Get the curator's explicit approval on the spec before ` +
              `writing source files — or lower the spec's tier if this is not architecture-level work.` +
              (n >= 2
                ? ` This is block #${n} on this spec — stop retrying: ask the curator to approve the plan, ` +
                  `re-tier the spec, or re-plan (logged to .brain/sessions/review-required.md).`
                : '')
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

  // 6) LEARNED BANS — block-level bans on project files outside the brain.
  if (pbrain && !abs.startsWith(pbrain + path.sep)) {
    const relP = path.relative(path.dirname(pbrain), abs).split(path.sep).join('/');
    if (lib.inProject(relP)) {
      const hit = bans.findMatches(newText, relP, bans.loadBans(pbrain).filter((b) => b.enforce === 'block'))[0];
      if (hit) {
        lib.block(
          `🐵 guard[instinct]: \`${hit.ban.name}\` (${hit.ban.source}) bans this pattern — "${hit.snippet}". ` +
            `${hit.ban.rule} Rewrite without it; the curator can relax the rule in its instinct file.`
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
