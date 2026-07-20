import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function prepare(page) {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.history);
  await page.evaluate(async () => {
    projectSession.historyId = `qa_history_${Date.now()}`; await DiagramWeave.history.clear(projectSession.historyId);
    state.nodes = [{ id: 'a', refId: 1, shape: 'rectangle', x: 100, y: 100, w: 140, h: 60, label: 'Good state', fillColor: '#fff', strokeColor: '#000', textColor: 'auto', layer: 0 }];
    state.connections = []; state.nextId = 2; const current = DiagramWeave.getCurrentPage(); current.nodes = state.nodes; current.connections = state.connections; clearCanvasNodes(); renderAll();
  });
}

test('restores a local snapshot and retains it after reload and project load', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => captureVersionSnapshot('Before bad import', true));
  const payload = await page.evaluate(() => getFlowDocumentPayload());
  await page.evaluate(() => { state.nodes[0].label = 'Bad state'; renderAll(); });
  await page.evaluate(() => showVersionHistory());
  await expect(page.locator('.version-history-row')).toHaveCount(1);
  await expect(page.locator('.version-history-row')).toContainText('Before bad import');
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect.poll(() => page.evaluate(() => state.nodes[0].label)).toBe('Good state');
  await page.reload(); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.history);
  await page.evaluate(data => loadFlowDocumentPayload(data), payload);
  await page.evaluate(() => showVersionHistory());
  await expect(page.locator('.version-history-row')).not.toHaveCount(0);
});

test('keeps normal project payload history-free and includes history only when requested', async ({ page }) => {
  await prepare(page); await page.evaluate(() => captureVersionSnapshot('Manual checkpoint', true));
  const normal = await page.evaluate(() => getFlowDocumentPayload());
  expect(normal.versionHistory).toBeUndefined(); expect(normal.historyId).toMatch(/^qa_history_/);
  await page.evaluate(() => showExportDialog()); await page.locator('#exportIncludeHistory').check();
  const downloadPromise = page.waitForEvent('download'); await page.locator('.export-format-btn').filter({ hasText: /VSO/ }).click();
  const download = await downloadPromise; const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(exported.versionHistory).toHaveLength(1); expect(exported.versionHistory[0].operation).toBe('Manual checkpoint');
});
