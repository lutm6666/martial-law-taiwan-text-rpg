'use strict';

// This module runs from the trusted default-branch checkout. The model only
// supplies a patch; it never receives the token used by this publisher.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const {issueDigest} = require('./ai-workflow.dispatch');

const SHA = /^[0-9a-f]{40}$/;
const BRANCH = /^ai\/issue-([1-9]\d*)(?:-r\d+(?:-a\d+)?)?$/;
const MAX_PATCH_BYTES = 50 * 1024 * 1024;
const MAX_BLOB_BYTES = 100 * 1024 * 1024;
const SYNC_ATTEMPTS = 3;
const PR_HEAD_ATTEMPTS = 5;

function fail(message) { throw new Error(message); }

function issueFromBranch(branch) {
  const match = BRANCH.exec(String(branch || ''));
  if (!match || !Number.isSafeInteger(Number(match[1]))) fail('Invalid AI work branch.');
  return Number(match[1]);
}

function assertSha(value, name) {
  if (!SHA.test(String(value || ''))) fail(`Invalid ${name} SHA.`);
  return value;
}

function assertRepoName(actual, repo, name) {
  if (String(actual || '').toLowerCase() !== `${repo.owner}/${repo.repo}`.toLowerCase()) {
    fail(`${name} is outside the source repository.`);
  }
}

function assertPrIdentity(pr, repo, branch, number, issueNumber) {
  if (!pr || pr.number !== number || pr.state !== 'open' || pr.draft !== true) {
    fail('Expected the managed open draft PR.');
  }
  if (pr.base?.ref !== 'main' || pr.head?.ref !== branch) fail('PR base/head branch mismatch.');
  assertRepoName(pr.base?.repo?.full_name, repo, 'PR base');
  assertRepoName(pr.head?.repo?.full_name, repo, 'PR head');
  assertSha(pr.head.sha, 'PR head');
  const markers = [...String(pr.body || '').matchAll(/<!-- ai-dispatch:plan:v1 issue=(\d+) -->/g)];
  if (markers.length !== 1 || Number(markers[0][1]) !== issueNumber) fail('PR source Issue marker mismatch.');
  if (!new RegExp(`\\b(?:Refs|Closes|Fixes|Resolves)\\s+#${issueNumber}\\b`, 'i').test(pr.body)) {
    fail('PR body does not visibly reference the source Issue.');
  }
  return pr;
}

function safeGitPath(name) {
  if (typeof name !== 'string' || !name || /[\\\x00-\x1f\x7f]/.test(name)
    || name.startsWith('/') || name.endsWith('/') || name.includes('//')
    || name.split('/').some(part => part === '' || part === '.' || part === '..' || part.toLowerCase() === '.git')
    || /^[A-Za-z]:/.test(name)) fail(`Unsafe patch path: ${name}`);
  return name;
}

function assertAutoPublishPath(name) {
  const safe = safeGitPath(name);
  if (/^\.github\/(?:workflows|actions)\//i.test(safe)) {
    fail(`Executable Actions path requires owner-controlled publication: ${safe}`);
  }
  return safe;
}

function diffHeaderPaths(line) {
  if (!line.startsWith('diff --git ')) fail('Invalid Git diff header.');
  let at = 'diff --git '.length;
  function token() {
    if (line[at] !== '"') {
      const space = line.indexOf(' ', at);
      const end = space < 0 ? line.length : space;
      if (end === at) fail('Invalid Git diff path.');
      const value = line.slice(at, end);
      at = end;
      return value;
    }
    at++;
    const bytes = [];
    let closed = false;
    while (at < line.length) {
      const char = line[at++];
      if (char === '"') { closed = true; break; }
      if (char !== '\\') { bytes.push(...Buffer.from(char, 'utf8')); continue; }
      const escaped = line[at++];
      if (/[0-7]/.test(escaped || '')) {
        const octal = escaped + line.slice(at, at + 2);
        if (!/^[0-7]{3}$/.test(octal)) fail('Invalid octal Git path escape.');
        bytes.push(parseInt(octal, 8));
        at += 2;
      } else {
        const escapes = {'\\': 92, '"': 34, n: 10, r: 13, t: 9, b: 8, f: 12, v: 11, a: 7};
        if (!Object.hasOwn(escapes, escaped)) fail('Unknown Git path escape.');
        bytes.push(escapes[escaped]);
      }
    }
    if (!closed) fail('Unterminated Git diff path.');
    const value = Buffer.from(bytes).toString('utf8');
    if (value.includes('\uFFFD')) fail('Git diff path is not valid UTF-8.');
    return value;
  }
  const oldPath = token();
  if (line[at++] !== ' ') fail('Invalid Git diff path separator.');
  const newPath = token();
  if (at !== line.length || !oldPath.startsWith('a/') || !newPath.startsWith('b/')) {
    fail('Invalid Git diff path prefixes.');
  }
  return [safeGitPath(oldPath.slice(2)), safeGitPath(newPath.slice(2))];
}

function validatePatch(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_PATCH_BYTES) {
    fail('Patch is empty or exceeds the size limit.');
  }
  const source = buffer.toString('utf8');
  if (source.includes('\uFFFD')) fail('Patch is not valid UTF-8 Git diff text.');
  const lines = source.split('\n');
  const headers = lines.filter(line => line.startsWith('diff --git '));
  if (!headers.length) fail('Patch has no Git diff headers.');
  for (const raw of headers) {
    for (const name of diffHeaderPaths(raw.replace(/\r$/, ''))) assertAutoPublishPath(name);
  }
  return headers.length;
}

function parseStagedChanges(output) {
  const text = Buffer.isBuffer(output) ? output.toString('utf8') : String(output || '');
  if (text.includes('\uFFFD')) fail('Staged path is not valid UTF-8.');
  const parts = text.split('\0');
  if (parts.at(-1) === '') parts.pop();
  if (!parts.length || parts.length % 2) fail('Missing or malformed staged changes.');
  const result = [];
  for (let i = 0; i < parts.length; i += 2) {
    const status = parts[i];
    const file = assertAutoPublishPath(parts[i + 1]);
    if (!['A', 'M', 'D', 'T'].includes(status)) fail(`Unsupported staged status: ${status}`);
    if (file.startsWith('.ai/dispatch/')) fail('Model patch may not modify the managed routing plan.');
    result.push({status, path: file});
  }
  return result;
}

function defaultGit(args, options = {}) {
  return cp.execFileSync('git', args, {
    encoding: options.binary ? undefined : 'utf8',
    maxBuffer: MAX_BLOB_BYTES + 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function createPublisher({git = defaultGit, files = fs, pause = ms => new Promise(resolve => setTimeout(resolve, ms))} = {}) {
  async function refSha(github, repo, branch) {
    const {data} = await github.rest.git.getRef({...repo, ref: `heads/${branch}`});
    return assertSha(data?.object?.sha, branch);
  }

  async function prAtHead(github, repo, number, branch, issueNumber, expectedSha) {
    for (let attempt = 0; attempt < PR_HEAD_ATTEMPTS; attempt++) {
      const {data} = await github.rest.pulls.get({...repo, pull_number: number});
      assertPrIdentity(data, repo, branch, number, issueNumber);
      if (data.head.sha === expectedSha) return data;
      if (attempt + 1 < PR_HEAD_ATTEMPTS) await pause(500 * (2 ** attempt));
    }
    fail('PR head is stale or differs from its work branch.');
  }

  async function syncMain(github, repo, number, branch, issueNumber) {
    for (let attempt = 0; attempt < SYNC_ATTEMPTS; attempt++) {
      const before = await refSha(github, repo, 'main');
      const branchBefore = await refSha(github, repo, branch);
      await prAtHead(github, repo, number, branch, issueNumber, branchBefore);
      await github.rest.repos.merge({
        ...repo, base: branch, head: before,
        commit_message: `chore(ai): sync ${branch} with main`,
      });
      const branchAfter = await refSha(github, repo, branch);
      await prAtHead(github, repo, number, branch, issueNumber, branchAfter);
      const after = await refSha(github, repo, 'main');
      if (before !== after) continue;
      const {data: comparison} = await github.rest.repos.compareCommits({
        ...repo, base: after, head: branchAfter,
      });
      if (!['ahead', 'identical'].includes(comparison?.status)) {
        fail('Work branch does not contain the current main head.');
      }
      return {mainSha: after, branchSha: branchAfter};
    }
    fail('main advanced too often while publishing; keep the PR draft and retry.');
  }

  function stagedMode(file) {
    const output = String(git(['ls-files', '--stage', '--', file]));
    const match = /^(100644|100755) [0-9a-f]{40} 0\t/.exec(output);
    if (!match) fail(`Unsupported staged file mode or missing stage: ${file}`);
    return match[1];
  }

  async function uploadTree(github, repo, parentSha, changes) {
    const {data: parent} = await github.rest.git.getCommit({...repo, commit_sha: parentSha});
    const baseTree = assertSha(parent?.tree?.sha, 'parent tree');
    const entries = [];
    for (const change of changes) {
      if (change.status === 'D') {
        entries.push({path: change.path, mode: '100644', type: 'blob', sha: null});
        continue;
      }
      const mode = stagedMode(change.path);
      const content = git(['show', `:${change.path}`], {binary: true});
      if (!Buffer.isBuffer(content) || content.length > MAX_BLOB_BYTES) {
        fail(`Staged blob is unavailable or too large: ${change.path}`);
      }
      const {data: blob} = await github.rest.git.createBlob({
        ...repo, content: content.toString('base64'), encoding: 'base64',
      });
      entries.push({path: change.path, mode, type: 'blob', sha: assertSha(blob?.sha, 'blob')});
    }
    const {data: tree} = await github.rest.git.createTree({...repo, base_tree: baseTree, tree: entries});
    return assertSha(tree?.sha, 'new tree');
  }

  async function assertFreshSource(github, repo, issueNumber, branch, agent, expectedDigest) {
    const {data: issue} = await github.rest.issues.get({...repo, issue_number: issueNumber});
    if (issue.state !== 'open' || issue.pull_request || issueDigest(issue) !== expectedDigest) {
      fail('Source Issue changed or closed during implementation; keep the PR draft and rerun dispatch.');
    }
    const {data: planFile} = await github.rest.repos.getContent({
      ...repo, path: `.ai/dispatch/issue-${issueNumber}.json`, ref: branch,
    });
    if (planFile.type !== 'file' || !planFile.content) fail('Routing plan is missing.');
    const plan = JSON.parse(Buffer.from(planFile.content.replace(/\s/g, ''), 'base64').toString('utf8'));
    if (plan.source_issue !== issueNumber || plan.title_body_sha256 !== expectedDigest
      || plan.routing?.primary !== agent) {
      fail('Routing plan changed during implementation; keep the PR draft and rerun dispatch.');
    }
  }

  async function publish({github, context, core, branch, pr, agent, expectedDigest, patchPath}) {
    const issueNumber = issueFromBranch(branch);
    const number = Number(pr);
    if (!Number.isSafeInteger(number) || number < 1) fail('Invalid PR number.');
    if (!['codex', 'claude'].includes(agent)) fail('Invalid implementation agent.');
    if (!/^[0-9a-f]{64}$/.test(String(expectedDigest || ''))) fail('Invalid source Issue digest.');
    if (!context?.repo?.owner || !context?.repo?.repo) fail('Repository context is missing.');
    const repo = context.repo;
    const {data: repository} = await github.rest.repos.get(repo);
    if (repository.default_branch !== 'main') fail('Publisher requires main as the default branch.');
    if (branch === 'main') fail('Publisher cannot write main.');

    const patch = files.readFileSync(patchPath);
    validatePatch(patch);
    await assertFreshSource(github, repo, issueNumber, branch, agent, expectedDigest);
    const first = await syncMain(github, repo, number, branch, issueNumber);

    // Fetch is read-only. No GitHub write token is passed to git or a shell.
    git(['fetch', '--no-tags', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`]);
    const fetched = String(git(['rev-parse', `refs/remotes/origin/${branch}`])).trim();
    if (fetched !== first.branchSha) fail('Fetched work branch differs from verified remote head.');
    const dirty = String(git(['status', '--porcelain', '--untracked-files=no'])).trim();
    if (dirty) fail('Publisher checkout has tracked local modifications.');
    git(['checkout', '--detach', first.branchSha]);
    if (String(git(['rev-parse', 'HEAD'])).trim() !== first.branchSha) fail('Checkout did not reach verified branch SHA.');
    git(['apply', '--3way', '--index', path.resolve(patchPath)]);
    git(['diff', '--cached', '--check']);
    const changes = parseStagedChanges(git(['diff', '--cached', '--no-renames', '--name-status', '-z'], {binary: true}));

    // An unrelated publisher or Issue retry may have moved the branch while
    // this patch was applied. Only a fast-forward to our verified parent works.
    const beforeCommit = await refSha(github, repo, branch);
    await prAtHead(github, repo, number, branch, issueNumber, beforeCommit);
    if (beforeCommit !== first.branchSha) fail('Work branch advanced while the patch was applied.');
    if (await refSha(github, repo, 'main') !== first.mainSha) {
      fail('main advanced during patch application; retry from the latest main.');
    }

    const treeSha = await uploadTree(github, repo, beforeCommit, changes);
    const {data: commit} = await github.rest.git.createCommit({
      ...repo, message: `feat(ai): implement issue #${issueNumber} with ${agent}`,
      tree: treeSha, parents: [beforeCommit],
    });
    const commitSha = assertSha(commit?.sha, 'implementation commit');
    await assertFreshSource(github, repo, issueNumber, branch, agent, expectedDigest);
    if (await refSha(github, repo, branch) !== beforeCommit) fail('Work branch advanced before commit publication.');
    await github.rest.git.updateRef({...repo, ref: `heads/${branch}`, sha: commitSha, force: false});
    if (await refSha(github, repo, branch) !== commitSha) fail('Work branch did not reach the implementation commit.');
    await prAtHead(github, repo, number, branch, issueNumber, commitSha);

    const final = await syncMain(github, repo, number, branch, issueNumber);
    if (await refSha(github, repo, 'main') !== final.mainSha
      || await refSha(github, repo, branch) !== final.branchSha) {
      fail('Branch or main changed before making the PR ready.');
    }
    const readyPr = await prAtHead(github, repo, number, branch, issueNumber, final.branchSha);
    await assertFreshSource(github, repo, issueNumber, branch, agent, expectedDigest);
    if (!readyPr.node_id) fail('PR is missing its GitHub node ID.');
    const ready = await github.graphql(`
      mutation($pullRequestId: ID!) {
        markPullRequestReadyForReview(input: {pullRequestId: $pullRequestId}) {
          pullRequest { isDraft }
        }
      }
    `, {pullRequestId: readyPr.node_id});
    if (ready?.markPullRequestReadyForReview?.pullRequest?.isDraft !== false) {
      fail('GitHub did not mark the implementation PR ready for review.');
    }
    core?.info?.(`Published ${commitSha} on ${branch}; PR #${number} is ready at ${final.branchSha}.`);
    return {issueNumber, branch, pr: number, commitSha, headSha: final.branchSha, mainSha: final.mainSha};
  }

  return publish;
}

const publish = createPublisher();
module.exports = {
  publish, createPublisher, issueFromBranch, assertPrIdentity,
  safeGitPath, assertAutoPublishPath, diffHeaderPaths, validatePatch, parseStagedChanges,
};