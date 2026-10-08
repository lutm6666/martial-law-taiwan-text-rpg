'use strict';

// Run only in the separate trusted-main scan job. The model patch is data;
// this process has model credentials for comparison, but no publishing token.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const {validatePatch, parseStagedChanges} = require('./ai-workflow.publish');

const MAX_BLOB_BYTES = 100 * 1024 * 1024;
const SECRET_NAMES = ['OPENAI_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'];
const TOKEN_MARKERS = [
  /\bsk-(?:proj-|svcacct-|admin-|ant-)?[A-Za-z0-9_-]{16,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bglpat-[A-Za-z0-9_-]{20,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
];
const PRIVATE_KEY_MARKER = new RegExp(
  '-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----|-----BEGIN PGP '
  + 'PRIVATE KEY BLOCK-----'
);
const CREDENTIAL_NAME = /secret|token|password|passwd|credential|api[_-]?key|private[_-]?key|access[_-]?key|auth[_-]?key/i;
const ASSIGNMENT = /(?:^|[\s{,;])(?:const\s+|let\s+|var\s+|export\s+)?([A-Za-z_$][\w$.-]{0,100})\s*(?:=|:)\s*(?:"([^"\r\n]{16,4096})"|'([^'\r\n]{16,4096})'|`([^`\r\n]{16,4096})`|([^\s,;}\]\r\n]{16,4096}))/gm;

class SecretScanError extends Error {
  constructor(code) {
    super(`Secret scan blocked the patch (${code}).`);
    this.name = 'SecretScanError';
    this.code = code;
  }
}

function block(code) { throw new SecretScanError(code); }

function shannonEntropy(value) {
  const counts = new Map();
  for (const char of value) counts.set(char, (counts.get(char) || 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

function highEntropyAssignment(text) {
  const matches = new RegExp(ASSIGNMENT.source, ASSIGNMENT.flags);
  for (const match of text.matchAll(matches)) {
    if (!CREDENTIAL_NAME.test(match[1])) continue;
    const value = match[2] || match[3] || match[4] || match[5];
    if (!value || value.length < 20 || /\s|[()\[\]{}]/.test(value) || value.startsWith('/')) continue;
    if (/\$\{|\b(?:process\.env|secrets\.|env\.|example|placeholder|changeme|redacted|dummy|fixture|your[_-])\b|:\/\//i.test(value)) continue;
    if (shannonEntropy(value) >= 3.6) return true;
  }
  return false;
}

function secretVariants(value) {
  const raw = Buffer.from(value, 'utf8');
  const utf16le = Buffer.from(value, 'utf16le');
  const utf16be = Buffer.from(utf16le);
  utf16be.swap16();
  const encoded = [
    raw, utf16le, utf16be,
    Buffer.from(raw.toString('base64')),
    Buffer.from(raw.toString('base64url')),
    Buffer.from(raw.toString('hex')),
    Buffer.from(raw.toString('hex').toUpperCase()),
    Buffer.from(encodeURIComponent(value)),
    Buffer.from([...raw].map(byte => `%${byte.toString(16).padStart(2, '0')}`).join('')),
    Buffer.from([...raw].map(byte => `%${byte.toString(16).padStart(2, '0').toUpperCase()}`).join('')),
  ];
  const unique = new Map();
  for (const item of encoded) if (item.length) unique.set(item.toString('hex'), item);
  return [...unique.values()];
}

function inspectViews(bytes, variants, findings) {
  for (const encoded of variants) {
    if (bytes.includes(encoded)) {
      findings.add('exact-model-credential');
      break;
    }
  }
  const views = [bytes.toString('latin1')];
  if (bytes.includes(0) && bytes.length >= 2) {
    const even = bytes.subarray(0, bytes.length - (bytes.length % 2));
    views.push(even.toString('utf16le'));
    const swapped = Buffer.from(even);
    swapped.swap16();
    views.push(swapped.toString('utf16le'));
  }
  for (const text of views) {
    if (PRIVATE_KEY_MARKER.test(text)) findings.add('private-key-marker');
    if (TOKEN_MARKERS.some(marker => marker.test(text))) findings.add('known-token-marker');
    if (highEntropyAssignment(text)) findings.add('high-entropy-assignment');
  }
  return views;
}

// Decode common textual wrappers as well as comparing the exact credential's
// encoded forms. This catches a token embedded in a Base64/hex/URL-encoded line.
function inspectEncodedRuns(text, variants, findings) {
  for (const match of text.matchAll(/(?:%[0-9a-fA-F]{2}){8,}/g)) {
    const bytes = Buffer.from(match[0].match(/[0-9a-fA-F]{2}/g).map(hex => parseInt(hex, 16)));
    inspectViews(bytes, variants, findings);
  }
  for (const match of text.matchAll(/\b(?:[0-9a-fA-F]{2}){16,}\b/g)) {
    inspectViews(Buffer.from(match[0], 'hex'), variants, findings);
  }
  for (const match of text.matchAll(/(?<![A-Za-z0-9+/_-])[A-Za-z0-9+/_-]{32,}={0,2}(?![A-Za-z0-9+/_=-])/g)) {
    const candidate = match[0];
    const normalized = candidate.replace(/-/g, '+').replace(/_/g, '/');
    if (normalized.length % 4 === 1) continue;
    inspectViews(Buffer.from(normalized, 'base64'), variants, findings);
  }
}

// Pure helper: returned finding codes contain no path, credential, or excerpt.
function scanBytes(input, secrets = {}) {
  if (!Buffer.isBuffer(input)) throw new TypeError('Expected a Buffer.');
  if (input.length > MAX_BLOB_BYTES) block('blob-too-large');
  const variants = SECRET_NAMES.flatMap(name => {
    const value = secrets[name];
    return typeof value === 'string' && value ? secretVariants(value) : [];
  });
  const findings = new Set();
  const views = inspectViews(input, variants, findings);
  for (const view of views) inspectEncodedRuns(view, variants, findings);
  return [...findings].sort();
}

function defaultGit(args, {binary = false} = {}) {
  return cp.execFileSync('git', args, {
    encoding: binary ? undefined : 'utf8',
    maxBuffer: MAX_BLOB_BYTES + 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function createSecretScanner({git = defaultGit, files = fs} = {}) {
  const safeGit = (args, options) => {
    try { return git(args, options); }
    catch { block('git-operation-failed'); }
  };
  return function scanPatch(patchPath, secrets = process.env) {
    if (typeof patchPath !== 'string' || !patchPath) block('missing-patch');
    let patch;
    try { patch = files.readFileSync(patchPath); }
    catch { block('unreadable-patch'); }
    try { validatePatch(patch); }
    catch { block('invalid-patch'); }
    if (String(safeGit(['status', '--porcelain', '--untracked-files=no'])).trim()) {
      block('checkout-not-clean');
    }
    // --cached applies to the clean HEAD index without materializing any
    // untrusted file in the scanner's worktree, including symlinks or scripts.
    safeGit(['apply', '--binary', '--cached', path.resolve(patchPath)]);
    safeGit(['diff', '--cached', '--check']);
    let changes;
    try {
      changes = parseStagedChanges(safeGit(
        ['diff', '--cached', '--no-renames', '--name-status', '-z'], {binary: true}
      ));
    } catch { block('invalid-staged-changes'); }
    const findings = new Set(scanBytes(patch, secrets));
    let filesScanned = 0;
    for (const change of changes) {
      if (change.status === 'D') continue;
      const mode = String(safeGit(['ls-files', '--stage', '--', change.path]));
      if (!/^(?:100644|100755) [0-9a-f]{40} 0\t/.test(mode)) block('unsupported-file-mode');
      const content = safeGit(['show', `:${change.path}`], {binary: true});
      if (!Buffer.isBuffer(content) || content.length > MAX_BLOB_BYTES) block('unscannable-blob');
      for (const finding of scanBytes(content, secrets)) findings.add(finding);
      filesScanned++;
    }
    if (findings.size) block('secret-detected');
    return {filesScanned, changes: changes.length};
  };
}

const scanPatch = createSecretScanner();

if (require.main === module) {
  try {
    if (process.argv.length !== 3) block('missing-patch');
    const result = scanPatch(process.argv[2]);
    process.stdout.write(`Secret scan passed (${result.filesScanned} staged blobs).\n`);
  } catch (error) {
    const code = error instanceof SecretScanError ? error.code : 'unexpected-error';
    process.stderr.write(`Secret scan blocked the patch (${code}).\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  SecretScanError, shannonEntropy, highEntropyAssignment, secretVariants,
  scanBytes, createSecretScanner, scanPatch,
};
