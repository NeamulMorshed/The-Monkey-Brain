#!/usr/bin/env node
/**
 * agent-track.js — hook #7 (PreToolUse on Agent|Task).
 *
 * Model economics made visible (ROADMAP Phase 2 #7, feeding the P5.5 routing
 * policy): every agent dispatch inside a brain project is logged to
 * .brain/sessions/agents.md (type · model · purpose), and heavy dispatches
 * without an explicit model are blocked ONCE per session with the routing
 * table — one corrective retry, then the session is left alone.
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

One line per subagent dispatch (hook #7). Routing policy: haiku = triage ·
sonnet = routine · main model = judgment. Doctor (P8) reads the model mix here.
`;

async function main() {
  const input = await lib.readStdinJson();
  if (!/^(Agent|Task)$/.test(input.tool_name || '')) return;
  const brain = lib.findBrainDir(input.cwd);
  if (!brain) return;

  const ti = input.tool_input || {};
  const type = typeof ti.subagent_type === 'string' ? ti.subagent_type : '';
  const model = typeof ti.model === 'string' ? ti.model : '';
  const what = String(ti.description || ti.prompt || '(no description)')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  const marker = path.join(
    os.tmpdir(),
    `mb-agent-${String(input.session_id || 'nosession').replace(/[^\w-]/g, '')}`
  );
  const willBlock = !model && HEAVY_TYPES.has(type) && !fs.existsSync(marker);

  // Log first so blocked attempts leave a trace too.
  const dir = path.join(brain, 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'agents.md');
  if (!fs.existsSync(file)) fs.writeFileSync(file, HEADER, 'utf8');
  fs.appendFileSync(
    file,
    `- [${stamp()}] ${type || 'general-purpose'} · model: ${model || '(inherit)'} · ${what}` +
      `${willBlock ? ' · ⛔ blocked: no explicit model' : ''}\n`,
    'utf8'
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
