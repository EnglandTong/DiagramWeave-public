import { expect, test } from '@playwright/test';

const seedNodes = [
  { id: 'nav-a', shape: 'rectangle', x: 40, y: 50, w: 120, h: 60, label: 'Draft', role: 'Writer' },
  { id: 'nav-b', shape: 'diamond', x: 360, y: 190, w: 120, h: 80, label: 'Review', role: 'QA' },
  { id: 'nav-c', shape: 'rectangle', x: 760, y: 390, w: 140, h: 60, label: 'Publish', role: 'Writer' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(nodes => {
    sessionStorage.setItem('dw-initial-save-prompted', '1');
    sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(nodes));
  }, seedNodes);
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 3);
});

test('minimap paints nodes and viewport, and Outline filters then centers a node', async ({ page }) => {
  const paintedPixels = await page.locator('#canvasMinimap').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const first = data.slice(0, 4).join(',');
    let changed = 0;
    for (let index = 4; index < data.length; index += 4) {
      if (data.slice(index, index + 4).join(',') !== first) changed += 1;
    }
    return changed;
  });
  expect(paintedPixels).toBeGreaterThan(50);

  await page.locator('[aria-label*="Outline"], [title="Outline"]').first().click();
  await expect(page.locator('#outlinePanel')).toHaveClass(/visible/);
  await page.locator('#outlineSearch').fill('Review');
  await expect(page.locator('.outline-node')).toHaveCount(1);
  const before = await page.evaluate(() => ({ x: state.nodes[1].x, y: state.nodes[1].y }));
  await page.locator('.outline-node').click();
  await expect(page.locator('#nav-b')).toHaveClass(/selected/);
  expect(await page.evaluate(() => ({ x: state.nodes[1].x, y: state.nodes[1].y }))).toEqual(before);
});

test('fit commands update viewport and are available from command registry', async ({ page }) => {
  const commandIds = await page.evaluate(() => DiagramWeave.commands.listCommands(getCommandContext()).map(item => item.id));
  expect(commandIds).toEqual(expect.arrayContaining(['view.fitAll', 'view.resetZoom', 'view.outline']));
  expect(commandIds).not.toContain('view.fitSelection');

  await page.evaluate(() => { state.zoom = 2; state.panX = 500; state.panY = 400; updateTransform(); });
  await page.locator('.canvas-nav-toolbar button').nth(2).click();
  expect(await page.evaluate(() => state.zoom)).toBe(1);

  await page.evaluate(() => selectNode('nav-c'));
  expect(await page.evaluate(() => DiagramWeave.commands.listCommands(getCommandContext()).map(item => item.id)))
    .toContain('view.fitSelection');
  await page.locator('.canvas-nav-toolbar button').nth(1).click();
  expect(await page.evaluate(() => state.zoom)).toBeGreaterThan(1);
  await page.locator('.canvas-nav-toolbar button').first().click();
  expect(await page.evaluate(() => state.zoom)).toBeLessThanOrEqual(1.5);
});

test('six alignment modes and two distribution modes operate on multi-selection', async ({ page }) => {
  await page.evaluate(() => {
    selectNode('nav-a'); selectNode('nav-b', true); selectNode('nav-c', true);
  });
  await expect(page.locator('.node.selected')).toHaveCount(3);

  for (const mode of ['left', 'center', 'right', 'top', 'middle', 'bottom']) {
    await page.locator('#alignNodesSelect').selectOption(mode);
    const values = await page.evaluate(selectedMode => state.nodes.map(node => {
      if (selectedMode === 'left') return node.x;
      if (selectedMode === 'center') return node.x + node.w / 2;
      if (selectedMode === 'right') return node.x + node.w;
      if (selectedMode === 'top') return node.y;
      if (selectedMode === 'middle') return node.y + node.h / 2;
      return node.y + node.h;
    }), mode);
    expect(new Set(values).size).toBe(1);
  }

  await page.evaluate(nodes => { state.nodes.forEach((node, index) => Object.assign(node, nodes[index])); renderAll(); }, seedNodes);
  await page.locator('#distributeNodesSelect').selectOption('horizontal');
  const horizontal = await page.evaluate(() => state.nodes.map(node => node.x + node.w / 2).sort((a, b) => a - b));
  expect(horizontal[1] - horizontal[0]).toBeCloseTo(horizontal[2] - horizontal[1]);
  await page.locator('#distributeNodesSelect').selectOption('vertical');
  const vertical = await page.evaluate(() => state.nodes.map(node => node.y + node.h / 2).sort((a, b) => a - b));
  expect(vertical[1] - vertical[0]).toBeCloseTo(vertical[2] - vertical[1]);
});

test('tablet canvas navigation controls meet 44px touch target', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const controls = page.locator('.canvas-nav-toolbar button, .canvas-nav-toolbar select');
  await expect(controls.first()).toBeVisible();
  const boxes = await controls.evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
  expect(boxes.every(height => height >= 44)).toBe(true);
});
