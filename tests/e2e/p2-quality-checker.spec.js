import { test, expect } from '@playwright/test';

async function prepare(page) {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveContracts?.inspectQuality);
  await page.evaluate(() => {
    const n = (id, label, shape = 'rectangle') => ({ id, refId: id, shape, x: 80, y: 80, w: 120, h: 60, label, fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 });
    DiagramWeave.doc.pages = [
      { id: 'p1', name: 'Main', nodes: [n('start', 'Start', 'start'), n('task', 'Task'), n('blank', '')], connections: [
        { id: 'c1', from: 'start', to: 'task', fromPort: 'right', toPort: 'left', label: '' },
        { id: 'c2', from: 'start', to: 'task', fromPort: 'right', toPort: 'left', label: '' },
        { id: 'broken', from: 'task', to: 'missing', fromPort: 'right', toPort: 'left', label: '' },
      ], layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 },
      { id: 'p2', name: 'Cycle', nodes: [n('cycleA', 'Cycle A'), n('cycleB', 'Cycle B')], connections: [
        { id: 'c3', from: 'cycleA', to: 'cycleB', fromPort: 'right', toPort: 'left', label: '' },
        { id: 'c4', from: 'cycleB', to: 'cycleA', fromPort: 'left', toPort: 'right', label: '' },
      ], layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 },
    ];
    DiagramWeave.doc.currentPageId = 'p1'; DiagramWeave.syncStateFromPage(); clearCanvasNodes(); renderAll();
  });
}

test('reports deterministic bilingual issues and applies only a non-destructive label fix', async ({ page }) => {
  await prepare(page); const before = await page.evaluate(() => ({ nodes: DiagramWeave.doc.pages.reduce((n, p) => n + p.nodes.length, 0), connections: DiagramWeave.doc.pages.reduce((n, p) => n + p.connections.length, 0) }));
  await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('quality');
  await page.locator('.command-palette-item').filter({ hasText: 'Process quality' }).click();
  for (const rule of ['broken-reference', 'missing-label', 'isolated-node', 'dead-end', 'duplicate-connection', 'unreachable-node']) await expect(page.locator('#qualityCheckerList')).toContainText(rule);
  const blankRow = page.locator('.quality-issue-row').filter({ hasText: 'node:blank' }).filter({ hasText: 'missing-label' });
  await expect(blankRow).toContainText('Node has no label'); await blankRow.getByRole('button', { name: 'Fix' }).click();
  expect(await page.evaluate(() => DiagramWeave.doc.pages[0].nodes.find(node => node.id === 'blank').label)).toBe('rectangle');
  const after = await page.evaluate(() => ({ nodes: DiagramWeave.doc.pages.reduce((n, p) => n + p.nodes.length, 0), connections: DiagramWeave.doc.pages.reduce((n, p) => n + p.connections.length, 0) })); expect(after).toEqual(before);
});

test('locates an issue on another page without changing the report target', async ({ page }) => {
  await prepare(page); await page.evaluate(() => showQualityChecker());
  const row = page.locator('.quality-issue-row').filter({ hasText: 'node:cycleA' }).first(); await row.getByRole('button', { name: 'Locate' }).click();
  expect(await page.evaluate(() => DiagramWeave.doc.currentPageId)).toBe('p2'); expect(await page.evaluate(() => state.selectedNodeId)).toBe('cycleA');
});
