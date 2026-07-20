# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-routing-rules.spec.js >> edits, locks, removes, and persists connection routing rules
- Location: tests\e2e\p2-routing-rules.spec.js:26:1

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
  3  | async function prepare(page, crossing = false) {
  4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
> 5  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeaveRoutingRules);
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  6  |   await page.evaluate(makeCrossing => {
  7  |     state.nodes = makeCrossing ? [
  8  |       { id: 'a', refId: 1, shape: 'rectangle', x: 80, y: 80, w: 100, h: 60, label: 'A', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  9  |       { id: 'b', refId: 2, shape: 'rectangle', x: 480, y: 320, w: 100, h: 60, label: 'B', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  10 |       { id: 'c', refId: 3, shape: 'rectangle', x: 480, y: 80, w: 100, h: 60, label: 'C', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  11 |       { id: 'd', refId: 4, shape: 'rectangle', x: 80, y: 320, w: 100, h: 60, label: 'D', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  12 |     ] : [
  13 |       { id: 'a', refId: 1, shape: 'rectangle', x: 80, y: 80, w: 100, h: 60, label: 'A', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  14 |       { id: 'b', refId: 2, shape: 'rectangle', x: 480, y: 280, w: 100, h: 60, label: 'B', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
  15 |     ];
  16 |     state.connections = makeCrossing ? [
  17 |       { id: 'c1', from: 'a', fromPort: 'right', to: 'b', toPort: 'left', label: 'First' },
  18 |       { id: 'c2', from: 'c', fromPort: 'left', to: 'd', toPort: 'right', label: 'Second', waypoints: [{ x: 400, y: 140 }, { x: 260, y: 320 }] },
  19 |     ] : [{ id: 'c1', from: 'a', fromPort: 'top', to: 'b', toPort: 'bottom', label: 'Route' }];
  20 |     state.nextId = 10; state.connRouteMode = 'straight'; state.selectedConnectionId = 'c1';
  21 |     const current = DiagramWeave.getCurrentPage(); current.nodes = state.nodes; current.connections = state.connections;
  22 |     clearCanvasNodes(); renderAll();
  23 |   }, crossing);
  24 | }
  25 | 
  26 | test('edits, locks, removes, and persists connection routing rules', async ({ page }) => {
  27 |   await prepare(page);
  28 |   await page.evaluate(() => showRoutingRulesPanel());
  29 |   await expect(page.locator('#routingEndpointLock')).toBeChecked();
  30 |   await page.locator('#routingObstaclePadding').fill('36'); await page.locator('#routingObstaclePadding').press('Enter');
  31 |   await page.locator('#routingConnLabel').selectOption('custom');
  32 |   await page.locator('#routingLabelOffsetX').fill('18'); await page.locator('#routingLabelOffsetX').press('Enter');
  33 |   await page.getByRole('button', { name: 'Add waypoint' }).click();
  34 |   await expect(page.locator('.routing-waypoint-row')).toHaveCount(1);
  35 |   await page.locator('.routing-waypoint-row input[type="number"]').first().fill('320');
  36 |   await page.locator('.routing-waypoint-row input[type="number"]').first().press('Enter');
  37 |   await page.locator('.routing-waypoint-row input[type="checkbox"]').check();
  38 |   await expect(page.locator('.routing-waypoint-row input[type="number"]').first()).toBeDisabled();
  39 |   expect(await page.evaluate(() => ({ ports: [state.connections[0].fromPort, state.connections[0].toPort], rules: state.routingRules, conn: state.connections[0] }))).toMatchObject({
  40 |     ports: ['top', 'bottom'], rules: { endpointLock: true, obstaclePadding: 36 }, conn: { labelPlacement: 'custom', waypoints: [{ x: 320, locked: true }] },
  41 |   });
  42 |   const payload = await page.evaluate(() => getFlowDocumentPayload());
  43 |   await page.evaluate(data => { resetToBlankProject(); loadFlowDocumentPayload(data); }, payload);
  44 |   expect(await page.evaluate(() => ({ rules: state.routingRules, conn: state.connections[0] }))).toMatchObject({ rules: { obstaclePadding: 36 }, conn: { waypoints: [{ x: 320, locked: true }], labelPlacement: 'custom' } });
  45 |   await page.evaluate(() => { state.selectedConnectionId = 'c1'; showRoutingRulesPanel(); });
  46 |   await page.getByRole('button', { name: 'Remove' }).click();
  47 |   expect(await page.evaluate(() => state.connections[0].waypoints.length)).toBe(0);
  48 | });
  49 | 
  50 | test('switches crossing bridge rendering between jump, gap, and none', async ({ page }) => {
  51 |   await prepare(page, true); await page.evaluate(() => showRoutingRulesPanel());
  52 |   await expect(page.locator('.connection-bridge')).not.toHaveCount(0);
  53 |   await page.locator('#routingBridgeBehavior').selectOption('gap');
  54 |   await expect(page.locator('.connection-bridge')).toHaveCount(0); await expect(page.locator('.connection-bridge-gap')).not.toHaveCount(0);
  55 |   await page.locator('#routingBridgeBehavior').selectOption('none');
  56 |   await expect(page.locator('.connection-bridge-gap')).toHaveCount(0);
  57 | });
  58 | 
```