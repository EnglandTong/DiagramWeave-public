# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-process-analysis.spec.js >> opens deterministic process analysis with critical path, load, wait, cycle, and SLA risk
- Location: tests\e2e\p2-process-analysis.spec.js:3:1

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
  3  | test('opens deterministic process analysis with critical path, load, wait, cycle, and SLA risk', async ({ page }) => {
  4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
> 5  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveProcessAnalysis);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  6  |   await page.evaluate(() => loadFlowDocumentPayload({ version: 2, schemaVersion: 3, slaDays: 4, currentPageId: 'p1', pages: [{ id: 'p1', name: 'Operations', slaDays: 4, nodes: [
  7  |     { id: 'start', label: 'Start', shape: 'start', duration: 1, role: 'Ops' },
  8  |     { id: 'review', label: 'Review', shape: 'rectangle', duration: 5, role: 'QA', waitDays: 2 },
  9  |     { id: 'side', label: 'Side', shape: 'rectangle', duration: 1, role: 'Ops' },
  10 |     { id: 'cycleA', label: 'A', duration: 1 }, { id: 'cycleB', label: 'B', duration: 1 },
  11 |   ], connections: [
  12 |     { id: 'c1', from: 'start', to: 'review' }, { id: 'c2', from: 'start', to: 'side' },
  13 |     { id: 'c3', from: 'cycleA', to: 'cycleB' }, { id: 'c4', from: 'cycleB', to: 'cycleA' },
  14 |   ] }] }));
  15 |   const before = await page.evaluate(() => JSON.stringify(getFlowDocumentPayload()));
  16 |   await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('analysis');
  17 |   await page.locator('.command-palette-item').filter({ hasText: 'Process analysis' }).click();
  18 |   const dialog = page.locator('#processAnalysisOverlay [role="dialog"]'); await expect(dialog).toBeVisible();
  19 |   await expect(dialog).toHaveAttribute('aria-labelledby', 'processAnalysisTitle');
  20 |   await expect(dialog).toContainText('start → review (6d)'); await expect(dialog).toContainText('cycleA → cycleB');
  21 |   await expect(dialog).toContainText('Risk / 风险 (+2d)'); await expect(dialog).toContainText('QA: 1 / 5d');
  22 |   expect(await page.evaluate(() => JSON.stringify(getFlowDocumentPayload()))).toBe(before);
  23 |   await dialog.getByRole('button', { name: 'review' }).click(); expect(await page.evaluate(() => state.selectedNodeId)).toBe('review');
  24 | });
  25 | 
```