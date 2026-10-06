'use strict';

const assert = require('node:assert/strict');
const review = require('./ai-workflow.review-completion');

const SHA = '0123456789abcdef0123456789abcdef01234567';

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

assert.equal(review.codexCompleted([], SHA), false,
  'Codex completion remains fail-closed until real managed provenance is observed');

assert.deepEqual(review.completionStatus({reviewers: ['claude'], comments: [actionsComment(marker)], sha: SHA}), {
  required: ['claude'], completed: ['claude'], missing: [], complete: true,
});
assert.deepEqual(review.completionStatus({reviewers: ['codex', 'claude'], comments: [actionsComment(marker)], sha: SHA}), {
  required: ['codex', 'claude'], completed: ['claude'], missing: ['codex'], complete: false,
});

console.log('PASS exact-head review completion evidence');
