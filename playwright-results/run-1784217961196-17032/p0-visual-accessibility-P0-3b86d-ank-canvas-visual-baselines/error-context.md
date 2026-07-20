# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-visual-accessibility.spec.js >> P0 visual and accessibility gate >> initial entry and blank canvas visual baselines
- Location: tests\e2e\p0-visual-accessibility.spec.js:35:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  9225 pixels (ratio 0.02 of all image pixels) are different.

  Snapshot: desktop-blank-canvas.png

Call log:
  - Expect "toHaveScreenshot(desktop-blank-canvas.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 9225 pixels (ratio 0.02 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 9225 pixels (ratio 0.02 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - text: DiagramWeave
    - button "New Project" [ref=e7] [cursor=pointer]:
      - img [ref=e8]
    - button "Select (V)" [ref=e11] [cursor=pointer]:
      - img [ref=e12]
    - button "Connect (L)" [ref=e14] [cursor=pointer]:
      - img [ref=e15]
    - button "Pan canvas (H)" [ref=e19] [cursor=pointer]:
      - img [ref=e20]
    - button "Undo (Ctrl+Z)" [ref=e25] [cursor=pointer]:
      - img [ref=e26]
    - button "Redo (Ctrl+Y)" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
    - button "Table editor (T)" [ref=e33] [cursor=pointer]:
      - img [ref=e34]
    - button "Auto layout" [ref=e38] [cursor=pointer]:
      - img [ref=e39]
    - combobox "Connection routing" [ref=e44] [cursor=pointer]:
      - option "Curved"
      - option "Orthogonal"
      - option "Avoid obstacles"
      - option "Straight"
      - option "Visio-style" [selected]
    - button "Connection rules" [ref=e45] [cursor=pointer]: Rules
    - button "Delete selection (Delete)" [ref=e47] [cursor=pointer]:
      - img [ref=e48]
    - button "Clear canvas" [ref=e50] [cursor=pointer]:
      - img [ref=e51]
    - generic "Untitled Project" [ref=e56]
    - button "Presentation mode" [ref=e57] [cursor=pointer]:
      - img [ref=e58]
    - generic [ref=e61]:
      - button "Zoom out" [ref=e62] [cursor=pointer]: −
      - generic [ref=e63]: 100%
      - button "Zoom in" [ref=e64] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e65] [cursor=pointer]:
        - img [ref=e66]
    - button "Download PNG / SVG / PDF" [ref=e70] [cursor=pointer]:
      - img [ref=e71]
    - button "Save project (.diagramweave.json)" [ref=e74] [cursor=pointer]:
      - img [ref=e75]
    - button "Load project" [ref=e79] [cursor=pointer]:
      - img [ref=e80]
    - button "Excel template & import" [ref=e83] [cursor=pointer]:
      - img [ref=e84]
    - combobox "Language" [ref=e88] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e89] [cursor=pointer]:
      - img [ref=e90]
  - generic [ref=e93]:
    - button "Page 1" [ref=e95] [cursor=pointer]
    - button "+" [ref=e96] [cursor=pointer]
    - button "⧉" [ref=e97] [cursor=pointer]
  - generic [ref=e98]:
    - generic [ref=e99]:
      - button "Templates" [ref=e100] [cursor=pointer]:
        - img [ref=e101]
        - generic [ref=e106]: Templates
      - generic [ref=e107]: Shapes
      - searchbox "搜索图形" [ref=e109]
      - generic [ref=e110]:
        - button "Basic shapes ▾" [expanded] [ref=e111] [cursor=pointer]
        - generic [ref=e112]:
          - group "流程" [ref=e113]:
            - img [ref=e114]
            - generic [ref=e116]: Process
            - button "Favorite 流程" [ref=e117] [cursor=pointer]: ☆
          - group "子流程" [ref=e118]:
            - img [ref=e119]
            - generic [ref=e121]: Subprocess
            - button "Favorite 子流程" [ref=e122] [cursor=pointer]: ☆
          - group "判断" [ref=e123]:
            - img [ref=e124]
            - generic [ref=e126]: Decision
            - button "Favorite 判断" [ref=e127] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e128]:
            - img [ref=e129]
            - generic [ref=e131]: Start/End
            - button "Favorite 开始/结束" [ref=e132] [cursor=pointer]: ☆
          - group "连接点" [ref=e133]:
            - img [ref=e134]
            - generic [ref=e136]: Connector
            - button "Favorite 连接点" [ref=e137] [cursor=pointer]: ☆
          - group "数据" [ref=e138]:
            - img [ref=e139]
            - generic [ref=e142]: Database
            - button "Favorite 数据" [ref=e143] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e144]:
            - img [ref=e145]
            - generic [ref=e147]: Input/Output
            - button "Favorite 输入/输出" [ref=e148] [cursor=pointer]: ☆
          - group "文档" [ref=e149]:
            - img [ref=e150]
            - generic [ref=e152]: Document
            - button "Favorite 文档" [ref=e153] [cursor=pointer]: ☆
          - group "准备" [ref=e154]:
            - img [ref=e155]
            - generic [ref=e157]: Preparation
            - button "Favorite 准备" [ref=e158] [cursor=pointer]: ☆
          - group "合并" [ref=e159]:
            - img [ref=e160]
            - generic [ref=e162]: Merge
            - button "Favorite 合并" [ref=e163] [cursor=pointer]: ☆
          - group "延迟" [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Delay
            - button "Favorite 延迟" [ref=e168] [cursor=pointer]: ☆
          - group "显示" [ref=e169]:
            - img [ref=e170]
            - generic [ref=e173]: Display
            - button "Favorite 显示" [ref=e174] [cursor=pointer]: ☆
          - group "手动操作" [ref=e175]:
            - img [ref=e176]
            - generic [ref=e178]: Manual
            - button "Favorite 手动操作" [ref=e179] [cursor=pointer]: ☆
          - group "排序" [ref=e180]:
            - img [ref=e181]
            - generic [ref=e183]: Sort
            - button "Favorite 排序" [ref=e184] [cursor=pointer]: ☆
          - group "或" [ref=e185]:
            - img [ref=e186]
            - generic [ref=e188]: Or
            - button "Favorite 或" [ref=e189] [cursor=pointer]: ☆
          - group "存储" [ref=e190]:
            - img [ref=e191]
            - generic [ref=e193]: Storage
            - button "Favorite 存储" [ref=e194] [cursor=pointer]: ☆
          - group "多文档" [ref=e195]:
            - img [ref=e196]
            - generic [ref=e199]: Multi-document
            - button "Favorite 多文档" [ref=e200] [cursor=pointer]: ☆
          - group "内部存储" [ref=e201]:
            - img [ref=e202]
            - generic [ref=e204]: Internal storage
            - button "Favorite 内部存储" [ref=e205] [cursor=pointer]: ☆
          - group "离线存储" [ref=e206]:
            - img [ref=e207]
            - generic [ref=e210]: Offline storage
            - button "Favorite 离线存储" [ref=e211] [cursor=pointer]: ☆
          - group "注释" [ref=e212]:
            - img [ref=e213]
            - generic [ref=e215]: Annotation
            - button "Favorite 注释" [ref=e216] [cursor=pointer]: ☆
      - generic [ref=e217]:
        - button "Extended shapes ▾" [expanded] [ref=e218] [cursor=pointer]
        - generic [ref=e219]:
          - group "云服务" [ref=e220]:
            - img [ref=e221]
            - generic [ref=e223]: Cloud
            - button "Favorite 云服务" [ref=e224] [cursor=pointer]: ☆
          - group "角色" [ref=e225]:
            - img [ref=e226]
            - generic [ref=e229]: Actor
            - button "Favorite 角色" [ref=e230] [cursor=pointer]: ☆
          - group "便签" [ref=e231]:
            - img [ref=e232]
            - generic [ref=e234]: Note
            - button "Favorite 便签" [ref=e235] [cursor=pointer]: ☆
          - group "跨页" [ref=e236]:
            - img [ref=e237]
            - generic [ref=e239]: Off-page
            - button "Favorite 跨页" [ref=e240] [cursor=pointer]: ☆
          - group "子流程框" [ref=e241]:
            - img [ref=e242]
            - generic [ref=e245]: Subprocess frame
            - button "Favorite 子流程框" [ref=e246] [cursor=pointer]: ☆
          - group "交叉" [ref=e247]:
            - img [ref=e248]
            - generic [ref=e249]: Cross
            - button "Favorite 交叉" [ref=e250] [cursor=pointer]: ☆
          - group "开始" [ref=e251]:
            - img [ref=e252]
            - generic [ref=e254]: Start
            - button "Favorite 开始" [ref=e255] [cursor=pointer]: ☆
          - group "结束" [ref=e256]:
            - img [ref=e257]
            - generic [ref=e259]: End
            - button "Favorite 结束" [ref=e260] [cursor=pointer]: ☆
          - group "卡片" [ref=e261]:
            - img [ref=e262]
            - generic [ref=e264]: Card
            - button "Favorite 卡片" [ref=e265] [cursor=pointer]: ☆
          - group "求和" [ref=e266]:
            - img [ref=e267]
            - generic [ref=e269]: Summing
            - button "Favorite 求和" [ref=e270] [cursor=pointer]: ☆
      - generic [ref=e271]:
        - button "Remote icons ▾" [expanded] [ref=e272] [cursor=pointer]
        - generic [ref=e273]:
          - group "Webhook" [ref=e274]:
            - img [ref=e275]
            - generic [ref=e278]: Webhook
            - button "Favorite Webhook" [ref=e279] [cursor=pointer]: ☆
          - group "消息队列" [ref=e280]:
            - img [ref=e281]
            - generic [ref=e284]: 消息队列
            - button "Favorite 消息队列" [ref=e285] [cursor=pointer]: ☆
      - generic [ref=e286]:
        - generic [ref=e287]: Layers
        - generic [ref=e288]:
          - generic [ref=e289] [cursor=pointer]:
            - button "👁" [ref=e290]
            - generic [ref=e291]: Layer 1
            - button "🔓" [ref=e292]
          - button "+ New layer" [ref=e293] [cursor=pointer]
      - generic [ref=e295]:
        - generic [ref=e296]: T Text editor
        - generic [ref=e297]: Double-click Edit label
        - generic [ref=e298]: Delete Delete selection
        - generic [ref=e299]: Ctrl+Z Undo
    - generic [active] [ref=e300]:
      - generic "画布导航" [ref=e301]:
        - button "适应全部" [ref=e302] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e303] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e304] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e305] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e306] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e307] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e308]
      - generic [ref=e309]:
        - generic:
          - img
      - generic [ref=e310]:
        - generic [ref=e311]: V Select
        - generic [ref=e312]: L Connect
        - generic [ref=e313]: Click connection to edit
        - generic [ref=e314]: Wheel Zoom
        - generic [ref=e315]: Hold Space to pan canvas
    - generic [ref=e316]:
      - generic [ref=e317]: Properties
      - generic [ref=e319]:
        - generic [ref=e320]: Page info
        - generic [ref=e321]:
          - generic [ref=e322]: Page name
          - textbox "Page name" [ref=e323]: Page 1
        - paragraph [ref=e324]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e325]:
          - generic [ref=e326]: Scale
          - generic [ref=e327]: 当前页 0 个图形
        - generic [ref=e328]:
          - generic [ref=e329]: Total duration
          - generic [ref=e330]: 0 天
        - generic [ref=e331]:
          - generic [ref=e332]: Critical path
          - generic [ref=e333]: —
        - generic [ref=e334]:
          - generic [ref=e335]: Step count
          - generic [ref=e336]: 0 步
  - generic [ref=e337]:
    - generic [ref=e338]:
      - generic [ref=e339]: 表格编辑
      - paragraph [ref=e340]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e341] [cursor=pointer]: 说明
      - generic [ref=e342]:
        - button "从画布同步到表格" [ref=e343] [cursor=pointer]:
          - img [ref=e344]
        - button "将表格内容应用到画布" [ref=e347] [cursor=pointer]:
          - img [ref=e348]
        - button "关闭表格编辑" [ref=e350] [cursor=pointer]:
          - img [ref=e351]
    - generic:
      - generic [ref=e354]:
        - generic [ref=e355]:
          - button "编辑各步骤节点" [ref=e356] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e357] [cursor=pointer]: 连线表
        - generic [ref=e358]:
          - button "在表格末尾添加一行空节点" [ref=e359] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e360] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e361]:
          - rowgroup [ref=e362]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e363] [cursor=pointer]:
              - columnheader "编号" [ref=e364]
              - columnheader "简介" [ref=e365]
              - columnheader "去向" [ref=e366]
              - columnheader "角色" [ref=e367]
              - columnheader "图形" [ref=e368]
              - columnheader "详细说明" [ref=e369]
              - columnheader "耗时天" [ref=e370]
              - columnheader "泳道" [ref=e371]
              - columnheader "图层" [ref=e372]
              - columnheader "目标页" [ref=e373]
          - rowgroup
    - generic [ref=e374]:
      - strong [ref=e375]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e376]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e377]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e378]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e379]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e380]: 点击表格行
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
  47 |     await expect(page.locator('.template-dialog-item')).toHaveCount(
  48 |       await page.evaluate(() => allTemplates.length)
  49 |     );
  50 |     await expectVisual(page, 'desktop-template-center.png');
  51 | 
  52 |     await page.locator('.template-card-apply').first().click();
  53 |     await expect(page.locator('.node').first()).toBeVisible();
  54 |     await expectVisual(page, 'desktop-template-applied.png');
  55 | 
  56 |     await page.locator('.node').first().click();
  57 |     await expectVisual(page, 'desktop-node-selected.png');
  58 | 
  59 |     await page.evaluate(() => showExportDialog());
  60 |     await expectVisual(page, 'desktop-export-dialog.png');
  61 |   });
  62 | 
  63 |   test('phone and tablet visual baselines', async ({ page }) => {
  64 |     await page.setViewportSize({ width: 390, height: 844 });
  65 |     await prepare(page);
  66 |     await expectVisual(page, 'phone-390x844.png');
  67 | 
  68 |     await page.setViewportSize({ width: 768, height: 1024 });
  69 |     await expectVisual(page, 'tablet-768x1024.png');
  70 |   });
  71 | 
  72 |   test('has no serious or critical automated accessibility violations', async ({ page }) => {
  73 |     await prepare(page);
  74 |     const results = await new AxeBuilder({ page }).analyze();
  75 |     const blocking = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  76 |     expect(blocking).toEqual([]);
  77 |   });
  78 | 
  79 |   test('template node labels maintain readable contrast', async ({ page }) => {
  80 |     await prepare(page);
  81 |     await page.evaluate(() => showTemplateDialog());
  82 |     await page.locator('.template-card-apply').first().click();
  83 |     const ratios = await page.locator('.node').evaluateAll(nodes => nodes.map(node => {
  84 |       const shape = node.querySelector('.node-shape');
  85 |       const label = node.querySelector('.node-label');
  86 |       const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  87 |       const luminance = rgb => rgb.map(v => {
  88 |         const s = v / 255;
  89 |         return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  90 |       }).reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
  91 |       const a = luminance(parse(getComputedStyle(shape).backgroundColor));
  92 |       const b = luminance(parse(getComputedStyle(label).color));
  93 |       return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  94 |     }));
  95 |     expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
  96 |   });
  97 | });
  98 | 
```