import { test, expect } from '@playwright/test';

test.describe('DiagramWeave smoke', () => {
  test('loads blank canvas', async ({ page }) => {
    await page.goto('/flowchart-editor.html');
    await expect(page.locator('#canvasWrapper')).toBeVisible();
    await expect(page.locator('.node')).toHaveCount(0);
    await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  });

  test('can add and delete page', async ({ page }) => {
    await page.goto('/flowchart-editor.html');
    await page.locator('.page-tab-add').first().click();
    await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(2);
    page.once('dialog', d => d.accept());
    await page.locator('.page-tab-wrap.active .page-tab-close').click();
    await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  });

  test('template library loads starter template', async ({ page }) => {
    await page.goto('/flowchart-editor.html');
    await page.waitForLoadState('networkidle');
    await page.locator('.template-btn').click();
    await expect(page.locator('.template-dialog-item')).toHaveCount(1);
    await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  });
});
