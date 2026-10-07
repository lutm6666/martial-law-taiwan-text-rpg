'use strict';

const assert = require('node:assert/strict');
const review = require('./ai-workflow.review-completion');

const SHA = '0123456789abcdef0123456789abcdef01234567';
const OLD_SHA = '89abcdef0123456789abcdef0123456789abcdef';

function actionsComment(body, overrides = {}) {
  return {
    user: {login: 'github-actions[bot]', type: 'Bot'},
    performed_via_github_app: {id: 15368, slug: 'github-actions'},
    created_at: '2026-10-06T16:00:00Z',
    updated_at: '2026-10-06T16:00:00Z',
    body,
    ...overrides,
  };
}

function codexReview(commitId = SHA, overrides = {}) {
  return {
    user: {
      login: 'chatgpt-codex-connector[bot]',
      id: 199175422,
      type: 'Bot',
      html_url: 'https://github.com/apps/chatgpt-codex-connector',
    },
    state: 'COMMENTED',
    submitted_at: '2026-10-07T06:00:42Z',
    commit_id: commitId,
    ...overrides,
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
  actionsComment(marker, {updated_at: '2026-10-06T16:00:01Z'}),
], SHA), false, 'edited completion comments must not count');

assert.equal(review.claudeCompleted([
  actionsComment(marker, {user: {login: 'github-actions[bot]', type: 'User'}}),
], SHA), false);

assert.equal(review.claudeCompleted([
  actionsComment(marker, {performed_via_github_app: null}),
], SHA), false);

assert.equal(review.codexCompleted([codexReview()], SHA), true,
  'managed Codex review pinned to the exact head must count');
assert.equal(review.codexCompleted([codexReview(OLD_SHA)], SHA), false,
  'old-head Codex review must not count');
assert.equal(review.codexCompleted([codexReview(SHA, {state: 'DISMISSED'})], SHA), false);
assert.equal(review.codexCompleted([codexReview(SHA, {user: {
  login: 'chatgpt-codex-connector[bot]', id: 1, type: 'Bot', html_url: 'https://github.com/apps/chatgpt-codex-connector',
}})], SHA), false, 'wrong Codex bot id must fail closed');
assert.equal(review.codexCompleted([codexReview(SHA, {user: {
  login: 'chatgpt-codex-connector', id: 199175422, type: 'Bot', html_url: 'https://github.com/apps/chatgpt-codex-connector',
}})], SHA), false, 'wrong Codex login must fail closed');
assert.equal(review.codexCompleted([codexReview(SHA, {user: {
  login: 'chatgpt-codex-connector[bot]', id: 199175422, type: 'User', html_url: 'https://github.com/apps/chatgpt-codex-connector',
}})], SHA), false, 'non-Bot Codex actor must fail closed');
assert.equal(review.codexCompleted([codexReview('abc')], 'abc'), false,
  'malformed commit ids and requested shas must fail closed');

assert.deepEqual(review.completionStatus({reviewers: ['claude'], comments: [actionsComment(marker)], sha: SHA}), {
  required: ['claude'], completed: ['claude'], missing: [], complete: true,
});
assert.deepEqual(review.completionStatus({
  reviewers: ['codex', 'claude'],
  comments: [actionsComment(marker)],
  reviews: [codexReview()],
  sha: SHA,
}), {
  required: ['codex', 'claude'], completed: ['codex', 'claude'], missing: [], complete: true,
});
assert.deepEqual(review.completionStatus({
  reviewers: ['codex', 'claude'],
  comments: [actionsComment(marker)],
  reviews: [codexReview(OLD_SHA)],
  sha: SHA,
}), {
  required: ['codex', 'claude'], completed: ['claude'], missing: ['codex'], complete: false,
});

console.log('PASS exact-head review completion evidence');
