/**
 * DiagramWeave Overlay 工具（DOM 辅助）
 * 统一 overlay 相关的纯函数：
 *  - closeOverlay: 统一「关闭 overlay」的核心 5 行序列，消除 flowchart-editor.js 中
 *    cancelImportPreview / closeCommandPalette / cancelMappingWizard 重复。
 *  - trapFocus: 统一 Tab 键焦点陷阱，消除 trapCommandPaletteFocus /
 *    trapImportPreviewFocus / trapMappingWizardFocus 共享的 21 行核心逻辑。
 *
 * 纯函数：接受 overlay DOM 元素（closeOverlay）/ overlayId（trapFocus），无 state 闭包依赖。
 *
 * 契约：传入对象需具备 classList.contains/remove、setAttribute、inert 属性
 * 赋值能力；bodyChildren 是 document.body.children 的快照数组。
 */
(function initDiagramWeaveEditorOverlay(global) {
  'use strict';

  /**
   * 关闭一个 overlay 元素。
   * @param {object} overlay - overlay DOM 元素（或任何具备相同方法的对象）
   * @param {object} [opts]
   * @param {Array} [opts.bodyChildren] - document.body.children 快照；不传则跳过 inert 还原
   * @param {Function} [opts.onClosed] - 关闭后回调（不触发于早退路径）
   * @returns {boolean} true 表示执行了关闭，false 表示早退（已关闭）
   */
  function closeOverlay(overlay, opts) {
    opts = opts || {};
    if (!overlay || !overlay.classList || !overlay.classList.contains('visible')) {
      return false;
    }
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    const bodyChildren = opts.bodyChildren || [];
    for (let i = 0; i < bodyChildren.length; i++) {
      const element = bodyChildren[i];
      if (element !== overlay) element.inert = false;
    }
    if (typeof opts.onClosed === 'function') {
      opts.onClosed();
    }
    return true;
  }

  /**
   * 处理 overlay 内 Tab / Shift+Tab 焦点陷阱。
   * 返回 true 表示已拦截并重定向焦点；返回 false 表示未拦截（让浏览器继续默认行为）。
   * 非 Tab 键、不可见 overlay、无 focusable 元素三种情况一律返回 false 不拦截。
   * @param {KeyboardEvent|object} e - keydown 事件
   * @param {string} overlayId - 目标 overlay 元素的 DOM id
   * @returns {boolean}
   */
  function trapFocus(e, overlayId) {
    if (!e || e.key !== 'Tab') return false;
    const doc = global.document;
    if (!doc || typeof doc.getElementById !== 'function') return false;
    const overlay = doc.getElementById(overlayId);
    if (!overlay || !overlay.classList || !overlay.classList.contains('visible')) return false;
    const focusable = [];
    const candidates = overlay.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    for (let i = 0; i < candidates.length; i++) {
      const element = candidates[i];
      if (!element.hidden && element.getClientRects().length > 0) {
        focusable.push(element);
      }
    }
    if (!focusable.length) return false;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault();
      last.focus();
      return true;
    }
    if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  global.DiagramWeaveEditorOverlay = {
    closeOverlay,
    trapFocus,
  };
})(typeof window !== 'undefined' ? window : globalThis);
