# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-quality-checker.spec.js >> locates an issue on another page without changing the report target
- Location: tests\e2e\p2-quality-checker.spec.js:34:1

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
  3  | async function prepare(page) {
  4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
> 5  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveContracts?.inspectQuality);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  6  |   await page.evaluate(() => {
  7  |     const n = (id, label, shape = 'rectangle') => ({ id, refId: id, shape, x: 80, y: 80, w: 120, h: 60, label, fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 });
  8  |     DiagramWeave.doc.pages = [
  9  |       { id: 'p1', name: 'Main', nodes: [n('start', 'Start', 'start'), n('task', 'Task'), n('blank', '')], connections: [
  10 |         { id: 'c1', from: 'start', to: 'task', fromPort: 'right', toPort: 'left', label: '' },
  11 |         { id: 'c2', from: 'start', to: 'task', fromPort: 'right', toPort: 'left', label: '' },
  12 |         { id: 'broken', from: 'task', to: 'missing', fromPort: 'right', toPort: 'left', label: '' },
  13 |       ], layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 },
  14 |       { id: 'p2', name: 'Cycle', nodes: [n('cycleA', 'Cycle A'), n('cycleB', 'Cycle B')], connections: [
  15 |         { id: 'c3', from: 'cycleA', to: 'cycleB', fromPort: 'right', toPort: 'left', label: '' },
  16 |         { id: 'c4', from: 'cycleB', to: 'cycleA', fromPort: 'left', toPort: 'right', label: '' },
  17 |       ], layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 },
  18 |     ];
  19 |     DiagramWeave.doc.currentPageId = 'p1'; DiagramWeave.syncStateFromPage(); clearCanvasNodes(); renderAll();
  20 |   });
  21 | }
  22 | 
  23 | test('reports deterministic bilingual issues and applies only a non-destructive label fix', async ({ page }) => {
  24 |   await prepare(page); const before = await page.evaluate(() => ({ nodes: DiagramWeave.doc.pages.reduce((n, p) => n + p.nodes.length, 0), connections: DiagramWeave.doc.pages.reduce((n, p) => n + p.connections.length, 0) }));
  25 |   await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('quality');
  26 |   await page.locator('.command-palette-item').filter({ hasText: 'Process quality' }).click();
  27 |   for (const rule of ['broken-reference', 'missing-label', 'isolated-node', 'dead-end', 'duplicate-connection', 'unreachable-node']) await expect(page.locator('#qualityCheckerList')).toContainText(rule);
  28 |   const blankRow = page.locator('.quality-issue-row').filter({ hasText: 'node:blank' }).filter({ hasText: 'missing-label' });
  29 |   await expect(blankRow).toContainText('Node has no label'); await blankRow.getByRole('button', { name: 'Fix' }).click();
  30 |   expect(await page.evaluate(() => DiagramWeave.doc.pages[0].nodes.find(node => node.id === 'blank').label)).toBe('rectangle');
  31 |   const after = await page.evaluate(() => ({ nodes: DiagramWeave.doc.pages.reduce((n, p) => n + p.nodes.length, 0), connections: DiagramWeave.doc.pages.reduce((n, p) => n + p.connections.length, 0) })); expect(after).toEqual(before);
  32 | });
  33 | 
  34 | test('locates an issue on another page without changing the report target', async ({ page }) => {
  35 |   await prepare(page); await page.evaluate(() => showQualityChecker());
  36 |   const row = page.locator('.quality-issue-row').filter({ hasText: 'node:cycleA' }).first(); await row.getByRole('button', { name: 'Locate' }).click();
  37 |   expect(await page.evaluate(() => DiagramWeave.doc.currentPageId)).toBe('p2'); expect(await page.evaluate(() => state.selectedNodeId)).toBe('cycleA');
  38 | });
  39 | 
```