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

test('snapshot limits stay conservatively below the observed Read truncation range', () => {
  assert(claude.SNAPSHOT_INLINE_LIMIT <= 16000);
  assert(claude.SNAPSHOT_PART_LIMIT <= 15000);
  assert(claude.SNAPSHOT_RECORD_LIMIT < claude.SNAPSHOT_PART_LIMIT);
  assert(claude.MAX_SNAPSHOT_PARTS < 100);
});

test('oversized and CJK-dense Claude snapshots are fragmented into read-safe parts and reconstruct every patch', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-review-chunks-'));
  try {
    const metadata = {number: 41, sha: SHA, review: {tier: 3, name: 'Tier 3'}};
    const files = [
      {filename: 'a.js', status: 'modified', patch: 'a'.repeat(90000)},
      {filename: 'b.js', status: 'modified', patch: 'b'.repeat(90000)},
      {filename: 'c.js', status: 'modified', patch: 'c'.repeat(90000)},
      {filename: 'zh-TW.md', status: 'modified', patch: '戒嚴時期的繁體中文密集測試內容。'.repeat(5000)},
    ];
    const result = claude.writeReviewSnapshot(workspace, metadata, files);
    assert.equal(result.chunked, true);
    assert(result.parts >= 2);
    assert(result.parts <= claude.MAX_SNAPSHOT_PARTS);

    const manifest = JSON.parse(fs.readFileSync(path.join(workspace, 'claude-review-input.json'), 'utf8'));
    assert.equal(manifest.sha, SHA);
    assert.equal(manifest.chunked, true);
    assert.equal(manifest.total_files, files.length);
    assert.equal(manifest.parts.length, result.parts);

    const records = manifest.parts.flatMap(relative => {
      const absolute = path.join(workspace, relative);
      const raw = fs.readFileSync(absolute, 'utf8');
      assert(raw.length <= claude.SNAPSHOT_PART_LIMIT, relative + ' must stay below the conservative Read size');
      const part = JSON.parse(raw);
      assert.equal(part.sha, SHA);
      assert.equal(part.total_parts, result.parts);
      return part.files;
    });

    for (const original of files) {
      const fragments = records.filter(record => record.filename === original.filename);
      assert(fragments.length >= 1);
      const patch = fragments
        .sort((a, b) => (a.patch_fragment?.index || 1) - (b.patch_fragment?.index || 1))
        .map(record => record.patch || '')
        .join('');
      assert.equal(patch, original.patch, original.filename + ' patch must reconstruct byte-for-byte');
      for (const fragment of fragments) {
        if (fragments.length > 1) {
          assert.equal(fragment.patch_fragment.total, fragments.length);
          assert(fragment.patch_fragment.index >= 1 && fragment.patch_fragment.index <= fragments.length);
        }
      }
    }
  } finally {
    fs.rmSync(workspace, {recursive: true, force: true});
  }
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
    assert.equal(outputs.get('snapshot_parts'), '1');
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

test('publish rejects incomplete snapshot attestation before creating a completion marker', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-publish-'));
  const executionFile = path.join(dir, 'result.json');
  fs.writeFileSync(executionFile, JSON.stringify([{
    type: 'result', subtype: 'success', is_error: false,
    structured_output: {sha: SHA, parts_read: 1, summary: 'reviewed'},
  }]));
  let created = 0;
  const github = {
    rest: {
      pulls: {get: async () => ({data: {state: 'open', draft: false, head: {sha: SHA}}})},
      issues: {createComment: async () => { created += 1; return {data: {id: 7}}; }},
    },
  };
  try {
    await assert.rejects(
      claude.publish({
        github,
        context: {repo: {owner: 'lutm6666', repo: 'repo'}, runId: 1},
        core: {info() {}},
        number: 41,
        sha: SHA,
        executionFile,
        expectedParts: 2,
      }),
      /did not attest to reading every required snapshot input/
    );
    assert.equal(created, 0);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

test('publish rolls back the completion marker when the required guard wakeup cannot be established', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-publish-rollback-'));
  const executionFile = path.join(dir, 'result.json');
  fs.writeFileSync(executionFile, JSON.stringify([{
    type: 'result', subtype: 'success', is_error: false,
    structured_output: {sha: SHA, parts_read: 1, summary: 'reviewed'},
  }]));
  const deleted = [];
  const checksEndpoint = function checksEndpoint() {};
  const github = {
    rest: {
      pulls: {get: async () => ({data: {state: 'open', draft: false, head: {sha: SHA}}})},
      issues: {
        createComment: async () => ({data: {id: 77}}),
        deleteComment: async args => { deleted.push(args.comment_id); },
      },
      checks: {listForRef: checksEndpoint},
    },
    paginate: async method => {
      assert.equal(method, checksEndpoint);
      return [];
    },
  };
  try {
    await assert.rejects(
      claude.publish({
        github,
        context: {repo: {owner: 'lutm6666', repo: 'repo'}, runId: 1},
        core: {info() {}},
        number: 41,
        sha: SHA,
        executionFile,
        expectedParts: 1,
        guardWait: {attempts: 1, delayMs: 0},
      }),
      /No native PR guard exists/
    );
    assert.deepEqual(deleted, [77]);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

console.log('PASS Claude receiver completion wakeup, conservative read-safe chunking including CJK, complete-input attestation, rollback recovery, and safe fork review behavior');
