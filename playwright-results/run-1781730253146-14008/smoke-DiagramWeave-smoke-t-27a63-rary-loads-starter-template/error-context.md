# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> DiagramWeave smoke >> template library loads starter template
- Location: tests\e2e\smoke.spec.js:27:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.template-dialog-item')
Expected: 7
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('.template-dialog-item')
    14 × locator resolved to 0 elements
       - unexpected value "0"

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
      - option "Curved" [selected]
      - option "Orthogonal"
      - option "Avoid obstacles"
    - button "Delete selection (Delete)" [ref=e46] [cursor=pointer]:
      - img [ref=e47]
    - button "Clear canvas" [ref=e49] [cursor=pointer]:
      - img [ref=e50]
    - generic [ref=e55]: Untitled Project
    - button "Presentation mode" [ref=e56] [cursor=pointer]:
      - img [ref=e57]
    - generic [ref=e60]:
      - button "−" [ref=e61] [cursor=pointer]
      - generic [ref=e62]: 100%
      - button "+" [ref=e63] [cursor=pointer]
      - button "Reset zoom 100%" [ref=e64] [cursor=pointer]:
        - img [ref=e65]
    - button "Download PNG / SVG / PDF" [ref=e69] [cursor=pointer]:
      - img [ref=e70]
    - button "Save project (.diagramweave.json)" [ref=e73] [cursor=pointer]:
      - img [ref=e74]
    - button "Load project" [ref=e78] [cursor=pointer]:
      - img [ref=e79]
    - button "Excel template & import" [ref=e82] [cursor=pointer]:
      - img [ref=e83]
    - combobox "Language" [ref=e87] [cursor=pointer]:
      - option "中文"
      - option "EN" [selected]
    - button "Settings & updates" [ref=e88] [cursor=pointer]:
      - img [ref=e89]
  - generic [ref=e93]:
    - generic [ref=e94]:
      - button "Templates" [active] [ref=e95] [cursor=pointer]:
        - img [ref=e96]
        - generic [ref=e101]: Templates
      - generic [ref=e102]: Shapes
      - generic [ref=e103]:
        - generic [ref=e104]: Basic shapes
        - generic [ref=e105]:
          - generic [ref=e106]:
            - img [ref=e107]
            - generic [ref=e109]: Process
          - generic [ref=e110]:
            - img [ref=e111]
            - generic [ref=e113]: Subprocess
          - generic [ref=e114]:
            - img [ref=e115]
            - generic [ref=e117]: Decision
          - generic [ref=e118]:
            - img [ref=e119]
            - generic [ref=e121]: Start/End
          - generic [ref=e122]:
            - img [ref=e123]
            - generic [ref=e125]: Connector
          - generic [ref=e126]:
            - img [ref=e127]
            - generic [ref=e130]: Database
          - generic [ref=e131]:
            - img [ref=e132]
            - generic [ref=e134]: Input/Output
          - generic [ref=e135]:
            - img [ref=e136]
            - generic [ref=e138]: Document
          - generic [ref=e139]:
            - img [ref=e140]
            - generic [ref=e142]: Preparation
          - generic [ref=e143]:
            - img [ref=e144]
            - generic [ref=e146]: Merge
          - generic [ref=e147]:
            - img [ref=e148]
            - generic [ref=e150]: Delay
          - generic [ref=e151]:
            - img [ref=e152]
            - generic [ref=e155]: Display
          - generic [ref=e156]:
            - img [ref=e157]
            - generic [ref=e159]: Manual
          - generic [ref=e160]:
            - img [ref=e161]
            - generic [ref=e163]: Sort
          - generic [ref=e164]:
            - img [ref=e165]
            - generic [ref=e167]: Or
          - generic [ref=e168]:
            - img [ref=e169]
            - generic [ref=e171]: Storage
          - generic [ref=e172]:
            - img [ref=e173]
            - generic [ref=e176]: Multi-document
          - generic [ref=e177]:
            - img [ref=e178]
            - generic [ref=e180]: Internal storage
          - generic [ref=e181]:
            - img [ref=e182]
            - generic [ref=e185]: Offline storage
          - generic [ref=e186]:
            - img [ref=e187]
            - generic [ref=e189]: Annotation
      - generic [ref=e190]:
        - generic [ref=e191]: Extended shapes
        - generic [ref=e192]:
          - generic [ref=e193]:
            - img [ref=e194]
            - generic [ref=e196]: Cloud
          - generic [ref=e197]:
            - img [ref=e198]
            - generic [ref=e201]: Actor
          - generic [ref=e202]:
            - img [ref=e203]
            - generic [ref=e205]: Note
          - generic [ref=e206]:
            - img [ref=e207]
            - generic [ref=e209]: Off-page
          - generic [ref=e210]:
            - img [ref=e211]
            - generic [ref=e214]: Subprocess frame
          - generic [ref=e215]:
            - img [ref=e216]
            - generic [ref=e217]: Cross
          - generic [ref=e218]:
            - img [ref=e219]
            - generic [ref=e221]: Start
          - generic [ref=e222]:
            - img [ref=e223]
            - generic [ref=e225]: End
          - generic [ref=e226]:
            - img [ref=e227]
            - generic [ref=e229]: Card
          - generic [ref=e230]:
            - img [ref=e231]
            - generic [ref=e233]: Summing
      - generic [ref=e235]: Layers
      - generic [ref=e238]:
        - generic [ref=e239]: T Text editor
        - generic [ref=e240]: Double-click Edit label
        - generic [ref=e241]: Delete Delete selection
        - generic [ref=e242]: Ctrl+Z Undo
    - generic [ref=e243]:
      - generic [ref=e244]:
        - generic:
          - img
      - generic [ref=e245]:
        - generic [ref=e246]: V Select
        - generic [ref=e247]: L Connect
        - generic [ref=e248]: Click connection to edit
        - generic [ref=e249]: Wheel Zoom
        - generic [ref=e250]: Hold Space to pan canvas
    - generic [ref=e251]:
      - generic [ref=e252]: Properties
      - generic [ref=e254]:
        - generic [ref=e255]: Page info
        - generic [ref=e256]:
          - generic [ref=e257]: Page name
          - textbox "Page name" [ref=e258]
        - paragraph [ref=e259]: JSON save / image export uses the current page name as the default filename.
        - generic [ref=e260]:
          - generic [ref=e261]: Scale
          - generic [ref=e262]: —
        - generic [ref=e263]:
          - generic [ref=e264]: Total duration
          - generic [ref=e265]: —
        - generic [ref=e266]:
          - generic [ref=e267]: Critical path
          - generic [ref=e268]: —
        - generic [ref=e269]:
          - generic [ref=e270]: Step count
          - generic [ref=e271]: —
  - generic [ref=e273]:
    - button "关闭" [ref=e274] [cursor=pointer]:
      - img [ref=e275]
    - generic [ref=e278]: Choose a template
    - generic [ref=e279]: Click to generate a diagram; edit freely afterward
  - generic [ref=e280]:
    - generic [ref=e281]:
      - generic [ref=e282]: 表格编辑
      - paragraph [ref=e283]: 节点表填步骤 · 连线表填「起点编号→终点编号」 · 画布改完点刷新 · 表格改完点应用
      - button "说明" [ref=e284] [cursor=pointer]
      - generic [ref=e285]:
        - button "从画布同步到表格" [ref=e286] [cursor=pointer]:
          - img [ref=e287]
        - button "将表格内容应用到画布" [ref=e290] [cursor=pointer]:
          - img [ref=e291]
        - button "关闭表格编辑" [ref=e293] [cursor=pointer]:
          - img [ref=e294]
    - generic:
      - generic [ref=e297]:
        - generic [ref=e298]:
          - button "节点表" [ref=e299] [cursor=pointer]
          - button "连线表" [ref=e300] [cursor=pointer]: 连线表
        - generic [ref=e301]:
          - button "+ 节点" [ref=e302] [cursor=pointer]
          - button "删节点" [ref=e303] [cursor=pointer]
      - table [ref=e304]:
        - rowgroup [ref=e305]:
          - row "编号 简介 去向 角色 图形 详细说明 耗时天 泳道 图层 目标页" [ref=e306] [cursor=pointer]:
            - columnheader "编号" [ref=e307]
            - columnheader "简介" [ref=e308]
            - columnheader "去向" [ref=e309]
            - columnheader "角色" [ref=e310]
            - columnheader "图形" [ref=e311]
            - columnheader "详细说明" [ref=e312]
            - columnheader "耗时天" [ref=e313]
            - columnheader "泳道" [ref=e314]
            - columnheader "图层" [ref=e315]
            - columnheader "目标页" [ref=e316]
        - rowgroup
    - generic [ref=e317]:
      - strong [ref=e318]: 怎么用：
      - text: ① 顶部工具栏点「表格」图标打开本面板。 ②
      - strong [ref=e319]: 节点表
      - text: ：每行一个步骤（编号唯一），「去向」列只读，由连线自动算出。 ③
      - strong [ref=e320]: 连线表
      - text: ：每行一条箭头，填起点编号、终点编号、条件（如「是/否」）；也可在画布用连线工具拖拽。 ④ 在画布改形状/连线 → 点
      - strong [ref=e321]: ↺ 刷新
      - text: ；在表格改内容 → 点
      - strong [ref=e322]: ✓ 应用
      - text: （会重新布局）。 ⑤ 删除：先
      - strong [ref=e323]: 点击表格行
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
  7  |     });
  8  |   });
  9  | 
  10 |   test('loads blank canvas', async ({ page }) => {
  11 |     await page.goto('/flowchart-editor.html');
  12 |     await page.waitForSelector('#canvasWrapper', { state: 'visible' });
  13 |     await expect(page.locator('#canvasWrapper')).toBeVisible();
  14 |     await expect(page.locator('.node')).toHaveCount(0);
  15 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  16 |   });
  17 | 
  18 |   test('can add and delete page', async ({ page }) => {
  19 |     await page.goto('/flowchart-editor.html');
  20 |     await page.locator('.page-tab-add').first().click();
  21 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(2);
  22 |     page.once('dialog', d => d.accept());
  23 |     await page.locator('.page-tab-wrap.active .page-tab-close').click();
  24 |     await expect(page.locator('#pageTabs .page-tab-wrap')).toHaveCount(1);
  25 |   });
  26 | 
  27 |   test('template library loads starter template', async ({ page }) => {
  28 |     await page.goto('/flowchart-editor.html');
  29 |     await page.waitForSelector('#canvasWrapper', { state: 'visible' });
  30 |     await page.locator('.template-btn').click();
> 31 |     await expect(page.locator('.template-dialog-item')).toHaveCount(7);
     |                                                         ^ Error: expect(locator).toHaveCount(expected) failed
  32 |     await expect(page.locator('.template-dialog-item-name').first()).toBeVisible();
  33 |   });
  34 | 
  35 |   test('excel import buttons prefer the file picker path', async ({ page }) => {
  36 |     await page.addInitScript(() => {
  37 |       window.__dwPickerCalls = 0;
  38 |       Object.defineProperty(window, 'showOpenFilePicker', {
  39 |         configurable: true,
  40 |         writable: true,
  41 |         value: async () => {
  42 |           window.__dwPickerCalls += 1;
  43 |           throw { name: 'AbortError' };
  44 |         },
  45 |       });
  46 |       HTMLInputElement.prototype.showPicker = function () {
  47 |         throw new Error('showPicker fallback should not be used in this test');
  48 |       };
  49 |       HTMLInputElement.prototype.click = function () {
  50 |         throw new Error('click fallback should not be used in this test');
  51 |       };
  52 |     });
  53 | 
  54 |     await page.goto('/flowchart-editor.html');
  55 |     await page.evaluate(() => triggerExcelUpload());
  56 |     await page.evaluate(() => triggerProjectExcelUpload());
  57 | 
  58 |     await expect.poll(async () => page.evaluate(() => window.__dwPickerCalls)).toBe(2);
  59 |   });
  60 | });
  61 | 
```