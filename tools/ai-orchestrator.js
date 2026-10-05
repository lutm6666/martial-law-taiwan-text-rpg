'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const AGENTS = new Set(['codex', 'claude', 'handoff']);

function fail(message) {
  const error = new Error(message);
  error.name = 'OrchestrationError';
  throw error;
}

function slug(value) {
  const out = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (!out) fail('A non-empty id is required.');
  return out;
}

function asArray(value, name, {required = false} = {}) {
  if (value == null) value = [];
  if (!Array.isArray(value)) fail(name + ' must be an array.');
  const cleaned = value.map(v => String(v).trim()).filter(Boolean);
  if (required && cleaned.length === 0) fail(name + ' must contain at least one item.');
  return cleaned;
}

function normalizeScope(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .trim();
}

function staticPrefix(scope) {
  const s = normalizeScope(scope);
  const index = s.search(/[?*[\]{}]/);
  return (index === -1 ? s : s.slice(0, index)).replace(/\/+$/, '');
}

function scopesOverlap(a, b) {
  const left = staticPrefix(a);
  const right = staticPrefix(b);
  if (!left || !right) return true;
  return left === right || left.startsWith(right + '/') || right.startsWith(left + '/');
}

function normalizePlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('Plan must be a JSON object.');
  const id = slug(raw.id);
  const base = String(raw.base || 'main').trim();
  const integrationBranch = String(raw.integrationBranch || `handoff/orch-${id}`).trim();
  if (integrationBranch === base) fail('integrationBranch must differ from base.');
  if (!/^handoff\/orch-[a-z0-9._/-]+$/.test(integrationBranch)) {
    fail('integrationBranch must use the handoff/orch-<name> namespace.');
  }
  const maxParallel = Number(raw.maxParallel == null ? 3 : raw.maxParallel);
  if (!Number.isInteger(maxParallel) || maxParallel < 1 || maxParallel > 8) {
    fail('maxParallel must be an integer from 1 to 8.');
  }
  if (!Array.isArray(raw.tasks) || raw.tasks.length === 0) fail('Plan must contain at least one task.');

  const seen = new Set();
  const tasks = raw.tasks.map((task, index) => {
    if (!task || typeof task !== 'object' || Array.isArray(task)) fail(`tasks[${index}] must be an object.`);
    const taskId = slug(task.id);
    if (seen.has(taskId)) fail('Duplicate task id: ' + taskId);
    seen.add(taskId);
    const agent = String(task.agent || '').trim().toLowerCase();
    if (!AGENTS.has(agent)) fail(`Task ${taskId} has unsupported agent: ${agent || '(missing)'}`);
    const paths = asArray(task.paths, `Task ${taskId} paths`, {required: true}).map(normalizeScope);
    if (paths.some(p => !p)) fail(`Task ${taskId} contains an empty path scope.`);
    const acceptance = asArray(task.acceptance, `Task ${taskId} acceptance`, {required: true});
    const dependsOn = asArray(task.dependsOn, `Task ${taskId} dependsOn`).map(slug);
    return {
      id: taskId,
      agent,
      title: String(task.title || taskId).trim(),
      goal: String(task.goal || '').trim(),
      paths,
      acceptance,
      dependsOn,
      constraints: asArray(task.constraints, `Task ${taskId} constraints`),
      branch: `${agent}/${id}-${taskId}`
    };
  });

  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!seen.has(dependency)) fail(`Task ${task.id} depends on unknown task ${dependency}.`);
      if (dependency === task.id) fail(`Task ${task.id} cannot depend on itself.`);
    }
  }

  const byId = new Map(tasks.map(task => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) fail('Dependency cycle detected at task ' + id + '.');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id).dependsOn) visit(dep);
    visiting.delete(id);
    visited.add(id);
  }
  for (const task of tasks) visit(task.id);

  function dependsTransitively(from, target, memo = new Set()) {
    if (memo.has(from)) return false;
    memo.add(from);
    const task = byId.get(from);
    if (task.dependsOn.includes(target)) return true;
    return task.dependsOn.some(dep => dependsTransitively(dep, target, memo));
  }

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i];
      const b = tasks[j];
      const overlap = a.paths.some(left => b.paths.some(right => scopesOverlap(left, right)));
      if (!overlap) continue;
      if (!dependsTransitively(a.id, b.id) && !dependsTransitively(b.id, a.id)) {
        fail(`Parallel tasks ${a.id} and ${b.id} have overlapping path scope. Add a dependency or split the scope.`);
      }
    }
  }

  return {
    version: 1,
    id,
    title: String(raw.title || id).trim(),
    goal: String(raw.goal || '').trim(),
    base,
    integrationBranch,
    maxParallel,
    tasks
  };
}

function readyWaves(plan) {
  const pending = new Map(plan.tasks.map(task => [task.id, task]));
  const completed = new Set();
  const waves = [];
  while (pending.size) {
    const ready = [...pending.values()]
      .filter(task => task.dependsOn.every(dep => completed.has(dep)))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (!ready.length) fail('No schedulable tasks remain; dependency graph is invalid.');
    const wave = ready.slice(0, plan.maxParallel);
    waves.push(wave.map(task => task.id));
    for (const task of wave) {
      pending.delete(task.id);
      completed.add(task.id);
    }
  }
  return waves;
}

function taskPrompt(plan, task) {
  const lines = [
    `# Agent task: ${task.title}`,
    '',
    `Orchestration: ${plan.id}`,
    `Agent: ${task.agent}`,
    `Branch: ${task.branch}`,
    `Integration branch: ${plan.integrationBranch}`,
    '',
    '## Goal',
    task.goal || plan.goal || 'Complete the assigned task.',
    '',
    '## Allowed scope',
    ...task.paths.map(p => `- ${p}`),
    '',
    'Do not modify files outside the allowed scope. If another file must change, stop and report a handoff instead of crossing the boundary.',
    '',
    '## Acceptance criteria',
    ...task.acceptance.map(item => `- ${item}`)
  ];
  if (task.dependsOn.length) lines.push('', '## Dependencies', ...task.dependsOn.map(dep => `- ${dep}`));
  if (task.constraints.length) lines.push('', '## Constraints', ...task.constraints.map(item => `- ${item}`));
  lines.push('', '## Completion contract', '- Run the relevant tests.', '- Commit only task-scoped changes.', '- Report commit SHA, tests run, changed files, and unresolved risks.', '');
  return lines.join('\n');
}

function execGit(args, options = {}) {
  const output = cp.execFileSync('git', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options});
  return output == null ? '' : String(output).trim();
}

function repoRoot() {
  try { return execGit(['rev-parse', '--show-toplevel']); }
  catch { fail('Run this command inside a Git repository.'); }
}

function branchExists(branch, cwd) {
  try { execGit(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {cwd}); return true; }
  catch { return false; }
}

function branchIsIntegrated(branch, integrationBranch, cwd) {
  try { execGit(['merge-base', '--is-ancestor', branch, integrationBranch], {cwd}); return true; }
  catch { return false; }
}

function loadPlan(file) {
  const full = path.resolve(file);
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch (error) { fail(`Cannot read plan ${full}: ${error.message}`); }
  return normalizePlan(parsed);
}

function defaultRoot(root, plan, repo) {
  const resolved = root ? path.resolve(root) : path.join(path.dirname(repo), `${path.basename(repo)}-worktrees`, plan.id);
  const relative = path.relative(repo, resolved);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    fail('Worktree root must be outside the primary repository.');
  }
  return resolved;
}

function printPlan(plan) {
  const waves = readyWaves(plan);
  console.log(`Plan: ${plan.title}`);
  console.log(`Base: ${plan.base}`);
  console.log(`Integration: ${plan.integrationBranch}`);
  console.log(`Max parallel: ${plan.maxParallel}`);
  waves.forEach((wave, index) => console.log(`Wave ${index + 1}: ${wave.join(', ')}`));
}

function readState(stateFile, plan, repo, root) {
  if (!fs.existsSync(stateFile)) {
    return {version: 1, plan: plan.id, repository: repo, root, integrationBranch: plan.integrationBranch, tasks: []};
  }
  let state;
  try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); }
  catch (error) { fail(`Cannot read orchestration state: ${error.message}`); }
  if (state.plan !== plan.id || state.repository !== repo || state.integrationBranch !== plan.integrationBranch) {
    fail('Existing orchestration state does not match this plan/repository.');
  }
  if (!Array.isArray(state.tasks)) state.tasks = [];
  return state;
}

function materialize(plan, rootArg, waveNumber = 1) {
  const repo = repoRoot();
  const root = defaultRoot(rootArg, plan, repo);
  const waves = readyWaves(plan);
  if (!Number.isInteger(waveNumber) || waveNumber < 1 || waveNumber > waves.length) {
    fail(`wave must be an integer from 1 to ${waves.length}.`);
  }
  execGit(['rev-parse', '--verify', `${plan.base}^{commit}`], {cwd: repo});
  if (!branchExists(plan.integrationBranch, repo)) execGit(['branch', plan.integrationBranch, plan.base], {cwd: repo});

  const selectedIds = new Set(waves[waveNumber - 1]);
  const selectedTasks = plan.tasks.filter(task => selectedIds.has(task.id));
  if (waveNumber > 1) {
    const byId = new Map(plan.tasks.map(task => [task.id, task]));
    for (const task of selectedTasks) {
      for (const dependency of task.dependsOn) {
        const dep = byId.get(dependency);
        if (!branchExists(dep.branch, repo)) {
          fail(`Cannot materialize wave ${waveNumber}: dependency branch ${dep.branch} does not exist.`);
        }
        if (!branchIsIntegrated(dep.branch, plan.integrationBranch, repo)) {
          fail(`Cannot materialize wave ${waveNumber}: dependency ${dependency} is not integrated into ${plan.integrationBranch}.`);
        }
      }
    }
  }

  fs.mkdirSync(root, {recursive: true});
  const promptRoot = path.join(root, '_prompts');
  fs.mkdirSync(promptRoot, {recursive: true});
  const stateFile = path.join(root, 'state.json');
  const state = readState(stateFile, plan, repo, root);

  for (const task of selectedTasks) {
    const worktree = path.join(root, task.id);
    const promptFile = path.join(promptRoot, `${task.id}.md`);
    fs.writeFileSync(promptFile, taskPrompt(plan, task));
    if (!fs.existsSync(path.join(worktree, '.git'))) {
      if (branchExists(task.branch, repo)) execGit(['worktree', 'add', worktree, task.branch], {cwd: repo, stdio: 'inherit'});
      else execGit(['worktree', 'add', '-b', task.branch, worktree, plan.integrationBranch], {cwd: repo, stdio: 'inherit'});
    }
    const record = {id: task.id, agent: task.agent, branch: task.branch, worktree, promptFile, dependsOn: task.dependsOn, wave: waveNumber};
    const existing = state.tasks.findIndex(item => item.id === task.id);
    if (existing === -1) state.tasks.push(record);
    else state.tasks[existing] = record;
  }
  state.lastMaterializedWave = waveNumber;
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
  printPlan(plan);
  console.log(`Materialized wave ${waveNumber}: ${waves[waveNumber - 1].join(', ')}`);
  console.log(`Worktrees: ${root}`);
  return state;
}

function status(plan, rootArg) {
  const repo = repoRoot();
  const root = defaultRoot(rootArg, plan, repo);
  const rows = [];
  for (const task of plan.tasks) {
    const worktree = path.join(root, task.id);
    const exists = fs.existsSync(worktree);
    let dirty = null;
    let ahead = null;
    if (exists) {
      dirty = execGit(['status', '--porcelain'], {cwd: worktree}).split('\n').filter(Boolean).length;
      try { ahead = Number(execGit(['rev-list', '--count', `${plan.integrationBranch}..${task.branch}`], {cwd: repo})); }
      catch { ahead = null; }
    }
    rows.push({id: task.id, agent: task.agent, branch: task.branch, exists, dirty, ahead});
  }
  console.table(rows);
  return rows;
}

function cleanup(plan, rootArg) {
  const repo = repoRoot();
  const root = defaultRoot(rootArg, plan, repo);
  for (const task of plan.tasks) {
    const worktree = path.join(root, task.id);
    if (!fs.existsSync(worktree)) continue;
    const dirty = execGit(['status', '--porcelain'], {cwd: worktree});
    if (dirty) fail(`Refusing to remove dirty worktree for ${task.id}: ${worktree}`);
    execGit(['worktree', 'remove', worktree], {cwd: repo, stdio: 'inherit'});
  }
  execGit(['worktree', 'prune'], {cwd: repo});
  console.log('Removed clean task worktrees. Branches were preserved.');
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift();
  const file = args.shift();
  let root = null;
  let wave = 1;
  while (args.length) {
    const flag = args.shift();
    if (flag === '--root') {
      root = args.shift();
      if (!root) fail('--root requires a path.');
    } else if (flag === '--wave') {
      wave = Number(args.shift());
      if (!Number.isInteger(wave) || wave < 1) fail('--wave requires a positive integer.');
    } else fail('Unknown argument: ' + flag);
  }
  if (!command || !file) fail('Usage: node tools/ai-orchestrator.js <validate|plan|materialize|status|cleanup> <plan.json> [--root PATH] [--wave N]');
  return {command, file, root, wave};
}

function main() {
  const {command, file, root, wave} = parseArgs(process.argv.slice(2));
  const plan = loadPlan(file);
  if (command === 'validate') { console.log('VALID'); return; }
  if (command === 'plan') { printPlan(plan); return; }
  if (command === 'materialize') { materialize(plan, root, wave); return; }
  if (command === 'status') { status(plan, root); return; }
  if (command === 'cleanup') { cleanup(plan, root); return; }
  fail('Unknown command: ' + command);
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = {normalizePlan, readyWaves, scopesOverlap, taskPrompt, slug};
