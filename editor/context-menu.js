/**
 * DiagramWeave Context Menu
 *
 * 動態上下文菜單模組。從 flowchart-editor.js 拆分並擴展。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveContextMenu。
 *
 * 支持三種上下文：
 * - shape   形狀右鍵（單個或多個選中時動態顯示不同項）
 * - conn    連接器右鍵（由 connection-editing.js 觸發）
 * - canvas  空白畫布右鍵（新增！包含粘貼/新建頁面/縮放/顯示網格）
 *
 * 菜單項可根據選中狀態動態顯示/隱藏（enabled / visible 條件）。
 * 提供對齊/分佈子菜單、分組/解組等 Visio 常用操作。
 *
 * 外部依賴（通過全局作用域解析）：
 * - DiagramWeaveEditorCore.state
 * - DiagramWeaveViewportNav.runAlignCommand / runDistributeCommand
 * - DiagramWeaveCanvasTools（align / distribute）
 * - 全局函數：getSelectedNodeIds, duplicateSelected, deleteSelected,
 *   bringToFront, sendToBack, groupSelectedNodes, ungroupSelectedNodes,
 *   wrapSelectionInContainer, unwrapContainer, showSettingsDialog, zoomIn, zoomOut
 * - DOM：contextMenu, connContextMenu（HTML 中已存在）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveViewportNav, getSelectedNodeIds, duplicateSelected, deleteSelected, bringToFront, sendToBack, groupSelectedNodes, ungroupSelectedNodes, wrapSelectionInContainer, unwrapContainer, showSettingsDialog, zoomIn, zoomOut, fitAllNodes, newProject, runExport */
(function initDiagramWeaveContextMenu(global) {
  'use strict';

  const state = typeof global.DiagramWeaveEditorCore !== 'undefined' ? global.DiagramWeaveEditorCore.state : null;

  // ===== DOM 引用（延遲初始化）=====
  let shapeMenu = null;
  let connMenu = null;
  let canvasMenu = null;
  let activeMenu = null;
  let currentContext = null; // 'shape' | 'conn' | 'canvas'

  function ensureDom() {
    if (shapeMenu) return;
    shapeMenu = typeof document !== 'undefined' ? document.getElementById('contextMenu') : null;
    connMenu = typeof document !== 'undefined' ? document.getElementById('connContextMenu') : null;
    // 動態創建空白畫布菜單（如 HTML 中不存在）
    if (typeof document !== 'undefined') {
      canvasMenu = document.getElementById('canvasContextMenu');
      if (!canvasMenu) {
        canvasMenu = document.createElement('div');
        canvasMenu.id = 'canvasContextMenu';
        canvasMenu.className = 'context-menu';
        canvasMenu.innerHTML = `
          <div class="context-menu-item" data-action="paste"><span>粘貼</span><span class="context-menu-shortcut">Ctrl+V</span></div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item" data-action="fit"><span>適應全部</span><span class="context-menu-shortcut">Ctrl+F</span></div>
          <div class="context-menu-item" data-action="zoomIn"><span>放大</span><span class="context-menu-shortcut">Ctrl++</span></div>
          <div class="context-menu-item" data-action="zoomOut"><span>縮小</span><span class="context-menu-shortcut">Ctrl+-</span></div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item" data-action="toggleGrid"><span>切換網格</span></div>
          <div class="context-menu-item" data-action="toggleRuler"><span>切換標尺</span></div>
          <div class="context-menu-divider"></div>
          <div class="context-menu-item" data-action="settings"><span>設置...</span></div>
        `;
        document.body.appendChild(canvasMenu);
        bindCanvasMenuActions();
      }
    }
  }

  function bindCanvasMenuActions() {
    if (!canvasMenu || canvasMenu.dataset.bound === 'true') return;
    canvasMenu.dataset.bound = 'true';
    canvasMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      const action = item.dataset.action;
      hideAll();
      const handler = canvasActions[action];
      if (handler) { try { handler(); } catch (err) { global.console?.error('Canvas context action failed:', err); } }
    });
  }

  const canvasActions = {
    paste() { try { global.document.execCommand('paste'); } catch {} },
    fit() { if (typeof fitAllNodes === 'function') fitAllNodes(); else global.DiagramWeaveViewportNav?.fitAllNodes?.(); },
    zoomIn() { if (typeof zoomIn === 'function') zoomIn(); },
    zoomOut() { if (typeof zoomOut === 'function') zoomOut(); },
    toggleGrid() {
      const grid = global.document?.getElementById('gridOverlay');
      if (grid) grid.classList.toggle('visible');
    },
    toggleRuler() {
      const ruler = global.document?.getElementById('rulerOverlay');
      if (ruler) ruler.classList.toggle('visible');
    },
    settings() { if (typeof showSettingsDialog === 'function') showSettingsDialog(); },
  };

  // ===== 動態顯示/隱藏 =====

  /**
   * 根據選中節點數量/形狀類型調整形狀菜單項可見性。
   * HTML 中保留 data-show-single / data-show-multi / data-show-any 屬性。
   */
  function adjustShapeMenuForSelection(menu) {
    if (!menu) return;
    const selected = typeof getSelectedNodeIds === 'function' ? getSelectedNodeIds() : [];
    const count = selected.length;
    const single = count === 1;
    const multi = count > 1;

    menu.querySelectorAll('[data-show-single]').forEach(el => el.style.display = single ? '' : 'none');
    menu.querySelectorAll('[data-show-multi]').forEach(el => el.style.display = multi ? '' : 'none');
    // data-show-any 預設顯示

    // 分組/解組條件
    const groupItem = menu.querySelector('[data-action="group"]');
    const ungroupItem = menu.querySelector('[data-action="ungroup"]');
    const wrapItem = menu.querySelector('[data-action="wrapContainer"]');
    const unwrapItem = menu.querySelector('[data-action="unwrapContainer"]');

    if (groupItem) groupItem.style.display = multi ? '' : 'none';
    if (ungroupItem) {
      // 僅當選中的節點是分組時顯示
      const hasGroup = state?.nodes?.some(n => selected.includes(n.id) && n._grouped) ?? false;
      ungroupItem.style.display = single && hasGroup ? '' : 'none';
    }
    if (wrapItem) wrapItem.style.display = count >= 1 ? '' : 'none';
    if (unwrapItem) {
      const node = state?.nodes?.find(n => selected[0] === n.id);
      unwrapItem.style.display = node?.shape === 'container' ? '' : 'none';
    }

    // 對齊/分佈：至少 2 個才能對齊，至少 3 個才能分佈
    const alignSection = menu.querySelector('[data-section="align"]');
    if (alignSection) alignSection.style.display = multi ? '' : 'none';
    const distributeSection = menu.querySelector('[data-section="distribute"]');
    if (distributeSection) distributeSection.style.display = count >= 3 ? '' : 'none';
  }

  // ===== 顯示/隱藏 =====

  function positionMenu(menu, x, y) {
    if (!menu) return;
    // 確保不超出視窗
    const vw = global.innerWidth || 1280;
    const vh = global.innerHeight || 720;
    const mw = menu.offsetWidth || 200;
    const mh = menu.offsetHeight || 300;
    const px = Math.min(x, vw - mw - 8);
    const py = Math.min(y, vh - mh - 8);
    menu.style.left = Math.max(4, px) + 'px';
    menu.style.top = Math.max(4, py) + 'px';
  }

  function showShapeMenu(x, y) {
    ensureDom();
    hideAll();
    if (!shapeMenu) return;
    adjustShapeMenuForSelection(shapeMenu);
    positionMenu(shapeMenu, x, y);
    shapeMenu.classList.add('visible');
    activeMenu = shapeMenu;
    currentContext = 'shape';
  }

  function showConnMenu(x, y, connId) {
    ensureDom();
    hideAll();
    if (!connMenu) return;
    positionMenu(connMenu, x, y);
    connMenu.classList.add('visible');
    activeMenu = connMenu;
    currentContext = 'conn';
    if (typeof connMenu.dataset !== 'undefined') connMenu.dataset.connId = connId || '';
  }

  function showCanvasMenu(x, y) {
    ensureDom();
    hideAll();
    if (!canvasMenu) return;
    positionMenu(canvasMenu, x, y);
    canvasMenu.classList.add('visible');
    activeMenu = canvasMenu;
    currentContext = 'canvas';
  }

  function hideAll() {
    [shapeMenu, connMenu, canvasMenu].forEach(m => m?.classList?.remove('visible'));
    activeMenu = null;
    currentContext = null;
  }

  function isVisible() { return activeMenu !== null; }

  // ===== 形狀菜單增強：動態注入對齊/分佈項 =====

  /**
   * 在形狀菜單底部動態注入「對齊/分佈」操作項。
   * 如果 HTML 中已存在對應區塊則跳過。
   */
  function ensureAlignSection() {
    ensureDom();
    if (!shapeMenu || shapeMenu.dataset.alignInjected === 'true') return;
    shapeMenu.dataset.alignInjected = 'true';

    const section = global.document.createElement('div');
    section.dataset.section = 'align';
    section.innerHTML = `
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-align="left"><span>左對齊</span></div>
      <div class="context-menu-item" data-align="hcenter"><span>水平居中</span></div>
      <div class="context-menu-item" data-align="right"><span>右對齊</span></div>
      <div class="context-menu-item" data-align="top"><span>頂對齊</span></div>
      <div class="context-menu-item" data-align="vcenter"><span>垂直居中</span></div>
      <div class="context-menu-item" data-align="bottom"><span>底對齊</span></div>
      <div class="context-menu-divider" data-section="distribute"></div>
      <div class="context-menu-item" data-distribute="horizontal"><span>橫向等分</span></div>
      <div class="context-menu-item" data-distribute="vertical"><span>縱向等分</span></div>
    `;
    shapeMenu.appendChild(section);
    section.addEventListener('click', (e) => {
      const item = e.target.closest('[data-align], [data-distribute]');
      if (!item) return;
      const mode = item.dataset.align;
      const axis = item.dataset.distribute;
      hideAll();
      if (mode && typeof DiagramWeaveViewportNav !== 'undefined' && typeof DiagramWeaveViewportNav.runAlignCommand === 'function') {
        DiagramWeaveViewportNav.runAlignCommand(mode);
      }
      if (axis && typeof DiagramWeaveViewportNav !== 'undefined' && typeof DiagramWeaveViewportNav.runDistributeCommand === 'function') {
        DiagramWeaveViewportNav.runDistributeCommand(axis);
      }
    });
  }

  // ===== 點擊外部自動關閉 =====

  function initAutoClose() {
    if (typeof global.document === 'undefined') return;
    ensureDom();
    global.document.addEventListener('click', (e) => {
      if (!activeMenu) return;
      if (activeMenu.contains(e.target)) return;
      hideAll();
    }, true);
    global.document.addEventListener('contextmenu', (e) => {
      if (!activeMenu) return;
      if (activeMenu.contains(e.target)) return;
      hideAll();
    }, true);
    // ESC 關閉
    global.document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeMenu) hideAll();
    });
  }

  // ===== 導出 =====

  function init() {
    ensureDom();
    ensureAlignSection();
    initAutoClose();
  }

  global.DiagramWeaveContextMenu = {
    init,
    showShapeMenu,
    showConnMenu,
    showCanvasMenu,
    hideAll,
    isVisible,
    get currentContext() { return currentContext; },
    adjustShapeMenuForSelection,
    ensureAlignSection,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
