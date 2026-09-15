#!/usr/bin/env node
/**
 * doctor.js — the mechanical layer of /brain:doctor (ROADMAP Phase 8).
 *
 * 19 deterministic health checks over a brain (benchmark-parity + v3 receipts and CI), zero model
 * tokens. The SKILL.md injects this output via !` ` preprocessing; the model
 * then reasons over the findings (what to fix first, what to file). It also
 * writes sessions/health.json so hook #1 (brain-status) can surface open
 * failures at the start of the NEXT session.
 *
 * Usage: node doctor.js [--brain <path>] [--strict] [--json]
 *   --brain   explicit brain root (default: walk up from cwd like the hooks)
 *   --strict  exit 1 when any warning/critical was found (CI); default exits 0
 *   --json    print the machine report instead of the table
 *
 * Levels: ok · info · warn · crit. Exit is injection-safe by default so skill
 * preprocessing never breaks.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const lib = require(path.join(__dirname, '..', '..', '..', 'hooks', 'scripts', 'lib.js'));
const usage = require(path.join(__dirname, '..', '..', '..', 'hooks', 'scripts', 'usage.js'));
const ci = require(path.join(__dirname, '..', '..', '..', 'hooks', 'scripts', 'ci.js'));

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const asJson = args.includes('--json');
const brainArg = args.includes('--brain') ? args[args.indexOf('--brain') + 1] : null;
const BUDGET = Number(process.env.MONKEY_BRAIN_BUDGET || 3000);
const WIP_MAX = 3;
const IDLE_DAYS = 21;
const INSTINCT_QUEUE_MAX = 5;

const brain = brainArg ? path.resolve(brainArg) : lib.findBrainDir(process.cwd());
if (!brain || !fs.existsSync(path.join(brain, 'wiki'))) {
  console.log('No Monkey Brain found (no .brain/ with a wiki/ from here up). Run /brain:init first.');
  process.exit(0);
}

const SYM = { ok: '✓', info: '·', warn: '⚠', crit: '✗' };
const findings = [];
const add = (n, check, level, detail) => findings.push({ n, check, level, detail });

const readText = (p) => lib.readTextSafe(p);
const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };
const daysSince = (d) => { const t = Date.parse(d); return isNaN(t) ? null : Math.floor((Date.now() - t) / 86400000); };

// ---- shared inventory -------------------------------------------------------
const wikiDir = path.join(brain, 'wiki');
const wikiFiles = lib.listFilesRecursive(wikiDir, '.md');
const ORPHAN_EXEMPT = new Set(['index', 'log', 'dashboard']);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const extractAliases = lib.extractAliases; // shared via lib.js (v0.28.0): arrays or the quoted-string form

const slugs = new Set(), qualified = new Set(), aliases = new Set(), pages = [];
for (const f of wikiFiles) {
  const rel = path.relative(wikiDir, f).split(path.sep).join('/');
  const raw = readText(f);
  const fm = lib.parseFrontmatter(raw);
  slugs.add(path.basename(f, '.md'));
  qualified.add(rel.replace(/\.md$/, ''));
  for (const a of extractAliases(fm.aliases)) aliases.add(a.toLowerCase());
  pages.push({ file: f, rel, slug: path.basename(f, '.md'), raw, fm });
}
const listActive = (dir) =>
  lib.listFilesRecursive(path.join(brain, dir), '.md')
    .filter((f) => !/(^|[\\/])templates([\\/])/.test(f))
    .map((f) => ({ file: f, name: path.basename(f, '.md'), fm: lib.parseFrontmatter(readText(f)), raw: readText(f) }));

// ---- 1. broken links --------------------------------------------------------
const resolves = (t) => qualified.has(t) || slugs.has(t) || slugs.has(t.split('/').pop()) || aliases.has(t.toLowerCase());
const broken = new Set();
for (const p of pages) {
  const stripped = p.raw.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of stripped.matchAll(/\[\[([^[\]]+)\]\]/g)) {
    const t = m[1].split(/\\?\|/)[0].split('#')[0].trim();
    if (t && !resolves(t)) broken.add(t);
  }
}
add(1, 'broken-links', broken.size ? 'warn' : 'ok', broken.size ? `${broken.size} broken (TODO markers are legal): ${[...broken].slice(0, 6).join(', ')}` : 'none');

// ---- 2. orphans -------------------------------------------------------------
const orphans = [];
for (const p of pages) {
  if (ORPHAN_EXEMPT.has(p.slug)) continue;
  const needles = [new RegExp(`\\[\\[(?:[^\\]]*/)?${esc(p.slug)}(?:[|#\\]])`)];
  for (const a of extractAliases(p.fm.aliases)) needles.push(new RegExp(`\\[\\[${esc(a)}(?:[|#\\]])`, 'i'));
  if (!pages.some((q) => q.file !== p.file && needles.some((re) => re.test(q.raw)))) orphans.push(p.rel);
}
add(2, 'orphans', orphans.length ? 'warn' : 'ok', orphans.length ? `${orphans.length}: ${orphans.slice(0, 6).join(', ')}` : 'none');

// ---- 3. stale / contradiction flags -----------------------------------------
const stale = pages.filter((p) => String(p.fm.status) === 'stale').map((p) => p.slug);
const contradictions = pages.filter((p) => /⚠️?\s*Contradiction/i.test(p.raw)).map((p) => p.slug);
const flagN = stale.length + contradictions.length;
add(3, 'stale-contradictions', flagN ? 'info' : 'ok', flagN ? `${stale.length} stale, ${contradictions.length} contradiction flag(s)` : 'none');

// ---- 4. index freshness vs page count ---------------------------------------
const rawSources = lib.listFilesRecursive(path.join(brain, 'raw-sources'), '.md').filter((f) => !f.split(path.sep).includes('assets'));
const idx = pages.find((p) => p.rel === 'index.md');
if (!idx) add(4, 'index-freshness', 'crit', 'wiki/index.md is missing');
else {
  const drift = [];
  if (idx.fm.source_count !== undefined && idx.fm.source_count !== rawSources.length) drift.push(`source_count ${idx.fm.source_count}≠${rawSources.length}`);
  if (idx.fm.page_count !== undefined && idx.fm.page_count !== wikiFiles.length) drift.push(`page_count ${idx.fm.page_count}≠${wikiFiles.length}`);
  add(4, 'index-freshness', drift.length ? 'warn' : 'ok', drift.length ? `drift: ${drift.join(', ')} (SessionEnd self-heals, or /brain:lint)` : 'in sync');
}

// ---- 5. Clippings backlog ---------------------------------------------------
let clippings = 0;
try { clippings = fs.readdirSync(path.join(brain, 'Clippings')).filter((f) => f.endsWith('.md')).length; } catch {}
add(5, 'clippings-backlog', clippings > 5 ? 'warn' : clippings > 0 ? 'info' : 'ok', clippings ? `${clippings} unprocessed (say "ingest")` : 'empty');

// ---- 6. log gaps (session activity newer than the log) -----------------------
const logP = path.join(wikiDir, 'log.md');
const logMtime = mtime(logP);
const sessFiles = lib.listFilesRecursive(path.join(brain, 'sessions'), '.md');
const newestSession = sessFiles.reduce((mx, f) => Math.max(mx, mtime(f)), 0);
const logGap = newestSession && logMtime && newestSession > logMtime + 60000;
add(6, 'log-gaps', logGap ? 'warn' : 'ok', logGap ? 'sessions/ has activity newer than the last wiki/log.md entry — a session went unlogged (/brain:wrap)' : 'log tracks session activity');

// ---- 7. uncommitted .brain/ changes -----------------------------------------
let git;
try { git = spawnSync('git', ['-C', brain, 'status', '--porcelain'], { encoding: 'utf8', timeout: 8000 }); } catch { git = null; }
if (!git || git.status !== 0) add(7, 'uncommitted', 'info', 'not a git repo (or git unavailable) — skipped');
else {
  const dirty = git.stdout.split('\n').filter((l) => l.trim()).length;
  add(7, 'uncommitted', dirty ? 'warn' : 'ok', dirty ? `${dirty} uncommitted change(s) in .brain/ — commit per §7` : 'clean');
}

// ---- 8. hook registration ---------------------------------------------------
const hooksJson = path.join(__dirname, '..', '..', '..', 'hooks', 'hooks.json');
const EXPECTED_HOOKS = ['brain-status', 'resume', 'trigger-router', 'recall', 'guards', 'agent-track', 'wiki-check', 'instinct-track', 'resume-log', 'wrap', 'snapshot'];
let hooksText = '';
try { hooksText = fs.readFileSync(hooksJson, 'utf8'); } catch {}
const missingHooks = EXPECTED_HOOKS.filter((h) => !hooksText.includes(`${h}.js`));
add(8, 'hook-registration', !hooksText ? 'warn' : missingHooks.length ? 'crit' : 'ok', !hooksText ? 'hooks.json not found from doctor (installed plugin resolves it at runtime)' : missingHooks.length ? `NOT registered: ${missingHooks.join(', ')}` : `all ${EXPECTED_HOOKS.length} hooks registered`);

// ---- 9. injection size vs budget --------------------------------------------
const stats = lib.readJsonSafe(path.join(brain, 'sessions', 'injection-stats.json'), []);
if (!Array.isArray(stats) || !stats.length) add(9, 'injection-budget', 'info', 'no injection receipts yet');
else {
  const recent = stats.slice(-10);
  const avg = Math.round(recent.reduce((s, r) => s + (r.tokens || 0), 0) / recent.length);
  const dropped = recent.filter((r) => (r.sections_dropped || 0) > 0).length;
  const over = avg > BUDGET;
  add(9, 'injection-budget', over ? 'warn' : 'ok', `avg ${avg}/${BUDGET} tokens over last ${recent.length}${dropped ? ` · sections dropped in ${dropped} (budget pressure)` : ''}`);
}

// ---- 10. search -------------------------------------------------------------
const qmdOn = fs.existsSync(path.join(brain, '.qmd')) || process.env.MONKEY_BRAIN_QMD === '1';
const pageCount = wikiFiles.length;
if (qmdOn) add(10, 'semantic-index', 'ok', 'qmd semantic search enabled — SessionEnd re-indexes; verify `qmd update` ran if results feel stale');
else if (pageCount >= 100) add(10, 'semantic-index', 'info', `built-in recall covers ${pageCount} wiki pages — qmd would add meaning-based matches (manual §8)`);
else add(10, 'semantic-index', 'ok', `built-in recall covers ${pageCount} wiki pages (always fresh)`);

// ---- 11. WIP limits ---------------------------------------------------------
const projects = listActive('projects').filter((p) => !['done', 'paused'].includes(String(p.fm.status)));
const idle = projects.filter((p) => { const d = daysSince(p.fm.updated); return d !== null && d > IDLE_DAYS; }).map((p) => `${p.name} (${daysSince(p.fm.updated)}d)`);
const wipMsgs = [];
if (projects.length > WIP_MAX) wipMsgs.push(`${projects.length} active projects > ${WIP_MAX} WIP limit`);
if (idle.length) wipMsgs.push(`idle ${IDLE_DAYS}+ days: ${idle.join(', ')}`);
add(11, 'wip-limits', wipMsgs.length ? 'warn' : 'ok', wipMsgs.length ? wipMsgs.join(' · ') : `${projects.length} active project(s), none idle`);

// ---- 12. instinct-queue overflow --------------------------------------------
const pending = lib.listFilesRecursive(path.join(brain, 'instincts', 'pending'), '.md');
add(12, 'instinct-queue', pending.length > INSTINCT_QUEUE_MAX ? 'warn' : 'ok', pending.length ? `${pending.length} pending instinct(s) — curator promotes to active/ or drops` : 'empty');

// ---- 13. specs without tests ------------------------------------------------
const specs = listActive('specs').filter((s) => !['done', 'superseded', 'closed'].includes(String(s.fm.status)));
const gated = specs.filter((s) => (s.fm.tier === 'feature' || s.fm.tier === 'architecture') && s.fm.tdd !== false);
const noTestPlan = gated.filter((s) => { const m = /##\s*Test plan\s*([\s\S]*?)(?:\n##\s|$)/i.exec(s.raw); return !m || m[1].replace(/[\s\-–—.]/g, '').length < 8; });
add(13, 'specs-without-tests', noTestPlan.length ? 'warn' : 'ok', noTestPlan.length ? `${noTestPlan.length} feature+ spec(s) with an empty Test plan: ${noTestPlan.map((s) => s.name).join(', ')}` : `${gated.length} gated spec(s), all have a test plan`);

// ---- 14. open P0 findings ---------------------------------------------------
const p0 = [];
for (const p of [...listActive('projects'), ...pages.filter((x) => x.rel.startsWith('syntheses/'))]) {
  const raw = p.raw || '';
  for (const line of raw.split('\n')) {
    if (/\bP0\b/.test(line) && !/(resolved|accepted|closed|fixed|✅|~~)/i.test(line)) { p0.push(p.name || p.slug); break; }
  }
}
add(14, 'open-p0', p0.length ? 'crit' : 'ok', p0.length ? `${p0.length} file(s) with open P0 finding(s): ${[...new Set(p0)].join(', ')} — these gate /brain:wrap` : 'none');

// ---- 15. schema version vs engine -------------------------------------------
const instFm = lib.parseFrontmatter(readText(path.join(brain, 'CLAUDE.md')));
const engineFm = lib.parseFrontmatter(readText(path.join(__dirname, '..', '..', 'init', 'brain-template', 'CLAUDE.md')));
const iv = String(instFm.engine_version || '?'), ev = String(engineFm.engine_version || '?');
add(15, 'schema-version', ev !== '?' && iv !== ev ? 'warn' : 'ok', ev === '?' ? `instance schema v${iv} (engine version unknown from here)` : iv === ev ? `schema v${iv} matches engine` : `instance v${iv} < engine v${ev} — run /brain:init --update`);

// ---- + model-mix (agents.md) ------------------------------------------------
const agentsText = readText(path.join(brain, 'sessions', 'agents.md'));
const mix = {};
for (const m of agentsText.matchAll(/model:\s*([A-Za-z0-9.-]+)/g)) mix[m[1]] = (mix[m[1]] || 0) + 1;
const mixStr = Object.keys(mix).length ? Object.entries(mix).map(([k, v]) => `${k}×${v}`).join(' · ') : 'no dispatches logged';

// ---- 16. cache safety (no prompt-rewriting proxy) ---------------------------
const projectRoot = path.dirname(brain);
const cfgDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const envBase = (f) => (((lib.readJsonSafe(f, {}) || {}).env) || {}).ANTHROPIC_BASE_URL;
const baseUrl =
  process.env.ANTHROPIC_BASE_URL ||
  envBase(path.join(projectRoot, '.claude', 'settings.local.json')) ||
  envBase(path.join(projectRoot, '.claude', 'settings.json')) ||
  envBase(path.join(cfgDir, 'settings.json'));
if (!baseUrl || /^https:\/\/([a-z0-9-]+\.)*anthropic\.com(\/|$)/i.test(baseUrl)) add(16, 'cache-safety', 'ok', 'requests go straight to the Anthropic API');
else add(16, 'cache-safety', 'warn', `ANTHROPIC_BASE_URL routes through ${baseUrl} — a proxy that rewrites prompts breaks prompt caching and re-bills the conversation every turn (fine if it passes requests through unchanged)`);

// ---- 17. cache-hit ratio (real transcripts, last 7 days) --------------------
const use = usage.summarize(projectRoot, { days: 7 });
if (!use.calls) add(17, 'cache-hit', 'info', 'no Claude Code transcripts for this project in the last 7 days');
else {
  const hr = use.hitRatio || 0;
  add(17, 'cache-hit', hr < 0.5 ? 'warn' : hr < 0.8 ? 'info' : 'ok', `${Math.round(hr * 100)}% of input tokens were cache reads over ${use.calls} API call(s) in 7 days${hr < 0.8 ? ' — /brain:usage shows what breaks caching' : ''}`);
}

// ---- 18. dispatch outcomes (agents.md ledger) -------------------------------
const outcomes = [...agentsText.matchAll(/↳ (done|empty)/g)].map((m) => m[1]).slice(-20);
const empties = outcomes.filter((o) => o === 'empty').length;
if (!outcomes.length) add(18, 'dispatch-outcomes', 'info', 'no subagent outcomes recorded yet');
else add(18, 'dispatch-outcomes', outcomes.length >= 4 && empties / outcomes.length >= 0.25 ? 'warn' : 'ok', `last ${outcomes.length} dispatch(es): ${outcomes.length - empties} done · ${empties} returned nothing${empties ? ' — check those agents\' prompts and models in sessions/agents.md' : ''}`);

// ---- 19. CI presence (code projects need a safety net) ---------------------
const stacks = ci.detect(projectRoot).map((j) => j.name);
let workflows = [];
try { workflows = fs.readdirSync(path.join(projectRoot, '.github', 'workflows')).filter((f) => /\.ya?ml$/i.test(f)); } catch {}
if (!stacks.length) add(19, 'ci-presence', 'info', 'no code project detected (package.json, pyproject / requirements, go.mod, .sln / .csproj, Cargo.toml)');
else add(19, 'ci-presence', workflows.length ? 'ok' : 'warn', workflows.length ? `${stacks.join(', ')} project with CI (${workflows.join(', ')})` : `${stacks.join(', ')} project with no CI workflow — /brain:ci installs one`);

// ---- verdict + report -------------------------------------------------------
const counts = { ok: 0, info: 0, warn: 0, crit: 0 };
for (const f of findings) counts[f.level]++;
const report = { at: new Date().toISOString(), ok: counts.ok, info: counts.info, warn: counts.warn, crit: counts.crit, model_mix: mixStr, findings };

// Persist for the next session's brain-status (best-effort, zero-cost).
try {
  const sdir = path.join(brain, 'sessions');
  fs.mkdirSync(sdir, { recursive: true });
  fs.writeFileSync(path.join(sdir, 'health.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
} catch {}

if (asJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(strict && counts.warn + counts.crit > 0 ? 1 : 0);
}

const out = [`🩺 brain doctor — 19-check health of ${brain}`];
for (const f of findings.sort((a, b) => a.n - b.n)) out.push(`  ${SYM[f.level]} ${f.n}. ${f.check}: ${f.detail}`);
out.push(`  · model-mix (agents.md): ${mixStr}`);
const verdict = counts.crit ? `${counts.crit} CRITICAL · ${counts.warn} warning(s) — fix criticals first (they gate wrap)` : counts.warn ? `${counts.warn} warning(s) · ${counts.ok} ok — triage below` : `all clear (${counts.ok} ok, ${counts.info} info)`;
out.push(`\n🩺 HEALTH: ${verdict}`);
console.log(out.join('\n'));
process.exit(strict && counts.warn + counts.crit > 0 ? 1 : 0);
