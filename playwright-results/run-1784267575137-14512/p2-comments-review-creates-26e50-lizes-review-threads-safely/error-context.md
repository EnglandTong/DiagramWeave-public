# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-comments-review.spec.js >> creates, replies, changes status, navigates, and serializes review threads safely
- Location: tests\e2e\p2-comments-review.spec.js:11:1

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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | async function loadReviewProject(page) {
> 4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); }); await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveContracts?.addReviewComment);
     |                                                                                                                                                   ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  5  |   await page.evaluate(() => loadFlowDocumentPayload({ version: 2, currentPageId: 'p1', pages: [
  6  |     { id: 'p1', name: 'One', nodes: [{ id: 'n1', label: 'Draft', x: 50, y: 50 }], connections: [] },
  7  |     { id: 'p2', name: 'Two', nodes: [{ id: 'n2', label: 'Review', x: 50, y: 50 }], connections: [] },
  8  |   ] }));
  9  | }
  10 | 
  11 | test('creates, replies, changes status, navigates, and serializes review threads safely', async ({ page }) => {
  12 |   await loadReviewProject(page); await page.evaluate(() => selectNode('n1')); await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('review'); await page.locator('.command-palette-item').filter({ hasText: 'Comments and review' }).click();
  13 |   await page.locator('#reviewAuthor').fill('QA'); await page.locator('#reviewBody').fill('<img src=x onerror=alert(1)> Check'); await page.getByRole('button', { name: 'New thread / 新建线程' }).click();
  14 |   const thread = page.locator('.review-thread'); await expect(thread).toHaveCount(1); await expect(thread).toContainText('<img src=x onerror=alert(1)> Check'); await expect(thread.locator('img')).toHaveCount(0);
  15 |   await thread.getByLabel('Reply to n1').fill('Second comment'); await thread.getByRole('button', { name: 'Add / 添加' }).click(); await expect(thread.locator('.review-comment')).toHaveCount(2);
  16 |   await thread.getByLabel('Review status for n1').selectOption('approved'); expect(await page.evaluate(() => getFlowDocumentPayload().reviewThreads[0].status)).toBe('approved');
  17 |   const payload = await page.evaluate(() => getFlowDocumentPayload()); await page.evaluate(data => loadFlowDocumentPayload(data), payload); expect(await page.evaluate(() => DiagramWeave.doc.reviewThreads[0].comments.length)).toBe(2);
  18 |   await page.evaluate(() => { DiagramWeave.switchPage('p2'); selectNode('n2'); showReviewPanel(); }); await thread.getByRole('button', { name: 'Locate / 定位' }).click(); expect(await page.evaluate(() => DiagramWeave.doc.currentPageId)).toBe('p1'); expect(await page.evaluate(() => state.selectedNodeId)).toBe('n1');
  19 | });
  20 | 
  21 | test('phone review entry is read-only', async ({ page }) => {
  22 |   await page.setViewportSize({ width: 390, height: 844 }); await loadReviewProject(page); await page.evaluate(() => { DiagramWeave.doc.reviewThreads = [{ id: 'r1', targetType: 'node', targetId: 'n1', status: 'pending', comments: [{ id: 'c1', body: 'Phone note' }] }]; openMobileReview(); });
  23 |   await expect(page.locator('#reviewOverlay')).toHaveClass(/visible/); await expect(page.getByText('Phone note')).toBeVisible(); await expect(page.locator('#reviewComposer')).toBeHidden(); await expect(page.locator('.review-comment-form')).toBeHidden(); await expect(page.locator('.review-thread select')).toBeDisabled();
  24 | });
  25 | 
```