#!/usr/bin/env node
/**
 * ci.js — detect a project's stack and write a GitHub Actions workflow (v3 P14).
 *
 * Node (npm / pnpm / yarn; runs whichever of lint, typecheck, test, build the
 * package.json defines), Python (pip + pytest when tests exist), Go (vet, test,
 * build), .NET (restore, build, test) and Rust (build, test) — one job per
 * stack in .github/workflows/ci.yml. Never overwrites an existing workflow
 * without --force.
 *
 *   node ci.js [--dry-run] [--force] [--root DIR]
 *
 * Library: detect(root) → [{ id, name, setup, steps }] (doctor check 19 uses it).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, 'lib.js'));

function detect(root) {
  const has = (f) => fs.existsSync(path.join(root, f));
  let entries = [];
  try { entries = fs.readdirSync(root); } catch {}
  const jobs = [];

  if (has('package.json')) {
    const scripts = ((lib.readJsonSafe(path.join(root, 'package.json'), {}) || {}).scripts) || {};
    const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : 'npm';
    const install = pm === 'pnpm'
      ? 'pnpm install --frozen-lockfile'
      : pm === 'yarn' ? 'yarn install --frozen-lockfile' : has('package-lock.json') ? 'npm ci' : 'npm install';
    const run = (s) => (pm === 'npm' ? `npm run ${s}` : `${pm} ${s}`);
    const steps = [{ name: 'Install', run: install }];
    for (const s of ['lint', 'typecheck', 'test', 'build']) {
      if (scripts[s] && !/no test specified/i.test(scripts[s])) steps.push({ name: s[0].toUpperCase() + s.slice(1), run: run(s) });
    }
    const node = { uses: 'actions/setup-node@v4', with: { 'node-version': 'lts/*', ...(pm === 'npm' ? { cache: 'npm' } : {}) } };
    jobs.push({ id: 'node', name: 'Node', setup: pm === 'pnpm' ? [{ uses: 'pnpm/action-setup@v4' }, node] : [node], steps });
  }

  if (has('pyproject.toml') || has('requirements.txt') || has('setup.py')) {
    const steps = [{ name: 'Install', run: has('requirements.txt') ? 'python -m pip install -r requirements.txt pytest' : 'python -m pip install . pytest' }];
    if (has('tests') || has('test') || entries.some((f) => /^test_.*\.py$/.test(f))) steps.push({ name: 'Test', run: 'python -m pytest' });
    jobs.push({ id: 'python', name: 'Python', setup: [{ uses: 'actions/setup-python@v5', with: { 'python-version': '3.12' } }], steps });
  }

  if (has('go.mod')) {
    jobs.push({
      id: 'go',
      name: 'Go',
      setup: [{ uses: 'actions/setup-go@v5', with: { 'go-version-file': 'go.mod' } }],
      steps: [{ name: 'Vet', run: 'go vet ./...' }, { name: 'Test', run: 'go test ./...' }, { name: 'Build', run: 'go build ./...' }],
    });
  }

  if (entries.some((f) => /\.(sln|csproj|fsproj)$/i.test(f))) {
    jobs.push({
      id: 'dotnet',
      name: '.NET',
      setup: [{ uses: 'actions/setup-dotnet@v4', with: { 'dotnet-version': '8.0.x' } }],
      steps: [{ name: 'Restore', run: 'dotnet restore' }, { name: 'Build', run: 'dotnet build --no-restore' }, { name: 'Test', run: 'dotnet test --no-build' }],
    });
  }

  if (has('Cargo.toml')) {
    jobs.push({ id: 'rust', name: 'Rust', setup: [], steps: [{ name: 'Build', run: 'cargo build --locked' }, { name: 'Test', run: 'cargo test --locked' }] });
  }
  return jobs;
}

function workflow(jobs) {
  const y = ['name: CI', '', 'on:', '  push:', '  pull_request:', '', 'jobs:'];
  for (const j of jobs) {
    y.push(`  ${j.id}:`, `    name: ${j.name}`, '    runs-on: ubuntu-latest', '    steps:', '      - uses: actions/checkout@v4');
    for (const s of j.setup) {
      y.push(`      - uses: ${s.uses}`);
      if (s.with) {
        y.push('        with:');
        for (const [k, v] of Object.entries(s.with)) y.push(`          ${k}: ${JSON.stringify(v)}`);
      }
    }
    for (const s of j.steps) y.push(`      - name: ${s.name}`, `        run: ${s.run}`);
  }
  return y.join('\n') + '\n';
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--root');
  const brain = lib.findBrainDir(process.cwd());
  const root = path.resolve(i >= 0 ? argv[i + 1] : brain ? path.dirname(brain) : process.cwd());
  const jobs = detect(root);
  if (!jobs.length) {
    console.log('No supported stack found here (package.json, pyproject.toml / requirements.txt, go.mod, .sln / .csproj, Cargo.toml) — nothing to write.');
    return;
  }
  const yaml = workflow(jobs);
  const file = path.join(root, '.github', 'workflows', 'ci.yml');
  const summary = jobs.map((j) => `${j.name} (${j.steps.map((s) => s.name.toLowerCase()).join(', ')})`).join(' · ');
  if (argv.includes('--dry-run')) {
    console.log(`Would write .github/workflows/ci.yml — ${summary}\n\n${yaml}`);
    return;
  }
  if (fs.existsSync(file) && !argv.includes('--force')) {
    console.log('.github/workflows/ci.yml already exists — left untouched (pass --force to replace it).');
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, yaml, 'utf8');
  console.log(`Wrote .github/workflows/ci.yml — ${summary}`);
}

if (require.main === module) main();

module.exports = { detect, workflow };
