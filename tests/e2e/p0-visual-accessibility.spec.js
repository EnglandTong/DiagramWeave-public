import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function prepare(page, { suppressInitialPrompt = true } = {}) {
  await page.addInitScript(({ suppress }) => {
    window.__dwSkipRemoteBootstrap = true;
    if (suppress) window.sessionStorage.setItem('dw-initial-save-prompted', '1');
  }, { suppress: suppressInitialPrompt });
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady === true, null, { timeout: 90000 });
}

async function expectVisual(page, name) {
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
}

test.describe('P0 visual and accessibility gate', () => {
  test('canonical theme tokens are parsed by the browser', async ({ page }) => {
    await prepare(page);
    const tokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return ['--bg-base', '--text-primary', '--accent', '--radius-sm', '--shadow-md']
        .map(name => [name, styles.getPropertyValue(name).trim()]);
    });
    for (const [name, value] of tokens) {
      expect(value, `${name} must be available`).not.toBe('');
    }
  });

  test('initial entry and blank canvas visual baselines', async ({ page }) => {
    await prepare(page, { suppressInitialPrompt: false });
    await expect(page.locator('#confirmOverlay')).not.toHaveClass(/visible/);
    await expect(page.locator('#canvasEmptyState')).toBeVisible();
    await expectVisual(page, 'desktop-initial-entry.png');
    await page.evaluate(() => dismissCanvasEmptyState());
    await expectVisual(page, 'desktop-blank-canvas-v2.png');
  });

  test('template, applied template, selected node, and export baselines', async ({ page }) => {
    await prepare(page);
    await page.evaluate(() => showTemplateDialog());
    await expect(page.locator('.template-dialog-item')).toHaveCount(
      await page.evaluate(() => allTemplates.length)
    );
    await expectVisual(page, 'desktop-template-center.png');

    await page.locator('.template-card-apply').first().click();
    await expect(page.locator('.node').first()).toBeVisible();
    await expectVisual(page, 'desktop-template-applied.png');

    await page.locator('.node').first().click();
    await expectVisual(page, 'desktop-node-selected.png');

    await page.evaluate(() => showExportDialog());
    await expectVisual(page, 'desktop-export-dialog.png');
  });

  test('phone and tablet visual baselines', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page);
    await expectVisual(page, 'phone-390x844.png');

    await page.setViewportSize({ width: 768, height: 1024 });
    await expectVisual(page, 'tablet-768x1024.png');
  });

  test('has no serious or critical automated accessibility violations', async ({ page }) => {
    await prepare(page);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(blocking).toEqual([]);
  });

  test('template node labels maintain readable contrast', async ({ page }) => {
    await prepare(page);
    await page.evaluate(() => showTemplateDialog());
    await page.locator('.template-card-apply').first().click();
    const ratios = await page.locator('.node').evaluateAll(nodes => nodes.map(node => {
      const shape = node.querySelector('.node-shape');
      const label = node.querySelector('.node-label');
      const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = rgb => rgb.map(v => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      }).reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
      const a = luminance(parse(getComputedStyle(shape).backgroundColor));
      const b = luminance(parse(getComputedStyle(label).color));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }));
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  });
});
