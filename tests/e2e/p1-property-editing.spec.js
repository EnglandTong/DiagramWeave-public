import { expect, test } from '@playwright/test';

const nodes = [
  { id: 'prop-a', shape: 'rectangle', x: 100, y: 100, w: 140, h: 60, label: 'Draft', role: 'Writer', fillColor: '#ffffff', strokeColor: '#000000', textColor: 'auto', detail: 'keep-a' },
  { id: 'prop-b', shape: 'diamond', x: 380, y: 220, w: 120, h: 80, label: 'Review', role: 'QA', fillColor: '#fff2cc', strokeColor: '#44546a', textColor: '#111320', detail: 'keep-b' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(seed => {
    sessionStorage.setItem('dw-initial-save-prompted', '1');
    sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(seed));
  }, nodes);
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 2);
  await page.evaluate(seed => {
    state.nodes.forEach((node, index) => Object.assign(node, seed[index]));
    renderAll();
  }, nodes);
});

test('four property tabs expose the expected sections', async ({ page }) => {
  await page.evaluate(() => selectNode('prop-a'));
  const tabs = page.locator('[data-property-tab]');
  await expect(tabs).toHaveCount(4);
  await expect(page.locator('#propLabel')).toBeVisible();
  await tabs.filter({ hasText: /流程|Flow/ }).click();
  await expect(page.locator('#propRole')).toBeVisible();
  await tabs.filter({ hasText: /外观|Appearance/ }).click();
  await expect(page.locator('#propFillSwatches')).toBeVisible();
  await expect(page.locator('#propFillSwatches .color-swatch').first()).toHaveAttribute('aria-label', /White.*白色.*#FFFFFF/);
  await tabs.filter({ hasText: /数据|Data/ }).click();
  await expect(page.locator('#propLayer')).toBeVisible();
});

test('mixed values are explicit and batch edits preserve unrelated fields and undo', async ({ page }) => {
  await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); });
  await expect(page.locator('#propertyBatchStatus')).toContainText('2 nodes');
  await page.locator('[data-property-tab="flow"]').click();
  await expect(page.locator('#propRole')).toHaveAttribute('placeholder', 'Mixed');
  await page.locator('#propRole').fill('Owner');
  await page.locator('#propRole').blur();
  expect(await page.evaluate(() => state.nodes.map(node => node.role))).toEqual(['Owner', 'Owner']);
  expect(await page.evaluate(() => state.nodes.map(node => node.detail))).toEqual(['keep-a', 'keep-b']);

  const layerId = await page.evaluate(() => {
    DiagramWeave.addLayer();
    updateProperties();
    return String(DiagramWeave.getCurrentPage().layers.at(-1).id);
  });
  await page.locator('[data-property-tab="data"]').click();
  await page.locator('#propLayer').selectOption(layerId);
  expect(await page.evaluate(() => state.nodes.map(node => String(node.layer)))).toEqual([layerId, layerId]);
  expect(await page.evaluate(() => state.nodes.map(node => node.detail))).toEqual(['keep-a', 'keep-b']);

  await page.locator('[data-property-tab="appearance"]').click();
  await page.locator('#propFillCustom').evaluate(input => { input.value = '#123456'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#123456', '#123456']);
  await page.evaluate(() => undo());
  expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#ffffff', '#fff2cc']);
});

test('batch appearance serializes and contextual toolbar duplicates and deletes', async ({ page }) => {
  await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); updatePropTextColor('#ffffff'); });
  const serialized = await page.evaluate(() => getFlowDocumentPayload().pages[0].nodes.map(node => ({ textColor: node.textColor, detail: node.detail })));
  expect(serialized).toEqual([
    { textColor: '#ffffff', detail: 'keep-a' },
    { textColor: '#ffffff', detail: 'keep-b' },
  ]);

  await expect(page.locator('#nodeContextToolbar')).toBeVisible();
  await page.locator('#nodeContextToolbar button[aria-label*="复制"]').click();
  await expect(page.locator('.node')).toHaveCount(3);
  await page.locator('#nodeContextToolbar button[aria-label*="删除"]').click();
  await expect(page.locator('.node')).toHaveCount(2);
});

test('tablet property tabs and context actions meet touch target size', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => selectNode('prop-a'));
  await page.locator('.tablet-drawer-toggle').nth(1).click();
  const heights = await page.locator('.property-tabs button, #nodeContextToolbar button').evaluateAll(items =>
    items.filter(item => !item.hidden).map(item => item.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(4);
  expect(heights.every(height => height >= 44)).toBe(true);
});
