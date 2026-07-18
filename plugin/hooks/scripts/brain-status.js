#!/usr/bin/env node
/**
 * brain-status.js — hook #1 (SessionStart).
 *
 * Detects the project's .brain/ and injects a BUDGETED status block so every
 * session starts brain-aware (kills the CLAUDE.md loading caveat). Design
 * rules (ROADMAP Phase 2 #1 + the MewVault cache postmortem):
 *   - hard token budget (default 3000, MONKEY_BRAIN_BUDGET to change);
 *   - over budget, whole low-priority sections drop — the identity/manual
 *     and index lines are never dropped;
 *   - optimize by injecting less, never by transforming the prompt;
 *   - after rendering, append an injection-size receipt to
 *     sessions/injection-stats.json (Phase 5 item 5) for the future
 *     /brain:doctor — zero added tokens, best-effort, never blocks;
 *   - no .brain/ → a ONE-LINE /brain:init offer on startup only (Phase 3 —
 *     the no-brain fallback of the activation architecture), permanently
 *     silenced by a `.no-brain` marker at the project root;
 *   - a status hook must never break a session: any error → silent exit 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

const BUDGET = Number(process.env.MONKEY_BRAIN_BUDGET || 3000);

function countMd(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

async function main() {
  const input = await lib.readStdinJson();
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) {
    const root = path.resolve(input.cwd || process.cwd());
    if (input.source === 'startup' && !fs.existsSync(path.join(root, '.no-brain'))) {
      lib.succeed({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext:
            '🐵 No Monkey Brain in this project. If knowledge work comes up this session (docs to keep, ' +
            'decisions worth remembering), offer /brain:init once — a per-project wiki+memory that ' +
            'compounds across sessions. To silence this permanently: create an empty `.no-brain` file at the project root.',
        },
      });
    }
    return;
  }

  const rel = (path.relative(input.cwd || process.cwd(), brain) || '.brain').split(path.sep).join('/');
  // [priority, text] — priority 0 is never dropped; 2 drops first.
  const sections = [];

  sections.push([0, [
    `## 🐵 Monkey Brain — brain status (\`${rel}\`)`,
    `This project has a Monkey Brain instance. **Operating manual:** \`${rel}/CLAUDE.md\` —`,
    `follow its Knowledge SDLC (ingest → query → lint). The wiki is LLM-owned;`,
    `\`raw-sources/\` is immutable; every action updates index + log.`,
  ].join('\n')]);

  const idxFm = lib.parseFrontmatter(lib.readTextSafe(path.join(brain, 'wiki', 'index.md')));
  if (idxFm.source_count !== undefined || idxFm.page_count !== undefined) {
    sections.push([0, `**Index (the map):** ${idxFm.source_count ?? '?'} sources · ${idxFm.page_count ?? '?'} wiki pages · updated ${idxFm.updated ?? '?'}. Read \`${rel}/wiki/index.md\` first on any query.`]);
  } else {
    sections.push([0, `**Index (the map):** \`${rel}/wiki/index.md\` not built yet — the first ingest creates it.`]);
  }

  const clippings = countMd(path.join(brain, 'Clippings'));
  if (clippings > 0) {
    sections.push([1, `**📎 Clippings:** ${clippings} unprocessed file(s) in \`${rel}/Clippings/\` — say "ingest" to compile them into the wiki.`]);
  }

  // Health report (Phase 8): surface the last /brain:doctor run's open failures so
  // this session starts knowing what's wrong. Zero-cost — reads a cached report.
  const health = lib.readJsonSafe(path.join(brain, 'sessions', 'health.json'), null);
  if (health && (Number(health.crit) > 0 || Number(health.warn) > 0)) {
    const rank = (l) => (l === 'crit' ? 0 : 1);
    const tops = (Array.isArray(health.findings) ? health.findings : [])
      .filter((f) => f.level === 'crit' || f.level === 'warn')
      .sort((a, b) => rank(a.level) - rank(b.level))
      .slice(0, 2)
      .map((f) => `${f.check} (${f.detail})`);
    const age = health.at ? Math.floor((Date.now() - Date.parse(health.at)) / 86400000) : null;
    const staleNote = age !== null && age > 7 ? ` — report ${age}d old, re-run` : '';
    sections.push([1, `**🩺 Health:** last \`/brain:doctor\` — ${health.crit} critical · ${health.warn} warning(s)${staleNote}. ${Number(health.crit) > 0 ? 'Criticals gate wrap. ' : ''}Top: ${tops.join('; ')}. Run \`/brain:doctor\` for the full report.`]);
  }

  const specsDir = path.join(brain, 'specs');
  if (fs.existsSync(specsDir)) {
    const lines = [];
    for (const f of lib.listFilesRecursive(specsDir, '.md')) {
      const fm = lib.parseFrontmatter(lib.readTextSafe(f));
      if (['done', 'closed', 'superseded'].includes(String(fm.status))) continue;
      lines.push(`- \`${path.basename(f)}\` — tier: ${fm.tier ?? '?'} · plan_approved: ${fm.plan_approved === true}`);
    }
    if (lines.length) sections.push([1, `**Active specs:**\n${lines.slice(0, 5).join('\n')}`]);
  }

  const projectsDir = path.join(brain, 'projects');
  if (fs.existsSync(projectsDir)) {
    const lines = [];
    for (const f of lib.listFilesRecursive(projectsDir, '.md')) {
      const fm = lib.parseFrontmatter(lib.readTextSafe(f));
      if (['done', 'paused'].includes(String(fm.status))) continue;
      lines.push(`- \`${path.basename(f, '.md')}\` — tier: ${fm.tier ?? '?'} · phase: ${fm.phase ?? '?'}`);
    }
    if (lines.length) sections.push([1, `**Active projects:**\n${lines.slice(0, 5).join('\n')}`]);
  }

  const instincts = lib
    .listFilesRecursive(path.join(brain, 'instincts', 'active'), '.md')
    .map((f) => path.basename(f, '.md'));
  if (instincts.length) {
    sections.push([1, `**Instincts (always apply):** ${instincts.join(', ')} — details in \`${rel}/instincts/active/\`.`]);
  }

  // Decisions (the "why") — the memory tier fed back into every session so
  // past ADRs are consulted before anything is re-decided (Phase 5 item 2).
  const decisionFiles = lib
    .listFilesRecursive(path.join(brain, 'decisions'), '.md')
    .filter((f) => !/(^|[\\/])templates([\\/])/.test(f));
  if (decisionFiles.length) {
    const recent = decisionFiles
      .map((f) => {
        let m = 0;
        try { m = fs.statSync(f).mtimeMs; } catch {}
        const fm = lib.parseFrontmatter(lib.readTextSafe(f));
        return { title: fm.title || path.basename(f, '.md'), m };
      })
      .sort((a, b) => b.m - a.m)
      .slice(0, 3)
      .map((d) => `\`${d.title}\``);
    sections.push([2, `**Decisions (the why):** ${decisionFiles.length} ADR(s) in \`${rel}/decisions/\` — latest: ${recent.join(', ')}. Consult these before re-deciding anything they cover.`]);
  }

  // Semantic search (qmd) — enabled state, else the §8 "outgrew the index" nudge.
  const qmdOn = fs.existsSync(path.join(brain, '.qmd')) || process.env.MONKEY_BRAIN_QMD === '1';
  if (qmdOn) {
    sections.push([1, `**🔎 Semantic search:** enabled — query the \`brain-search\` MCP (qmd) before substantive work; it surfaces pages the index doesn't.`]);
  } else if (Number(idxFm.page_count || 0) >= 80) {
    sections.push([2, `**🔎 Search:** ${idxFm.page_count} wiki pages — nearing the index's comfortable ceiling (~100). Consider enabling semantic search (\`${rel}/CLAUDE.md\` §8): install qmd, then \`touch ${rel}/.qmd\`.`]);
  }

  const logHeads = (lib.readTextSafe(path.join(brain, 'wiki', 'log.md')).match(/^## \[.*$/gm) || []).slice(-3);
  if (logHeads.length) {
    sections.push([2, `**Recent log:**\n${logHeads.map((h) => `- ${h.replace(/^## /, '')}`).join('\n')}`]);
  }

  const memCount = countMd(path.join(brain, 'memory'));
  if (memCount > 0) {
    sections.push([2, `**Memory:** ${memCount} file(s) in \`${rel}/memory/\` — consult before substantive work.`]);
  }

  // Enforce the budget: drop whole sections, lowest priority first, never P0.
  const keep = sections.slice();
  const render = (arr) => arr.map(([, t]) => t).join('\n\n');
  for (const pr of [2, 1]) {
    while (lib.estimateTokens(render(keep)) > BUDGET && keep.some(([p]) => p === pr)) {
      keep.splice(keep.map(([p]) => p).lastIndexOf(pr), 1);
    }
  }
  const rendered = render(keep);

  // Budget-receipt groundwork (Phase 5 item 5): record this injection's size for
  // the future /brain:doctor — rolling (last 20), capped, ZERO injected tokens.
  try {
    const sdir = path.join(brain, 'sessions');
    fs.mkdirSync(sdir, { recursive: true });
    const statsFile = path.join(sdir, 'injection-stats.json');
    const prev = lib.readJsonSafe(statsFile, []);
    const list = Array.isArray(prev) ? prev : [];
    list.push({
      at: new Date().toISOString(),
      source: input.source || 'unknown',
      budget: BUDGET,
      tokens: lib.estimateTokens(rendered),
      sections_total: sections.length,
      sections_kept: keep.length,
      sections_dropped: sections.length - keep.length,
    });
    fs.writeFileSync(statsFile, JSON.stringify(list.slice(-20), null, 2) + '\n', 'utf8');
  } catch {}

  lib.succeed({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: rendered },
  });
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
