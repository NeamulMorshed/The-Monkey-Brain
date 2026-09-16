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
 * Research first: generic development intent ("add a login feature", "fix the
 * crash on upload") — anything a specific workflow above didn't claim — enters the
 * develop lifecycle at brain:research, then brain:plan, then brain:build. An open spec
 * that covers the request goes to brain:build; research the brain already holds
 * (wiki/research/ frontmatter overlapping the prompt) goes to brain:plan citing it;
 * a curator skip ("skip research", "just build it", "quick fix") enters at plan.
 * Advisory like everything else here.
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
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const lib = require(path.join(__dirname, 'lib.js'));

// Order matters: first match wins. `what` names the workflow in the hint.
const RULES = [
  {
    re: /\b(set\s?up|initiali[sz]e|init|create|scaffold)\b\s+(?:(?!(?:checks?|rules?|tests?|features?|doctor|for|to|in|on|with|of|from|about|into|inside|that|which|and)\b)\w+\s+){0,3}(?:monkey\s?brain|\.?brain)\b|\bnew brain\b/i, // up to three plain words in between — never a feature noun or a preposition (v0.33.0)
    question: true,
    skill: 'init',
    needsBrain: false,
    what: 'brain setup',
  },
  {
    re: /\bingest\b|\bprocess (the |my )?clippings?\b|\badd (this|that|it|these) to the (brain|wiki|vault)\b/i,
    question: true, // "how do I ingest a PDF?" asks; it does not order (v0.33.0)
    skill: 'ingest',
    needsBrain: true,
    what: 'source ingestion',
  },
  {
    re: /\bwrap(\s+\w+){0,2}\s+up\b|\bend (the |this )?session\b|\bcall it a (day|night)\b/i,
    question: true,
    skill: 'wrap',
    needsBrain: true,
    what: 'session wrap-up',
  },
  {
    re: /\bbrain[- ]?doctor\b|\b(brain|wiki|vault) (doctor|health)\b|\bhealth[- ]?check (the |my )?(brain|wiki|vault)\b|\bis (the |my )?(brain|wiki|vault) healthy\b|\bcheck (the |my )?(brain|wiki|vault)'?s? health\b|\baudit (?:the |all |every |my )?(?:brain|wiki|vault|plugins?|hooks?)\b|\b(?:review|check) (?:the |this |my )?(?:entire |whole )?(?:brain|wiki|vault)\b(?![-'’])(?=\s*(?:$|[.,;:!?)]|\b(?:and|then|please|now)\b))|\bis (?:the |my )?(?:brain|wiki|vault) (?:working|ok|okay|fine|broken)\b/i,
    not: () => DOCTOR_FEATURE, // building a doctor check is dev work, not a health report (v0.33.0)
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
    not: () => DUMP_PIVOT, // "we decided X, now build Y" is a work order, not a note (v0.33.0)
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
    re: /(?<!\b(?:for|the|a|an|this|that|my|our|your|in|of|any|some|no|like)\s)\bresearch\b(?!\s+purposes?\b)/i, // a verb — not "the research", "for research purposes"
    not: () => SKIP_RE, // a skip names research without asking for it
    question: true, // "why did the research … misfire?" is a question, not a work order (v0.33.0)
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
    re: /\bproduct[- ]design\b|\b(?:re)?design(?:ing)? (?:a |an |the |my |our |this )?(?:(?!(?:for|to|in|on|with|of|from|about|into|that|which|and)\b)[\w-]+ ){0,3}(?:product|ux|user experience|user flows?|interface|screens?|app|onboarding|checkout|navigation)\b|\b(create|make|write|build) (a |some )?personas?\b|\buser journey\b|\bjourney map\b|\bhow[- ]might[- ]we\b|\busability (test|study|testing)\b|\bheuristic eval|\baccessibility (audit|pass|review)\b/i,
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
    re: /\b(build|implement|add|create|make|write|develop|code|refactor|migrate|integrate|wire( up)?|fix|patch|debug|rewrite|extend|ship)\b[^.!?]{0,60}\b(features?|functions?|functionality|endpoints?|apis?|routes?|components?|pages?|screens?|modules?|services?|classes|methods?|hooks?|handlers?|scripts?|commands?|flags?|buttons?|forms?|modals?|schemas?|models?|migrations?|tests?|bugs?|issues?|errors?|crash(es)?|apps?|sites?|websites?|backend|frontend|ui|database|db|auth\w*|login|signup|integrations?|plugins?|skills?|parsers?|pipelines?|dashboards?|validation|configs?|settings|checks?|rules?)\b/i,
    skill: 'research',
    needsBrain: true,
    what: 'development work',
    dev: true,
  },
];

const QUESTION_RE = /^\s*(why|what|how|explain|describe|where|when|who|is|are|does|did|should|would|will|has|any|was|were)\b/i;

/** A pasted subagent report or a teammate's message — someone else's words, never the curator's order (v0.33.0). */
const HANDBACK_RE = /^\s*(?:\[Subagent hand-back\]|Another Claude session sent a message|<agent-message\b)/i;
/** Building a check or rule FOR the doctor is development, not a request for a health report. */
const DOCTOR_FEATURE = /\b(?:add|create|write|build|implement|make|extend)\b[^.!?]{0,30}\b(?:checks?|rules?|features?|tests?)\b/i;
/** "we decided X, now build Y": the build order outranks the note. */
const DUMP_PIVOT = /^(?!\s*dump\b)[\s\S]*?\bwe (?:just )?decided\b[\s\S]*?(?:\bnow\b|[.;:—–,]|\s-)\s*(?:(?:so|then|and|now|please)\s+)*(?:build|implement|add|create|make|write|fix|wire|integrate)\b/i;
/** The dev hint names at most this many open specs. */
const MAX_SPECS = 8;

/**
 * The curator's explicit research skip — only their own words, never inferred. Polarity-aware:
 * "should not skip research" is not a skip, "no research paper parser" is not a skip, and
 * "trivial" counts only as a label ("trivial: …", "this is trivial"), never inside "non-trivial".
 */
const SKIP_RE = new RegExp(
  [
    "(?<!\\b(?:not|never|don'?t|shouldn'?t|won'?t|without)\\s)\\b(?:skip|no need for|without(?: any)?|don'?t|do not)\\b[^.!?]{0,20}?\\bresearch\\b(?!\\s+(?:papers?|pages?|parsers?|tools?|modules?|sections?|reports?|teams?|data))",
    '\\bno research\\b(?=\\s*(?:needed|required|necessary|first|please|for this|on this)?\\s*(?:[,.;:!?)]|$))',
    '\\bjust (?:plan|build|fix|do|implement|write|add) (?:it|this|that|the)\\b',
    '\\bquick fix\\b',
    "(?:^\\s*|[,;:(]\\s*|\\b(?:this is|it'?s|that'?s)\\s+(?:a\\s+)?)trivial\\b(?!-)",
  ].join('|'),
  'i'
);

/** Words that carry no topic: common function words plus the dev verbs/nouns of the catch-all rule. */
const STOP = new Set(('about after again against before being below between could every first other should since ' +
  'their there these think those through under until using where which while would please thing things ' +
  'maybe still really right going research spec specs brain monkey project projects current existing ' +
  'update change remove delete support improve handle system user client server mobile simple better ' +
  'table field value string number option make sure need want ' +
  'build implement create write develop refactor migrate integrate patch debug rewrite extend feature ' +
  'function functionality endpoint route component page screen module service class method hook handler ' +
  'script command flag button form modal schema model migration test issue error crash website backend ' +
  'frontend database login signup integration plugin skill parser pipeline dashboard validation config setting').split(/\s+/));

/** Significant topic tokens of a string: ≥ 5 letters, plural-stripped the same way on both sides, not a stop word. */
function topicTokens(s) {
  const out = new Set();
  for (const w of String(s || '').toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) || []) {
    const t = /(?:ss|sh|ch|x)es$/.test(w) ? w.slice(0, -2) : w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
    if (!STOP.has(t) && !STOP.has(w)) out.add(t);
  }
  return out;
}

/**
 * Slugs of wiki/research/ pages whose title, tags, aliases or slug share at least two topic tokens
 * with the prompt (one shared word — "entry", "hooks" — is noise), best three first. Fails open to [].
 */
function relatedResearch(brain, prompt) {
  try {
    const dir = path.join(brain, 'wiki', 'research');
    if (!fs.existsSync(dir)) return [];
    const want = topicTokens(prompt);
    if (want.size < 2) return [];
    const hits = [];
    for (const f of lib.listFilesRecursive(dir, '.md')) {
      let head = '';
      try {
        const fd = fs.openSync(f, 'r');
        const buf = Buffer.alloc(8192);
        head = buf.toString('utf8', 0, fs.readSync(fd, buf, 0, 8192, 0));
        fs.closeSync(fd);
      } catch { continue; }
      const fm = lib.parseFrontmatter(head);
      const slug = path.basename(f, '.md');
      const flat = (v) => (Array.isArray(v) ? v.join(' ') : String(v || ''));
      const have = topicTokens(`${slug.replace(/-/g, ' ')} ${flat(fm.title)} ${flat(fm.tags)} ${flat(fm.aliases)}`);
      let score = 0;
      for (const t of want) if (have.has(t)) score++;
      if (score >= 2) hits.push({ slug, score });
    }
    return hits.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug)).slice(0, 3).map((h) => h.slug);
  } catch {
    return [];
  }
}

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

function devHint(brain, prompt) {
  const specs = openSpecs(brain);
  const skip = SKIP_RE.test(prompt);
  const related = skip ? [] : relatedResearch(brain, prompt);
  const head = '🐵 trigger-router: this looks like development work. Rule: research → plan → build — no source change without a spec. ';
  let entry;
  if (skip) {
    entry = "research skipped at the curator's word → invoke the brain:plan skill now (Skill tool) to write the spec (tier + numbered ACs), then brain:build.";
  } else if (related.length) {
    entry = `Related research: ${related.map((s) => `\`${s}\``).join(', ')} → invoke the brain:plan skill now (Skill tool) citing it (tier + numbered ACs), then brain:build. Skip research only if the curator explicitly says so in this message.`;
  } else {
    entry = 'invoke the brain:research skill now (Skill tool) to file wiki/research/ findings, then brain:plan (tier + numbered ACs), then brain:build. Skip research only if the curator explicitly says so in this message.';
  }
  if (!specs.length) return head + 'Open specs: none → ' + entry;
  const shown = specs.slice(0, MAX_SPECS).join(', ') + (specs.length > MAX_SPECS ? ` +${specs.length - MAX_SPECS} more` : '');
  return head + `Open specs: ${shown}. If one covers this request → invoke brain:build <slug>. Otherwise → ` + entry;
}

async function main() {
  const input = await lib.readStdinJson();
  const prompt = String(input.prompt || '').trim();
  if (!prompt || prompt.startsWith('/') || /\/brain:/.test(prompt)) return;
  if (HANDBACK_RE.test(prompt)) return; // someone else's report pasted into the conversation

  const rule = RULES.find((r) => r.re.test(prompt) && !(r.not && r.not().test(prompt)));
  if (!rule) return;
  if ((rule.dev || rule.question) && QUESTION_RE.test(prompt)) return; // a question, not a work order

  const brain = lib.findBrainDir(input.cwd);
  let hint;
  if (rule.needsBrain && !brain) {
    const root = path.resolve(input.cwd || process.cwd());
    if (fs.existsSync(path.join(root, '.no-brain'))) return; // engine declined here
    const next = !rule.dev ? `/brain:${rule.skill}` : SKIP_RE.test(prompt) ? '/brain:plan → /brain:build (research skipped at your word)' : '/brain:research → /brain:plan → /brain:build';
    // The init offer is made once per session in a repo (v0.33.0); afterwards dev work still gets its
    // lifecycle line and other workflows stay quiet. Without a session id nothing is remembered.
    const sid = String(input.session_id || '').replace(/[^\w-]/g, '');
    const offered = sid ? path.join(os.tmpdir(), `mb-router-init-${sid}-${crypto.createHash('sha1').update(root).digest('hex').slice(0, 8)}`) : '';
    if (offered && fs.existsSync(offered)) {
      if (!rule.dev) return;
      hint = `🐵 trigger-router: that sounds like ${rule.what} (this project has no .brain/) — ${next}.`;
    } else {
      if (offered) { try { fs.writeFileSync(offered, ''); } catch {} }
      hint =
        `🐵 trigger-router: that sounds like ${rule.what}, but this project has no .brain/ yet — ` +
        `offer /brain:init first, then continue with ${next}.`;
    }
  } else if (rule.dev) {
    hint = devHint(brain, prompt);
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
