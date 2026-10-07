'use strict';

const ACTIONS_APP_ID = 15368;
const CODEX_APP_ID = 1144995;
const CODEX_BOT_LOGIN = 'chatgpt-codex-connector[bot]';
const CODEX_BOT_ID = 199175422;
const CODEX_APP_URL = 'https://github.com/apps/chatgpt-codex-connector';
const CODEX_SUMMARY_MARKER = '<!-- codex-pull-request-review-summary -->';
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

function isCodexBot(user) {
  return user?.login === CODEX_BOT_LOGIN
    && user?.type === 'Bot'
    && user?.id === CODEX_BOT_ID
    && user?.html_url === CODEX_APP_URL;
}

function isTrustedCodexReview(review) {
  return isCodexBot(review?.user)
    && review?.state === 'COMMENTED'
    && typeof review?.submitted_at === 'string'
    && validSha(review?.commit_id)
    && typeof review?.body === 'string'
    && review.body.includes('### 💡 Codex Review')
    && review.body.includes('Here are some automated review suggestions for this pull request.');
}

function isTrustedCodexSummary(comment) {
  return isCodexBot(comment?.user)
    && Object.prototype.hasOwnProperty.call(comment || {}, 'performed_via_github_app')
    && comment.performed_via_github_app?.id === CODEX_APP_ID
    && comment.performed_via_github_app?.slug === 'chatgpt-codex-connector'
    && firstLine(comment.body) === CODEX_SUMMARY_MARKER
    && typeof comment.created_at === 'string'
    && typeof comment.updated_at === 'string';
}

function codexSummaryCompleted(comments, sha) {
  if (!validSha(sha)) return false;
  return (comments || []).some(comment => {
    if (!isTrustedCodexSummary(comment)) return false;
    const body = comment.body || '';
    const rows = [...body.matchAll(/\|\s*📝\s*\*\*Code Review\*\*\s*\|\s*✅\s*\*\*Completed\*\*[\s\S]*?\|\s*`([0-9a-f]{7,40})`\s*\|/g)];
    return rows.some(match => sha.startsWith(match[1]));
  });
}

function codexCompleted(reviews, comments, sha) {
  if (!validSha(sha)) return false;
  const exactReview = (reviews || []).some(review =>
    isTrustedCodexReview(review)
    && review.commit_id === sha
    && review.body.includes('**Reviewed commit:** `' + sha.slice(0, 10) + '`')
  );
  return exactReview && codexSummaryCompleted(comments, sha);
}

function completionStatus({reviewers = [], comments = [], reviews = [], sha}) {
  const required = [...new Set(reviewers)];
  const completed = [];
  const missing = [];
  for (const reviewer of required) {
    const ok = reviewer === 'claude'
      ? claudeCompleted(comments, sha)
      : reviewer === 'codex'
        ? codexCompleted(reviews, comments, sha)
        : false;
    (ok ? completed : missing).push(reviewer);
  }
  return {required, completed, missing, complete: missing.length === 0};
}

module.exports = {
  ACTIONS_APP_ID,
  CODEX_APP_ID,
  CODEX_BOT_LOGIN,
  CODEX_BOT_ID,
  CODEX_APP_URL,
  CODEX_SUMMARY_MARKER,
  SHA_RE,
  validSha,
  isTrustedActionsComment,
  firstLine,
  hasTrustedFirstLine,
  claudeCompleted,
  isCodexBot,
  isTrustedCodexReview,
  isTrustedCodexSummary,
  codexSummaryCompleted,
  codexCompleted,
  completionStatus,
};
