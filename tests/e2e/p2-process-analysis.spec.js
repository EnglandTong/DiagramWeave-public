import { test, expect } from '@playwright/test';

test('opens deterministic process analysis with critical path, load, wait, cycle, and SLA risk', async ({ page }) => {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveProcessAnalysis);
  await page.evaluate(() => loadFlowDocumentPayload({ version: 2, schemaVersion: 3, slaDays: 4, currentPageId: 'p1', pages: [{ id: 'p1', name: 'Operations', slaDays: 4, nodes: [
    { id: 'start', label: 'Start', shape: 'start', duration: 1, role: 'Ops' },
    { id: 'review', label: 'Review', shape: 'rectangle', duration: 5, role: 'QA', waitDays: 2 },
    { id: 'side', label: 'Side', shape: 'rectangle', duration: 1, role: 'Ops' },
    { id: 'cycleA', label: 'A', duration: 1 }, { id: 'cycleB', label: 'B', duration: 1 },
  ], connections: [
    { id: 'c1', from: 'start', to: 'review' }, { id: 'c2', from: 'start', to: 'side' },
    { id: 'c3', from: 'cycleA', to: 'cycleB' }, { id: 'c4', from: 'cycleB', to: 'cycleA' },
  ] }] }));
  const before = await page.evaluate(() => JSON.stringify(getFlowDocumentPayload()));
  await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('analysis');
  await page.locator('.command-palette-item').filter({ hasText: 'Process analysis' }).click();
  const dialog = page.locator('#processAnalysisOverlay [role="dialog"]'); await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', 'processAnalysisTitle');
  await expect(dialog).toContainText('start → review (6d)'); await expect(dialog).toContainText('cycleA → cycleB');
  await expect(dialog).toContainText('Risk / 风险 (+2d)'); await expect(dialog).toContainText('QA: 1 / 5d');
  expect(await page.evaluate(() => JSON.stringify(getFlowDocumentPayload()))).toBe(before);
  await dialog.getByRole('button', { name: 'review' }).click(); expect(await page.evaluate(() => state.selectedNodeId)).toBe('review');
});
