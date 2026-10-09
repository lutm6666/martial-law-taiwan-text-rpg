'use strict';

const crypto = require('node:crypto');
const {routeIssue} = require('./ai-workflow.routing');

const ROUTING_LABELS = ['ai:claude', 'ai:codex', 'ai:handoff'];
const AREA_LABELS = ['area:logic', 'area:ui', 'area:art', 'area:admin'];
const PLAN_START = '<!-- ai-dispatch:plan:v1';
const PLAN_END = '<!-- /ai-dispatch:plan:v1 -->';

function names(labels) {
  return (labels || []).map(label => typeof label === 'string' ? label : label?.name).filter(Boolean);
}

function changedPaths(files) {
  return [...new Set((files || []).flatMap(file =>
    typeof file === 'string' ? [file] : [file?.filename, file?.previous_filename]
  ).filter(Boolean))];
}

function marker(number) {
  return `${PLAN_START} issue=${number} -->`;
}

function branchName(number, runId, attempt) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid Issue number.');
  if (runId == null) {
    if (attempt != null) throw new Error('Attempt requires a run id.');
    return `ai/issue-${number}`;
  }
  if (!/^\d+$/.test(String(runId))) throw new Error('Invalid run id.');
  const base = `ai/issue-${number}-r${runId}`;
  if (attempt == null) return base;
  if (!Number.isSafeInteger(attempt) || attempt < 2) throw new Error('Invalid run attempt.');
  return `${base}-a${attempt}`;
}

function isRunBranch(number, runId, branch) {
  const base = branchName(number, runId);
  if (branch === base) return true;
  const prefix = `${base}-a`;
  const suffix = String(branch || '').startsWith(prefix) ? String(branch).slice(prefix.length) : '';
  return /^\d+$/.test(suffix) && Number(suffix) >= 2;
}

function completedRunBranch(number, runId, runAttempt, action, branch) {
  const isRerun = Number(runAttempt || 1) > 1;
  if (action === 'opened') {
    return isRerun && (branch === branchName(number) || isRunBranch(number, runId, branch));
  }
  if (action === 'reopened') {
    return isRunBranch(number, runId, branch) || (isRerun && branch === branchName(number));
  }
  return false;
}

function safeTitle(title) {
  return String(title || 'Untitled Issue')
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function issueDigest(issue) {
  return crypto.createHash('sha256')
    .update(JSON.stringify([issue.title || '', issue.body || '']))
    .digest('hex');
}

function planFile(issue, route, branch = branchName(issue.number), retryRunOverride = null) {
  const retry = new RegExp(`^ai/issue-${issue.number}-r(\\d+)(?:-a\\d+)?$`).exec(branch);
  const retryRun = retry ? retry[1] : retryRunOverride == null ? null : String(retryRunOverride);
  if (retryRun !== null && !/^\d+$/.test(retryRun)) throw new Error('Invalid retry run provenance.');
  return JSON.stringify({
    version: 1,
    source_issue: issue.number,
    source_url: issue.html_url,
    title: safeTitle(issue.title),
    title_body_sha256: issueDigest(issue),
    retry_run: retryRun,
    routing: route,
  }, null, 2) + '\n';
}

function managedBody(issue, route, implementationMode = 'work') {
  const title = safeTitle(issue.title).replace(/[\\[\]@<>]/g, character =>
    character === '@' ? '&#64;' : character === '<' ? '&lt;' : character === '>' ? '&gt;' : `\\${character}`);
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(issue.html_url || '')) {
    throw new Error('Issue is missing a canonical GitHub URL.');
  }
  const source = issue.html_url;
  return [
    marker(issue.number),
    '## Source Issue',
    `Refs #${issue.number} — [${title}](${source})`,
    '',
    '## Execution',
    implementationMode === 'actions'
      ? 'Actions model implementation is explicitly enabled; model credentials are required.'
      : 'Work handoff: planning only. No model API credential is needed and no Actions model job will run.',
    ...(implementationMode === 'work' ? [
      `Ask ChatGPT Work: 接手 ${source} 與這個 draft PR，先讀取最新 Issue 與 routing plan，在既有工作分支實作、測試，再提交變更。`,
      'This PR does not automatically start a Work session. Mark it ready only after implementation and validation; existing review/guard rules still apply.',
    ] : []),
    '',
    '## Routing plan',
    `- Primary implementer: **${route.primary || 'needs scope review'}**`,
    `- Route: **${route.agent}**; planning tier: **Tier ${route.tier}**`,
    `- Reason: ${route.reason}`,
    `- Text signals: ${route.signals.length ? route.signals.join(', ') : 'none'}`,
    '',
    'This is a draft work PR. The Issue text and labels are routing hints only. The current main branch policy classifies the actual changed paths, requires `project-validate` and `guard`, and checks exact-head Codex/Claude completion. Control/governance changes also require a direct owner `/ai approve-handoff <full SHA>` comment.',
    PLAN_END,
  ].join('\n');
}

function replaceManagedBody(current, issue, route, implementationMode = 'work') {
  const start = marker(issue.number);
  const begin = String(current || '').indexOf(start);
  const end = String(current || '').indexOf(PLAN_END, begin);
  if (begin < 0 || end < 0) throw new Error('Existing PR has no managed routing section.');
  return String(current).slice(0, begin)
    + managedBody(issue, route, implementationMode)
    + String(current).slice(end + PLAN_END.length);
}

async function canWrite(github, repo, actor) {
  try {
    const {data} = await github.rest.repos.getCollaboratorPermissionLevel({
      ...repo, username: actor,
    });
    return ['admin', 'maintain', 'write'].includes(data.permission);
  } catch (error) {
    if (error.status === 404) return false;
    throw error;
  }
}

async function removeLabel(github, repo, number, name) {
  try {
    await github.rest.issues.removeLabel({...repo, issue_number: number, name});
  } catch (error) {
    if (error.status !== 404) throw error;
  }
}

async function syncManagedLabels(github, repo, number, current, route) {
  const managed = [...ROUTING_LABELS, ...AREA_LABELS];
  const wanted = [`ai:${route.agent}`, route.area];
  for (const label of names(current)) {
    if (managed.includes(label) && !wanted.includes(label)) {
      await removeLabel(github, repo, number, label);
    }
  }
  const missing = wanted.filter(label => !names(current).includes(label));
  if (missing.length) {
    await github.rest.issues.addLabels({...repo, issue_number: number, labels: missing});
  }
}

async function maybeRef(github, repo, branch) {
  try {
    const {data} = await github.rest.git.getRef({...repo, ref: `heads/${branch}`});
    return data;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function maybeFile(github, repo, path, branch) {
  try {
    const {data} = await github.rest.repos.getContent({...repo, path, ref: branch});
    if (Array.isArray(data) || data.type !== 'file') throw new Error('Dispatch plan path is not a file.');
    return data;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

function parsePlan(file) {
  if (!file?.content) return null;
  try {
    const plan = JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'));
    return plan && typeof plan === 'object' ? plan : null;
  } catch {
    return null;
  }
}

function planDigestFrom(file) {
  const plan = parsePlan(file);
  return /^[0-9a-f]{64}$/.test(plan?.title_body_sha256 || '') ? plan.title_body_sha256 : null;
}

function completedRunPlanMatches(number, runId, action, branch, file, expectedDigest) {
  const plan = parsePlan(file);
  if (!plan || plan.version !== 1 || plan.source_issue !== number
    || plan.title_body_sha256 !== expectedDigest) return false;
  if (action === 'reopened' && branch === branchName(number)) {
    return String(plan.retry_run || '') === String(runId);
  }
  return true;
}

async function ensurePlanFile(github, repo, branch, issue, route, retryRunOverride = null) {
  const path = `.ai/dispatch/issue-${issue.number}.json`;
  const current = await maybeFile(github, repo, path, branch);
  const currentPlan = parsePlan(current);
  const preservedRetryRun = branch === branchName(issue.number) && retryRunOverride == null
    ? currentPlan?.retry_run ?? null
    : retryRunOverride;
  const wanted = planFile(issue, route, branch, preservedRetryRun);
  if (current) {
    const actual = Buffer.from(current.content.replace(/\s/g, ''), 'base64').toString('utf8');
    if (actual === wanted) return false;
  }
  await github.rest.repos.createOrUpdateFileContents({
    ...repo, path, branch,
    message: `chore(ai): record routing plan for issue #${issue.number}`,
    content: Buffer.from(wanted).toString('base64'),
    ...(current ? {sha: current.sha} : {}),
  });
  return true;
}

async function mainHead(github, repo) {
  const {data} = await github.rest.git.getRef({...repo, ref: 'heads/main'});
  if (!/^[0-9a-f]{40}$/.test(data.object.sha)) throw new Error('Invalid main SHA.');
  return data.object.sha;
}

async function syncLatestMain(github, repo, branch) {
  if (branch === 'main' || !/^ai\/issue-\d+(?:-r\d+(?:-a\d+)?)?$/.test(branch)) {
    throw new Error('Dispatch may only sync an ai/issue work branch.');
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const sha = await mainHead(github, repo);
    await github.rest.repos.merge({
      ...repo, base: branch, head: sha,
      commit_message: `chore(ai): sync ${branch} with main`,
    });
    if (await mainHead(github, repo) === sha) return sha;
  }
  throw new Error('main advanced during dispatch; retry before opening the PR.');
}

function isDispatchPr(pr, repo, number) {
  return pr.state === 'open'
    && pr.base?.ref === 'main'
    && pr.head?.repo?.full_name === `${repo.owner}/${repo.repo}`
    && new RegExp(`^ai/issue-${number}(?:-r\\d+(?:-a\\d+)?)?$`).test(pr.head?.ref || '')
    && String(pr.body || '').includes(marker(number));
}

async function openPrForIssue(github, repo, number) {
  const prs = await github.paginate(github.rest.pulls.list, {...repo, state: 'open', per_page: 100});
  if (prs.length >= 3000) throw new Error('Open PR listing reached the GitHub cap.');
  return prs.find(pr => isDispatchPr(pr, repo, number)) || null;
}

async function chooseCleanAttemptBranch(github, repo, number, runId, runAttempt) {
  const base = branchName(number, runId);
  for (let offset = 0; offset < 10; offset++) {
    const candidate = offset === 0 && runAttempt === 1
      ? base : branchName(number, runId, runAttempt + offset);
    if (!(await maybeRef(github, repo, candidate))) return {branch: candidate, create: true};
  }
  throw new Error('No clean retry branch available; refusing to overwrite existing refs.');
}

async function recoverPlannedRetryBranch(github, repo, {number, runId, expectedDigest, branch, ref, plan, mainSha}) {
  const data = parsePlan(plan);
  const planPath = `.ai/dispatch/issue-${number}.json`;
  if (!data || data.version !== 1 || data.source_issue !== number
    || String(data.retry_run) !== String(runId)
    || data.title_body_sha256 !== expectedDigest) return false;
  const {data: commit} = await github.rest.repos.getCommit({...repo, ref: ref.object?.sha});
  if (!Array.isArray(commit.parents) || commit.parents.length !== 1) return false;
  const parent = commit.parents[0]?.sha;
  if (!/^[0-9a-f]{40}$/.test(parent || '')) return false;
  const {data: delta} = await github.rest.repos.compareCommits({...repo, base: parent, head: ref.object.sha});
  const paths = changedPaths(delta.files || []);
  if (delta.status !== 'ahead' || delta.ahead_by !== 1 || paths.length !== 1 || paths[0] !== planPath) return false;
  const {data: ancestry} = await github.rest.repos.compareCommits({...repo, base: parent, head: mainSha});
  return ['ahead', 'identical'].includes(ancestry.status);
}

async function chooseBranch(github, repo, number, runId, expectedDigest, runAttempt = 1) {
  const initial = branchName(number);
  const ref = await maybeRef(github, repo, initial);
  if (!ref) return {branch: initial, create: true};
  const prs = await github.paginate(github.rest.pulls.list, {
    ...repo, state: 'all', head: `${repo.owner}:${initial}`, per_page: 100,
  });
  if (prs.some(pr => pr.state === 'open')) {
    throw new Error('Dispatch branch is already used by another open PR.');
  }
  if (prs.some(pr => pr.state === 'closed')) {
    const next = branchName(number, runId);
    const nextRef = await maybeRef(github, repo, next);
    if (!nextRef) {
      return Number(runAttempt || 1) > 1
        ? chooseCleanAttemptBranch(github, repo, number, runId, Number(runAttempt || 1))
        : {branch: next, create: true};
    }
    const nextPrs = await github.paginate(github.rest.pulls.list, {
      ...repo, state: 'all', head: `${repo.owner}:${next}`, per_page: 100,
    });
    if (nextPrs.length >= 3000) throw new Error('Retry PR listing reached the GitHub cap.');
    const nextPlan = await maybeFile(github, repo, `.ai/dispatch/issue-${number}.json`, next);
    const mainSha = await mainHead(github, repo);
    if (!nextPrs.length && !nextPlan && nextRef.object?.sha === mainSha) {
      return {branch: next, create: false};
    }
    if (!nextPrs.length && nextPlan && await recoverPlannedRetryBranch(github, repo, {
      number, runId, expectedDigest, branch: next, ref: nextRef, plan: nextPlan, mainSha,
    })) {
      return {branch: next, create: false};
    }
    if (Number(runAttempt || 1) > 1) {
      return chooseCleanAttemptBranch(github, repo, number, runId, Number(runAttempt || 1));
    }
    throw new Error('Retry branch already exists without a recoverable clean state.');
  }
  const file = await maybeFile(github, repo, `.ai/dispatch/issue-${number}.json`, initial);
  if (!file) {
    const mainSha = await mainHead(github, repo);
    const freshRef = await maybeRef(github, repo, initial);
    if (!prs.length && freshRef?.object?.sha === mainSha) {
      return {branch: initial, create: false};
    }
    throw new Error('Dispatch branch exists without a matching plan or PR.');
  }
  const data = parsePlan(file);
  if (data?.source_issue !== number) throw new Error('Dispatch branch plan does not match Issue.');
  return {branch: initial, create: false};
}

async function dispatch({github, context, core, implementationMode = 'work'}) {
  if (!['work', 'actions'].includes(implementationMode)) throw new Error('Invalid dispatch implementation mode.');
  const actionsImplementation = implementationMode === 'actions';
  const repo = context.repo;
  const number = context.payload.issue?.number;
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Issue event is missing a valid number.');
  const action = context.payload.action;
  const retry = action === 'labeled' && context.payload.label?.name === 'dispatch:retry';
  if (!['opened', 'reopened', 'edited', 'closed', 'labeled'].includes(action)) return {run: false};

  const {data: issue} = await github.rest.issues.get({...repo, issue_number: number});
  if (issue.state === 'closed' && !issue.pull_request) {
    const workPr = await openPrForIssue(github, repo, number);
    if (workPr) await github.rest.pulls.update({...repo, pull_number: workPr.number, state: 'closed'});
    core.info(`Source Issue #${number} closed; its managed work PR is no longer ready for merge.`);
    return {run: false};
  }
  if (action === 'closed') return {run: false};
  if (issue.state !== 'open' || issue.pull_request) return {run: false};
  const {data: repository} = await github.rest.repos.get(repo);
  if (repository.default_branch !== 'main') throw new Error('The dispatch contract requires main as the default branch.');
  const writer = action === 'labeled' && !retry ? false : await canWrite(github, repo, context.actor);
  const isRerun = Number(context.runAttempt || 1) > 1;
  const retryPr = retry ? await openPrForIssue(github, repo, number) : null;
  const retryPlan = retryPr?.draft && (isRunBranch(number, context.runId, retryPr.head?.ref) || retryPr.head?.ref === branchName(number))
    ? await maybeFile(github, repo, `.ai/dispatch/issue-${number}.json`, retryPr.head.ref)
    : null;
  const retryResume = Boolean(retry && isRerun && writer && retryPlan
    && planDigestFrom(retryPlan) === issueDigest(issue));
  if (retry && (!writer || (!names(issue.labels).includes('dispatch:retry') && !retryResume))) {
    throw new Error('Only a repository writer may request implementation retry.');
  }
  const route = routeIssue({title: issue.title, body: issue.body});
  let pr = await openPrForIssue(github, repo, number);
  const hadPr = Boolean(pr);
  const completedSameRun = actionsImplementation && pr && !pr.draft && !retry
    && completedRunBranch(number, context.runId, context.runAttempt, action, pr.head?.ref);
  if (completedSameRun) {
    const existingPlan = await maybeFile(github, repo, `.ai/dispatch/issue-${number}.json`, pr.head.ref);
    if (completedRunPlanMatches(number, context.runId, action, pr.head.ref, existingPlan, issueDigest(issue))) {
      core.info('Dispatch already processed for this workflow run; leaving the managed PR unchanged.');
      return {run: false, branch: pr.head.ref, pr: pr.number, alreadyProcessed: true};
    }
  }
  let discardedDirtyPr = false;
  if (actionsImplementation && pr && ((retry && !retryResume) || action === 'reopened' || (isRerun && action === 'opened') || retryResume)) {
    const files = await github.paginate(github.rest.pulls.listFiles, {
      ...repo, pull_number: pr.number, per_page: 100,
    });
    if (files.length >= 3000) throw new Error('Work PR file listing reached the GitHub cap.');
    const planPath = `.ai/dispatch/issue-${number}.json`;
    if (files.some(file => file.filename !== planPath)) {
      discardedDirtyPr = true;
      pr = null;
    }
  }
  let branch;
  if (pr) {
    branch = pr.head.ref;
    if (!pr.draft) {
      const currentPlan = await maybeFile(github, repo, `.ai/dispatch/issue-${number}.json`, branch);
      if ((actionsImplementation && retry) || action === 'reopened' || planDigestFrom(currentPlan) !== issueDigest(issue)) {
        if (!pr.node_id) throw new Error('Ready PR is missing its GitHub node ID.');
        const result = await github.graphql(`
          mutation($pullRequestId: ID!) {
            convertPullRequestToDraft(input: {pullRequestId: $pullRequestId}) {
              pullRequest { isDraft }
            }
          }
        `, {pullRequestId: pr.node_id});
        if (result?.convertPullRequestToDraft?.pullRequest?.isDraft !== true) {
          throw new Error('Could not return stale work PR to draft.');
        }
        pr.draft = true;
      }
    }
  } else {
    const choice = discardedDirtyPr
      ? await chooseCleanAttemptBranch(github, repo, number, context.runId, Number(context.runAttempt || 1))
      : await chooseBranch(github, repo, number, context.runId, issueDigest(issue), Number(context.runAttempt || 1));
    branch = choice.branch;
    if (choice.create) {
      const sha = await mainHead(github, repo);
      await github.rest.git.createRef({...repo, ref: `refs/heads/${branch}`, sha});
    }
    if (discardedDirtyPr) {
      const old = await openPrForIssue(github, repo, number);
      if (old) await github.rest.pulls.update({...repo, pull_number: old.number, state: 'closed'});
    }
  }

  await syncLatestMain(github, repo, branch);
  await ensurePlanFile(github, repo, branch, issue, route, action === 'reopened' ? context.runId : null);
  await syncLatestMain(github, repo, branch);

  const body = pr ? replaceManagedBody(pr.body, issue, route, implementationMode) : managedBody(issue, route, implementationMode);
  if (pr) {
    if (body !== pr.body) {
      const result = await github.rest.pulls.update({...repo, pull_number: pr.number, body});
      pr = result.data;
    }
  } else {
    const result = await github.rest.pulls.create({
      ...repo, title: `AI dispatch #${number}: ${safeTitle(issue.title)}`,
      body, head: branch, base: 'main', draft: true,
    });
    pr = result.data;
  }

  await syncLatestMain(github, repo, branch);

  await syncManagedLabels(github, repo, number, issue.labels, route);
  await syncManagedLabels(github, repo, pr.number, pr.labels, route);
  if (retry && names(issue.labels).includes('dispatch:retry')) await removeLabel(github, repo, number, 'dispatch:retry');

  const run = actionsImplementation && writer && route.primary !== null
    && (action === 'reopened' || retry || (action === 'opened' && (!hadPr || (isRerun && (pr.head?.ref === branchName(number) || discardedDirtyPr)))))
    && pr.draft === true;
  const result = {
    branch, pr: pr.number, agent: route.primary || '', authorized: writer,
    run, route, digest: issueDigest(issue), implementation_mode: implementationMode,
  };
  for (const key of ['branch', 'pr', 'agent', 'authorized', 'run', 'digest', 'implementation_mode']) {
    core.setOutput(key, String(result[key]));
  }
  core.info(`Issue #${number}: ${route.agent}, Tier ${route.tier}, PR #${pr.number}, implementation=${run}`);
  return result;
}

module.exports = {
  ROUTING_LABELS, AREA_LABELS, PLAN_START, PLAN_END,
  names, changedPaths, marker, branchName, isRunBranch, completedRunBranch, safeTitle, issueDigest,
  planFile, managedBody, replaceManagedBody, syncLatestMain,
  isDispatchPr, parsePlan, completedRunPlanMatches, recoverPlannedRetryBranch, chooseBranch, dispatch,
};