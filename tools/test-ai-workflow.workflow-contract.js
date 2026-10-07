'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const guard = fs.readFileSync('.github/workflows/ai-path-guard.yml', 'utf8');
const review = fs.readFileSync('.github/workflows/ai-cross-review.yml', 'utf8');
const claude = fs.readFileSync('.github/workflows/claude-review.yml', 'utf8');
const dispatch = fs.readFileSync('.github/workflows/ai-dispatch.yml', 'utf8').replace(/\r\n/g, '\n');
const project = fs.readFileSync('.github/workflows/project-ci.yml', 'utf8').replace(/\r\n/g, '\n');
const claudeRuntime = fs.readFileSync('tools/ai-workflow.claude-review.js', 'utf8');
const guardRuntime = fs.readFileSync('tools/ai-path-guard.runtime.js', 'utf8');
const reviewRuntime = fs.readFileSync('tools/ai-workflow.review.js', 'utf8');
const {reviewPlan} = require('./ai-workflow.review.js');

assert.match(project, /^    name: project-validate$/m,
  'the existing ruleset-required project-validate job must keep its exact name');
assert.match(project, /persist-credentials: false/,
  'PR validation must not expose a checkout credential to model-generated code');
assert.match(fs.readFileSync('.github/workflows/case3-ci.yml', 'utf8'), /persist-credentials: false/,
  'Case 3 PR validation must not expose a checkout credential to model-generated code');
assert.match(guard, /^  guard:$/m,
  'the existing ruleset-required guard job must keep its exact name');
assert.match(guardRuntime, /sha: pr\.head\.sha/,
  'guard must validate reviewer completion at the exact current PR head');
assert.match(guardRuntime, /ownerApproval\(comments, \[\], owner, pr\.head\.sha/,
  'only control-path changes may pass through exact-head owner approval');
for (const path of [
  'tools/ai-workflow.routing.js',
  'tools/ai-workflow.dispatch.js',
  'tools/ai-workflow.publish.js',
  'tools/test-ai-workflow.routing.js',
  'tools/test-ai-workflow.dispatch.js',
  'tools/test-ai-workflow.publish.js',
]) {
  const plan = reviewPlan({pr: {head: {ref: 'ai/issue-1'}, labels: []}, files: [path]});
  assert.equal(plan.flags.control, true, path + ' must retain the control owner gate');
  assert.equal(plan.tier, 3, path + ' must retain Tier 3 review');
}

function job(name, next) {
  const start = dispatch.indexOf('\n  ' + name + ':\n');
  assert(start >= 0, 'AI Dispatch must define the ' + name + ' job');
  const end = next ? dispatch.indexOf('\n  ' + next + ':\n', start + 1) : dispatch.length;
  assert(end > start, 'AI Dispatch jobs must keep the expected order');
  return dispatch.slice(start, end);
}

const dispatchJob = job('dispatch', 'implement');
const modelJob = job('implement', 'publish');
const publisherJob = job('publish');

assert.match(dispatch, /types: \[opened, reopened, edited, closed, labeled\]/,
  'opening or reopening an Issue must start automatic planning');
assert.doesNotMatch(dispatchJob, /if: github\.event\.action != 'labeled'/,
  'all subscribed Issue events must reconcile closed sources despite pending-run replacement');
assert.match(dispatchJob, /ref: \$\{\{ github\.sha \}\}[\s\S]*?persist-credentials: false/,
  'Issue dispatch must execute only the trusted default-branch code');
assert.match(dispatchJob, /ai-workflow\.dispatch\.js'\)\.dispatch/,
  'Issue dispatch must use the dedicated trusted runtime');
for (const output of ['branch', 'pr', 'agent', 'authorized', 'run', 'digest']) {
  assert.match(dispatchJob, new RegExp('^      ' + output + ': \\$\\{\\{ steps\\.plan\\.outputs\\.' + output + ' \\}\\}$', 'm'),
    'dispatch must expose ' + output + ' for the implementation and publisher jobs');
}
assert(dispatchJob.indexOf('Require dispatch GitHub App credentials') < dispatchJob.indexOf('Create narrowly scoped dispatch token'),
  'missing App credentials must fail before dispatch can create a branch or PR');
assert.match(dispatchJob, /vars\.AI_DISPATCH_APP_CLIENT_ID/);
assert.match(dispatchJob, /secrets\.AI_DISPATCH_APP_PRIVATE_KEY/);
assert.match(dispatchJob, /actions\/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1/,
  'dispatch must use the pinned GitHub App token action');
assert.match(dispatchJob, /client-id: \$\{\{ vars\.AI_DISPATCH_APP_CLIENT_ID \}\}/,
  'the pinned v3 App token action accepts the App client ID');
assert.doesNotMatch(dispatch, /\bapp-id:/,
  'the pinned v3 action deprecates its numeric app-id input');
for (const permission of ['contents', 'pull-requests', 'issues']) {
  assert.match(dispatchJob, new RegExp('permission-' + permission + ': write'),
    'the dispatch App token needs scoped ' + permission + ' write access');
}
assert.doesNotMatch(dispatch, /permission-workflows: write/,
  'untrusted model patches must not be publishable into executable Actions workflows');
assert.match(dispatchJob, /github-token: \$\{\{ steps\.app-token\.outputs\.token \}\}/,
  'branch and PR mutations must use the App token so downstream PR events run');

assert.match(modelJob, /if: needs\.dispatch\.outputs\.run == 'true'/,
  'only a writer-authorized Issue with a selected agent may reach the model');
assert.match(modelJob, /permissions:\n      contents: read\n      issues: read/,
  'the model job must have a read-only GITHUB_TOKEN');
assert.doesNotMatch(modelJob, /permission-(?:contents|pull-requests|issues): write|steps\.app-token\.outputs\.token/,
  'the model job must never receive the dispatch App token');
assert.match(modelJob, /ref: \$\{\{ github\.sha \}\}[\s\S]*?persist-credentials: false/,
  'model checkout must use trusted main without persisted credentials');
assert.match(modelJob, /sha256sum \.git\/config[\s\S]*?steps\.git-config\.outputs\.sha/,
  'model output must not be packaged after it changes local Git configuration');
assert.match(modelJob, /github\.rest\.issues\.get/,
  'model input must be fetched from the Issue API');
assert.match(modelJob, /github\.rest\.repos\.getContent/,
  'model must read the planned route through the GitHub API');
assert.match(modelJob, /title_body_sha256 !== digest/,
  'the model brief must fail closed if Issue text changed after routing');
assert.match(modelJob, /digest !== process\.env\.EXPECTED_DIGEST/,
  'the model brief must be bound to the trusted dispatch snapshot');
assert.match(modelJob, /RUNNER_TEMP, 'issue-brief\.md'/,
  'untrusted Issue text must be stored outside the repository checkout');
assert.match(modelJob, /openai\/codex-action@bdf19a4a223ec2549a3e2274a0cf61556bc07675/,
  'Codex implementation action must use a pinned version');
assert.match(modelJob, /openai-api-key: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
assert.match(modelJob, /safety-strategy: drop-sudo[\s\S]*?sandbox: workspace-write/,
  'Codex must keep the restricted implementation sandbox');
assert.match(modelJob, /anthropics\/claude-code-action\/base-action@fd1c128679612beff4ca259c78021c506e8aa7a7/,
  'Claude implementation must use the pinned local-only base action');
assert.match(modelJob, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/);
assert.match(modelJob, /--allowedTools Read,Glob,Grep,Edit,Write(?:\n|$)/,
  'Claude may edit but must not run arbitrary shell commands with its OAuth credential');
assert.doesNotMatch(modelJob, /--allowedTools[^\n]*Bash/,
  'Claude implementation must not receive Bash beside its OAuth credential');
assert.match(modelJob, /prompt_file: \$\{\{ runner\.temp \}\}\/claude-implementation-prompt\.md/,
  'Claude must read the trusted prompt from outside the repository checkout');
assert.doesNotMatch(modelJob, /github_token:/,
  'Claude base action must not receive a publishing GitHub token');
assert.match(modelJob, /git -c core\.fsmonitor=false -c core\.hooksPath=\/dev\/null add -A[\s\S]*?diff --cached --binary --no-ext-diff/,
  'model output must preserve binary edits in an artifact patch');
assert.match(modelJob, /actions\/upload-artifact@v4/,
  'models must hand a patch to a separate trusted publisher');

assert.match(publisherJob, /needs: \[dispatch, implement\]/,
  'publisher must wait for both routing and the model patch');
assert.match(publisherJob, /needs\.implement\.result == 'success'/,
  'publisher must not mark a PR ready after model failure');
assert.match(publisherJob, /ref: \$\{\{ github\.sha \}\}[\s\S]*?persist-credentials: false/,
  'publisher code must come from the trusted default branch');
assert.match(publisherJob, /actions\/download-artifact@v4/);
assert.match(publisherJob, /ai-workflow\.publish\.js'\)\.publish/,
  'publication must go through the trusted patch validator');
assert.match(publisherJob, /github-token: \$\{\{ steps\.app-token\.outputs\.token \}\}/,
  'publisher mutations must use the GitHub App token');
assert.match(publisherJob, /EXPECTED_DIGEST: \$\{\{ needs\.dispatch\.outputs\.digest \}\}/,
  'publisher must receive the Issue digest from the trusted dispatch job');
assert.match(publisherJob, /expectedDigest: process\.env\.EXPECTED_DIGEST/,
  'publisher must recheck the source Issue before publication');
const publisherRuntime = fs.readFileSync('tools/ai-workflow.publish.js', 'utf8');
assert.match(publisherRuntime, /assertFreshSource\(github, repo, issueNumber, branch, agent, expectedDigest\)/,
  'publisher must recheck the live Issue and routing plan');
assert.match(publisherRuntime, /\^\\\.github\\\/\(\?:workflows\|actions\)\\\//,
  'publisher must refuse model-generated executable Actions files');
assert.doesNotMatch(dispatch, /git push (?:origin )?main|\/ai approve-handoff [0-9a-f]{40}/,
  'Issue automation may neither push main nor impersonate owner approval');

assert.match(review, /group: ai-cross-review-/,
  'cross-review concurrency must remain scoped to the PR');
assert.match(review, /pull-requests: write/,
  'cross-review label/comment routing requires pull-requests: write');
assert.match(review, /ai-workflow\.review\.js/,
  'cross-review workflow must use the path-based review module');
assert.doesNotMatch(review, /ai-workflow\.js'\)\.crossReview/,
  'cross-review workflow must not fall back to legacy ai-workflow.crossReview');
assert.doesNotMatch(reviewRuntime, /fork PR: no automatic cross-review/,
  'fork PRs must retain an API-only reviewer request path instead of becoming permanently blocked');

assert.match(guard, /path: trusted/,
  'guard must continue loading policy from the trusted base checkout');
assert.match(guard, /ai-path-guard\.runtime\.js/,
  'guard must continue using the hardened runtime');
assert.doesNotMatch(guard, /^  pull_request_review:/m,
  'guard must not run a PR-controlled workflow on pull_request_review');
assert.match(guard, /^  issue_comment:/m,
  'Codex summary edits must wake the trusted default-branch guard through issue comments');
assert.match(guard, /types: \[created, edited, deleted\]/,
  'issue comment creation, edit, and deletion must all re-evaluate the guard');
assert.match(guardRuntime, /waitForNativeGuard/,
  'guard wakeups must wait out an in-flight native guard before rerunning it');

assert.match(claude, /persist-credentials: false/,
  'trusted-base Claude checkout must not persist repository credentials');
assert.match(claude, /actions: write/,
  'Claude receiver needs actions: write to rerun the native guard after completion');
assert.match(claude, /checks: read/,
  'Claude receiver needs checks: read to locate the native guard for the exact head');
assert.match(claude, /github\.event\.label\.name == 'review:retry'/,
  'review:retry must directly wake the trusted Claude receiver instead of relying on an Actions-authored comment');
assert.match(claudeRuntime, /label\?\.name === 'review:retry'/,
  'Claude prepare must recognize the retry label');
assert.match(claudeRuntime, /Retry.*Claude review requires a repository writer/,
  'retry-triggered Claude reviews must remain writer-authorized');
assert.match(claude, /Publish verified result and re-evaluate guard/,
  'Claude completion publication must explicitly re-evaluate the guard');
assert.match(claude, /steps\.prepare\.outputs\.snapshot_parts/,
  'Claude review must receive the exact count of required snapshot inputs');
assert.match(claude, /parts_read/,
  'Claude structured output must attest that every required snapshot input was read');
assert.match(claude, /--max-turns 100/,
  'Claude turn budget must accommodate the bounded multi-part review input');
assert.match(claudeRuntime, /SNAPSHOT_INLINE_LIMIT = 16000/,
  'Claude inline input must remain conservatively below the observed Read truncation range');
assert.match(claudeRuntime, /SNAPSHOT_PART_LIMIT = 15000/,
  'Claude review parts must remain conservatively below the observed Read truncation range');
assert.match(claudeRuntime, /SNAPSHOT_RECORD_LIMIT = 12000/,
  'single record budget must leave serialization headroom inside each part');
assert.match(claudeRuntime, /MAX_SNAPSHOT_PARTS = 80/,
  'Claude review parts must remain bounded below the model turn budget');
assert.match(claudeRuntime, /patch_fragment/,
  'single oversized file patches must be fragmented instead of producing oversized part files');
assert.match(claudeRuntime, /review\.parts_read !== requiredParts/,
  'completion publication must fail closed when Claude did not attest to every input');
assert.match(claudeRuntime, /deleteComment/,
  'a completion marker must be rolled back if its required guard wakeup fails');
assert.match(claudeRuntime, /already completed for this SHA; retrying the exact-head guard wakeup/,
  'an existing completion marker must retry guard wakeup rather than silently skip');
assert.match(claudeRuntime, /rerunGuardAfterCompletion/,
  'Claude receiver runtime must directly rerun the guard after its trusted marker');
assert.match(claudeRuntime, /POST \/repos\/\{owner\}\/\{repo\}\/actions\/jobs\/\{job_id\}\/rerun/,
  'Claude receiver must use the native job rerun endpoint instead of relying on a suppressed GITHUB_TOKEN comment event');

for (const filename of [
  '.github/workflows/ai-path-guard.yml',
  '.github/workflows/ai-cross-review.yml',
  '.github/workflows/ai-dispatch.yml',
  '.github/workflows/claude-review.yml',
]) {
  const yaml = fs.readFileSync(filename, 'utf8').replace(/\r\n/g, '\n');
  const scripts = [...yaml.matchAll(/          script: \|\n((?:            .*\n|\n)+)/g)];
  assert(scripts.length > 0, filename + ' must expose embedded github-script code to validate');
  for (const match of scripts) {
    new vm.Script('(async function(){\n' + match[1].replace(/^            /gm, '') + '\n})', {filename});
  }
}

console.log('PASS AI workflow YAML contracts, fork reviewer routing, writer-only retry wakeups, trusted exact-head completion wakeups, conservative Claude input budgets, completion attestation, and embedded scripts compile');
