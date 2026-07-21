(function (root) {
  'use strict';
  const Result = typeof root.DiagramWeaveResult !== 'undefined' && root.DiagramWeaveResult && typeof root.DiagramWeaveResult.createError === 'function'
    ? root.DiagramWeaveResult
    : { 
        createError: (issues, data, warnings) => ({ success: false, data: data ?? null, issues, warnings: warnings || [] }), 
        createSuccess: (data, issues, warnings) => ({ success: true, data, issues: issues || [], warnings: warnings || [] }) 
      };
  const report = (code, zh, en, severity = 'warning', targetId = '') => ({ code, severity, targetId, message: { zh, en }, reason: en });
  const bpmnShapes = { 'bpmn:StartEvent': 'start', 'bpmn:EndEvent': 'end', 'bpmn:Task': 'rectangle', 'bpmn:UserTask': 'rectangle', 'bpmn:ServiceTask': 'rectangle', 'bpmn:ManualTask': 'rectangle', 'bpmn:BusinessRuleTask': 'rectangle', 'bpmn:ScriptTask': 'rectangle', 'bpmn:SendTask': 'rectangle', 'bpmn:ReceiveTask': 'rectangle', 'bpmn:ExclusiveGateway': 'diamond', 'bpmn:ParallelGateway': 'diamond' };
  function makeDocument(nodes, connections, name, direction = 'TB') { return { version: 2, schemaVersion: 3, projectName: name, currentPageId: 'page_1', nextPageId: 2, nextId: nodes.length + 1, importDirection: direction, pages: [{ id: 'page_1', name, nodes, connections, layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 }] }; }
  function layout(nodes, direction = 'TB') { const horizontal = ['LR', 'RL'].includes(direction); nodes.forEach((node, index) => { if (node.x == null) node.x = 80 + (horizontal ? index * 220 : (index % 4) * 210); if (node.y == null) node.y = 70 + (horizontal ? (index % 4) * 120 : Math.floor(index / 4) * 130); }); }
  function label(value, fallback = '') { if (typeof value === 'string') return value; return String(value?.text || value?.label || fallback); }
  function nodeData(id, index, shape, text, box = {}) { return { id: String(id), refId: index + 1, shape, label: label(text, id), x: box.x ?? null, y: box.y ?? null, w: box.w || (shape === 'diamond' ? 130 : 150), h: box.h || (shape === 'diamond' ? 90 : 64), fillColor: '#ffffff', strokeColor: '#44546a', textColor: 'auto', detail: '', duration: 0, role: '', layer: 0, targetPageId: null }; }

  async function importBpmn(xml) {
    let BpmnModdle; try { BpmnModdle = (await import('./vendor/bpmn-moddle.mjs')).default; } catch (error) { return Result.createError([report('BPMN_DEPENDENCY', 'BPMN 解析器无法加载', 'BPMN parser could not be loaded', 'error')], null, [String(error?.message || error)]); }
    let parsed; try { parsed = await new BpmnModdle().fromXML(String(xml || '')); } catch (error) { return Result.createError([report('BPMN_XML_INVALID', 'BPMN XML 无效', 'Invalid BPMN XML', 'error')], null, [String(error?.message || error)]); }
    const definitions = parsed.rootElement, process = (definitions.rootElements || []).find(element => element.$type === 'bpmn:Process');
    if (!process) return Result.createError([report('BPMN_PROCESS_MISSING', '未找到 BPMN Process', 'No BPMN Process found', 'error')]);
    const warnings = (parsed.warnings || []).map(item => report('BPMN_PARSE_WARNING', 'BPMN 解析警告', String(item.message || item))), flow = process.flowElements || [], supported = flow.filter(element => bpmnShapes[element.$type]), ids = new Set(supported.map(element => element.id));
    flow.filter(element => !bpmnShapes[element.$type] && element.$type !== 'bpmn:SequenceFlow').forEach(element => warnings.push(report('BPMN_UNSUPPORTED_ELEMENT', `不支持的 BPMN 元素：${element.$type}`, `Unsupported BPMN element: ${element.$type}`, 'warning', element.id)));
    const bounds = new Map(), waypoints = new Map();
    for (const diagram of definitions.diagrams || []) for (const item of diagram.plane?.planeElement || []) { const id = item.bpmnElement?.id; if (!id) continue; if (item.bounds) bounds.set(id, { x: Number(item.bounds.x), y: Number(item.bounds.y), w: Number(item.bounds.width), h: Number(item.bounds.height) }); if (Array.isArray(item.waypoint)) waypoints.set(id, item.waypoint.map(point => ({ x: Number(point.x), y: Number(point.y), locked: true }))); }
    const nodes = supported.map((element, index) => { const node = nodeData(element.id, index, bpmnShapes[element.$type], element.name || element.id, bounds.get(element.id)); node.detail = element.$type; return node; }); layout(nodes);
    const issues = [], connections = flow.filter(element => element.$type === 'bpmn:SequenceFlow').map((element, index) => ({ id: element.id || `flow_${index + 1}`, from: element.sourceRef?.id || '', to: element.targetRef?.id || '', fromPort: 'bottom', toPort: 'top', label: element.name || '', waypoints: waypoints.get(element.id) || [] })).filter(connection => { if (ids.has(connection.from) && ids.has(connection.to)) return true; issues.push(report('BPMN_MISSING_REFERENCE', 'BPMN 顺序流引用缺失或不支持的节点', 'BPMN sequence flow references a missing or unsupported node', 'error', connection.id)); return false; });
    return Result.createSuccess({ document: makeDocument(nodes, connections, process.name || 'BPMN Import'), format: 'bpmn' }, issues, warnings);
  }

  root.DiagramWeaveBpmnImporter = Object.freeze({ importBpmn, bpmnShapes });
})(typeof globalThis !== 'undefined' ? globalThis : window);