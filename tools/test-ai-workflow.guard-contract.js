'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');
const policy = require('./ai-workflow.js');

const workflow = fs.readFileSync('.github/workflows/ai-path-guard.yml', 'utf8');
const runtime = fs.readFileSync('tools/ai-path-guard.runtime.js', 'utf8');

assert.match(workflow, /trusted\/tools\/ai-path-guard\.runtime\.js/,
  'production guard workflow must load the hardened trusted-base runtime');
assert.doesNotMatch(workflow, /trusted\/tools\/ai-workflow\.js'\)\.runGuard/,
  'production guard workflow must not fall back to the legacy weak runGuard path');
assert.doesNotMatch(workflow, /^\s*pull_request_review:/m,
  'owner PR reviews must not trigger the approval guard');
assert.match(runtime, /reviews:\s*\[\]/,
  'hardened runtime must not pass PR reviews into owner approval policy');
assert.match(runtime, /ai-path-guard\.approval\.js/,
  'hardened runtime must use the provenance-aware approval helper');

const pr = {
  labels: [{name: 'ai:codex'}],
  head: {ref: 'codex/guard-contract', sha: 'a'.repeat(40)},
};
for (const filename of [
  'tools/ai-path-guard.approval.js',
  'tools/ai-path-guard.runtime.js',
  'tools/test-ai-workflow.owner-approval.js',
  'tools/test-ai-workflow.guard-contract.js',
]) {
  assert.throws(
    () => policy.evaluateGuard({pr, files: [filename], comments: [], reviews: [], owner: 'lutm6666'}),
    /Owner confirmation is required/,
    filename + ' must remain a control path under the trusted base policy'
  );
}

console.log('PASS hardened guard workflow contract and control-path coverage');
