'use strict';

const ROUTING_LABELS = ['ai:claude', 'ai:codex', 'ai:handoff'];

function labelNames(labels) {
  return (labels || []).map(label => typeof label === 'string' ? label : label?.name).filter(Boolean);
}

function branchRoutingHint(ref) {
  if (/^(claude\/|ai\/claude-)/.test(ref || '')) return 'claude';
  if (/^(codex\/|ai\/codex-)/.test(ref || '')) return 'codex';
  if (/^handoff\//.test(ref || '')) return 'handoff';
  return null;
}

/**
 * Mutable labels and branch names are routing metadata only. They can increase
 * review requirements but must never prove who authored a PR or relax a guard.
 */
function routingHint(pr) {
  const labels = labelNames(pr?.labels).filter(label => ROUTING_LABELS.includes(label));
  const branch = branchRoutingHint(pr?.head?.ref);

  if (labels.length > 1) {
    return {
      hint: 'handoff',
      source: 'conflict',
      conflict: true,
      labels,
      branch,
      reason: 'Conflicting AI routing labels; fail toward handoff review.',
    };
  }

  const label = labels[0] ? labels[0].slice(3) : null;
  if (label && branch && label !== branch && label !== 'handoff' && branch !== 'handoff') {
    return {
      hint: 'handoff',
      source: 'conflict',
      conflict: true,
      labels,
      branch,
      reason: 'Branch and label routing hints disagree; fail toward handoff review.',
    };
  }

  const hint = label === 'handoff' || branch === 'handoff' ? 'handoff' : (label || branch || 'unspecified');
  return {
    hint,
    source: label ? 'label' : branch ? 'branch' : 'none',
    conflict: false,
    labels,
    branch,
    reason: hint === 'unspecified' ? 'No routing hint is present.' : 'Routing hint only; not author identity.',
  };
}

/**
 * Provenance is deliberately conservative. A normal User-authored PR is
 * "unknown" because GitHub may show the owner account even when an external
 * agent acted through that account. Bot identity can be observed, but is not
 * mapped to Codex/Claude without a separately verified App boundary.
 */
function provenance(pr) {
  const user = pr?.user || {};
  if (user.type === 'Bot' && typeof user.login === 'string' && user.login) {
    return {kind: 'bot', verified: true, actor: user.login};
  }
  return {
    kind: 'unknown',
    verified: false,
    actor: typeof user.login === 'string' && user.login ? user.login : null,
  };
}

module.exports = {ROUTING_LABELS, labelNames, branchRoutingHint, routingHint, provenance};
