#!/usr/bin/env node
/**
 * agent-track.js — hook #7 (PreToolUse on Agent|Task + SubagentStop).
 *
 * Model economics made visible (ROADMAP Phase 2 #7, feeding the P5.5 routing
 * policy): every agent dispatch inside a brain project is logged to
 * .brain/sessions/agents.md (type · model · purpose), and heavy dispatches
 * without an explicit model are blocked ONCE per session with the routing
 * table — one corrective retry, then the session is left alone.
 *
 * On SubagentStop (v3 P11) it appends the outcome: done/empty, the model(s)
 * that actually ran, and the real token count from the subagent's own
 * transcript — the ledger doctor check 18 reads. It never blocks a stop.
 *
 *   Routing policy: scripts = deterministic checks · haiku = classification /
 *   triage · sonnet = routine execution / research fan-out · main model =
 *   judgment, synthesis, final review.
 *
 * Lightweight agents that pin their own model in their definition (Explore,
 * guide agents, custom subagents) pass through untouched. No brain → silent.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));
const usage = require(path.join(__dirname, 'usage.js'));
const loops = require(path.join(__dirname, 'loop.js'));

/** Dispatches that check work rather than produce it. */
const VERIFYING = /\b(verif\w*|review\w*|audit\w*|critique\w*|check(s|ing)?)\b/i;

/** Agent types that default to the (expensive) main model when unpinned. */
const HEAVY_TYPES = new Set(['', 'general-purpose', 'claude', 'Plan', 'fork']);

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${lib.today()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const HEADER = `---
title: "Agent dispatch log"
type: agent-log
---

One line per subagent dispatch (hook #7), and a "↳" line with each outcome,
model and real token count when it finishes. Routing policy: haiku = triage ·
sonnet = routine · main model = judgment. Doctor reads the model mix and outcomes here.
`;

function appendLog(brain, line) {
  const dir = path.join(brain, 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'agents.md');
  if (!fs.existsSync(file)) fs.writeFileSync(file, HEADER, 'utf8');
  fs.appendFileSync(file, line + '\n', 'utf8');
}

function recordOutcome(input) {
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;
  const file =
    input.agent_transcript_path ||
    (input.transcript_path && input.agent_id
      ? path.join(String(input.transcript_path).replace(/\.jsonl$/, ''), 'subagents', `agent-${input.agent_id}.jsonl`)
      : '');
  const seen = new Set();
  const models = new Set();
  let tokens = 0;
  for (const r of file ? usage.readTranscript(file) : []) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    models.add(r.model);
    tokens += r.input + r.cacheWrite + r.cacheRead + r.output;
  }
  const outcome = String(input.last_assistant_message || '').trim() ? 'done' : 'empty';
  appendLog(
    brain,
    `- [${stamp()}] ↳ ${outcome} · ${input.agent_type || 'agent'} · on ${[...models].join('+') || 'unknown'} · ` +
      `${tokens.toLocaleString('en-US')} tokens · ${seen.size} turn(s)`
  );
}

async function main() {
  const input = await lib.readStdinJson();
  if (input.hook_event_name === 'SubagentStop') return recordOutcome(input);
  if (!/^(Agent|Task)$/.test(input.tool_name || '')) return;
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;

  const ti = input.tool_input || {};
  const type = typeof ti.subagent_type === 'string' ? ti.subagent_type : '';
  const model = typeof ti.model === 'string' ? ti.model : '';
  const what = String(ti.description || ti.prompt || '(no description)')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  // v3 P12: while a loop runs, its verifier must not share the generator's model family.
  if (model && VERIFYING.test(`${type} ${ti.description || ''}`)) {
    const clash = loops.activeLoops(brain).find((l) => l.generator && loops.family(l.generator) === loops.family(model));
    if (clash) {
      appendLog(brain, `- [${stamp()}] ${type || 'general-purpose'} · model: ${model} · ${what} · ⛔ blocked: verifier shares loop ${clash.id}'s model family`);
      lib.block(
        `🐵 agent-track[loop]: loop \`${clash.id}\` generates with ${clash.generator}; a verifier on the same model family ` +
          `(${loops.family(model)}) tends to miss the same mistakes. Re-dispatch this check on a different family — ` +
          `e.g. ${loops.family(clash.generator) === 'opus' ? 'sonnet' : 'opus'}.`
      );
    }
  }

  const marker = path.join(
    os.tmpdir(),
    `mb-agent-${String(input.session_id || 'nosession').replace(/[^\w-]/g, '')}`
  );
  const willBlock = !model && HEAVY_TYPES.has(type) && !fs.existsSync(marker);

  // Log first so blocked attempts leave a trace too.
  appendLog(
    brain,
    `- [${stamp()}] ${type || 'general-purpose'} · model: ${model || '(inherit)'} · ${what}` +
      `${willBlock ? ' · ⛔ blocked: no explicit model' : ''}`
  );

  if (willBlock) {
    fs.writeFileSync(marker, '');
    lib.block(
      `🐵 agent-track: pick a model for this dispatch explicitly (Agent tool \`model\` param) — ` +
        `routing policy: haiku = classification/triage · sonnet = routine execution/research fan-out · ` +
        `opus/main = judgment, synthesis, review. Re-dispatch with the model matching the work. ` +
        `(Enforced once per session; dispatches are logged in .brain/sessions/agents.md.)`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(0));
