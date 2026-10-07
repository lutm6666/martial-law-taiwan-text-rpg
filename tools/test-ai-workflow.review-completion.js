'use strict';

const assert = require('node:assert/strict');
const review = require('./ai-workflow.review-completion');

const SHA = '0123456789abcdef0123456789abcdef01234567';
const OLD_SHA = '89abcdef0123456789abcdef0123456789abcdef';

function actionsComment(body, overrides = {}) {
  return {
    user: {login: 'github-actions[bot]', type: 'Bot'},
    performed_via_github_app: {id: 15368, slug: 'github-actions'},
    created_at: '2026-10-07T06:00:00Z',
    updated_at: '2026-10-07T06:00:00Z',
    body,
    ...overrides,
  };
}

function codexRequest(sha = SHA, overrides = {}) {
  return actionsComment(
    '<!-- cross-review:v2:codex:' + sha + ':initial -->\n@codex review\n\n**Requested commit:** `' + sha + '`\n**Status:** request sent; receiver acknowledgement and completion are not implied.',
    overrides
  );
}

function codexUser(overrides = {}) {
  return {
    login: 'chatgpt-codex-connector[bot]',
    id: 199175422,
    type: 'Bot',
    html_url: 'https://github.com/apps/chatgpt-codex-connector',
    ...overrides,
  };
}

function codexReview(commitId = SHA, overrides = {}) {
  return {
    user: codexUser(),
    state: 'COMMENTED',
    submitted_at: '2026-10-07T06:00:42Z',
    commit_id: commitId,
    body: '\n### 💡 Codex Review\n\nHere are some automated review suggestions for this pull request.\n\n**Reviewed commit:** `' + commitId.slice(0, 10) + '`\n',
    ...overrides,
  };
}

function codexSummary({sha = SHA, status = 'Completed', appId = 1144995, slug = 'chatgpt-codex-connector', user = codexUser(), updatedAt = '2026-10-07T06:22:47Z'} = {}) {
  const icon = status === 'Completed' ? '✅' : '🔄';
  const statusText = status === 'Completed' ? '**Completed**' : '**Running**';
  return {
    user,
    performed_via_github_app: {id: appId, slug},
    created_at: '2026-10-07T05:59:06Z',
    updated_at: updatedAt,
    body: '<!-- codex-pull-request-review-summary -->\n\n## Codex Review Summary\n\n| Review | Status | Commit | Review trigger |\n| --- | --- | --- | --- |\n| 📝 **Code Review** | ' + icon + ' ' + statusText + ' | `' + sha.slice(0, 7) + '` | New commits |',
  };
}

assert.equal(review.validSha(SHA), true);
assert.equal(review.validSha('abc'), false);
assert.equal(review.validSha(undefined), false);

const marker = '<!-- claude-review:completed:' + SHA + ' -->';
assert.equal(review.claudeCompleted([
  actionsComment(marker + '\n**Claude review completed**\nHead: `' + SHA + '`'),
], SHA), true);

assert.equal(review.claudeCompleted([
  actionsComment('prefix\n' + marker + '\n**Claude review completed**'),
], SHA), false, 'marker must be the fixed first line');

assert.equal(review.claudeCompleted([
  actionsComment(marker, {performed_via_github_app: {id: 1144995, slug: 'chatgpt-codex-connector'}}),
], SHA), false, 'non-Actions app provenance must not count');

assert.equal(review.claudeCompleted([
  actionsComment(marker, {updated_at: '2026-10-07T06:00:01Z'}),
], SHA), false, 'edited completion comments must not count');

assert.equal(review.claudeCompleted([
  actionsComment(marker, {user: {login: 'github-actions[bot]', type: 'User'}}),
], SHA), false);

assert.equal(review.claudeCompleted([
  actionsComment(marker, {performed_via_github_app: null}),
], SHA), false);

const completedSummary = codexSummary();
assert.equal(review.codexCompleted([codexReview()], [completedSummary], SHA), true,
  'managed exact-head Codex review plus managed Completed summary must count');
assert.equal(review.codexCompleted([codexReview()], [codexSummary({status: 'Running'})], SHA), false,
  'an in-flight managed summary must not count as completion');
assert.equal(review.codexCompleted([codexReview()], [], SHA), false,
  'a review without the managed completion lifecycle summary must fail closed');
assert.equal(review.codexCompleted([codexReview()], [codexSummary({appId: 15368, slug: 'github-actions'})], SHA), false,
  'summary from the wrong GitHub App must fail closed');
assert.equal(review.codexCompleted([codexReview()], [codexSummary({sha: OLD_SHA})], SHA), false,
  'old-head managed summary must not complete the current exact-head review');
assert.equal(review.codexCompleted([codexReview(OLD_SHA)], [completedSummary], SHA), false,
  'old-head Codex review must not count');
assert.equal(review.codexCompleted([codexReview(SHA, {state: 'DISMISSED'})], [completedSummary], SHA), false);
assert.equal(review.codexCompleted([codexReview(SHA, {body: 'rate limit reached'})], [completedSummary], SHA), false,
  'a generic bot message must not masquerade as the managed Codex review template');
assert.equal(review.codexCompleted([codexReview(SHA, {user: codexUser({id: 1})})], [completedSummary], SHA), false,
  'wrong Codex bot id must fail closed');
assert.equal(review.codexCompleted([codexReview(SHA, {user: codexUser({login: 'chatgpt-codex-connector'})})], [completedSummary], SHA), false,
  'wrong Codex login must fail closed');
assert.equal(review.codexCompleted([codexReview(SHA, {user: codexUser({type: 'User'})})], [completedSummary], SHA), false,
  'non-Bot Codex actor must fail closed');
assert.equal(review.codexCompleted([codexReview('abc')], [completedSummary], 'abc'), false,
  'malformed commit ids and requested shas must fail closed');

assert.equal(review.codexCompleted([], [codexRequest(), completedSummary], SHA), true,
  'clean-pass fallback may use trusted full-SHA request plus a later managed Completed summary');
assert.equal(review.codexCompleted([], [completedSummary], SHA), false,
  'managed summary alone is not exact-head evidence');
assert.equal(review.codexCompleted([], [codexRequest(), codexSummary({status: 'Running'})], SHA), false,
  'clean-pass fallback must not accept an in-flight summary');
assert.equal(review.codexCompleted([], [codexRequest(OLD_SHA), completedSummary], SHA), false,
  'old-head request cannot bind current-head clean completion');
assert.equal(review.codexCompleted([], [
  codexRequest(SHA, {performed_via_github_app: {id: 1144995, slug: 'chatgpt-codex-connector'}}),
  completedSummary,
], SHA), false, 'clean-pass request must come from trusted GitHub Actions provenance');
assert.equal(review.codexCompleted([], [
  codexRequest(SHA, {body: '<!-- cross-review:v2:codex:' + SHA + ':initial -->\n@codex review'}),
  completedSummary,
], SHA), false, 'clean-pass request must carry the exact requested commit in the trusted body');
assert.equal(review.codexCompleted([], [
  codexRequest(SHA, {created_at: '2026-10-07T07:00:00Z', updated_at: '2026-10-07T07:00:00Z'}),
  codexSummary({updatedAt: '2026-10-07T06:22:47Z'}),
], SHA), false, 'a stale Completed summary from before the exact-head request must not count');

assert.deepEqual(review.completionStatus({reviewers: ['claude'], comments: [actionsComment(marker)], sha: SHA}), {
  required: ['claude'], completed: ['claude'], missing: [], complete: true,
});
assert.deepEqual(review.completionStatus({
  reviewers: ['codex', 'claude'],
  comments: [actionsComment(marker), completedSummary],
  reviews: [codexReview()],
  sha: SHA,
}), {
  required: ['codex', 'claude'], completed: ['codex', 'claude'], missing: [], complete: true,
});
assert.deepEqual(review.completionStatus({
  reviewers: ['codex', 'claude'],
  comments: [actionsComment(marker), codexRequest(), completedSummary],
  reviews: [],
  sha: SHA,
}), {
  required: ['codex', 'claude'], completed: ['codex', 'claude'], missing: [], complete: true,
});
assert.deepEqual(review.completionStatus({
  reviewers: ['codex', 'claude'],
  comments: [actionsComment(marker), completedSummary],
  reviews: [codexReview(OLD_SHA)],
  sha: SHA,
}), {
  required: ['codex', 'claude'], completed: ['claude'], missing: ['codex'], complete: false,
});

console.log('PASS exact-head review completion requires trusted Claude marker and managed Codex lifecycle evidence, with a full-SHA request-bound clean-pass fallback');
