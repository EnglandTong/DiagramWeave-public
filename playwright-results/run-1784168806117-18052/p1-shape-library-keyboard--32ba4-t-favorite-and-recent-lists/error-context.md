# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-shape-library.spec.js >> keyboard favorite and insertion update persistent favorite and recent lists
- Location: tests\e2e\p1-shape-library.spec.js:20:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#shapeFavorites .shape-quick-item')
Expected substring: "判断"
Received string:    "Decision"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#shapeFavorites .shape-quick-item')
    10 × locator resolved to <button type="button" class="shape-quick-item">Decision</button>
       - unexpected value "Decision"

```

```yaml
- button "Decision"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   await page.addInitScript(() => sessionStorage.setItem('dw-initial-save-prompted', '1'));
  5  |   await page.goto('/flowchart-editor.html');
  6  |   await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeave?.shapePacks?.list().length > 10);
  7  | });
  8  | 
  9  | test('category collapse preserves search and registry searches metadata', async ({ page }) => {
  10 |   const section = page.locator('.sidebar-section').filter({ has: page.locator('.shape-item[data-shape="rectangle"]') });
  11 |   const title = section.locator('.sidebar-section-title');
  12 |   await title.click();
  13 |   await expect(section).toHaveClass(/collapsed/);
  14 |   await page.locator('#shapeLibrarySearch').fill('rectangle');
  15 |   await expect(section).toHaveClass(/collapsed/);
  16 |   expect(await page.locator('#shapeLibrarySearch').inputValue()).toBe('rectangle');
  17 |   expect(await page.evaluate(() => DiagramWeave.shapePacks.search('rectangle').some(item => item.id === 'rectangle'))).toBe(true);
  18 | });
  19 | 
  20 | test('keyboard favorite and insertion update persistent favorite and recent lists', async ({ page }) => {
  21 |   const shape = page.locator('.shape-item[data-shape="diamond"]');
  22 |   await shape.focus();
  23 |   await page.keyboard.press('f');
  24 |   await expect(shape).toHaveClass(/favorite/);
> 25 |   await expect(page.locator('#shapeFavorites .shape-quick-item')).toContainText('判断');
     |                                                                   ^ Error: expect(locator).toContainText(expected) failed
  26 |   await page.keyboard.press('Enter');
  27 |   await expect(page.locator('.node')).toHaveCount(1);
  28 |   await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText('判断');
  29 | 
  30 |   await page.reload();
  31 |   await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeave?.shapePacks);
  32 |   await expect(page.locator('.shape-item[data-shape="diamond"]')).toHaveClass(/favorite/);
  33 |   await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText('判断');
  34 | });
  35 | 
  36 | test('double click inserts at visible canvas center and updates recent ordering', async ({ page }) => {
  37 |   await page.locator('.shape-item[data-shape="rectangle"]').dblclick();
  38 |   await page.locator('.shape-item[data-shape="diamond"]').dblclick();
  39 |   await expect(page.locator('.node')).toHaveCount(2);
  40 |   const centered = await page.evaluate(() => {
  41 |     const node = state.nodes.at(-1);
  42 |     const viewportX = (node.x + node.w / 2) * state.zoom + state.panX;
  43 |     const viewportY = (node.y + node.h / 2) * state.zoom + state.panY;
  44 |     return { viewportX, viewportY, width: canvasWrapper.clientWidth, height: canvasWrapper.clientHeight };
  45 |   });
  46 |   expect(centered.viewportX).toBeCloseTo(centered.width / 2, 0);
  47 |   expect(centered.viewportY).toBeCloseTo(centered.height / 2, 0);
  48 |   await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText('判断');
  49 | });
  50 | 
  51 | test('tablet shape actions meet 44px touch targets', async ({ page }) => {
  52 |   await page.setViewportSize({ width: 768, height: 1024 });
  53 |   await page.locator('.tablet-drawer-toggle').first().click();
  54 |   const shape = page.locator('.shape-item').first();
  55 |   await expect(shape).toBeVisible();
  56 |   const shapeBox = await shape.boundingBox();
  57 |   expect(shapeBox.height).toBeGreaterThanOrEqual(44);
  58 |   await shape.hover();
  59 |   const favoriteBox = await shape.locator('.shape-favorite-btn').boundingBox();
  60 |   expect(favoriteBox.height).toBeGreaterThanOrEqual(44);
  61 | });
  62 | 
```