#!/usr/bin/env node
/**
 * trigger-router.js — hook #2 (UserPromptSubmit).
 *
 * The deterministic router of the activation architecture (ROADMAP L3a):
 * natural phrases map to /brain:* skills so nobody memorizes commands. It
 * never blocks and never rewrites the prompt — it injects a one-line routing
 * hint telling Claude which skill owns the workflow. Model-driven and
 * path-driven routing (L3b/c) still work when this misses.
 *
 * Plan before build: generic development intent ("add a login feature", "fix the
 * crash on upload") — anything a specific workflow above didn't claim — routes to
 * brain:plan, listing the open specs so an already-planned feature goes to
 * brain:build instead. Advisory like everything else here.
 *
 * Silence rules (this fires on EVERY prompt — the common case must be free):
 *   - no phrase match → silent;
 *   - development intent phrased as a question (why/what/how…) → silent;
 *   - prompt is already a slash command or names /brain: → silent;
 *   - matched a brain-needing phrase but no .brain/ → suggest /brain:init
 *     instead (unless a `.no-brain` marker declines the engine);
 *   - any internal error → silent exit 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

// Order matters: first match wins. `what` names the workflow in the hint.
const RULES = [
  {
    re: /\b(set\s?up|initiali[sz]e|init|create|scaffold)\b[^.!?]{0,40}\b(monkey\s?brain|\.?brain)\b|\bnew brain\b/i,
    skill: 'init',
    needsBrain: false,
    what: 'brain setup',
  },
  {
    re: /\bingest\b|\bprocess (the |my )?clippings?\b|\badd (this|that|it|these) to the (brain|wiki|vault)\b/i,
    skill: 'ingest',
    needsBrain: true,
    what: 'source ingestion',
  },
  {
    re: /\bwrap(\s+\w+){0,2}\s+up\b|\bend (the |this )?session\b|\bcall it a (day|night)\b/i,
    skill: 'wrap',
    needsBrain: true,
    what: 'session wrap-up',
  },
  {
    re: /\bbrain[- ]?doctor\b|\b(brain|wiki|vault) (doctor|health)\b|\bhealth[- ]?check (the |my )?(brain|wiki|vault)\b|\bis (the |my )?(brain|wiki|vault) healthy\b|\bcheck (the |my )?(brain|wiki|vault)'?s? health\b/i,
    skill: 'doctor',
    needsBrain: true,
    what: 'brain health report',
  },
  {
    re: /\blint (the |my )?(brain|wiki|vault)\b|\b(brain|wiki|vault) lint\b/i,
    skill: 'lint',
    needsBrain: true,
    what: 'brain lint',
  },
  {
    re: /\b(practice|drill|study)\b[^.!?]{0,30}\b(cards?|decks?|flash ?cards?|vocab\w*|kanji|words|japanese|spanish|french|german|korean|chinese|italian)\b|\bflash ?cards?\b|\bspaced repetition\b/i,
    skill: 'learn',
    needsBrain: true,
    what: 'learning session (spaced repetition)',
  },
  {
    re: /\bcase stud(y|ies)\b|\bmock interview\b|\b(update|refresh|tailor)\b[^.!?]{0,20}\b(cv|résumé)\b|\bskill matrix\b/i,
    skill: 'career',
    needsBrain: true,
    what: 'career pack',
  },
  {
    re: /\b(lock|unlock)\s+(the\s+)?(brain|[\w-]+\s+spec)\b|\brelease (the |my )?lock\b|\bwho (has|holds) the lock\b|\btake (over )?the lock\b/i,
    skill: 'lock',
    needsBrain: true,
    what: 'team work lock',
  },
  {
    re: /\bstand-?up\b|\bdaily brief\b|\bweekly review\b|\bweek in review\b|\bwhat did (we|i) (do|ship|get done)\b/i,
    skill: 'digest',
    needsBrain: true,
    what: 'standup / weekly review',
  },
  {
    re: /^\s*dump\b|\bdump\s*[:—–-]|\bjot (this|that|it) down\b|\bwe (just )?decided\b/i,
    skill: 'dump',
    needsBrain: true,
    what: 'note capture',
  },
  {
    re: /\b(all|every) (my |our )?brains?\b|\bmonkey[- ]?brain home\b|\bbrain home\b|\bdashboard (for|of|across) (all|every) (my |our )?projects?\b|\bglobal (brain|monkey brain) dashboard\b/i,
    skill: 'home',
    needsBrain: false,
    what: 'cross-project dashboard',
  },
  {
    re: /\b(brain|vault|project) dashboard\b|\bdashboard (of|for) (the |my |this )?(brain|vault|project)\b|^\s*(open |show )?(me )?(the )?dashboard\s*[.!?]?\s*$|\bshow (me )?the dashboard\b/i,
    skill: 'dashboard',
    needsBrain: true,
    what: 'brain dashboard',
  },
  {
    re: /\b(install|set ?up|add|create)\b[^.!?]{0,20}\bci\b|\bci (pipeline|workflow)\b/i,
    skill: 'ci',
    needsBrain: false,
    what: 'CI setup',
  },
  {
    re: /\bvalidate (this |the |an |my )?idea\b|\bis (this|it) worth building\b|\bpursue,? park,? or kill\b/i,
    skill: 'research',
    needsBrain: true,
    what: 'idea validation (research — validation mode)',
  },
  {
    re: /\bcritique\b[^.!?]{0,60}(https?:\/\/|\bsite\b|\bpage\b|\bdesign\b|\bui\b|\bux\b|\blanding\b|\bscreen\b|\bapp\b)/i,
    skill: 'product-design',
    needsBrain: true,
    what: 'design critique (product-design — critique mode)',
  },
  {
    re: /\bmeeting prep\b|\bprep(are)? (me )?for (the |my |a |our )?(meeting|call|sync|1:1)\b/i,
    skill: 'brief',
    needsBrain: true,
    what: 'meeting prep (brief — meeting mode)',
  },
  {
    re: /\bloop (until|on|over|through)\b|\bkeep (going|iterating) until\b|\biterate\b[^.!?]{0,40}\buntil\b|\bstart an? (build |research |design )?loop\b/i,
    skill: 'loop',
    needsBrain: true,
    what: 'bounded work loop',
  },
  {
    re: /\bbrief me\b|\bcatch me up\b|\bbrief (on|about)\b|^\s*brief\s+\S/i,
    skill: 'brief',
    needsBrain: true,
    what: 'brain brief',
  },
  {
    re: /\bresearch\b/i,
    skill: 'research',
    needsBrain: true,
    what: 'research run',
  },
  {
    re: /\b(write|create|draft|make)\b[^.!?]{0,40}\bspec\b|\bspec out\b|^\s*spec\s+\S/i,
    skill: 'plan',
    needsBrain: true,
    what: 'feature spec',
  },
  {
    re: /\b(build|implement|work)\b[^.!?]{0,40}\bspec\b|\bstart (the )?build phase\b/i,
    skill: 'build',
    needsBrain: true,
    what: 'spec build',
  },
  {
    re: /\breview\b[^.!?]{0,40}\b(code|changes|diff|pr|branch|spec)\b|\bcode review\b/i,
    skill: 'review',
    needsBrain: true,
    what: 'code/spec review',
  },
  {
    re: /\bproduct[- ]design\b|\bdesign (a |the |my |this )?(product|ux|user experience|user flow|interface|screen|app)\b|\b(create|make|write|build) (a |some )?personas?\b|\buser journey\b|\bjourney map\b|\bhow[- ]might[- ]we\b|\busability (test|study|testing)\b|\bheuristic eval|\baccessibility (audit|pass|review)\b/i,
    skill: 'product-design',
    needsBrain: true,
    what: 'product-design process',
  },
  {
    re: /\b(start|make|build|design|prototype)\b[^.!?]{0,30}\bgame\b|\bgame (concept|design document|design doc|mechanics?|loop|balance|pipeline)\b|\bgdd\b|\bcore loop\b|\bplaytest\b/i,
    skill: 'game',
    needsBrain: true,
    what: 'game pipeline',
  },
  {
    re: /\bask (the |my )?brain\b|\bwhat does (the |my )?brain (know|say|have)\b|\bsearch (the |my )?(brain|wiki|vault)\b/i,
    skill: 'query',
    needsBrain: true,
    what: 'brain query',
  },
  {
    re: /\btoken (usage|report|spend|costs?)\b|\busage report\b|\bcache[- ]hit\b|\bhow many tokens\b/i,
    skill: 'usage',
    needsBrain: false,
    what: 'token usage report',
  },
  {
    re: /\bterse( mode)?\b|\bshorter (answers|responses|output)\b|\b(less|more) verbose\b|\bnormal verbosity\b/i,
    skill: 'terse',
    needsBrain: false,
    what: 'terse output mode',
  },
  {
    re: /\bcompress\b[^.!?]{0,50}(\.md\b|claude|memory|manual|instructions|file)/i,
    skill: 'compress',
    needsBrain: false,
    what: 'file compression',
  },
  // Last on purpose: generic development intent phrased without "spec". Every specific
  // workflow above wins first; this one enforces plan-before-build for the rest.
  {
    re: /\b(build|implement|add|create|make|write|develop|code|refactor|migrate|integrate|wire( up)?|fix|patch|debug|rewrite|extend|ship)\b[^.!?]{0,60}\b(features?|functions?|functionality|endpoints?|apis?|routes?|components?|pages?|screens?|modules?|services?|classes|methods?|hooks?|handlers?|scripts?|commands?|flags?|buttons?|forms?|modals?|schemas?|models?|migrations?|tests?|bugs?|issues?|errors?|crash(es)?|apps?|sites?|websites?|backend|frontend|ui|database|db|auth\w*|login|signup|integrations?|plugins?|skills?|parsers?|pipelines?|dashboards?|validation|configs?|settings)\b/i,
    skill: 'plan',
    needsBrain: true,
    what: 'development work',
    dev: true,
  },
];

const QUESTION_RE = /^\s*(why|what|how|explain|describe|where|when|who)\b/i;

/** Open specs (status not done/closed/superseded) as "slug (tier, phase)" labels. */
function openSpecs(brain) {
  const dir = path.join(brain, 'specs');
  if (!fs.existsSync(dir)) return [];
  return lib
    .listFilesRecursive(dir, '.md')
    .map((f) => ({ slug: path.basename(f, '.md'), fm: lib.parseFrontmatter(lib.readTextSafe(f)) }))
    .filter((s) => !['done', 'closed', 'superseded'].includes(String(s.fm.status)))
    .map((s) => `\`${s.slug}\`${s.fm.tier ? ` (${s.fm.tier}${s.fm.phase ? `, phase: ${s.fm.phase}` : ''})` : ''}`);
}

function devHint(brain) {
  const specs = openSpecs(brain);
  const head = '🐵 trigger-router: this looks like development work. Rule: plan before build — no source change without a spec. ';
  if (!specs.length) {
    return head + 'Open specs: none → invoke the brain:plan skill now (Skill tool) to write the spec (tier + numbered ACs), then brain:build. Skip the spec only if the curator explicitly says so in this message.';
  }
  return (
    head +
    `Open specs: ${specs.join(', ')}. If one covers this request → invoke brain:build <slug>. ` +
    'Otherwise → invoke brain:plan first (tier + numbered ACs), then brain:build. Skip the spec only if the curator explicitly says so in this message.'
  );
}

async function main() {
  const input = await lib.readStdinJson();
  const prompt = String(input.prompt || '').trim();
  if (!prompt || prompt.startsWith('/') || /\/brain:/.test(prompt)) return;

  const rule = RULES.find((r) => r.re.test(prompt));
  if (!rule) return;
  if (rule.dev && QUESTION_RE.test(prompt)) return; // a question, not a work order

  const brain = lib.findBrainDir(input.cwd);
  let hint;
  if (rule.needsBrain && !brain) {
    const root = path.resolve(input.cwd || process.cwd());
    if (fs.existsSync(path.join(root, '.no-brain'))) return; // engine declined here
    hint =
      `🐵 trigger-router: that sounds like ${rule.what}, but this project has no .brain/ yet — ` +
      `offer /brain:init first, then continue with /brain:${rule.skill}.`;
  } else if (rule.dev) {
    hint = devHint(brain);
  } else {
    hint =
      `🐵 trigger-router: matched "${rule.what}" → invoke the brain:${rule.skill} skill now ` +
      `(Skill tool) and follow its checklist instead of improvising the workflow.`;
  }

  lib.succeed({
    hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: hint },
  });
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
