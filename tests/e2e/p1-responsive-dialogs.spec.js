import { expect, test } from '@playwright/test';

const seed = [{ id: 'responsive-node', shape: 'rectangle', x: 140, y: 120, w: 140, h: 60, label: 'View only' }];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(nodes => {
    sessionStorage.setItem('dw-initial-save-prompted', '1');
    sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(nodes));
  }, seed);
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 1);
});

test('phone mode is view-only while search, presentation, and review entries remain', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.mobile-mode-bar')).toBeVisible();
  await expect(page.locator('.toolbar')).toBeHidden();
  await expect(page.locator('.sidebar')).toBeHidden();

  const before = await page.evaluate(() => JSON.stringify(state.nodes));
  await page.evaluate(() => selectNode('responsive-node'));
  await page.keyboard.press('Delete');
  expect(await page.evaluate(() => JSON.stringify(state.nodes))).toBe(before);
  expect(await page.evaluate(() => insertShapeFromLibrary(document.querySelector('.shape-item')))).toBeNull();

  await page.locator('.mobile-mode-bar button').filter({ hasText: /搜索/ }).click();
  const commandIds = await page.evaluate(() => collectPaletteItems('').filter(item => item.kind === 'command').map(item => item.id));
  expect(commandIds.some(id => /^(tool\.|edit\.|layout\.|template\.|project\.(blank|import))/.test(id))).toBe(false);
  await page.keyboard.press('Escape');

  let reviewOpened = false;
  await page.evaluate(() => window.addEventListener('DiagramWeave:open-review', () => { window.__reviewOpened = true; }, { once: true }));
  await page.locator('.mobile-mode-bar button').filter({ hasText: /审阅/ }).click();
  reviewOpened = await page.evaluate(() => window.__reviewOpened === true);
  expect(reviewOpened).toBe(true);
  await expect(page.locator('#reviewOverlay')).toHaveClass(/visible/);
  await page.getByRole('button', { name: 'Close review' }).click();
  await page.locator('.mobile-mode-bar button').filter({ hasText: /演示/ }).click();
  await expect(page.locator('body')).toHaveClass(/presentation-mode/);
});

test('tablet drawers and desktop columns remain bounded in both languages', async ({ page }) => {
  for (const locale of ['en', 'zh-CN']) {
    await page.evaluate(code => setAppLanguage(code), locale);
    await page.setViewportSize({ width: 768, height: 1024 });
    const toggles = page.locator('.tablet-drawer-toggle');
    await expect(toggles.first()).toBeVisible();
    expect((await toggles.first().boundingBox()).height).toBeGreaterThanOrEqual(44);
    await toggles.first().click();
    await expect(page.locator('.sidebar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);

    await page.setViewportSize({ width: 1440, height: 900 });
    const boxes = await page.evaluate(() => ['.sidebar', '.canvas-wrapper', '.properties-panel'].map(selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    }));
    expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left);
    expect(boxes[1].right).toBeLessThanOrEqual(boxes[2].left);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  }
});

async function assertModalContract(page, trigger, overlayId) {
  await trigger.focus();
  await trigger.click();
  const overlay = page.locator(`#${overlayId}`);
  await expect(overlay).toHaveClass(/visible/);
  const dialog = overlay.locator('[role="dialog"]');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
  await expect(page.locator('.main-layout')).toHaveJSProperty('inert', true);
  const focusedInside = await page.evaluate(id => document.getElementById(id).contains(document.activeElement), overlayId);
  expect(focusedInside).toBe(true);
  await page.keyboard.press('Escape');
  await expect(overlay).not.toHaveClass(/visible/);
  await expect(trigger).toBeFocused();
  await expect(page.locator('.main-layout')).toHaveJSProperty('inert', false);
}

test('standard dialogs satisfy title, inert, Escape, and focus restoration contracts', async ({ page }) => {
  await assertModalContract(page, page.locator('.template-btn'), 'templateOverlay');
  await assertModalContract(page, page.locator('button[onclick="showExportDialog()"]'), 'exportOverlay');
  await assertModalContract(page, page.locator('button[onclick="showSettingsDialog()"]'), 'settingsOverlay');
  await assertModalContract(page, page.locator('button[onclick="showLayoutDialog()"]'), 'layoutOverlay');
  await assertModalContract(page, page.locator('button[onclick="showExcelDataDialog()"]'), 'excelDataOverlay');

  const trigger = page.locator('#btn-select');
  await trigger.focus();
  await page.evaluate(() => showConfirm('Confirm title', 'Message', () => {}));
  await expect(page.locator('#confirmOverlay [role="dialog"]')).toHaveAttribute('aria-labelledby', /.+/);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('command, import, and mapping dialogs lock focus and restore their triggers', async ({ page }) => {
  const trigger = page.locator('#btn-select');
  await trigger.focus();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#commandPaletteOverlay')).toHaveClass(/visible/);
  await expect(page.locator('.main-layout')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();

  await trigger.focus();
  await page.evaluate(() => showImportPreview(createImportPreview({ version: 1, nodes: [], connections: [] }), { sourceName: 'QA' }));
  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/);
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.getElementById('importPreviewOverlay').contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();

  await trigger.focus();
  await page.evaluate(() => startMappingWizard({ sourceName: 'QA', nodeRows: [{ Key: 'a', Name: 'A' }], connectionRows: [] }));
  await expect(page.locator('#mappingWizardOverlay')).toHaveClass(/visible/);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.getElementById('mappingWizardOverlay').contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('icon tooltips are available on keyboard focus', async ({ page }) => {
  const button = page.locator('button[onclick="showExportDialog()"]');
  await button.focus();
  await expect(page.locator('#fcTooltip')).toHaveClass(/visible/);
  await expect(page.locator('#fcTooltip')).not.toHaveText('');
});
