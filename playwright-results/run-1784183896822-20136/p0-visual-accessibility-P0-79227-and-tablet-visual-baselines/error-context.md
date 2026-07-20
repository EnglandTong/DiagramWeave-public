# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-visual-accessibility.spec.js >> P0 visual and accessibility gate >> phone and tablet visual baselines
- Location: tests\e2e\p0-visual-accessibility.spec.js:61:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  Expected an image 390px by 844px, received 390px by 845px. 

  Snapshot: phone-390x844.png

Call log:
  - Expect "toHaveScreenshot(phone-390x844.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - Expected an image 390px by 844px, received 390px by 845px.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - Expected an image 390px by 844px, received 390px by 845px.

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation "移动查看工具" [ref=e2]:
    - button "适应全部" [ref=e3]: 适应
    - button "搜索流程" [ref=e4]: 搜索
    - button "开始演示" [ref=e5]: 演示
    - button "打开审阅" [ref=e6]: 审阅
  - generic [ref=e7]:
    - text: ▾ ▾ ▾
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "开始创建流程" [level=2] [ref=e10]
        - generic [ref=e11]:
          - button "从模板开始" [ref=e12] [cursor=pointer]
          - button "导入文件" [ref=e13] [cursor=pointer]
          - button "空白画布" [ref=e14] [cursor=pointer]
      - generic "画布小地图" [ref=e15]
      - generic [ref=e16]:
        - generic:
          - img
  - generic:
    - generic [ref=e17]:
      - generic [ref=e18]: 表格编辑
      - paragraph: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e19] [cursor=pointer]: 说明
      - generic [ref=e20]:
        - button "从画布同步到表格" [ref=e21] [cursor=pointer]:
          - img [ref=e22]
        - button "将表格内容应用到画布" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
        - button "关闭表格编辑" [ref=e28] [cursor=pointer]:
          - img [ref=e29]
    - generic:
      - generic [ref=e32]:
        - generic [ref=e33]:
          - button "编辑各步骤节点" [ref=e34] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e35] [cursor=pointer]: 连线表
        - generic [ref=e36]:
          - button "在表格末尾添加一行空节点" [ref=e37] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e38] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e39]:
          - rowgroup [ref=e40]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e41] [cursor=pointer]:
              - columnheader "编号" [ref=e42]
              - columnheader "简介" [ref=e43]
              - columnheader "去向" [ref=e44]
              - columnheader "角色" [ref=e45]
              - columnheader "图形" [ref=e46]
              - columnheader "详细说明" [ref=e47]
              - columnheader "耗时天" [ref=e48]
              - columnheader "泳道" [ref=e49]
              - columnheader "图层" [ref=e50]
              - columnheader "目标页" [ref=e51]
          - rowgroup
    - generic [ref=e52]:
      - strong [ref=e53]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e54]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e55]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e56]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e57]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e58]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
```

# Test source

```ts
  1  | import AxeBuilder from '@axe-core/playwright';
  2  | import { expect, test } from '@playwright/test';
  3  | 
  4  | async function prepare(page, { suppressInitialPrompt = true } = {}) {
  5  |   await page.addInitScript(({ suppress }) => {
  6  |     window.__dwSkipRemoteBootstrap = true;
  7  |     if (suppress) window.sessionStorage.setItem('dw-initial-save-prompted', '1');
  8  |   }, { suppress: suppressInitialPrompt });
  9  |   await page.goto('/flowchart-editor.html');
  10 |   await page.waitForFunction(() => window.__dwEditorReady === true, null, { timeout: 90000 });
  11 | }
  12 | 
  13 | async function expectVisual(page, name) {
> 14 |   await expect(page).toHaveScreenshot(name, {
     |                      ^ Error: expect(page).toHaveScreenshot(expected) failed
  15 |     animations: 'disabled',
  16 |     caret: 'hide',
  17 |     fullPage: true,
  18 |     maxDiffPixelRatio: 0.01,
  19 |   });
  20 | }
  21 | 
  22 | test.describe('P0 visual and accessibility gate', () => {
  23 |   test('canonical theme tokens are parsed by the browser', async ({ page }) => {
  24 |     await prepare(page);
  25 |     const tokens = await page.evaluate(() => {
  26 |       const styles = getComputedStyle(document.documentElement);
  27 |       return ['--bg-base', '--text-primary', '--accent', '--radius-sm', '--shadow-md']
  28 |         .map(name => [name, styles.getPropertyValue(name).trim()]);
  29 |     });
  30 |     for (const [name, value] of tokens) {
  31 |       expect(value, `${name} must be available`).not.toBe('');
  32 |     }
  33 |   });
  34 | 
  35 |   test('initial entry and blank canvas visual baselines', async ({ page }) => {
  36 |     await prepare(page, { suppressInitialPrompt: false });
  37 |     await expect(page.locator('#confirmOverlay')).not.toHaveClass(/visible/);
  38 |     await expect(page.locator('#canvasEmptyState')).toBeVisible();
  39 |     await expectVisual(page, 'desktop-initial-entry.png');
  40 |     await page.evaluate(() => dismissCanvasEmptyState());
  41 |     await expectVisual(page, 'desktop-blank-canvas.png');
  42 |   });
  43 | 
  44 |   test('template, applied template, selected node, and export baselines', async ({ page }) => {
  45 |     await prepare(page);
  46 |     await page.evaluate(() => showTemplateDialog());
  47 |     await expect(page.locator('.template-dialog-item')).toHaveCount(7);
  48 |     await expectVisual(page, 'desktop-template-center.png');
  49 | 
  50 |     await page.locator('.template-dialog-item').first().click();
  51 |     await expect(page.locator('.node').first()).toBeVisible();
  52 |     await expectVisual(page, 'desktop-template-applied.png');
  53 | 
  54 |     await page.locator('.node').first().click();
  55 |     await expectVisual(page, 'desktop-node-selected.png');
  56 | 
  57 |     await page.evaluate(() => showExportDialog());
  58 |     await expectVisual(page, 'desktop-export-dialog.png');
  59 |   });
  60 | 
  61 |   test('phone and tablet visual baselines', async ({ page }) => {
  62 |     await page.setViewportSize({ width: 390, height: 844 });
  63 |     await prepare(page);
  64 |     await expectVisual(page, 'phone-390x844.png');
  65 | 
  66 |     await page.setViewportSize({ width: 768, height: 1024 });
  67 |     await expectVisual(page, 'tablet-768x1024.png');
  68 |   });
  69 | 
  70 |   test('has no serious or critical automated accessibility violations', async ({ page }) => {
  71 |     await prepare(page);
  72 |     const results = await new AxeBuilder({ page }).analyze();
  73 |     const blocking = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  74 |     expect(blocking).toEqual([]);
  75 |   });
  76 | 
  77 |   test('template node labels maintain readable contrast', async ({ page }) => {
  78 |     await prepare(page);
  79 |     await page.evaluate(() => showTemplateDialog());
  80 |     await page.locator('.template-dialog-item').first().click();
  81 |     const ratios = await page.locator('.node').evaluateAll(nodes => nodes.map(node => {
  82 |       const shape = node.querySelector('.node-shape');
  83 |       const label = node.querySelector('.node-label');
  84 |       const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  85 |       const luminance = rgb => rgb.map(v => {
  86 |         const s = v / 255;
  87 |         return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  88 |       }).reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
  89 |       const a = luminance(parse(getComputedStyle(shape).backgroundColor));
  90 |       const b = luminance(parse(getComputedStyle(label).color));
  91 |       return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  92 |     }));
  93 |     expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  94 |   });
  95 | });
  96 | 
```