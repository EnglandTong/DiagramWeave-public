import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('dw-initial-save-prompted', '1'));
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeave?.shapePacks?.list().length > 10);
});

test('category collapse preserves search and registry searches metadata', async ({ page }) => {
  const section = page.locator('.sidebar-section').filter({ has: page.locator('.shape-item[data-shape="rectangle"]') });
  const title = section.locator('.sidebar-section-title');
  await title.click();
  await expect(section).toHaveClass(/collapsed/);
  await page.locator('#shapeLibrarySearch').fill('rectangle');
  await expect(section).toHaveClass(/collapsed/);
  expect(await page.locator('#shapeLibrarySearch').inputValue()).toBe('rectangle');
  expect(await page.evaluate(() => DiagramWeave.shapePacks.search('rectangle').some(item => item.id === 'rectangle'))).toBe(true);
});

test('keyboard favorite and insertion update persistent favorite and recent lists', async ({ page }) => {
  const shape = page.locator('.shape-item[data-shape="diamond"]');
  await shape.focus();
  await page.keyboard.press('f');
  await expect(shape).toHaveClass(/favorite/);
  await expect(page.locator('#shapeFavorites .shape-quick-item')).toContainText(/Decision|判断/);
  await page.keyboard.press('Enter');
  await expect(page.locator('.node')).toHaveCount(1);
  await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText(/Decision|判断/);

  await page.reload();
  await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeave?.shapePacks);
  await expect(page.locator('.shape-item[data-shape="diamond"]')).toHaveClass(/favorite/);
  await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText(/Decision|判断/);
});

test('double click inserts at visible canvas center and updates recent ordering', async ({ page }) => {
  await page.locator('.shape-item[data-shape="rectangle"]').dblclick();
  await page.locator('.shape-item[data-shape="diamond"]').dblclick();
  await expect(page.locator('.node')).toHaveCount(2);
  const centered = await page.evaluate(() => {
    const node = state.nodes.at(-1);
    const viewportX = (node.x + node.w / 2) * state.zoom + state.panX;
    const viewportY = (node.y + node.h / 2) * state.zoom + state.panY;
    return { viewportX, viewportY, width: canvasWrapper.clientWidth, height: canvasWrapper.clientHeight };
  });
  expect(centered.viewportX).toBeCloseTo(centered.width / 2, 0);
  expect(centered.viewportY).toBeCloseTo(centered.height / 2, 0);
  await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText(/Decision|判断/);
});

test('tablet shape actions meet 44px touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator('.tablet-drawer-toggle').first().click();
  const shape = page.locator('.shape-item').first();
  await expect(shape).toBeVisible();
  const shapeBox = await shape.boundingBox();
  expect(shapeBox.height).toBeGreaterThanOrEqual(44);
  await shape.hover();
  const favoriteBox = await shape.locator('.shape-favorite-btn').boundingBox();
  expect(favoriteBox.height).toBeGreaterThanOrEqual(44);
});
