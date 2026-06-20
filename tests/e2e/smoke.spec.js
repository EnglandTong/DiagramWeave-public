import { test, expect } from '@playwright/test';

test.describe('DiagramWeave smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('dw-initial-save-prompted', '1');
      window.__dwSkipRemoteBootstrap = true;
    });
  });

  async function waitForEditorReady(page, url = '/flowchart-editor.html') {
    await page.goto(url);
    await page.waitForSelector('#canvasWrapper', { state: 'visible' });
    await page.waitForFunction(() => window.__dwEditorReady === true, null, { timeout: 90000 });
  }

  test('loads blank canvas', async ({ page }) => {
    await waitForEditorReady(page);
    await expect(page.locator('#canvasWrapper')).toBeVisible();
    await expect(page.locator('.node')).toHaveCount(0);
    await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  });

  test('can add and delete page', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('.page-tab-add').first().click();
    await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(2);
    page.once('dialog', (d) => d.accept());
    await page.locator('.page-tab-wrap.active .page-tab-close').click();
    await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  });

  test('template library loads starter template', async ({ page }) => {
    await waitForEditorReady(page);
    await page.locator('.template-btn').click();
    await expect(page.locator('.template-dialog-item')).toHaveCount(7, { timeout: 30000 });
    await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  });

  test('highlightNode deep link selects the target node', async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        'dw-e2e-seed-nodes',
        JSON.stringify([
          {
            id: 'e2e-highlight-node',
            label: 'Deep Link Target',
            shape: 'rectangle',
            x: 120,
            y: 100,
          },
        ]),
      );
    });
    await waitForEditorReady(page, '/flowchart-editor.html?highlightNode=e2e-highlight-node');
    const selectedId = await page.evaluate(() => state.selectedNodeId);
    expect(selectedId).toBe('e2e-highlight-node');
    await expect(page.locator('#e2e-highlight-node.selected')).toBeVisible();
  });

  test('excel import buttons prefer the file picker path', async ({ page }) => {
    await page.addInitScript(() => {
      window.__dwPickerCalls = 0;
      Object.defineProperty(window, 'showOpenFilePicker', {
        configurable: true,
        writable: true,
        value: async () => {
          window.__dwPickerCalls += 1;
          throw { name: 'AbortError' };
        },
      });
      HTMLInputElement.prototype.showPicker = function () {
        throw new Error('showPicker fallback should not be used in this test');
      };
      HTMLInputElement.prototype.click = function () {
        throw new Error('click fallback should not be used in this test');
      };
    });

    await page.goto('/flowchart-editor.html');
    await page.evaluate(() => triggerExcelUpload());
    await page.evaluate(() => triggerProjectExcelUpload());

    await expect.poll(async () => page.evaluate(() => window.__dwPickerCalls)).toBe(2);
  });
});
