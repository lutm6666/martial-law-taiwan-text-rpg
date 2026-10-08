'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const {
  SecretScanError, scanBytes, createSecretScanner, highEntropyAssignment,
} = require('./ai-workflow.secret-scan');

const SECRET = ['model-credential-', 'A7m2P9q4', 'R8t6V3x1Y5z0'].join('');
const SECRETS = {OPENAI_API_KEY: SECRET};
const PATCH = Buffer.from('diff --git a/fixture.bin b/fixture.bin\nnew file mode 100644\n');

test('exact model credential values are found in common textual and binary encodings', () => {
  const raw = Buffer.from(SECRET);
  const utf16be = Buffer.from(SECRET, 'utf16le');
  utf16be.swap16();
  const variants = [
    raw,
    Buffer.from(SECRET, 'utf16le'),
    utf16be,
    Buffer.from(raw.toString('base64')),
    Buffer.from(raw.toString('base64url')),
    Buffer.from(raw.toString('hex')),
    Buffer.from(raw.toString('hex').toUpperCase()),
    Buffer.from([...raw].map(byte => `%${byte.toString(16).padStart(2, '0')}`).join('')),
    Buffer.from(`\u0000prefix\u0000${SECRET}\u0000suffix\u0000`),
  ];
  for (const value of variants) {
    assert.ok(scanBytes(value, SECRETS).includes('exact-model-credential'));
  }
  assert.ok(scanBytes(raw, {CLAUDE_CODE_OAUTH_TOKEN: SECRET}).includes('exact-model-credential'));
  assert.deepEqual(scanBytes(Buffer.from('OPENAI_API_KEY is configured through GitHub Secrets.\n'), SECRETS), []);
});

test('encoded assignment wrappers are decoded before marker checks', () => {
  const token = `ghp_${'A'.repeat(30)}`;
  const wrapper = `token=${token}`;
  assert.ok(scanBytes(Buffer.from(Buffer.from(wrapper).toString('base64'))).includes('known-token-marker'));
  assert.ok(scanBytes(Buffer.from(Buffer.from(wrapper).toString('hex'))).includes('known-token-marker'));
  assert.ok(scanBytes(Buffer.from([...Buffer.from(wrapper)].map(byte => `%${byte.toString(16).padStart(2, '0')}`).join('')))
    .includes('known-token-marker'));
});

test('known token and private-key markers are found inside binary blobs', () => {
  const token = Buffer.concat([Buffer.from([0, 255, 42]), Buffer.from(`ghp_${'A'.repeat(30)}`), Buffer.from([0, 1])]);
  assert.ok(scanBytes(token).includes('known-token-marker'));
  assert.ok(scanBytes(Buffer.from('-----BEGIN OPENSSH ' + 'PRIVATE KEY-----\n')).includes('private-key-marker'));
});

test('high entropy credential assignments are blocked while references and placeholders pass', () => {
  const actual = 'export api_key = "' + ['P3$wT9!Q2#rN7^dL4@', 'zK8&hV1*eB5'].join('') + '"';
  assert.equal(highEntropyAssignment(actual), true);
  assert.ok(scanBytes(Buffer.from(actual)).includes('high-entropy-assignment'));
  for (const safe of [
    'api_key: "${{ secrets.OPENAI_API_KEY }}"',
    'const authToken = process.env.OPENAI_API_KEY;',
    'password: "your-password-placeholder"',
  ]) assert.equal(highEntropyAssignment(safe), false);
});

test('scanner refuses a dirty checkout and never applies the patch', () => {
  const calls = [];
  const scanner = createSecretScanner({
    files: {readFileSync: () => PATCH},
    git: args => { calls.push(args); return ' M README.md\n'; },
  });
  assert.throws(() => scanner('/tmp/patch'), error =>
    error instanceof SecretScanError && error.code === 'checkout-not-clean');
  assert.deepEqual(calls.map(args => args[0]), ['status']);
});

test('scanner applies a binary patch to the index and scans staged blob bytes', () => {
  const calls = [];
  const scanner = createSecretScanner({
    files: {readFileSync: () => PATCH},
    git: (args, options = {}) => {
      calls.push({args, options});
      if (args[0] === 'status') return '';
      if (args[0] === 'apply') return '';
      if (args[0] === 'diff' && args.includes('--check')) return '';
      if (args[0] === 'diff') return Buffer.from('A\0fixture.bin\0');
      if (args[0] === 'ls-files') return `100644 ${'a'.repeat(40)} 0\tfixture.bin\n`;
      if (args[0] === 'show') return Buffer.concat([Buffer.from([0, 255]), Buffer.from(SECRET), Buffer.from([0])]);
      throw new Error('Unexpected Git operation.');
    },
  });
  assert.throws(() => scanner('/tmp/patch', SECRETS), error =>
    error instanceof SecretScanError && error.code === 'secret-detected' && !String(error).includes(SECRET));
  assert.deepEqual(calls.find(call => call.args[0] === 'apply').args.slice(0, 3), ['apply', '--binary', '--cached']);
  assert.deepEqual(calls.find(call => call.args[0] === 'show').args, ['show', ':fixture.bin']);
  assert.equal(calls.find(call => call.args[0] === 'show').options.binary, true);
});

test('safe staged blobs pass, while unsupported staged modes and Git errors fail closed', () => {
  const commands = [];
  const git = (args, options = {}) => {
    commands.push(args);
    if (args[0] === 'status') return '';
    if (args[0] === 'apply') return '';
    if (args[0] === 'diff' && args.includes('--check')) return '';
    if (args[0] === 'diff') return Buffer.from('A\0fixture.bin\0');
    if (args[0] === 'ls-files') return `100644 ${'a'.repeat(40)} 0\tfixture.bin\n`;
    if (args[0] === 'show') return options.binary ? Buffer.from([0, 1, 2, 255]) : '';
    throw new Error('Unexpected Git operation.');
  };
  const scanner = createSecretScanner({files: {readFileSync: () => PATCH}, git});
  assert.deepEqual(scanner('/tmp/patch', SECRETS), {filesScanned: 1, changes: 1});
  assert.ok(commands.some(args => args[0] === 'show'));

  const badMode = createSecretScanner({files: {readFileSync: () => PATCH}, git: (args, options) =>
    args[0] === 'ls-files' ? `120000 ${'a'.repeat(40)} 0\tfixture.bin\n` : git(args, options)});
  assert.throws(() => badMode('/tmp/patch'), error => error.code === 'unsupported-file-mode');

  const brokenGit = createSecretScanner({files: {readFileSync: () => PATCH}, git: () => {
    throw new Error(`Git reported ${SECRET}`);
  }});
  assert.throws(() => brokenGit('/tmp/patch'), error =>
    error.code === 'git-operation-failed' && !String(error).includes(SECRET));
});

test('a real Git binary patch is scanned from its applied staged blob', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-secret-scan-'));
  const repo = path.join(root, 'repo');
  fs.mkdirSync(repo);
  t.after(() => {
    if (root.startsWith(os.tmpdir() + path.sep)) fs.rmSync(root, {recursive: true, force: true});
  });
  const git = (args, {binary = false} = {}) => cp.execFileSync('git', args, {
    cwd: repo, encoding: binary ? undefined : 'utf8',
    maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try { git(['init', '-q']); }
  catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      t.skip('This local sandbox does not permit Node child processes.');
      return;
    }
    throw error;
  }
  git(['config', 'user.name', 'Scanner Test']);
  git(['config', 'user.email', 'scanner@example.invalid']);
  fs.writeFileSync(path.join(repo, 'README.md'), 'baseline\n');
  git(['add', 'README.md']);
  git(['commit', '-qm', 'baseline']);

  const binaryPath = path.join(repo, 'fixture.bin');
  fs.writeFileSync(binaryPath, Buffer.concat([Buffer.from([0, 255, 1]), Buffer.from(SECRET), Buffer.from([0])]));
  git(['add', 'fixture.bin']);
  const patch = git(['diff', '--cached', '--binary', '--no-ext-diff'], {binary: true});
  assert.match(patch.toString('utf8'), /GIT binary patch/);
  const patchPath = path.join(root, 'implementation.patch');
  fs.writeFileSync(patchPath, patch);
  git(['reset', '--hard', 'HEAD']);
  assert.equal(fs.existsSync(binaryPath), false);
  assert.equal(String(git(['status', '--porcelain', '--untracked-files=no'])).trim(), '');

  const scanner = createSecretScanner({git});
  assert.throws(() => scanner(patchPath, SECRETS), error =>
    error instanceof SecretScanError && error.code === 'secret-detected');
  assert.equal(fs.existsSync(binaryPath), false);
  assert.ok(git(['show', ':fixture.bin'], {binary: true}).includes(Buffer.from(SECRET)));
});
