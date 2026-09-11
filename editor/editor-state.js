/**
 * DiagramWeave Editor Core State
 *
 * 從 flowchart-editor.js 抽取的核心狀態與狀態管理函數（Phase 1 拆分第 1 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveEditorCore，與現有 editor/*.js 模式一致。
 *
 * 包含：
 * - state（畫布主狀態）、presentState（演示模式狀態）、projectSession（項目會話）
 * - CONN_ROUTE_LABELS（連線路由模式標籤，運行時可被 i18n / 擴展改寫）
 * - setTool / zoom / updateTransform（工具與視圖變換）
 * - saveState / undo / redo（撤銷棧管理）
 *
 * 外部依賴（均在調用時通過 globalThis 解析，保證本文件可在 Node 環境獨立單測）：
 * - DiagramWeave / DiagramWeaveRoutingRules 命名空間（加載順序在本文件之前）
 * - flowchart-editor.js 頂層函數（renderAll、ensureNodeRefIds、applyConnRouteModeFromData、
 *   captureVersionSnapshot、promptInitialProjectSave、showToast、updatePresentZoomPreviewLayout）
 * - window.t（i18n 翻譯函數）
 */
(function initDiagramWeaveEditorCore(global) {
  'use strict';

  // ===== 主狀態 =====
  const state = {
    nodes: [],
    connections: [],
    selectedNodeId: null,
    selectedNodeIds: [],
    selectedConnectionId: null,
    tool: 'select', // 'select' | 'connect' | 'pan'
    zoom: 1,
    panX: 0,
    panY: 0,
    nextId: 1,
    undoStack: [],
    redoStack: [],
    // Phase 3-4：transaction 批处理（beginTransaction / endTransaction 之间的
    // 多次 saveState 合并为一个 undo entry，用于泳道批量操作等原子化编辑）
    transactionDepth: 0,
    transactionBase: null,    // transaction 开始时的快照 JSON 字串
    transactionLabel: '',      // 最近一次 transaction 的 label
    isDragging: false,
    isPanning: false,
    isConnecting: false,
    connectFrom: null,
    isReconnecting: false,
    reconnectConnId: null,
    reconnectEnd: null, // 'from' | 'to'
    dragNode: null,
    dragOffset: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    spacePressed: false,
    connRouteMode: 'visio', // bezier | orthogonal | avoidance | straight | visio
    routingRules: { endpointLock: true, obstaclePadding: 18, bridgeBehavior: 'jump', bridgeSize: 8, defaultLabelPlacement: 'auto' },
    groups: [],        // Phase 2：组合注册表 [{ id: 'group_N', name }]，节点通过 node.groupId 引用
    swimlaneSets: [],  // Phase 2：泳道集注册表 [{ id: 'laneSet_N', name, lanes: [String] }]，节点通过 node.swimlaneSetId 引用
  };

  const CONN_ROUTE_LABELS = {
    bezier: '平滑曲线',
    orthogonal: '正交折线',
    avoidance: '加强避障',
    straight: '直线',
    visio: 'Visio 连线',
  };

  /** 连线算法注册表：由 flowchart-editor.js 初始化填充，扩展可动态注册 */
  const CONN_ROUTE_ALGORITHMS = {};

  // ===== 演示模式状态 =====
  const presentState = {
    active: false,
    startNodeId: null,
    pathHistory: [],       // 实际走过的路径 [{ nodeId? , connId? }, ...]
    cursor: -1,            // 当前在 pathHistory 中的位置，-1 表示尚未开始
    visitedNodes: new Set(),
    visitedConns: new Set(),
    currentConnId: null,
    branchResolve: null,
    descriptions: {},
  };

  // ===== 项目会话 =====
  const DEFAULT_PROJECT_NAME = 'Untitled Project';
  const DEFAULT_AUTOSAVE_SECONDS = 30;

  const projectSession = {
    name: DEFAULT_PROJECT_NAME,
    autosaveSeconds: DEFAULT_AUTOSAVE_SECONDS,
    fileHandle: null,
    fileFormat: 'json',
    lastExcelLoadKind: null,
    lastExcelImportDiagnostics: null,
    autosaveTimer: null,
    saving: false,
    lastSavedAt: null,
    historyId: `history_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };

  // ===== DOM 辅助（惰性获取，Node 环境安全降级） =====
  function dom(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  // ===== 工具切换 =====
  function setTool(tool) {
    state.tool = tool;
    const btnSelect = dom('btn-select');
    const btnConnect = dom('btn-connect');
    const btnPan = dom('btn-pan');
    if (btnSelect) btnSelect.classList.toggle('active', tool === 'select');
    if (btnConnect) btnConnect.classList.toggle('active', tool === 'connect');
    if (btnPan) btnPan.classList.toggle('active', tool === 'pan');
    const cursor = tool === 'connect' ? 'crosshair' : tool === 'pan' ? 'grab' : 'default';
    const canvasEl = dom('canvas');
    const canvasWrapperEl = dom('canvasWrapper');
    if (canvasEl) canvasEl.style.cursor = cursor;
    if (canvasWrapperEl) canvasWrapperEl.style.cursor = cursor;
    // 连线模式下显示所有端口
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('connect-mode', tool === 'connect');
      document.body.classList.toggle('pan-mode', tool === 'pan');
    }
  }

  // ===== 缩放 =====
  function zoomIn() { setZoom(state.zoom + 0.1); }
  function zoomOut() { setZoom(state.zoom - 0.1); }
  function zoomReset() { setZoom(1); state.panX = 0; state.panY = 0; updateTransform(); }

  function setZoom(z) {
    state.zoom = Math.max(0.2, Math.min(3, z));
    const zoomLevel = dom('zoom-level');
    if (zoomLevel) zoomLevel.textContent = Math.round(state.zoom * 100) + '%';
    updateTransform();
  }

  function updateTransform() {
    const canvasTransform = dom('canvasTransform');
    if (canvasTransform) {
      canvasTransform.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    }
    if (state.nodes.length > 0 && typeof document !== 'undefined') {
      state.nodes.forEach(node => {
        const el = document.getElementById(node.id);
        if (!el) return;
        const labelEl = el.querySelector('.node-label');
        if (!labelEl) return;
        if (state.zoom !== 1) {
          labelEl.style.transform = `scale(${1 / state.zoom})`;
        } else {
          labelEl.style.transform = '';
        }
      });
    }
    if (presentState.active && typeof globalThis.updatePresentZoomPreviewLayout === 'function') {
      globalThis.updatePresentZoomPreviewLayout();
    }
    // Phase 3：视口变化后重算节点裁剪（rAF 节流，见 viewport-nav.js）
    if (typeof globalThis.scheduleViewportCull === 'function') {
      globalThis.scheduleViewportCull();
    }
  }

  // ===== 保存状态（撤销/重做）=====
  function clearCanvasNodes() {
    const canvasTransform = dom('canvasTransform');
    if (!canvasTransform) return;
    canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
    canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());
  }

  // ===== Phase 3-5：rAF 节流渲染调度 =====
  // 多次 scheduleRender 合并为同一帧内一次 renderAll；高频场景（拖拽中）用 throttleRender。
  let _renderPending = false;
  let _lastRenderTime = 0;
  function scheduleRender() {
    if (_renderPending) return;
    _renderPending = true;
    const raf = (typeof requestAnimationFrame !== 'undefined')
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 16);
    raf(() => {
      _renderPending = false;
      _lastRenderTime = Date.now();
      if (typeof globalThis.renderAll === 'function') {
        try { globalThis.renderAll(); } catch (_) { /* swallow during rAF */ }
      }
    });
  }

  // 节流：保证每 minInterval ms 最多执行一次，立即调用 + 静默后续
  function throttleRender(minInterval) {
    const now = Date.now();
    if (now - _lastRenderTime < (minInterval || 100)) return;
    scheduleRender();
  }

  function captureUndoSnapshot() {
    if (typeof DiagramWeave !== 'undefined') {
      DiagramWeave.syncPageFromState();
      return DiagramWeave.serializeDocument();
    }
    return {
      version: 1,
      nodes: state.nodes,
      connections: state.connections,
      nextId: state.nextId,
      connRouteMode: state.connRouteMode,
      routingRules: state.routingRules,
      groups: state.groups,
      swimlaneSets: state.swimlaneSets,
    };
  }

  function applyUndoSnapshot(snap) {
    if (!snap) return;
    state.selectedNodeId = null;
    state.selectedConnectionId = null;

    if (snap.version === 2 && snap.pages && typeof DiagramWeave !== 'undefined') {
      DiagramWeave.loadDocument(snap);
      if (typeof globalThis.applyConnRouteModeFromData === 'function') {
        globalThis.applyConnRouteModeFromData(snap.connRouteMode);
      }
      if (typeof DiagramWeaveRoutingRules !== 'undefined') state.routingRules = DiagramWeaveRoutingRules.normalizeRules(snap.routingRules);
      clearCanvasNodes();
      if (typeof globalThis.renderAll === 'function') globalThis.renderAll();
      return;
    }

    if (Array.isArray(snap.nodes) && Array.isArray(snap.connections)) {
      state.nodes = snap.nodes;
      state.connections = snap.connections;
      state.nextId = snap.nextId || 1;
      state.groups = Array.isArray(snap.groups) ? snap.groups : [];
      state.swimlaneSets = Array.isArray(snap.swimlaneSets) ? snap.swimlaneSets : [];
      if (typeof DiagramWeave !== 'undefined') {
        const page = DiagramWeave.getCurrentPage();
        if (page) {
          page.nodes = state.nodes;
          page.connections = state.connections;
          page.groups = state.groups;
          page.swimlaneSets = state.swimlaneSets;
        }
      }
      if (typeof globalThis.applyConnRouteModeFromData === 'function') {
        globalThis.applyConnRouteModeFromData(snap.connRouteMode);
      }
      if (typeof globalThis.ensureNodeRefIds === 'function') globalThis.ensureNodeRefIds();
      clearCanvasNodes();
      if (typeof globalThis.renderAll === 'function') globalThis.renderAll();
    }
  }

  // ===== Phase 3-4：transaction 批处理 API =====
  function beginTransaction(label) {
    if (state.transactionDepth === 0) {
      state.transactionBase = JSON.stringify(captureUndoSnapshot());
      state.transactionLabel = label || '';
      // 版本快照在 transaction 开始时也记录一次
      if (typeof globalThis.captureVersionSnapshot === 'function') {
        void globalThis.captureVersionSnapshot(label || 'Transaction');
      }
    }
    state.transactionDepth += 1;
  }

  function endTransaction() {
    if (state.transactionDepth === 0) return;
    state.transactionDepth -= 1;
    if (state.transactionDepth === 0 && state.transactionBase != null) {
      // 合并为一个 undo entry：base → current
      state.undoStack.push(state.transactionBase);
      if (state.undoStack.length > 50) state.undoStack.shift();
      state.redoStack = [];
      state.transactionBase = null;
      state.transactionLabel = '';
    }
  }

  // ===== saveState：支持 transaction 批处理 =====
  function saveState() {
    if (state.transactionDepth > 0) {
      // 在 transaction 中：跳过，由 endTransaction 时统一入栈
      return;
    }
    if (typeof globalThis.captureVersionSnapshot === 'function') {
      void globalThis.captureVersionSnapshot('Edit');
    }
    state.undoStack.push(JSON.stringify(captureUndoSnapshot()));
    if (state.undoStack.length > 50) state.undoStack.shift();
    state.redoStack = [];
    if (!projectSession.fileHandle &&
        typeof sessionStorage !== 'undefined' &&
        !sessionStorage.getItem('dw-initial-save-prompted')) {
      if (typeof globalThis.promptInitialProjectSave === 'function') {
        setTimeout(globalThis.promptInitialProjectSave, 0);
      }
    }
  }

  function undo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push(JSON.stringify(captureUndoSnapshot()));
    const prev = JSON.parse(state.undoStack.pop());
    applyUndoSnapshot(prev);
    if (typeof globalThis.showToast === 'function') {
      globalThis.showToast(typeof globalThis.t === 'function' ? globalThis.t('toast.undo') : '已撤销');
    }
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push(JSON.stringify(captureUndoSnapshot()));
    const next = JSON.parse(state.redoStack.pop());
    applyUndoSnapshot(next);
    if (typeof globalThis.showToast === 'function') {
      globalThis.showToast(typeof globalThis.t === 'function' ? globalThis.t('toast.redo') : '已重做');
    }
  }

  // ===== 命名空间挂载 =====
  global.DiagramWeaveEditorCore = {
    state,
    CONN_ROUTE_LABELS,
    CONN_ROUTE_ALGORITHMS,
    presentState,
    projectSession,
    DEFAULT_PROJECT_NAME,
    DEFAULT_AUTOSAVE_SECONDS,
    setTool,
    zoomIn,
    zoomOut,
    zoomReset,
    setZoom,
    updateTransform,
    clearCanvasNodes,
    captureUndoSnapshot,
    applyUndoSnapshot,
    saveState,
    beginTransaction,
    endTransaction,
    scheduleRender,
    throttleRender,
    undo,
    redo,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
