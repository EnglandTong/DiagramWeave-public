import { test, expect } from '@playwright/test';

test('controlled VSDX export and import use a real OPC package with preview data', async ({ page }) => {
  await page.goto('/flowchart-editor.html');
  const result = await page.evaluate(async () => {
    const source = { pages: [{ name: 'Flowchart', nodes: [{ id: 'a', label: 'Start', x: 96, y: 96, w: 120, h: 64 }, { id: 'b', label: 'Finish', x: 320, y: 220, w: 120, h: 64 }], connections: [{ from: 'a', to: 'b', label: 'next' }] }] };
    const blob = await window.DiagramWeaveVisioBridge.exportVsdx(source);
    const imported = await window.DiagramWeaveVisioBridge.importVsdx(await blob.arrayBuffer(), 'sample.vsdx');
    return { size: blob.size, success: imported.success, pageName: imported.data?.pages?.[0]?.name, nodes: imported.data?.pages?.[0]?.nodes?.map(node => node.label), connections: imported.data?.pages?.[0]?.connections?.length, warning: imported.warnings?.[0] };
  });
  expect(result.size).toBeGreaterThan(500);
  expect(result.success).toBe(true);
  expect(result.pageName).toBe('Flowchart');
  expect(result.nodes).toEqual(['Start', 'Finish']);
  expect(result.connections).toBe(1);
  expect(result.warning).toContain('Controlled subset');
});
