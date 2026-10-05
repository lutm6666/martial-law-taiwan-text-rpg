'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const {normalizePlan, readyWaves, scopesOverlap, taskPrompt, slug} = require('./ai-orchestrator');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('ok - ' + name);
  } catch (error) {
    console.error('not ok - ' + name);
    throw error;
  }
}

function basePlan(tasks, extra = {}) {
  return {
    id: 'case3-next',
    title: 'Case 3 next pass',
    goal: 'Improve Case 3 safely.',
    maxParallel: 3,
    tasks,
    ...extra
  };
}

function task(id, agent, paths, dependsOn = []) {
  return {
    id,
    agent,
    title: id,
    goal: 'Complete ' + id,
    paths,
    dependsOn,
    acceptance: ['tests pass']
  };
}

function git(cwd, args) {
  return cp.execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
}

test('slug normalizes unsafe branch fragments', () => {
  assert.equal(slug('  Case 3 / UI Pass  '), 'case-3-ui-pass');
});

test('normalizes plan and deterministic branch ownership', () => {
  const plan = normalizePlan(basePlan([
    task('logic', 'codex', ['case3-film-engine.js']),
    task('ui', 'claude', ['case3-film-ui.js'])
  ]));
  assert.equal(plan.base, 'main');
  assert.equal(plan.integrationBranch, 'handoff/orch-case3-next');
  assert.equal(plan.tasks[0].branch, 'codex/case3-next-logic');
  assert.equal(plan.tasks[1].branch, 'claude/case3-next-ui');
});

test('rejects integration branches outside the orchestration namespace', () => {
  assert.throws(() => normalizePlan(basePlan([
    task('logic', 'codex', ['logic/'])
  ], {integrationBranch: 'main'})), /must differ from base/);
  assert.throws(() => normalizePlan(basePlan([
    task('logic', 'codex', ['logic/'])
  ], {integrationBranch: 'feature/free-form'})), /handoff\/orch-/);
});

test('independent non-overlapping tasks share a wave', () => {
  const plan = normalizePlan(basePlan([
    task('logic', 'codex', ['case3-film-engine.js']),
    task('ui', 'claude', ['case3-film-ui.js']),
    task('docs', 'handoff', ['docs/case3/'])
  ]));
  assert.deepEqual(readyWaves(plan), [['docs', 'logic', 'ui']]);
});

test('maxParallel limits wave width', () => {
  const plan = normalizePlan(basePlan([
    task('a', 'codex', ['a/']),
    task('b', 'claude', ['b/']),
    task('c', 'handoff', ['c/'])
  ], {maxParallel: 2}));
  assert.deepEqual(readyWaves(plan), [['a', 'b'], ['c']]);
});

test('dependencies form later waves', () => {
  const plan = normalizePlan(basePlan([
    task('schema', 'codex', ['schema/']),
    task('engine', 'codex', ['engine/'], ['schema']),
    task('ui', 'claude', ['ui/'], ['engine'])
  ]));
  assert.deepEqual(readyWaves(plan), [['schema'], ['engine'], ['ui']]);
});

test('rejects dependency cycles', () => {
  assert.throws(() => normalizePlan(basePlan([
    task('a', 'codex', ['a/'], ['b']),
    task('b', 'claude', ['b/'], ['a'])
  ])), /Dependency cycle/);
});

test('rejects unknown dependencies', () => {
  assert.throws(() => normalizePlan(basePlan([
    task('a', 'codex', ['a/'], ['missing'])
  ])), /unknown task/);
});

test('rejects unsupported agents', () => {
  assert.throws(() => normalizePlan(basePlan([
    task('a', 'other', ['a/'])
  ])), /unsupported agent/);
});

test('detects exact and nested scope overlap', () => {
  assert.equal(scopesOverlap('src/ui/', 'src/ui/button.js'), true);
  assert.equal(scopesOverlap('src/logic.js', 'src/ui.js'), false);
  assert.equal(scopesOverlap('assets/case3/*.webp', 'assets/case3/e01.webp'), true);
});

test('rejects parallel tasks with overlapping scopes', () => {
  assert.throws(() => normalizePlan(basePlan([
    task('ui-a', 'claude', ['src/ui/']),
    task('ui-b', 'handoff', ['src/ui/modal.js'])
  ])), /overlapping path scope/);
});

test('allows overlapping scopes when sequencing is explicit', () => {
  const plan = normalizePlan(basePlan([
    task('ui-a', 'claude', ['src/ui/']),
    task('ui-b', 'handoff', ['src/ui/modal.js'], ['ui-a'])
  ]));
  assert.deepEqual(readyWaves(plan), [['ui-a'], ['ui-b']]);
});

test('prompt states scope and completion contract', () => {
  const plan = normalizePlan(basePlan([
    task('logic', 'codex', ['case3-film-engine.js'])
  ]));
  const prompt = taskPrompt(plan, plan.tasks[0]);
  assert.match(prompt, /Do not modify files outside the allowed scope/);
  assert.match(prompt, /codex\/case3-next-logic/);
  assert.match(prompt, /Report commit SHA/);
});

test('materialize executes real git worktrees one dependency wave at a time', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-orchestrator-'));
  const repo = path.join(root, 'repo');
  const worktrees = path.join(root, 'worktrees');
  const planFile = path.join(root, 'plan.json');
  fs.mkdirSync(repo);
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.email', 'ci@example.invalid']);
  git(repo, ['config', 'user.name', 'CI']);
  fs.writeFileSync(path.join(repo, 'README.md'), 'fixture\n');
  git(repo, ['add', 'README.md']);
  git(repo, ['commit', '-m', 'fixture']);
  fs.writeFileSync(planFile, JSON.stringify({
    id: 'fixture',
    integrationBranch: 'handoff/orch-fixture',
    tasks: [
      task('logic', 'codex', ['README.md']),
      task('ui', 'claude', ['ui.html'], ['logic'])
    ]
  }));
  const runner = path.resolve(__dirname, 'ai-orchestrator.js');

  cp.execFileSync(process.execPath, [runner, 'materialize', planFile, '--root', worktrees], {cwd: repo, stdio: 'pipe'});
  assert.equal(fs.existsSync(path.join(worktrees, 'logic', '.git')), true);
  assert.equal(fs.existsSync(path.join(worktrees, 'ui')), false);
  assert.equal(git(repo, ['show-ref', '--verify', '--quiet', 'refs/heads/handoff/orch-fixture']), '');
  assert.equal(git(repo, ['show-ref', '--verify', '--quiet', 'refs/heads/codex/fixture-logic']), '');

  cp.execFileSync(process.execPath, [runner, 'materialize', planFile, '--root', worktrees, '--wave', '2'], {cwd: repo, stdio: 'pipe'});
  assert.equal(fs.existsSync(path.join(worktrees, 'ui', '.git')), true);
  assert.equal(git(repo, ['show-ref', '--verify', '--quiet', 'refs/heads/claude/fixture-ui']), '');

  const state = JSON.parse(fs.readFileSync(path.join(worktrees, 'state.json'), 'utf8'));
  assert.equal(state.lastMaterializedWave, 2);
  assert.deepEqual(state.tasks.map(item => item.id).sort(), ['logic', 'ui']);

  const status = cp.execFileSync(process.execPath, [runner, 'status', planFile, '--root', worktrees], {cwd: repo, encoding: 'utf8'});
  assert.match(status, /logic/);
  assert.match(status, /ui/);

  cp.execFileSync(process.execPath, [runner, 'cleanup', planFile, '--root', worktrees], {cwd: repo, stdio: 'pipe'});
  assert.equal(fs.existsSync(path.join(worktrees, 'logic')), false);
  assert.equal(fs.existsSync(path.join(worktrees, 'ui')), false);
  assert.equal(git(repo, ['show-ref', '--verify', '--quiet', 'refs/heads/codex/fixture-logic']), '');
  assert.equal(git(repo, ['show-ref', '--verify', '--quiet', 'refs/heads/claude/fixture-ui']), '');
});

console.log(`PASS ${passed} ai-orchestrator tests`);
