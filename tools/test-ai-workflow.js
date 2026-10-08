'use strict';

const assert = require('node:assert/strict');
const workflow = require('./ai-workflow');

assert.deepEqual(workflow.changedPaths([
  {filename: 'new.js', previous_filename: 'old.js'}, 'new.js',
]), ['new.js', 'old.js']);

assert(workflow.isActionsComment({
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: workflow.ACTIONS_APP_ID},
}));
assert(!workflow.isActionsComment({
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: 1},
}));

assert.equal(workflow.routeIssue({title: 'Fix engine save'}).agent, 'codex');
assert.equal(typeof workflow.dispatch, 'function');
for (const retired of ['classifyPr', 'crossReview', 'ownerApproval', 'evaluateGuard', 'runGuard']) {
  assert.equal(workflow[retired], undefined, `${retired} must remain retired`);
}

console.log('PASS AI workflow shared compatibility and retired APIs');
