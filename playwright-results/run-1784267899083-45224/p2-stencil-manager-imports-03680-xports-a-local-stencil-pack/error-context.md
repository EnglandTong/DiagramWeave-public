# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-stencil-manager.spec.js >> imports, uses, disables, renames, and exports a local stencil pack
- Location: tests\e2e\p2-stencil-manager.spec.js:16:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
Call log:
  - navigating to "http://127.0.0.1:4173/flowchart-editor.html", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "无法访问此网站" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: 拒绝了我们的连接请求。
    - generic [ref=e10]:
      - paragraph [ref=e11]: 请试试以下办法：
      - list [ref=e12]:
        - listitem [ref=e13]: 检查网络连接
        - listitem [ref=e14]:
          - link "检查代理服务器和防火墙" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "重新加载" [ref=e19] [cursor=pointer]
    - button "详情" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const validPack = {
  4  |   id: 'qa_ops', name: 'QA Operations', version: '1.0', shapes: [{
  5  |     id: 'qa_queue', label: 'QA Queue', section: 'Operations', renderAs: 'rectangle',
  6  |     sidebarSvg: '<svg viewBox="0 0 40 40"><rect x="4" y="8" width="32" height="24" fill="none" stroke="#2563eb"/></svg>',
  7  |   }],
  8  | };
  9  | 
  10 | async function prepare(page) {
  11 |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; localStorage.clear(); sessionStorage.setItem('dw-initial-save-prompted', '1'); });
> 12 |   await page.goto('/flowchart-editor.html');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  13 |   await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.stencilPacks);
  14 | }
  15 | 
  16 | test('imports, uses, disables, renames, and exports a local stencil pack', async ({ page }) => {
  17 |   await prepare(page);
  18 |   await page.evaluate(() => showStencilManager());
  19 |   await page.locator('#stencilPackInput').setInputFiles({ name: 'qa.stencil.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(validPack)) });
  20 |   await expect(page.locator('.stencil-pack-row')).toHaveCount(1);
  21 |   await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toBeVisible();
  22 |   await page.evaluate(() => hideStencilManager());
  23 |   await page.locator('.shape-item[data-shape="qa_queue"]').dblclick();
  24 |   await expect.poll(() => page.evaluate(() => state.nodes.filter(node => node.shape === 'qa_queue').length)).toBe(1);
  25 |   await page.evaluate(() => { if (document.getElementById('confirmOverlay')?.classList.contains('visible')) hideConfirm(); });
  26 | 
  27 |   await page.evaluate(() => showStencilManager());
  28 |   await page.locator('.stencil-pack-row input[type="text"]').fill('Renamed Operations');
  29 |   const download = page.waitForEvent('download');
  30 |   await page.getByRole('button', { name: 'Export' }).click();
  31 |   expect((await download).suggestedFilename()).toBe('qa_ops.stencil.json');
  32 |   await expect.poll(() => page.evaluate(() => DiagramWeave.stencilPacks.list()[0].name)).toBe('Renamed Operations');
  33 |   await page.locator('.stencil-pack-row input[type="checkbox"]').uncheck();
  34 |   await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toHaveCount(0);
  35 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.get('qa_queue'))).toBeNull();
  36 | });
  37 | 
  38 | test('rejects an unsafe pack without mutating the shape library', async ({ page }) => {
  39 |   await prepare(page);
  40 |   await page.evaluate(() => showStencilManager());
  41 |   const unsafe = { ...validPack, id: 'unsafe_pack', shapes: [{ id: 'unsafe_shape', label: 'Unsafe', sidebarSvg: '<svg onload="alert(1)"><rect/></svg>' }] };
  42 |   await page.locator('#stencilPackInput').setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unsafe)) });
  43 |   await expect(page.locator('#stencilPackIssues')).toContainText('safe SVG');
  44 |   await expect(page.locator('.stencil-pack-row')).toHaveCount(0);
  45 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.get('unsafe_shape'))).toBeNull();
  46 | });
  47 | 
```