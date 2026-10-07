'use strict';

const ACTIONS_APP_ID = 15368;
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

// Managed Codex Cloud completion remains intentionally fail-closed until this
// repository produces an observable exact-head review/check whose GitHub App
// provenance can be locked by regression tests. A request marker is never a
// completion marker.
function codexCompleted() {
  return false;
}

function completionStatus({reviewers = [], comments = [], sha}) {
  const required = [...new Set(reviewers)];
  const completed = [];
  const missing = [];
  for (const reviewer of required) {
    const ok = reviewer === 'claude'
      ? claudeCompleted(comments, sha)
      : reviewer === 'codex'
        ? codexCompleted(comments, sha)
        : false;
    (ok ? completed : missing).push(reviewer);
  }
  return {required, completed, missing, complete: missing.length === 0};
}

// No-op probe note: this commit exists only to validate Codex's per-push review trigger.

module.exports = {
  ACTIONS_APP_ID,
  SHA_RE,
  validSha,
  isTrustedActionsComment,
  firstLine,
  hasTrustedFirstLine,
  claudeCompleted,
  codexCompleted,
  completionStatus,
};
