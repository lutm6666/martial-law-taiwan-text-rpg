'use strict';

const assert = require('node:assert/strict');
const {
  chooseBranch, completedRunBranch, completedRunPlanMatches, planFile,
} = require('./ai-workflow.dispatch');

const repo = {owner: 'lutm6666', repo: 'martial-law-taiwan-text-rpg'};
const S = letter => letter.repeat(40);
const number = 42;
const runId = 1234;
const digest = 'd'.repeat(64);
const initial = 'ai/issue-42';
const retry = 'ai/issue-42-r1234';
const attempt2 = 'ai/issue-42-r1234-a2';
const attempt3 = 'ai/issue-42-r1234-a3';
const planPath = '.ai/dispatch/issue-42.json';

function plannedRetryHarness({
  extraFile = false,
  planDigest = digest,
  retryRun = '1234',
  retryClosedPr = false,
  orphanAttempt2 = false,
} = {}) {
  const initialRef = {object: {sha: S('a')}};
  const retryRef = {object: {sha: S('c')}};
  const attempt2Ref = {object: {sha: S('e')}};
  const mainRef = {object: {sha: S('f')}};
  const plan = {
    version: 1,
    source_issue: 42,
    title_body_sha256: planDigest,
    retry_run: retryRun,
    routing: {primary: 'codex'},
  };
  const pullsList = async args => {
    if (args.head?.endsWith(initial)) return {data: [{state: 'closed', head: {ref: initial}}]};
    if (retryClosedPr && args.head?.endsWith(retry)) {
      return {data: [{state: 'closed', head: {ref: retry}}]};
    }
    return {data: []};
  };
  const github = {
    rest: {
      git: {
        getRef: async args => {
          if (args.ref === `heads/${initial}`) return {data: initialRef};
          if (args.ref === `heads/${retry}`) return {data: retryRef};
          if (orphanAttempt2 && args.ref === `heads/${attempt2}`) return {data: attempt2Ref};
          if (args.ref === 'heads/main') return {data: mainRef};
          throw Object.assign(new Error('missing ref'), {status: 404});
        },
      },
      pulls: {list: pullsList},
      repos: {
        getContent: async args => {
          if (args.path === planPath && (args.ref === retry || (orphanAttempt2 && args.ref === attempt2))) {
            return {data: {type: 'file', content: Buffer.from(JSON.stringify(plan)).toString('base64')}};
          }
          throw Object.assign(new Error('missing file'), {status: 404});
        },
        getCommit: async args => {
          assert.equal(args.ref, S('c'));
          return {data: {parents: [{sha: S('b')}]}};
        },
        compareCommits: async args => {
          if (args.base === S('b') && args.head === S('c')) {
            return {data: {
              status: 'ahead', ahead_by: 1,
              files: [{filename: planPath}, ...(extraFile ? [{filename: 'case3-film-ui.js'}] : [])],
            }};
          }
          if (args.base === S('b') && args.head === S('f')) return {data: {status: 'ahead'}};
          throw new Error(`unexpected compare ${args.base}...${args.head}`);
        },
      },
    },
    paginate: async (method, args) => (await method(args)).data,
  };
  return github;
}

function encodedPlan(retryRun) {
  return {
    content: Buffer.from(JSON.stringify({
      version: 1,
      source_issue: number,
      title_body_sha256: digest,
      retry_run: retryRun,
    })).toString('base64'),
  };
}

(async () => {
  const recovered = await chooseBranch(plannedRetryHarness(), repo, number, runId, digest);
  assert.deepEqual(recovered, {branch: retry, create: false},
    'a retry branch containing only its matching managed plan must recover after PR creation failure');

  await assert.rejects(
    chooseBranch(plannedRetryHarness({extraFile: true}), repo, number, runId, digest),
    /recoverable clean state/,
    'recovery must reject a branch that contains anything beyond the managed plan'
  );

  await assert.rejects(
    chooseBranch(plannedRetryHarness({planDigest: 'e'.repeat(64)}), repo, number, runId, digest),
    /recoverable clean state/,
    'recovery must reject a stale Issue digest'
  );

  const laterAttempt = await chooseBranch(
    plannedRetryHarness({retryClosedPr: true, orphanAttempt2: true}),
    repo, number, runId, digest, 3
  );
  assert.deepEqual(laterAttempt, {branch: attempt3, create: true},
    'a rerun must allocate a later clean attempt when the base retry PR is closed and a2 is orphaned');

  assert.equal(completedRunBranch(number, runId, 1, 'reopened', initial), false);
  assert.equal(completedRunBranch(number, runId, 2, 'reopened', initial), true,
    'an initial branch is only a candidate for completed reopened work on an explicit rerun');
  assert.equal(completedRunPlanMatches(number, runId, 'reopened', initial, encodedPlan(null), digest), false,
    'a pre-close ready PR without current-run provenance must not satisfy reopened rerun idempotency');
  assert.equal(completedRunPlanMatches(number, runId, 'reopened', initial, encodedPlan('1234'), digest), true,
    'a reopened implementation on the initial branch is idempotent only with matching persisted run provenance');
  assert.equal(completedRunPlanMatches(number, runId, 'reopened', initial, encodedPlan('9999'), digest), false,
    'provenance from a different reopened run must not be accepted');

  const provenancePlan = JSON.parse(planFile({
    number,
    title: 'reopened work',
    body: 'body',
    html_url: 'https://github.com/lutm6666/martial-law-taiwan-text-rpg/issues/42',
  }, {primary: 'codex'}, initial, runId));
  assert.equal(provenancePlan.retry_run, '1234',
    'reopened work retained on the initial branch must persist its workflow run provenance');

  assert.equal(completedRunBranch(number, runId, 1, 'reopened', retry), true);
  assert.equal(completedRunBranch(number, runId, 1, 'opened', initial), false);
  assert.equal(completedRunBranch(number, runId, 2, 'opened', initial), true);

  console.log('PASS planned retry recovery, reopen provenance, and later-attempt recovery');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
