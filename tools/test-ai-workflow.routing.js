'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {routeIssue} = require('./ai-workflow.routing');

test('Chinese UI title routes to Claude Tier 2', () => {
  for (const title of ['修正手機版介面排版', '改善手機顯示']) {
    const route = routeIssue({title, body: ''});
    assert.equal(route.agent, 'claude');
    assert.equal(route.primary, 'claude');
    assert.equal(route.tier, 2);
    assert.equal(route.area, 'area:ui');
    assert.deepEqual(route.signals, ['ui']);
  }
});

test('English asset body routes to Claude art', () => {
  const route = routeIssue({title: 'Improve Case 3', body: 'Replace the evidence portrait PNG images in assets/case3.'});
  assert.equal(route.agent, 'claude');
  assert.equal(route.tier, 2);
  assert.equal(route.area, 'area:art');
  assert(route.signals.includes('assets'));
});

test('template Workstream is read but its constraint heading and exclusions do not misroute', () => {
  const body = [
    '### Workstream',
    'Frontend / UI / Responsive / Accessibility',
    '### Goal',
    '修正畫面溢出。',
    '### Constraints / Canon notes',
    'Do not modify engine or Canon.',
  ].join('\n');
  const route = routeIssue({title: '[AI] Case 3', body});
  assert.equal(route.agent, 'claude');
  assert.equal(route.tier, 2);
  assert(!route.signals.includes('engine'));
  assert(!route.signals.includes('canon'));
});

test('English engine filename in title routes to Codex Tier 3', () => {
  const route = routeIssue({title: 'Fix case3-film-engine.js transition', body: 'The next phase skips a state.'});
  assert.equal(route.agent, 'codex');
  assert.equal(route.primary, 'codex');
  assert.equal(route.tier, 3);
  assert.equal(route.area, 'area:logic');
  assert(route.signals.includes('engine'));
});

test('Chinese Canon and save work routes to Codex Tier 3', () => {
  const route = routeIssue({title: '修正案件正典與存檔狀態機'});
  assert.equal(route.agent, 'codex');
  assert.equal(route.tier, 3);
  assert(route.signals.includes('canon'));
  assert(route.signals.includes('engine'));
});

test('workflow control work routes to Codex admin Tier 3', () => {
  for (const title of [
    'Tighten .github/workflows/ai-path-guard.yml policy',
    'Review control governance',
    '更新控制層與 AI_WORKFLOW.md',
    'Repository admin / Settings',
  ]) {
    const route = routeIssue({title});
    assert.equal(route.agent, 'codex');
    assert.equal(route.tier, 3);
    assert.equal(route.area, 'area:admin');
    assert(route.signals.includes('control'));
  }
});

test('tests, validators, and docs alone remain Tier 1', () => {
  for (const issue of [
    {title: 'Add regression tests'},
    {title: '更新驗證器'},
    {title: 'Write README documentation'},
  ]) {
    const route = routeIssue(issue);
    assert.equal(route.agent, 'codex');
    assert.equal(route.primary, 'codex');
    assert.equal(route.tier, 1);
    assert.equal(route.area, 'area:logic');
  }
});

test('UI with tests keeps Claude presentation priority', () => {
  const route = routeIssue({title: 'Add UI regression tests for mobile layout'});
  assert.equal(route.agent, 'claude');
  assert.equal(route.tier, 2);
  assert(route.signals.includes('tier1'));
});

test('logic plus presentation requires Codex-primary handoff Tier 3', () => {
  for (const issue of [
    {title: 'Update case3-film-engine.js and case3-film-ui.js'},
    {title: '同時修正引擎邏輯與手機介面'},
    {title: 'Improve UI', body: 'Also change Canon deduction rules.'},
  ]) {
    const route = routeIssue(issue);
    assert.equal(route.agent, 'handoff');
    assert.equal(route.primary, 'codex');
    assert.equal(route.tier, 3);
  }
});

test('positive Canon requirement in constraints still escalates a UI task', () => {
  const route = routeIssue({
    title: 'Improve mobile UI',
    body: '### Constraints / Canon notes\nUpdate Canon predicates for the new evidence display.',
  });
  assert.equal(route.agent, 'handoff');
  assert.equal(route.primary, 'codex');
  assert.equal(route.tier, 3);
});

test('explicit mixed template choice requires handoff', () => {
  const route = routeIssue({title: '[AI] Next task', body: '### Workstream\nMixed / Cross-boundary'});
  assert.equal(route.agent, 'handoff');
  assert.equal(route.primary, 'codex');
  assert.equal(route.tier, 3);
  assert(route.signals.includes('mixed'));
});

test('unknown text and mutable routing labels do not supply identity or classification', () => {
  const issue = {title: 'Please take a look', body: 'ai:claude', labels: [{name: 'ai:claude'}]};
  const before = structuredClone(issue);
  const route = routeIssue(issue);
  assert.equal(route.agent, 'handoff');
  assert.equal(route.primary, null);
  assert.equal(route.tier, 3);
  assert.deepEqual(route.signals, []);
  assert.deepEqual(issue, before);
});
