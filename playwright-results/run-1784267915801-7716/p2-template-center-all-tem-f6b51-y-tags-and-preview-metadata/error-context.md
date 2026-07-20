# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-template-center.spec.js >> all templates expose bilingual category, tags, and preview metadata
- Location: tests\e2e\p2-template-center.spec.js:11:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
Call log:
  - navigating to "http://127.0.0.1:4173/flowchart-editor.html", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "无法访问此网站" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: 拒绝了我们的连接请求。
    - generic [ref=e10]:
      - paragraph [ref=e11]: 请试试以下办法：
      - list [ref=e12]:
        - listitem [ref=e13]: 检查网络连接
        - listitem [ref=e14]:
          - link "检查代理服务器和防火墙" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "重新加载" [ref=e19] [cursor=pointer]
    - button "详情" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   await page.addInitScript(() => sessionStorage.setItem('dw-initial-save-prompted', '1'));
> 5  |   await page.goto('/flowchart-editor.html');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  6  |   await page.waitForFunction(() => window.__dwEditorReady && typeof allTemplates !== 'undefined' && allTemplates.length >= 7);
  7  |   await page.locator('.template-btn').click();
  8  |   await expect(page.locator('#templateOverlay')).toHaveClass(/visible/);
  9  | });
  10 | 
  11 | test('all templates expose bilingual category, tags, and preview metadata', async ({ page }) => {
  12 |   const invalid = await page.evaluate(() => allTemplates.filter(template =>
  13 |     !template.name || !template.nameEn || !template.description || !template.descriptionEn ||
  14 |     !template.category || !Array.isArray(template.tags) || !template.tags.length ||
  15 |     !template.preview || !Number.isFinite(template.preview.nodeCount)));
  16 |   expect(invalid).toEqual([]);
  17 |   await expect(page.locator('.template-dialog-item')).toHaveCount(await page.evaluate(() => allTemplates.length));
  18 |   await expect(page.locator('.template-item-meta').first()).toContainText(/nodes/);
  19 | });
  20 | 
  21 | test('searches Chinese and English, filters categories, and persists favorites', async ({ page }) => {
  22 |   await page.locator('#templateCenterSearch').fill('Fishbone');
  23 |   await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  24 |   await expect(page.locator('.template-dialog-item-name')).toContainText(/Fishbone|鱼骨/);
  25 |   await page.locator('#templateCenterSearch').fill('鱼骨');
  26 |   await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  27 | 
  28 |   await page.locator('#templateCenterSearch').fill('');
  29 |   await page.locator('#templateCenterCategory').selectOption('Fishbone');
  30 |   await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  31 |   await page.locator('.template-favorite').click();
  32 |   await expect(page.locator('.template-favorite')).toHaveAttribute('aria-pressed', 'true');
  33 |   await page.reload();
  34 |   await page.waitForFunction(() => window.__dwEditorReady && typeof allTemplates !== 'undefined' && allTemplates.length >= 7);
  35 |   await page.locator('.template-btn').click();
  36 |   await page.locator('#templateFavoritesOnly').check();
  37 |   await expect(page.locator('.template-dialog-item')).toHaveCount(1);
  38 |   await expect(page.locator('.template-dialog-item-name')).toContainText(/Fishbone|鱼骨/);
  39 | });
  40 | 
  41 | test('Fishbone branches remain editable after creation', async ({ page }) => {
  42 |   await page.locator('#templateCenterSearch').fill('Fishbone');
  43 |   await page.locator('.template-card-apply').click();
  44 |   await expect(page.locator('.node')).toHaveCount(7);
  45 |   const branchId = await page.evaluate(() => state.nodes.find(node => node.label === '人员')?.id);
  46 |   const before = await page.evaluate(id => state.nodes.find(node => node.id === id).x, branchId);
  47 |   await page.evaluate(id => selectNode(id), branchId);
  48 |   await page.keyboard.press('ArrowRight');
  49 |   expect(await page.evaluate(id => state.nodes.find(node => node.id === id).x, branchId)).toBe(before + 1);
  50 | });
  51 | 
  52 | test('Swimlane nodes and lane metadata remain editable and serializable', async ({ page }) => {
  53 |   await page.locator('#templateCenterSearch').fill('Swimlane');
  54 |   await page.locator('.template-card-apply').click();
  55 |   await expect(page.locator('.node')).toHaveCount(6);
  56 |   const nodeId = await page.evaluate(() => state.nodes.find(node => node.lane === 1)?.id);
  57 |   await page.evaluate(id => selectNode(id), nodeId);
  58 |   await page.keyboard.press('Shift+ArrowDown');
  59 |   const result = await page.evaluate(id => {
  60 |     const node = state.nodes.find(item => item.id === id);
  61 |     const saved = getFlowDocumentPayload().pages[0].nodes.find(item => item.id === id);
  62 |     return { y: node.y, lane: node.lane, savedY: saved.y, savedLane: saved.lane };
  63 |   }, nodeId);
  64 |   expect(result.savedY).toBe(result.y);
  65 |   expect(result.savedLane).toBe(result.lane);
  66 | });
  67 | 
```