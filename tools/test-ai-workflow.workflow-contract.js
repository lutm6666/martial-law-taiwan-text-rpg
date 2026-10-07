'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const guard = fs.readFileSync('.github/workflows/ai-path-guard.yml', 'utf8');
const review = fs.readFileSync('.github/workflows/ai-cross-review.yml', 'utf8');
const claude = fs.readFileSync('.github/workflows/claude-review.yml', 'utf8');
const claudeRuntime = fs.readFileSync('tools/ai-workflow.claude-review.js', 'utf8');
const guardRuntime = fs.readFileSync('tools/ai-path-guard.runtime.js', 'utf8');

assert.match(review, /group: ai-cross-review-/,
  'cross-review concurrency must remain scoped to the PR');
assert.match(review, /pull-requests: write/,
  'cross-review label/comment routing requires pull-requests: write');
assert.match(review, /ai-workflow\.review\.js/,
  'cross-review workflow must use the path-based review module');
assert.doesNotMatch(review, /ai-workflow\.js'\)\.crossReview/,
  'cross-review workflow must not fall back to legacy ai-workflow.crossReview');

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
  const yaml = fs.readFileSync(filename, 'utf8');
  const scripts = [...yaml.matchAll(/          script: \|\n((?:            .*\n|\n)+)/g)];
  assert(scripts.length > 0, filename + ' must expose embedded github-script code to validate');
  for (const match of scripts) {
    new vm.Script('(async function(){\n' + match[1].replace(/^            /gm, '') + '\n})', {filename});
  }
}

console.log('PASS AI workflow YAML contracts, trusted exact-head completion wakeups, conservative Claude input budgets, completion attestation, and embedded scripts compile');
