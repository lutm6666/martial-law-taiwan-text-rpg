'use strict';

const ACTIONS_APP_ID = 15368;
const CODEX_BOT_LOGIN = 'chatgpt-codex-connector[bot]';
const CODEX_BOT_ID = 199175422;
const CODEX_APP_URL = 'https://github.com/apps/chatgpt-codex-connector';
const SHA_RE = /^[0-9a-f]{40}$/;

function validSha(sha) {
  return typeof sha === 'string' && SHA_RE.test(sha);
}

function isTrustedActionsComment(comment) {
  return comment?.user?.login === 'github-actions[bot]'
    && comment?.user?.type === 'Bot'
    && Object.prototype.hasOwnProperty.call(comment || {}, 'performed_via_github_app')
    && comment.performed_via_github_app?.id === ACTIONS_APP_ID
    && typeof comment.created_at === 'string'
    && typeof comment.updated_at === 'string'
    && comment.created_at === comment.updated_at;
}

function firstLine(body) {
  if (typeof body !== 'string') return null;
  const index = body.indexOf('\n');
  return index === -1 ? body : body.slice(0, index);
}

function hasTrustedFirstLine(comments, line) {
  return (comments || []).some(comment =>
    isTrustedActionsComment(comment)
    && firstLine(comment.body) === line
  );
}

function claudeCompleted(comments, sha) {
  if (!validSha(sha)) return false;
  return hasTrustedFirstLine(comments, '<!-- claude-review:completed:' + sha + ' -->');
}

function isTrustedCodexReview(review) {
  return review?.user?.login === CODEX_BOT_LOGIN
    && review?.user?.type === 'Bot'
    && review?.user?.id === CODEX_BOT_ID
    && review?.user?.html_url === CODEX_APP_URL
    && review?.state === 'COMMENTED'
    && typeof review?.submitted_at === 'string'
    && validSha(review?.commit_id);
}

function codexCompleted(reviews, sha) {
  if (!validSha(sha)) return false;
  return (reviews || []).some(review =>
    isTrustedCodexReview(review) && review.commit_id === sha
  );
}

function completionStatus({reviewers = [], comments = [], reviews = [], sha}) {
  const required = [...new Set(reviewers)];
  const completed = [];
  const missing = [];
  for (const reviewer of required) {
    const ok = reviewer === 'claude'
      ? claudeCompleted(comments, sha)
      : reviewer === 'codex'
        ? codexCompleted(reviews, sha)
        : false;
    (ok ? completed : missing).push(reviewer);
  }
  return {required, completed, missing, complete: missing.length === 0};
}

module.exports = {
  ACTIONS_APP_ID,
  CODEX_BOT_LOGIN,
  CODEX_BOT_ID,
  CODEX_APP_URL,
  SHA_RE,
  validSha,
  isTrustedActionsComment,
  firstLine,
  hasTrustedFirstLine,
  claudeCompleted,
  isTrustedCodexReview,
  codexCompleted,
  completionStatus,
};
