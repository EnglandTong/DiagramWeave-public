# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-version-history.spec.js >> restores a local snapshot and retains it after reload and project load
- Location: tests\e2e\p2-version-history.spec.js:14:1

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
  4  | async function prepare(page) {
  5  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
> 6  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.history);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  7  |   await page.evaluate(async () => {
  8  |     projectSession.historyId = `qa_history_${Date.now()}`; await DiagramWeave.history.clear(projectSession.historyId);
  9  |     state.nodes = [{ id: 'a', refId: 1, shape: 'rectangle', x: 100, y: 100, w: 140, h: 60, label: 'Good state', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 }];
  10 |     state.connections = []; state.nextId = 2; const current = DiagramWeave.getCurrentPage(); current.nodes = state.nodes; current.connections = state.connections; clearCanvasNodes(); renderAll();
  11 |   });
  12 | }
  13 | 
  14 | test('restores a local snapshot and retains it after reload and project load', async ({ page }) => {
  15 |   await prepare(page);
  16 |   await page.evaluate(() => captureVersionSnapshot('Before bad import', true));
  17 |   const payload = await page.evaluate(() => getFlowDocumentPayload());
  18 |   await page.evaluate(() => { state.nodes[0].label = 'Bad state'; renderAll(); });
  19 |   await page.evaluate(() => showVersionHistory());
  20 |   await expect(page.locator('.version-history-row')).toHaveCount(1);
  21 |   await expect(page.locator('.version-history-row')).toContainText('Before bad import');
  22 |   await page.getByRole('button', { name: 'Restore' }).click();
  23 |   await expect.poll(() => page.evaluate(() => state.nodes[0].label)).toBe('Good state');
  24 |   await page.reload(); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.history);
  25 |   await page.evaluate(data => loadFlowDocumentPayload(data), payload);
  26 |   await page.evaluate(() => showVersionHistory());
  27 |   await expect(page.locator('.version-history-row')).not.toHaveCount(0);
  28 | });
  29 | 
  30 | test('keeps normal project payload history-free and includes history only when requested', async ({ page }) => {
  31 |   await prepare(page); await page.evaluate(() => captureVersionSnapshot('Manual checkpoint', true));
  32 |   const normal = await page.evaluate(() => getFlowDocumentPayload());
  33 |   expect(normal.versionHistory).toBeUndefined(); expect(normal.historyId).toMatch(/^qa_history_/);
  34 |   await page.evaluate(() => showExportDialog()); await page.locator('#exportIncludeHistory').check();
  35 |   const downloadPromise = page.waitForEvent('download'); await page.locator('.export-format-btn').filter({ hasText: /VSO/ }).click();
  36 |   const download = await downloadPromise; const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  37 |   expect(exported.versionHistory).toHaveLength(1); expect(exported.versionHistory[0].operation).toBe('Manual checkpoint');
  38 | });
  39 | 
```