'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const approval = require('./ai-path-guard-approval.js');
const runtime = require('./ai-path-guard-runtime.js');

const OWNER = 'lutm6666';
const SHA = 'ac91a004fdba45adcc2a901364a58c1d4b079213';
const OLD_SHA = 'e9ea4cf09ba7a0d4c5d04e66d9913e556d42a160';
const HEAD_AT = '2026-10-06T01:40:00Z';
const OPTS = {headSeenAt: HEAD_AT};

function directComment(over = {}) {
  return {
    id: 1,
    user: {login: OWNER, type: 'User'},
    author_association: 'OWNER',
    performed_via_github_app: null,
    created_at: '2026-10-06T02:00:00Z',
    updated_at: '2026-10-06T02:00:00Z',
    body: '/ai approve-handoff ' + SHA,
    ...over,
  };
}

function reason(c, ctx = {owner: OWNER, sha: SHA, headSeenAt: HEAD_AT}) {
  return approval.checkApprovalComment(c, ctx).reason;
}

test('direct unedited owner comment after head is approved', () => {
  assert.equal(approval.ownerApproval([directComment()], [], OWNER, SHA, OPTS), true);
});

test('surrounding whitespace is rejected', () => {
  const c = directComment({body: '  /ai approve-handoff ' + SHA + '\n'});
  assert.equal(reason(c), 'command-mismatch');
  assert.equal(approval.ownerApproval([c], [], OWNER, SHA, OPTS), false);
});

test('GitHub App provenance is rejected even on owner account', () => {
  const c = directComment({performed_via_github_app: {id: 1144995, slug: 'chatgpt-codex-connector'}});
  assert.equal(reason(c), 'via-github-app');
  assert.equal(approval.ownerApproval([c], [], OWNER, SHA, OPTS), false);
});

test('missing provenance field fails closed', () => {
  const c = directComment();
  delete c.performed_via_github_app;
  assert.equal(reason(c), 'provenance-field-missing');
});

test('undefined provenance value fails closed', () => {
  assert.equal(reason(directComment({performed_via_github_app: undefined})), 'via-github-app');
});

test('non-owner association fails closed', () => {
  assert.equal(reason(directComment({author_association: 'MEMBER'})), 'not-owner-association');
});

test('edited comment is rejected', () => {
  assert.equal(reason(directComment({updated_at: '2026-10-06T02:05:00Z'})), 'edited');
});

test('different raw timestamp spelling is treated as edited', () => {
  assert.equal(reason(directComment({updated_at: '2026-10-06T02:00:00.000Z'})), 'edited');
});

test('approval before head first-seen time is rejected', () => {
  assert.equal(reason(directComment({created_at: '2026-10-06T01:00:00Z', updated_at: '2026-10-06T01:00:00Z'})), 'before-head');
});

test('approval exactly at head first-seen time is accepted', () => {
  const c = directComment({created_at: HEAD_AT, updated_at: HEAD_AT});
  assert.equal(approval.ownerApproval([c], [], OWNER, SHA, OPTS), true);
});

test('old or short SHA commands are rejected', () => {
  assert.equal(reason(directComment({body: '/ai approve-handoff ' + OLD_SHA})), 'command-mismatch');
  assert.equal(reason(directComment({body: '/ai approve-handoff ' + SHA.slice(0, 7)})), 'command-mismatch');
});

test('extra text and non-string command body are rejected', () => {
  assert.equal(reason(directComment({body: 'LGTM /ai approve-handoff ' + SHA})), 'command-mismatch');
  assert.equal(reason(directComment({body: 123})), 'command-mismatch');
});

test('wrong owner and bot account are rejected', () => {
  assert.equal(reason(directComment({user: {login: 'someone-else', type: 'User'}})), 'not-owner');
  assert.equal(reason(directComment({user: {login: OWNER, type: 'Bot'}})), 'not-user-account');
});

test('missing or malformed timestamps fail closed', () => {
  assert.equal(reason(directComment({created_at: undefined})), 'bad-timestamps');
  assert.equal(reason(directComment({updated_at: 'nope'})), 'edited');
  assert.equal(reason(directComment({created_at: 'nope', updated_at: 'nope'})), 'bad-timestamps');
});

test('unknown head time fails closed', () => {
  assert.equal(approval.ownerApproval([directComment()], [], OWNER, SHA, {}), false);
  assert.equal(approval.ownerApproval([directComment()], [], OWNER, SHA, undefined), false);
});

test('owner PR review is ignored', () => {
  const review = {user: {login: OWNER, type: 'User'}, state: 'APPROVED', commit_id: SHA};
  assert.equal(approval.ownerApproval([], [review], OWNER, SHA, OPTS), false);
});

test('invalid inputs fail closed', () => {
  assert.equal(approval.ownerApproval(null, [], OWNER, SHA, OPTS), false);
  assert.equal(approval.ownerApproval([directComment()], [], '', SHA, OPTS), false);
  assert.equal(approval.ownerApproval([directComment()], [], OWNER, 'not-a-sha', OPTS), false);
  assert.equal(approval.checkApprovalComment(directComment(), null).reason, 'invalid-context');
});

test('one valid comment among invalid comments approves', () => {
  const list = [
    directComment({performed_via_github_app: {slug: 'x'}}),
    directComment({updated_at: '2026-10-06T03:00:00Z'}),
    directComment(),
  ];
  assert.equal(approval.ownerApproval(list, [], OWNER, SHA, OPTS), true);
});

test('explainApprovals reports rejection reasons without approving', () => {
  const rows = approval.explainApprovals([
    directComment({id: 10, performed_via_github_app: {slug: 'chatgpt-codex-connector'}}),
    directComment({id: 11, body: 'unrelated'}),
  ], OWNER, SHA, OPTS);
  assert.deepEqual(rows, [{id: 10, ok: false, reason: 'via-github-app'}]);
});

test('headSeenAt uses exact head_sha and returns earliest matching run', async () => {
  let observedMethod;
  let observedArgs;
  const endpoint = function endpoint() {};
  const github = {
    rest: {actions: {listWorkflowRunsForRepo: endpoint}},
    paginate: async (method, args) => {
      observedMethod = method;
      observedArgs = args;
      return [
        {head_sha: SHA, created_at: '2026-10-06T01:45:00Z'},
        {head_sha: OLD_SHA, created_at: '2020-01-01T00:00:00Z'},
        {head_sha: SHA, created_at: '2026-10-06T01:40:00Z'},
        {head_sha: SHA, created_at: 'bad'},
      ];
    },
  };
  assert.equal(await approval.headSeenAt(github, {owner: OWNER, repo: 'r'}, SHA), '2026-10-06T01:40:00.000Z');
  assert.equal(observedMethod, endpoint);
  assert.deepEqual(observedArgs, {owner: OWNER, repo: 'r', head_sha: SHA, per_page: 100});
});

test('headSeenAt returns null with no matching runs or invalid SHA', async () => {
  const github = {
    rest: {actions: {listWorkflowRunsForRepo: function endpoint() {}}},
    paginate: async () => [{head_sha: OLD_SHA, created_at: '2026-10-06T01:00:00Z'}],
  };
  assert.equal(await approval.headSeenAt(github, {owner: OWNER, repo: 'r'}, SHA), null);
  assert.equal(await approval.headSeenAt(github, {owner: OWNER, repo: 'r'}, 'bad'), null);
});

function runtimeMock({comments, workflowRuns, reviewWouldThrow = true}) {
  const head = SHA;
  const checks = [];
  const calls = [];
  const pr = {
    state: 'open',
    draft: false,
    labels: [{name: 'ai:codex'}],
    head: {sha: head, ref: 'codex/harden-owner-approval-gate', repo: {full_name: OWNER + '/repo'}},
    base: {sha: 'base', ref: 'main'},
  };
  const methods = {
    files: 'files',
    comments: 'comments',
    checks: 'checks',
    runs: 'runs',
  };
  const github = {
    rest: {
      pulls: {
        get: async () => ({data: pr}),
        listFiles: methods.files,
        listReviews: async () => { if (reviewWouldThrow) throw new Error('reviews must not be fetched'); return []; },
      },
      issues: {listComments: methods.comments},
      checks: {
        listForRef: methods.checks,
        create: async args => {
          const c = {...args, id: checks.length + 1, app: {id: 15368}};
          checks.push(c);
          return {data: c};
        },
        update: async args => { Object.assign(checks.find(c => c.id === args.check_run_id), args); },
      },
      actions: {listWorkflowRunsForRepo: methods.runs},
    },
    paginate: async (method) => {
      if (method === methods.files) return ['tools/ai-path-guard-runtime.js'];
      if (method === methods.comments) return comments;
      if (method === methods.checks) return checks;
      if (method === methods.runs) return workflowRuns;
      throw new Error('unexpected paginate method');
    },
    request: async () => ({status: 201}),
  };
  const context = {repo: {owner: OWNER, repo: 'repo'}, runId: 42, eventName: 'pull_request_target'};
  const core = {info(message) { calls.push(['info', message]); }, setFailed(message) { calls.push(['failed', message]); }};
  return {github, context, core, checks, calls};
}

test('production runtime rejects ChatGPT connector approval and never reads PR reviews', async () => {
  const m = runtimeMock({
    comments: [directComment({performed_via_github_app: {id: 1144995, slug: 'chatgpt-codex-connector'}})],
    workflowRuns: [{head_sha: SHA, created_at: HEAD_AT}],
  });
  await runtime.runGuard({...m, number: 1, expectedBaseSha: 'base'});
  assert.equal(m.checks[0].conclusion, 'failure');
  assert(m.calls.some(([name, message]) => name === 'failed' && message.includes('via-github-app')));
});

test('production runtime accepts hardened direct owner approval', async () => {
  const m = runtimeMock({
    comments: [directComment()],
    workflowRuns: [{head_sha: SHA, created_at: HEAD_AT}],
  });
  await runtime.runGuard({...m, number: 1, expectedBaseSha: 'base'});
  assert.equal(m.checks[0].conclusion, 'success');
  assert(!m.calls.some(([name]) => name === 'failed'));
});
