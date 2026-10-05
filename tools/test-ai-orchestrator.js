'use strict';

const assert = require('node:assert/strict');
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

console.log(`PASS ${passed} ai-orchestrator tests`);
