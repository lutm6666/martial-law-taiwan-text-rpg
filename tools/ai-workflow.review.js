'use strict';

const {classifyPr, changedPaths, isActionsComment} = require('./ai-workflow');

const CONTROL_PATHS = [
  /^\.github\/workflows\//,
  /^\.github\/CODEOWNERS$/,
  /^tools\/(ai-workflow|claude-review|ai-path-guard|ai-orchestrator|test-ai-workflow|test-ai-orchestrator)\./,
  /^(AI_WORKFLOW|AI_ORCHESTRATION|AGENTS|CLAUDE)\.md$/
];
const CANON_PATHS = [/^case.*-canon\.js$/, /^CASE.*_DESIGN\.md$/];
const ENGINE_PATHS = [/^case.*-engine\.js$/];
const LOGIC_PATHS = [
  ...CANON_PATHS,
  ...ENGINE_PATHS,
  /^CASE.*_IMPLEMENTATION\.md$/,
  /^tools\/(test-|validate-)/
];
const UI_PATHS = [/^index\.html$/, /^case.*-ui\.js$/, /\.(css|scss)$/i, /^assets\/.*\.html$/];
const GENERIC_CLIENT_PATHS = [
  /^(?!tools\/|\.github\/).+\.html$/i,
  /^(?!tools\/|\.github\/).+\.js$/i
];
const ASSET_PATHS = [/^assets\//];
const TIER_NAMES = {
  1: 'Tier 1 / local validation',
  2: 'Tier 2 / counterpart review',
  3: 'Tier 3 / full-risk review'
};
const REVIEW_REQUESTS = {
  codex: {
    label: 'needs:codex-review',
    text: '@codex review Focus on Canon/evidence boundaries, state transitions, saves, spoilers, and regression coverage.'
  },
  claude: {
    label: 'needs:claude-review',
    text: '@claude Review this PR without implementing changes. Focus on mobile UX, readability, overflow, tap targets, and spoiler boundaries. Receipt/completion must be verified separately.'
  }
};

function matches(file, rules) {
  return rules.some(rule => rule.test(file));
}

function isLogicOrControl(path) {
  return matches(path, [...LOGIC_PATHS, ...CONTROL_PATHS]);
}

function isUi(path) {
  return matches(path, UI_PATHS) || (matches(path, GENERIC_CLIENT_PATHS) && !isLogicOrControl(path));
}

function isAsset(path) {
  return matches(path, ASSET_PATHS);
}

function isPresentation(path) {
  return isUi(path) || isAsset(path);
}

function inferAgent(pr, paths) {
  const agent = classifyPr(pr);
  if (agent !== 'human') return agent;
  const logic = paths.some(isLogicOrControl);
  const presentation = paths.some(isPresentation);
  return logic && presentation ? 'handoff' : 'human';
}

function reviewPlan({pr, files}) {
  const paths = changedPaths(files || []);
  const agent = inferAgent(pr, paths);
  const flags = {
    control: paths.some(path => matches(path, CONTROL_PATHS)),
    canon: paths.some(path => matches(path, CANON_PATHS)),
    engine: paths.some(path => matches(path, ENGINE_PATHS)),
    logic: paths.some(path => matches(path, LOGIC_PATHS)),
    ui: paths.some(isUi),
    asset: paths.some(isAsset),
    presentation: paths.some(isPresentation)
  };

  let tier = 1;
  const reasons = [];
  if (agent === 'handoff') {
    tier = 3;
    reasons.push('handoff ownership requires independent review on both sides');
  }
  if (flags.control) {
    tier = 3;
    reasons.push('workflow/policy/control files changed');
  }
  if (flags.canon || flags.engine) {
    tier = 3;
    reasons.push('Canon or runtime engine changed');
  }
  if (flags.logic && flags.presentation) {
    tier = 3;
    reasons.push('logic and player-facing presentation changed together');
  }
  if (tier < 2 && flags.presentation) {
    tier = 2;
    reasons.push(flags.asset && !flags.ui
      ? 'player-facing assets changed'
      : 'player-facing UI, client runtime, responsive, accessibility, or presentation changed');
  }
  if (!reasons.length) reasons.push('tests, validators, smoke harnesses, implementation notes, or other non-player-facing changes only');

  const reviewers = [];
  if (tier >= 2) {
    if (agent === 'codex') reviewers.push('claude');
    else if (agent === 'claude') reviewers.push('codex');
    else if (agent === 'handoff') reviewers.push('codex', 'claude');
    else if (agent === 'human') {
      if (flags.logic || flags.control || flags.canon || flags.engine) reviewers.push('codex');
      if (flags.presentation) reviewers.push('claude');
    }
  }

  return {tier, name: TIER_NAMES[tier], agent, reviewers: [...new Set(reviewers)], reasons, paths, flags};
}

function labelNames(labels) {
  return (labels || []).map(label => typeof label === 'string' ? label : label.name);
}

async function removeLabel(github, repo, number, name) {
  try {
    await github.rest.issues.removeLabel({...repo, issue_number: number, name});
  } catch (error) {
    if (error.status !== 404) throw error;
  }
}

async function syncReviewLabels(github, repo, number, current, reviewers) {
  const wanted = reviewers.map(reviewer => REVIEW_REQUESTS[reviewer].label);
  for (const label of ['needs:codex-review', 'needs:claude-review']) {
    if (labelNames(current).includes(label) && !wanted.includes(label)) await removeLabel(github, repo, number, label);
  }
  const missing = wanted.filter(label => !labelNames(current).includes(label));
  if (missing.length) await github.rest.issues.addLabels({...repo, issue_number: number, labels: missing});
}

async function writerPermission(github, repo, actor) {
  const {data} = await github.rest.repos.getCollaboratorPermissionLevel({...repo, username: actor});
  return ['admin', 'maintain', 'write'].includes(data.permission);
}

async function loadPlan({github, context, core}) {
  const repo = context.repo;
  const number = context.payload.pull_request.number;
  const {data: pr} = await github.rest.pulls.get({...repo, pull_number: number});
  if (pr.state !== 'open' || pr.draft || pr.head.repo?.full_name !== repo.owner + '/' + repo.repo) {
    core.info('Closed, draft, or fork PR: no automatic cross-review.');
    return {repo, number, pr, files: [], plan: null};
  }
  const files = await github.paginate(github.rest.pulls.listFiles, {...repo, pull_number: number, per_page: 100});
  if (files.length >= 3000) throw new Error('PR file list may be truncated; review manually.');
  const plan = reviewPlan({pr, files});
  core.info(plan.name + ': ' + plan.reasons.join('; '));
  return {repo, number, pr, files, plan};
}

async function prepareCrossReview({github, context, core}) {
  const loaded = await loadPlan({github, context, core});
  if (!loaded.plan) return {run: false, plan: null};
  if (!loaded.plan.reviewers.length) {
    await syncReviewLabels(github, loaded.repo, loaded.number, loaded.pr.labels, []);
    if (labelNames(loaded.pr.labels).includes('review:retry')) await removeLabel(github, loaded.repo, loaded.number, 'review:retry');
    core.info('Tier 1 change: automated second-model review skipped. CI and project validation still apply.');
    return {run: false, plan: loaded.plan};
  }
  return {run: true, plan: loaded.plan};
}

async function runCrossReview({github, context, core}) {
  const {repo, number, pr, plan} = await loadPlan({github, context, core});
  if (!plan) return {run: false, plan: null};

  const retry = context.payload.action === 'labeled' && context.payload.label?.name === 'review:retry' && labelNames(pr.labels).includes('review:retry');
  if (retry && !await writerPermission(github, repo, context.actor)) throw new Error('Only a repository writer may retry reviews.');

  await syncReviewLabels(github, repo, number, pr.labels, plan.reviewers);
  if (!plan.reviewers.length) {
    if (retry) await removeLabel(github, repo, number, 'review:retry');
    core.info('Tier 1 change: no automatic second-model request was created.');
    return {run: false, plan};
  }

  const comments = await github.paginate(github.rest.issues.listComments, {...repo, issue_number: number, per_page: 100});
  for (const reviewer of plan.reviewers) {
    const request = REVIEW_REQUESTS[reviewer];
    const prefix = '<!-- cross-review:v2:' + reviewer + ':' + pr.head.sha + ':';
    const marker = prefix + (retry ? 'retry-' + context.runId : 'initial') + ' -->';
    const exists = comments.some(comment => isActionsComment(comment) && (retry
      ? (comment.body || '').includes(marker)
      : (comment.body || '').includes(prefix) || (comment.body || '').includes('<!-- cross-review:' + reviewer + ':' + pr.head.sha + ' -->')));
    if (exists) continue;

    const {data: latest} = await github.rest.pulls.get({...repo, pull_number: number});
    if (latest.head.sha !== pr.head.sha || latest.state !== 'open' || latest.draft) throw new Error('PR changed while preparing reviews; retry against the current head.');

    const body = marker + '\n' + request.text + '\n\n**Requested commit:** `' + pr.head.sha + '`\n**Status:** request sent; receiver acknowledgement and completion are not implied.\n\nShared rules: `AI_WORKFLOW.md`';
    const {data: created} = await github.rest.issues.createComment({...repo, issue_number: number, body});
    comments.push(created);
  }

  if (retry) await removeLabel(github, repo, number, 'review:retry');
  return {run: true, plan};
}

module.exports = {
  CONTROL_PATHS,
  CANON_PATHS,
  ENGINE_PATHS,
  LOGIC_PATHS,
  UI_PATHS,
  GENERIC_CLIENT_PATHS,
  ASSET_PATHS,
  TIER_NAMES,
  REVIEW_REQUESTS,
  isUi,
  isAsset,
  isPresentation,
  inferAgent,
  reviewPlan,
  prepareCrossReview,
  runCrossReview
};
