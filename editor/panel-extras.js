/**
 * DiagramWeave Panel Extras
 *
 * 從 flowchart-editor.js 抽取的面板輔助工作流（Phase 1 拆分第 20 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeavePanelExtras。
 *
 * 包含：
 * - 畫布空狀態（updateCanvasEmptyState / dismissCanvasEmptyState）
 * - 側欄抽屜（togglePanelDrawer）
 * - 屬性面板擴展（updatePropTextColor / updatePropTargetPage / navigateOffpageTarget /
 *   updatePropLayer）
 * - 時間匯總（updateTimeSummary）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - canvasWrapper（模塊內 getElementById 再綁定）
 * - flowchart-editor.js 頂層函數：saveState、showToast、updatePagePropertiesPanel
 * - 已提取模塊函數：applyBatchNodeProperty、computeFlowPageStats、formatDurationDays、
 *   renderNode、syncFlowTableRowFromNode
 * - DiagramWeave / DiagramWeaveSanitize 命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorCore, applyBatchNodeProperty, computeFlowPageStats, formatDurationDays, renderNode, syncFlowTableRowFromNode */
(function initDiagramWeavePanelExtras(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

function updateCanvasEmptyState() {
  const emptyState = document.getElementById('canvasEmptyState');
  if (emptyState) emptyState.hidden = state.nodes.length > 0 || emptyState.dataset.dismissed === 'true';
}

function dismissCanvasEmptyState() {
  const emptyState = document.getElementById('canvasEmptyState');
  if (emptyState) {
    emptyState.dataset.dismissed = 'true';
    emptyState.hidden = true;
  }
  canvasWrapper.focus();
}

function togglePanelDrawer(panel) {
  const className = panel === 'properties' ? 'properties-drawer-open' : 'shapes-drawer-open';
  document.body.classList.toggle(className);
  if (panel === 'properties') document.body.classList.remove('shapes-drawer-open');
  else document.body.classList.remove('properties-drawer-open');
}

function updatePropTextColor(value) {
  if (value === 'custom' || value === '__mixed__') return;
  const next = typeof DiagramWeaveSanitize !== 'undefined'
    ? DiagramWeaveSanitize.sanitizeTextColor(value)
    : value;
  applyBatchNodeProperty('textColor', next);
}

function updatePropTargetPage(pageId) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.targetPageId = pageId || null;
  renderNode(node);
  syncFlowTableRowFromNode(node);
}

function navigateOffpageTarget() {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node?.targetPageId || typeof DiagramWeave === 'undefined') {
    showToast('请先选择目标页');
    return;
  }
  DiagramWeave.switchPage(node.targetPageId);
}

function updatePropLayer(layerId) {
  if (!Number.isFinite(layerId)) return;
  applyBatchNodeProperty('layer', layerId);
}

// 更新流程耗时统计
function updateTimeSummary() {
  const stats = computeFlowPageStats();
  document.getElementById('propTotalDuration').textContent = formatDurationDays(stats.totalDuration);
  document.getElementById('propNodeCount').textContent = stats.totalShapes;
  if (!state.selectedNodeId && !state.selectedConnectionId) {
    updatePagePropertiesPanel();
  }
}
  global.DiagramWeavePanelExtras = {
    dismissCanvasEmptyState,
    navigateOffpageTarget,
    togglePanelDrawer,
    updateCanvasEmptyState,
    updatePropLayer,
    updatePropTargetPage,
    updatePropTextColor,
    updateTimeSummary,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
