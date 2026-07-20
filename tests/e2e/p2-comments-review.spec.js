import { test, expect } from '@playwright/test';

async function loadReviewProject(page) {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); }); await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveContracts?.addReviewComment);
  await page.evaluate(() => loadFlowDocumentPayload({ version: 2, currentPageId: 'p1', pages: [
    { id: 'p1', name: 'One', nodes: [{ id: 'n1', label: 'Draft', x: 50, y: 50 }], connections: [] },
    { id: 'p2', name: 'Two', nodes: [{ id: 'n2', label: 'Review', x: 50, y: 50 }], connections: [] },
  ] }));
}

test('creates, replies, changes status, navigates, and serializes review threads safely', async ({ page }) => {
  await loadReviewProject(page); await page.evaluate(() => selectNode('n1')); await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('review'); await page.locator('.command-palette-item').filter({ hasText: 'Comments and review' }).click();
  await page.locator('#reviewAuthor').fill('QA'); await page.locator('#reviewBody').fill('<img src=x onerror=alert(1)> Check'); await page.getByRole('button', { name: 'New thread / 新建线程' }).click();
  const thread = page.locator('.review-thread'); await expect(thread).toHaveCount(1); await expect(thread).toContainText('<img src=x onerror=alert(1)> Check'); await expect(thread.locator('img')).toHaveCount(0);
  await thread.getByLabel('Reply to n1').fill('Second comment'); await thread.getByRole('button', { name: 'Add / 添加' }).click(); await expect(thread.locator('.review-comment')).toHaveCount(2);
  await thread.getByLabel('Review status for n1').selectOption('approved'); expect(await page.evaluate(() => getFlowDocumentPayload().reviewThreads[0].status)).toBe('approved');
  const payload = await page.evaluate(() => getFlowDocumentPayload()); await page.evaluate(data => loadFlowDocumentPayload(data), payload); expect(await page.evaluate(() => DiagramWeave.doc.reviewThreads[0].comments.length)).toBe(2);
  await page.evaluate(() => { DiagramWeave.switchPage('p2'); selectNode('n2'); showReviewPanel(); }); await thread.getByRole('button', { name: 'Locate / 定位' }).click(); expect(await page.evaluate(() => DiagramWeave.doc.currentPageId)).toBe('p1'); expect(await page.evaluate(() => state.selectedNodeId)).toBe('n1');
});

test('phone review entry is read-only', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await loadReviewProject(page); await page.evaluate(() => { DiagramWeave.doc.reviewThreads = [{ id: 'r1', targetType: 'node', targetId: 'n1', status: 'pending', comments: [{ id: 'c1', body: 'Phone note' }] }]; openMobileReview(); });
  await expect(page.locator('#reviewOverlay')).toHaveClass(/visible/); await expect(page.getByText('Phone note')).toBeVisible(); await expect(page.locator('#reviewComposer')).toBeHidden(); await expect(page.locator('.review-comment-form')).toBeHidden(); await expect(page.locator('.review-thread select')).toBeDisabled();
});
