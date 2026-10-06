'use strict';

const {classifyPr, changedPaths} = require('./ai-workflow');

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
const ASSET_PATHS = [/^assets\/.*\.(png|jpe?g|webp|gif|svg|avif)$/i];
const TIER_NAMES = {
  1: 'Tier 1 / local validation',
  2: 'Tier 2 / counterpart review',
  3: 'Tier 3 / full-risk review'
};

function matches(file, rules) {
  return rules.some(rule => rule.test(file));
}

function inferAgent(pr, paths) {
  let agent = classifyPr(pr);
  if (agent !== 'human') return agent;
  const logic = paths.some(path => matches(path, [...LOGIC_PATHS, ...CONTROL_PATHS]));
  const presentation = paths.some(path => matches(path, [...UI_PATHS, ...ASSET_PATHS]));
  const ui = paths.some(path => matches(path, UI_PATHS));
  return logic && presentation ? 'handoff' : logic ? 'codex' : ui ? 'claude' : 'human';
}

function reviewPlan({pr, files}) {
  const paths = changedPaths(files || []);
  const agent = inferAgent(pr, paths);
  const flags = {
    control: paths.some(path => matches(path, CONTROL_PATHS)),
    canon: paths.some(path => matches(path, CANON_PATHS)),
    engine: paths.some(path => matches(path, ENGINE_PATHS)),
    logic: paths.some(path => matches(path, LOGIC_PATHS)),
    ui: paths.some(path => matches(path, UI_PATHS)),
    asset: paths.some(path => matches(path, ASSET_PATHS))
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
  if (flags.logic && (flags.ui || flags.asset)) {
    tier = 3;
    reasons.push('logic and player-facing presentation changed together');
  }
  if (tier < 2 && (flags.ui || flags.asset)) {
    tier = 2;
    reasons.push(flags.asset && !flags.ui
      ? 'player-facing visual assets changed'
      : 'player-facing UI, responsive, accessibility, or presentation changed');
  }
  if (!reasons.length) reasons.push('tests, validators, smoke harnesses, implementation notes, or other non-player-facing changes only');

  const reviewers = [];
  if (tier >= 2) {
    if (agent === 'codex') reviewers.push('claude');
    else if (agent === 'claude') reviewers.push('codex');
    else if (agent === 'handoff') reviewers.push('codex', 'claude');
    else if (agent === 'human' && (flags.ui || flags.asset)) reviewers.push('claude');
  }

  return {tier, name: TIER_NAMES[tier], agent, reviewers, reasons, paths, flags};
}

async function removeLabel(github, repo, number, name) {
  try {
    await github.rest.issues.removeLabel({...repo, issue_number: number, name});
  } catch (error) {
    if (error.status !== 404) throw error;
  }
}

async function prepareCrossReview({github, context, core}) {
  const repo = context.repo;
  const number = context.payload.pull_request.number;
  const {data: pr} = await github.rest.pulls.get({...repo, pull_number: number});
  if (pr.state !== 'open' || pr.draft || pr.head.repo?.full_name !== repo.owner + '/' + repo.repo) {
    core.info('Closed, draft, or fork PR: no automatic cross-review.');
    return {run: false, plan: null};
  }
  const files = await github.paginate(github.rest.pulls.listFiles, {...repo, pull_number: number, per_page: 100});
  const plan = reviewPlan({pr, files});
  core.info(plan.name + ': ' + plan.reasons.join('; '));
  if (!plan.reviewers.length) {
    const labels = (pr.labels || []).map(label => typeof label === 'string' ? label : label.name);
    for (const label of ['needs:codex-review', 'needs:claude-review']) {
      if (labels.includes(label)) await removeLabel(github, repo, number, label);
    }
    core.info('Tier 1 change: automated second-model review skipped. CI and project validation still apply.');
    return {run: false, plan};
  }
  return {run: true, plan};
}

module.exports = {CONTROL_PATHS, CANON_PATHS, ENGINE_PATHS, LOGIC_PATHS, UI_PATHS, ASSET_PATHS, TIER_NAMES, inferAgent, reviewPlan, prepareCrossReview};
