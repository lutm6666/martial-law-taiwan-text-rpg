'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {isActionsComment} = require('./ai-workflow');
const {reviewPlan} = require('./ai-workflow.review');

const ACTIONS_APP_ID = 15368;
const repoName = context => context.repo.owner + '/' + context.repo.repo;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function prepare({github, context, core}) {
  const manual = context.eventName === 'issue_comment';
  const number = manual ? context.payload.issue.number : context.payload.pull_request.number;
  if (manual && (!context.payload.issue.pull_request || context.payload.comment.user.type !== 'User' || !/^@claude review\s*$/.test(context.payload.comment.body.trim()))) return;

  const {data: permission} = await github.rest.repos.getCollaboratorPermissionLevel({...context.repo, username: context.actor});
  if (!['admin', 'maintain', 'write'].includes(permission.permission)) throw new Error('Claude review requires a repository writer.');

  const {data: pr} = await github.rest.pulls.get({...context.repo, pull_number: number});
  if (pr.state !== 'open' || pr.draft || pr.head.repo?.full_name !== repoName(context)) return;
  if (pr.base.ref !== context.payload.repository.default_branch) throw new Error('Claude receiver only reviews PRs targeting the default branch.');

  const files = await github.paginate(github.rest.pulls.listFiles, {...context.repo, pull_number: number, per_page: 100});
  if (files.length >= 3000) throw new Error('PR file list may be truncated; review manually.');
  const plan = reviewPlan({pr, files});
  if (!manual && !plan.reviewers.includes('claude')) {
    core.info(plan.name + ': Claude review is not required for this head.');
    return;
  }

  const marker = '<!-- claude-review:completed:' + pr.head.sha + ' -->';
  const comments = await github.paginate(github.rest.issues.listComments, {...context.repo, issue_number: number, per_page: 100});
  if (!manual && comments.some(c => isActionsComment(c) && c.body.includes(marker))) {
    core.info('Claude review already completed for this SHA.');
    return;
  }

  const snapshot = JSON.stringify({
    number,
    sha: pr.head.sha,
    review: {
      tier: plan.tier,
      name: plan.name,
      reasons: plan.reasons,
      routing_hint: plan.routingHint,
      provenance: plan.provenance,
    },
    files: files.map(f => ({filename: f.filename, previous_filename: f.previous_filename, status: f.status, patch: f.patch || null}))
  });
  if (snapshot.length > 150000) throw new Error('PR exceeds review snapshot limit; split or review manually.');
  fs.writeFileSync(path.join(process.env.GITHUB_WORKSPACE, 'claude-review-input.json'), snapshot);

  core.setOutput('number', String(number));
  core.setOutput('sha', pr.head.sha);
  core.setOutput('base', pr.base.sha);
  core.setOutput('tier', String(plan.tier));
  core.setOutput('tier_name', plan.name);
  core.setOutput('run', 'true');
}

async function nativeGuardForHead({github, context, sha}) {
  const guards = await github.paginate(github.rest.checks.listForRef, {
    ...context.repo,
    ref: sha,
    check_name: 'guard',
    per_page: 100,
  });
  const jobPrefix = 'https://github.com/' + repoName(context) + '/actions/runs/';
  return guards
    .filter(check => check.name === 'guard'
      && check.head_sha === sha
      && check.app?.id === ACTIONS_APP_ID
      && check.conclusion !== 'skipped'
      && check.details_url?.startsWith(jobPrefix)
      && /\/job\/\d+$/.test(check.details_url))
    .sort((a, b) => b.id - a.id)[0] || null;
}

async function rerunGuardAfterCompletion({github, context, core, number, sha}) {
  const {data: pr} = await github.rest.pulls.get({...context.repo, pull_number: number});
  if (pr.state !== 'open' || pr.head.sha !== sha || pr.draft) throw new Error('PR changed before guard rerun; stale completion will not unlock another head.');

  let guard = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    guard = await nativeGuardForHead({github, context, sha});
    if (guard?.status === 'completed') break;
    if (attempt < 11) await sleep(5000);
  }

  if (!guard) throw new Error('No native PR guard exists for the reviewed head; completion remains fail closed.');
  if (guard.status !== 'completed') throw new Error('Native PR guard did not finish in time for a completion rerun.');
  if (guard.conclusion === 'success') {
    core.info('Native guard is already successful for the reviewed head.');
    return false;
  }

  const {data: latest} = await github.rest.pulls.get({...context.repo, pull_number: number});
  if (latest.state !== 'open' || latest.head.sha !== sha || latest.draft) throw new Error('PR changed before native guard rerun; retry against the current head.');

  const jobId = Number(guard.details_url.split('/').pop());
  await github.request('POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun', {...context.repo, job_id: jobId});
  core.info('Native guard rerun requested after verified Claude completion.');
  return true;
}

async function publish({github, context, core, number, sha, executionFile}) {
  const records = JSON.parse(fs.readFileSync(executionFile, 'utf8'));
  const result = (Array.isArray(records) ? records : [records]).findLast(record => record.type === 'result');
  if (!result || result.is_error || (result.subtype && result.subtype !== 'success')) throw new Error('Claude did not complete successfully.');
  const review = result.structured_output;
  if (!review || review.sha !== sha || typeof review.summary !== 'string' || !review.summary.trim()) throw new Error('Claude output is missing a substantive review of the requested SHA.');

  const {data: pr} = await github.rest.pulls.get({...context.repo, pull_number: number});
  if (pr.state !== 'open' || pr.head.sha !== sha || pr.draft) throw new Error('PR changed during Claude review; stale result will not be published as completed.');

  const body = '<!-- claude-review:completed:' + sha + ' -->\n**Claude review completed**\n\nHead: `' + sha + '`\nRun: https://github.com/' + repoName(context) + '/actions/runs/' + context.runId + '\n\n' + review.summary;
  if (body.length > 60000) throw new Error('Claude review output exceeds comment limit.');
  await github.rest.issues.createComment({...context.repo, issue_number: number, body});
  core.info('Published Claude review for the current head. This is feedback, not owner approval.');
  await rerunGuardAfterCompletion({github, context, core, number, sha});
}

module.exports = {prepare, nativeGuardForHead, rerunGuardAfterCompletion, publish};
