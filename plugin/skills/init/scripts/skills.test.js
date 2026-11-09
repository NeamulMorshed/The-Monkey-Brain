#!/usr/bin/env node
/**
 * skills.test.js — smoke test for skills.js (the full matrix lives in hooks/scripts/selftest.js,
 * section "v0.35.0 motion-skill-packs"). Run: node skills.test.js
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const skills = require('./skills.js');

const manifest = skills.loadManifest();
assert.strictEqual(manifest.packs.length, 3, 'three packs');
const out = skills.render(manifest, { installed: new Set(['animate']) });
assert.ok(/web-motion\s+~ partial/.test(out), 'a part-installed pack renders as partial');
assert.ok(/video\s+ {2}not installed/.test(out), 'an untouched pack renders as not installed');
assert.strictEqual(skills.packStatus(manifest.packs[2], new Set(manifest.packs[2].skills)).state, 'installed');

const brain = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-test-'));
try {
  const first = skills.seedInstincts(manifest, 'web-motion', brain);
  assert.ok(first.written.length >= 1 && first.written.length <= 6, 'seeds 1..6 rules');
  assert.deepStrictEqual(skills.seedInstincts(manifest, 'web-motion', brain).written, [], 're-run writes nothing');
  assert.ok(!fs.existsSync(path.join(brain, 'instincts', 'active')), 'never touches active/');
} finally {
  fs.rmSync(brain, { recursive: true, force: true });
}
console.log('skills.test.js: ok');
