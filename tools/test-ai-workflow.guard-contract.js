'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const runtime = require('./ai-path-guard.runtime.js');

const workflow = fs.readFileSync('.github/workflows/ai-path-guard.yml', 'utf8');
const runtimeSource = fs.readFileSync('tools/ai-path-guard.runtime.js', 'utf8');

assert.match(workflow, /pull_request_target:/,
  'production guard must remain pull_request_target based on trusted base policy');
assert.doesNotMatch(workflow, /^  pull_request_review:/m,
  'PR review events must not execute an untrusted PR copy of the guard workflow');
assert.match(workflow, /^  issue_comment:/m,
  'trusted default-branch issue comment events must re-evaluate completion and owner approval');
assert.match(workflow, /types: \[created, edited, deleted\]/,
  'Codex summary edits and owner comment changes must re-evaluate the guard');
assert.match(workflow, /^  workflow_dispatch:/m,
  'trusted receivers must be able to explicitly wake the guard when GITHUB_TOKEN suppresses comment events');
assert.match(workflow, /checks: write/,
  'production guard needs checks: write for the enforced head check');
assert.match(workflow, /actions: write/,
  'production guard keeps actions: write for trusted workflow orchestration');
assert.match(workflow, /path: trusted/,
  'production guard must checkout the trusted base into the trusted path');
assert.doesNotMatch(workflow, /head\.sha\s*}}/,
  'production guard must not checkout the untrusted PR head');
assert.match(workflow, /^  guard:/m,
  'guard job id must remain stable for workflow structure');
assert.match(workflow, /name: guard-runner/,
  'native Actions job display name must not collide with the synthetic required guard check');
assert.match(workflow, /trusted\/tools\/ai-path-guard\.runtime\.js/,
  'production guard workflow must load the hardened trusted-base runtime');
assert.doesNotMatch(workflow, /trusted\/tools\/ai-workflow\.js'\)\.runGuard/,
  'production guard workflow must not fall back to the legacy weak runGuard path');
assert.doesNotMatch(runtimeSource, /evaluateGuard\s*\(/,
  'production runtime must not delegate security decisions to legacy classifyPr/evaluateGuard');
assert.match(runtimeSource, /ai-workflow\.identity\.js/,
  'production runtime must report provenance and routing separately');
assert.match(runtimeSource, /ai-workflow\.review-completion\.js/,
  'production runtime must enforce exact-head specialist review completion');
assert.match(runtimeSource, /ai-path-guard\.approval\.js/,
  'production runtime must keep the hardened owner approval helper');
assert.match(runtimeSource, /ownerApproval\(comments, \[\], owner,/,
  'PR reviews must never be passed into the owner approval helper');
assert.match(runtimeSource, /check_name: 'guard'/,
  'production runtime must find the synthetic ruleset-required guard check');
assert.match(runtimeSource, /name: 'guard'/,
  'production runtime must publish the synthetic ruleset-required guard check on the PR head');
assert.doesNotMatch(runtimeSource, /waitForNativeGuard/,
  'guard completion must not depend on a second native PR-head guard job');
assert.doesNotMatch(runtimeSource, /context\.eventName === 'issue_comment'/,
  'synthetic guard evaluation should be identical regardless of the trusted wakeup source');
assert.doesNotMatch(runtimeSource, /context\.eventName === 'pull_request_review'/,
  'runtime must not depend on pull_request_review workflow execution');

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
const claudeCompletion = {
  id: 2,
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: 15368, slug: 'github-actions'},
  created_at: '2026-10-06T01:02:00Z',
  updated_at: '2026-10-06T01:02:00Z',
  body: '<!-- claude-review:completed:' + sha + ' -->\n**Claude review completed**',
};
const codexUser = {
  login: 'chatgpt-codex-connector[bot]',
  id: 199175422,
  type: 'Bot',
  html_url: 'https://github.com/apps/chatgpt-codex-connector',
};
const codexCompletion = {
  id: 3,
  user: codexUser,
  state: 'COMMENTED',
  submitted_at: '2026-10-06T01:02:00Z',
  commit_id: sha,
  body: '\n### 💡 Codex Review\n\nHere are some automated review suggestions for this pull request.\n\n**Reviewed commit:** `' + sha.slice(0, 10) + '`\n',
};
const codexSummary = {
  id: 4,
  user: codexUser,
  performed_via_github_app: {id: 1144995, slug: 'chatgpt-codex-connector'},
  created_at: '2026-10-06T01:01:30Z',
  updated_at: '2026-10-06T01:02:01Z',
  body: '<!-- codex-pull-request-review-summary -->\n\n## Codex Review Summary\n\n| Review | Status | Commit | Review trigger |\n| --- | --- | --- | --- |\n| 📝 **Code Review** | ✅ **Completed** | `' + sha.slice(0, 7) + '` | New commits |',
};
const reviewComments = [claudeCompletion, codexSummary];

assert.throws(
  () => runtime.evaluateGuardPolicy({
    pr: makePr(),
    files: Array.from({length: 3000}, (_, i) => file('bulk/file-' + i + '.txt')),
    comments: [],
    reviews: [],
    owner,
    headSeenAt,
  }),
  /3000-file API limit/,
  'a potentially truncated GitHub file list must fail closed before tier classification'
);

for (const scenario of [
  {pr: makePr({label: 'ai:codex'}), files: [file('case3-film-ui.js')]},
  {pr: makePr({label: 'ai:claude', ref: 'claude/test'}), files: [file('case3-film-engine.js')]},
  {pr: makePr({label: 'ai:handoff', ref: 'handoff/test'}), files: [file('assets/case3/evidence/e01.webp')]},
  {pr: makePr({label: null, ref: 'feature/test'}), files: [file('case3-film-engine.js')]},
]) {
  assert.doesNotThrow(() => runtime.evaluateGuardPolicy({
    ...scenario,
    comments: reviewComments,
    reviews: [codexCompletion],
    owner,
    headSeenAt,
  }), 'non-control paths with required exact-head reviews must not require owner approval');
}

assert.throws(
  () => runtime.evaluateGuardPolicy({
    pr: makePr({label: 'ai:claude', ref: 'claude/control'}),
    files: [file('tools/ai-workflow.review-completion.js')],
    comments: [],
    reviews: [],
    owner,
    headSeenAt,
  }),
  /Exact-head AI review completion is required/,
  'control changes must fail closed until the path-required specialist review completes'
);

for (const filename of [
  'tools/ai-workflow.identity.js',
  'tools/ai-workflow.review-completion.js',
  'tools/ai-path-guard.approval.js',
  'tools/ai-path-guard.runtime.js',
  'tools/test-ai-workflow.owner-approval.js',
  'tools/test-ai-workflow.review.js',
  'tools/test-ai-workflow.review-completion.js',
  'tools/test-ai-workflow.claude-review.js',
  'tools/test-ai-workflow.guard-contract.js',
]) {
  assert.throws(
    () => runtime.evaluateGuardPolicy({
      pr: makePr({label: 'ai:claude', ref: 'claude/control'}),
      files: [file(filename)],
      comments: [codexSummary],
      reviews: [codexCompletion],
      owner,
      headSeenAt,
    }),
    /Owner confirmation is required for guard\/control changes/,
    filename + ' must remain an owner-gated control path after review completion'
  );

  const result = runtime.evaluateGuardPolicy({
    pr: makePr({label: 'ai:claude', ref: 'claude/control'}),
    files: [file(filename)],
    comments: [approvalComment, codexSummary],
    reviews: [codexCompletion],
    owner,
    headSeenAt,
  });
  assert.equal(result.needsOwner, true);
  assert.equal(result.reviewStatus.complete, true);
  assert.equal(result.provenance.kind, 'unknown');
  assert.equal(result.routingHint.hint, 'claude');
}

console.log('PASS production guard enforces trusted-base path security, synthetic required guard publication, dual managed Codex completion, exact-head AI completion, explicit trusted wakeups, file-list fail-closed, and separate owner approval');
