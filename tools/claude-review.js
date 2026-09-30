'use strict';
const fs = require('node:fs');
const {classifyPr, isActionsComment} = require('./ai-workflow');
const repoName = context => context.repo.owner + '/' + context.repo.repo;
async function prepare({github, context, core}) {
  const manual = context.eventName === 'issue_comment';
  const number = manual ? context.payload.issue.number : context.payload.pull_request.number;
  if (manual && (!context.payload.issue.pull_request || context.payload.comment.user.type !== 'User' || !/^@claude review\s*$/.test(context.payload.comment.body.trim()))) return;
  const {data: permission} = await github.rest.repos.getCollaboratorPermissionLevel({...context.repo, username: context.actor});
  if (!['admin', 'maintain', 'write'].includes(permission.permission)) throw new Error('Claude review requires a repository writer.');
  const {data: pr} = await github.rest.pulls.get({...context.repo, pull_number: number});
  if (pr.state !== 'open' || pr.draft || pr.head.repo?.full_name !== repoName(context)) return;
  if (pr.base.ref !== context.payload.repository.default_branch) throw new Error('Claude receiver only reviews PRs targeting the default branch.');
  if (!manual && !['codex','handoff'].includes(classifyPr(pr))) return;
  const marker = '<!-- claude-review:completed:' + pr.head.sha + ' -->';
  const comments = await github.paginate(github.rest.issues.listComments, {...context.repo, issue_number: number, per_page: 100});
  if (!manual && comments.some(c => isActionsComment(c) && c.body.includes(marker))) {core.info('Claude review already completed for this SHA.'); return;}
  const files = await github.paginate(github.rest.pulls.listFiles, {...context.repo, pull_number: number, per_page: 100});
  if (files.length >= 3000) throw new Error('PR file list may be truncated; review manually.');
  const snapshot = JSON.stringify({number, sha: pr.head.sha, files: files.map(f => ({filename:f.filename, previous_filename:f.previous_filename, status:f.status, patch:f.patch || null}))});
  if (snapshot.length > 150000) throw new Error('PR exceeds review snapshot limit; split or review manually.');
  fs.writeFileSync('/tmp/claude-review-input.json', snapshot);
  core.setOutput('number', String(number)); core.setOutput('sha', pr.head.sha); core.setOutput('base', pr.base.sha); core.setOutput('run', 'true');
}
async function publish({github, context, core, number, sha, executionFile}) {
  const records = JSON.parse(fs.readFileSync(executionFile, 'utf8'));
  const result = (Array.isArray(records) ? records : [records]).findLast(r => r.type === 'result');
  if (!result || result.is_error || (result.subtype && result.subtype !== 'success')) throw new Error('Claude did not complete successfully.');
  const review = result.structured_output;
  if (!review || review.sha !== sha || typeof review.summary !== 'string' || !review.summary.trim()) throw new Error('Claude output is missing a substantive review of the requested SHA.');
  const {data: pr} = await github.rest.pulls.get({...context.repo, pull_number: number});
  if (pr.state !== 'open' || pr.head.sha !== sha || pr.draft) throw new Error('PR changed during Claude review; stale result will not be published as completed.');
  const body = '<!-- claude-review:completed:' + sha + ' -->\n**Claude review completed**\n\nHead: `' + sha + '`\nRun: https://github.com/' + repoName(context) + '/actions/runs/' + context.runId + '\n\n' + review.summary;
  if (body.length > 60000) throw new Error('Claude review output exceeds comment limit.');
  await github.rest.issues.createComment({...context.repo, issue_number: number, body});
  core.info('Published Claude review for the current head. This is feedback, not owner approval.');
}
module.exports = {prepare, publish};
