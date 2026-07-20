import { test, expect } from '@playwright/test';

async function prepare(page, crossing = false) {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeaveRoutingRules);
  await page.evaluate(makeCrossing => {
    state.nodes = makeCrossing ? [
      { id: 'a', refId: 1, shape: 'rectangle', x: 80, y: 80, w: 100, h: 60, label: 'A', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
      { id: 'b', refId: 2, shape: 'rectangle', x: 480, y: 320, w: 100, h: 60, label: 'B', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
      { id: 'c', refId: 3, shape: 'rectangle', x: 480, y: 80, w: 100, h: 60, label: 'C', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
      { id: 'd', refId: 4, shape: 'rectangle', x: 80, y: 320, w: 100, h: 60, label: 'D', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
    ] : [
      { id: 'a', refId: 1, shape: 'rectangle', x: 80, y: 80, w: 100, h: 60, label: 'A', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
      { id: 'b', refId: 2, shape: 'rectangle', x: 480, y: 280, w: 100, h: 60, label: 'B', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 },
    ];
    state.connections = makeCrossing ? [
      { id: 'c1', from: 'a', fromPort: 'right', to: 'b', toPort: 'left', label: 'First' },
      { id: 'c2', from: 'c', fromPort: 'left', to: 'd', toPort: 'right', label: 'Second', waypoints: [{ x: 400, y: 140 }, { x: 260, y: 320 }] },
    ] : [{ id: 'c1', from: 'a', fromPort: 'top', to: 'b', toPort: 'bottom', label: 'Route' }];
    state.nextId = 10; state.connRouteMode = 'straight'; state.selectedConnectionId = 'c1';
    const current = DiagramWeave.getCurrentPage(); current.nodes = state.nodes; current.connections = state.connections;
    clearCanvasNodes(); renderAll();
  }, crossing);
}

test('edits, locks, removes, and persists connection routing rules', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => showRoutingRulesPanel());
  await expect(page.locator('#routingEndpointLock')).toBeChecked();
  await page.locator('#routingObstaclePadding').fill('36'); await page.locator('#routingObstaclePadding').press('Enter');
  await page.locator('#routingConnLabel').selectOption('custom');
  await page.locator('#routingLabelOffsetX').fill('18'); await page.locator('#routingLabelOffsetX').press('Enter');
  await page.getByRole('button', { name: 'Add waypoint' }).click();
  await expect(page.locator('.routing-waypoint-row')).toHaveCount(1);
  await page.locator('.routing-waypoint-row input[type="number"]').first().fill('320');
  await page.locator('.routing-waypoint-row input[type="number"]').first().press('Enter');
  await page.locator('.routing-waypoint-row input[type="checkbox"]').check();
  await expect(page.locator('.routing-waypoint-row input[type="number"]').first()).toBeDisabled();
  expect(await page.evaluate(() => ({ ports: [state.connections[0].fromPort, state.connections[0].toPort], rules: state.routingRules, conn: state.connections[0] }))).toMatchObject({
    ports: ['top', 'bottom'], rules: { endpointLock: true, obstaclePadding: 36 }, conn: { labelPlacement: 'custom', waypoints: [{ x: 320, locked: true }] },
  });
  const payload = await page.evaluate(() => getFlowDocumentPayload());
  await page.evaluate(data => { resetToBlankProject(); loadFlowDocumentPayload(data); }, payload);
  expect(await page.evaluate(() => ({ rules: state.routingRules, conn: state.connections[0] }))).toMatchObject({ rules: { obstaclePadding: 36 }, conn: { waypoints: [{ x: 320, locked: true }], labelPlacement: 'custom' } });
  await page.evaluate(() => { state.selectedConnectionId = 'c1'; showRoutingRulesPanel(); });
  await page.getByRole('button', { name: 'Remove' }).click();
  expect(await page.evaluate(() => state.connections[0].waypoints.length)).toBe(0);
});

test('switches crossing bridge rendering between jump, gap, and none', async ({ page }) => {
  await prepare(page, true); await page.evaluate(() => showRoutingRulesPanel());
  await expect(page.locator('.connection-bridge')).not.toHaveCount(0);
  await page.locator('#routingBridgeBehavior').selectOption('gap');
  await expect(page.locator('.connection-bridge')).toHaveCount(0); await expect(page.locator('.connection-bridge-gap')).not.toHaveCount(0);
  await page.locator('#routingBridgeBehavior').selectOption('none');
  await expect(page.locator('.connection-bridge-gap')).toHaveCount(0);
});
