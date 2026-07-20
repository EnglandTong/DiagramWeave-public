import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__dwSkipRemoteBootstrap = true;
    sessionStorage.setItem('dw-initial-save-prompted', '1');
    localStorage.clear();
  });
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady === true);
});

async function selectMapping(page, kind, field, column) {
  await page.locator(`[data-mapping-kind="${kind}"][data-mapping-field="${field}"]`).selectOption(column);
}

test('maps nonstandard Excel fields, preserves geometry/ports/pages, and reuses preset', async ({ page }) => {
  await page.evaluate(() => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { StepCode: 10, StepTitle: 'Draft', PX: 120, PY: 180, PW: 170, PH: 72, Owner: 'Writer', Band: 2, Sheet: 'Editorial' },
      { StepCode: 20, StepTitle: 'Approve', PX: 420, PY: 180, PW: 190, PH: 76, Owner: 'QA', Band: 3, Sheet: 'Editorial' },
    ]), 'OddNodes');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { SourceStep: 10, TargetStep: 20, OutPort: 'right', InPort: 'left', EdgeText: 'submit', Sheet: 'Editorial' },
    ]), 'OddEdges');
    importExcelWorkbookData(workbook);
  });
  await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  await selectMapping(page, 'node', 'id', 'StepCode');
  await selectMapping(page, 'node', 'label', 'StepTitle');
  await selectMapping(page, 'node', 'x', 'PX');
  await selectMapping(page, 'node', 'y', 'PY');
  await selectMapping(page, 'node', 'w', 'PW');
  await selectMapping(page, 'node', 'h', 'PH');
  await selectMapping(page, 'node', 'role', 'Owner');
  await selectMapping(page, 'node', 'layer', 'Band');
  await selectMapping(page, 'node', 'page', 'Sheet');
  await selectMapping(page, 'connection', 'from', 'SourceStep');
  await selectMapping(page, 'connection', 'to', 'TargetStep');
  await selectMapping(page, 'connection', 'fromPort', 'OutPort');
  await selectMapping(page, 'connection', 'toPort', 'InPort');
  await selectMapping(page, 'connection', 'label', 'EdgeText');
  await selectMapping(page, 'connection', 'page', 'Sheet');
  await expect(page.locator('#mappingAutoLayout')).not.toBeChecked();

  await page.locator('#mappingPresetName').fill('Odd ERP');
  await page.getByRole('button', { name: '保存预设' }).click();
  await expect(page.locator('#mappingValidation')).toContainText('已保存');
  await page.locator('#continueMappingBtn').click();
  await expect(page.locator('#importPreviewSummary')).toContainText('2');
  await page.locator('#applyImportPreviewBtn').click();

  const imported = await page.evaluate(() => ({
    pages: DiagramWeave.doc.pages.map(item => item.name),
    nodes: state.nodes.map(node => ({ label: node.label, x: node.x, y: node.y, w: node.w, h: node.h, role: node.role, layer: node.layer })),
    connection: state.connections[0],
  }));
  expect(imported.pages).toContain('Editorial');
  expect(imported.nodes[0]).toMatchObject({ label: 'Draft', x: 120, y: 180, w: 170, h: 72, role: 'Writer', layer: 2 });
  expect(imported.connection).toMatchObject({ fromPort: 'right', toPort: 'left', label: 'submit' });

  await page.evaluate(() => startMappingWizard({
    sourceName: 'Reuse', nodeRows: [{ StepCode: 30, StepTitle: 'Publish', PX: 10, PY: 20 }],
    connectionRows: [{ SourceStep: 30, TargetStep: 30, OutPort: 'bottom', InPort: 'top' }],
  }));
  await page.locator('#mappingPresetSelect').selectOption('Odd ERP');
  await expect(page.locator('[data-mapping-kind="node"][data-mapping-field="id"]')).toHaveValue('StepCode');
  await expect(page.locator('[data-mapping-kind="connection"][data-mapping-field="fromPort"]')).toHaveValue('OutPort');
});

test('maps nonstandard JSON arrays before preview and explicit apply', async ({ page }) => {
  const raw = {
    nodes: [{ Key: 1, Title: 'JSON A', Left: 80, Top: 90 }, { Key: 2, Title: 'JSON B', Left: 280, Top: 90 }],
    connections: [{ SourceKey: 1, TargetKey: 2, SourceDock: 'right', TargetDock: 'left' }],
  };
  await page.locator('#fileInput').setInputFiles({
    name: 'nonstandard.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(raw)),
  });
  await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  await selectMapping(page, 'node', 'id', 'Key');
  await selectMapping(page, 'node', 'label', 'Title');
  await selectMapping(page, 'node', 'x', 'Left');
  await selectMapping(page, 'node', 'y', 'Top');
  await selectMapping(page, 'connection', 'from', 'SourceKey');
  await selectMapping(page, 'connection', 'to', 'TargetKey');
  await selectMapping(page, 'connection', 'fromPort', 'SourceDock');
  await selectMapping(page, 'connection', 'toPort', 'TargetDock');
  await page.locator('#continueMappingBtn').click();
  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  await expect(page.locator('.node')).toHaveCount(0);
  await page.locator('#applyImportPreviewBtn').click();
  await expect(page.locator('.node')).toHaveCount(2);
  expect(await page.evaluate(() => state.nodes[0].x)).toBe(80);
  expect(await page.evaluate(() => state.connections[0].fromPort)).toBe('right');
});
