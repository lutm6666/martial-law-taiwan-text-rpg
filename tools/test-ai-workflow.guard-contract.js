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
assert.match(workflow, /checks: write/,
  'production guard needs checks: write for the enforced head check');
assert.match(workflow, /actions: write/,
  'production guard needs actions: write for native guard reruns after completion or owner approval');
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
assert.match(runtimeSource, /waitForNativeGuard/,
  'completion wakeups must wait for an in-flight native guard before deciding whether to rerun');
assert.match(runtimeSource, /context\.eventName === 'issue_comment'/,
  'only trusted issue-comment wakeups should drive native guard reruns');
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

async function testNativeGuardWait() {
  const checksEndpoint = function checksEndpoint() {};
  let calls = 0;
  const github = {
    rest: {checks: {listForRef: checksEndpoint}},
    paginate: async method => {
      assert.equal(method, checksEndpoint);
      calls += 1;
      return [{
        id: 99,
        name: 'guard',
        head_sha: sha,
        status: calls === 1 ? 'in_progress' : 'completed',
        conclusion: calls === 1 ? null : 'failure',
        app: {id: 15368},
        details_url: 'https://github.com/lutm6666/repo/actions/runs/123/job/456',
      }];
    },
  };
  const native = await runtime.waitForNativeGuard({
    github,
    repo: {owner: 'lutm6666', repo: 'repo'},
    sha,
    attempts: 2,
    delayMs: 0,
  });
  assert.equal(calls, 2, 'race repair must poll past an in-progress native guard');
  assert.equal(native.status, 'completed');
  assert.equal(native.conclusion, 'failure');
}

testNativeGuardWait()
  .then(() => console.log('PASS production guard enforces trusted-base path security, dual managed Codex completion, exact-head AI completion, race-safe wakeups, file-list fail-closed, and separate owner approval'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
