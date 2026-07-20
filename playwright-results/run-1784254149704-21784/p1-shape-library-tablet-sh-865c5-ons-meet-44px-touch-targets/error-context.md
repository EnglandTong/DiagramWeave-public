# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-shape-library.spec.js >> tablet shape actions meet 44px touch targets
- Location: tests\e2e\p1-shape-library.spec.js:51:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 44
Received:    43.99999237060547
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
    - button "Delete selection (Delete)" [ref=e46] [cursor=pointer]:
      - img [ref=e47]
    - button "Clear canvas" [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - button "Presentation mode" [ref=e55] [cursor=pointer]:
      - img [ref=e56]
    - generic [ref=e59]:
      - button "Zoom out" [ref=e60] [cursor=pointer]: −
      - generic [ref=e61]: 100%
      - button "Zoom in" [ref=e62] [cursor=pointer]: +
      - button "Reset zoom 100%" [ref=e63] [cursor=pointer]:
        - img [ref=e64]
    - button "Download PNG / SVG / PDF" [ref=e68] [cursor=pointer]:
      - img [ref=e69]
    - button "Save project (.diagramweave.json)" [ref=e72] [cursor=pointer]:
      - img [ref=e73]
    - button "Load project" [ref=e77] [cursor=pointer]:
      - img [ref=e78]
    - button "Excel template & import" [ref=e81] [cursor=pointer]:
      - img [ref=e82]
    - combobox "Language" [ref=e86] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e87] [cursor=pointer]:
      - img [ref=e88]
    - button "打开图形面板" [active] [ref=e91] [cursor=pointer]:
      - img [ref=e92]
    - button "打开属性面板" [ref=e97] [cursor=pointer]:
      - img [ref=e98]
  - generic [ref=e103]:
    - button "Page 1" [ref=e105] [cursor=pointer]
    - button "+" [ref=e106] [cursor=pointer]
    - button "⧉" [ref=e107] [cursor=pointer]
  - generic [ref=e108]:
    - generic [ref=e109]:
      - button "Templates" [ref=e110] [cursor=pointer]:
        - img [ref=e111]
        - generic [ref=e116]: Templates
      - generic [ref=e117]: Shapes
      - searchbox "搜索图形" [ref=e119]
      - generic [ref=e120]:
        - button "Basic shapes ▾" [expanded] [ref=e121] [cursor=pointer]
        - generic [ref=e122]:
          - group "流程" [ref=e123]:
            - img [ref=e124]
            - generic [ref=e126]: Process
            - button "Favorite 流程" [ref=e127] [cursor=pointer]: ☆
          - group "子流程" [ref=e128]:
            - img [ref=e129]
            - generic [ref=e131]: Subprocess
            - button "Favorite 子流程" [ref=e132] [cursor=pointer]: ☆
          - group "判断" [ref=e133]:
            - img [ref=e134]
            - generic [ref=e136]: Decision
            - button "Favorite 判断" [ref=e137] [cursor=pointer]: ☆
          - group "开始/结束" [ref=e138]:
            - img [ref=e139]
            - generic [ref=e141]: Start/End
            - button "Favorite 开始/结束" [ref=e142] [cursor=pointer]: ☆
          - group "连接点" [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: Connector
            - button "Favorite 连接点" [ref=e147] [cursor=pointer]: ☆
          - group "数据" [ref=e148]:
            - img [ref=e149]
            - generic [ref=e152]: Database
            - button "Favorite 数据" [ref=e153] [cursor=pointer]: ☆
          - group "输入/输出" [ref=e154]:
            - img [ref=e155]
            - generic [ref=e157]: Input/Output
            - button "Favorite 输入/输出" [ref=e158] [cursor=pointer]: ☆
          - group "文档" [ref=e159]:
            - img [ref=e160]
            - generic [ref=e162]: Document
            - button "Favorite 文档" [ref=e163] [cursor=pointer]: ☆
          - group "准备" [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Preparation
            - button "Favorite 准备" [ref=e168] [cursor=pointer]: ☆
          - group "合并" [ref=e169]:
            - img [ref=e170]
            - generic [ref=e172]: Merge
            - button "Favorite 合并" [ref=e173] [cursor=pointer]: ☆
          - group "延迟" [ref=e174]:
            - img [ref=e175]
            - generic [ref=e177]: Delay
            - button "Favorite 延迟" [ref=e178] [cursor=pointer]: ☆
          - group "显示" [ref=e179]:
            - img [ref=e180]
            - generic [ref=e183]: Display
            - button "Favorite 显示" [ref=e184] [cursor=pointer]: ☆
          - group "手动操作" [ref=e185]:
            - img [ref=e186]
            - generic [ref=e188]: Manual
            - button "Favorite 手动操作" [ref=e189] [cursor=pointer]: ☆
          - group "排序" [ref=e190]:
            - img [ref=e191]
            - generic [ref=e193]: Sort
            - button "Favorite 排序" [ref=e194] [cursor=pointer]: ☆
          - group "或" [ref=e195]:
            - img [ref=e196]
            - generic [ref=e198]: Or
            - button "Favorite 或" [ref=e199] [cursor=pointer]: ☆
          - group "存储" [ref=e200]:
            - img [ref=e201]
            - generic [ref=e203]: Storage
            - button "Favorite 存储" [ref=e204] [cursor=pointer]: ☆
          - group "多文档" [ref=e205]:
            - img [ref=e206]
            - generic [ref=e209]: Multi-document
            - button "Favorite 多文档" [ref=e210] [cursor=pointer]: ☆
          - group "内部存储" [ref=e211]:
            - img [ref=e212]
            - generic [ref=e214]: Internal storage
            - button "Favorite 内部存储" [ref=e215] [cursor=pointer]: ☆
          - group "离线存储" [ref=e216]:
            - img [ref=e217]
            - generic [ref=e220]: Offline storage
            - button "Favorite 离线存储" [ref=e221] [cursor=pointer]: ☆
          - group "注释" [ref=e222]:
            - img [ref=e223]
            - generic [ref=e225]: Annotation
            - button "Favorite 注释" [ref=e226] [cursor=pointer]: ☆
      - generic [ref=e227]:
        - button "Extended shapes ▾" [expanded] [ref=e228] [cursor=pointer]
        - generic [ref=e229]:
          - group "云服务" [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: Cloud
            - button "Favorite 云服务" [ref=e234] [cursor=pointer]: ☆
          - group "角色" [ref=e235]:
            - img [ref=e236]
            - generic [ref=e239]: Actor
            - button "Favorite 角色" [ref=e240] [cursor=pointer]: ☆
          - group "便签" [ref=e241]:
            - img [ref=e242]
            - generic [ref=e244]: Note
            - button "Favorite 便签" [ref=e245] [cursor=pointer]: ☆
          - group "跨页" [ref=e246]:
            - img [ref=e247]
            - generic [ref=e249]: Off-page
            - button "Favorite 跨页" [ref=e250] [cursor=pointer]: ☆
          - group "子流程框" [ref=e251]:
            - img [ref=e252]
            - generic [ref=e255]: Subprocess frame
            - button "Favorite 子流程框" [ref=e256] [cursor=pointer]: ☆
          - group "交叉" [ref=e257]:
            - img [ref=e258]
            - generic [ref=e259]: Cross
            - button "Favorite 交叉" [ref=e260] [cursor=pointer]: ☆
          - group "开始" [ref=e261]:
            - img [ref=e262]
            - generic [ref=e264]: Start
            - button "Favorite 开始" [ref=e265] [cursor=pointer]: ☆
          - group "结束" [ref=e266]:
            - img [ref=e267]
            - generic [ref=e269]: End
            - button "Favorite 结束" [ref=e270] [cursor=pointer]: ☆
          - group "卡片" [ref=e271]:
            - img [ref=e272]
            - generic [ref=e274]: Card
            - button "Favorite 卡片" [ref=e275] [cursor=pointer]: ☆
          - group "求和" [ref=e276]:
            - img [ref=e277]
            - generic [ref=e279]: Summing
            - button "Favorite 求和" [ref=e280] [cursor=pointer]: ☆
      - generic [ref=e281]:
        - button "Remote icons ▾" [expanded] [ref=e282] [cursor=pointer]
        - generic [ref=e283]:
          - group "Webhook" [ref=e284]:
            - img [ref=e285]
            - generic [ref=e288]: Webhook
            - button "Favorite Webhook" [ref=e289] [cursor=pointer]: ☆
          - group "消息队列" [ref=e290]:
            - img [ref=e291]
            - generic [ref=e294]: 消息队列
            - button "Favorite 消息队列" [ref=e295] [cursor=pointer]: ☆
      - generic [ref=e296]:
        - generic [ref=e297]: Layers
        - generic [ref=e298]:
          - generic [ref=e299] [cursor=pointer]:
            - button "👁" [ref=e300]
            - generic [ref=e301]: Layer 1
            - button "🔓" [ref=e302]
          - button "+ New layer" [ref=e303] [cursor=pointer]
      - generic [ref=e305]:
        - generic [ref=e306]: T Text editor
        - generic [ref=e307]: Double-click Edit label
        - generic [ref=e308]: Delete Delete selection
        - generic [ref=e309]: Ctrl+Z Undo
    - generic [ref=e310]:
      - generic [ref=e311]:
        - heading "开始创建流程" [level=2] [ref=e312]
        - generic [ref=e313]:
          - button "从模板开始" [ref=e314] [cursor=pointer]
          - button "导入文件" [ref=e315] [cursor=pointer]
          - button "空白画布" [ref=e316] [cursor=pointer]
      - generic "画布导航" [ref=e317]:
        - button "适应全部" [ref=e318] [cursor=pointer]: ⌗
        - button "适应选区" [ref=e319] [cursor=pointer]: ▣
        - button "缩放至 100%" [ref=e320] [cursor=pointer]: 100%
        - button "打开节点大纲" [ref=e321] [cursor=pointer]: ☷
        - combobox "对齐所选节点" [ref=e322] [cursor=pointer]:
          - option "对齐" [selected]
          - option "左对齐"
          - option "水平居中"
          - option "右对齐"
          - option "顶部对齐"
          - option "垂直居中"
          - option "底部对齐"
        - combobox "等距分布所选节点" [ref=e323] [cursor=pointer]:
          - option "分布" [selected]
          - option "水平等距"
          - option "垂直等距"
      - generic "画布小地图" [ref=e324]
      - generic [ref=e325]:
        - generic:
          - img
      - generic [ref=e326]:
        - generic [ref=e327]: V Select
        - generic [ref=e328]: L Connect
        - generic [ref=e329]: Click connection to edit
        - generic [ref=e330]: Wheel Zoom
        - generic [ref=e331]: Hold Space to pan canvas
    - generic [ref=e332]:
      - generic [ref=e333]: Properties
      - generic [ref=e335]:
        - generic [ref=e336]: Page info
        - generic [ref=e337]:
          - generic [ref=e338]: Page name
          - textbox "Page name" [ref=e339]: Page 1
        - paragraph [ref=e340]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e341]:
          - generic [ref=e342]: Scale
          - generic [ref=e343]: 当前页 0 个图形
        - generic [ref=e344]:
          - generic [ref=e345]: Total duration
          - generic [ref=e346]: 0 天
        - generic [ref=e347]:
          - generic [ref=e348]: Critical path
          - generic [ref=e349]: —
        - generic [ref=e350]:
          - generic [ref=e351]: Step count
          - generic [ref=e352]: 0 步
  - generic [ref=e353]:
    - generic [ref=e354]:
      - generic [ref=e355]: 表格编辑
      - paragraph [ref=e356]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "展开说明" [ref=e357] [cursor=pointer]: 说明
      - generic [ref=e358]:
        - button "从画布同步到表格" [ref=e359] [cursor=pointer]:
          - img [ref=e360]
        - button "将表格内容应用到画布" [ref=e363] [cursor=pointer]:
          - img [ref=e364]
        - button "关闭表格编辑" [ref=e366] [cursor=pointer]:
          - img [ref=e367]
    - generic:
      - generic [ref=e370]:
        - generic [ref=e371]:
          - button "编辑各步骤节点" [ref=e372] [cursor=pointer]: 节点表
          - button "编辑节点之间的连线" [ref=e373] [cursor=pointer]: 连线表
        - generic [ref=e374]:
          - button "在表格末尾添加一行空节点" [ref=e375] [cursor=pointer]: + 节点
          - button "先点击行选中（高亮），再删除" [ref=e376] [cursor=pointer]: 删节点
      - generic "流程数据表":
        - table [ref=e377]:
          - rowgroup [ref=e378]:
            - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e379] [cursor=pointer]:
              - columnheader "编号" [ref=e380]
              - columnheader "简介" [ref=e381]
              - columnheader "去向" [ref=e382]
              - columnheader "角色" [ref=e383]
              - columnheader "图形" [ref=e384]
              - columnheader "详细说明" [ref=e385]
              - columnheader "耗时天" [ref=e386]
              - columnheader "泳道" [ref=e387]
              - columnheader "图层" [ref=e388]
              - columnheader "目标页" [ref=e389]
          - rowgroup
    - generic [ref=e390]:
      - strong [ref=e391]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e392]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e393]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e394]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e395]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e396]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
  - tooltip
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
  25 |   await expect(page.locator('#shapeFavorites .shape-quick-item')).toContainText(/Decision|判断/);
  26 |   await page.keyboard.press('Enter');
  27 |   await expect(page.locator('.node')).toHaveCount(1);
  28 |   await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText(/Decision|判断/);
  29 | 
  30 |   await page.reload();
  31 |   await page.waitForFunction(() => window.__dwEditorReady && window.DiagramWeave?.shapePacks);
  32 |   await expect(page.locator('.shape-item[data-shape="diamond"]')).toHaveClass(/favorite/);
  33 |   await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText(/Decision|判断/);
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
  48 |   await expect(page.locator('#shapeRecent .shape-quick-item').first()).toContainText(/Decision|判断/);
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
> 60 |   expect(favoriteBox.height).toBeGreaterThanOrEqual(44);
     |                              ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  61 | });
  62 | 
```