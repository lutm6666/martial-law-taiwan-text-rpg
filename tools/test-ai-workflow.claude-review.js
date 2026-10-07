'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const claude = require('./ai-workflow.claude-review.js');

const SHA = '0123456789abcdef0123456789abcdef01234567';

function harness({guardConclusion = 'failure', guardStatus = 'completed', prSha = SHA} = {}) {
  const requests = [];
  const guard = {
    id: 10,
    name: 'guard',
    head_sha: SHA,
    status: guardStatus,
    conclusion: guardConclusion,
    app: {id: 15368},
    details_url: 'https://github.com/lutm6666/repo/actions/runs/123/job/456',
  };
  const methods = {checks: function checks() {}};
  const github = {
    rest: {
      pulls: {get: async () => ({data: {state: 'open', draft: false, head: {sha: prSha}}})},
      checks: {listForRef: methods.checks},
    },
    paginate: async (method) => {
      assert.equal(method, methods.checks);
      return [guard];
    },
    request: async (route, args) => { requests.push([route, args]); return {status: 201}; },
  };
  const context = {repo: {owner: 'lutm6666', repo: 'repo'}};
  const infos = [];
  const core = {info(message) { infos.push(message); }};
  return {github, context, core, requests, infos};
}

test('verified Claude completion reruns a failed native guard for the exact head', async () => {
  const h = harness();
  const rerun = await claude.rerunGuardAfterCompletion({...h, number: 41, sha: SHA});
  assert.equal(rerun, true);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0][0], 'POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun');
  assert.equal(h.requests[0][1].job_id, 456);
});

test('already-successful native guard is not rerun', async () => {
  const h = harness({guardConclusion: 'success'});
  const rerun = await claude.rerunGuardAfterCompletion({...h, number: 41, sha: SHA});
  assert.equal(rerun, false);
  assert.equal(h.requests.length, 0);
});

test('stale Claude completion cannot rerun another head guard', async () => {
  const h = harness({prSha: 'f'.repeat(40)});
  await assert.rejects(
    claude.rerunGuardAfterCompletion({...h, number: 41, sha: SHA}),
    /PR changed before guard rerun/
  );
  assert.equal(h.requests.length, 0);
});

console.log('PASS Claude completion directly re-evaluates the native guard');
