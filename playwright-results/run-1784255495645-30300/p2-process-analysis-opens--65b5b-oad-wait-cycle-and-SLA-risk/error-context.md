# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-process-analysis.spec.js >> opens deterministic process analysis with critical path, load, wait, cycle, and SLA risk
- Location: tests\e2e\p2-process-analysis.spec.js:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#processAnalysisOverlay [role="dialog"]')
Timeout: 5000ms
- Expected substring  - 1
+ Received string     + 6

- Risk / 风险 (+2d)
+
+     ×
+     Process Analysis / 流程分析
+     1 pages · 2 unreachable · 1 bottlenecks · 1 cycles · 0 SLA risks
+     OperationsCritical path / 关键路径start → review (6d)Unreachable / 不可达cycleA, cycleBBottlenecks / 瓶颈startLongest wait / 最长等待Not configured / 未配置Cycles / 循环cycleA → cycleBSLANot configured / 未配置Role load / 角色负荷QA: 1 / 5d; Ops: 2 / 2d; Unassigned: 2 / 2dTargets / 目标: startreviewcycleAcycleB
+   

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#processAnalysisOverlay [role="dialog"]')
    14 × locator resolved to <div role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="processAnalysisTitle" class="confirm-dialog process-analysis-dialog">…</div>
       - unexpected value "
    ×
    Process Analysis / 流程分析
    1 pages · 2 unreachable · 1 bottlenecks · 1 cycles · 0 SLA risks
    OperationsCritical path / 关键路径start → review (6d)Unreachable / 不可达cycleA, cycleBBottlenecks / 瓶颈startLongest wait / 最长等待Not configured / 未配置Cycles / 循环cycleA → cycleBSLANot configured / 未配置Role load / 角色负荷QA: 1 / 5d; Ops: 2 / 2d; Unassigned: 2 / 2dTargets / 目标: startreviewcycleAcycleB
  "

```

```yaml
- dialog "Process Analysis / 流程分析":
  - button "Close process analysis": ×
  - text: Process Analysis / 流程分析 1 pages · 2 unreachable · 1 bottlenecks · 1 cycles · 0 SLA risks
  - heading "Operations" [level=3]
  - strong: Critical path / 关键路径
  - text: start → review (6d)
  - strong: Unreachable / 不可达
  - text: cycleA, cycleB
  - strong: Bottlenecks / 瓶颈
  - text: start
  - strong: Longest wait / 最长等待
  - text: Not configured / 未配置
  - strong: Cycles / 循环
  - text: cycleA → cycleB
  - strong: SLA
  - text: Not configured / 未配置
  - strong: Role load / 角色负荷
  - text: "QA: 1 / 5d; Ops: 2 / 2d; Unassigned: 2 / 2d Targets / 目标:"
  - button "start"
  - button "review"
  - button "cycleA"
  - button "cycleB"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('opens deterministic process analysis with critical path, load, wait, cycle, and SLA risk', async ({ page }) => {
  4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); });
  5  |   await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveProcessAnalysis);
  6  |   await page.evaluate(() => loadFlowDocumentPayload({ version: 2, schemaVersion: 3, slaDays: 4, currentPageId: 'p1', pages: [{ id: 'p1', name: 'Operations', slaDays: 4, nodes: [
  7  |     { id: 'start', label: 'Start', shape: 'start', duration: 1, role: 'Ops' },
  8  |     { id: 'review', label: 'Review', shape: 'rectangle', duration: 5, role: 'QA', waitDays: 2 },
  9  |     { id: 'side', label: 'Side', shape: 'rectangle', duration: 1, role: 'Ops' },
  10 |     { id: 'cycleA', label: 'A', duration: 1 }, { id: 'cycleB', label: 'B', duration: 1 },
  11 |   ], connections: [
  12 |     { id: 'c1', from: 'start', to: 'review' }, { id: 'c2', from: 'start', to: 'side' },
  13 |     { id: 'c3', from: 'cycleA', to: 'cycleB' }, { id: 'c4', from: 'cycleB', to: 'cycleA' },
  14 |   ] }] }));
  15 |   const before = await page.evaluate(() => JSON.stringify(getFlowDocumentPayload()));
  16 |   await page.keyboard.press('Control+k'); await page.locator('#commandPaletteInput').fill('analysis');
  17 |   await page.locator('.command-palette-item').filter({ hasText: 'Process analysis' }).click();
  18 |   const dialog = page.locator('#processAnalysisOverlay [role="dialog"]'); await expect(dialog).toBeVisible();
  19 |   await expect(dialog).toHaveAttribute('aria-labelledby', 'processAnalysisTitle');
  20 |   await expect(dialog).toContainText('start → review (6d)'); await expect(dialog).toContainText('cycleA → cycleB');
> 21 |   await expect(dialog).toContainText('Risk / 风险 (+2d)'); await expect(dialog).toContainText('QA: 1 / 5d');
     |                        ^ Error: expect(locator).toContainText(expected) failed
  22 |   expect(await page.evaluate(() => JSON.stringify(getFlowDocumentPayload()))).toBe(before);
  23 |   await dialog.getByRole('button', { name: 'review' }).click(); expect(await page.evaluate(() => state.selectedNodeId)).toBe('review');
  24 | });
  25 | 
```