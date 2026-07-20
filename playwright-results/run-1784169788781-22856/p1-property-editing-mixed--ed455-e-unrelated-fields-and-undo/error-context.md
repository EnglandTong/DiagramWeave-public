# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-property-editing.spec.js >> mixed values are explicit and batch edits preserve unrelated fields and undo
- Location: tests\e2e\p1-property-editing.spec.js:30:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#propRole')
Expected: "Mixed"
Received: "e.g. Applicant, Approver"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('#propRole')
    14 × locator resolved to <input id="propRole" class="prop-input" data-mixed="false" data-i18n-placeholder="prop.rolePh" onchange="updatePropRole(this.value)" placeholder="e.g. Applicant, Approver"/>
       - unexpected value "e.g. Applicant, Approver"

```

```yaml
- textbox "e.g. Applicant, Approver"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const nodes = [
  4  |   { id: 'prop-a', shape: 'rectangle', x: 100, y: 100, w: 140, h: 60, label: 'Draft', role: 'Writer', fillColor: '#ffffff', strokeColor: '#000000', textColor: 'auto', detail: 'keep-a' },
  5  |   { id: 'prop-b', shape: 'diamond', x: 380, y: 220, w: 120, h: 80, label: 'Review', role: 'QA', fillColor: '#fff2cc', strokeColor: '#44546a', textColor: '#111320', detail: 'keep-b' },
  6  | ];
  7  | 
  8  | test.beforeEach(async ({ page }) => {
  9  |   await page.addInitScript(seed => {
  10 |     sessionStorage.setItem('dw-initial-save-prompted', '1');
  11 |     sessionStorage.setItem('dw-e2e-seed-nodes', JSON.stringify(seed));
  12 |   }, nodes);
  13 |   await page.goto('/flowchart-editor.html');
  14 |   await page.waitForFunction(() => window.__dwEditorReady && document.querySelectorAll('.node').length === 2);
  15 | });
  16 | 
  17 | test('four property tabs expose the expected sections', async ({ page }) => {
  18 |   await page.evaluate(() => selectNode('prop-a'));
  19 |   const tabs = page.locator('[data-property-tab]');
  20 |   await expect(tabs).toHaveCount(4);
  21 |   await expect(page.locator('#propLabel')).toBeVisible();
  22 |   await tabs.filter({ hasText: /流程|Flow/ }).click();
  23 |   await expect(page.locator('#propRole')).toBeVisible();
  24 |   await tabs.filter({ hasText: /外观|Appearance/ }).click();
  25 |   await expect(page.locator('#propFillSwatches')).toBeVisible();
  26 |   await tabs.filter({ hasText: /数据|Data/ }).click();
  27 |   await expect(page.locator('#propLayer')).toBeVisible();
  28 | });
  29 | 
  30 | test('mixed values are explicit and batch edits preserve unrelated fields and undo', async ({ page }) => {
  31 |   await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); });
  32 |   await expect(page.locator('#propertyBatchStatus')).toContainText('2 nodes');
  33 |   await page.locator('[data-property-tab="flow"]').click();
> 34 |   await expect(page.locator('#propRole')).toHaveAttribute('placeholder', 'Mixed');
     |                                           ^ Error: expect(locator).toHaveAttribute(expected) failed
  35 |   await page.locator('#propRole').fill('Owner');
  36 |   await page.locator('#propRole').blur();
  37 |   expect(await page.evaluate(() => state.nodes.map(node => node.role))).toEqual(['Owner', 'Owner']);
  38 |   expect(await page.evaluate(() => state.nodes.map(node => node.detail))).toEqual(['keep-a', 'keep-b']);
  39 | 
  40 |   await page.locator('[data-property-tab="appearance"]').click();
  41 |   await page.locator('#propFillCustom').evaluate(input => { input.value = '#123456'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  42 |   expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#123456', '#123456']);
  43 |   await page.evaluate(() => undo());
  44 |   expect(await page.evaluate(() => state.nodes.map(node => node.fillColor))).toEqual(['#ffffff', '#fff2cc']);
  45 | });
  46 | 
  47 | test('batch appearance serializes and contextual toolbar duplicates and deletes', async ({ page }) => {
  48 |   await page.evaluate(() => { selectNode('prop-a'); selectNode('prop-b', true); updatePropTextColor('#ffffff'); });
  49 |   const serialized = await page.evaluate(() => getFlowDocumentPayload().pages[0].nodes.map(node => ({ textColor: node.textColor, detail: node.detail })));
  50 |   expect(serialized).toEqual([
  51 |     { textColor: '#ffffff', detail: 'keep-a' },
  52 |     { textColor: '#ffffff', detail: 'keep-b' },
  53 |   ]);
  54 | 
  55 |   await expect(page.locator('#nodeContextToolbar')).toBeVisible();
  56 |   await page.locator('#nodeContextToolbar button[aria-label*="复制"]').click();
  57 |   await expect(page.locator('.node')).toHaveCount(3);
  58 |   await page.locator('#nodeContextToolbar button[aria-label*="删除"]').click();
  59 |   await expect(page.locator('.node')).toHaveCount(2);
  60 | });
  61 | 
  62 | test('tablet property tabs and context actions meet touch target size', async ({ page }) => {
  63 |   await page.setViewportSize({ width: 768, height: 1024 });
  64 |   await page.evaluate(() => selectNode('prop-a'));
  65 |   await page.locator('.tablet-drawer-toggle').nth(1).click();
  66 |   const heights = await page.locator('.property-tabs button, #nodeContextToolbar button').evaluateAll(items =>
  67 |     items.filter(item => !item.hidden).map(item => item.getBoundingClientRect().height));
  68 |   expect(heights.length).toBeGreaterThan(4);
  69 |   expect(heights.every(height => height >= 44)).toBe(true);
  70 | });
  71 | 
```