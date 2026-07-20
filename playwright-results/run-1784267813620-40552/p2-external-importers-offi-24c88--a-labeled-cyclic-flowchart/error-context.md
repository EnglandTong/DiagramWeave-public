# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-external-importers.spec.js >> official Mermaid parser produces preview before applying a labeled cyclic flowchart
- Location: tests\e2e\p2-external-importers.spec.js:7:1

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
  3  | async function prepare(page) {
> 4  |   await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); }); await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveExternalImporters && DiagramWeaveExtensionKernel.invokeExtensionAsync);
     |                                                                                                                                                   ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/flowchart-editor.html
  5  | }
  6  | 
  7  | test('official Mermaid parser produces preview before applying a labeled cyclic flowchart', async ({ page }) => {
  8  |   await prepare(page); const source = `flowchart LR
  9  | subgraph Core
  10 | A([Start]) -->|submit| B{Review}
  11 | B -->|retry| A
  12 | B --> C[Done]
  13 | end`;
  14 |   await page.locator('#mermaidFileInput').setInputFiles({ name: 'review.mmd', mimeType: 'text/plain', buffer: Buffer.from(source) });
  15 |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/); expect(await page.evaluate(() => state.nodes.length)).toBe(0);
  16 |   await expect(page.locator('#importPreviewIssues')).toContainText('Subgraphs were flattened'); await page.locator('#applyImportPreviewBtn').click();
  17 |   await expect(page.locator('.node')).toHaveCount(3); expect(await page.evaluate(() => state.connections.map(connection => connection.label))).toEqual(expect.arrayContaining(['submit', 'retry']));
  18 |   expect(await page.evaluate(() => state.connections.some(connection => connection.from === 'B' && connection.to === 'A'))).toBe(true);
  19 | });
  20 | 
  21 | test('bpmn-moddle preserves DI coordinates and reports unsupported controlled-subset elements', async ({ page }) => {
  22 |   await prepare(page); const xml = `<?xml version="1.0" encoding="UTF-8"?>
  23 | <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" targetNamespace="qa">
  24 |  <process id="Process_1" name="Approval"><startEvent id="Start" name="Start"/><userTask id="Task" name="Review"/><exclusiveGateway id="Gate" name="Approved?"/><intermediateCatchEvent id="Timer" name="Wait"/><endEvent id="End" name="Done"/><sequenceFlow id="F1" sourceRef="Start" targetRef="Task"/><sequenceFlow id="F2" name="check" sourceRef="Task" targetRef="Gate"/><sequenceFlow id="F3" sourceRef="Gate" targetRef="End"/></process>
  25 |  <bpmndi:BPMNDiagram id="D"><bpmndi:BPMNPlane id="P" bpmnElement="Process_1"><bpmndi:BPMNShape id="S1" bpmnElement="Start"><dc:Bounds x="100" y="120" width="36" height="36"/></bpmndi:BPMNShape><bpmndi:BPMNShape id="S2" bpmnElement="Task"><dc:Bounds x="220" y="100" width="120" height="70"/></bpmndi:BPMNShape><bpmndi:BPMNShape id="S3" bpmnElement="Gate"><dc:Bounds x="420" y="110" width="50" height="50"/></bpmndi:BPMNShape><bpmndi:BPMNShape id="S4" bpmnElement="End"><dc:Bounds x="580" y="120" width="36" height="36"/></bpmndi:BPMNShape><bpmndi:BPMNEdge id="E1" bpmnElement="F1"><di:waypoint x="136" y="138"/><di:waypoint x="220" y="135"/></bpmndi:BPMNEdge></bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
  26 | </definitions>`;
  27 |   await page.locator('#bpmnFileInput').setInputFiles({ name: 'approval.bpmn', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  28 |   await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/); expect(await page.evaluate(() => state.nodes.length)).toBe(0); await expect(page.locator('#importPreviewIssues')).toContainText('Unsupported BPMN element');
  29 |   await page.locator('#applyImportPreviewBtn').click(); await expect(page.locator('.node')).toHaveCount(4);
  30 |   expect(await page.evaluate(() => ({ start: state.nodes.find(node => node.id === 'Start'), flow: state.connections.find(connection => connection.id === 'F1') }))).toMatchObject({ start: { x: 100, y: 120 }, flow: { waypoints: [{ x: 136, y: 138 }, { x: 220, y: 135 }] } });
  31 | });
  32 | 
  33 | test('invalid and unsupported external diagrams return structured issues without mutation', async ({ page }) => {
  34 |   await prepare(page); const result = await page.evaluate(async () => ({
  35 |     mermaid: await DiagramWeaveExtensionKernel.invokeExtensionAsync('import.mermaid', { text: 'sequenceDiagram\nA->>B: Hello' }),
  36 |     bpmn: await DiagramWeaveExtensionKernel.invokeExtensionAsync('import.bpmn', { xml: '<definitions>' }), nodes: state.nodes.length,
  37 |   }));
  38 |   expect(result.nodes).toBe(0); expect(result.mermaid.success).toBe(false); expect(result.mermaid.issues[0].code).toBe('MERMAID_UNSUPPORTED_TYPE'); expect(result.bpmn.success).toBe(false); expect(result.bpmn.issues[0].code).toBe('BPMN_XML_INVALID');
  39 | });
  40 | 
```