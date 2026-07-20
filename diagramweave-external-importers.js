(function (root) {
  'use strict';
  const report = (code, zh, en, severity = 'warning', targetId = '') => ({ code, severity, targetId, message: { zh, en }, reason: en });
  const mermaidShapes = { rect: 'rectangle', square: 'rectangle', rounded: 'rectangle', stadium: 'terminator', circle: 'ellipse', doublecircle: 'ellipse', diamond: 'diamond', hexagon: 'hexagon', cylinder: 'database', database: 'database', subroutine: 'predefined' };
  const bpmnShapes = { 'bpmn:StartEvent': 'start', 'bpmn:EndEvent': 'end', 'bpmn:Task': 'rectangle', 'bpmn:UserTask': 'rectangle', 'bpmn:ServiceTask': 'rectangle', 'bpmn:ManualTask': 'rectangle', 'bpmn:BusinessRuleTask': 'rectangle', 'bpmn:ScriptTask': 'rectangle', 'bpmn:SendTask': 'rectangle', 'bpmn:ReceiveTask': 'rectangle', 'bpmn:ExclusiveGateway': 'diamond', 'bpmn:ParallelGateway': 'diamond' };
  function makeDocument(nodes, connections, name, direction = 'TB') { return { version: 2, schemaVersion: 3, projectName: name, currentPageId: 'page_1', nextPageId: 2, nextId: nodes.length + 1, importDirection: direction, pages: [{ id: 'page_1', name, nodes, connections, layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 }] }; }
  function layout(nodes, direction = 'TB') { const horizontal = ['LR', 'RL'].includes(direction); nodes.forEach((node, index) => { if (node.x == null) node.x = 80 + (horizontal ? index * 220 : (index % 4) * 210); if (node.y == null) node.y = 70 + (horizontal ? (index % 4) * 120 : Math.floor(index / 4) * 130); }); }
  function label(value, fallback = '') { if (typeof value === 'string') return value; return String(value?.text || value?.label || fallback); }
  function nodeData(id, index, shape, text, box = {}) { return { id: String(id), refId: index + 1, shape, label: label(text, id), x: box.x ?? null, y: box.y ?? null, w: box.w || (shape === 'diamond' ? 130 : 150), h: box.h || (shape === 'diamond' ? 90 : 64), fillColor: '#ffffff', strokeColor: '#44546a', textColor: 'auto', detail: '', duration: 0, role: '', layer: 0, targetPageId: null }; }

  async function importMermaid(text) {
    const warnings = [], issues = []; let mermaid;
    try { mermaid = (await import('./vendor/mermaid-parser.mjs')).default; mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', maxEdges: 2000, flowchart: { htmlLabels: false } }); }
    catch (error) { return { success: false, data: null, issues: [report('MERMAID_DEPENDENCY', 'Mermaid 解析器无法加载', 'Mermaid parser could not be loaded', 'error')], warnings: [String(error?.message || error)] }; }
    let parsed; try { parsed = await mermaid.parse(String(text || '')); } catch (error) { return { success: false, data: null, issues: [report('MERMAID_SYNTAX', 'Mermaid 语法无效', 'Invalid Mermaid syntax', 'error')], warnings: [String(error?.message || error)] }; }
    const type = parsed?.diagramType || mermaid.detectType(String(text || ''));
    if (!String(type).startsWith('flowchart') && type !== 'graph') return { success: false, data: null, issues: [report('MERMAID_UNSUPPORTED_TYPE', `不支持 Mermaid 类型：${type}`, `Unsupported Mermaid diagram type: ${type}`, 'error')], warnings: [] };
    let diagram; try { diagram = await mermaid.mermaidAPI.getDiagramFromText(String(text)); } catch (error) { return { success: false, data: null, issues: [report('MERMAID_PARSE_FAILED', '无法读取 Mermaid 流程图', 'Could not read Mermaid flowchart', 'error')], warnings: [String(error?.message || error)] }; }
    const db = diagram.db, vertices = [...(db.getVertices?.().values?.() || [])], edges = db.getEdges?.() || [], direction = db.getDirection?.() || 'TB';
    const nodes = vertices.map((vertex, index) => { const shape = mermaidShapes[vertex.type] || 'rectangle'; if (vertex.type && !mermaidShapes[vertex.type]) warnings.push(report('MERMAID_UNSUPPORTED_SHAPE', `节点 ${vertex.id} 的形状 ${vertex.type} 已转为矩形`, `Shape ${vertex.type} on ${vertex.id} was converted to rectangle`, 'warning', vertex.id)); return nodeData(vertex.id, index, shape, vertex.text); }); layout(nodes, direction);
    const ids = new Set(nodes.map(node => node.id));
    const connections = edges.map((edge, index) => ({ id: String(edge.id || `edge_${index + 1}`), from: String(edge.start), to: String(edge.end), fromPort: direction === 'LR' ? 'right' : 'bottom', toPort: direction === 'LR' ? 'left' : 'top', label: label(edge.text) })).filter(connection => { if (ids.has(connection.from) && ids.has(connection.to)) return true; issues.push(report('MERMAID_MISSING_REFERENCE', 'Mermaid 连线引用缺失节点', 'Mermaid edge references a missing node', 'error', connection.id)); return false; });
    if ((db.getSubGraphs?.() || []).length) warnings.push(report('MERMAID_SUBGRAPH_FLATTENED', '子图已扁平化导入', 'Subgraphs were flattened during import'));
    return { success: nodes.length > 0, data: { document: makeDocument(nodes, connections, 'Mermaid Import', direction), format: 'mermaid' }, issues, warnings };
  }

  async function importBpmn(xml) {
    let BpmnModdle; try { BpmnModdle = (await import('./vendor/bpmn-moddle.mjs')).default; } catch (error) { return { success: false, data: null, issues: [report('BPMN_DEPENDENCY', 'BPMN 解析器无法加载', 'BPMN parser could not be loaded', 'error')], warnings: [String(error?.message || error)] }; }
    let parsed; try { parsed = await new BpmnModdle().fromXML(String(xml || '')); } catch (error) { return { success: false, data: null, issues: [report('BPMN_XML_INVALID', 'BPMN XML 无效', 'Invalid BPMN XML', 'error')], warnings: [String(error?.message || error)] }; }
    const definitions = parsed.rootElement, process = (definitions.rootElements || []).find(element => element.$type === 'bpmn:Process');
    if (!process) return { success: false, data: null, issues: [report('BPMN_PROCESS_MISSING', '未找到 BPMN Process', 'No BPMN Process found', 'error')], warnings: [] };
    const warnings = (parsed.warnings || []).map(item => report('BPMN_PARSE_WARNING', 'BPMN 解析警告', String(item.message || item))), flow = process.flowElements || [], supported = flow.filter(element => bpmnShapes[element.$type]), ids = new Set(supported.map(element => element.id));
    flow.filter(element => !bpmnShapes[element.$type] && element.$type !== 'bpmn:SequenceFlow').forEach(element => warnings.push(report('BPMN_UNSUPPORTED_ELEMENT', `不支持的 BPMN 元素：${element.$type}`, `Unsupported BPMN element: ${element.$type}`, 'warning', element.id)));
    const bounds = new Map(), waypoints = new Map();
    for (const diagram of definitions.diagrams || []) for (const item of diagram.plane?.planeElement || []) { const id = item.bpmnElement?.id; if (!id) continue; if (item.bounds) bounds.set(id, { x: Number(item.bounds.x), y: Number(item.bounds.y), w: Number(item.bounds.width), h: Number(item.bounds.height) }); if (Array.isArray(item.waypoint)) waypoints.set(id, item.waypoint.map(point => ({ x: Number(point.x), y: Number(point.y), locked: true }))); }
    const nodes = supported.map((element, index) => { const node = nodeData(element.id, index, bpmnShapes[element.$type], element.name || element.id, bounds.get(element.id)); node.detail = element.$type; return node; }); layout(nodes);
    const issues = [], connections = flow.filter(element => element.$type === 'bpmn:SequenceFlow').map((element, index) => ({ id: element.id || `flow_${index + 1}`, from: element.sourceRef?.id || '', to: element.targetRef?.id || '', fromPort: 'bottom', toPort: 'top', label: element.name || '', waypoints: waypoints.get(element.id) || [] })).filter(connection => { if (ids.has(connection.from) && ids.has(connection.to)) return true; issues.push(report('BPMN_MISSING_REFERENCE', 'BPMN 顺序流引用缺失或不支持的节点', 'BPMN sequence flow references a missing or unsupported node', 'error', connection.id)); return false; });
    return { success: nodes.length > 0, data: { document: makeDocument(nodes, connections, process.name || 'BPMN Import'), format: 'bpmn' }, issues, warnings };
  }
  root.DiagramWeaveExternalImporters = Object.freeze({ importMermaid, importBpmn });
  if (root.DiagramWeaveExtensionKernel) {
    root.DiagramWeaveExtensionKernel.registerHandler('import.mermaid', input => importMermaid(input?.text)); root.DiagramWeaveExtensionKernel.registerHandler('import.bpmn', input => importBpmn(input?.xml));
    for (const extension of [{ id: 'builtin.import.mermaid', name: 'Official Mermaid Importer', capabilities: ['flowchart', 'preview'] }, { id: 'builtin.import.bpmn', name: 'BPMN Moddle Importer', capabilities: ['bpmn-2.0-controlled-subset', 'preview'] }]) if (!root.DiagramWeaveExtensionKernel.getExtension(extension.id)) root.DiagramWeaveExtensionKernel.registerExtension({ ...extension, version: '1.0.0', kind: 'importer', enabled: true, builtIn: true });
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
