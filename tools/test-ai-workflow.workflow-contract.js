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

assert.match(claude, /actions: write/,
  'Claude receiver needs actions: write to rerun the native guard after completion');
assert.match(claude, /checks: read/,
  'Claude receiver needs checks: read to locate the native guard for the exact head');
assert.match(claude, /Publish verified result and re-evaluate guard/,
  'Claude completion publication must explicitly re-evaluate the guard');
assert.match(claude, /chunked=true/,
  'Claude workflow must instruct the reviewer to read chunked oversized snapshots');
assert.match(claudeRuntime, /writeReviewSnapshot/,
  'Claude receiver must split large snapshots instead of creating an unmergeable size dead-end');
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

console.log('PASS AI workflow YAML contracts, trusted exact-head completion wakeups, chunked Claude review input, and embedded scripts compile');
