/**
 * DiagramWeave Flow Table
 *
 * 從 flowchart-editor.js 抽取的流程文本/表格編輯器（Phase 1 拆分第 9 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveFlowTable。
 *
 * 包含：
 * - 文本 ↔ 畫布雙向同步（toggleTextEditor / syncTextFromCanvas / applyFlowText）
 * - 流程表格渲染與編輯（renderFlowTableFromState / createFlowNodeTableRow / collectFlowRowsFromTable）
 * - 流程文本解析（parseFlowText / parseFlowTextNodeRow / flowToText）
 * - 導入數據準備（prepareFlowImportData / applyFlowData / hasGraphPath）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：escapeHtml、initFastTooltips、normalizePortName
 * - 已提取模塊函數：autoLayoutSwimlane、createNode、ensureNodeRefIds、
 *   formatNodeOutgoingConnections、renderSwimlanes、runAutoLayout、selectConnection、
 *   selectNode、updateTransform
 * - DiagramWeave / DiagramWeaveEditorState 命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveEditorState, DiagramWeaveGroupContainer, autoLayoutSwimlane, createNode, ensureNodeRefIds, escapeHtml, formatNodeOutgoingConnections, initFastTooltips, normalizePortName, renderSwimlanes, runAutoLayout, selectConnection, selectNode, updateTransform */
(function initDiagramWeaveFlowTable(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

// ===== 流程文本编辑 =====
const FC_TEXT_VERSION = 2;

function escapeFlowField(val) {
  return String(val ?? '').replace(/\|/g, '/').replace(/\n/g, ' ').trim();
}

function isKnownFlowShape(val) {
  return !!val && Object.prototype.hasOwnProperty.call(shapeDefaults, val);
}

function formatTargetPageForText(node) {
  if (!node.targetPageId || typeof DiagramWeave === 'undefined') return '';
  const page = DiagramWeave.getPageById(node.targetPageId);
  return page ? page.name : node.targetPageId;
}

function resolveTargetPageFromText(raw) {
  const trimmed = escapeFlowField(raw);
  if (!trimmed || typeof DiagramWeave === 'undefined') return null;
  const byId = DiagramWeave.doc.pages.find(p => p.id === trimmed);
  if (byId) return byId.id;
  const byName = DiagramWeave.doc.pages.find(p => p.name === trimmed);
  return byName ? byName.id : null;
}

function toggleTextEditor() {
  const panel = document.getElementById('textEditorPanel');
  const isOpen = panel.classList.toggle('open');
  document.getElementById('btn-text-editor').classList.toggle('active', isOpen);
  if (isOpen) {
    syncTextFromCanvas(true);
    initFastTooltips(panel);
  }
}

function syncTextFromCanvas(silent) {
  ensureNodeRefIds();
  document.getElementById('flowTextArea').value = flowToText();
  renderFlowTableFromState();
  if (!silent) showToast('已从图形刷新表格');
}

function switchFlowTableTab(tab) {
  document.querySelectorAll('.flow-table-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.flowTab === tab);
  });
  document.getElementById('flowNodeTable').style.display = tab === 'nodes' ? '' : 'none';
  document.getElementById('flowConnTable').style.display = tab === 'connections' ? '' : 'none';
  document.getElementById('flowNodeToolbar').style.display = tab === 'nodes' ? '' : 'none';
  document.getElementById('flowConnToolbar').style.display = tab === 'connections' ? '' : 'none';
  if (tab === 'connections') renderFlowTableFromState();
}

function buildShapeSelectOptions(selected) {
  const keys = Object.keys(shapeDefaults).sort((a, b) =>
    (shapeNames[a] || a).localeCompare(shapeNames[b] || b, 'zh-CN'));
  return keys.map(k =>
    `<option value="${k}"${k === selected ? ' selected' : ''}>${escapeHtml(shapeNames[k] || k)}</option>`).join('');
}

function getNextFlowTableRefId() {
  let max = 0;
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    const v = parseInt(tr.querySelector('[data-f="refId"]')?.value, 10);
    if (!isNaN(v) && v > max) max = v;
  });
  state.nodes.forEach(n => {
    const v = parseInt(n.refId, 10);
    if (!isNaN(v) && v > max) max = v;
  });
  return max + 1;
}

function createFlowNodeTableRow(row) {
  const tr = document.createElement('tr');
  tr.dataset.refId = row.refId;
  tr.innerHTML = `
    <td><input data-f="refId" type="number" min="1" value="${escapeHtml(String(row.refId))}"></td>
    <td><input data-f="label" type="text" value="${escapeHtml(row.label || '')}" placeholder="简介"></td>
    <td class="col-next"><span class="flow-table-readonly" data-f="next">${escapeHtml(row.next || '—')}</span></td>
    <td><input data-f="role" type="text" value="${escapeHtml(row.role || '')}" placeholder="角色"></td>
    <td><select data-f="shape">${buildShapeSelectOptions(row.shape || 'rectangle')}</select></td>
    <td><textarea data-f="detail" rows="1">${escapeHtml(row.detail || '')}</textarea></td>
    <td><input data-f="duration" type="number" min="0" step="0.5" value="${row.duration ?? 0}"></td>
    <td><input data-f="lane" type="number" min="0" value="${row.lane !== '' && row.lane !== undefined ? row.lane : ''}"></td>
    <td><input data-f="layer" type="number" min="0" value="${row.layer !== '' && row.layer !== undefined ? row.layer : ''}"></td>
    <td><input data-f="targetPage" type="text" value="${escapeHtml(row.targetPage || '')}" placeholder="页名"></td>
  `;
  tr.querySelector('[data-f="refId"]').addEventListener('change', (e) => {
    tr.dataset.refId = e.target.value;
  });
  tr.addEventListener('click', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    const refId = tr.querySelector('[data-f="refId"]').value;
    focusFlowTableNodeRow(refId);
  });
  return tr;
}

function createFlowConnTableRow(row, connId) {
  const tr = document.createElement('tr');
  if (connId) tr.dataset.connId = connId;
  tr.innerHTML = `
    <td><input data-f="from" type="number" min="1" value="${row.from ?? ''}"></td>
    <td><input data-f="to" type="number" min="1" value="${row.to ?? ''}"></td>
    <td><input data-f="label" type="text" value="${escapeHtml(row.label || '')}" placeholder="条件"></td>
  `;
  tr.addEventListener('click', (e) => {
    if (e.target.closest('input')) return;
    document.querySelectorAll('#flowConnTableBody tr').forEach(r => r.classList.remove('selected'));
    tr.classList.add('selected');
    if (connId) selectConnection(connId);
  });
  return tr;
}

function renderFlowTableFromState() {
  ensureNodeRefIds();
  const refByNodeId = new Map(state.nodes.map(n => [n.id, n.refId]));
  const nodeBody = document.getElementById('flowNodeTableBody');
  const connBody = document.getElementById('flowConnTableBody');
  if (!nodeBody || !connBody) return;

  nodeBody.innerHTML = '';
  [...state.nodes]
    .sort((a, b) => (a.refId || 0) - (b.refId || 0))
    .forEach(n => {
      nodeBody.appendChild(createFlowNodeTableRow({
        refId: n.refId,
        label: n.label,
        next: formatNodeOutgoingConnections(n) || '—',
        role: n.role || '',
        shape: n.shape,
        detail: n.detail || '',
        duration: n.duration || 0,
        lane: n.lane ?? '',
        layer: n.layer ?? '',
        targetPage: formatTargetPageForText(n),
      }));
    });

  connBody.innerHTML = '';
  let connCount = 0;
  state.connections.forEach(c => {
    const from = refByNodeId.get(c.from);
    const to = refByNodeId.get(c.to);
    if (from === undefined || to === undefined) return;
    connCount++;
    connBody.appendChild(createFlowConnTableRow({ from, to, label: c.label || '' }, c.id));
  });
  if (connCount === 0) {
    connBody.innerHTML = '<tr class="flow-table-empty"><td colspan="3">暂无连线。在画布上用连线工具拖拽，或点「+ 添加连线行」。</td></tr>';
  }

  const connTabCount = document.getElementById('flowConnTabCount');
  if (connTabCount) {
    connTabCount.textContent = connCount > 0 ? `(${connCount})` : '';
  }

  syncFlowTableHighlight();
  if (state.selectedConnectionId) syncFlowTableConnHighlight(state.selectedConnectionId);
}

function syncFlowTableConnHighlight(connId) {
  document.querySelectorAll('#flowConnTableBody tr').forEach(tr => {
    tr.classList.toggle('selected', tr.dataset.connId === connId);
  });
  const tr = document.querySelector(`#flowConnTableBody tr[data-conn-id="${connId}"]`);
  if (tr) tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function syncFlowTableFromConnections() {
  const panel = document.getElementById('textEditorPanel');
  if (!panel || !panel.classList.contains('open')) return;
  renderFlowTableFromState();
}

function syncFlowTableHighlight(refId) {
  const node = state.selectedNodeId
    ? state.nodes.find(n => n.id === state.selectedNodeId)
    : null;
  const highlightRef = refId ?? node?.refId;
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    tr.classList.toggle('selected', highlightRef != null && String(tr.dataset.refId) === String(highlightRef));
  });
  if (state.selectedConnectionId) {
    syncFlowTableConnHighlight(state.selectedConnectionId);
  } else {
    document.querySelectorAll('#flowConnTableBody tr').forEach(tr => tr.classList.remove('selected'));
  }
  if (highlightRef != null) {
    const tr = document.querySelector(`#flowNodeTableBody tr[data-ref-id="${highlightRef}"]`);
    if (tr) tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function syncFlowTableRowFromNode(node) {
  const tr = document.querySelector(`#flowNodeTableBody tr[data-ref-id="${node.refId}"]`);
  if (!tr) return;
  tr.querySelector('[data-f="label"]').value = node.label || '';
  const nextEl = tr.querySelector('[data-f="next"]');
  if (nextEl) nextEl.textContent = formatNodeOutgoingConnections(node) || '—';
  tr.querySelector('[data-f="role"]').value = node.role || '';
  tr.querySelector('[data-f="shape"]').value = node.shape || 'rectangle';
  tr.querySelector('[data-f="detail"]').value = node.detail || '';
  tr.querySelector('[data-f="duration"]').value = node.duration || 0;
  if (tr.querySelector('[data-f="lane"]')) tr.querySelector('[data-f="lane"]').value = node.lane ?? '';
  if (tr.querySelector('[data-f="layer"]')) tr.querySelector('[data-f="layer"]').value = node.layer ?? '';
  if (tr.querySelector('[data-f="targetPage"]')) {
    tr.querySelector('[data-f="targetPage"]').value = formatTargetPageForText(node);
  }
}

function focusFlowTableNodeRow(refId) {
  const node = state.nodes.find(n => String(n.refId) === String(refId));
  if (node) {
    selectNode(node.id);
    focusNodeInView(node);
  }
  syncFlowTableHighlight(refId);
}

function focusNodeInView(node) {
  const rect = canvasWrapper.getBoundingClientRect();
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  state.panX = rect.width / 2 - cx * state.zoom;
  state.panY = rect.height / 2 - cy * state.zoom;
  updateTransform();
}

function addFlowTableNodeRow() {
  const body = document.getElementById('flowNodeTableBody');
  const row = createFlowNodeTableRow({
    refId: getNextFlowTableRefId(),
    label: '',
    role: '',
    shape: 'rectangle',
    detail: '',
    duration: 0,
    lane: '',
    layer: '',
    targetPage: '',
  });
  body.appendChild(row);
  row.scrollIntoView({ block: 'nearest' });
}

function addFlowTableConnRow() {
  document.getElementById('flowConnTableBody').appendChild(createFlowConnTableRow({ from: '', to: '', label: '' }));
}

function deleteFlowTableSelectedRows(kind) {
  if (kind === 'nodes') {
    const selected = document.querySelectorAll('#flowNodeTableBody tr.selected');
    if (!selected.length) {
      showToast('请先点击节点表中的一行使其高亮');
      return;
    }
    selected.forEach(tr => tr.remove());
    return;
  }
  const selected = document.querySelectorAll('#flowConnTableBody tr.selected:not(.flow-table-empty)');
  if (!selected.length) {
    showToast('请先点击连线表中的一行使其高亮');
    return;
  }
  selected.forEach(tr => tr.remove());
}

function toggleTextEditorHelp() {
  const help = document.getElementById('textEditorHelp');
  const hint = document.getElementById('textEditorHint');
  const btn = document.getElementById('textEditorHelpToggle');
  if (!help || !hint) return;
  const expanded = hint.classList.toggle('text-editor-hint-expanded');
  help.classList.toggle('text-editor-help-expanded', expanded);
  if (btn) btn.textContent = expanded ? '收起' : '说明';
}

function collectFlowRowsFromTable() {
  const getCellValue = (row, field) => row.querySelector(`[data-f="${field}"]`)?.value ?? '';
  const nodeRows = [];
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    const refId = parseInt(getCellValue(tr, 'refId'), 10);
    if (isNaN(refId)) return;
    nodeRows.push({
      refId,
      label: getCellValue(tr, 'label').trim() || '未命名',
      role: getCellValue(tr, 'role').trim(),
      shape: getCellValue(tr, 'shape') || 'rectangle',
      detail: getCellValue(tr, 'detail').trim(),
      duration: parseFloat(getCellValue(tr, 'duration')) || 0,
      lane: getCellValue(tr, 'lane') !== '' ? parseInt(getCellValue(tr, 'lane'), 10) || 0 : undefined,
      layer: getCellValue(tr, 'layer') !== '' ? parseInt(getCellValue(tr, 'layer'), 10) || 0 : undefined,
      targetPage: getCellValue(tr, 'targetPage').trim(),
    });
  });

  const connRows = [];
  document.querySelectorAll('#flowConnTableBody tr').forEach(tr => {
    const from = parseInt(getCellValue(tr, 'from'), 10);
    const to = parseInt(getCellValue(tr, 'to'), 10);
    if (isNaN(from) || isNaN(to)) return;
    connRows.push({
      from,
      to,
      label: getCellValue(tr, 'label').trim(),
    });
  });

  return { nodeRows, connRows };
}

function flowToText() {
  ensureNodeRefIds();
  const sorted = [...state.nodes].sort((a, b) => (a.refId || 0) - (b.refId || 0));
  const refByNodeId = new Map(sorted.map(n => [n.id, n.refId]));

  const lines = [
    `# FC-TEXT v${FC_TEXT_VERSION}`,
    '# 列: 编号 | 简介 | 角色 | 形状 | 详细说明 | 耗时(天) | 泳道 | 图层 | 目标页',
    '# 简介=形状上显示的一行标题 · 形状=图形类型 · 详细说明=右侧面板长文 · 目标页=跨页引用时填页名',
    '# 连线: 起点编号 -> 终点编号 | 条件标签',
    '# 去向（只读，导出时自动生成，编辑请改「连线」段）',
    '',
    '[节点]',
  ];

  sorted.forEach(n => {
    const lane = n.lane !== undefined && n.lane !== null && n.lane !== '' ? n.lane : '';
    const layer = n.layer !== undefined && n.layer !== null && n.layer !== '' ? n.layer : '';
    const outgoing = formatNodeOutgoingConnections(n);
    lines.push([
      n.refId,
      escapeFlowField(n.label),
      escapeFlowField(n.role),
      n.shape || 'rectangle',
      escapeFlowField(n.detail),
      n.duration || 0,
      lane,
      layer,
      escapeFlowField(formatTargetPageForText(n)),
    ].join(' | ') + (outgoing ? `  # → ${outgoing}` : ''));
  });

  lines.push('', '[连线]');
  state.connections.forEach(c => {
    const fromRef = refByNodeId.get(c.from);
    const toRef = refByNodeId.get(c.to);
    if (fromRef === undefined || toRef === undefined) return;
    const label = c.label ? ` | ${c.label}` : '';
    lines.push(`${fromRef} -> ${toRef}${label}`);
  });

  return lines.join('\n');
}

function parseFlowTextNodeRow(parts, version) {
  const refId = parseInt(parts[0], 10);
  if (isNaN(refId)) return null;

  const useV2 = version >= 2
    || (parts.length >= 4 && isKnownFlowShape(parts[3]) && !isKnownFlowShape(parts[2]));

  if (useV2) {
    return {
      refId,
      label: parts[1] || '未命名',
      role: parts[2] || '',
      shape: isKnownFlowShape(parts[3]) ? parts[3] : 'rectangle',
      detail: parts[4] || '',
      duration: parseFloat(parts[5]) || 0,
      lane: parts[6] !== undefined && parts[6] !== '' ? parseInt(parts[6], 10) || 0 : undefined,
      layer: parts[7] !== undefined && parts[7] !== '' ? parseInt(parts[7], 10) || 0 : undefined,
      targetPage: parts[8] || '',
    };
  }

  return {
    refId,
    label: parts[1] || '未命名',
    shape: isKnownFlowShape(parts[2]) ? parts[2] : 'rectangle',
    detail: parts[3] || '',
    duration: parseFloat(parts[4]) || 0,
    lane: parts[5] !== undefined && parts[5] !== '' ? parseInt(parts[5], 10) || 0 : undefined,
    role: parts[6] || '',
    targetPage: '',
  };
}

function parseFlowText(text) {
  const nodeRows = [];
  const connRows = [];
  let section = '';
  let version = 1;

  text.split('\n').forEach(rawLine => {
    let line = rawLine.trim();
    if (!line) return;
    const commentIdx = line.indexOf('  #');
    if (commentIdx >= 0) line = line.slice(0, commentIdx).trim();
    const versionMatch = line.match(/^#\s*FC-TEXT\s+v(\d+)/i);
    if (versionMatch) {
      version = parseInt(versionMatch[1], 10) || 1;
      return;
    }
    if (line.startsWith('#')) return;
    if (line === '[节点]') { section = 'nodes'; return; }
    if (line === '[连线]') { section = 'connections'; return; }

    if (section === 'nodes') {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 2) return;
      const row = parseFlowTextNodeRow(parts, version);
      if (row) nodeRows.push(row);
    } else if (section === 'connections') {
      const connMatch = line.match(/^(\d+)\s*->\s*(\d+)(?:\s*\|\s*(.+))?$/);
      if (connMatch) {
        connRows.push({
          from: parseInt(connMatch[1], 10),
          to: parseInt(connMatch[2], 10),
          label: (connMatch[3] || '').trim(),
        });
      }
    }
  });

  return { nodeRows, connRows };
}

function applyFlowText() {
  let { nodeRows, connRows } = collectFlowRowsFromTable();
  if (nodeRows.length === 0) {
    const text = document.getElementById('flowTextArea').value;
    if (text.trim()) ({ nodeRows, connRows } = parseFlowText(text));
  }

  if (nodeRows.length === 0) {
    showToast('请至少在节点表中填写一行（含编号）');
    return;
  }

  applyFlowData(nodeRows, connRows);
}

function hasGraphPath(adjacency, from, to) {
  if (from === to) return true;
  const seen = new Set();
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    (adjacency.get(cur) || []).forEach(next => queue.push(next));
  }
  return false;
}

function appendImportNote(row, note) {
  const existing = String(row.detail || '').trim();
  const suffix = `导入参考：${note}`;
  row.detail = existing ? `${existing}\n${suffix}` : suffix;
}

function prepareFlowImportData(nodeRows, connRows, options = {}) {
  const cleanedNodes = nodeRows.map(row => ({ ...row }));
  const nodeByRef = new Map(cleanedNodes.map(row => [row.refId, row]));
  const adjacency = new Map(cleanedNodes.map(row => [row.refId, []]));
  const validConnections = [];
  const skippedConnections = [];
  const referenceConnections = [];

  connRows.forEach((row, index) => {
    const fromNode = nodeByRef.get(row.from);
    const toNode = nodeByRef.get(row.to);
    const rowLabel = row.sourceRow ? `连线表第 ${row.sourceRow} 行` : `连线第 ${index + 1} 行`;
    const reasonPrefix = `${rowLabel} ${row.from} -> ${row.to}`;

    if (!fromNode || !toNode) {
      skippedConnections.push({
        ...row,
        reason: `${reasonPrefix} 引用了不存在的节点`,
      });
      return;
    }

    if (options.reportCycleConnections && hasGraphPath(adjacency, row.to, row.from)) {
      const label = row.label ? `（条件：${row.label}）` : '';
      referenceConnections.push({
        ...row,
        reason: `${reasonPrefix}${label} 与已有路径形成回路，已按文档导入，仅供参考`,
      });
      appendImportNote(fromNode, `存在到「${toNode.label || row.to}」的回路连线${label}，已按文档导入，仅供参考`);
      appendImportNote(toNode, `存在来自「${fromNode.label || row.from}」的回路连线${label}，已按文档导入，仅供参考`);
    }

    validConnections.push(row);
    adjacency.get(row.from).push(row.to);
  });

  return { nodeRows: cleanedNodes, connRows: validConnections, skippedConnections, referenceConnections };
}

function applyFlowData(nodeRows, connRows, showResultToast = true) {
  saveState();
  if (typeof DiagramWeaveEditorState !== 'undefined') DiagramWeaveEditorState.resetSelection(state);
  canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());

  const nodeMap = new Map();
  nodeRows.forEach(row => {
    const shape = shapeDefaults[row.shape] ? row.shape : 'rectangle';
    const nodeX = Number.isFinite(row.x) ? row.x : 0;
    const nodeY = Number.isFinite(row.y) ? row.y : 0;
    const node = createNode(shape, nodeX, nodeY, row.label, row.refId);
    if (Number.isFinite(row.w) && row.w > 0) node.w = row.w;
    if (Number.isFinite(row.h) && row.h > 0) node.h = row.h;
    if (row.fillColor) node.fillColor = row.fillColor;
    if (row.strokeColor) node.strokeColor = row.strokeColor;
    node.detail = row.detail;
    node.duration = row.duration;
    if (row.role) node.role = row.role;
    if (row.lane !== undefined) {
      const laneIndex = parseInt(row.lane, 10);
      if (Number.isFinite(laneIndex)) node.lane = Math.max(0, laneIndex);
    }
    if (row.layer !== undefined) node.layer = row.layer;
    const targetPageId = resolveTargetPageFromText(row.targetPage);
    if (targetPageId) node.targetPageId = targetPageId;
    state.nodes.push(node);
    nodeMap.set(row.refId, node);
  });

  ensureNodeRefIds();
  nodeMap.clear();
  state.nodes.forEach(n => nodeMap.set(n.refId, n));

  connRows.forEach(row => {
    const fromNode = nodeMap.get(row.from);
    const toNode = nodeMap.get(row.to);
    if (fromNode && toNode) {
      state.connections.push({
        id: 'conn_' + state.nextId++,
        from: fromNode.id,
        fromPort: normalizePortName(row.fromPort, 'bottom'),
        to: toNode.id,
        toPort: normalizePortName(row.toPort, 'top'),
        label: row.label,
        labelPos: row.labelPos,
      });
    }
  });

  const hasExplicitCoordinates = nodeRows.some(row => Number.isFinite(row.x) || Number.isFinite(row.y));
  const hasLanes = state.nodes.some(n => n.lane !== undefined);
  const resolveSwimlaneNames = laneSet => {
    const laneIndexes = Array.from(laneSet).sort((a, b) => a - b);
    // Phase 2：泳道集命名优先，无模块/无泳道集时回退「泳道N」合成名
    return typeof DiagramWeaveGroupContainer !== 'undefined'
      ? DiagramWeaveGroupContainer.resolveLaneNames(state.nodes, laneIndexes)
      : laneIndexes.map(i => `泳道${i + 1}`);
  };
  if (!hasExplicitCoordinates && hasLanes) {
    const laneSet = new Set(state.nodes.map(n => n.lane || 0));
    const swimlanes = resolveSwimlaneNames(laneSet);
    autoLayoutSwimlane(swimlanes, 'horizontal');
  } else if (!hasExplicitCoordinates) {
    runAutoLayout('vertical');
  } else if (hasLanes) {
    const laneSet = new Set(state.nodes.map(n => n.lane || 0));
    const swimlanes = resolveSwimlaneNames(laneSet);
    renderSwimlanes(swimlanes, 220, 50, 80, 60, 1, 'horizontal');
  }
  renderAll();
  syncTextFromCanvas(true);
  if (showResultToast) {
    showToast(`已应用：${state.nodes.length} 个节点，${state.connections.length} 条连线`);
  }
}
  global.DiagramWeaveFlowTable = {
    addFlowTableConnRow,
    addFlowTableNodeRow,
    appendImportNote,
    applyFlowData,
    applyFlowText,
    buildShapeSelectOptions,
    collectFlowRowsFromTable,
    createFlowConnTableRow,
    createFlowNodeTableRow,
    deleteFlowTableSelectedRows,
    escapeFlowField,
    flowToText,
    focusFlowTableNodeRow,
    focusNodeInView,
    formatTargetPageForText,
    getNextFlowTableRefId,
    hasGraphPath,
    isKnownFlowShape,
    parseFlowText,
    parseFlowTextNodeRow,
    prepareFlowImportData,
    renderFlowTableFromState,
    resolveTargetPageFromText,
    switchFlowTableTab,
    syncFlowTableConnHighlight,
    syncFlowTableFromConnections,
    syncFlowTableHighlight,
    syncFlowTableRowFromNode,
    syncTextFromCanvas,
    toggleTextEditor,
    toggleTextEditorHelp,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
