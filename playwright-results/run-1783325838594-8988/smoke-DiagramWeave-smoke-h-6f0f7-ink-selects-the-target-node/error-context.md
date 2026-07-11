# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> DiagramWeave smoke >> highlightNode deep link selects the target node
- Location: tests\e2e\smoke.spec.js:40:3

# Error details

```
TimeoutError: page.waitForFunction: Timeout 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e4]
      - text: DiagramWeave
    - button [ref=e7] [cursor=pointer]:
      - img [ref=e8]
    - button [ref=e11] [cursor=pointer]:
      - img [ref=e12]
    - button [ref=e14] [cursor=pointer]:
      - img [ref=e15]
    - button [ref=e19] [cursor=pointer]:
      - img [ref=e20]
    - button [ref=e25] [cursor=pointer]:
      - img [ref=e26]
    - button [ref=e29] [cursor=pointer]:
      - img [ref=e30]
    - button [ref=e33] [cursor=pointer]:
      - img [ref=e34]
    - button [ref=e38] [cursor=pointer]:
      - img [ref=e39]
    - combobox [ref=e44] [cursor=pointer]:
      - option "曲线" [selected]
      - option "折线"
      - option "避障"
    - button [ref=e46] [cursor=pointer]:
      - img [ref=e47]
    - button [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - generic [ref=e55]: Untitled Project
    - button [ref=e56] [cursor=pointer]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "−" [ref=e61] [cursor=pointer]
      - generic [ref=e62]: 100%
      - button "+" [ref=e63] [cursor=pointer]
      - button [ref=e64] [cursor=pointer]:
        - img [ref=e65]
    - button [ref=e69] [cursor=pointer]:
      - img [ref=e70]
    - button [ref=e73] [cursor=pointer]:
      - img [ref=e74]
    - button [ref=e78] [cursor=pointer]:
      - img [ref=e79]
    - button [ref=e82] [cursor=pointer]:
      - img [ref=e83]
    - combobox "Language" [ref=e87] [cursor=pointer]:
      - option "中文" [selected]
      - option "EN"
    - button [ref=e88] [cursor=pointer]:
      - img [ref=e89]
  - generic [ref=e93]:
    - generic [ref=e94]:
      - button "流程模板" [ref=e95] [cursor=pointer]:
        - img [ref=e96]
        - generic [ref=e101]: 流程模板
      - generic [ref=e102]: 图形
      - generic [ref=e103]:
        - generic [ref=e104]: 基本图形
        - generic [ref=e105]:
          - generic [ref=e106]:
            - img [ref=e107]
            - generic [ref=e109]: 流程
          - generic [ref=e110]:
            - img [ref=e111]
            - generic [ref=e113]: 子流程
          - generic [ref=e114]:
            - img [ref=e115]
            - generic [ref=e117]: 判断
          - generic [ref=e118]:
            - img [ref=e119]
            - generic [ref=e121]: 开始/结束
          - generic [ref=e122]:
            - img [ref=e123]
            - generic [ref=e125]: 连接点
          - generic [ref=e126]:
            - img [ref=e127]
            - generic [ref=e130]: 数据
          - generic [ref=e131]:
            - img [ref=e132]
            - generic [ref=e134]: 输入/输出
          - generic [ref=e135]:
            - img [ref=e136]
            - generic [ref=e138]: 文档
          - generic [ref=e139]:
            - img [ref=e140]
            - generic [ref=e142]: 准备
          - generic [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: 合并
          - generic [ref=e147]:
            - img [ref=e148]
            - generic [ref=e150]: 延迟
          - generic [ref=e151]:
            - img [ref=e152]
            - generic [ref=e155]: 显示
          - generic [ref=e156]:
            - img [ref=e157]
            - generic [ref=e159]: 手动操作
          - generic [ref=e160]:
            - img [ref=e161]
            - generic [ref=e163]: 排序
          - generic [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: 或
          - generic [ref=e168]:
            - img [ref=e169]
            - generic [ref=e171]: 存储
          - generic [ref=e172]:
            - img [ref=e173]
            - generic [ref=e176]: 多文档
          - generic [ref=e177]:
            - img [ref=e178]
            - generic [ref=e180]: 内部存储
          - generic [ref=e181]:
            - img [ref=e182]
            - generic [ref=e185]: 离线存储
          - generic [ref=e186]:
            - img [ref=e187]
            - generic [ref=e189]: 注释
      - generic [ref=e190]:
        - generic [ref=e191]: 扩展图形
        - generic [ref=e192]:
          - generic [ref=e193]:
            - img [ref=e194]
            - generic [ref=e196]: 云服务
          - generic [ref=e197]:
            - img [ref=e198]
            - generic [ref=e201]: 角色
          - generic [ref=e202]:
            - img [ref=e203]
            - generic [ref=e205]: 便签
          - generic [ref=e206]:
            - img [ref=e207]
            - generic [ref=e209]: 跨页
          - generic [ref=e210]:
            - img [ref=e211]
            - generic [ref=e214]: 子流程框
          - generic [ref=e215]:
            - img [ref=e216]
            - generic [ref=e217]: 交叉
          - generic [ref=e218]:
            - img [ref=e219]
            - generic [ref=e221]: 开始
          - generic [ref=e222]:
            - img [ref=e223]
            - generic [ref=e225]: 结束
          - generic [ref=e226]:
            - img [ref=e227]
            - generic [ref=e229]: 卡片
          - generic [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: 求和
      - generic [ref=e235]: 图层
      - generic [ref=e238]:
        - generic [ref=e239]: T 文本编辑
        - generic [ref=e240]: 双击 编辑文字
        - generic [ref=e241]: Delete 删除选中
        - generic [ref=e242]: Ctrl+Z 撤销
    - generic [ref=e243]:
      - generic [ref=e244]:
        - generic:
          - img
      - generic [ref=e245]:
        - generic [ref=e246]: V 选择
        - generic [ref=e247]: L 连线
        - generic [ref=e248]: 点击连线编辑
        - generic [ref=e249]: 滚轮 缩放
        - generic [ref=e250]: 按住空格拖拽画布
    - generic [ref=e251]:
      - generic [ref=e252]: 属性
      - generic [ref=e254]:
        - generic [ref=e255]: 页面信息
        - generic [ref=e256]:
          - generic [ref=e257]: 页面名称
          - textbox "页面名称" [ref=e258]
        - paragraph [ref=e259]: 保存 JSON / 导出图片时，默认使用当前页面名称作为文件名。
        - generic [ref=e260]:
          - generic [ref=e261]: 规模
          - generic [ref=e262]: —
        - generic [ref=e263]:
          - generic [ref=e264]: 总耗时
          - generic [ref=e265]: —
        - generic [ref=e266]:
          - generic [ref=e267]: 关键路径
          - generic [ref=e268]: —
        - generic [ref=e269]:
          - generic [ref=e270]: 步骤数
          - generic [ref=e271]: —
  - generic:
    - generic [ref=e272]:
      - generic [ref=e273]: 表格编辑
      - paragraph [ref=e274]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "说明" [ref=e275] [cursor=pointer]
      - generic [ref=e276]:
        - button "从画布同步到表格" [ref=e277] [cursor=pointer]:
          - img [ref=e278]
        - button "将表格内容应用到画布" [ref=e281] [cursor=pointer]:
          - img [ref=e282]
        - button "关闭表格编辑" [ref=e284] [cursor=pointer]:
          - img [ref=e285]
    - generic:
      - generic [ref=e288]:
        - generic [ref=e289]:
          - button "节点表" [ref=e290] [cursor=pointer]
          - button "连线表" [ref=e291] [cursor=pointer]: 连线表
        - generic [ref=e292]:
          - button "+ 节点" [ref=e293] [cursor=pointer]
          - button "删节点" [ref=e294] [cursor=pointer]
      - table [ref=e295]:
        - rowgroup [ref=e296]:
          - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e297] [cursor=pointer]:
            - columnheader "编号" [ref=e298]
            - columnheader "简介" [ref=e299]
            - columnheader "去向" [ref=e300]
            - columnheader "角色" [ref=e301]
            - columnheader "图形" [ref=e302]
            - columnheader "详细说明" [ref=e303]
            - columnheader "耗时天" [ref=e304]
            - columnheader "泳道" [ref=e305]
            - columnheader "图层" [ref=e306]
            - columnheader "目标页" [ref=e307]
        - rowgroup
    - generic [ref=e308]:
      - strong [ref=e309]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e310]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e311]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e312]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e313]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e314]: 点击表格行
      - text: 使其高亮，再点「删节点/删连线」。
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('DiagramWeave smoke', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.addInitScript(() => {
  6  |       window.sessionStorage.setItem('dw-initial-save-prompted', '1');
  7  |       window.__dwSkipRemoteBootstrap = true;
  8  |     });
  9  |   });
  10 | 
  11 |   async function waitForEditorReady(page, url = '/flowchart-editor.html') {
  12 |     await page.goto(url);
  13 |     await page.waitForSelector('#canvasWrapper', { state: 'visible' });
> 14 |     await page.waitForFunction(() => window.__dwEditorReady === true, null, { timeout: 90000 });
     |                ^ TimeoutError: page.waitForFunction: Timeout 90000ms exceeded.
  15 |   }
  16 | 
  17 |   test('loads blank canvas', async ({ page }) => {
  18 |     await waitForEditorReady(page);
  19 |     await expect(page.locator('#canvasWrapper')).toBeVisible();
  20 |     await expect(page.locator('.node')).toHaveCount(0);
  21 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  22 |   });
  23 | 
  24 |   test('can add and delete page', async ({ page }) => {
  25 |     await waitForEditorReady(page);
  26 |     await page.locator('.page-tab-add').first().click();
  27 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(2);
  28 |     page.once('dialog', (d) => d.accept());
  29 |     await page.locator('.page-tab-wrap.active .page-tab-close').click();
  30 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  31 |   });
  32 | 
  33 |   test('template library loads starter template', async ({ page }) => {
  34 |     await waitForEditorReady(page);
  35 |     await page.locator('.template-btn').click();
  36 |     await expect(page.locator('.template-dialog-item')).toHaveCount(7, { timeout: 30000 });
  37 |     await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  38 |   });
  39 | 
  40 |   test('highlightNode deep link selects the target node', async ({ page }) => {
  41 |     await page.addInitScript(() => {
  42 |       window.sessionStorage.setItem(
  43 |         'dw-e2e-seed-nodes',
  44 |         JSON.stringify([
  45 |           {
  46 |             id: 'e2e-highlight-node',
  47 |             label: 'Deep Link Target',
  48 |             shape: 'rectangle',
  49 |             x: 120,
  50 |             y: 100,
  51 |           },
  52 |         ]),
  53 |       );
  54 |     });
  55 |     await waitForEditorReady(page, '/flowchart-editor.html?highlightNode=e2e-highlight-node');
  56 |     const selectedId = await page.evaluate(() => state.selectedNodeId);
  57 |     expect(selectedId).toBe('e2e-highlight-node');
  58 |     await expect(page.locator('#e2e-highlight-node.selected')).toBeVisible();
  59 |   });
  60 | 
  61 |   test('excel import buttons prefer the file picker path', async ({ page }) => {
  62 |     await page.addInitScript(() => {
  63 |       window.__dwPickerCalls = 0;
  64 |       Object.defineProperty(window, 'showOpenFilePicker', {
  65 |         configurable: true,
  66 |         writable: true,
  67 |         value: async () => {
  68 |           window.__dwPickerCalls += 1;
  69 |           throw { name: 'AbortError' };
  70 |         },
  71 |       });
  72 |       HTMLInputElement.prototype.showPicker = function () {
  73 |         throw new Error('showPicker fallback should not be used in this test');
  74 |       };
  75 |       HTMLInputElement.prototype.click = function () {
  76 |         throw new Error('click fallback should not be used in this test');
  77 |       };
  78 |     });
  79 | 
  80 |     await page.goto('/flowchart-editor.html');
  81 |     await page.evaluate(() => triggerExcelUpload());
  82 |     await page.evaluate(() => triggerProjectExcelUpload());
  83 | 
  84 |     await expect.poll(async () => page.evaluate(() => window.__dwPickerCalls)).toBe(2);
  85 |   });
  86 | });
  87 | 
```