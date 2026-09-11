/**
 * DiagramWeave Property Panel UI
 *
 * 從 flowchart-editor.js 抽取的屬性面板渲染與綁定（Phase 1 拆分第 5 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeavePropertyPanelUI。
 * 與既有 editor/property-panel.js（DiagramWeavePropertyPanel，純色板工具）互補。
 *
 * 包含：
 * - 屬性頁籤工作流（initPropertyEditingWorkflow / setPropertyTab）
 * - 批量屬性編輯（applyBatchNodeProperty / syncMixedPropertyControl）
 * - 面板渲染（updateProperties / updatePagePropertiesPanel / 各 updateProp* 綁定）
 * - 節點上下文工具欄（renderNodeContextToolbar）
 * - 輔助：getExportBaseName、deleteCurrentPage、revertLastSaveState
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：adjustSingleConnPorts、escapeHtml、
 *   getDefaultNodeFill、getDefaultNodeStroke、isDuplicateConnection、
 *   syncColorSwatchSelection、syncFlowTableRowFromNode、updateTimeSummary
 * - 已提取模塊函數：ensureNodeRefIds、formatNodeOutgoingConnections、
 *   getSelectedNodeIds、renderAll、renderConnections、renderNode、saveState、showToast
 * - DiagramWeave / DiagramWeavePropertyTools / DiagramWeaveNodeColors 命名空間
 * - window.t（i18n）
 */
/* global DiagramWeaveEditorCore, adjustSingleConnPorts, ensureNodeRefIds, escapeHtml, formatNodeOutgoingConnections, getDefaultNodeFill, getDefaultNodeStroke, getSelectedNodeIds, isDuplicateConnection, renderConnections, renderNode, syncColorSwatchSelection, syncFlowTableFromConnections, syncFlowTableRowFromNode, t, updateTimeSummary */
(function initDiagramWeavePropertyPanelUI(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const presentState = DiagramWeaveEditorCore.presentState;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

let activePropertyTab = 'content';

function initPropertyEditingWorkflow() {
  const sectionFor = id => {
    if (['propLabel', 'propDetail'].includes(id)) return 'content';
    if (['propRole', 'propTypeSelect', 'propDuration', 'propOffpageRow'].includes(id)) return 'flow';
    if (['propFillSwatches', 'propStrokeSwatches', 'propTextColorMode'].includes(id)) return 'appearance';
    return 'data';
  };
  document.querySelectorAll('#propsContent .prop-row').forEach(row => {
    row.dataset.propertySection = sectionFor(row.id || row.querySelector('[id]')?.id || '');
  });
  document.getElementById('propTimeSummary')?.setAttribute('data-property-section', 'flow');
  document.querySelectorAll('#propsContent > .prop-group').forEach(group => {
    if (group.querySelector('#propFillSwatches')) group.dataset.propertySection = 'appearance';
  });
  setPropertyTab('content');
}

function setPropertyTab(tab) {
  activePropertyTab = ['content', 'flow', 'appearance', 'data'].includes(tab) ? tab : 'content';
  document.querySelectorAll('[data-property-tab]').forEach(button =>
    button.setAttribute('aria-selected', String(button.dataset.propertyTab === activePropertyTab)));
  document.querySelectorAll('#propsContent .prop-row').forEach(row => {
    row.hidden = row.dataset.propertySection !== activePropertyTab;
  });
  document.querySelectorAll('#propsContent > .prop-group').forEach(group => {
    group.hidden = group.dataset.propertySection
      ? group.dataset.propertySection !== activePropertyTab
      : !group.querySelector(`.prop-row[data-property-section="${activePropertyTab}"]`);
  });
  const stats = document.getElementById('propTimeSummary');
  if (stats) stats.hidden = activePropertyTab !== 'flow';
}

function getSelectedNodes() {
  const selected = new Set(getSelectedNodeIds());
  return state.nodes.filter(node => selected.has(node.id));
}

function applyBatchNodeProperty(field, value) {
  const nodes = getSelectedNodes();
  if (!nodes.length || typeof DiagramWeavePropertyTools === 'undefined') return false;
  const patches = DiagramWeavePropertyTools.createBatchPatches(nodes, field, value);
  if (!patches.length) return false;
  saveState();
  const byId = new Map(patches.map(patch => [patch.id, patch]));
  nodes.forEach(node => Object.assign(node, byId.get(node.id) || {}));
  renderAll();
  nodes.forEach(syncFlowTableRowFromNode);
  return true;
}

function syncMixedPropertyControl(id, nodes, field, fallback = '') {
  const control = document.getElementById(id);
  if (!control || typeof DiagramWeavePropertyTools === 'undefined') return;
  const result = DiagramWeavePropertyTools.mixedValue(nodes, field, fallback);
  control.dataset.mixed = String(result.mixed);
  if (control.tagName === 'SELECT' && result.mixed) {
    let option = control.querySelector('option[value="__mixed__"]');
    if (!option) { option = new Option('Mixed', '__mixed__'); control.prepend(option); }
    control.value = '__mixed__';
  } else if (control.tagName === 'SELECT') {
    control.querySelector('option[value="__mixed__"]')?.remove();
    control.value = String(result.value);
  } else {
    control.value = result.mixed ? '' : String(result.value);
    if (result.mixed) control.placeholder = 'Mixed';
  }
}

function renderNodeContextToolbar() {
  const toolbar = document.getElementById('nodeContextToolbar');
  const nodeElement = state.selectedNodeId ? document.getElementById(state.selectedNodeId) : null;
  if (!toolbar || !nodeElement || presentState.active) { if (toolbar) toolbar.hidden = true; return; }
  const wrapperRect = canvasWrapper.getBoundingClientRect();
  const nodeRect = nodeElement.getBoundingClientRect();
  toolbar.hidden = false;
  toolbar.style.left = `${Math.max(8, nodeRect.left - wrapperRect.left)}px`;
  toolbar.style.top = `${Math.max(8, nodeRect.top - wrapperRect.top - 40)}px`;
}


// ===== 属性面板 =====

function isFlowStepNode(node) {
  if (!node) return false;
  return !['terminator', 'start', 'end'].includes(node.shape);
}

function formatDurationDays(days) {
  const n = Number(days) || 0;
  if (Number.isInteger(n)) return `${n} 天`;
  return `${n.toFixed(1)} 天`;
}

function computeFlowPageStats() {
  const nodes = state.nodes;
  const totalShapes = nodes.length;
  const totalDuration = nodes.reduce((sum, n) => sum + (Number(n.duration) || 0), 0);

  let longestIds = [];
  if (typeof DiagramWeave !== 'undefined' && typeof DiagramWeave.findLongestPathIds === 'function') {
    longestIds = DiagramWeave.findLongestPathIds();
  } else if (nodes.length) {
    longestIds = [nodes[0].id];
  }

  const longestNodeCount = longestIds.length;
  const longestDuration = longestIds.reduce((sum, id) => {
    const n = nodes.find(item => item.id === id);
    return sum + (Number(n?.duration) || 0);
  }, 0);

  const stepCount = nodes.filter(isFlowStepNode).length;

  let pageCount = 1;
  let pageName = '页面 1';
  if (typeof DiagramWeave !== 'undefined') {
    pageCount = DiagramWeave.doc.pages.length;
    pageName = DiagramWeave.getCurrentPage()?.name || pageName;
  }

  return {
    pageCount,
    pageName,
    totalShapes,
    totalDuration,
    longestNodeCount,
    longestDuration,
    stepCount,
  };
}

function getExportBaseName() {
  const stats = computeFlowPageStats();
  const raw = (stats.pageName || 'diagramweave').trim();
  const safe = raw.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80);
  return safe || 'diagramweave';
}

function updatePagePropertiesPanel() {
  const pageContent = document.getElementById('propsPageContent');
  if (!pageContent) return;

  const stats = computeFlowPageStats();
  const nameInput = document.getElementById('propPageName');
  if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = stats.pageName;
  }

  const scaleEl = document.getElementById('propPageScale');
  if (scaleEl) {
    scaleEl.textContent = stats.pageCount > 1
      ? `共 ${stats.pageCount} 页 · 当前页 ${stats.totalShapes} 个图形`
      : `当前页 ${stats.totalShapes} 个图形`;
  }

  const totalDurEl = document.getElementById('propPageTotalDuration');
  if (totalDurEl) totalDurEl.textContent = formatDurationDays(stats.totalDuration);

  const criticalEl = document.getElementById('propPageCriticalPath');
  if (criticalEl) {
    criticalEl.textContent = longestNodeCountLabel(stats.longestNodeCount, stats.longestDuration);
  }

  const stepEl = document.getElementById('propPageStepCount');
  if (stepEl) stepEl.textContent = `${stats.stepCount} 步`;

  const delRow = document.getElementById('propDeletePageRow');
  if (delRow) delRow.style.display = stats.pageCount > 1 ? 'block' : 'none';
}

function deleteCurrentPage() {
  if (typeof DiagramWeave === 'undefined') return;
  const page = DiagramWeave.getCurrentPage();
  if (page) DiagramWeave.deletePage(page.id);
}

function longestNodeCountLabel(count, duration) {
  if (!count) return '—';
  return `${count} 个节点 · ${formatDurationDays(duration)}`;
}

function updatePropPageName(val) {
  const name = val.trim();
  if (!name) {
    updatePagePropertiesPanel();
    showToast('页面名称不能为空');
    return;
  }
  if (typeof DiagramWeave === 'undefined') return;
  const page = DiagramWeave.getCurrentPage();
  if (!page || page.name === name) return;
  DiagramWeave.setPageName(page.id, name);
  showToast(`页面已重命名为「${name}」`);
}

function updateProperties() {
  const empty = document.getElementById('propsEmpty');
  const pageContent = document.getElementById('propsPageContent');
  const content = document.getElementById('propsContent');
  const connContent = document.getElementById('propsConnContent');

  if (state.selectedConnectionId) {
    const conn = state.connections.find(c => c.id === state.selectedConnectionId);
    if (!conn) return;
    if (empty) empty.style.display = 'none';
    if (pageContent) pageContent.style.display = 'none';
    content.style.display = 'none';
    connContent.style.display = 'block';

    ensureNodeRefIds();
    const fromSel = document.getElementById('propConnFrom');
    const toSel = document.getElementById('propConnTo');
    const labelInput = document.getElementById('propConnLabel');
    if (fromSel) {
      fromSel.innerHTML = buildNodeSelectOptions(conn.from);
      fromSel.value = conn.from;
    }
    if (toSel) {
      toSel.innerHTML = buildNodeSelectOptions(conn.to);
      toSel.value = conn.to;
    }
    if (labelInput) labelInput.value = conn.label || '';
    const labelPosSel = document.getElementById('propConnLabelPos');
    if (labelPosSel) labelPosSel.value = conn.labelPos || 'auto';
    return;
  }

  if (connContent) connContent.style.display = 'none';

  if (state.selectedNodeId) {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!node) return;
    const selectedNodes = getSelectedNodes();
    const batchStatus = document.getElementById('propertyBatchStatus');
    if (batchStatus) {
      batchStatus.hidden = selectedNodes.length < 2;
      batchStatus.textContent = selectedNodes.length > 1 ? `${selectedNodes.length} nodes selected · batch editing` : '';
    }
    if (empty) empty.style.display = 'none';
    if (pageContent) pageContent.style.display = 'none';
    content.style.display = 'block';
    const propRefId = document.getElementById('propRefId');
    if (propRefId) propRefId.textContent = node.refId ?? '—';
    const propNextConn = document.getElementById('propNextConn');
    if (propNextConn) {
      const outgoing = formatNodeOutgoingConnections(node);
      propNextConn.textContent = outgoing || '（无出线）';
    }
    document.getElementById('propLabel').value = node.label;
    document.getElementById('propTypeSelect').value = node.shape;
    syncColorSwatchSelection();
    const textColorMode = document.getElementById('propTextColorMode');
    const textColorCustom = document.getElementById('propTextColorCustom');
    const nodeTextColor = node.textColor || 'auto';
    if (textColorMode) {
      textColorMode.value = ['auto', '#111320', '#ffffff'].includes(nodeTextColor)
        ? nodeTextColor
        : 'custom';
    }
    if (textColorCustom) {
      textColorCustom.value = /^#[0-9a-f]{6}$/i.test(nodeTextColor)
        ? nodeTextColor
        : (typeof DiagramWeaveNodeColors !== 'undefined'
          ? DiagramWeaveNodeColors.resolveTextColor(node.fillColor, nodeTextColor)
          : '#ffffff');
    }
    document.getElementById('propDetail').value = node.detail || '';
    document.getElementById('propDuration').value = node.duration || '';
    const propRole = document.getElementById('propRole');
    if (propRole) propRole.value = node.role || '';
    const propLayer = document.getElementById('propLayer');
    if (propLayer && typeof DiagramWeave !== 'undefined') {
      const page = DiagramWeave.getCurrentPage();
      propLayer.innerHTML = page.layers.map(l =>
        `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
      propLayer.value = String(node.layer ?? 0);
    }
    if (selectedNodes.length > 1) {
      syncMixedPropertyControl('propRole', selectedNodes, 'role', '');
      syncMixedPropertyControl('propLayer', selectedNodes, 'layer', 0);
      syncMixedPropertyControl('propTextColorMode', selectedNodes, 'textColor', 'auto');
      const fill = DiagramWeavePropertyTools.mixedValue(selectedNodes, 'fillColor', getDefaultNodeFill());
      const stroke = DiagramWeavePropertyTools.mixedValue(selectedNodes, 'strokeColor', getDefaultNodeStroke());
      if (fill.mixed) document.querySelectorAll('#propFillSwatches .color-swatch').forEach(button => button.classList.remove('selected'));
      if (stroke.mixed) document.querySelectorAll('#propStrokeSwatches .color-swatch').forEach(button => button.classList.remove('selected'));
    }
    const offpageRow = document.getElementById('propOffpageRow');
    const propTargetPage = document.getElementById('propTargetPage');
    if (offpageRow && propTargetPage) {
      const isOffpage = node.shape === 'offpage';
      offpageRow.style.display = isOffpage ? 'flex' : 'none';
      if (isOffpage && typeof DiagramWeave !== 'undefined') {
        propTargetPage.innerHTML = '<option value="">（未选择）</option>' +
          DiagramWeave.doc.pages
            .filter(p => p.id !== DiagramWeave.doc.currentPageId)
            .map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
            .join('');
        propTargetPage.value = node.targetPageId || '';
      }
    }
    // 显示耗时统计
    document.getElementById('propTimeSummary').style.display = 'block';
    updateTimeSummary();
  } else {
    const batchStatus = document.getElementById('propertyBatchStatus');
    if (batchStatus) batchStatus.hidden = true;
    if (empty) empty.style.display = 'none';
    content.style.display = 'none';
    if (pageContent) {
      pageContent.style.display = 'block';
      updatePagePropertiesPanel();
    } else if (empty) {
      empty.style.display = 'block';
    }
  }
}

function buildNodeSelectOptions(selectedId) {
  ensureNodeRefIds();
  return [...state.nodes]
    .sort((a, b) => (a.refId || 0) - (b.refId || 0))
    .map(n => `<option value="${n.id}"${n.id === selectedId ? ' selected' : ''}>${n.refId}. ${escapeHtml(n.label || '未命名')}</option>`)
    .join('');
}

function getSelectedConnection() {
  return state.connections.find(c => c.id === state.selectedConnectionId) || null;
}

function revertLastSaveState() {
  if (!state.undoStack.length) return;
  const snap = state.undoStack.pop();
  const prev = JSON.parse(snap);
  state.nodes = prev.nodes;
  state.connections = prev.connections;
  state.nextId = prev.nextId;
}

function updatePropConnFrom(nodeId) {
  const conn = getSelectedConnection();
  if (!conn || conn.from === nodeId) return;
  if (nodeId === conn.to) {
    showToast('起点不能与终点相同');
    updateProperties();
    return;
  }
  saveState();
  conn.from = nodeId;
  adjustSingleConnPorts(conn);
  if (isDuplicateConnection(conn.from, conn.to, conn.fromPort, conn.toPort, conn.id)) {
    revertLastSaveState();
    showToast('已存在相同连线');
    renderAll();
    return;
  }
  renderAll();
  syncFlowTableFromConnections();
}

function updatePropConnTo(nodeId) {
  const conn = getSelectedConnection();
  if (!conn || conn.to === nodeId) return;
  if (nodeId === conn.from) {
    showToast('终点不能与起点相同');
    updateProperties();
    return;
  }
  saveState();
  conn.to = nodeId;
  adjustSingleConnPorts(conn);
  if (isDuplicateConnection(conn.from, conn.to, conn.fromPort, conn.toPort, conn.id)) {
    revertLastSaveState();
    showToast('已存在相同连线');
    renderAll();
    return;
  }
  renderAll();
  syncFlowTableFromConnections();
}

function updatePropConnLabel(val) {
  const conn = getSelectedConnection();
  if (!conn) return;
  const label = val.trim();
  if (label === (conn.label || '')) return;
  saveState();
  conn.label = label;
  renderAll();
  syncFlowTableFromConnections();
}

function updatePropConnLabelPos(val) {
  const conn = getSelectedConnection();
  if (!conn) return;
  const pos = val || 'auto';
  if ((conn.labelPos || 'auto') === pos) return;
  saveState();
  conn.labelPos = pos;
  renderConnections();
}

function updatePropLabel(val) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.label = val;
  // Phase 3-2：标签改变时自动适配节点尺寸（仅放大，不缩小）
  if (typeof window.DiagramWeaveNodeLifecycle !== 'undefined') {
    const fit = window.DiagramWeaveNodeLifecycle.fitNodeToLabel(node);
    if (fit.changed) {
      node.w = fit.w;
      node.h = fit.h;
    }
  }
  renderNode(node);
  syncFlowTableRowFromNode(node);
}

function updatePropType(newShape) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node || node.shape === newShape) return;
  saveState();
  node.shape = newShape;
  // 移除旧 DOM 并重新渲染
  const oldEl = document.getElementById(node.id);
  if (oldEl) oldEl.remove();
  renderNode(node);
  renderConnections();
  updateProperties();
  syncFlowTableRowFromNode(node);
}

function updatePropDetail(val) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.detail = val;
  syncFlowTableRowFromNode(node);
}

function updatePropDuration(val) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.duration = parseFloat(val) || 0;
  updateTimeSummary();
  syncFlowTableRowFromNode(node);
}

function updatePropRole(val) {
  applyBatchNodeProperty('role', val.trim());
}


  // ===== 命名空间挂载 =====
  global.DiagramWeavePropertyPanelUI = {
    initPropertyEditingWorkflow,
    setPropertyTab,
    getSelectedNodes,
    applyBatchNodeProperty,
    syncMixedPropertyControl,
    renderNodeContextToolbar,
    isFlowStepNode,
    formatDurationDays,
    computeFlowPageStats,
    getExportBaseName,
    updatePagePropertiesPanel,
    deleteCurrentPage,
    longestNodeCountLabel,
    updatePropPageName,
    updateProperties,
    buildNodeSelectOptions,
    getSelectedConnection,
    revertLastSaveState,
    updatePropConnFrom,
    updatePropConnTo,
    updatePropConnLabel,
    updatePropConnLabelPos,
    updatePropLabel,
    updatePropType,
    updatePropDetail,
    updatePropDuration,
    updatePropRole,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
