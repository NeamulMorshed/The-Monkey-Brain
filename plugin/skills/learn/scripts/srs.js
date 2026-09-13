#!/usr/bin/env node
/**
 * srs.js — SM-2 spaced repetition for the learn pack (v3 P17).
 *
 * Decks live in .brain/learning/<deck>.json, committed with the brain. Only
 * due cards are ever printed — never the whole deck — so a drill costs a few
 * hundred tokens however large the deck grows. Grading follows SM-2: below 3
 * the card restarts (interval 1, ease unchanged); 3–5 grows the interval
 * (1 → 6 → interval × ease) and adjusts the ease, floored at 1.3.
 *
 *   node srs.js add <deck> "<front>" "<back>"
 *   node srs.js due <deck> [--limit N]
 *   node srs.js grade <deck> <id> <0-5>
 *   node srs.js stats [deck]
 *
 * MONKEY_BRAIN_TODAY=YYYY-MM-DD pins "today" (tests). Stdlib only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, '..', '..', '..', 'hooks', 'scripts', 'lib.js'));

const DAY = 86400000;
const today = () => process.env.MONKEY_BRAIN_TODAY || lib.today();
const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY).toISOString().slice(0, 10);
};
const deckFile = (brain, deck) => path.join(brain, 'learning', `${deck}.json`);

function load(brain, deck) {
  if (!/^[\w-]+$/.test(deck || '')) throw new Error('deck names use letters, digits, dashes and underscores');
  return lib.readJsonSafe(deckFile(brain, deck), null) || { deck, cards: [] };
}

function save(brain, d) {
  fs.mkdirSync(path.join(brain, 'learning'), { recursive: true });
  fs.writeFileSync(deckFile(brain, d.deck), JSON.stringify(d, null, 2) + '\n', 'utf8');
}

function add(brain, deck, front, back) {
  const f = String(front || '').trim();
  const b = String(back || '').trim();
  if (!f || !b) throw new Error('add needs a front and a back');
  const d = load(brain, deck);
  if (d.cards.some((c) => c.front === f)) throw new Error(`"${f}" is already in ${deck}`);
  const id = d.cards.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  d.cards.push({ id, front: f, back: b, ef: 2.5, interval: 0, reps: 0, lapses: 0, due: today(), added: today() });
  save(brain, d);
  return id;
}

function dueCards(brain, deck) {
  const t = today();
  return load(brain, deck).cards.filter((c) => c.due <= t).sort((a, b) => a.due.localeCompare(b.due) || a.id - b.id);
}

function grade(brain, deck, id, q) {
  if (!Number.isInteger(q) || q < 0 || q > 5) throw new Error('grade is 0–5 (0 blank · 3 recalled with effort · 5 instant)');
  const d = load(brain, deck);
  const c = d.cards.find((x) => x.id === id);
  if (!c) throw new Error(`no card #${id} in ${deck}`);
  if (q < 3) {
    c.reps = 0;
    c.interval = 1;
    c.lapses += 1;
  } else {
    c.reps += 1;
    c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 6 : Math.round(c.interval * c.ef);
    c.ef = Math.max(1.3, Math.round((c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))) * 100) / 100);
  }
  c.due = addDays(today(), c.interval);
  save(brain, d);
  return c;
}

function stats(brain, deck) {
  const dir = path.join(brain, 'learning');
  const decks = deck ? [deck] : fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
  if (!decks.length) return 'No decks yet — `srs.js add <deck> "<front>" "<back>"` starts one.';
  const t = today();
  return decks.map((name) => {
    const cs = load(brain, name).cards;
    const ease = cs.length ? (cs.reduce((s, c) => s + c.ef, 0) / cs.length).toFixed(2) : '—';
    return `${name}: ${cs.length} card(s) · ${cs.filter((c) => c.due <= t).length} due today · ` +
      `${cs.filter((c) => c.reps > 0).length} learned · ${cs.filter((c) => c.interval >= 21).length} mature · ease ${ease}`;
  }).join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--limit' || argv[i] === '--brain') i++;
    else words.push(argv[i]);
  }
  const [cmd, deck, a, b] = words;
  const brain = opt('--brain') ? path.resolve(opt('--brain')) : lib.findBrainDir(process.cwd());
  if (!brain) {
    console.log('No Monkey Brain found here — run /brain:init first.');
    return;
  }
  try {
    if (cmd === 'add') {
      console.log(`Added #${add(brain, deck, a, b)} to ${deck} — due today.`);
    } else if (cmd === 'due') {
      const all = dueCards(brain, deck);
      const shown = all.slice(0, Number(opt('--limit')) || 20);
      console.log(
        all.length
          ? `${all.length} due in ${deck} (showing ${shown.length}) — reveal each back only after the answer:\n` +
            shown.map((c) => `#${c.id} · front: ${c.front} · back: ${c.back}`).join('\n')
          : `Nothing due in ${deck} today.`
      );
    } else if (cmd === 'grade') {
      const c = grade(brain, deck, Number(a), Number(b));
      console.log(`#${c.id} graded ${b} → next due ${c.due} (interval ${c.interval}d · ease ${c.ef}${c.lapses ? ` · ${c.lapses} lapse(s)` : ''})`);
    } else if (cmd === 'stats') {
      console.log(stats(brain, deck));
    } else {
      console.error('usage: srs.js add <deck> "<front>" "<back>" | due <deck> [--limit N] | grade <deck> <id> <0-5> | stats [deck]');
      process.exit(1);
    }
  } catch (e) {
    console.error(`srs: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { add, dueCards, grade, stats };
