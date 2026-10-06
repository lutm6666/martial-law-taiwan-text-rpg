'use strict';

const policy = require('./ai-workflow.js');
const approval = require('./ai-path-guard-approval.js');
const ACTIONS_APP_ID = policy.ACTIONS_APP_ID;

async function commentsFor(github, repo, number) {
  return github.paginate(github.rest.issues.listComments, {...repo, issue_number: number, per_page: 100});
}

async function runGuard({github, context, core, number, expectedBaseSha}) {
  const repo = context.repo;
  const {data: pr} = await github.rest.pulls.get({...repo, pull_number: number});
  if (pr.state !== 'open') { core.info('Closed PR: no guard update.'); return; }

  const sha = pr.head.sha;
  const externalId = 'ai-path-guard:' + number + ':' + sha;
  const existing = await github.paginate(github.rest.checks.listForRef, {
    ...repo, ref: sha, check_name: 'ai-ownership-policy', per_page: 100
  });
  let check = existing.find(c => c.external_id === externalId && c.app?.id === ACTIONS_APP_ID);
  const details_url = 'https://github.com/' + repo.owner + '/' + repo.repo + '/actions/runs/' + context.runId;
  if (check) await github.rest.checks.update({...repo, check_run_id: check.id, status: 'in_progress', details_url});
  else ({data: check} = await github.rest.checks.create({
    ...repo, name: 'ai-ownership-policy', head_sha: sha, status: 'in_progress', external_id: externalId, details_url
  }));

  let conclusion = 'success';
  let summary;
  let rawComments = [];
  let seenAt = null;
  let seenAtError = null;

  try {
    if (pr.base.sha !== expectedBaseSha) throw new Error('Base changed during checkout; retry to load the current trusted policy.');

    const files = await github.paginate(github.rest.pulls.listFiles, {...repo, pull_number: number, per_page: 100});
    rawComments = await commentsFor(github, repo, number);

    try {
      seenAt = await approval.headSeenAt(github, repo, sha);
    } catch (error) {
      seenAtError = error;
      core.info('Head-seen lookup failed; owner approval will fail closed: ' + error.message);
    }

    const vettedComments = rawComments.filter(c => approval.checkApprovalComment(c, {
      owner: repo.owner,
      sha,
      headSeenAt: seenAt,
    }).ok);

    // Owner PR reviews are intentionally not an approval path. The legacy
    // evaluator receives only comments that passed the hardened gate and an
    // empty review list.
    const result = policy.evaluateGuard({
      pr,
      files,
      comments: vettedComments,
      reviews: [],
      owner: repo.owner,
    });

    summary = 'Trusted base `' + expectedBaseSha + '` checked head `' + sha + '`.\n\nAgent: ' + result.agent + '\n\n' + result.messages.join('\n');
  } catch (error) {
    conclusion = 'failure';
    summary = error.message;

    if (/^Owner confirmation is required/.test(summary)) {
      const reasons = approval.explainApprovals(rawComments, repo.owner, sha, {headSeenAt: seenAt});
      const diagnostics = [];
      if (seenAtError) diagnostics.push('Head-seen lookup error: ' + seenAtError.message);
      else if (!seenAt) diagnostics.push('No workflow run for the current head SHA was available; approval remains closed.');
      if (reasons.length) diagnostics.push('Approval candidates: ' + reasons.map(r => '#' + r.id + '=' + r.reason).join(', '));
      diagnostics.push('Only a direct, unedited owner issue comment with no GitHub App provenance counts. PR reviews and App-mediated comments do not count.');
      diagnostics.push('Required command: /ai approve-handoff ' + sha);
      summary += '\n\n' + diagnostics.join('\n');
    }
  }

  await github.rest.checks.update({
    ...repo,
    check_run_id: check.id,
    status: 'completed',
    conclusion,
    completed_at: new Date().toISOString(),
    output: {title: 'AI ownership guard: ' + conclusion, summary: summary.slice(0, 60000)},
  });

  // Actions-created check conclusions are immutable through the Checks API.
  // A comment run attaches to main; request a native job rerun on the PR head.
  if (context.eventName === 'issue_comment') {
    const guards = await github.paginate(github.rest.checks.listForRef, {
      ...repo, ref: sha, check_name: 'guard', per_page: 100
    });
    const jobUrl = 'https://github.com/' + repo.owner + '/' + repo.repo + '/actions/runs/';
    const native = guards
      .filter(c => c.name === 'guard' && c.head_sha === sha && c.app?.id === ACTIONS_APP_ID && c.conclusion !== 'skipped' && c.details_url?.startsWith(jobUrl) && /\/job\/\d+$/.test(c.details_url))
      .sort((a, b) => b.id - a.id)[0];

    if (!native) throw new Error('No native PR guard to rerun; trigger a PR guard event.');
    if (native.status !== 'completed') core.info('Native guard is already pending/running; no duplicate rerun.');
    else if (native.conclusion !== conclusion) {
      const {data: latest} = await github.rest.pulls.get({...repo, pull_number: number});
      if (latest.state !== 'open' || latest.head.sha !== sha) throw new Error('PR changed before native guard rerun; retry the current head.');
      const job_id = Number(native.details_url.split('/').pop());
      await github.request('POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun', {...repo, job_id});
      core.info('Native guard rerun requested. Required guard changes only after that job completes.');
    } else core.info('Native guard already matches the current policy conclusion.');
  }

  if (conclusion === 'failure') core.setFailed(summary);
}

module.exports = {runGuard};
