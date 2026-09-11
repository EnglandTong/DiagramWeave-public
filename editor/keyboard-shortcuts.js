/**
 * DiagramWeave — Phase 2-3：全局键盘快捷键与点击关闭逻辑
 * 从 flowchart-editor.js 提取（原 ~120 行）。
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // ===== 依赖注入：安全获取全局模块 =====
  const g = (name) => {
    if (typeof window !== 'undefined' && window[name]) return window[name];
    if (typeof DiagramWeave !== 'undefined' && DiagramWeave[name]) return DiagramWeave[name];
    return undefined;
  };

  function getEditor() {
    return g('DiagramWeaveEditorCore');
  }

  function getState() {
    const ed = getEditor();
    return ed?.state;
  }

  function getPresent() {
    return g('DiagramWeavePresentation');
  }

  function getPalette() {
    return g('DiagramWeaveCommandPalette');
  }

  function getImport() {
    return g('DiagramWeaveImportPreviewUI');
  }

  function getA11y() {
    return g('DiagramWeaveAccessibility');
  }

  function getConnEdit() {
    return g('DiagramWeaveConnectionEditing');
  }

  function getUIUtils() {
    return g('DiagramWeaveUIUtils');
  }

  function getLayout() {
    return g('DiagramWeaveLayoutEngine');
  }

  function getCanvas() {
    return g('DiagramWeaveCanvasInteraction');
  }

  function getGroup() {
    return g('DiagramWeaveGroupContainer');
  }

  // ===== keydown handler =====
  function onKeyDown(e) {
    // 命令面板
    const palette = getPalette();
    if (palette && (e.ctrlKey || e.metaKey) && e.key.toLocaleLowerCase() === 'k') {
      e.preventDefault();
      palette.openCommandPalette?.();
      return;
    }
    if (e.key === 'Escape' && document.getElementById('commandPaletteOverlay')?.classList.contains('visible')) {
      e.preventDefault();
      palette?.closeCommandPalette?.();
      return;
    }
    // 导入预览
    const imp = getImport();
    if (e.key === 'Escape' && document.getElementById('importPreviewOverlay')?.classList.contains('visible')) {
      e.preventDefault();
      imp?.cancelImportPreview?.();
      return;
    }
    // 映射向导
    if (e.key === 'Escape' && document.getElementById('mappingWizardOverlay')?.classList.contains('visible')) {
      e.preventDefault();
      palette?.cancelMappingWizard?.();
      return;
    }
    // 焦点陷阱
    const a11y = getA11y();
    if (a11y?.trapCommandPaletteFocus?.(e)) return;
    if (a11y?.trapImportPreviewFocus?.(e)) return;
    if (a11y?.trapMappingWizardFocus?.(e)) return;
    // 文本输入框里不触发
    if (e.target.contentEditable === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // 演示模式快捷键
    const present = getPresent();
    const presentState = present?.presentState;
    if (presentState?.active) {
      if (e.key === 'Escape') {
        e.preventDefault();
        present?.exitPresentation?.();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        present?.presentNext?.();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        present?.presentPrev?.();
        return;
      }
      return; // 演示模式屏蔽其他快捷键
    }

    // 移动视口模式不触发画布快捷键
    const ui = getUIUtils();
    if (ui?.isMobileViewMode?.()) return;

    const ed = getEditor();
    const state = ed?.state;
    const canvasWrapper = document.getElementById('canvasWrapper');

    if (e.key === ' ') {
      e.preventDefault();
      if (state) state.spacePressed = true;
      if (canvasWrapper) canvasWrapper.style.cursor = 'grab';
    }

    // 工具切换
    if (e.key === 'v' || e.key === 'V') ed?.setTool?.('select');
    if (e.key === 'l' || e.key === 'L') ed?.setTool?.('connect');
    if (e.key === 'h' || e.key === 'H') ed?.setTool?.('pan');
    if (e.key === 't' || e.key === 'T') ed?.toggleTextEditor?.();

    // 删除
    if (e.key === 'Delete' || e.key === 'Backspace') ed?.deleteSelected?.();

    // Ctrl+A 全选
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ed?.selectAll?.(); }

    // 缩放
    if ((e.key === '=' || e.key === '+') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ed?.zoomIn?.(); }
    if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ed?.zoomOut?.(); }
    if (e.key === '0' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ed?.zoomReset?.(); }

    // F2 / Enter 编辑选中形状标签
    if ((e.key === 'F2' || e.key === 'Enter') && state?.selectedNodeId && !e.shiftKey) {
      e.preventDefault();
      ed?.editLabel?.();
    }

    // 撤销重做
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); ed?.undo?.(); }
    if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); ed?.redo?.(); }
    // 复制
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ed?.duplicateSelected?.(); }
    // 组合
    if (e.key === 'g' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); ed?.groupSelectedNodes?.(); }
    if (e.key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); ed?.ungroupSelectedNodes?.(); }

    // 方向键微调
    if (state?.selectedNodeId && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const node = (state.nodes || []).find(n => n.id === state.selectedNodeId);
      if (!node) return;
      const step = e.shiftKey ? 10 : 1;
      ed?.saveState?.();
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      const canvasInt = getCanvas();
      const group = getGroup();
      const ids = group?.getMoveSet?.(node.id)
        ?? canvasInt?.getMoveSet?.(node.id)
        ?? [node.id];
      canvasInt?.moveNodesBy?.(ids, dx, dy);
      ed?.updateProperties?.();
    }
  }

  // ===== keyup handler =====
  function onKeyUp(e) {
    if (e.key === ' ') {
      const state = getState();
      if (state) state.spacePressed = false;
      const canvasWrapper = document.getElementById('canvasWrapper');
      if (canvasWrapper) {
        const ed = getEditor();
        const t = ed?.state?.tool;
        canvasWrapper.style.cursor = t === 'connect' ? 'crosshair' : 'default';
      }
    }
  }

  // ===== 点击其他区域关闭菜单 =====
  function onDocumentClick(e) {
    const menu = document.getElementById('contextMenu');
    if (menu && !menu.contains(e.target)) {
      const ctxMenu = getConnEdit();
      if (ctxMenu?.hideContextMenu) ctxMenu.hideContextMenu();
    }
    const connMenu = document.getElementById('connContextMenu');
    if (connMenu && !connMenu.contains(e.target)) {
      const ctxMenu = getConnEdit();
      if (ctxMenu?.hideConnContextMenu) ctxMenu.hideConnContextMenu();
    }
    // 点击遮罩关闭弹窗
    if (e.target.id === 'confirmOverlay') {
      document.getElementById('confirmOverlay').classList.remove('visible');
    }
    if (e.target.id === 'layoutOverlay') {
      getLayout()?.hideLayoutDialog?.();
    }
  }

  // ===== 安装 =====
  function init() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', onDocumentClick);
  }

  // 自动安装
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.DiagramWeaveKeyboardShortcuts = {
    init,
    onKeyDown,
    onKeyUp,
    onDocumentClick,
  };
})();
