'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const runtime = require('./ai-path-guard.runtime.js');

const workflow = fs.readFileSync('.github/workflows/ai-path-guard.yml', 'utf8');
const runtimeSource = fs.readFileSync('tools/ai-path-guard.runtime.js', 'utf8');

assert.match(workflow, /pull_request_target:/,
  'production guard must remain pull_request_target based on trusted base policy');
assert.match(workflow, /checks: write/,
  'production guard needs checks: write for the enforced head check');
assert.match(workflow, /actions: write/,
  'production guard needs actions: write for native guard reruns after owner approval');
assert.match(workflow, /path: trusted/,
  'production guard must checkout the trusted base into the trusted path');
assert.doesNotMatch(workflow, /head\.sha\s*}}/,
  'production guard must not checkout the untrusted PR head');
assert.match(workflow, /^  guard:/m,
  'required native guard job name must remain stable');
assert.match(workflow, /trusted\/tools\/ai-path-guard\.runtime\.js/,
  'production guard workflow must load the hardened trusted-base runtime');
assert.doesNotMatch(workflow, /trusted\/tools\/ai-workflow\.js'\)\.runGuard/,
  'production guard workflow must not fall back to the legacy weak runGuard path');
assert.doesNotMatch(workflow, /^\s*pull_request_review:/m,
  'owner PR reviews must not trigger the approval guard');
assert.doesNotMatch(runtimeSource, /evaluateGuard\s*\(/,
  'production runtime must not delegate security decisions to legacy classifyPr/evaluateGuard');
assert.match(runtimeSource, /ai-workflow\.identity\.js/,
  'production runtime must report provenance and routing separately');
assert.match(runtimeSource, /ai-path-guard\.approval\.js/,
  'production runtime must keep the hardened owner approval helper');

const scripts = [...workflow.matchAll(/          script: \|\n((?:            .*\n|\n)+)/g)];
assert(scripts.length > 0, 'guard workflow must contain github-script code to validate');
for (const match of scripts) {
  new vm.Script('(async function(){\n' + match[1].replace(/^            /gm, '') + '\n})');
}

const sha = 'a'.repeat(40);
const headSeenAt = '2026-10-06T01:00:00Z';
const owner = 'lutm6666';
const file = filename => ({filename, status: 'modified'});
const makePr = ({label = 'ai:codex', ref = 'codex/test', user = {login: owner, type: 'User'}} = {}) => ({
  labels: label ? [{name: label}] : [],
  user,
  head: {ref, sha},
});
const approvalComment = {
  id: 1,
  user: {login: owner, type: 'User'},
  author_association: 'OWNER',
  performed_via_github_app: null,
  created_at: '2026-10-06T01:01:00Z',
  updated_at: '2026-10-06T01:01:00Z',
  body: '/ai approve-handoff ' + sha,
};

for (const scenario of [
  {pr: makePr({label: 'ai:codex'}), files: [file('case3-film-ui.js')]},
  {pr: makePr({label: 'ai:claude', ref: 'claude/test'}), files: [file('case3-film-engine.js')]},
  {pr: makePr({label: 'ai:handoff', ref: 'handoff/test'}), files: [file('assets/case3/evidence/e01.webp')]},
  {pr: makePr({label: null, ref: 'feature/test'}), files: [file('case3-film-engine.js')]},
]) {
  assert.doesNotThrow(() => runtime.evaluateGuardPolicy({
    ...scenario,
    comments: [],
    owner,
    headSeenAt,
  }), 'non-control paths must not require owner approval based on routing metadata');
}

for (const filename of [
  'tools/ai-workflow.identity.js',
  'tools/ai-path-guard.approval.js',
  'tools/ai-path-guard.runtime.js',
  'tools/test-ai-workflow.owner-approval.js',
  'tools/test-ai-workflow.review.js',
  'tools/test-ai-workflow.guard-contract.js',
]) {
  assert.throws(
    () => runtime.evaluateGuardPolicy({
      pr: makePr({label: 'ai:claude', ref: 'claude/control'}),
      files: [file(filename)],
      comments: [],
      owner,
      headSeenAt,
    }),
    /Owner confirmation is required for guard\/control changes/,
    filename + ' must remain an owner-gated control path regardless of labels'
  );

  const result = runtime.evaluateGuardPolicy({
    pr: makePr({label: 'ai:claude', ref: 'claude/control'}),
    files: [file(filename)],
    comments: [approvalComment],
    owner,
    headSeenAt,
  });
  assert.equal(result.needsOwner, true);
  assert.equal(result.provenance.kind, 'unknown');
  assert.equal(result.routingHint.hint, 'claude');
}

console.log('PASS production guard uses trusted-base path security with separate provenance/routing');
