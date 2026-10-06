'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const policy = require('./ai-workflow.review');
const identity = require('./ai-workflow.identity');
const receiver = require('./ai-workflow.claude-review');

const sha = 'a'.repeat(40);
const repo = {owner: 'owner', repo: 'repo'};
const makePr = (hint = 'codex', overrides = {}) => ({
  number: 1,
  state: 'open',
  draft: false,
  labels: hint ? [{name: 'ai:' + hint}] : [],
  user: {login: 'owner', type: 'User'},
  head: {sha, ref: hint ? hint + '/test' : 'feature/test', repo: {full_name: 'owner/repo'}},
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

function plan(hint, filenames, overrides = {}) {
  return policy.reviewPlan({pr: makePr(hint, overrides), files: filenames.map(file)});
}

function mock({pr = makePr(), files = [], comments = [], permission = 'write'} = {}) {
  const calls = [];
  const github = {
    rest: {
      pulls: {get: async () => ({data: pr}), listFiles: 'files'},
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
      repos: {getCollaboratorPermissionLevel: async () => ({data: {permission}})}
    },
    paginate: async method => method === 'files' ? files : method === 'comments' ? comments : []
  };
  const outputs = {};
  const context = {
    repo,
    actor: 'owner',
    runId: 42,
    eventName: 'pull_request_target',
    payload: {action: 'opened', pull_request: {number: 1}, repository: {default_branch: 'main'}}
  };
  const core = {info(){}, setOutput(k, v){outputs[k] = v;}};
  return {github, context, core, calls, outputs, comments, pr};
}

(async () => {
  let pr = makePr('codex');
  assert.equal(identity.provenance(pr).kind, 'unknown', 'User PR provenance must remain unknown');
  assert.equal(identity.provenance(pr).observed, false);
  assert.equal(identity.routingHint(pr).hint, 'codex');

  pr = makePr(null, {user: {login: 'some-app[bot]', type: 'Bot'}});
  assert.deepEqual(identity.provenance(pr), {kind: 'bot', observed: true, actor: 'some-app[bot]'});

  pr = makePr(null, {
    labels: [{name: 'ai:codex'}, {name: 'ai:claude'}],
    head: {sha, ref: 'feature/conflict', repo: {full_name: 'owner/repo'}}
  });
  assert.equal(identity.routingHint(pr).hint, 'handoff', 'conflicting mutable labels may only escalate review');
  assert.equal(identity.routingHint(pr).conflict, true);

  assert.equal(plan('codex', ['tools/case3-browser-smoke.html']).tier, 1, 'smoke-only change should be Tier 1');
  assert.equal(plan('codex', ['tools/validate-case3.js']).tier, 1, 'validator-only change should be Tier 1');

  let p = plan('codex', ['case3-film-ui.js']);
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('claude', ['case3-film-ui.js']);
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['codex', 'claude'], 'self-routing hint may add counterpart but cannot remove UI specialist');

  p = plan('codex', ['case3-film-engine.js']);
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude'], 'logic specialist remains required; codex hint adds independent counterpart');

  p = plan('claude', ['case3-film-engine.js']);
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex'], 'changing label to Claude cannot suppress Codex logic review');

  p = plan(null, ['case3-film-engine.js']);
  assert.equal(p.provenance.kind, 'unknown');
  assert.equal(p.routingHint.hint, 'unspecified');
  assert.deepEqual(p.reviewers, ['codex'], 'unknown provenance uses strict path specialist review');

  p = plan(null, ['ui/renderer.js']);
  assert.equal(p.tier, 2);
  assert.deepEqual(p.reviewers, ['claude'], 'unknown provenance UI still requires Claude specialist');

  p = plan('codex', ['ui/renderer.js']);
  assert.equal(p.tier, 2, 'new client renderer naming should fail safe to Tier 2');
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('codex', ['credits.html']);
  assert.equal(p.tier, 2, 'non-tools HTML should be Tier 2');

  p = plan('codex', ['assets/case3/evidence/e01-contact-sheet.webp']);
  assert.equal(p.tier, 2, 'player-facing assets should not silently stay Tier 1');
  assert.deepEqual(p.reviewers, ['claude']);

  p = plan('codex', ['tools/validate-case3.js', 'assets/case3/evidence/e01-contact-sheet.webp']);
  assert.equal(p.tier, 3, 'logic plus player-facing assets should escalate to Tier 3');
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  p = plan(null, ['case3-film-engine.js', 'case3-film-ui.js']);
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  p = plan('handoff', ['assets/case3/evidence/e01.webp']);
  assert.equal(p.tier, 3, 'handoff is an operational escalation only');
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  pr = makePr(null, {
    labels: [{name: 'ai:codex'}, {name: 'ai:claude'}],
    head: {sha, ref: 'feature/conflict', repo: {full_name: 'owner/repo'}}
  });
  p = policy.reviewPlan({pr, files: [file('assets/case3/evidence/e01.webp')]});
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude'], 'conflicting labels fail toward more review, never less');

  p = plan('codex', ['.github/workflows/project-ci.yml']);
  assert.equal(p.tier, 3);
  assert.deepEqual(p.reviewers, ['codex', 'claude']);

  p = plan('codex', ['tools/claude-review.js']);
  assert.equal(p.tier, 3, 'legacy receiver remains a control path while it exists');

  const renamed = policy.reviewPlan({pr: makePr('codex'), files: [{filename: 'archive.js', previous_filename: 'case3-film-canon.js', status: 'renamed', patch: null}]});
  assert.equal(renamed.tier, 3, 'previous filename must preserve review risk');
  assert(renamed.reviewers.includes('codex'));

  const lowPr = makePr('codex', {labels: [{name: 'ai:codex'}, {name: 'needs:claude-review'}, {name: 'review:retry'}]});
  let m = mock({pr: lowPr, files: [file('tools/case3-browser-smoke.html')]});
  const decision = await policy.prepareCrossReview(m);
  assert.equal(decision.run, false);
  assert(m.calls.some(call => call.name === 'removeLabel' && call.args.name === 'needs:claude-review'));
  assert(m.calls.some(call => call.name === 'removeLabel' && call.args.name === 'review:retry'));

  m = mock({files: [file('case3-film-ui.js')]});
  assert.equal((await policy.prepareCrossReview(m)).run, true);

  m = mock({files: [file('case3-film-ui.js')]});
  let routed = await policy.runCrossReview(m);
  assert.deepEqual(routed.plan.reviewers, ['claude']);
  assert(m.pr.labels.some(label => label.name === 'needs:claude-review'));
  assert(!m.pr.labels.some(label => label.name === 'needs:codex-review'));
  assert.equal(m.calls.filter(call => call.name === 'createComment').length, 1);

  m = mock({pr: makePr('claude'), files: [file('case3-film-ui.js')]});
  routed = await policy.runCrossReview(m);
  assert.deepEqual(routed.plan.reviewers, ['codex', 'claude']);
  assert.equal(m.calls.filter(call => call.name === 'createComment').length, 2);

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
    const snapshot = JSON.parse(fs.readFileSync(path.join(temp, 'claude-review-input.json'), 'utf8'));
    assert.equal(snapshot.review.tier, 2);
    assert.equal(snapshot.review.provenance.kind, 'unknown');
    assert.equal(snapshot.review.routing_hint.hint, 'codex');
    assert.equal(Object.prototype.hasOwnProperty.call(snapshot.review, 'agent'), false, 'snapshot must not conflate routing with identity');

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

  console.log('PASS path-based dual-AI review policy with separate provenance/routing');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
