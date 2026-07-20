import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('dw-initial-save-prompted', '1'));
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.DiagramWeave?.commands?.listCommands().length > 0);
});

test('command palette opens, searches and restores focus', async ({ page }) => {
  const select = page.locator('#btn-select');
  await select.focus();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#commandPaletteOverlay')).toHaveClass(/visible/);
  await expect(page.locator('#commandPaletteInput')).toBeFocused();
  await expect(page.locator('.main-layout')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.command-palette-item').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#commandPaletteInput')).toBeFocused();
  await page.locator('#commandPaletteInput').fill('Export');
  await expect(page.locator('.command-palette-item')).toContainText('Export');
  await page.keyboard.press('Escape');
  await expect(page.locator('#commandPaletteOverlay')).not.toHaveClass(/visible/);
  await expect(select).toBeFocused();
  await expect(page.locator('.main-layout')).toHaveJSProperty('inert', false);
});

test('focused shapes insert with Enter and Space', async ({ page }) => {
  const shapes = page.locator('.shape-item');
  await shapes.first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.node')).toHaveCount(1);
  await expect(page.locator('.node').first()).toHaveClass(/selected/);

  await shapes.nth(1).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.node')).toHaveCount(2);
});

test('blank start is non-blocking and shape search filters items', async ({ page }) => {
  await expect(page.locator('#canvasEmptyState')).toBeVisible();
  await page.locator('#canvasEmptyState button').last().click();
  await expect(page.locator('#canvasEmptyState')).toBeHidden();
  const shapes = page.locator('.shape-item');
  const total = await shapes.count();
  await page.locator('#shapeLibrarySearch').fill('diamond');
  const visible = await shapes.evaluateAll(items => items.filter(item => !item.hidden).length);
  expect(visible).toBeLessThan(total);
});

test('mobile is view-oriented and tablet exposes 44px drawers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.properties-panel')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.setViewportSize({ width: 768, height: 1024 });
  const toggle = page.locator('.tablet-drawer-toggle').first();
  await expect(toggle).toBeVisible();
  const box = await toggle.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await toggle.click();
  await expect(page.locator('body')).toHaveClass(/shapes-drawer-open/);
});
