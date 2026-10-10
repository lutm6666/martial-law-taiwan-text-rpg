'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, '_site');
const scripts = [
  'case1-unified-engine.js', 'case2-engine.js',
  'case2-rain-canon.js', 'case2-rain-canon-engine.js',
  'case3-film-canon.js', 'case3-art-manifest.js',
  'case3-film-engine.js', 'case3-film-ui.js',
];
const assetDirectories = ['assets/case1', 'assets/v2/canon', 'assets/case3'];

function build() {
  // Check all lazy-loaded runtime files before replacing the previous bundle.
  for (const file of scripts) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), {filename: file});
  const sandbox = {window: {}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'case3-art-manifest.js'), 'utf8'), sandbox);
  const art = sandbox.window.CASE3_ART_MANIFEST;
  for (const group of ['scenes', 'frames', 'evidence']) {
    for (const [id, asset] of Object.entries(art[group])) {
      if (asset.status !== 'ready' || !asset.path.startsWith('assets/case3/')
        || !fs.statSync(path.join(root, asset.path)).isFile()) {
        throw new Error('Missing production Case 3 art: ' + id);
      }
    }
  }
  fs.rmSync(destination, {recursive: true, force: true});
  fs.mkdirSync(destination, {recursive: true});
  for (const file of ['index.html', '.nojekyll', ...scripts]) {
    fs.copyFileSync(path.join(root, file), path.join(destination, file));
  }
  for (const directory of assetDirectories) {
    fs.cpSync(path.join(root, directory), path.join(destination, directory), {recursive: true});
  }
  console.log('Built production Pages bundle with Cases 1–3.');
}

if (require.main === module) build();
module.exports = {build};
