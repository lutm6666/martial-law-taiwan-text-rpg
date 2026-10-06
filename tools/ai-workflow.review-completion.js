'use strict';

const ACTIONS_APP_ID = 15368;

function isTrustedActionsComment(comment) {
  return comment?.user?.login === 'github-actions[bot]'
    && comment?.user?.type === 'Bot'
    && comment?.performed_via_github_app?.id === ACTIONS_APP_ID;
}

function hasExactMarker(comments, marker) {
  return (comments || []).some(comment =>
    isTrustedActionsComment(comment)
    && typeof comment.body === 'string'
    && comment.body.includes(marker)
  );
}

function claudeCompleted(comments, sha) {
  return hasExactMarker(comments, '<!-- claude-review:completed:' + sha + ' -->');
}

// Codex Cloud completion provenance is intentionally fail-closed until the
// repository's managed @codex review receiver is observed on this PR and its
// exact GitHub payload shape is locked by regression tests.
function codexCompleted() {
  return false;
}

module.exports = {ACTIONS_APP_ID, isTrustedActionsComment, hasExactMarker, claudeCompleted, codexCompleted};
