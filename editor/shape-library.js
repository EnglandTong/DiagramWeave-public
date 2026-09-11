/**
 * DiagramWeave Shape Library UI
 *
 * 從 flowchart-editor.js 抽取的形狀庫工作流與模板管理器（Phase 1 拆分第 14 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveShapeLibraryUI。
 *
 * 包含：
 * - 形狀渲染映射與註冊（shapeRenderAs / getNodeVisualShape / registerRemoteShape）
 * - 形狀庫面板（bindShapeItemElement / insertShapeFromLibrary / filterShapeLibrary /
 *   renderShapePreferenceState / renderShapeQuickList / toggleShapeFavorite /
 *   recordRecentShape / initShapeLibraryWorkflow）
 * - 連線路由模式（initConnRouteMode / setConnRouteMode / applyConnRouteModeFromData）
 * - 模板包管理器（initStencilManager / renderStencilManager / showStencilManager /
 *   hideStencilManager / handleStencilPackImport / exportStencilPack / refreshStencilPackShapes）
 * - 命令面板形狀動作（runPaletteItem）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / CONN_ROUTE_LABELS（editor/editor-state.js，加載在前）
 * - canvasWrapper（模塊內 getElementById 再綁定）
 * - flowchart-editor.js 頂層函數：closeCommandPalette、escapeHtml、getCommandContext、
 *   isMobileViewMode、sanitizeSvg、showToast、updateTransform
 * - 已提取模塊函數：applyTemplate、createNode、initShapeTypeSelect、
 *   rebuildConnRouteSelect、renderConnections、saveState、selectNode
 * - DiagramWeave / DiagramWeaveContent / DiagramWeaveSanitize / DiagramWeaveShapeLibrary /
 *   DiagramWeaveStencilManager 命名空間（typeof 守衛）
 * - window.t（i18n）
 */
/* global DiagramWeaveEditorCore, applyTemplate, closeCommandPalette, createNode, escapeHtml, getCommandContext, initShapeTypeSelect, isMobileViewMode, rebuildConnRouteSelect, renderConnections, sanitizeSvg, selectNode, t, updateTransform */
(function initDiagramWeaveShapeLibraryUI(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const CONN_ROUTE_LABELS = DiagramWeaveEditorCore.CONN_ROUTE_LABELS;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;

const shapeRenderAs = {};
let shapeLibraryRegistry = null;
let shapeLibraryPreferences = null;
let stencilPackStore = null;

function getNodeVisualShape(shape) {
  return shapeRenderAs[shape] || shape;
}

function bindShapeItemElement(item) {
  if (item.dataset.shapeBound === 'true') return;
  item.dataset.shapeBound = 'true';
  item.setAttribute('role', 'group');
  item.setAttribute('aria-keyshortcuts', 'Enter Space F');
  item.tabIndex = 0;
  if (!item.getAttribute('aria-label')) item.setAttribute('aria-label', item.dataset.label || item.dataset.shape);
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('shape', item.dataset.shape);
    e.dataTransfer.setData('label', item.dataset.label);
    e.dataTransfer.effectAllowed = 'copy';
  });
  item.addEventListener('dblclick', () => insertShapeFromLibrary(item));
  item.addEventListener('keydown', (e) => {
    if (e.key.toLocaleLowerCase() === 'f') {
      e.preventDefault();
      toggleShapeFavorite(item.dataset.shape);
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    insertShapeFromLibrary(item);
  });
  if (!item.querySelector('.shape-favorite-btn')) {
    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.className = 'shape-favorite-btn';
    favorite.setAttribute('aria-label', `Favorite ${item.dataset.label || item.dataset.shape}`);
    favorite.title = 'Favorite';
    favorite.textContent = '☆';
    favorite.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      toggleShapeFavorite(item.dataset.shape);
    });
    item.appendChild(favorite);
  }
}

function insertShapeFromLibrary(item) {
  if (isMobileViewMode()) return null;
  const shape = item?.dataset.shape;
  if (!shape) return null;
  const label = item.dataset.label || shapeNames[shape] || shape;
  const defaults = shapeDefaults[shape] || { w: 140, h: 60 };
  const x = (canvasWrapper.clientWidth / 2 - state.panX) / state.zoom - defaults.w / 2;
  const y = (canvasWrapper.clientHeight / 2 - state.panY) / state.zoom - defaults.h / 2;
  saveState();
  const node = createNode(shape, x, y, label);
  state.nodes.push(node);
  recordRecentShape(shape);
  selectNode(node.id);
  showToast(typeof t === 'function' ? t('toast.addedShape', { label }) : `Added ${label}`);
  return node;
}

function registerRemoteShape(entry) {
  if (!entry?.id) return;
  shapeDefaults[entry.id] = entry.defaults || { w: 140, h: 60 };
  shapeNames[entry.id] = entry.label || entry.id;
  shapeLibraryRegistry?.register({
    id: entry.id, label: entry.label, category: entry.category || 'Remote',
    packId: entry.packId || 'remote', keywords: entry.keywords || [], defaults: entry.defaults, renderAs: entry.renderAs,
  });
  if (entry.renderAs && entry.renderAs !== entry.id) {
    shapeRenderAs[entry.id] = entry.renderAs;
  }
  if (typeof DiagramWeaveSanitize !== 'undefined' && typeof DiagramWeaveSanitize.registerShape === 'function') {
    DiagramWeaveSanitize.registerShape(entry.id);
  }
  const section = document.getElementById('remoteShapesSection');
  const grid = document.getElementById('remoteShapesGrid');
  if (!section || !grid) return;
  grid.querySelector(`[data-shape="${CSS.escape(entry.id)}"]`)?.remove();
  section.style.display = '';
  const el = document.createElement('div');
  el.className = 'shape-item';
  el.draggable = true;
  el.dataset.shape = entry.id;
  el.dataset.label = entry.label || entry.id;
  el.dataset.packId = entry.packId || 'remote';
  el.innerHTML = `${sanitizeSvg(entry.svg)}<span class="shape-item-label">${escapeHtml(entry.label || entry.id)}</span>`;
  bindShapeItemElement(el);
  grid.appendChild(el);
  initShapeTypeSelect();
}

function initConnRouteMode() {
  try {
    const saved = localStorage.getItem('fc-conn-route-mode');
    if (saved && CONN_ROUTE_LABELS[saved]) state.connRouteMode = saved;
  } catch { /* ignore */ }
  rebuildConnRouteSelect();
}

function setConnRouteMode(mode) {
  if (!CONN_ROUTE_LABELS[mode]) return;
  state.connRouteMode = mode;
  try { localStorage.setItem('fc-conn-route-mode', mode); } catch { /* ignore */ }
  rebuildConnRouteSelect();
  renderConnections();
  showToast(typeof t === 'function' ? t('toast.connRoute', { mode: CONN_ROUTE_LABELS[mode] }) : CONN_ROUTE_LABELS[mode]);
}

function applyConnRouteModeFromData(mode) {
  if (mode && CONN_ROUTE_LABELS[mode]) {
    state.connRouteMode = mode;
    const sel = document.getElementById('connRouteMode');
    if (sel) sel.value = mode;
  }
}

async function runPaletteItem(kind, id) {
  if (kind === 'command') await DiagramWeave.commands.executeCommand(id, getCommandContext());
  if (kind === 'page') DiagramWeave.switchPage(id);
  if (kind === 'node') {
    selectNode(id);
    const node = state.nodes.find(item => item.id === id);
    if (node) {
      state.panX = canvasWrapper.clientWidth / 2 - (node.x + node.w / 2) * state.zoom;
      state.panY = canvasWrapper.clientHeight / 2 - (node.y + node.h / 2) * state.zoom;
      updateTransform();
    }
  }
  if (kind === 'template') applyTemplate(Number(id));
  closeCommandPalette();
}

function filterShapeLibrary(query) {
  const matches = new Set(shapeLibraryRegistry
    ? shapeLibraryRegistry.search(query).map(entry => entry.id)
    : []);
  const needle = String(query || '').trim();
  document.querySelectorAll('.shape-item').forEach(item => {
    item.hidden = Boolean(needle) && !matches.has(item.dataset.shape);
  });
  document.querySelectorAll('.sidebar-section').forEach(section => {
    const items = [...section.querySelectorAll('.shape-item')];
    if (items.length) section.hidden = Boolean(needle) && items.every(item => item.hidden);
  });
}

function renderShapePreferenceState() {
  if (!shapeLibraryPreferences) return;
  const favorites = new Set(shapeLibraryPreferences.favorites());
  document.querySelectorAll('.shape-item').forEach(item => {
    const active = favorites.has(item.dataset.shape);
    item.classList.toggle('favorite', active);
    const button = item.querySelector('.shape-favorite-btn');
    if (button) { button.textContent = active ? '★' : '☆'; button.setAttribute('aria-pressed', String(active)); }
  });
  renderShapeQuickList('shapeFavorites', shapeLibraryPreferences.favorites());
  renderShapeQuickList('shapeRecent', shapeLibraryPreferences.recent());
}

function renderShapeQuickList(id, ids) {
  const list = document.getElementById(id);
  if (!list || !shapeLibraryRegistry) return;
  list.replaceChildren(...ids.map(shapeId => shapeLibraryRegistry.get(shapeId)).filter(Boolean).map(entry => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'shape-quick-item'; button.textContent = entry.label;
    button.addEventListener('click', () => insertShapeFromLibrary(document.querySelector(`.shape-item[data-shape="${CSS.escape(entry.id)}"]`)));
    return button;
  }));
  list.parentElement.hidden = !list.childElementCount;
}

function toggleShapeFavorite(shapeId) {
  shapeLibraryPreferences?.toggleFavorite(shapeId);
  renderShapePreferenceState();
}

function recordRecentShape(shapeId) {
  shapeLibraryPreferences?.recordRecent(shapeId);
  renderShapePreferenceState();
}

function initShapeLibraryWorkflow() {
  if (typeof DiagramWeaveShapeLibrary === 'undefined') return;
  shapeLibraryRegistry = DiagramWeaveShapeLibrary.createRegistry();
  shapeLibraryPreferences = DiagramWeaveShapeLibrary.createPreferences(localStorage);
  const sidebar = document.querySelector('.sidebar');
  const firstSection = sidebar?.querySelector('.sidebar-section');
  ['Favorites', 'Recent'].forEach(name => {
    const section = document.createElement('div');
    section.className = 'sidebar-section shape-quick-section'; section.hidden = true;
    section.innerHTML = `<div class="sidebar-section-title">${name}</div><div class="shape-quick-list" id="shape${name}"></div>`;
    sidebar?.insertBefore(section, firstSection);
  });
  document.querySelectorAll('.sidebar-section').forEach((section, index) => {
    const title = section.querySelector('.sidebar-section-title');
    const grid = section.querySelector('.shape-grid');
    if (!title || !grid) return;
    const category = title.textContent.trim() || `Category ${index + 1}`;
    title.tabIndex = 0; title.setAttribute('role', 'button'); title.setAttribute('aria-expanded', 'true');
    const toggle = () => { const collapsed = section.classList.toggle('collapsed'); title.setAttribute('aria-expanded', String(!collapsed)); };
    title.addEventListener('click', toggle);
    title.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
    section.querySelectorAll('.shape-item').forEach(item => {
      shapeLibraryRegistry.register({ id: item.dataset.shape, label: item.dataset.label, category,
        packId: section.id === 'remoteShapesSection' ? 'remote' : 'builtin', keywords: [item.dataset.shape, item.dataset.label] });
      bindShapeItemElement(item);
    });
  });
  window.DiagramWeave = window.DiagramWeave || {};
  DiagramWeave.shapePacks = shapeLibraryRegistry;
  renderShapePreferenceState();
}

function refreshStencilPackShapes() {
  if (!stencilPackStore || !shapeLibraryRegistry) return;
  const grid = document.getElementById('remoteShapesGrid');
  grid?.querySelectorAll('.shape-item[data-pack-id]').forEach(item => {
    if (item.dataset.packId !== 'remote') item.remove();
  });
  stencilPackStore.list().forEach(pack => {
    shapeLibraryRegistry.unregisterPack(pack.id);
    if (pack.enabled) pack.shapes.forEach(shape => registerRemoteShape({ ...shape, packId: pack.id }));
  });
  const section = document.getElementById('remoteShapesSection');
  if (section) section.style.display = grid?.childElementCount ? '' : 'none';
  renderShapePreferenceState();
}

function initStencilManager() {
  if (typeof DiagramWeaveStencilManager === 'undefined' || typeof DiagramWeaveContent === 'undefined') return;
  stencilPackStore = DiagramWeaveStencilManager.createStore(localStorage, DiagramWeaveContent.validatePack);
  refreshStencilPackShapes();
  window.DiagramWeave = window.DiagramWeave || {};
  DiagramWeave.stencilPacks = stencilPackStore;
}

function renderStencilManager() {
  const list = document.getElementById('stencilPackList');
  if (!list || !stencilPackStore) return;
  const packs = stencilPackStore.list();
  list.replaceChildren(...packs.map(pack => {
    const row = document.createElement('div'); row.className = 'stencil-pack-row'; row.dataset.packId = pack.id;
    const toggle = document.createElement('input'); toggle.type = 'checkbox'; toggle.checked = pack.enabled;
    toggle.setAttribute('aria-label', `Enable ${pack.name}`);
    toggle.addEventListener('change', () => { stencilPackStore.setEnabled(pack.id, toggle.checked); refreshStencilPackShapes(); renderStencilManager(); });
    const details = document.createElement('div');
    const name = document.createElement('input'); name.type = 'text'; name.value = pack.name; name.maxLength = 60; name.setAttribute('aria-label', 'Pack name');
    name.addEventListener('change', () => { stencilPackStore.rename(pack.id, name.value); });
    const meta = document.createElement('div'); meta.className = 'stencil-pack-meta'; meta.textContent = `${pack.id} · ${pack.shapes.length} shapes · v${pack.version}`;
    details.append(name, meta);
    const exportButton = document.createElement('button'); exportButton.type = 'button'; exportButton.textContent = 'Export'; exportButton.addEventListener('click', () => exportStencilPack(pack.id));
    const removeButton = document.createElement('button'); removeButton.type = 'button'; removeButton.textContent = 'Remove'; removeButton.addEventListener('click', () => { stencilPackStore.remove(pack.id); refreshStencilPackShapes(); renderStencilManager(); });
    row.append(toggle, details, exportButton, removeButton); return row;
  }));
  if (!packs.length) { const empty = document.createElement('p'); empty.className = 'settings-hint'; empty.textContent = 'No local stencil packs.'; list.append(empty); }
}

function showStencilManager() {
  if (!stencilPackStore) initStencilManager();
  document.getElementById('stencilPackIssues').textContent = '';
  renderStencilManager();
  const overlay = document.getElementById('stencilManagerOverlay');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('visible');
}

function hideStencilManager() {
  const overlay = document.getElementById('stencilManagerOverlay');
  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
}

async function handleStencilPackImport(event) {
  const file = event.target.files?.[0]; event.target.value = '';
  if (!file || !stencilPackStore) return;
  let raw;
  try { raw = JSON.parse(await file.text()); } catch { raw = null; }
  const result = stencilPackStore.importPack(raw);
  const issues = document.getElementById('stencilPackIssues');
  if (!result.success) { issues.textContent = result.issues.join('\n'); return; }
  issues.textContent = '';
  refreshStencilPackShapes(); renderStencilManager();
}

function exportStencilPack(id) {
  const json = stencilPackStore?.exportPack(id); if (!json) return;
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `${id}.stencil.json`; link.click(); URL.revokeObjectURL(url);
}
  global.DiagramWeaveShapeLibraryUI = {
    applyConnRouteModeFromData,
    bindShapeItemElement,
    exportStencilPack,
    filterShapeLibrary,
    getNodeVisualShape,
    handleStencilPackImport,
    hideStencilManager,
    initConnRouteMode,
    initShapeLibraryWorkflow,
    initStencilManager,
    insertShapeFromLibrary,
    recordRecentShape,
    refreshStencilPackShapes,
    registerRemoteShape,
    renderShapePreferenceState,
    renderShapeQuickList,
    renderStencilManager,
    runPaletteItem,
    setConnRouteMode,
    showStencilManager,
    toggleShapeFavorite,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
