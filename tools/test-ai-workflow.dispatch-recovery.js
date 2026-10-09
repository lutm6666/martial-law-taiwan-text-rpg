'use strict';

const assert = require('node:assert/strict');
const {chooseBranch, completedRunBranch} = require('./ai-workflow.dispatch');

const repo = {owner: 'lutm6666', repo: 'martial-law-taiwan-text-rpg'};
const S = letter => letter.repeat(40);
const number = 42;
const runId = 1234;
const digest = 'd'.repeat(64);
const initial = 'ai/issue-42';
const retry = 'ai/issue-42-r1234';
const planPath = '.ai/dispatch/issue-42.json';

function plannedRetryHarness({extraFile = false, planDigest = digest, retryRun = '1234'} = {}) {
  const initialRef = {object: {sha: S('a')}};
  const retryRef = {object: {sha: S('c')}};
  const mainRef = {object: {sha: S('m')}};
  const plan = {
    version: 1,
    source_issue: 42,
    title_body_sha256: planDigest,
    retry_run: retryRun,
    routing: {primary: 'codex'},
  };
  const pullsList = async args => ({data: args.head?.endsWith(initial)
    ? [{state: 'closed', head: {ref: initial}}]
    : []});
  const github = {
    rest: {
      git: {
        getRef: async args => {
          if (args.ref === `heads/${initial}`) return {data: initialRef};
          if (args.ref === `heads/${retry}`) return {data: retryRef};
          if (args.ref === 'heads/main') return {data: mainRef};
          throw Object.assign(new Error('missing ref'), {status: 404});
        },
      },
      pulls: {list: pullsList},
      repos: {
        getContent: async args => {
          if (args.path === planPath && args.ref === retry) {
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
          if (args.base === S('b') && args.head === S('m')) return {data: {status: 'ahead'}};
          throw new Error(`unexpected compare ${args.base}...${args.head}`);
        },
      },
    },
    paginate: async (method, args) => (await method(args)).data,
  };
  return github;
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

  assert.equal(completedRunBranch(number, runId, 1, 'reopened', initial), false);
  assert.equal(completedRunBranch(number, runId, 2, 'reopened', initial), true,
    'a completed reopened run inherited on the initial branch must be idempotent on rerun');
  assert.equal(completedRunBranch(number, runId, 1, 'reopened', retry), true);
  assert.equal(completedRunBranch(number, runId, 1, 'opened', initial), false);
  assert.equal(completedRunBranch(number, runId, 2, 'opened', initial), true);

  console.log('PASS planned retry recovery and completed-run branch idempotency');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
