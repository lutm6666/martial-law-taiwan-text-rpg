'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {build} = require('./build-pages');
const site = path.resolve(__dirname, '..', '_site');

build();
const entry = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const router = fs.readFileSync(path.join(site, 'case2-engine.js'), 'utf8');
const sources = [...entry.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
  ...router.matchAll(/(?:src:|loadScript\()'([^']+\.js\?v=\d+)'/g)];
for (const match of sources) {
  const file = match[1].split('?')[0];
  assert(fs.statSync(path.join(site, file)).isFile(), 'Missing routed script in Pages bundle: ' + file);
}
const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(site, 'case3-art-manifest.js'), 'utf8'), sandbox);
let count = 0;
for (const group of ['scenes', 'frames', 'evidence']) {
  for (const asset of Object.values(sandbox.window.CASE3_ART_MANIFEST[group])) {
    assert(fs.statSync(path.join(site, asset.path)).isFile(), 'Missing deployed art: ' + asset.path);
    count++;
  }
}
assert.strictEqual(count, 21);
for (const excluded of ['tools', 'archive', 'assets-src', 'case3-preview.html', 'AGENTS.md']) {
  assert(!fs.existsSync(path.join(site, excluded)), 'Development resource was published: ' + excluded);
}
// Rebuilding must discard stale files rather than leaving old runtime resources live.
fs.writeFileSync(path.join(site, 'stale.js'), 'stale');
build();
assert(!fs.existsSync(path.join(site, 'stale.js')));
console.log('PASS Pages bundle: routed scripts, all 21 Case 3 images, development exclusion and clean rebuild');
