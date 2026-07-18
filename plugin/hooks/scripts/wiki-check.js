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
 *     - orphan page — no inbound [[link]] from any other wiki page (§5);
 *       index/log/dashboard are exempt.
 *   ADVISORY (additionalContext → Claude verifies intent):
 *     - unresolved [[wikilinks]] — legal as deliberate TODO markers (§5),
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
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function extractAliases(fmAliases) {
  const out = [];
  for (const m of String(fmAliases || '').matchAll(/"([^"]+)"|'([^']+)'/g)) out.push(m[1] || m[2]);
  return out;
}

async function main() {
  const input = await lib.readStdinJson();
  const fp = (input.tool_input || {}).file_path;
  if (!fp || !fp.endsWith('.md')) return;
  const abs = path.resolve(fp);
  const brain = lib.findBrainDir(path.dirname(abs));
  if (!brain || !abs.startsWith(brain + path.sep)) return;
  const rel = path.relative(brain, abs).split(path.sep).join('/');
  if (!rel.startsWith('wiki/')) return;
  if (!fs.existsSync(abs)) return;

  const wikiDir = path.join(brain, 'wiki');
  const slug = path.basename(abs, '.md');
  const raw = lib.readTextSafe(abs);

  // Map the vault: slugs, folder-qualified names, aliases.
  const files = lib.listFilesRecursive(wikiDir, '.md');
  const slugs = new Set();
  const qualified = new Set();
  const aliases = new Set();
  for (const f of files) {
    slugs.add(path.basename(f, '.md'));
    qualified.add(path.relative(wikiDir, f).split(path.sep).join('/').replace(/\.md$/, ''));
    const fm = lib.parseFrontmatter(lib.readTextSafe(f));
    for (const a of extractAliases(fm.aliases)) aliases.add(a.toLowerCase());
  }

  // Outbound links of the touched page (code spans/fences stripped).
  const stripped = raw.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const targets = [...stripped.matchAll(/\[\[([^[\]]+)\]\]/g)]
    .map((m) => m[1].split(/\\?\|/)[0].split('#')[0].trim())
    .filter(Boolean);
  const resolves = (t) =>
    qualified.has(t) || slugs.has(t) || slugs.has(t.split('/').pop()) || aliases.has(t.toLowerCase());
  const broken = [...new Set(targets.filter((t) => !resolves(t)))];

  // Frontmatter completeness.
  const fm = lib.parseFrontmatter(raw);
  const fmIssues = [];
  if (!/^---/.test(raw)) fmIssues.push('page has no YAML frontmatter (schema §3)');
  else {
    if (!fm.type) fmIssues.push('frontmatter is missing `type:`');
    if (!fm.updated) fmIssues.push('frontmatter is missing `updated:`');
  }

  // Orphan check: ≥1 inbound link (by slug, qualified path, or own alias).
  let orphan = false;
  if (!ORPHAN_EXEMPT.has(slug)) {
    const needles = [new RegExp(`\\[\\[(?:[^\\]]*/)?${esc(slug)}(?:[|#\\]])`)];
    for (const a of extractAliases(fm.aliases)) needles.push(new RegExp(`\\[\\[${esc(a)}(?:[|#\\]])`, 'i'));
    orphan = true;
    for (const f of files) {
      if (path.resolve(f) === abs) continue;
      const body = lib.readTextSafe(f);
      if (needles.some((re) => re.test(body))) {
        orphan = false;
        break;
      }
    }
  }

  const blockers = [...fmIssues];
  if (orphan) {
    blockers.push(
      `no inbound links — every page needs ≥1 [[link]] from the graph (schema §5). ` +
        `If this page is mid-ingest, wire it into the index/hub now, then continue`
    );
  }
  const advisory = broken.length
    ? `unresolved [[wikilinks]] on ${rel}: ${broken.map((b) => `[[${b}]]`).join(', ')} — fine if deliberate TODO markers (schema §5); otherwise fix the slug or create the page.`
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
