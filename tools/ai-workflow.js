'use strict';

const crypto = require('node:crypto');

const ACTIONS_APP_ID = 15368;
const DISPATCH_MARKER = '<!-- ai-dispatch:v2 -->';
const OWNED_AREAS = ['area:logic', 'area:ui', 'area:art', 'area:admin'];
const ROUTING_LABELS = ['ai:claude', 'ai:codex', 'ai:handoff'];
const AREAS = new Map([
  ['Canon / Logic / State / Tests', ['codex', 'area:logic']],
  ['Canon / Logic / State', ['codex', 'area:logic']],
  ['Save / Migration', ['codex', 'area:logic']],
  ['CI / Tests', ['codex', 'area:logic']],
  ['Frontend / UI / Responsive / Accessibility', ['claude', 'area:ui']],
  ['Frontend / UI', ['claude', 'area:ui']],
  ['Art / Assets', ['handoff', 'area:art']],
  ['Mixed / Cross-boundary', ['handoff', 'area:logic']],
  ['Repository admin / Settings', ['handoff', 'area:admin']],
  ['Unsure', ['handoff', 'area:logic']],
]);

function names(labels) {
  return (labels || []).map(label => typeof label === 'string' ? label : label?.name).filter(Boolean);
}

function changedPaths(files) {
  return [...new Set((files || []).flatMap(file =>
    typeof file === 'string' ? [file] : [file?.filename, file?.previous_filename]
  ).filter(Boolean))];
}

function field(body, name) {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '### ' + name) continue;
    const text = [];
    while (++i < lines.length && !/^#{1,6}\s/.test(lines[i])) text.push(lines[i]);
    i--;
    sections.push(text.join('\n').trim());
  }
  if (sections.length > 1) {
    throw new Error('Duplicate ' + name + ' field; use the Issue template once.');
  }
  return sections[0] || '';
}

function routeIssue(body) {
  const workstream = field(body, 'Workstream');
  const area = field(body, 'Area');
  if (workstream && area && workstream !== area) {
    return {
      agent: 'handoff',
      area: 'area:logic',
      reason: 'Conflicting classification fields; owner confirmation required.',
    };
  }
  const selected = workstream || area;
  const match = AREAS.get(selected);
  if (!match) {
    return {
      agent: 'handoff',
      area: 'area:logic',
      reason: 'Missing or unknown Workstream/Area; fill the template before implementation.',
    };
  }
  return {
    agent: match[0],
    area: match[1],
    reason: 'Selected field: ' + selected,
  };
}

function isActionsComment(comment) {
  return comment?.user?.login === 'github-actions[bot]'
    && comment?.user?.type === 'Bot'
    && comment?.performed_via_github_app?.id === ACTIONS_APP_ID;
}

async function canWrite(github, repo, actor) {
  const {data} = await github.rest.repos.getCollaboratorPermissionLevel({
    ...repo,
    username: actor,
  });
  return ['admin', 'maintain', 'write'].includes(data.permission);
}

async function removeLabel(github, repo, number, name) {
  try {
    await github.rest.issues.removeLabel({...repo, issue_number: number, name});
  } catch (error) {
    if (error.status !== 404) throw error;
  }
}

async function syncManagedLabels(github, repo, number, current, managed, wanted) {
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

async function commentsFor(github, repo, number) {
  return github.paginate(github.rest.issues.listComments, {
    ...repo,
    issue_number: number,
    per_page: 100,
  });
}

async function dispatch({github, context, core}) {
  const repo = context.repo;
  const number = context.payload.issue.number;
  const {data: issue} = await github.rest.issues.get({...repo, issue_number: number});
  const labels = names(issue.labels);

  if (issue.state !== 'open' || issue.pull_request || !labels.includes('dispatch:ready')) {
    core.info('Issue is closed, is a PR, or is not dispatch:ready.');
    return;
  }

  const writer = await canWrite(github, repo, context.actor);
  const retry = context.payload.action === 'labeled'
    && context.payload.label?.name === 'dispatch:retry'
    && labels.includes('dispatch:retry');
  if (retry && !writer) throw new Error('Only a repository writer may retry dispatch.');

  const route = routeIssue(issue.body);
  if (!writer) {
    route.agent = 'handoff';
    route.reason = 'Repository writer must confirm scope before implementation.';
  }

  const key = crypto.createHash('sha256')
    .update(JSON.stringify([issue.body || '', route.agent, route.area, writer]))
    .digest('hex');
  const marker = '<!-- ai-dispatch-key:' + key + ' -->';
  const comments = await commentsFor(github, repo, number);
  const record = [...comments].reverse().find(comment =>
    isActionsComment(comment) && (comment.body || '').includes(DISPATCH_MARKER)
  );
  const legacy = [...comments].reverse().find(comment =>
    isActionsComment(comment) && (comment.body || '').includes('<!-- ai-dispatch:v1 -->')
  );

  await syncManagedLabels(
    github,
    repo,
    number,
    issue.labels,
    [...ROUTING_LABELS, ...OWNED_AREAS],
    [route.area, 'ai:' + route.agent]
  );

  if (record && record.body.includes(marker) && !retry) {
    core.info('Current routing revision is already recorded; managed labels reconciled.');
    return;
  }

  const entry = route.agent === 'codex'
    ? 'Start a Codex Cloud task for this Issue manually. GitHub PR review is verified; Issue-to-implementation launch is not verified.'
    : route.agent === 'claude'
      ? 'Start a Claude task manually after confirming the receiver workflow and credentials. A routing label is not a receiver acknowledgement.'
      : 'Owner must confirm classification and the handoff scope before implementation. No implementation task has been launched.';
  const body = DISPATCH_MARKER + '\n' + marker
    + '\n**Route prepared:** `' + route.agent + '`\n\n'
    + route.reason + '\n\n' + entry
    + '\n\nRead [AI_WORKFLOW.md](https://github.com/' + repo.owner + '/' + repo.repo + '/blob/main/AI_WORKFLOW.md).';

  const previous = record || legacy;
  if (previous) {
    await github.rest.issues.updateComment({...repo, comment_id: previous.id, body});
  } else {
    await github.rest.issues.createComment({...repo, issue_number: number, body});
  }

  if (retry) await removeLabel(github, repo, number, 'dispatch:retry');
}

module.exports = {
  ACTIONS_APP_ID,
  routeIssue,
  field,
  changedPaths,
  isActionsComment,
  dispatch,
};
