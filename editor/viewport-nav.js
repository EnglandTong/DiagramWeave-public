/**
 * DiagramWeave Viewport Navigation
 *
 * 從 flowchart-editor.js 抽取的視口導航（Phase 1 拆分第 16 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveViewportNav。
 *
 * 包含：
 * - 視口變換與適配（applyViewportTransform / fitNodes / fitAllNodes / fitSelectedNodes /
 *   centerNodeInCanvas）
 * - 大綱面板（toggleOutlinePanel / syncOutlineFilterOptions / renderOutlinePanel /
 *   focusOutlineNode）
 * - 小地圖（renderCanvasMinimap / handleMinimapClick）
 * - 對齊與分佈（selectedNodesForLayout / applyNodePositionPatches / runAlignCommand /
 *   runDistributeCommand）
 * - 鍵盤導航初始化（initCanvasNavigation）
 * - Phase 3 視口裁剪（CULL_MARGIN / getViewportBounds / nodeInViewport /
 *   scheduleViewportCull：僅渲染視口附近節點，越界節點以 display:none 隱藏）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - canvasWrapper（模塊內 getElementById 再綁定）
 * - flowchart-editor.js 頂層函數：escapeHtml、renderAll、renderAllNodes、saveState、
 *   updateTransform
 * - 已提取模塊函數：getSelectedNodeIds、getThemeVar、selectNode
 * - DiagramWeave / DiagramWeaveCanvasTools 命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorCore, escapeHtml, getSelectedNodeIds, getThemeVar, renderAllNodes, selectNode, updateTransform */
(function initDiagramWeaveViewportNav(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

// ===== Phase 3：视口裁剪 =====
// 裁剪边距（世界坐标 px）：视口外扩 200px 内的节点仍然渲染，
// 避免平移时频繁出现/消失造成的闪烁。
const CULL_MARGIN = 200;
let cullScheduled = false;

/**
 * 计算当前视口在世界坐标中的矩形。
 * 无 DOM（测试环境）时返回 null，调用方据此跳过裁剪。
 */
function getViewportBounds() {
  if (!canvasWrapper || typeof document === 'undefined') return null;
  return {
    x: -state.panX / state.zoom,
    y: -state.panY / state.zoom,
    w: canvasWrapper.clientWidth / state.zoom,
    h: canvasWrapper.clientHeight / state.zoom,
  };
}

/**
 * 纯函数 AABB 测试：节点（含 margin 外扩）是否与视口相交。
 * bounds 为 null 时视为可见（不裁剪）。
 */
function nodeInViewport(node, bounds, margin = CULL_MARGIN) {
  if (!node || !bounds) return true;
  return node.x + node.w >= bounds.x - margin
    && node.x <= bounds.x + bounds.w + margin
    && node.y + node.h >= bounds.y - margin
    && node.y <= bounds.y + bounds.h + margin;
}

/**
 * rAF 节流的裁剪重渲染：updateTransform 后调度，
 * 同一帧内多次调用只触发一次 renderAllNodes。
 * 无 requestAnimationFrame 的环境（测试）同步执行。
 */
function scheduleViewportCull() {
  if (typeof requestAnimationFrame === 'undefined') { renderAllNodes(); return; }
  if (cullScheduled) return;
  cullScheduled = true;
  requestAnimationFrame(() => {
    cullScheduled = false;
    renderAllNodes();
  });
}

function applyViewportTransform(transform) {
  state.zoom = transform.zoom;
  state.panX = transform.panX;
  state.panY = transform.panY;
  document.getElementById('zoom-level').textContent = Math.round(state.zoom * 100) + '%';
  updateTransform();
}

function fitNodes(nodes) {
  if (!nodes?.length || typeof DiagramWeaveCanvasTools === 'undefined') return false;
  applyViewportTransform(DiagramWeaveCanvasTools.fitTransform(nodes, {
    width: canvasWrapper.clientWidth, height: canvasWrapper.clientHeight,
  }, 72));
  return true;
}

function fitAllNodes() {
  return fitNodes(state.nodes);
}

function fitSelectedNodes() {
  const selected = new Set(getSelectedNodeIds());
  return fitNodes(state.nodes.filter(node => selected.has(node.id)));
}

function centerNodeInCanvas(nodeId) {
  const node = state.nodes.find(item => item.id === nodeId);
  if (!node) return false;
  state.panX = canvasWrapper.clientWidth / 2 - (node.x + node.w / 2) * state.zoom;
  state.panY = canvasWrapper.clientHeight / 2 - (node.y + node.h / 2) * state.zoom;
  updateTransform();
  return true;
}

function toggleOutlinePanel(force) {
  const panel = document.getElementById('outlinePanel');
  const visible = typeof force === 'boolean' ? force : !panel.classList.contains('visible');
  panel.classList.toggle('visible', visible);
  if (visible) {
    renderOutlinePanel();
    document.getElementById('outlineSearch')?.focus();
  }
}

function syncOutlineFilterOptions(nodes) {
  const sync = (id, values, emptyLabel) => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${emptyLabel}</option>` + [...values].filter(Boolean).sort().map(value =>
      `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if ([...values].includes(current)) select.value = current;
  };
  sync('outlineRoleFilter', new Set(nodes.map(node => node.role)), '全部角色');
  sync('outlineShapeFilter', new Set(nodes.map(node => node.shape)), '全部形状');
}

function renderOutlinePanel() {
  const list = document.getElementById('outlineNodeList');
  if (!list || typeof DiagramWeaveCanvasTools === 'undefined') return;
  const pages = typeof DiagramWeave !== 'undefined' && DiagramWeave.doc?.pages?.length
    ? DiagramWeave.doc.pages
    : [{ id: 'page_1', name: 'Page 1', nodes: state.nodes }];
  const allNodes = pages.flatMap(page => page.nodes || []);
  syncOutlineFilterOptions(allNodes);
  const query = document.getElementById('outlineSearch')?.value || '';
  const filters = {
    role: document.getElementById('outlineRoleFilter')?.value || '',
    shape: document.getElementById('outlineShapeFilter')?.value || '',
  };
  const fragment = document.createDocumentFragment();
  pages.forEach(page => {
    const nodes = DiagramWeaveCanvasTools.filterNodes(page.nodes || [], query, filters);
    if (!nodes.length) return;
    const label = document.createElement('div');
    label.className = 'outline-page-label';
    label.textContent = page.name;
    fragment.appendChild(label);
    nodes.forEach(node => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `outline-node${getSelectedNodeIds().includes(node.id) ? ' selected' : ''}`;
      button.innerHTML = `<span>${escapeHtml(node.label || node.id)}</span><small>${escapeHtml(node.role || node.shape || '')}</small>`;
      button.addEventListener('click', () => focusOutlineNode(page.id, node.id));
      fragment.appendChild(button);
    });
  });
  if (!fragment.childNodes.length) list.innerHTML = '<div class="outline-empty">没有匹配节点</div>';
  else list.replaceChildren(fragment);
}

function focusOutlineNode(pageId, nodeId) {
  if (typeof DiagramWeave !== 'undefined' && DiagramWeave.doc.currentPageId !== pageId) DiagramWeave.switchPage(pageId);
  selectNode(nodeId);
  centerNodeInCanvas(nodeId);
  renderOutlinePanel();
}

function renderCanvasMinimap() {
  const minimap = document.getElementById('canvasMinimap');
  if (!minimap || typeof DiagramWeaveCanvasTools === 'undefined') return;
  const ctx = minimap.getContext('2d');
  const width = minimap.width;
  const height = minimap.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getThemeVar('--bg-surface', '#1b1d27');
  ctx.fillRect(0, 0, width, height);
  const box = DiagramWeaveCanvasTools.bounds(state.nodes);
  if (!box) return;
  const padding = 10;
  const scale = Math.min((width - padding * 2) / Math.max(1, box.width), (height - padding * 2) / Math.max(1, box.height));
  const offsetX = (width - box.width * scale) / 2 - box.minX * scale;
  const offsetY = (height - box.height * scale) / 2 - box.minY * scale;
  minimap.dataset.scale = String(scale);
  minimap.dataset.offsetX = String(offsetX);
  minimap.dataset.offsetY = String(offsetY);
  const selected = new Set(getSelectedNodeIds());
  state.nodes.forEach(node => {
    ctx.fillStyle = selected.has(node.id) ? getThemeVar('--accent', '#8b7fff') : getThemeVar('--text-muted', '#858aa8');
    ctx.fillRect(node.x * scale + offsetX, node.y * scale + offsetY, Math.max(2, node.w * scale), Math.max(2, node.h * scale));
  });
  const worldX = -state.panX / state.zoom;
  const worldY = -state.panY / state.zoom;
  ctx.strokeStyle = getThemeVar('--accent-secondary', '#38bdf8');
  ctx.lineWidth = 2;
  ctx.strokeRect(worldX * scale + offsetX, worldY * scale + offsetY,
    canvasWrapper.clientWidth / state.zoom * scale, canvasWrapper.clientHeight / state.zoom * scale);
}

function handleMinimapClick(event) {
  const minimap = event.currentTarget;
  const rect = minimap.getBoundingClientRect();
  const scale = Number(minimap.dataset.scale);
  if (!scale) return;
  const x = (event.clientX - rect.left) * (minimap.width / rect.width);
  const y = (event.clientY - rect.top) * (minimap.height / rect.height);
  const worldX = (x - Number(minimap.dataset.offsetX)) / scale;
  const worldY = (y - Number(minimap.dataset.offsetY)) / scale;
  state.panX = canvasWrapper.clientWidth / 2 - worldX * state.zoom;
  state.panY = canvasWrapper.clientHeight / 2 - worldY * state.zoom;
  updateTransform();
}

function selectedNodesForLayout() {
  const selected = new Set(getSelectedNodeIds());
  return state.nodes.filter(node => selected.has(node.id));
}

function applyNodePositionPatches(patches) {
  if (!patches.length) return false;
  saveState();
  const byId = new Map(patches.map(patch => [patch.id, patch]));
  state.nodes.forEach(node => {
    const patch = byId.get(node.id);
    if (patch) { node.x = patch.x; node.y = patch.y; }
  });
  renderAll();
  return true;
}

function runAlignCommand(mode) {
  if (!mode) return false;
  return applyNodePositionPatches(DiagramWeaveCanvasTools.align(selectedNodesForLayout(), mode));
}

function runDistributeCommand(axis) {
  if (!axis) return false;
  return applyNodePositionPatches(DiagramWeaveCanvasTools.distribute(selectedNodesForLayout(), axis));
}

function initCanvasNavigation() {
  document.getElementById('canvasMinimap')?.addEventListener('click', handleMinimapClick);
  renderOutlinePanel();
  renderCanvasMinimap();
}
  global.DiagramWeaveViewportNav = {
    CULL_MARGIN,
    applyNodePositionPatches,
    applyViewportTransform,
    centerNodeInCanvas,
    fitAllNodes,
    fitNodes,
    fitSelectedNodes,
    focusOutlineNode,
    getViewportBounds,
    handleMinimapClick,
    initCanvasNavigation,
    nodeInViewport,
    renderCanvasMinimap,
    renderOutlinePanel,
    runAlignCommand,
    runDistributeCommand,
    scheduleViewportCull,
    selectedNodesForLayout,
    syncOutlineFilterOptions,
    toggleOutlinePanel,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
