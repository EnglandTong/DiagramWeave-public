/**
 * DiagramWeave 文本工具模塊（純函數）
 * 提供與 flowchart-editor.js 兼容的 escapeHtml（嚴格版本：轉義 & < > " '）
 * IIFE 掛載到 DiagramWeaveEditorText 全局命名空間，遵循 Loop 2.1 領域拆分管線。
 */
(function initDiagramWeaveEditorText(global) {
  'use strict';

  const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  const ESCAPE_RE = /[&<>"']/g;

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch]);
  }

  global.DiagramWeaveEditorText = {
    escapeHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
