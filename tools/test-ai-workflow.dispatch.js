'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {dispatch, marker, managedBody} = require('./ai-workflow.dispatch');

const repo = {owner: 'lutm6666', repo: 'martial-law-taiwan-text-rpg'};
const sha = letter => letter.repeat(40);

function apiError(status, message) {
  return Object.assign(new Error(message), {status});
}

function harness(options = {}) {
  const issue = {
    number: 42,
    title: options.title || 'Fix case3-film-engine.js state transition',
    body: options.body || 'Keep save migration compatible.',
    state: 'open',
    pull_request: undefined,
    html_url: `https://github.com/${repo.owner}/${repo.repo}/issues/42`,
    labels: (options.labels || []).map(name => ({name})),
  };
  const calls = [];
  const outputs = new Map();
  const refs = new Map();
  const files = new Map();
  const prs = [];
  const prFiles = new Map();
  const state = {
    mainSha: sha('a'),
    mergeCount: 0,
    objectCount: 0,
    advanceMain: options.advanceMain || 'never',
    failPrCreate: Boolean(options.failPrCreate),
  };
  const record = (name, args) => calls.push({name, args: structuredClone(args)});
  const nextObjectSha = () => state.objectCount++ % 2 === 0 ? sha('e') : sha('f');
  const branchFiles = branch => {
    if (!files.has(branch)) files.set(branch, new Map());
    return files.get(branch);
  };
  const findPr = number => {
    const pr = prs.find(item => item.number === number);
    if (!pr) throw apiError(404, 'PR missing');
    return pr;
  };
  const addLabels = (target, labels) => {
    for (const name of labels) {
      if (!target.labels.some(label => label.name === name)) target.labels.push({name});
    }
  };
  const pullsList = async args => {
    record('pulls.list', args);
    return {data: prs.filter(pr =>
      (args.state === 'all' || pr.state === args.state)
      && (!args.head || `${repo.owner}:${pr.head.ref}` === args.head)
    )};
  };
  const github = {
    rest: {
      issues: {
        get: async args => { record('issues.get', args); return {data: issue}; },
        addLabels: async args => {
          record('issues.addLabels', args);
          addLabels(args.issue_number === issue.number ? issue : findPr(args.issue_number), args.labels);
        },
        removeLabel: async args => {
          record('issues.removeLabel', args);
          const target = args.issue_number === issue.number ? issue : findPr(args.issue_number);
          target.labels = target.labels.filter(label => label.name !== args.name);
        },
      },
      repos: {
        get: async args => { record('repos.get', args); return {data: {default_branch: 'main'}}; },
        getCollaboratorPermissionLevel: async args => {
          record('repos.getCollaboratorPermissionLevel', args);
          if (options.permissionError) {
            throw apiError(options.permissionError === true ? 403 : options.permissionError, 'permission lookup denied');
          }
          return {data: {permission: options.permission || 'write'}};
        },
        getContent: async args => {
          record('repos.getContent', args);
          const file = branchFiles(args.ref).get(args.path);
          if (!file) throw apiError(404, 'file missing');
          return {data: file};
        },
        createOrUpdateFileContents: async args => {
          record('repos.createOrUpdateFileContents', args);
          assert.notEqual(args.branch, 'main', 'dispatch must never write its plan on main');
          assert(refs.has(args.branch), 'work branch must exist before writing the plan');
          const contentSha = nextObjectSha();
          branchFiles(args.branch).set(args.path, {type: 'file', sha: contentSha, content: args.content});
          refs.get(args.branch).object.sha = nextObjectSha();
          return {data: {content: {sha: contentSha}}};
        },
        merge: async args => {
          record('repos.merge', args);
          assert.notEqual(args.base, 'main', 'dispatch must never merge into main');
          assert(refs.has(args.base), 'merge base must be an existing work branch');
          state.mergeCount++;
          refs.get(args.base).object.sha = nextObjectSha();
          if (state.advanceMain === 'always' || (state.advanceMain === 'once' && state.mergeCount === 1)) {
            const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
            state.mainSha = sha(letters[Math.min(state.mergeCount, letters.length - 1)]);
          }
          return {data: {sha: refs.get(args.base).object.sha}};
        },
      },
      git: {
        getRef: async args => {
          record('git.getRef', args);
          if (args.ref === 'heads/main') return {data: {object: {sha: state.mainSha}}};
          const branch = args.ref.replace(/^heads\//, '');
          if (!refs.has(branch)) throw apiError(404, 'ref missing');
          return {data: refs.get(branch)};
        },
        createRef: async args => {
          record('git.createRef', args);
          assert.notEqual(args.ref, 'refs/heads/main', 'dispatch must never create main');
          const branch = args.ref.replace(/^refs\/heads\//, '');
          if (refs.has(branch)) throw apiError(422, 'ref exists');
          refs.set(branch, {ref: args.ref, object: {sha: args.sha}});
          return {data: refs.get(branch)};
        },
        updateRef: async args => {
          record('git.updateRef', args);
          assert.notEqual(args.ref, 'heads/main', 'dispatch must never update main');
          throw new Error('Unexpected ref update');
        },
      },
      pulls: {
        list: pullsList,
        listFiles: async args => {
          record('pulls.listFiles', args);
          return {data: prFiles.get(args.pull_number) || []};
        },
        create: async args => {
          record('pulls.create', args);
          if (state.failPrCreate) throw apiError(503, 'PR creation unavailable');
          const pr = {
            number: 100 + prs.length,
            node_id: `PR_${100 + prs.length}`,
            title: args.title,
            body: args.body,
            state: 'open',
            draft: args.draft,
            merged_at: null,
            base: {ref: args.base},
            head: {ref: args.head, repo: {full_name: `${repo.owner}/${repo.repo}`}},
            labels: [],
          };
          prs.push(pr);
          prFiles.set(pr.number, [{filename: `.ai/dispatch/issue-${issue.number}.json`}]);
          return {data: pr};
        },
        update: async args => {
          record('pulls.update', args);
          const pr = findPr(args.pull_number);
          if (args.body !== undefined) pr.body = args.body;
          if (args.state !== undefined) pr.state = args.state;
          return {data: pr};
        },
      },
    },
    graphql: async (_query, args) => {
      record('graphql.convertToDraft', args);
      const pr = prs.find(item => item.node_id === args.pullRequestId);
      if (!pr) throw apiError(404, 'PR node missing');
      pr.draft = true;
      return {convertPullRequestToDraft: {pullRequest: {isDraft: true}}};
    },
    paginate: async (method, args) => {
      assert([pullsList, github.rest.pulls.listFiles].includes(method), 'unexpected pagination target');
      return (await method(args)).data;
    },
  };
  const context = {
    repo,
    actor: options.actor || 'contributor',
    runId: 1234,
    payload: {action: options.action || 'opened', issue: {number: issue.number}},
  };
  const core = {
    info: message => record('core.info', message),
    setOutput: (name, value) => outputs.set(name, value),
  };
  return {github, context, core, issue, calls, outputs, refs, files, prs, prFiles, state,
    run: () => dispatch({github, context, core}),
  };
}

const callsNamed = (mock, name) => mock.calls.filter(call => call.name === name).map(call => call.args);

test('opened and reopened launch without dispatch:ready', async () => {
  for (const action of ['opened', 'reopened']) {
    const mock = harness({action, labels: []});
    const result = await mock.run();
    assert.equal(result.run, true);
    assert.equal(result.authorized, true);
    assert.equal(result.branch, 'ai/issue-42');
    assert.equal(mock.prs.length, 1);
    assert.equal(mock.prs[0].draft, true);
    assert.equal(mock.outputs.get('run'), 'true');
  }
});

test('title and body determine routing; labels remain mutable hints', async () => {
  const logic = harness({title: 'Engine transition', body: 'Fix save state.', labels: ['ai:claude', 'area:ui']});
  const logicResult = await logic.run();
  assert.equal(logicResult.route.agent, 'codex');
  assert.equal(logicResult.route.tier, 3);
  assert.equal(logicResult.agent, 'codex');
  assert(logic.issue.labels.some(label => label.name === 'ai:codex'));
  assert(!logic.issue.labels.some(label => label.name === 'ai:claude'));

  const ui = harness({title: 'Polish Case 3', body: 'Fix responsive layout on mobile.', labels: ['ai:codex']});
  const uiResult = await ui.run();
  assert.equal(uiResult.route.agent, 'claude');
  assert.equal(uiResult.route.tier, 2);
  assert.equal(uiResult.agent, 'claude');
  assert(ui.issue.labels.some(label => label.name === 'ai:claude'));
});

test('writer permission gates model run, without blocking a nonwriter draft plan', async () => {
  const writer = harness({permission: 'write'});
  const allowed = await writer.run();
  assert.equal(allowed.run, true);
  assert.equal(allowed.authorized, true);
  assert(callsNamed(writer, 'repos.getCollaboratorPermissionLevel').length > 0);

  const reader = harness({permission: 'read'});
  const planned = await reader.run();
  assert.equal(planned.run, false);
  assert.equal(planned.authorized, false);
  assert.equal(reader.prs.length, 1);
  assert.equal(reader.prs[0].draft, true);

  const outsider = harness({permissionError: 404});
  const outsiderPlan = await outsider.run();
  assert.equal(outsiderPlan.run, false);
  assert.equal(outsiderPlan.authorized, false);
  assert.equal(outsider.prs.length, 1);
});

test('retry label does not authorize a reader and API permission failures fail closed', async () => {
  for (const options of [{permission: 'read'}, {permissionError: true}]) {
    const mock = harness({...options, action: 'labeled', labels: ['dispatch:retry']});
    mock.context.payload.label = {name: 'dispatch:retry'};
    await assert.rejects(mock.run());
    assert.equal(callsNamed(mock, 'git.createRef').length, 0);
    assert.equal(callsNamed(mock, 'pulls.create').length, 0);
  }
  const writer = harness({permission: 'write', action: 'labeled', labels: ['dispatch:retry']});
  writer.context.payload.label = {name: 'dispatch:retry'};
  const result = await writer.run();
  assert.equal(result.run, true);
  assert(!writer.issue.labels.some(label => label.name === 'dispatch:retry'));
});

test('new branch starts at fresh main and every merge targets only the work branch', async () => {
  const mock = harness();
  mock.state.mainSha = sha('b');
  await mock.run();
  assert.deepEqual(callsNamed(mock, 'git.createRef').map(call => ({ref: call.ref, sha: call.sha})), [
    {ref: 'refs/heads/ai/issue-42', sha: sha('b')},
  ]);
  const merges = callsNamed(mock, 'repos.merge');
  assert(merges.length >= 2);
  assert(merges.every(call => call.base === 'ai/issue-42' && call.head === sha('b')));
  assert.equal(callsNamed(mock, 'git.updateRef').length, 0);
  assert(callsNamed(mock, 'repos.createOrUpdateFileContents').every(call => call.branch === 'ai/issue-42'));
});

test('main advancement is merged before opening the draft PR', async () => {
  const mock = harness({advanceMain: 'once'});
  await mock.run();
  const merges = callsNamed(mock, 'repos.merge');
  assert(merges.some(call => call.head === sha('a')));
  assert(merges.some(call => call.head === sha('b')));
  assert(merges.every(call => call.base === 'ai/issue-42'));
  assert.equal(mock.prs.length, 1);
});

test('draft PR references its Issue and records title/body routing plan', async () => {
  const mock = harness({title: 'Improve UI', body: 'Responsive layout is broken.'});
  const result = await mock.run();
  const create = callsNamed(mock, 'pulls.create')[0];
  assert.equal(create.base, 'main');
  assert.equal(create.head, 'ai/issue-42');
  assert.equal(create.draft, true);
  assert.match(create.body, /Refs #42/);
  assert.match(create.body, /## Routing plan/);
  assert.match(create.body, new RegExp(marker(42).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(result.pr, mock.prs[0].number);
  const plan = mock.files.get('ai/issue-42').get('.ai/dispatch/issue-42.json');
  const parsed = JSON.parse(Buffer.from(plan.content, 'base64').toString('utf8'));
  assert.equal(parsed.source_issue, 42);
  assert.equal(parsed.routing.agent, 'claude');
  assert.equal(parsed.title, 'Improve UI');
});

test('source Issue title cannot break the managed Markdown link or ping reviewers', () => {
  const issue = {
    number: 42,
    title: 'Fix [mobile](https://wrong.example) @team',
    html_url: `https://github.com/${repo.owner}/${repo.repo}/issues/42`,
  };
  const body = managedBody(issue, {primary: 'claude', agent: 'claude', tier: 2, reason: 'UI', signals: []});
  assert.match(body, /Fix \\\[mobile\\\]/);
  assert.match(body, /&#64;team/);
  assert.match(body, /Refs #42/);
});

test('duplicate opened delivery reuses branch and PR without relaunching the model', async () => {
  const mock = harness();
  const first = await mock.run();
  const second = await mock.run();
  assert.equal(first.run, true);
  assert.equal(second.run, false, 'unchanged duplicate opened event must not launch another model job');
  assert.equal(callsNamed(mock, 'git.createRef').length, 1);
  assert.equal(callsNamed(mock, 'pulls.create').length, 1);
  assert.equal(callsNamed(mock, 'repos.createOrUpdateFileContents').length, 1);
  assert.equal(callsNamed(mock, 'pulls.update').length, 0);
});

test('existing PR and plan update when Issue text changes', async () => {
  const mock = harness();
  await mock.run();
  mock.issue.title = 'Improve responsive UI';
  mock.issue.body = 'Make mobile layout readable.';
  mock.context.payload.action = 'edited';
  const result = await mock.run();
  assert.equal(result.run, false);
  assert.equal(result.route.agent, 'claude');
  assert.equal(mock.prs.length, 1);
  assert.equal(callsNamed(mock, 'pulls.create').length, 1);
  assert.equal(callsNamed(mock, 'pulls.update').length, 1);
  assert.equal(callsNamed(mock, 'repos.createOrUpdateFileContents').length, 2);
  assert.match(mock.prs[0].body, /Improve responsive UI/);
});

test('editing the source Issue returns an already-ready work PR to draft before changing its plan', async () => {
  const mock = harness();
  await mock.run();
  mock.prs[0].draft = false;
  mock.issue.body = 'The engine task now also needs a save migration.';
  mock.context.payload.action = 'edited';
  const result = await mock.run();
  assert.equal(result.run, false);
  assert.equal(mock.prs[0].draft, true);
  const order = mock.calls.map(call => call.name);
  assert(order.indexOf('graphql.convertToDraft') < order.lastIndexOf('repos.createOrUpdateFileContents'));
  assert.equal(callsNamed(mock, 'graphql.convertToDraft').length, 1);
});

test('retry of ready work closes the old PR and starts from a clean main branch', async () => {
  const mock = harness();
  const first = await mock.run();
  mock.prs[0].draft = false;
  mock.prFiles.set(first.pr, [
    {filename: '.ai/dispatch/issue-42.json'},
    {filename: 'case3-film-engine.js'},
  ]);
  mock.context.payload.action = 'labeled';
  mock.context.payload.label = {name: 'dispatch:retry'};
  mock.issue.labels.push({name: 'dispatch:retry'});
  const second = await mock.run();
  assert.equal(second.run, true);
  assert.equal(second.branch, 'ai/issue-42-r1234');
  assert.equal(mock.prs[0].state, 'closed');
  assert.equal(mock.prs[1].draft, true);
  assert.deepEqual(callsNamed(mock, 'git.createRef').at(-1), {
    ...repo, ref: 'refs/heads/ai/issue-42-r1234', sha: mock.state.mainSha,
  });
  assert.match(mock.prs[1].body, /Refs #42/);
});

test('retry of a ready plan-only PR converts it to draft and actually launches the model', async () => {
  const mock = harness();
  await mock.run();
  mock.prs[0].draft = false;
  mock.context.payload.action = 'labeled';
  mock.context.payload.label = {name: 'dispatch:retry'};
  mock.issue.labels.push({name: 'dispatch:retry'});
  const result = await mock.run();
  assert.equal(result.run, true);
  assert.equal(result.pr, mock.prs[0].number);
  assert.equal(mock.prs[0].draft, true);
  assert.equal(callsNamed(mock, 'graphql.convertToDraft').length, 1);
});

test('retry after a stale partially published patch does not carry rejected code forward', async () => {
  const mock = harness();
  const first = await mock.run();
  mock.prFiles.set(first.pr, [
    {filename: '.ai/dispatch/issue-42.json'},
    {filename: 'tools/stale-implementation.js'},
  ]);
  mock.issue.body = 'New scope after old patch failed freshness check.';
  mock.context.payload.action = 'edited';
  await mock.run();
  mock.context.payload.action = 'labeled';
  mock.context.payload.label = {name: 'dispatch:retry'};
  mock.issue.labels.push({name: 'dispatch:retry'});
  const next = await mock.run();
  assert.equal(next.branch, 'ai/issue-42-r1234');
  assert.equal(mock.prs[0].state, 'closed');
  assert.equal(mock.prs[1].draft, true);
  assert.equal(mock.prFiles.get(next.pr).some(file => file.filename === 'tools/stale-implementation.js'), false);
});

test('closing the source Issue closes its managed ready PR without creating work', async () => {
  const mock = harness();
  await mock.run();
  mock.prs[0].draft = false;
  mock.issue.state = 'closed';
  mock.context.payload.action = 'closed';
  const before = callsNamed(mock, 'git.createRef').length;
  const result = await mock.run();
  assert.equal(result.run, false);
  assert.equal(mock.prs[0].state, 'closed');
  assert.equal(callsNamed(mock, 'git.createRef').length, before);
});

test('reopened Issue after merged plan PR starts a fresh retry branch from current main', async () => {
  const mock = harness();
  const first = await mock.run();
  const planPath = '.ai/dispatch/issue-42.json';
  const initialPlan = structuredClone(mock.files.get(first.branch).get(planPath));

  mock.prs[0].state = 'closed';
  mock.prs[0].merged_at = '2026-10-08T01:00:00Z';
  mock.files.set('main', new Map([[planPath, initialPlan]]));
  mock.state.mainSha = sha('b');
  mock.context.payload.action = 'reopened';

  const second = await mock.run();
  assert.equal(second.branch, 'ai/issue-42-r1234');
  assert.notEqual(second.branch, first.branch);
  assert.equal(second.run, true);
  assert.equal(mock.prs.length, 2);
  assert.equal(mock.prs[1].draft, true);
  assert.equal(mock.prs[1].head.ref, second.branch);
  assert.match(mock.prs[1].body, /Refs #42/);

  const created = callsNamed(mock, 'git.createRef');
  assert.deepEqual(created.at(-1), {
    ...repo, ref: 'refs/heads/ai/issue-42-r1234', sha: sha('b'),
  });
  const retryPlan = mock.files.get(second.branch).get(planPath);
  const parsed = JSON.parse(Buffer.from(retryPlan.content, 'base64').toString('utf8'));
  assert.equal(parsed.source_issue, 42);
  assert.equal(parsed.retry_run, '1234');
  assert.equal(mock.files.get('main').get(planPath).content, initialPlan.content);
  assert(callsNamed(mock, 'repos.merge').every(call => call.base !== 'main'));
});

test('unowned branch collision fails closed', async () => {
  const mock = harness();
  mock.refs.set('ai/issue-42', {object: {sha: sha('c')}});
  await assert.rejects(mock.run(), /Dispatch branch exists without a matching plan or PR/);
  assert.equal(callsNamed(mock, 'pulls.create').length, 0);
  assert.equal(callsNamed(mock, 'repos.createOrUpdateFileContents').length, 0);
});

test('main advancing beyond bounded retries fails before PR creation', async () => {
  const mock = harness({advanceMain: 'always'});
  await assert.rejects(mock.run(), /main advanced during dispatch/);
  assert.equal(callsNamed(mock, 'repos.merge').length, 3);
  assert.equal(callsNamed(mock, 'pulls.create').length, 0);
  assert(callsNamed(mock, 'repos.merge').every(call => call.base === 'ai/issue-42'));
});

test('PR creation error is not reported as success', async () => {
  const mock = harness({failPrCreate: true});
  await assert.rejects(mock.run(), /PR creation unavailable/);
  assert.equal(mock.prs.length, 0);
  assert.equal(mock.outputs.has('pr'), false);
  assert.equal(mock.outputs.has('run'), false);
  assert.equal(callsNamed(mock, 'issues.addLabels').length, 0);
});
