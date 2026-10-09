'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');
const {reviewPlan} = require('./ai-workflow.review.js');

const dispatch = fs.readFileSync('.github/workflows/ai-dispatch.yml', 'utf8').replace(/\r\n/g, '\n');
const project = fs.readFileSync('.github/workflows/project-ci.yml', 'utf8').replace(/\r\n/g, '\n');
const guardRuntime = fs.readFileSync('tools/ai-path-guard.runtime.js', 'utf8');

assert.match(project, /^    name: project-validate$/m,
  'the existing ruleset-required project-validate job must keep its exact name');
assert.match(project, /persist-credentials: false/,
  'PR validation must not expose a checkout credential to model-generated code');
assert.match(fs.readFileSync('.github/workflows/case3-ci.yml', 'utf8'), /persist-credentials: false/,
  'Case 3 PR validation must not expose a checkout credential to model-generated code');
assert.match(guardRuntime, /sha: pr\.head\.sha/,
  'guard must validate reviewer completion at the exact current PR head');
assert.match(guardRuntime, /ownerApproval\(comments, \[\], owner, pr\.head\.sha/,
  'only control-path changes may pass through exact-head owner approval');

for (const path of [
  'tools/ai-workflow.routing.js',
  'tools/ai-workflow.dispatch.js',
  'tools/ai-workflow.publish.js',
  'tools/ai-workflow.secret-scan.js',
  'tools/test-ai-workflow.routing.js',
  'tools/test-ai-workflow.dispatch.js',
  'tools/test-ai-workflow.dispatch-recovery.js',
  'tools/test-ai-workflow.dispatch-contract.js',
  'tools/test-ai-workflow.publish.js',
  'tools/test-ai-workflow.secret-scan.js',
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
const modelJob = job('implement', 'scan');
const scanJob = job('scan', 'publish');
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
assert(modelJob.indexOf('Record trusted artifact uploader') < modelJob.indexOf('Implement Issue with Codex'),
  'the artifact uploader must be checked before the model receives Issue text');
assert.match(modelJob, /_actions\/actions\/upload-artifact\/v4[\s\S]*?realpath -e -- "\$action_dir"[\s\S]*?find "\$action_dir" -type l[\s\S]*?echo "sha=\$uploader_sha"/,
  'the trusted runner must record the canonical uploader tree and digest');
assert.match(modelJob, /realpath -e -- "\$UPLOADER_PATH"[\s\S]*?find "\$UPLOADER_PATH" -type l[\s\S]*?"\$uploader_sha" == "\$UPLOADER_SHA"/,
  'packaging must reject a changed artifact uploader before it runs');
assert.match(modelJob, /shell: \/bin\/bash --noprofile --norc -e -o pipefail \{0\}/,
  'model patch packaging must use a fixed shell without startup files');
assert.match(modelJob, /BASH_ENV: \/dev\/null[\s\S]*?LD_PRELOAD: ''[\s\S]*?PATH: \/usr\/bin:\/bin/,
  'model patch packaging must discard startup and loader injection paths');
assert.match(modelJob, /\/usr\/bin\/env -i PATH=\/usr\/bin:\/bin HOME=\/[\s\S]*?GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_SYSTEM=\/dev\/null[\s\S]*?GIT_CONFIG_GLOBAL=\/dev\/null GIT_CONFIG_COUNT=0 GIT_CONFIG_PARAMETERS=/,
  'packaging Git must ignore model-written global, system, and environment config');
assert.match(modelJob, /GIT_DIR="\$PACKAGE_WORKSPACE\/\.git"[\s\S]*?GIT_WORK_TREE="\$PACKAGE_WORKSPACE" GIT_INDEX_FILE="\$PACKAGE_WORKSPACE\/\.git\/index"/,
  'packaging Git must use the trusted checkout metadata and index');
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
assert.match(modelJob, /'', brief,[\s\S]*?claude-implementation-prompt\.md/,
  'the restricted Claude model must receive Issue data in the prompt instead of reading runner temp');
assert.match(modelJob, /openai\/codex-action@bdf19a4a223ec2549a3e2274a0cf61556bc07675/,
  'Codex implementation action must use a pinned version');
assert.match(modelJob, /openai-api-key: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
assert.match(modelJob, /safety-strategy: drop-sudo[\s\S]*?sandbox: workspace-write/,
  'Codex must keep the restricted implementation sandbox');
assert.match(modelJob, /anthropics\/claude-code-action\/base-action@fd1c128679612beff4ca259c78021c506e8aa7a7/,
  'Claude implementation must use the pinned local-only base action');
assert.match(modelJob, /claude_code_oauth_token: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/);
assert.match(modelJob, /--restricted\n            --tools Read,Glob,Grep,Edit,Write\n            --allowedTools Read,Glob,Grep,Edit,Write\n            --disallowedTools mcp__\*\n            --permission-mode dontAsk/,
  'Claude must confine file operations to the workspace and exclude shell, agent, and MCP tools');
assert.match(modelJob, /prompt_file: \$\{\{ runner\.temp \}\}\/claude-implementation-prompt\.md/,
  'Claude must read the trusted prompt from outside the repository checkout');
assert.doesNotMatch(modelJob, /github_token:/,
  'Claude base action must not receive a publishing GitHub token');
assert.match(modelJob, /safe_git -c core\.fsmonitor=false -c core\.hooksPath=\/dev\/null -c core\.attributesFile=\/dev\/null add -A[\s\S]*?safe_git[^\n]* diff --cached --binary --no-ext-diff/,
  'the isolated packaging Git must preserve binary edits without external hooks or attributes');
assert.match(modelJob, /actions\/upload-artifact@v4/,
  'models must hand a patch to a separate trusted publisher');
assert.match(modelJob, /if-no-files-found: error\n          overwrite: true/,
  'rerunning implementation must replace its prior immutable artifact for this run');
const uploadStep = modelJob.slice(modelJob.indexOf('      - name: Upload implementation patch'));
assert.match(uploadStep, /NODE_OPTIONS: ''[\s\S]*?NODE_PATH: ''[\s\S]*?LD_PRELOAD: ''[\s\S]*?PATH: \/usr\/bin:\/bin/,
  'artifact action must not inherit model-written Node, loader, or executable search paths');
for (const variable of ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'NO_PROXY']) {
  assert.match(uploadStep, new RegExp('^          ' + variable + ": ''$", 'm'),
    'artifact action must clear model-injected proxy variable ' + variable);
}
// GitHub rejects case-insensitive duplicate keys even on Linux runners.
function assertUniqueEnvKeys(yaml) {
  let indent = -1;
  let keys;
  for (const [index, line] of yaml.split('\n').entries()) {
    if (keys && line.trim() && line.search(/\S/) <= indent) keys = null;
    const block = line.match(/^(\s*)env:\s*$/);
    if (block) {
      indent = block[1].length;
      keys = new Set();
      continue;
    }
    if (!keys) continue;
    const entry = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*):/);
    if (!entry) continue;
    const key = entry[1].toUpperCase();
    assert(!keys.has(key), 'duplicate workflow env key at line ' + (index + 1) + ': ' + entry[1]);
    keys.add(key);
  }
}
assert.throws(() => assertUniqueEnvKeys("env:\n  HTTPS_PROXY: ''\n  https_proxy: ''\n"),
  /duplicate workflow env key/, 'the original activation failure must be rejected');
assert.doesNotThrow(() => assertUniqueEnvKeys("env:\n  HTTPS_PROXY: ''\nsteps:\n  - env:\n      HTTPS_PROXY: ''\n"),
  'independent env blocks may reuse a key');
assertUniqueEnvKeys(dispatch);
const packageStep = modelJob.slice(modelJob.indexOf('      - name: Package binary-capable implementation patch'),
  modelJob.indexOf('      - name: Upload implementation patch'));
assert.match(packageStep,
  /printf '%s\\n' 'https_proxy=' 'http_proxy=' 'all_proxy=' 'no_proxy=' >> "\$GITHUB_ENV"/,
  'the trusted packaging step must clear lowercase Linux proxies through the runner env file');
assert.doesNotMatch(uploadStep, /^          (?:https_proxy|http_proxy|all_proxy|no_proxy):/m,
  'lowercase proxies must not collide with uppercase workflow env keys');

assert.match(uploadStep, /NODE_EXTRA_CA_CERTS: ''[\s\S]*?NODE_TLS_REJECT_UNAUTHORIZED: '1'/,
  'artifact action must not accept a model-provided CA or disabled TLS verification');
for (const variable of ['OPENSSL_CONF', 'SSL_CERT_FILE', 'SSL_CERT_DIR']) {
  assert.match(uploadStep, new RegExp('^          ' + variable + ": ''$", 'm'),
    'artifact action must clear model-injected TLS variable ' + variable);
}

assert.match(scanJob, /needs: \[dispatch, implement\]/,
  'the scanner must wait for the implementation artifact');
assert.match(scanJob, /needs\.implement\.result == 'success'/,
  'the scanner must not run after a failed implementation');
assert.match(scanJob, /permissions:\n      contents: read/,
  'the scanner must have read-only repository permissions');
assert.doesNotMatch(scanJob, /app-token|AI_DISPATCH_APP_PRIVATE_KEY|permission-(?:contents|pull-requests|issues): write/,
  'the scanner must not receive a publishing App credential');
assert.match(scanJob, /ref: \$\{\{ github\.sha \}\}[\s\S]*?persist-credentials: false/,
  'the scanner must use trusted main without a checkout credential');
assert.match(scanJob, /actions\/download-artifact@v4/,
  'the scanner must inspect the exact implementation artifact');
assert.match(scanJob, /OPENAI_API_KEY: \$\{\{ secrets\.OPENAI_API_KEY \}\}/);
assert.match(scanJob, /CLAUDE_CODE_OAUTH_TOKEN: \$\{\{ secrets\.CLAUDE_CODE_OAUTH_TOKEN \}\}/);
assert.match(scanJob, /node tools\/ai-workflow\.secret-scan\.js "\$PATCH_PATH"/,
  'the scanner must inspect the staged model output before publication');

assert.match(publisherJob, /needs: \[dispatch, implement, scan\]/,
  'publisher must wait for routing, implementation, and secret scanning');
assert.match(publisherJob, /needs\.implement\.result == 'success'/,
  'publisher must not mark a PR ready after model failure');
assert.match(publisherJob, /needs\.scan\.result == 'success'/,
  'publisher must not publish a patch that failed secret scanning');
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

if (process.platform === 'linux') {
  const {spawnSync} = require('node:child_process');
  for (const step of ['Record trusted artifact uploader', 'Package binary-capable implementation patch']) {
    const escaped = step.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = dispatch.match(new RegExp('      - name: ' + escaped + '\\n(?:        .*\\n|          .*\\n|\\n)*?        run: \\|\\n((?:          .*\\n|\\n)+)'));
    assert(match, step + ' shell block must be present');
    const shell = match[1].replace(/^          /gm, '');
    const result = spawnSync('/bin/bash', ['-n'], {input: shell, encoding: 'utf8'});
    assert.equal(result.status, 0, step + ' shell must parse on the Actions runner: ' + result.stderr);
  }
}

console.log('PASS AI dispatch workflow credentials, model isolation, secret scanning, trusted publication, and shell contracts');
