'use strict';

const assert = require('node:assert/strict');
const workflow = require('./ai-workflow');
const dispatchRuntime = require('./ai-workflow.dispatch');

assert.deepEqual(workflow.changedPaths([
  {filename: 'new.js', previous_filename: 'old.js'}, 'new.js',
]), ['new.js', 'old.js']);

assert(workflow.isActionsComment({
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: workflow.ACTIONS_APP_ID},
}));
assert(!workflow.isActionsComment({
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: 1},
}));

assert.equal(workflow.routeIssue({title: 'Fix engine save'}).agent, 'codex');
assert.equal(typeof workflow.dispatch, 'function');
for (const retired of ['classifyPr', 'crossReview', 'ownerApproval', 'evaluateGuard', 'runGuard']) {
  assert.equal(workflow[retired], undefined, `${retired} must remain retired`);
}

async function completedOpenedRerunIsIdempotent() {
  const repo = {owner: 'lutm6666', repo: 'martial-law-taiwan-text-rpg'};
  const issue = {
    number: 42,
    title: 'Fix case3-film-engine.js state transition',
    body: 'Keep save migration compatible.',
    state: 'open',
    pull_request: undefined,
    html_url: 'https://github.com/lutm6666/martial-law-taiwan-text-rpg/issues/42',
    labels: [],
  };
  const branch = 'ai/issue-42';
  const pr = {
    number: 99,
    state: 'open',
    draft: false,
    body: '<!-- ai-dispatch:plan:v1 issue=42 -->\nRefs #42',
    base: {ref: 'main'},
    head: {ref: branch, repo: {full_name: 'lutm6666/martial-law-taiwan-text-rpg'}},
    labels: [],
  };
  const pullsList = async () => ({data: [pr]});
  let mutations = 0;
  const github = {
    rest: {
      issues: {get: async () => ({data: issue})},
      repos: {
        get: async () => ({data: {default_branch: 'main'}}),
        getCollaboratorPermissionLevel: async () => ({data: {permission: 'write'}}),
        getContent: async ({path, ref}) => {
          assert.equal(path, '.ai/dispatch/issue-42.json');
          assert.equal(ref, branch);
          const plan = {
            version: 1,
            source_issue: 42,
            title_body_sha256: dispatchRuntime.issueDigest(issue),
            retry_run: null,
            routing: {primary: 'codex'},
          };
          return {data: {type: 'file', content: Buffer.from(JSON.stringify(plan)).toString('base64')}};
        },
      },
      pulls: {
        list: pullsList,
        update: async () => { mutations += 1; throw new Error('completed opened rerun must not mutate its PR'); },
        create: async () => { mutations += 1; throw new Error('completed opened rerun must not create another PR'); },
      },
      git: {
        createRef: async () => { mutations += 1; throw new Error('completed opened rerun must not create another branch'); },
      },
    },
    paginate: async (method, args) => {
      assert.equal(method, pullsList);
      return (await method(args)).data;
    },
  };
  const context = {
    repo,
    actor: 'lutm6666',
    runId: 1234,
    runAttempt: 2,
    payload: {action: 'opened', issue: {number: 42}},
  };
  const core = {info() {}, setOutput() {}};
  const result = await dispatchRuntime.dispatch({github, context, core});
  assert.equal(result.run, false);
  assert.equal(result.alreadyProcessed, true);
  assert.equal(result.branch, branch);
  assert.equal(result.pr, 99);
  assert.equal(mutations, 0);
}

completedOpenedRerunIsIdempotent()
  .then(() => console.log('PASS AI workflow shared compatibility, retired APIs, and completed opened rerun idempotency'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });