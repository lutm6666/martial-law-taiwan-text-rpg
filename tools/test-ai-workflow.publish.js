'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {issueDigest} = require('./ai-workflow.dispatch');
const {
  createPublisher, issueFromBranch, assertPrIdentity,
  safeGitPath, assertAutoPublishPath, diffHeaderPaths, validatePatch, parseStagedChanges,
} = require('./ai-workflow.publish');

const S = letter => letter.repeat(40);
const PATCH = Buffer.from([
  'diff --git a/README.md b/README.md',
  `index ${S('a')}..${S('b')} 100644`,
  '--- a/README.md', '+++ b/README.md',
  '@@ -1 +1 @@', '-old', '+new', '',
].join('\n'));
const REPO = {owner: 'lutm6666', repo: 'martial-law-taiwan-text-rpg'};
const BRANCH = 'ai/issue-42-r123';
const PR = 99;

function fixture({patch = PATCH, mutate} = {}) {
  const state = {
    main: S('a'), branch: S('b'), fetched: null, checkedOut: null,
    ready: false, calls: [], mergeCount: 0, getMainCount: 0,
    issue: {number: 42, state: 'open', title: 'Implement this issue', body: 'Current scope'},
  };
  state.planDigest = issueDigest(state.issue);
  const record = (kind, value) => { state.calls.push({kind, value}); mutate?.(kind, value, state); };
  const pull = () => ({
    number: PR, state: 'open', draft: true,
    body: '<!-- ai-dispatch:plan:v1 issue=42 -->\nRefs #42',
    base: {ref: 'main', repo: {full_name: `${REPO.owner}/${REPO.repo}`}},
    head: {ref: BRANCH, sha: state.branch, repo: {full_name: `${REPO.owner}/${REPO.repo}`}},
  });
  const github = {rest: {
    repos: {
      get: async () => ({data: {default_branch: 'main'}}),
      getContent: async args => {
        record('planGet', args);
        assert.equal(args.path, '.ai/dispatch/issue-42.json');
        assert.equal(args.ref, BRANCH);
        const plan = {source_issue: 42, title_body_sha256: state.planDigest, routing: {primary: 'codex'}};
        return {data: {type: 'file', content: Buffer.from(JSON.stringify(plan)).toString('base64')}};
      },
      merge: async args => {
        assert.equal(args.base, BRANCH);
        assert.equal(args.head, state.main);
        record('merge', args);
        if (++state.mergeCount === 1) state.branch = S('c');
        return {data: {sha: state.branch}};
      },
      compareCommits: async args => {
        record('compare', args);
        return {data: {status: 'ahead'}};
      },
    },
    issues: {
      get: async args => {
        record('issueGet', args);
        assert.equal(args.issue_number, 42);
        return {data: {...state.issue}};
      },
    },
    pulls: {
      get: async args => { record('prGet', args); return {data: pull()}; },
      readyForReview: async args => {
        record('ready', args);
        state.ready = true;
        return {data: {}};
      },
    },
    git: {
      getRef: async args => {
        record('getRef', args);
        if (args.ref === 'heads/main') {
          state.getMainCount++;
          return {data: {object: {sha: state.main}}};
        }
        if (args.ref === `heads/${BRANCH}`) return {data: {object: {sha: state.branch}}};
        throw new Error(`Unexpected ref: ${args.ref}`);
      },
      getCommit: async args => {
        record('getCommit', args);
        return {data: {tree: {sha: S('e')}}};
      },
      createBlob: async args => {
        record('createBlob', args);
        return {data: {sha: S('f')}};
      },
      createTree: async args => {
        record('createTree', args);
        return {data: {sha: S('1')}};
      },
      createCommit: async args => {
        record('createCommit', args);
        return {data: {sha: S('d')}};
      },
      updateRef: async args => {
        record('updateRef', args);
        if (args.ref !== `heads/${BRANCH}` || args.force !== false) {
          throw new Error('Attempted unsafe ref update.');
        }
        state.branch = args.sha;
        return {data: {}};
      },
    },
  }};
  const git = (args, options = {}) => {
    record('git', args);
    const command = args[0];
    if (command === 'fetch') { state.fetched = state.branch; return ''; }
    if (command === 'status') return '';
    if (command === 'checkout') { state.checkedOut = args[2]; return ''; }
    if (command === 'rev-parse') {
      return args[1] === 'HEAD' ? `${state.checkedOut}\n` : `${state.fetched}\n`;
    }
    if (command === 'apply') return '';
    if (command === 'diff') {
      if (args.includes('--check')) return '';
      return options.binary ? Buffer.from('M\0README.md\0') : 'M\0README.md\0';
    }
    if (command === 'ls-files') return `100644 ${S('9')} 0\tREADME.md\n`;
    if (command === 'show') return Buffer.from('new binary-safe content\n');
    throw new Error(`Unexpected git command: ${args.join(' ')}`);
  };
  const files = {readFileSync: () => patch};
  const publisher = createPublisher({git, files, pause: async () => {}});
  const args = {
    github, context: {repo: REPO}, core: {info: () => {}},
    branch: BRANCH, pr: PR, agent: 'codex', expectedDigest: state.planDigest,
    patchPath: '/tmp/issue-implementation.patch',
  };
  return {state, github, git, publisher, args};
}

test('branch and PR identity bind source Issue, draft, main, and same repository', () => {
  assert.equal(issueFromBranch(BRANCH), 42);
  for (const bad of ['main', 'ai/issue-0', 'ai/issue-42-rbad', 'ai/issue-42/other']) {
    assert.throws(() => issueFromBranch(bad));
  }
  const f = fixture();
  const good = {
    number: PR, state: 'open', draft: true,
    body: '<!-- ai-dispatch:plan:v1 issue=42 -->\nRefs #42',
    base: {ref: 'main', repo: {full_name: `${REPO.owner}/${REPO.repo}`}},
    head: {ref: BRANCH, sha: S('b'), repo: {full_name: `${REPO.owner}/${REPO.repo}`}},
  };
  assert.equal(assertPrIdentity(good, REPO, BRANCH, PR, 42), good);
  assert.throws(() => assertPrIdentity({...good, draft: false}, REPO, BRANCH, PR, 42));
  assert.throws(() => assertPrIdentity({...good, body: 'Refs #42'}, REPO, BRANCH, PR, 42));
  assert.throws(() => assertPrIdentity({...good, body: '<!-- ai-dispatch:plan:v1 issue=42 -->'}, REPO, BRANCH, PR, 42));
  assert.throws(() => assertPrIdentity({...good, head: {...good.head, repo: {full_name: 'other/fork'}}}, REPO, BRANCH, PR, 42));
  assert.ok(f.publisher);
});

test('patch paths fail closed on empty, traversal, or .git writes', () => {
  assert.throws(() => validatePatch(Buffer.alloc(0)));
  assert.throws(() => validatePatch(Buffer.from('diff --git a/../outside b/../outside\n')));
  assert.throws(() => validatePatch(Buffer.from('diff --git a/.git/config b/.git/config\n')));
  assert.throws(() => validatePatch(Buffer.from('diff --git a/space name b/space name\n')));
  assert.throws(() => safeGitPath('C:\\secret'));
  assert.throws(() => parseStagedChanges(Buffer.alloc(0)));
  assert.throws(() => parseStagedChanges(Buffer.from('M\0.ai/dispatch/issue-42.json\0')));
  assert.throws(() => assertAutoPublishPath('.github/workflows/project-ci.yml'), /owner-controlled publication/);
  assert.throws(() => assertAutoPublishPath('.github/actions/local/action.yml'), /owner-controlled publication/);
  assert.throws(() => validatePatch(Buffer.from('diff --git a/.github/workflows/new.yml b/.github/workflows/new.yml\n')));
  assert.throws(() => parseStagedChanges(Buffer.from('A\0.github/workflows/new.yml\0')));
  assert.equal(validatePatch(PATCH), 1);
});

test('Git-quoted Chinese asset paths decode without admitting escaped traversal', () => {
  const file = 'assets/v2/canon/07_屋頂雜物間.png';
  const quoted = value => '"' + [...Buffer.from(value)].map(byte =>
    byte >= 0x80 ? `\\${byte.toString(8).padStart(3, '0')}` : String.fromCharCode(byte)
  ).join('') + '"';
  const header = `diff --git ${quoted('a/' + file)} ${quoted('b/' + file)}`;
  assert.deepEqual(diffHeaderPaths(header), [file, file]);
  assert.equal(validatePatch(Buffer.from(header + '\nGIT binary patch\n')), 1);
  assert.throws(() => diffHeaderPaths('diff --git "a/\\056\\056/evil" "b/\\056\\056/evil"'));
});

test('publisher merges main, commits binary-safe staged content on work branch, then marks PR ready', async () => {
  const {state, publisher, args} = fixture();
  const result = await publisher(args);
  assert.equal(result.branch, BRANCH);
  assert.equal(result.commitSha, S('d'));
  assert.equal(state.ready, true);
  assert.equal(state.mergeCount, 2);
  const update = state.calls.find(call => call.kind === 'updateRef');
  assert.equal(update.value.ref, `heads/${BRANCH}`);
  assert.equal(update.value.force, false);
  assert.equal(state.calls.filter(call => call.kind === 'updateRef' && call.value.ref === 'heads/main').length, 0);
  const commit = state.calls.find(call => call.kind === 'createCommit').value;
  assert.deepEqual(commit.parents, [S('c')]);
  const blob = state.calls.find(call => call.kind === 'createBlob').value;
  assert.equal(Buffer.from(blob.content, 'base64').toString(), 'new binary-safe content\n');
  const order = state.calls.map(call => call.kind);
  assert.ok(order.indexOf('merge') < order.indexOf('createCommit'));
  assert.ok(order.lastIndexOf('merge') > order.indexOf('updateRef'));
  assert.ok(order.indexOf('ready') > order.lastIndexOf('merge'));
  assert.equal(order.filter(kind => kind === 'issueGet').length, 3);
  const apply = state.calls.find(call => call.kind === 'git' && call.value[0] === 'apply');
  assert.deepEqual(apply.value.slice(0, 3), ['apply', '--3way', '--index']);
});

test('Issue edit during model patch application cannot publish the commit', async () => {
  const {publisher, args, state} = fixture({mutate: (kind, value, s) => {
    if (kind === 'git' && value[0] === 'apply') s.issue.body = 'Changed scope';
  }});
  await assert.rejects(publisher(args), /Source Issue changed/i);
  assert.equal(state.calls.some(call => call.kind === 'updateRef'), false);
  assert.equal(state.ready, false);
});

test('Issue closure after commit publication keeps the PR draft', async () => {
  const {publisher, args, state} = fixture({mutate: (kind, _value, s) => {
    if (kind === 'updateRef') s.issue.state = 'closed';
  }});
  await assert.rejects(publisher(args), /Source Issue changed or closed/i);
  assert.equal(state.calls.some(call => call.kind === 'updateRef'), true);
  assert.equal(state.ready, false);
});

test('changed routing plan cannot publish stale model output', async () => {
  const {publisher, args, state} = fixture();
  state.planDigest = S('9');
  await assert.rejects(publisher(args), /Routing plan changed/i);
  assert.equal(state.calls.some(call => call.kind === 'merge'), false);
});

test('stale PR head fails before applying patch', async () => {
  const {publisher, args, state} = fixture({mutate: (kind, _value, s) => {
    if (kind === 'prGet') s.branch = S('c');
  }});
  // The moving head never stabilizes across the bounded PR identity reads.
  await assert.rejects(publisher(args), /stale|differs/i);
  assert.equal(state.calls.some(call => call.kind === 'git' && call.value[0] === 'apply'), false);
  assert.equal(state.ready, false);
});

test('main advancing through all sync attempts keeps PR draft', async () => {
  let next = 0;
  const {publisher, args, state} = fixture({mutate: kind => {
    if (kind === 'merge') state.main = S(String(++next));
  }});
  await assert.rejects(publisher(args), /advanced too often/i);
  assert.equal(state.ready, false);
  assert.equal(state.calls.some(call => call.kind === 'updateRef'), false);
});

test('main advance after applying patch fails before commit publication', async () => {
  const {publisher, args, state} = fixture({mutate: (kind, value, s) => {
    if (kind === 'git' && value[0] === 'apply') s.main = S('7');
  }});
  await assert.rejects(publisher(args), /main advanced during patch application/i);
  assert.equal(state.calls.some(call => call.kind === 'updateRef'), false);
  assert.equal(state.ready, false);
});

test('concurrent work-branch update fails before publishing the model commit', async () => {
  const {publisher, args, state} = fixture({mutate: (kind, _value, s) => {
    if (kind === 'createCommit') s.branch = S('8');
  }});
  await assert.rejects(publisher(args), /advanced before commit publication/i);
  assert.equal(state.calls.some(call => call.kind === 'updateRef'), false);
  assert.equal(state.ready, false);
});

test('main advance in the final freshness check leaves the PR draft', async () => {
  const {publisher, args, state} = fixture({mutate: (kind, value, s) => {
    if (kind === 'getRef' && value.ref === 'heads/main' && s.getMainCount === 5) {
      s.main = S('8');
    }
  }});
  await assert.rejects(publisher(args), /changed before making the PR ready/i);
  assert.equal(state.ready, false);
});

test('empty patch never merges or updates a ref', async () => {
  const {publisher, args, state} = fixture({patch: Buffer.alloc(0)});
  await assert.rejects(publisher(args), /empty/i);
  assert.equal(state.calls.some(call => call.kind === 'merge'), false);
  assert.equal(state.calls.some(call => call.kind === 'updateRef'), false);
});
