/**
 * DiagramWeave Canvas Interaction
 *
 * 從 flowchart-editor.js 抽取的畫布交互層（Phase 1 拆分第 4 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveCanvasInteraction。
 *
 * 包含：
 * - 節點事件綁定（setupNodeEvents：拖拽、連接樁、雙擊編輯）
 * - 連線創建/重連（startConnection / startReconnect 及鼠標跟隨）
 * - 選中管理（selectNode / selectConnection / deselectAll / 多選）
 * - 編輯命令（editLabel / deleteSelected / duplicateSelected / 層級調整）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：getNodeVisualShape、getShapePortAnchors、
 *   hideContextMenu、isDuplicateConnection、isMobileViewMode、revertLastSaveState、
 *   showContextMenu、syncFlowTableConnHighlight、syncFlowTableFromConnections、
 *   syncFlowTableHighlight、updateProperties、focusPresentationOnNode
 * - 已提取模塊函數：createNode、ensureNodeRefIds、renderAll、renderAllNodes、
 *   renderConnections、scheduleRenderConnections、saveState、showToast
 * - DiagramWeave 命名空間（typeof 守衛）、window.t（i18n）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveGroupContainer, createNode, ensureNodeRefIds, focusPresentationOnNode, getNodeVisualShape, getShapePortAnchors, hideContextMenu, isDuplicateConnection, isMobileViewMode, renderAllNodes, renderConnections, revertLastSaveState, scheduleRenderConnections, showContextMenu, syncFlowTableConnHighlight, syncFlowTableFromConnections, syncFlowTableHighlight, t, updateProperties */
(function initDiagramWeaveCanvasInteraction(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const presentState = DiagramWeaveEditorCore.presentState;
  const canvasTransform = typeof document !== 'undefined' ? document.getElementById('canvasTransform') : null;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

// ===== 获取连接点位置 =====
function getPortPos(node, port) {
  const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
  const a = anchors[port] || anchors.top;
  return { x: node.x + node.w * a.x, y: node.y + node.h * a.y };
}

// ===== 节点事件 =====
function setupNodeEvents(el, node) {
  // 鼠标按下
  el.addEventListener('mousedown', (e) => {
    if (isMobileViewMode()) { e.preventDefault(); selectNode(node.id); return; }
    if (state.tool === 'pan') return;

    // 检查是否点击了端口（包括端口的热区伪元素）
    const portEl = e.target.closest('.port');
    if (portEl) {
      // 开始连线
      e.preventDefault();
      e.stopPropagation();
      startConnection(node.id, portEl.dataset.port, e);
      return;
    }

    if (state.tool === 'connect') {
      e.preventDefault();
      e.stopPropagation();
      // 连线模式：点击节点自动找最近端口
      const port = getNearestPort(node, e);
      startConnection(node.id, port, e);
      return;
    }

    if (presentState.active) {
      e.preventDefault();
      e.stopPropagation();
      focusPresentationOnNode(node.id);
      return;
    }

    e.stopPropagation();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    selectNode(node.id, additive);
    // Phase 2：点击组成员选中整组（加选模式不展开，保持逐节点 toggle 语义）
    if (!additive && node.groupId && typeof DiagramWeaveGroupContainer !== 'undefined') {
      DiagramWeaveGroupContainer.selectNodeIds(DiagramWeaveGroupContainer.getGroupMemberIds(node.id));
    }

    // 开始拖拽
    state.isDragging = true;
    state.dragNode = node;
    // Phase 2：拖拽集合 = 组成员 + 容器后代（mousemove 按增量整体移动）
    state.dragNodeIds = typeof DiagramWeaveGroupContainer !== 'undefined'
      ? DiagramWeaveGroupContainer.getMoveSet(node.id)
      : [node.id];
    const rect = canvasWrapper.getBoundingClientRect();
    const mx = (e.clientX - rect.left - state.panX) / state.zoom;
    const my = (e.clientY - rect.top - state.panY) / state.zoom;
    state.dragOffset = { x: mx - node.x, y: my - node.y };
    saveState();
  });

  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (node.shape === 'offpage' && node.targetPageId && e.altKey && typeof DiagramWeave !== 'undefined') {
      DiagramWeave.switchPage(node.targetPageId);
      return;
    }
    startEditing(node);
  });

  // 右键菜单
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectNode(node.id);
    showContextMenu(e.clientX, e.clientY);
  });
}

function getNearestPort(node, e) {
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = (e.clientX - rect.left - state.panX) / state.zoom;
  const my = (e.clientY - rect.top - state.panY) / state.zoom;
  return getNearestPortByPoint(mx, my, node);
}

function getNearestPortByPoint(mx, my, node) {
  const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
  let nearest = 'top';
  let minDist = Infinity;
  for (const name of ['top', 'bottom', 'left', 'right']) {
    const a = anchors[name];
    const px = node.x + node.w * a.x;
    const py = node.y + node.h * a.y;
    const dist = Math.hypot(px - mx, py - my);
    if (dist < minDist) { minDist = dist; nearest = name; }
  }
  return nearest;
}

function resolveConnectTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = (e.clientX - rect.left - state.panX) / state.zoom;
  const my = (e.clientY - rect.top - state.panY) / state.zoom;

  if (el) {
    const targetPort = el.closest('.port');
    if (targetPort) {
      const targetNode = targetPort.closest('.node');
      if (targetNode) return { nodeId: targetNode.id, port: targetPort.dataset.port };
    }
    const targetNodeEl = el.closest('.node');
    if (targetNodeEl) {
      const targetNode = state.nodes.find(n => n.id === targetNodeEl.id);
      if (targetNode) return { nodeId: targetNode.id, port: getNearestPortByPoint(mx, my, targetNode) };
    }
  }

  for (const node of state.nodes) {
    const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
    for (const [portName, anchor] of Object.entries(anchors)) {
      const pos = { x: node.x + node.w * anchor.x, y: node.y + node.h * anchor.y };
      if (Math.hypot(pos.x - mx, pos.y - my) < 34) {
        return { nodeId: node.id, port: portName };
      }
    }
  }
  return null;
}

// ===== 连线逻辑 =====
function startConnection(nodeId, port, e) {
  if (state.isReconnecting) return;
  e.preventDefault();
  e.stopPropagation();
  state.isConnecting = true;
  state.connectFrom = { nodeId, port };
  state.connectTempEnd = null;
  document.body.classList.add('conn-edit-mode');
  // 绑定 document 级别事件，确保拖拽过程中不丢失
  document.addEventListener('mousemove', onConnectMouseMove);
  document.addEventListener('mouseup', onConnectMouseUp);
}

// document 级别的连线鼠标移动
function onConnectMouseMove(e) {
  if (!state.isConnecting) return;
  e.preventDefault();
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = (e.clientX - rect.left - state.panX) / state.zoom;
  const my = (e.clientY - rect.top - state.panY) / state.zoom;
  state.connectTempEnd = { x: mx, y: my };
  scheduleRenderConnections();
}

// document 级别的连线鼠标释放
function onConnectMouseUp(e) {
  if (!state.isConnecting) return;
  document.removeEventListener('mousemove', onConnectMouseMove);
  document.removeEventListener('mouseup', onConnectMouseUp);
  document.body.classList.remove('conn-edit-mode');

  const target = resolveConnectTarget(e);
  if (target && target.nodeId !== state.connectFrom.nodeId) {
    endConnection(target.nodeId, target.port);
    return;
  }

  state.isConnecting = false;
  state.connectTempEnd = null;
  renderConnections();
}

function endConnection(targetNodeId, port) {
  if (!state.isConnecting) return;
  if (state.connectFrom.nodeId === targetNodeId) {
    state.isConnecting = false;
    document.body.classList.remove('conn-edit-mode');
    renderConnections();
    return;
  }

  // 检查是否已存在相同连线
  const exists = state.connections.find(c =>
    c.from === state.connectFrom.nodeId && c.to === targetNodeId &&
    c.fromPort === state.connectFrom.port && c.toPort === port
  );
  if (exists) {
    state.isConnecting = false;
    document.body.classList.remove('conn-edit-mode');
    renderConnections();
    return;
  }

  saveState();
  state.connections.push({
    id: 'conn_' + state.nextId++,
    from: state.connectFrom.nodeId,
    fromPort: state.connectFrom.port,
    to: targetNodeId,
    toPort: port,
    label: '',
  });
  state.isConnecting = false;
  renderConnections();
}

function startReconnect(connId, end, e) {
  e.preventDefault();
  e.stopPropagation();
  const conn = state.connections.find(c => c.id === connId);
  if (!conn) return;

  state.isReconnecting = true;
  state.reconnectConnId = connId;
  state.reconnectEnd = end;
  state.connectTempEnd = null;
  state.selectedConnectionId = connId;
  state.selectedNodeId = null;
  document.body.classList.add('conn-edit-mode');
  document.addEventListener('mousemove', onReconnectMouseMove);
  document.addEventListener('mouseup', onReconnectMouseUp);
}

function onReconnectMouseMove(e) {
  if (!state.isReconnecting) return;
  e.preventDefault();
  const rect = canvasWrapper.getBoundingClientRect();
  state.connectTempEnd = {
    x: (e.clientX - rect.left - state.panX) / state.zoom,
    y: (e.clientY - rect.top - state.panY) / state.zoom,
  };
  scheduleRenderConnections();
}

function onReconnectMouseUp(e) {
  if (!state.isReconnecting) return;
  document.removeEventListener('mousemove', onReconnectMouseMove);
  document.removeEventListener('mouseup', onReconnectMouseUp);
  document.body.classList.remove('conn-edit-mode');

  const conn = state.connections.find(c => c.id === state.reconnectConnId);
  const end = state.reconnectEnd;
  state.isReconnecting = false;
  state.connectTempEnd = null;

  if (!conn) {
    state.reconnectConnId = null;
    state.reconnectEnd = null;
    renderConnections();
    return;
  }

  const target = resolveConnectTarget(e);
  state.reconnectConnId = null;
  state.reconnectEnd = null;

  if (!target) {
    renderConnections();
    return;
  }

  const otherNodeId = end === 'from' ? conn.to : conn.from;
  if (target.nodeId === otherNodeId) {
    showToast('连线两端不能是同一个节点');
    renderConnections();
    return;
  }

  saveState();
  if (end === 'from') {
    conn.from = target.nodeId;
    conn.fromPort = target.port;
  } else {
    conn.to = target.nodeId;
    conn.toPort = target.port;
  }

  if (isDuplicateConnection(conn.from, conn.to, conn.fromPort, conn.toPort, conn.id)) {
    revertLastSaveState();
    showToast('已存在相同连线');
    renderAll();
    return;
  }

  renderAll();
  syncFlowTableFromConnections();
  showToast('连线已更新');
}

// ===== 选中 =====
function selectConnection(connId) {
  state.selectedNodeId = null;
  state.selectedConnectionId = connId;
  renderAll();
  syncFlowTableConnHighlight(connId);
}

function getSelectedNodeIds() {
  const ids = Array.isArray(state.selectedNodeIds) ? state.selectedNodeIds : [];
  const valid = ids.filter(id => state.nodes.some(node => node.id === id));
  if (!valid.length && state.selectedNodeId && state.nodes.some(node => node.id === state.selectedNodeId)) valid.push(state.selectedNodeId);
  state.selectedNodeIds = [...new Set(valid)];
  return state.selectedNodeIds;
}

function selectNode(nodeId, additive = false) {
  const selected = getSelectedNodeIds();
  if (additive) {
    state.selectedNodeIds = selected.includes(nodeId)
      ? selected.filter(id => id !== nodeId)
      : [...selected, nodeId];
    state.selectedNodeId = state.selectedNodeIds.at(-1) || null;
  } else {
    state.selectedNodeId = nodeId;
    state.selectedNodeIds = nodeId ? [nodeId] : [];
  }
  state.selectedConnectionId = null;
  renderAll();
  syncFlowTableHighlight();
  // Phase 2-1b：组选中高亮——选中组成员时给同组成员加 group-highlight
  applyGroupHighlight();
}

function applyDeepLinkHighlight() {
  const params = new URLSearchParams(window.location.search);
  const highlight = params.get('highlightNode');
  if (!highlight) return;
  const node = state.nodes.find(
    (n) => n.id === highlight || String(n.refId) === highlight,
  );
  if (!node) {
    showToast(`Node not found: ${highlight}`);
    return;
  }
  selectNode(node.id);
  const el = document.getElementById(node.id);
  if (el) {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  }
  showToast(`Highlighted: ${node.label || node.id}`);
}

function loadE2eSeedNodesFromSession() {
  try {
    const raw = sessionStorage.getItem('dw-e2e-seed-nodes');
    if (!raw) return;
    const nodes = JSON.parse(raw);
    if (!Array.isArray(nodes)) return;
    for (const seed of nodes) {
      const shape = seed.shape || 'rectangle';
      const defaults = shapeDefaults[shape] || shapeDefaults.rectangle;
      state.nodes.push({
        ...defaults,
        id: seed.id || `node_${state.nextId++}`,
        shape,
        x: seed.x ?? 80,
        y: seed.y ?? 80,
        w: seed.w ?? defaults.w,
        h: seed.h ?? defaults.h,
        label: seed.label || 'Node',
        refId: seed.refId,
      });
    }
    ensureNodeRefIds();
    if (typeof DiagramWeave !== 'undefined') {
      const page = DiagramWeave.getCurrentPage();
      if (page) {
        page.nodes = state.nodes;
      }
    }
  } catch {
    // ignore invalid e2e seed payload
  }
}

function deselectAll() {
  state.selectedNodeId = null;
  state.selectedNodeIds = [];
  state.selectedConnectionId = null;
  renderAll();
  clearGroupHighlight();
}

/** 清除所有节点上的组高亮类 */
function clearGroupHighlight() {
  document.querySelectorAll('.node.group-highlight').forEach(el => el.classList.remove('group-highlight'));
}

/** Phase 2-1b：组选中高亮——根据当前选中节点的 groupId 给同组成员加 group-highlight */
function applyGroupHighlight() {
  clearGroupHighlight();
  if (typeof DiagramWeaveGroupContainer === 'undefined') return;
  const members = new Set();
  (state.selectedNodeIds || []).forEach(id => {
    const n = state.nodes.find(x => x.id === id);
    if (n && n.groupId) {
      const ids = DiagramWeaveGroupContainer.getGroupMemberIds(n.id);
      ids.forEach(m => { if (m !== id) members.add(m); });
    }
  });
  if (members.size === 0) return;
  members.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('group-highlight');
  });
}

/** 清除 drop-target 高亮（拖拽结束/离开时调用） */
function clearDropTargetHighlight() {
  document.querySelectorAll('.node.drop-target').forEach(el => el.classList.remove('drop-target'));
}

/** 高亮正在悬停的容器节点 */
function highlightDropTargetNode(nodeId) {
  clearDropTargetHighlight();
  if (!nodeId) return;
  const el = document.getElementById(nodeId);
  if (el) el.classList.add('drop-target');
}

/** 全选当前页面上所有 node */
function selectAll() {
  const all = (state.nodes || []).map(n => n.id);
  if (all.length === 0) return;
  state.selectedNodeIds = all;
  state.selectedNodeId = all[all.length - 1];
  state.selectedConnectionId = null;
  renderAll();
}

// ===== 编辑标签 =====
function startEditing(node) {
  const el = document.getElementById(node.id);
  if (!el) return;
  const labelEl = el.querySelector('.node-label');
  labelEl.contentEditable = 'true';
  labelEl.focus();

  // 选中全部文字
  const range = document.createRange();
  range.selectNodeContents(labelEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finish = () => {
    labelEl.contentEditable = 'false';
    const newLabel = labelEl.textContent.trim() || node.label;
    if (newLabel !== node.label) {
      saveState();
      node.label = newLabel;
    }
    labelEl.textContent = node.label;
    updateProperties();
    labelEl.removeEventListener('blur', finish);
    labelEl.removeEventListener('keydown', handleKey);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(); }
    if (e.key === 'Escape') { labelEl.textContent = node.label; finish(); }
  };

  labelEl.addEventListener('blur', finish);
  labelEl.addEventListener('keydown', handleKey);
}

function editLabel() {
  hideContextMenu();
  if (state.selectedNodeId) {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (node) startEditing(node);
  }
}

// ===== 删除 =====
function deleteSelected() {
  hideContextMenu();
  const selectedIds = getSelectedNodeIds();
  if (selectedIds.length) {
    saveState();
    selectedIds.forEach(id => document.getElementById(id)?.remove());
    const selectedSet = new Set(selectedIds);
    state.nodes = state.nodes.filter(n => !selectedSet.has(n.id));
    state.connections = state.connections.filter(c => !selectedSet.has(c.from) && !selectedSet.has(c.to));
    // Phase 2：被删容器的子节点孤儿化，空组合剪除
    if (typeof DiagramWeaveGroupContainer !== 'undefined') DiagramWeaveGroupContainer.handleNodesDeleted(selectedIds);
    state.selectedNodeId = null;
    state.selectedNodeIds = [];
    renderAll();
    showToast('已删除形状');
  } else if (state.selectedConnectionId) {
    saveState();
    state.connections = state.connections.filter(c => c.id !== state.selectedConnectionId);
    state.selectedConnectionId = null;
    renderAll();
    showToast('已删除连线');
  }
}

function clearCanvas() {
  if (state.nodes.length === 0) return;
  saveState();
  state.nodes = [];
  state.connections = [];
  state.groups = [];
  state.swimlaneSets = [];
  state.selectedNodeId = null;
  state.selectedConnectionId = null;
  // 移除所有节点DOM和泳道
  canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());
  renderAll();
  showToast(typeof t === 'function' ? t('toast.cleared') : '画布已清空');
}

// ===== 复制 =====
function duplicateSelected() {
  hideContextMenu();
  if (!state.selectedNodeId) return;
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  const newNode = createNode(node.shape, node.x + 20, node.y + 20, node.label);
  newNode.w = node.w;
  newNode.h = node.h;
  newNode.fillColor = node.fillColor;
  newNode.strokeColor = node.strokeColor;
  newNode.textColor = node.textColor || 'auto';
  // Phase 2：副本留在原容器内；组合关系不继承（须显式 Ctrl+G）
  if (node.containerId) newNode.containerId = node.containerId;
  if (node.isContainer) newNode.isContainer = true;
  state.nodes.push(newNode);
  selectNode(newNode.id);
  showToast('已复制');
}

// ===== 层级 =====
function bringToFront() {
  hideContextMenu();
  if (!state.selectedNodeId) return;
  const idx = state.nodes.findIndex(n => n.id === state.selectedNodeId);
  if (idx >= 0) {
    const [node] = state.nodes.splice(idx, 1);
    state.nodes.push(node);
    renderAllNodes();
  }
}

function sendToBack() {
  hideContextMenu();
  if (!state.selectedNodeId) return;
  const idx = state.nodes.findIndex(n => n.id === state.selectedNodeId);
  if (idx >= 0) {
    const [node] = state.nodes.splice(idx, 1);
    state.nodes.unshift(node);
    renderAllNodes();
  }
}

  // ===== 命名空间挂载 =====
  global.DiagramWeaveCanvasInteraction = {
    getPortPos,
    setupNodeEvents,
    getNearestPort,
    getNearestPortByPoint,
    resolveConnectTarget,
    startConnection,
    onConnectMouseMove,
    onConnectMouseUp,
    endConnection,
    startReconnect,
    onReconnectMouseMove,
    onReconnectMouseUp,
    selectConnection,
    getSelectedNodeIds,
    selectNode,
    applyDeepLinkHighlight,
    loadE2eSeedNodesFromSession,
    deselectAll,
    selectAll,
    applyGroupHighlight,
    clearGroupHighlight,
    highlightDropTargetNode,
    clearDropTargetHighlight,
    startEditing,
    editLabel,
    deleteSelected,
    clearCanvas,
    duplicateSelected,
    bringToFront,
    sendToBack,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
