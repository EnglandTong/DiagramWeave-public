# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-offline-viewer.spec.js >> exported single-file viewer works offline and remains read-only
- Location: tests\e2e\p2-offline-viewer.spec.js:4:1

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
  2  | import { readFile } from 'node:fs/promises';
  3  | 
  4  | test('exported single-file viewer works offline and remains read-only', async ({ page, context }) => {
  5  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
> 6  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveOfflineViewer);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  7  |   await page.evaluate(() => loadFlowDocumentPayload({ version: 2, projectName: 'Viewer QA', currentPageId: 'p1', pages: [
  8  |     { id: 'p1', name: 'Main', layers: [{ id: 0, name: 'Core', visible: true }, { id: 1, name: 'Optional', visible: true }], nodes: [
  9  |       { id: 'start', label: 'Start', x: 20, y: 30, w: 120, h: 60, role: 'Ops', tags: ['SLA'], layer: 0 },
  10 |       { id: 'jump', label: 'Go details', shape: 'offpage', x: 240, y: 30, w: 130, h: 60, targetPageId: 'p2', layer: 1 },
  11 |     ], connections: [{ id: 'c1', from: 'start', to: 'jump' }] },
  12 |     { id: 'p2', name: 'Details', layers: [{ id: 0, name: 'Core', visible: true }], nodes: [{ id: 'done', label: 'Done', x: 50, y: 50, w: 120, h: 60, tags: ['Final'] }], connections: [] },
  13 |   ] }));
  14 |   await page.evaluate(() => showExportDialog()); const downloadPromise = page.waitForEvent('download');
  15 |   await page.getByRole('button', { name: 'HTML Viewer' }).click(); const download = await downloadPromise;
  16 |   expect(download.suggestedFilename()).toMatch(/\.viewer\.html$/); const html = await readFile(await download.path(), 'utf8');
  17 |   expect(html).not.toMatch(/<script[^>]+src=/); expect(html).not.toMatch(/<link[^>]+href=/);
  18 |   await context.setOffline(true); const viewer = await context.newPage(); await viewer.setContent(html, { waitUntil: 'domcontentloaded' });
  19 |   await expect(viewer.getByText('Read only')).toBeVisible(); await expect(viewer.locator('.node')).toHaveCount(2); await expect(viewer.getByText('SLA', { exact: true })).toBeVisible();
  20 |   await viewer.locator('#search').fill('SLA'); await expect(viewer.locator('#results')).toContainText('Start');
  21 |   await viewer.getByText('Go details', { exact: true }).click(); await expect(viewer.locator('#pageSelect')).toHaveValue('p2'); await expect(viewer.getByText('Done', { exact: true })).toBeVisible();
  22 |   await viewer.locator('#pageSelect').selectOption('p1'); await viewer.locator('#next').click(); await expect(viewer.locator('[data-node-id="start"]')).toHaveClass(/active/);
  23 |   await viewer.locator('#next').click(); await expect(viewer.locator('[data-node-id="jump"]')).toHaveClass(/active/);
  24 |   await expect(viewer.locator('[contenteditable], input[type="file"]')).toHaveCount(0);
  25 |   await expect(viewer.getByRole('button', { name: /^(save|import|edit|ai)\b/i })).toHaveCount(0);
  26 | });
  27 | 
```