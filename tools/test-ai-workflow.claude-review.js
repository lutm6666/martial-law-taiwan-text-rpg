'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
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

test('automatic trusted-base Claude review accepts a fork PR without writer permission', async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-review-'));
  const priorWorkspace = process.env.GITHUB_WORKSPACE;
  process.env.GITHUB_WORKSPACE = workspace;
  const filesEndpoint = function filesEndpoint() {};
  const commentsEndpoint = function commentsEndpoint() {};
  let permissionLookups = 0;
  const github = {
    rest: {
      repos: {getCollaboratorPermissionLevel: async () => { permissionLookups += 1; throw new Error('automatic review must not request writer permission'); }},
      pulls: {
        get: async () => ({data: {
          state: 'open', draft: false,
          labels: [], user: {login: 'external', type: 'User'},
          head: {sha: SHA, ref: 'feature/fork-ui', repo: {full_name: 'external/fork'}},
          base: {sha: 'b'.repeat(40), ref: 'main'},
        }}),
        listFiles: filesEndpoint,
      },
      issues: {listComments: commentsEndpoint},
    },
    paginate: async method => {
      if (method === filesEndpoint) return [{filename: 'case3-film-ui.js', status: 'modified'}];
      if (method === commentsEndpoint) return [];
      throw new Error('unexpected paginate method');
    },
  };
  const outputs = new Map();
  const core = {info() {}, setOutput(name, value) { outputs.set(name, value); }};
  const context = {
    eventName: 'pull_request_target',
    actor: 'external',
    repo: {owner: 'lutm6666', repo: 'repo'},
    payload: {pull_request: {number: 41}, repository: {default_branch: 'main'}},
  };

  try {
    await claude.prepare({github, context, core});
    assert.equal(permissionLookups, 0);
    assert.equal(outputs.get('run'), 'true');
    assert.equal(outputs.get('sha'), SHA);
    assert.equal(JSON.parse(fs.readFileSync(path.join(workspace, 'claude-review-input.json'), 'utf8')).sha, SHA);
  } finally {
    if (priorWorkspace === undefined) delete process.env.GITHUB_WORKSPACE;
    else process.env.GITHUB_WORKSPACE = priorWorkspace;
    fs.rmSync(workspace, {recursive: true, force: true});
  }
});

test('manual Claude review request remains writer-only', async () => {
  const github = {
    rest: {
      repos: {getCollaboratorPermissionLevel: async () => ({data: {permission: 'read'}})},
    },
  };
  const context = {
    eventName: 'issue_comment',
    actor: 'external',
    repo: {owner: 'lutm6666', repo: 'repo'},
    payload: {
      issue: {number: 41, pull_request: {}},
      comment: {user: {type: 'User'}, body: '@claude review'},
    },
  };
  await assert.rejects(claude.prepare({github, context, core: {}}), /repository writer/);
});

console.log('PASS Claude receiver completion wakeup and safe fork review behavior');
