import { test, expect } from '@playwright/test';

async function prepare(page) {
  await page.addInitScript(() => { window.__dwSkipRemoteBootstrap = true; sessionStorage.setItem('dw-initial-save-prompted', '1'); }); await page.goto('/flowchart-editor.html'); await page.waitForFunction(() => window.__dwEditorReady && DiagramWeaveExternalImporters && DiagramWeaveExtensionKernel.invokeExtensionAsync);
}

test('official Mermaid parser produces preview before applying a labeled cyclic flowchart', async ({ page }) => {
  await prepare(page); const source = `flowchart LR
subgraph Core
A([Start]) -->|submit| B{Review}
B -->|retry| A
B --> C[Done]
end`;
  await page.locator('#mermaidFileInput').setInputFiles({ name: 'review.mmd', mimeType: 'text/plain', buffer: Buffer.from(source) });
  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/); expect(await page.evaluate(() => state.nodes.length)).toBe(0);
  await expect(page.locator('#importPreviewIssues')).toContainText('Subgraphs were flattened'); await page.locator('#applyImportPreviewBtn').click();
  await expect(page.locator('.node')).toHaveCount(3); expect(await page.evaluate(() => state.connections.map(connection => connection.label))).toEqual(expect.arrayContaining(['submit', 'retry']));
  expect(await page.evaluate(() => state.connections.some(connection => connection.from === 'B' && connection.to === 'A'))).toBe(true);
});

test('bpmn-moddle preserves DI coordinates and reports unsupported controlled-subset elements', async ({ page }) => {
  await prepare(page); const xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" targetNamespace="qa">
 <process id="Process_1" name="Approval"><startEvent id="Start" name="Start"/><userTask id="Task" name="Review"/><exclusiveGateway id="Gate" name="Approved?"/><intermediateCatchEvent id="Timer" name="Wait"/><endEvent id="End" name="Done"/><sequenceFlow id="F1" sourceRef="Start" targetRef="Task"/><sequenceFlow id="F2" name="check" sourceRef="Task" targetRef="Gate"/><sequenceFlow id="F3" sourceRef="Gate" targetRef="End"/></process>
 <bpmndi:BPMNDiagram id="D"><bpmndi:BPMNPlane id="P" bpmnElement="Process_1"><bpmndi:BPMNShape id="S1" bpmnElement="Start"><dc:Bounds x="100" y="120" width="36" height="36"/></bpmndi:BPMNShape><bpmndi:BPMNShape id="S2" bpmnElement="Task"><dc:Bounds x="220" y="100" width="120" height="70"/></bpmndi:BPMNShape><bpmndi:BPMNShape id="S3" bpmnElement="Gate"><dc:Bounds x="420" y="110" width="50" height="50"/></bpmndi:BPMNShape><bpmndi:BPMNShape id="S4" bpmnElement="End"><dc:Bounds x="580" y="120" width="36" height="36"/></bpmndi:BPMNShape><bpmndi:BPMNEdge id="E1" bpmnElement="F1"><di:waypoint x="136" y="138"/><di:waypoint x="220" y="135"/></bpmndi:BPMNEdge></bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</definitions>`;
  await page.locator('#bpmnFileInput').setInputFiles({ name: 'approval.bpmn', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  await expect(page.locator('#importPreviewOverlay')).toHaveClass(/visible/); expect(await page.evaluate(() => state.nodes.length)).toBe(0); await expect(page.locator('#importPreviewIssues')).toContainText('Unsupported BPMN element');
  await page.locator('#applyImportPreviewBtn').click(); await expect(page.locator('.node')).toHaveCount(4);
  expect(await page.evaluate(() => ({ start: state.nodes.find(node => node.id === 'Start'), flow: state.connections.find(connection => connection.id === 'F1') }))).toMatchObject({ start: { x: 100, y: 120 }, flow: { waypoints: [{ x: 136, y: 138 }, { x: 220, y: 135 }] } });
});

test('invalid and unsupported external diagrams return structured issues without mutation', async ({ page }) => {
  await prepare(page); const result = await page.evaluate(async () => ({
    mermaid: await DiagramWeaveExtensionKernel.invokeExtensionAsync('import.mermaid', { text: 'sequenceDiagram\nA->>B: Hello' }),
    bpmn: await DiagramWeaveExtensionKernel.invokeExtensionAsync('import.bpmn', { xml: '<definitions>' }), nodes: state.nodes.length,
  }));
  expect(result.nodes).toBe(0); expect(result.mermaid.success).toBe(false); expect(result.mermaid.issues[0].code).toBe('MERMAID_UNSUPPORTED_TYPE'); expect(result.bpmn.success).toBe(false); expect(result.bpmn.issues[0].code).toBe('BPMN_XML_INVALID');
});
