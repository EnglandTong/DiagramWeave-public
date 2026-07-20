import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('dw-initial-save-prompted', '1'));
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady && typeof allTemplates !== 'undefined' && allTemplates.length >= 7);
  await page.locator('.template-btn').click();
  await expect(page.locator('#templateOverlay')).toHaveClass(/visible/);
});

test('all templates expose bilingual category, tags, and preview metadata', async ({ page }) => {
  const invalid = await page.evaluate(() => allTemplates.filter(template =>
    !template.name || !template.nameEn || !template.description || !template.descriptionEn ||
    !template.category || !Array.isArray(template.tags) || !template.tags.length ||
    !template.preview || !Number.isFinite(template.preview.nodeCount)));
  expect(invalid).toEqual([]);
  await expect(page.locator('.template-dialog-item')).toHaveCount(await page.evaluate(() => allTemplates.length));
  await expect(page.locator('.template-item-meta').first()).toContainText(/nodes/);
});

test('searches Chinese and English, filters categories, and persists favorites', async ({ page }) => {
  await page.locator('#templateCenterSearch').fill('Fishbone');
  await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  await expect(page.locator('.template-dialog-item-name')).toContainText(/Fishbone|鱼骨/);
  await page.locator('#templateCenterSearch').fill('鱼骨');
  await expect(page.locator('.template-dialog-item')).toHaveCount(1);

  await page.locator('#templateCenterSearch').fill('');
  await page.locator('#templateCenterCategory').selectOption('Fishbone');
  await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  await page.locator('.template-favorite').click();
  await expect(page.locator('.template-favorite')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.waitForFunction(() => window.__dwEditorReady && typeof allTemplates !== 'undefined' && allTemplates.length >= 7);
  await page.locator('.template-btn').click();
  await page.locator('#templateFavoritesOnly').check();
  await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  await expect(page.locator('.template-dialog-item-name')).toContainText(/Fishbone|鱼骨/);
});

test('Fishbone branches remain editable after creation', async ({ page }) => {
  await page.locator('#templateCenterSearch').fill('Fishbone');
  await page.locator('.template-card-apply').click();
  await expect(page.locator('.node')).toHaveCount(7);
  const branchId = await page.evaluate(() => state.nodes.find(node => node.label === '人员')?.id);
  const before = await page.evaluate(id => state.nodes.find(node => node.id === id).x, branchId);
  await page.evaluate(id => selectNode(id), branchId);
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(id => state.nodes.find(node => node.id === id).x, branchId)).toBe(before + 1);
});

test('Swimlane nodes and lane metadata remain editable and serializable', async ({ page }) => {
  await page.locator('#templateCenterSearch').fill('Swimlane');
  await page.locator('.template-card-apply').click();
  await expect(page.locator('.node')).toHaveCount(6);
  const nodeId = await page.evaluate(() => state.nodes.find(node => node.lane === 1)?.id);
  await page.evaluate(id => selectNode(id), nodeId);
  await page.keyboard.press('Shift+ArrowDown');
  const result = await page.evaluate(id => {
    const node = state.nodes.find(item => item.id === id);
    const saved = getFlowDocumentPayload().pages[0].nodes.find(item => item.id === id);
    return { y: node.y, lane: node.lane, savedY: saved.y, savedLane: saved.lane };
  }, nodeId);
  expect(result.savedY).toBe(result.y);
  expect(result.savedLane).toBe(result.lane);
});
