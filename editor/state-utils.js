/**
 * DiagramWeave Editor State Utilities
 *
 * 從 flowchart-editor.js 抽取的純函數狀態工具（領域拆分第一步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveEditorState，與現有 diagramweave-*.js 模式一致。
 * 不依賴 DOM，可在 Node 環境獨立單測。
 */
(function initDiagramWeaveEditorState(global) {
  'use strict';

  /**
   * 重置畫布的數據集合與選擇狀態。
   * 純函數：接收 state 對象並原地重置，不讀寫任何全局。
   * 抽取自 flowchart-editor.js 中 applyTemplate / applyFlowData 的重複清空邏輯。
   *
   * @param {object} s - 編輯器 state 對象（需含 nodes/connections/selectedNodeId/selectedConnectionId）
   */
  function resetSelection(s) {
    if (!s || typeof s !== 'object') return;
    s.nodes = [];
    s.connections = [];
    s.selectedNodeId = null;
    s.selectedConnectionId = null;
  }

  global.DiagramWeaveEditorState = {
    resetSelection,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
