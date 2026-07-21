(function (root) {
  'use strict';
  const Result = typeof root.DiagramWeaveResult !== 'undefined' && root.DiagramWeaveResult && typeof root.DiagramWeaveResult.createError === 'function'
    ? root.DiagramWeaveResult
    : { 
        createError: (issues, data, warnings) => ({ success: false, data: data ?? null, issues, warnings: warnings || [] }), 
        createSuccess: (data, issues, warnings) => ({ success: true, data, issues: issues || [], warnings: warnings || [] }) 
      };
  const report = (code, zh, en, severity = 'warning', targetId = '') => ({ code, severity, targetId, message: { zh, en }, reason: en });
  const mermaidShapes = { rect: 'rectangle', square: 'rectangle', rounded: 'rectangle', stadium: 'terminator', circle: 'ellipse', doublecircle: 'ellipse', diamond: 'diamond', hexagon: 'hexagon', cylinder: 'database', database: 'database', subroutine: 'predefined' };
  function makeDocument(nodes, connections, name, direction = 'TB') { return { version: 2, schemaVersion: 3, projectName: name, currentPageId: 'page_1', nextPageId: 2, nextId: nodes.length + 1, importDirection: direction, pages: [{ id: 'page_1', name, nodes, connections, layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1 }] }; }
  function layout(nodes, direction = 'TB') { const horizontal = ['LR', 'RL'].includes(direction); nodes.forEach((node, index) => { if (node.x == null) node.x = 80 + (horizontal ? index * 220 : (index % 4) * 210); if (node.y == null) node.y = 70 + (horizontal ? (index % 4) * 120 : Math.floor(index / 4) * 130); }); }
  function label(value, fallback = '') { if (typeof value === 'string') return value; return String(value?.text || value?.label || fallback); }
  function nodeData(id, index, shape, text, box = {}) { return { id: String(id), refId: index + 1, shape, label: label(text, id), x: box.x ?? null, y: box.y ?? null, w: box.w || (shape === 'diamond' ? 130 : 150), h: box.h || (shape === 'diamond' ? 90 : 64), fillColor: '#ffffff', strokeColor: '#44546a', textColor: 'auto', detail: '', duration: 0, role: '', layer: 0, targetPageId: null }; }

  async function importMermaid(text) {
    const warnings = [], issues = []; let mermaid;
    try { mermaid = (await import('./vendor/mermaid-parser.mjs')).default; mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', maxEdges: 2000, flowchart: { htmlLabels: false } }); }
    catch (error) { return Result.createError([report('MERMAID_DEPENDENCY', 'Mermaid 解析器无法加载', 'Mermaid parser could not be loaded', 'error')], null, [String(error?.message || error)]); }
    let parsed; try { parsed = await mermaid.parse(String(text || '')); } catch (error) { return Result.createError([report('MERMAID_SYNTAX', 'Mermaid 语法无效', 'Invalid Mermaid syntax', 'error')], null, [String(error?.message || error)]); }
    const type = parsed?.diagramType || mermaid.detectType(String(text || ''));
    if (!String(type).startsWith('flowchart') && type !== 'graph') return Result.createError([report('MERMAID_UNSUPPORTED_TYPE', `不支持 Mermaid 类型：${type}`, `Unsupported Mermaid diagram type: ${type}`, 'error')]);
    let diagram; try { diagram = await mermaid.mermaidAPI.getDiagramFromText(String(text)); } catch (error) { return Result.createError([report('MERMAID_PARSE_FAILED', '无法读取 Mermaid 流程图', 'Could not read Mermaid flowchart', 'error')], null, [String(error?.message || error)]); }
    const db = diagram.db, vertices = [...(db.getVertices?.().values?.() || [])], edges = db.getEdges?.() || [], direction = db.getDirection?.() || 'TB';
    const nodes = vertices.map((vertex, index) => { const shape = mermaidShapes[vertex.type] || 'rectangle'; if (vertex.type && !mermaidShapes[vertex.type]) warnings.push(report('MERMAID_UNSUPPORTED_SHAPE', `节点 ${vertex.id} 的形状 ${vertex.type} 已转为矩形`, `Shape ${vertex.type} on ${vertex.id} was converted to rectangle`, 'warning', vertex.id)); return nodeData(vertex.id, index, shape, vertex.text); }); layout(nodes, direction);
    const ids = new Set(nodes.map(node => node.id));
    const connections = edges.map((edge, index) => ({ id: String(edge.id || `edge_${index + 1}`), from: String(edge.start), to: String(edge.end), fromPort: direction === 'LR' ? 'right' : 'bottom', toPort: direction === 'LR' ? 'left' : 'top', label: label(edge.text) })).filter(connection => { if (ids.has(connection.from) && ids.has(connection.to)) return true; issues.push(report('MERMAID_MISSING_REFERENCE', 'Mermaid 连线引用缺失节点', 'Mermaid edge references a missing node', 'error', connection.id)); return false; });
    if ((db.getSubGraphs?.() || []).length) warnings.push(report('MERMAID_SUBGRAPH_FLATTENED', '子图已扁平化导入', 'Subgraphs were flattened during import'));
    return Result.createSuccess({ document: makeDocument(nodes, connections, 'Mermaid Import', direction), format: 'mermaid' }, issues, warnings);
  }

  root.DiagramWeaveMermaidImporter = Object.freeze({ importMermaid, mermaidShapes });
})(typeof globalThis !== 'undefined' ? globalThis : window);