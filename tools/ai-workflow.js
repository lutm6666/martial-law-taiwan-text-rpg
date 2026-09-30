'use strict';
const crypto = require('node:crypto');
const ACTIONS_APP_ID = 15368;
const DISPATCH_MARKER = '<!-- ai-dispatch:v2 -->';
const OWNED_AREAS = ['area:logic', 'area:ui', 'area:art', 'area:admin'];
const ROUTING_LABELS = ['ai:claude', 'ai:codex', 'ai:handoff'];
const CONTROL_PATHS = [/^\.github\/workflows\//, /^\.github\/CODEOWNERS$/,
  /^tools\/(ai-workflow|ai-path-guard|test-ai-workflow)\./, /^(AI_WORKFLOW|AGENTS|CLAUDE)\.md$/];
const LOGIC_PATHS = [/^case.*-(canon|engine)\.js$/, /^CASE.*_(DESIGN|IMPLEMENTATION)\.md$/, /^tools\/(test-|validate-)/];
const UI_PATHS = [/^index\.html$/, /^case.*-ui\.js$/, /\.(css|scss)$/i, /^assets\/.*\.html$/];
const AREAS = new Map([
  ['Canon / Logic / State / Tests', ['codex', 'area:logic']], ['Canon / Logic / State', ['codex', 'area:logic']],
  ['Save / Migration', ['codex', 'area:logic']], ['CI / Tests', ['codex', 'area:logic']],
  ['Frontend / UI / Responsive / Accessibility', ['claude', 'area:ui']], ['Frontend / UI', ['claude', 'area:ui']],
  ['Art / Assets', ['handoff', 'area:art']], ['Mixed / Cross-boundary', ['handoff', 'area:logic']],
  ['Repository admin / Settings', ['handoff', 'area:admin']], ['Unsure', ['handoff', 'area:logic']]
]);
function names(labels) { return (labels || []).map(l => typeof l === 'string' ? l : l.name); }
function matches(file, rules) { return rules.some(rule => rule.test(file)); }
function changedPaths(files) {
  return [...new Set(files.flatMap(f => typeof f === 'string' ? [f] : [f.filename, f.previous_filename]).filter(Boolean))];
}
function field(body, name) {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n'), sections = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '### ' + name) continue;
    const text = [];
    while (++i < lines.length && !/^#{1,6}\s/.test(lines[i])) text.push(lines[i]);
    i--; sections.push(text.join('\n').trim());
  }
  if (sections.length > 1) throw new Error('Duplicate ' + name + ' field; use the Issue template once.');
  return sections[0] || '';
}
function routeIssue(body) {
  const workstream = field(body, 'Workstream'), area = field(body, 'Area');
  if (workstream && area && workstream !== area) return {agent: 'handoff', area: 'area:logic', reason: 'Conflicting classification fields; owner confirmation required.'};
  const selected = workstream || area, match = AREAS.get(selected);
  if (!match) return {agent: 'handoff', area: 'area:logic', reason: 'Missing or unknown Workstream/Area; fill the template before implementation.'};
  return {agent: match[0], area: match[1], reason: 'Selected field: ' + selected};
}
function branchAgent(ref) {
  if (/^(claude\/|ai\/claude-)/.test(ref || '')) return 'claude';
  if (/^(codex\/|ai\/codex-)/.test(ref || '')) return 'codex';
  if (/^handoff\//.test(ref || '')) return 'handoff';
  return null;
}
function classifyPr(pr) {
  const routing = names(pr.labels).filter(l => ROUTING_LABELS.includes(l));
  if (routing.length > 1) throw new Error('Conflicting AI labels: ' + routing.join(', ') + '. Keep exactly one ownership label.');
  const label = routing[0] && routing[0].slice(3), branch = branchAgent(pr.head.ref);
  if (label && branch && label !== branch && label !== 'handoff') throw new Error('Branch ownership conflicts with AI label. Use an explicit ai:handoff for a reviewed transfer.');
  return label || branch || 'human';
}
function isActionsComment(c) {
  return c.user?.login === 'github-actions[bot]' && c.user?.type === 'Bot' && c.performed_via_github_app?.id === ACTIONS_APP_ID;
}
async function canWrite(github, repo, actor) {
  const {data} = await github.rest.repos.getCollaboratorPermissionLevel({...repo, username: actor});
  return ['admin', 'maintain', 'write'].includes(data.permission);
}
async function removeLabel(github, repo, number, name) {
  try { await github.rest.issues.removeLabel({...repo, issue_number: number, name}); }
  catch (error) { if (error.status !== 404) throw error; }
}
async function syncManagedLabels(github, repo, number, current, managed, wanted) {
  for (const label of names(current)) if (managed.includes(label) && !wanted.includes(label)) await removeLabel(github, repo, number, label);
  const missing = wanted.filter(label => !names(current).includes(label));
  if (missing.length) await github.rest.issues.addLabels({...repo, issue_number: number, labels: missing});
}
async function commentsFor(github, repo, number) {
  return github.paginate(github.rest.issues.listComments, {...repo, issue_number: number, per_page: 100});
}
async function dispatch({github, context, core}) {
  const repo = context.repo, number = context.payload.issue.number;
  const {data: issue} = await github.rest.issues.get({...repo, issue_number: number});
  const labels = names(issue.labels);
  if (issue.state !== 'open' || issue.pull_request || !labels.includes('dispatch:ready')) { core.info('Issue is closed, is a PR, or is not dispatch:ready.'); return; }
  const writer = await canWrite(github, repo, context.actor);
  const retry = context.payload.action === 'labeled' && context.payload.label?.name === 'dispatch:retry' && labels.includes('dispatch:retry');
  if (retry && !writer) throw new Error('Only a repository writer may retry dispatch.');
  const route = routeIssue(issue.body);
  if (!writer) { route.agent = 'handoff'; route.reason = 'Repository writer must confirm scope before implementation.'; }
  const key = crypto.createHash('sha256').update(JSON.stringify([issue.body || '', route.agent, route.area, writer])).digest('hex');
  const marker = '<!-- ai-dispatch-key:' + key + ' -->';
  const comments = await commentsFor(github, repo, number);
  const record = [...comments].reverse().find(c => isActionsComment(c) && (c.body || '').includes(DISPATCH_MARKER));
  const legacy = [...comments].reverse().find(c => isActionsComment(c) && (c.body || '').includes('<!-- ai-dispatch:v1 -->'));
  await syncManagedLabels(github, repo, number, issue.labels, [...ROUTING_LABELS, ...OWNED_AREAS], [route.area, 'ai:' + route.agent]);
  if (record && record.body.includes(marker) && !retry) { core.info('Current routing revision is already recorded; managed labels reconciled.'); return; }
  const entry = route.agent === 'codex'
    ? 'Start a Codex Cloud task for this Issue manually. GitHub PR review is verified; Issue-to-implementation launch is not verified.'
    : route.agent === 'claude'
      ? 'Start a Claude task manually after confirming the receiver workflow and credentials. A routing label is not a receiver acknowledgement.'
      : 'Owner must confirm classification and the handoff scope before implementation. No implementation task has been launched.';
  const body = DISPATCH_MARKER + '\n' + marker + '\n**Route prepared:** `' + route.agent + '`\n\n' + route.reason + '\n\n' + entry +
    '\n\nRead [AI_WORKFLOW.md](https://github.com/' + repo.owner + '/' + repo.repo + '/blob/main/AI_WORKFLOW.md).';
  const previous = record || legacy;
  if (previous) await github.rest.issues.updateComment({...repo, comment_id: previous.id, body});
  else await github.rest.issues.createComment({...repo, issue_number: number, body});
  if (retry) await removeLabel(github, repo, number, 'dispatch:retry');
}
async function crossReview({github, context, core}) {
  const repo = context.repo, number = context.payload.pull_request.number;
  const {data: pr} = await github.rest.pulls.get({...repo, pull_number: number});
  if (pr.state !== 'open' || pr.draft || pr.head.repo?.full_name !== repo.owner + '/' + repo.repo) { core.info('Closed, draft, or fork PR: no automatic review request.'); return; }
  let agent = classifyPr(pr);
  if (agent === 'human') {
    const files = changedPaths(await github.paginate(github.rest.pulls.listFiles, {...repo, pull_number: number, per_page: 100}));
    const logic = files.some(f => matches(f, [...LOGIC_PATHS, ...CONTROL_PATHS])), ui = files.some(f => matches(f, UI_PATHS));
    agent = logic && ui ? 'handoff' : logic ? 'codex' : ui ? 'claude' : 'human';
  }
  const requests = [];
  if (agent === 'claude' || agent === 'handoff') requests.push({agent: 'codex', label: 'needs:codex-review', text: '@codex review Focus on Canon/evidence boundaries, state transitions, saves, spoilers, and regression coverage.'});
  if (agent === 'codex' || agent === 'handoff') requests.push({agent: 'claude', label: 'needs:claude-review', text: '@claude Review this PR without implementing changes. Focus on mobile UX, readability, overflow, tap targets, and spoiler boundaries. Receipt/completion must be verified separately.'});
  const retry = context.payload.action === 'labeled' && context.payload.label?.name === 'review:retry' && names(pr.labels).includes('review:retry');
  if (retry && !await canWrite(github, repo, context.actor)) throw new Error('Only a repository writer may retry reviews.');
  await syncManagedLabels(github, repo, number, pr.labels, ['needs:codex-review', 'needs:claude-review'], requests.map(r => r.label));
  const comments = await commentsFor(github, repo, number);
  for (const request of requests) {
    const prefix = '<!-- cross-review:v2:' + request.agent + ':' + pr.head.sha + ':';
    const marker = prefix + (retry ? 'retry-' + context.runId : 'initial') + ' -->';
    const exists = comments.some(c => isActionsComment(c) && (retry ? (c.body || '').includes(marker) : (c.body || '').includes(prefix) || (c.body || '').includes('<!-- cross-review:' + request.agent + ':' + pr.head.sha + ' -->')));
    if (exists) continue;
    const {data: latest} = await github.rest.pulls.get({...repo, pull_number: number});
    if (latest.head.sha !== pr.head.sha || latest.state !== 'open' || latest.draft) throw new Error('PR changed while preparing reviews; retry against the current head.');
    const body = marker + '\n' + request.text + '\n\n**Requested commit:** `' + pr.head.sha + '`\n**Status:** request sent; receiver acknowledgement and completion are not implied.\n\nShared rules: `AI_WORKFLOW.md`';
    const {data: created} = await github.rest.issues.createComment({...repo, issue_number: number, body});
    comments.push(created);
  }
  if (retry) await removeLabel(github, repo, number, 'review:retry');
}
function ownerApproval(comments, reviews, owner, sha) {
  const command = '/ai approve-handoff ' + sha;
  if (comments.some(c => c.user?.login === owner && c.user?.type === 'User' && (c.body || '').trim() === command)) return true;
  const latest = new Map();
  for (const review of [...reviews].sort((a, b) => (a.id || 0) - (b.id || 0))) {
    if (review.state !== 'PENDING' && review.user?.login === owner && review.user?.type === 'User') latest.set(owner, review);
  }
  const review = latest.get(owner);
  return review?.state === 'APPROVED' && review.commit_id === sha;
}
function evaluateGuard({pr, files, comments = [], reviews = [], owner}) {
  const agent = classifyPr(pr), paths = changedPaths(files), messages = [];
  const protectedPaths = paths.filter(f => matches(f, [...LOGIC_PATHS, ...CONTROL_PATHS]));
  if (agent === 'claude' && protectedPaths.length) throw new Error('Claude crossed protected logic/CI boundaries: ' + protectedPaths.join(', '));
  if (!paths.length) messages.push('No changed files; ownership check has no paths to evaluate.');
  const ui = paths.filter(f => matches(f, UI_PATHS)), control = paths.filter(f => matches(f, CONTROL_PATHS));
  const needsOwner = agent === 'handoff' || (agent === 'codex' && ui.length > 0) || control.length > 0;
  if (needsOwner && !ownerApproval(comments, reviews, owner, pr.head.sha)) throw new Error('Owner confirmation is required for handoff, Codex/UI, or guard/control changes at this head. After reviewing, approve this SHA or comment exactly: /ai approve-handoff ' + pr.head.sha);
  if (agent === 'human') messages.push('Human-owned PR: agent boundaries do not infer the author identity.');
  if (needsOwner) messages.push('Owner confirmed the current SHA; AI review completion is still tracked separately.');
  return {agent, paths, messages};
}
async function runGuard({github, context, core, number, expectedBaseSha}) {
  const repo = context.repo;
  const {data: pr} = await github.rest.pulls.get({...repo, pull_number: number});
  if (pr.state !== 'open') { core.info('Closed PR: no guard update.'); return; }
  const sha = pr.head.sha, externalId = 'ai-path-guard:' + number + ':' + sha;
  const existing = await github.paginate(github.rest.checks.listForRef, {...repo, ref: sha, check_name: 'ai-ownership-policy', per_page: 100});
  let check = existing.find(c => c.external_id === externalId && c.app?.id === ACTIONS_APP_ID);
  const details_url = 'https://github.com/' + repo.owner + '/' + repo.repo + '/actions/runs/' + context.runId;
  if (check) await github.rest.checks.update({...repo, check_run_id: check.id, status: 'in_progress', details_url});
  else ({data: check} = await github.rest.checks.create({...repo, name: 'ai-ownership-policy', head_sha: sha, status: 'in_progress', external_id: externalId, details_url}));
  let conclusion = 'success', summary;
  try {
    if (pr.base.sha !== expectedBaseSha) throw new Error('Base changed during checkout; retry to load the current trusted policy.');
    const files = await github.paginate(github.rest.pulls.listFiles, {...repo, pull_number: number, per_page: 100});
    const comments = await commentsFor(github, repo, number);
    const reviews = await github.paginate(github.rest.pulls.listReviews, {...repo, pull_number: number, per_page: 100});
    const result = evaluateGuard({pr, files, comments, reviews, owner: repo.owner});
    summary = 'Trusted base `' + expectedBaseSha + '` checked head `' + sha + '`.\n\nAgent: ' + result.agent + '\n\n' + result.messages.join('\n');
  } catch (error) { conclusion = 'failure'; summary = error.message; }
  await github.rest.checks.update({...repo, check_run_id: check.id, status: 'completed', conclusion, completed_at: new Date().toISOString(), output: {title: 'AI ownership guard: ' + conclusion, summary: summary.slice(0, 60000)}});
  // Actions-created check conclusions are immutable through the Checks API.
  // A comment run attaches to main; request a native job rerun on the PR head.
  if (context.eventName === 'issue_comment') {
    const guards = await github.paginate(github.rest.checks.listForRef, {...repo, ref: sha, check_name: 'guard', per_page: 100});
    const jobUrl = 'https://github.com/' + repo.owner + '/' + repo.repo + '/actions/runs/';
    const native = guards.filter(c => c.name === 'guard' && c.head_sha === sha && c.app?.id === ACTIONS_APP_ID && c.conclusion !== 'skipped' && c.details_url?.startsWith(jobUrl) && /\/job\/\d+$/.test(c.details_url))
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
module.exports = {ACTIONS_APP_ID, routeIssue, field, changedPaths, classifyPr, isActionsComment, ownerApproval, evaluateGuard, dispatch, crossReview, runGuard};
