'use strict';

// Shared compatibility surface for trusted review/guard policy. Issue dispatch
// itself lives in the separately tested module below.
const {changedPaths, dispatch} = require('./ai-workflow.dispatch');
const {routeIssue} = require('./ai-workflow.routing');

const ACTIONS_APP_ID = 15368;

function isActionsComment(comment) {
  return comment?.user?.login === 'github-actions[bot]'
    && comment?.user?.type === 'Bot'
    && comment?.performed_via_github_app?.id === ACTIONS_APP_ID;
}

module.exports = {ACTIONS_APP_ID, changedPaths, isActionsComment, routeIssue, dispatch};
