// Check every script used by the page, including its inline game engine.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let count = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const src = /\bsrc=["']([^"']+)["']/i.exec(match[1]);
  const label = src ? src[1].split('?')[0] : `index.html inline script ${count + 1}`;
  const source = src ? fs.readFileSync(path.join(root, label), 'utf8') : match[2];
  try {
    new vm.Script(source, { filename: label });
  } catch (error) {
    console.error(`JS_FAIL ${label}:`, error.message);
    process.exit(1);
  }
  console.log(`JS_OK ${label}`);
  count++;
}
if (!count) throw new Error('No scripts found in index.html');
console.log(`All ${count} page scripts passed syntax checks.`);
