import { test, expect } from '@playwright/test';

const validPack = {
  id: 'qa_ops', name: 'QA Operations', version: '1.0', shapes: [{
    id: 'qa_queue', label: 'QA Queue', section: 'Operations', renderAs: 'rectangle',
    sidebarSvg: '<svg viewBox="0 0 40 40"><rect x="4" y="8" width="32" height="24" fill="none" stroke="#2563eb"/></svg>',
  }],
};

async function prepare(page) {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; localStorage.clear(); sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady && DiagramWeave?.stencilPacks);
}

test('imports, uses, disables, renames, and exports a local stencil pack', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => showStencilManager());
  await page.locator('#stencilPackInput').setInputFiles({ name: 'qa.stencil.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(validPack)) });
  await expect(page.locator('.stencil-pack-row')).toHaveCount(1);
  await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toBeVisible();
  await page.evaluate(() => hideStencilManager());
  await page.locator('.shape-item[data-shape="qa_queue"]').dblclick();
  await expect.poll(() => page.evaluate(() => state.nodes.filter(node => node.shape === 'qa_queue').length)).toBe(1);
  await page.evaluate(() => { if (document.getElementById('confirmOverlay')?.classList.contains('visible')) hideConfirm(); });

  await page.evaluate(() => showStencilManager());
  await page.locator('.stencil-pack-row input[type="text"]').fill('Renamed Operations');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  expect((await download).suggestedFilename()).toBe('qa_ops.stencil.json');
  await expect.poll(() => page.evaluate(() => DiagramWeave.stencilPacks.list()[0].name)).toBe('Renamed Operations');
  await page.locator('.stencil-pack-row input[type="checkbox"]').uncheck();
  await expect(page.locator('.shape-item[data-shape="qa_queue"]')).toHaveCount(0);
  expect(await page.evaluate(() => DiagramWeave.shapePacks.get('qa_queue'))).toBeNull();
});

test('rejects an unsafe pack without mutating the shape library', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => showStencilManager());
  const unsafe = { ...validPack, id: 'unsafe_pack', shapes: [{ id: 'unsafe_shape', label: 'Unsafe', sidebarSvg: '<svg onload="alert(1)"><rect/></svg>' }] };
  await page.locator('#stencilPackInput').setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unsafe)) });
  await expect(page.locator('#stencilPackIssues')).toContainText('safe SVG');
  await expect(page.locator('.stencil-pack-row')).toHaveCount(0);
  expect(await page.evaluate(() => DiagramWeave.shapePacks.get('unsafe_shape'))).toBeNull();
});
