'use strict';

const assert = require('node:assert/strict');
const workflow = require('./ai-workflow');

let count = 0;
async function test(name, fn) {
  await fn();
  count++;
  console.log('PASS ' + name);
}

const owner = 'owner';
const botComment = body => ({
  id: 1,
  body,
  user: {login: 'github-actions[bot]', type: 'Bot'},
  performed_via_github_app: {id: workflow.ACTIONS_APP_ID},
});

function mock({issue, comments = [], permission = 'write', permissionError, failure} = {}) {
  const calls = [];
  const record = (name, args) => {
    calls.push({name, args});
    if (failure === name) throw new Error('API unavailable');
  };
  const issues = {
    get: async args => {
      record('getIssue', args);
      return {data: issue};
    },
    listComments: 'comments',
    addLabels: async args => {
      record('addLabels', args);
      issue.labels.push(...args.labels.map(name => ({name})));
    },
    removeLabel: async args => {
      record('removeLabel', args);
      issue.labels = issue.labels.filter(label => label.name !== args.name);
    },
    createComment: async args => {
      record('createComment', args);
      const created = {...botComment(args.body), id: comments.length + 1};
      comments.push(created);
      return {data: created};
    },
    updateComment: async args => {
      record('updateComment', args);
      comments.find(comment => comment.id === args.comment_id).body = args.body;
    },
  };
  const github = {
    rest: {
      issues,
      repos: {
        getCollaboratorPermissionLevel: async args => {
          record('permission', args);
          if (permissionError) throw new Error('403 Forbidden');
          return {data: {permission}};
        },
      },
    },
    paginate: async method => ({comments})[method],
  };
  const context = {
    repo: {owner, repo: 'repo'},
    actor: 'writer',
    payload: {action: 'opened', issue: {number: 1}},
  };
  const core = {info() {}};
  return {github, context, core, calls, comments, issue};
}

const ready = body => ({
  number: 1,
  state: 'open',
  body,
  labels: [{name: 'dispatch:ready'}, {name: 'unrelated'}],
});
const logicBody = '### Workstream\n\nCanon / Logic / State / Tests\n\n### Goal\nFrontend / UI / Responsive / Accessibility';

(async () => {
  await test('changedPaths includes renamed source and destination once', () => {
    assert.deepEqual(
      workflow.changedPaths([
        {filename: 'new.js', previous_filename: 'old.js'},
        'new.js',
      ]),
      ['new.js', 'old.js']
    );
  });

  await test('classification ignores Goal keywords', () => {
    assert.equal(workflow.routeIssue(logicBody).agent, 'codex');
  });

  await test('exact UI field routes Claude', () => {
    assert.equal(workflow.routeIssue('### Area\nFrontend / UI').agent, 'claude');
  });

  await test('admin routes handoff', () => {
    assert.equal(workflow.routeIssue('### Workstream\nRepository admin / Settings').area, 'area:admin');
  });

  await test('unknown classification stops at handoff', () => {
    assert.equal(workflow.routeIssue('### Workstream\nUI-ish').agent, 'handoff');
  });

  await test('conflicting fields stop at handoff', () => {
    assert.equal(
      workflow.routeIssue('### Workstream\nFrontend / UI\n### Area\nCI / Tests').agent,
      'handoff'
    );
  });

  await test('duplicate field is a visible error', () => {
    assert.throws(() => workflow.routeIssue('### Area\nCI / Tests\n### Area\nCI / Tests'));
  });

  await test('trusted marker requires GitHub Actions identity and app', () => {
    assert(workflow.isActionsComment(botComment('x')));
    assert(!workflow.isActionsComment({user: {login: owner, type: 'User'}, body: 'x'}));
    assert(!workflow.isActionsComment({
      ...botComment('x'),
      performed_via_github_app: {id: 1},
    }));
  });

  await test('normal event is idempotent and preserves unrelated labels', async () => {
    const m = mock({issue: ready(logicBody)});
    await workflow.dispatch(m);
    await workflow.dispatch(m);
    assert.equal(m.calls.filter(call => call.name === 'createComment').length, 1);
    assert(m.issue.labels.some(label => label.name === 'unrelated'));
  });

  await test('forged old marker cannot suppress dispatch', async () => {
    const m = mock({
      issue: ready(logicBody),
      comments: [{id: 9, user: {login: owner, type: 'User'}, body: '<!-- ai-dispatch:v1 -->'}],
    });
    await workflow.dispatch(m);
    assert.equal(m.calls.filter(call => call.name === 'createComment').length, 1);
  });

  await test('trusted legacy record migrates in place', async () => {
    const m = mock({
      issue: ready(logicBody),
      comments: [botComment('<!-- ai-dispatch:v1 -->')],
    });
    await workflow.dispatch(m);
    assert.equal(m.calls.filter(call => call.name === 'updateComment').length, 1);
    assert(m.comments[0].body.includes('ai-dispatch:v2'));
  });

  await test('edited body revises route and removes stale managed labels', async () => {
    const m = mock({issue: ready(logicBody)});
    await workflow.dispatch(m);
    m.issue.body = '### Workstream\nFrontend / UI / Responsive / Accessibility';
    await workflow.dispatch(m);
    assert(m.issue.labels.some(label => label.name === 'ai:claude'));
    assert(!m.issue.labels.some(label => label.name === 'ai:codex'));
    assert.equal(m.comments.length, 1);
  });

  await test('read actor routes handoff', async () => {
    const m = mock({issue: ready(logicBody), permission: 'read'});
    await workflow.dispatch(m);
    assert(m.issue.labels.some(label => label.name === 'ai:handoff'));
  });

  await test('permission lookup error fails without dispatch mutation', async () => {
    const m = mock({issue: ready(logicBody), permissionError: true});
    await assert.rejects(workflow.dispatch(m));
    assert(!m.calls.some(call => ['addLabels', 'createComment'].includes(call.name)));
  });

  await test('retry writer updates record and consumes retry label after success', async () => {
    const m = mock({issue: ready(logicBody)});
    await workflow.dispatch(m);
    m.issue.labels.push({name: 'dispatch:retry'});
    Object.assign(m.context.payload, {action: 'labeled', label: {name: 'dispatch:retry'}});
    await workflow.dispatch(m);
    assert.equal(m.comments.length, 1);
    assert(!m.issue.labels.some(label => label.name === 'dispatch:retry'));
  });

  await test('retry failure retains retry label', async () => {
    const issue = ready(logicBody);
    issue.labels.push({name: 'dispatch:retry'});
    const m = mock({issue, failure: 'createComment'});
    Object.assign(m.context.payload, {action: 'labeled', label: {name: 'dispatch:retry'}});
    await assert.rejects(workflow.dispatch(m));
    assert(issue.labels.some(label => label.name === 'dispatch:retry'));
  });

  await test('retry from read actor is rejected', async () => {
    const issue = ready(logicBody);
    issue.labels.push({name: 'dispatch:retry'});
    const m = mock({issue, permission: 'read'});
    Object.assign(m.context.payload, {action: 'labeled', label: {name: 'dispatch:retry'}});
    await assert.rejects(workflow.dispatch(m));
  });

  await test('closed, PR, or not-ready issue does not dispatch', async () => {
    for (const issue of [
      {...ready(logicBody), state: 'closed'},
      {...ready(logicBody), pull_request: {}},
      {...ready(logicBody), labels: []},
    ]) {
      const m = mock({issue});
      await workflow.dispatch(m);
      assert(!m.calls.some(call => call.name === 'createComment'));
    }
  });

  await test('legacy review and guard APIs are no longer exported', () => {
    for (const name of ['classifyPr', 'crossReview', 'ownerApproval', 'evaluateGuard', 'runGuard']) {
      assert.equal(workflow[name], undefined, name + ' must remain retired from ai-workflow.js');
    }
  });

  console.log('PASS ' + count + ' workflow dispatch tests');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
