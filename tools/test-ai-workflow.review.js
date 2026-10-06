'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const policy = require('./ai-workflow.review');
const receiver = require('./ai-workflow.claude-review');

const sha = 'a'.repeat(40);
const repo = {owner: 'owner', repo: 'repo'};
const makePr = (agent = 'codex', overrides = {}) => ({
  number: 1,
  state: 'open',
  draft: false,
  labels: [{name: 'ai:' + agent}],
  head: {sha, ref: agent + '/test', repo: {full_name: 'owner/repo'}},
  base: {sha: 'base', ref: 'main'},
  ...overrides
});
const file = filename => ({filename, status: 'modified', patch: '@@ -1 +1 @@\n-old\n+new'});
const actionsComment = body => ({
  id: 1,
  body,
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: 15368}
});

function plan(agent, filenames, overrides = {}) {
  return policy.reviewPlan({pr: makePr(agent, overrides), files: filenames.map(file)});
}

function mock({pr = makePr(), files = [], comments = [], permission = 'write'} = {}) {
  const calls = [];
  const github = {
    rest: {
      pulls: {
        get: async () => ({data: pr}),
        listFiles: 'files'
      },
      issues: {
        listComments: 'comments',
        addLabels: async args => {
          calls.push({name: 'addLabels', args});
          pr.labels.push(...args.labels.filter(name => !pr.labels.some(label => label.name === name)).map(name => ({name})));
        },
        removeLabel: async args => {
          calls.push({name: 'removeLabel', args});
          pr.labels = pr.labels.filter(label => label.name !== args.name);
        },
        createComment: async args => {
          calls.push({name: 'createComment', args});
          const created = {...actionsComment(args.body), id: comments.length + 1};
          comments.push(created);
          return {data: created};
        }
      },
      repos: {
        getCollaboratorPermissionLevel: async () => ({data: {permission}})
      }
    },
    paginate: async method => method === 'files' ? files : method === 'comments' ? comments : []
  };
  const outputs = {};
  const context = {
    repo,
    actor: 'owner',
    runId: 42,
    eventName: 'pull_request_target',
    payload: {
      action: 'opened',
      pull_request: {number: 1},
      repository: {default_branch: 'main'}
    }
  };
  const core = {info(){}, setOutput(k, v){outputs[k] = v;}};
  return {github, context, core, calls, outputs, comments, pr};
}

(async () => {
  assert.equal(plan('codex', ['tools/case3-browser-smoke.html']).tier, 1, 'smoke-only change should be Tier 1');
  assert.equal(plan('codex', ['tools/validate-case3.js']).tier, 1, 'validator-only change should be Tier 1');

  let p = plan('codex', ['case3-film-ui.js']);
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('claude', ['case3-film-ui.js']);
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['codex']);

  p = plan('codex', ['ui/renderer.js']);
  assert.equal(p.tier, 2, 'new client renderer naming should fail safe to Tier 2');
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('codex', ['credits.html']);
  assert.equal(p.tier, 2, 'non-tools HTML should be Tier 2');

  p = plan('codex', ['assets/case3/evidence/e01-contact-sheet.webp']);
  assert.equal(p.tier, 2, 'player-facing image assets should not silently stay Tier 1');
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('codex', ['assets/audio/ambience.ogg']);
  assert.equal(p.tier, 2, 'all assets are presentation by default, including future audio/fonts/data');

  p = plan('codex', ['tools/validate-case3.js', 'assets/case3/evidence/e01-contact-sheet.webp']);
  assert.equal(p.tier, 3, 'logic plus player-facing assets should escalate to Tier 3');
  assert.deepEqual(p.reviewers, ['claude']);

  const humanAsset = makePr('codex', {labels: [], head: {sha, ref: 'feature/art', repo: {full_name: 'owner/repo'}}});
  p = policy.reviewPlan({pr: humanAsset, files: [file('assets/case3/evidence/e01-contact-sheet.webp')]});
  assert.equal(p.agent, 'human');
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['claude']);

  const humanUi = makePr('codex', {labels: [], head: {sha, ref: 'feature/ui', repo: {full_name: 'owner/repo'}}});
  p = policy.reviewPlan({pr: humanUi, files: [file('ui/renderer.js')]});
  assert.equal(p.agent, 'human');
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['claude']);

  const humanLogic = makePr('codex', {labels: [], head: {sha, ref: 'feature/logic', repo: {full_name: 'owner/repo'}}});
  p = policy.reviewPlan({pr: humanLogic, files: [file('case3-film-engine.js')]});
  assert.equal(p.agent, 'human');
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex']);

  const humanLogicAsset = makePr('codex', {labels: [], head: {sha, ref: 'feature/art-logic', repo: {full_name: 'owner/repo'}}});
  p = policy.reviewPlan({pr: humanLogicAsset, files: [file('case3-film-engine.js'), file('assets/case3/evidence/e01-contact-sheet.webp')]});
  assert.equal(p.agent, 'handoff');
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  p = plan('codex', ['case3-film-canon.js']);
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('codex', ['case3-film-engine.js']);
  assert.equal(p.tier, 3);
  assert.equal(p.flags.ui, false, 'known logic runtime must not be misclassified as generic client UI');

  p = plan('codex', ['.github/workflows/project-ci.yml']);
  assert.equal(p.tier, 3);

  p = plan('codex', ['tools/claude-review.js']);
  assert.equal(p.tier, 3, 'legacy receiver remains a control path while it exists');

  p = plan('handoff', ['assets/case3/evidence/e01.webp']);
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  const humanMixed = makePr('codex', {labels: [], head: {sha, ref: 'feature/mixed', repo: {full_name: 'owner/repo'}}});
  p = policy.reviewPlan({pr: humanMixed, files: [file('case3-film-engine.js'), file('case3-film-ui.js')]});
  assert.equal(p.agent, 'handoff');
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  const renamed = policy.reviewPlan({pr: makePr('codex'), files: [{filename: 'archive.js', previous_filename: 'case3-film-canon.js', status: 'renamed', patch: null}]});
  assert.equal(renamed.tier, 3, 'previous filename must preserve review risk');

  const lowPr = makePr('codex', {labels: [{name: 'ai:codex'}, {name: 'needs:claude-review'}, {name: 'review:retry'}]});
  let m = mock({pr: lowPr, files: [file('tools/case3-browser-smoke.html')]});
  const decision = await policy.prepareCrossReview(m);
  assert.equal(decision.run, false);
  assert(m.calls.some(call => call.name === 'removeLabel' && call.args.name === 'needs:claude-review'), 'Tier 1 must clear stale review labels');
  assert(m.calls.some(call => call.name === 'removeLabel' && call.args.name === 'review:retry'), 'Tier 1 must consume meaningless retry label');

  m = mock({files: [file('case3-film-ui.js')]});
  assert.equal((await policy.prepareCrossReview(m)).run, true);

  m = mock({files: [file('case3-film-ui.js')]});
  let routed = await policy.runCrossReview(m);
  assert.equal(routed.plan.tier, 2);
  assert(m.pr.labels.some(label => label.name === 'needs:claude-review'));
  assert(!m.pr.labels.some(label => label.name === 'needs:codex-review'));
  assert.equal(m.calls.filter(call => call.name === 'createComment').length, 1);
  assert(m.comments[0].body.includes('cross-review:v2:claude:' + sha), 'Codex UI must request Claude exactly from tier plan');

  m = mock({pr: humanAsset, files: [file('assets/case3/evidence/e01-contact-sheet.webp')]});
  routed = await policy.runCrossReview(m);
  assert.deepEqual(routed.plan.reviewers, ['claude']);
  assert(m.pr.labels.some(label => label.name === 'needs:claude-review'), 'human asset request and receiver routing must agree');
  assert(m.comments[0].body.includes('cross-review:v2:claude:' + sha));

  m = mock({pr: humanUi, files: [file('ui/renderer.js')]});
  routed = await policy.runCrossReview(m);
  assert.deepEqual(routed.plan.reviewers, ['claude']);
  assert(m.pr.labels.some(label => label.name === 'needs:claude-review'), 'human UI should receive the UI specialist review');
  assert(m.comments[0].body.includes('cross-review:v2:claude:' + sha));

  m = mock({pr: makePr('handoff'), files: [file('assets/case3/evidence/e01-contact-sheet.webp')]});
  routed = await policy.runCrossReview(m);
  assert.deepEqual(routed.plan.reviewers, ['codex', 'claude']);
  assert.equal(m.calls.filter(call => call.name === 'createComment').length, 2, 'handoff must request both reviewers');

  m = mock({files: [file('case3-film-ui.js')]});
  await policy.runCrossReview(m);
  await policy.runCrossReview(m);
  assert.equal(m.calls.filter(call => call.name === 'createComment').length, 1, 'current SHA requests must deduplicate');

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tier-review-'));
  const oldWorkspace = process.env.GITHUB_WORKSPACE;
  process.env.GITHUB_WORKSPACE = temp;
  try {
    m = mock({files: [file('tools/case3-browser-smoke.html')]});
    await receiver.prepare(m);
    assert.equal(m.outputs.run, undefined, 'automatic Tier 1 Claude invocation must be skipped');

    m = mock({files: [file('case3-film-ui.js')]});
    await receiver.prepare(m);
    assert.equal(m.outputs.run, 'true');
    assert.equal(m.outputs.tier, '2');
    const snapshot = JSON.parse(fs.readFileSync(path.join(temp, 'claude-review-input.json'), 'utf8'));
    assert.equal(snapshot.review.tier, 2);

    m = mock({pr: humanUi, files: [file('ui/renderer.js')]});
    await receiver.prepare(m);
    assert.equal(m.outputs.run, 'true', 'human UI should invoke Claude specialist review');

    m = mock({files: [file('tools/case3-browser-smoke.html')]});
    m.context.eventName = 'issue_comment';
    m.context.payload.issue = {number: 1, pull_request: {url: 'x'}};
    m.context.payload.comment = {user: {type: 'User'}, body: '@claude review'};
    await receiver.prepare(m);
    assert.equal(m.outputs.run, 'true', 'manual writer review must remain available for Tier 1');
  } finally {
    if (oldWorkspace === undefined) delete process.env.GITHUB_WORKSPACE;
    else process.env.GITHUB_WORKSPACE = oldWorkspace;
    fs.rmSync(temp, {recursive: true, force: true});
  }

  console.log('PASS tiered dual-AI review policy');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
