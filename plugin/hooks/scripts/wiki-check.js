#!/usr/bin/env node
/**
 * wiki-check.js — hook #4 (PostToolUse on Write|Edit|MultiEdit).
 *
 * Self-healing wiki (ROADMAP Phase 2 #4): after any write to a page under
 * .brain/wiki/, check THAT page and put failures back into context so Claude
 * fixes them in the same turn.
 *
 *   BLOCK-level (decision:"block" + reason → Claude must act):
 *     - missing/incomplete frontmatter (no `type:` / `updated:`, schema §3);
 *     - orphan page — no inbound [[link]] from any other wiki page (§6);
 *       index/log/dashboard are exempt.
 *   ADVISORY (additionalContext → Claude verifies intent):
 *     - unresolved [[wikilinks]] — legal as deliberate TODO markers (§6),
 *       so they are reported, not blocked. Aliases and folder-qualified
 *       links resolve; code spans/fences are ignored.
 *
 * Outside a brain, or outside wiki/, or on any internal error: silent no-op.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const ORPHAN_EXEMPT = new Set(['index', 'log', 'dashboard']);


async function main() {
  const input = await lib.readStdinJson();
  const fp = (input.tool_input || {}).file_path;
  if (!fp || !fp.endsWith('.md')) return;
  const abs = path.resolve(fp);

  // superpowers writes designs and plans outside the brain (v0.32.0): name where each belongs.
  const sp = /[\\/]docs[\\/]superpowers[\\/](specs|plans)[\\/]/.exec(abs);
  const spBrain = sp && lib.findBrainDir(path.dirname(abs));
  if (spBrain && abs.startsWith(path.dirname(spBrain) + path.sep) && !/[\\/]node_modules[\\/]/.test(abs)) {
    const home = sp[1] === 'plans'
      ? 'a plan belongs in the spec it implements — .brain/specs/<feature>.md (acceptance criteria, test plan, notes)'
      : 'a design belongs in .brain/wiki/research/<topic>.md, or in the Notes of the spec it feeds';
    return lib.succeed({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `🐵 wiki-check: superpowers saved a ${sp[1] === 'plans' ? 'plan' : 'design'} outside the brain — ${home} (reference.md §9). Its docs/superpowers copy can stay as the plugin's working file.`,
      },
    });
  }

  const brain = lib.findBrainDir(path.dirname(abs));
  if (!brain || !abs.startsWith(brain + path.sep)) return;
  const rel = path.relative(brain, abs).split(path.sep).join('/');
  if (!rel.startsWith('wiki/')) return;
  if (!fs.existsSync(abs)) return;

  const slug = path.basename(abs, '.md');
  const raw = lib.readTextSafe(abs);

  // The shared link inventory: wiki pages + the specs/decisions/projects records (v0.32.0).
  const idx = lib.linkIndex(brain);

  // Outbound links of the touched page (code spans/fences stripped).
  const stripped = raw.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const targets = [...stripped.matchAll(/\[\[([^[\]]+)\]\]/g)]
    .map((m) => m[1].split(/\\?\|/)[0].split('#')[0].trim())
    .filter(Boolean);
  const broken = [...new Set(targets.filter((t) => !idx.resolves(t)))];

  // Frontmatter completeness.
  const fm = lib.parseFrontmatter(raw);
  const fmIssues = [];
  if (!/^---/.test(raw)) fmIssues.push('page has no YAML frontmatter (schema §3)');
  else {
    if (!fm.type) fmIssues.push('frontmatter is missing `type:`');
    if (!fm.updated) fmIssues.push('frontmatter is missing `updated:`');
  }

  // Orphan check: ≥1 inbound link from another wiki page or a spec/decision/project record (v0.32.0).
  const orphan = !ORPHAN_EXEMPT.has(slug) && !idx.hasInbound({ file: abs, slug, fm });

  const blockers = [...fmIssues];
  if (orphan) {
    blockers.push(
      `no inbound links — every page needs ≥1 [[link]] from the graph (schema §6). ` +
        `If this page is mid-ingest, wire it into the index/hub now, then continue`
    );
  }
  const advisory = broken.length
    ? `unresolved [[wikilinks]] on ${rel}: ${broken.map((b) => `[[${b}]]`).join(', ')} — fine if deliberate TODO markers (schema §6); otherwise fix the slug or create the page.`
    : '';

  if (blockers.length) {
    const reason =
      `🐵 wiki-check on ${rel}: ` + blockers.join('; ') + '.' + (advisory ? ` Also: ${advisory}` : '');
    lib.succeed({ decision: 'block', reason });
  } else if (advisory) {
    lib.succeed({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `🐵 wiki-check: ${advisory}` },
    });
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
