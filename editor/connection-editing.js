/**
 * DiagramWeave Connection Editing
 *
 * 從 flowchart-editor.js 抽取的連線標籤編輯與右鍵菜單（Phase 1 拆分第 21 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveConnectionEditing。
 *
 * 包含：
 * - 標籤行內編輯（startConnectionLabelEdit）
 * - 連線右鍵菜單（showConnContextMenu / hideConnContextMenu / editConnectionLabel /
 *   focusConnectionProperties / deleteConnectionFromMenu）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - canvasWrapper（模塊內 getElementById 再綁定）
 * - flowchart-editor.js 頂層函數：renderAll、saveState、showToast
 * - 已提取模塊函數：getConnLabelLayout、getPortPos、renderConnections、
 *   syncFlowTableFromConnections、updateProperties
 */
/* global DiagramWeaveEditorCore, getConnLabelLayout, getPortPos, renderConnections, syncFlowTableFromConnections, updateProperties */
(function initDiagramWeaveConnectionEditing(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

// ===== 连线标签编辑 =====
function startConnectionLabelEdit(connId, e) {
  const conn = state.connections.find(c => c.id === connId);
  if (!conn) return;

  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return;

  const from = getPortPos(fromNode, conn.fromPort);
  const to = getPortPos(toNode, conn.toPort);
  const layout = getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset);

  // 创建输入框
  const input = document.createElement('input');
  input.className = 'conn-label-input';
  input.value = conn.label || '';
  input.placeholder = '输入条件文字...';

  const rect = canvasWrapper.getBoundingClientRect();
  input.style.left = (rect.left + layout.x * state.zoom + state.panX) + 'px';
  input.style.top = (rect.top + layout.y * state.zoom + state.panY) + 'px';
  input.style.position = 'fixed';
  input.style.transform = layout.anchor === 'start' ? 'translate(0, -50%)' : 'translate(-50%, -100%)';

  document.body.appendChild(input);
  input.focus();
  input.select();

  const finish = () => {
    const newLabel = input.value.trim();
    if (newLabel !== conn.label) {
      saveState();
      conn.label = newLabel;
      syncFlowTableFromConnections();
    }
    input.remove();
    renderConnections();
    input.removeEventListener('blur', finish);
    input.removeEventListener('keydown', handleKey);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(); }
    if (e.key === 'Escape') { input.value = conn.label || ''; finish(); }
  };

  input.addEventListener('blur', finish);
  input.addEventListener('keydown', handleKey);
}

// ===== 连线右键菜单 =====
function showConnContextMenu(x, y, connId) {
  const menu = document.getElementById('connContextMenu');
  menu.dataset.connId = connId;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.add('visible');
}

function hideConnContextMenu() {
  document.getElementById('connContextMenu').classList.remove('visible');
}

function editConnectionLabel() {
  hideConnContextMenu();
  const connId = state.selectedConnectionId;
  if (!connId) return;
  startConnectionLabelEdit(connId);
}

function focusConnectionProperties() {
  hideConnContextMenu();
  updateProperties();
  const fromSel = document.getElementById('propConnFrom');
  if (fromSel) fromSel.focus();
  showToast('在右侧修改起点、终点或条件');
}

function deleteConnectionFromMenu() {
  hideConnContextMenu();
  if (state.selectedConnectionId) {
    saveState();
    state.connections = state.connections.filter(c => c.id !== state.selectedConnectionId);
    state.selectedConnectionId = null;
    renderAll();
    showToast('已删除连线');
  }
}
  global.DiagramWeaveConnectionEditing = {
    deleteConnectionFromMenu,
    editConnectionLabel,
    focusConnectionProperties,
    hideConnContextMenu,
    showConnContextMenu,
    startConnectionLabelEdit,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
