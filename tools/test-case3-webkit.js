'use strict';

// CI installs a pinned Playwright outside the repo; production needs no dependency.
const {webkit, devices} = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404); response.end(); return; }
    const mime = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.webp': 'image/webp', '.png': 'image/png'};
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  });
});

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await webkit.launch();
    const origin = 'http://127.0.0.1:' + server.address().port;
    for (const configuration of [{viewport: {width: 1280, height: 900}}, devices['iPhone 13']]) {
      const context = await browser.newContext(configuration);
      const page = await context.newPage();
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
      const mobile = Boolean(configuration.isMobile);
      await page.goto(origin + '/tools/case3-production-smoke.html' + (mobile ? '?mobile=1' : ''));
      await page.waitForFunction(() => /^(PASS|FAIL) Case3 Production Smoke$/.test(document.title), {timeout: 30000});
      const result = await page.locator('#result').innerText();
      assert.strictEqual(await page.title(), 'PASS Case3 Production Smoke', result);
      assert.deepStrictEqual(failures, [], 'WebKit browser/resource errors');
      console.log('PASS WebKit ' + (mobile ? 'iPhone 13 emulation' : 'desktop') + '\n' + result);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
