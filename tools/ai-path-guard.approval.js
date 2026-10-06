'use strict';

/**
 * Hardened exact-SHA owner approval helpers.
 *
 * A candidate approval must be an owner-authored User issue comment with no
 * GitHub App provenance, no recorded edit, an exact command body, and a
 * creation time at or after GitHub first recorded a workflow run for the
 * current head SHA. Missing or malformed evidence fails closed.
 *
 * performed_via_github_app === null proves only that GitHub did not attribute
 * the comment to a GitHub App. It is not a general proof of physical keyboard
 * input, so the gate also requires exact-SHA freshness and remains scoped to
 * repository control changes.
 */

const SHA_RE = /^[0-9a-f]{40}$/;

function checkApprovalComment(comment, ctx) {
  if (!comment || typeof comment !== 'object') return {ok: false, reason: 'invalid-comment'};
  if (!ctx || typeof ctx !== 'object' || typeof ctx.owner !== 'string' || ctx.owner === '' || !SHA_RE.test(ctx.sha || '')) {
    return {ok: false, reason: 'invalid-context'};
  }

  const user = comment.user || {};
  if (user.login !== ctx.owner) return {ok: false, reason: 'not-owner'};
  if (user.type !== 'User') return {ok: false, reason: 'not-user-account'};
  if (comment.author_association !== 'OWNER') return {ok: false, reason: 'not-owner-association'};

  if (!Object.prototype.hasOwnProperty.call(comment, 'performed_via_github_app')) {
    return {ok: false, reason: 'provenance-field-missing'};
  }
  if (comment.performed_via_github_app !== null) return {ok: false, reason: 'via-github-app'};

  if (typeof comment.created_at !== 'string' || typeof comment.updated_at !== 'string') {
    return {ok: false, reason: 'bad-timestamps'};
  }
  if (comment.updated_at !== comment.created_at) return {ok: false, reason: 'edited'};

  const created = Date.parse(comment.created_at);
  if (!Number.isFinite(created)) return {ok: false, reason: 'bad-timestamps'};
  const headSeen = typeof ctx.headSeenAt === 'string' ? Date.parse(ctx.headSeenAt) : NaN;
  if (!Number.isFinite(headSeen)) return {ok: false, reason: 'head-time-unknown'};
  if (created < headSeen) return {ok: false, reason: 'before-head'};

  const command = '/ai approve-handoff ' + ctx.sha;
  if (typeof comment.body !== 'string' || comment.body !== command) {
    return {ok: false, reason: 'command-mismatch'};
  }
  return {ok: true, reason: 'approved'};
}

function explainApprovals(comments, owner, sha, opts) {
  if (!Array.isArray(comments) || typeof owner !== 'string' || owner === '' || !SHA_RE.test(sha || '')) return [];
  const ctx = {owner, sha, headSeenAt: opts && opts.headSeenAt};
  return comments
    .filter(c => c && typeof c.body === 'string' && c.body.includes('/ai approve-handoff'))
    .map(c => ({id: c.id, ...checkApprovalComment(c, ctx)}));
}

function ownerApproval(comments, _reviews, owner, sha, opts) {
  if (typeof owner !== 'string' || owner === '') return false;
  if (typeof sha !== 'string' || !SHA_RE.test(sha)) return false;
  if (!Array.isArray(comments)) return false;
  const ctx = {owner, sha, headSeenAt: opts && opts.headSeenAt};
  return comments.some(c => checkApprovalComment(c, ctx).ok);
}

async function headSeenAt(github, repo, sha) {
  if (!github || !repo || typeof repo.owner !== 'string' || typeof repo.repo !== 'string' || !SHA_RE.test(sha || '')) return null;
  const runs = await github.paginate(github.rest.actions.listWorkflowRunsForRepo, {
    owner: repo.owner,
    repo: repo.repo,
    head_sha: sha,
    per_page: 100,
  });
  const times = (runs || [])
    .filter(r => r && r.head_sha === sha)
    .map(r => Date.parse(r.created_at))
    .filter(Number.isFinite);
  if (times.length === 0) return null;
  return new Date(Math.min(...times)).toISOString();
}

module.exports = {SHA_RE, ownerApproval, checkApprovalComment, explainApprovals, headSeenAt};
