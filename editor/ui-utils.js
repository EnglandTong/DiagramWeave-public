/**
 * DiagramWeave UI Utils
 *
 * 從 flowchart-editor.js 抽取的 UI 工具（Phase 1 拆分第 11 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveUIUtils。
 *
 * 包含：
 * - i18n 輔助（localeCompareTag / refreshConnRouteLabelsFromI18n / setAppLanguage）
 * - 主題與 Office 色板（getThemeVar / OFFICE_* swatches / colorAccessibleName / normalizeHexColor）
 * - 節點默認配色與描邊（getDefaultNodeFill / getDefaultNodeStroke / applyNodeStrokeColor）
 * - 形狀描邊規格與端口錨點（SHAPE_STROKE_SPECS / SHAPE_PORT_ANCHORS / getShapePortAnchors）
 * - 節點輪廓與端口元素同步（syncNodeOutlineSvg / syncPortElements）
 * - 快速提示與色板面板（initFastTooltips / initColorSwatches / syncColorSwatchSelection /
 *   setNodeFillColor / setNodeStrokeColor）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / CONN_ROUTE_LABELS（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：getNodeVisualShape、showToast
 * - 已提取模塊函數：applyBatchNodeProperty
 * - DiagramWeaveI18n / DiagramWeavePropertyPanel / DiagramWeavePropertyTools /
 *   DiagramWeaveSanitize 命名空間（typeof 守衛）
 * - window.t（i18n）
 */
/* global DiagramWeaveEditorCore, applyBatchNodeProperty, getNodeVisualShape, t */
(function initDiagramWeaveUIUtils(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const CONN_ROUTE_LABELS = DiagramWeaveEditorCore.CONN_ROUTE_LABELS;

function localeCompareTag() {
  return typeof DiagramWeaveI18n !== 'undefined' ? DiagramWeaveI18n.getLocaleCompareTag() : 'zh-CN';
}

function refreshConnRouteLabelsFromI18n() {
  if (typeof t !== 'function') return;
  ['bezier', 'orthogonal', 'avoidance', 'straight', 'visio'].forEach(k => {
    if (CONN_ROUTE_LABELS[k] !== undefined) CONN_ROUTE_LABELS[k] = t('conn.' + k);
  });
}

async function setAppLanguage(code) {
  if (typeof DiagramWeaveI18n === 'undefined') return;
  await DiagramWeaveI18n.setLocale(code);
  const appLang = document.getElementById('appLanguage');
  const setLang = document.getElementById('settingsLanguage');
  if (appLang) appLang.value = DiagramWeaveI18n.getLocale();
  if (setLang) setLang.value = DiagramWeaveI18n.getLocale();
  showToast(t('toast.langChanged'));
}

// Office 风格色块（填充 / 边框）
const OFFICE_FILL_SWATCHES = [
  '#FFFFFF', '#F2F2F2', '#DAEAF6', '#E2EFDA', '#FFF2CC',
  '#FCE4D6', '#F8CECC', '#E4DFEC', '#D9E1F2', '#1E2029',
];
const OFFICE_STROKE_SWATCHES = [
  '#000000', '#44546A', '#4472C4', '#70AD47', '#FFC000',
  '#ED7D31', '#FF0000', '#7030A0', '#5B9BD5', '#FFFFFF',
];

const OFFICE_COLOR_NAMES = {
  '#FFFFFF': 'White / 白色', '#F2F2F2': 'Light gray / 浅灰', '#DAEAF6': 'Light blue / 浅蓝',
  '#E2EFDA': 'Light green / 浅绿', '#FFF2CC': 'Light yellow / 浅黄', '#FCE4D6': 'Peach / 桃色',
  '#F8CECC': 'Light red / 浅红', '#E4DFEC': 'Lavender / 淡紫', '#D9E1F2': 'Blue gray / 蓝灰',
  '#1E2029': 'Charcoal / 炭黑', '#000000': 'Black / 黑色', '#44546A': 'Slate / 石板灰',
  '#4472C4': 'Blue / 蓝色', '#70AD47': 'Green / 绿色', '#FFC000': 'Gold / 金色',
  '#ED7D31': 'Orange / 橙色', '#FF0000': 'Red / 红色', '#7030A0': 'Purple / 紫色',
  '#5B9BD5': 'Sky blue / 天蓝',
};

function colorAccessibleName(color) {
  const normalized = String(color || '').toUpperCase();
  return `${OFFICE_COLOR_NAMES[normalized] || 'Custom / 自定义'} ${normalized}`;
}

function getThemeVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const THEME_STORAGE_KEY = 'diagramweave.theme';
let _currentThemeMode = 'dark';
let _mediaQuery = null;

function getStoredTheme() {
  try { return localStorage.getItem(THEME_STORAGE_KEY) || 'system'; }
  catch (_) { return 'system'; }
}

function resolveTheme(mode) {
  if (mode === 'system') {
    if (!_mediaQuery) _mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    return _mediaQuery.matches ? 'light' : 'dark';
  }
  return mode;
}

function applyTheme(mode) {
  _currentThemeMode = mode || 'system';
  try { localStorage.setItem(THEME_STORAGE_KEY, _currentThemeMode); } catch (_) {}
  const actual = resolveTheme(_currentThemeMode);
  document.documentElement.setAttribute('data-theme', actual);
  const sel = document.getElementById('settingsTheme');
  if (sel && sel.value !== _currentThemeMode) sel.value = _currentThemeMode;
  if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.scheduleRender === 'function') {
    DiagramWeaveEditorCore.scheduleRender();
  }
  if (typeof showToast === 'function' && typeof t === 'function') {
    showToast(t('toast.themeChanged') || 'Theme updated');
  }
}

function initTheme() {
  const saved = getStoredTheme();
  applyTheme(saved);
  if (!_mediaQuery) _mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  _mediaQuery.addEventListener('change', () => {
    if (_currentThemeMode === 'system') applyTheme('system');
  });
}

function getDefaultNodeFill() {
  return getThemeVar('--node-fill-default', '#1e2029');
}

function getDefaultNodeStroke() {
  return getThemeVar('--node-stroke-default', '#3a3e55');
}

// P2-02 修复：优先委托已提取的 DiagramWeavePropertyPanel.normalizeHexColor，
// 消除主文件与 editor/property-panel.js 的双重实现。
function normalizeHexColor(c) {
  if (typeof DiagramWeavePropertyPanel !== 'undefined' && typeof DiagramWeavePropertyPanel.normalizeHexColor === 'function') {
    return DiagramWeavePropertyPanel.normalizeHexColor(c);
  }
  if (typeof DiagramWeaveSanitize !== 'undefined' && typeof DiagramWeaveSanitize.sanitizeHexColor === 'function') {
    return DiagramWeaveSanitize.sanitizeHexColor(c, c);
  }
  return (c || '').trim().toLowerCase();
}

function applyNodeStrokeColor(shapeEl, color) {
  if (!shapeEl) return;
  const stroke = color || getDefaultNodeStroke();
  shapeEl.style.borderColor = stroke;
  shapeEl.style.setProperty('--node-stroke', stroke);
}

/** clip-path 图形无法用 border 描边，用 SVG 矢量描边（viewBox 0–100） */
const SHAPE_STROKE_SPECS = {
  diamond:  { type: 'polygon', points: '50,0 100,50 50,100 0,50' },
  hexagon:  { type: 'polygon', points: '50,0 100,25 100,75 50,100 0,75 0,25' },
  triangle: { type: 'polygon', points: '50,0 100,100 0,100' },
  display:  { type: 'polygon', points: '0,0 100,0 100,75 50,100 0,75' },
  manual:   { type: 'polygon', points: '0,0 85,0 100,100 15,100' },
  sort:     { type: 'polygon', points: '50,0 100,40 80,40 80,100 20,100 20,40 0,40' },
  storage:  { type: 'polygon', points: '50,0 100,25 100,100 0,100 0,25' },
  offpage:  { type: 'polygon', points: '0,0 85,0 100,50 85,100 0,100' },
  or:       { type: 'ellipse', cx: 50, cy: 50, rx: 50, ry: 40 },
};

/** 各图形四向连线锚点（相对宽高的 0–1 比例，贴合 clip-path 轮廓） */
const SHAPE_PORT_ANCHORS = {
  default: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
  },
  diamond: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
  },
  triangle: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0.25, y: 0.5 }, right: { x: 0.75, y: 0.5 },
  },
  hexagon: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
  },
  storage: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.625 }, right: { x: 1, y: 0.625 },
  },
  display: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.375 }, right: { x: 1, y: 0.375 },
  },
  manual: {
    top: { x: 0.425, y: 0 }, bottom: { x: 0.575, y: 1 },
    left: { x: 0.075, y: 0.5 }, right: { x: 0.925, y: 0.5 },
  },
  sort: {
    top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
    left: { x: 0.2, y: 0.7 }, right: { x: 0.8, y: 0.7 },
  },
  offpage: {
    top: { x: 0.425, y: 0 }, bottom: { x: 0.425, y: 1 },
    left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
  },
  or: {
    top: { x: 0.5, y: 0.1 }, bottom: { x: 0.5, y: 0.9 },
    left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
  },
};

function getShapePortAnchors(shape) {
  return SHAPE_PORT_ANCHORS[shape] || SHAPE_PORT_ANCHORS.default;
}

function syncNodeOutlineSvg(shapeEl, node) {
  if (!shapeEl || !node) return;
  const visualShape = getNodeVisualShape(node.shape);
  const spec = SHAPE_STROKE_SPECS[visualShape];
  let svg = shapeEl.querySelector('.node-outline-svg');

  if (!spec) {
    if (svg) svg.remove();
    return;
  }

  const stroke = node.strokeColor || getDefaultNodeStroke();
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'node-outline-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    shapeEl.insertBefore(svg, shapeEl.firstChild);
  }

  svg.innerHTML = '';
  let pathEl;
  if (spec.type === 'polygon') {
    pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    pathEl.setAttribute('points', spec.points);
  } else if (spec.type === 'ellipse') {
    pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    pathEl.setAttribute('cx', String(spec.cx));
    pathEl.setAttribute('cy', String(spec.cy));
    pathEl.setAttribute('rx', String(spec.rx));
    pathEl.setAttribute('ry', String(spec.ry));
  }
  if (pathEl) {
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', stroke);
    pathEl.setAttribute('stroke-width', '2');
    pathEl.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(pathEl);
  }
}

function syncPortElements(el, node) {
  if (!el || !node) return;
  const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
  ['top', 'bottom', 'left', 'right'].forEach(port => {
    const portEl = el.querySelector(`.port-${port}`);
    const a = anchors[port];
    if (!portEl || !a) return;
    portEl.style.left = `${a.x * 100}%`;
    portEl.style.top = `${a.y * 100}%`;
    portEl.style.right = 'auto';
    portEl.style.bottom = 'auto';
  });
}

function initFastTooltips(root) {
  const scope = root || document;
  let tipEl = document.getElementById('fcTooltip');
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.id = 'fcTooltip';
    tipEl.className = 'fc-tooltip';
    tipEl.setAttribute('role', 'tooltip');
    tipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tipEl);
  }

  let timer = null;
  let anchor = null;

  const hide = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    anchor = null;
    tipEl.classList.remove('visible');
    tipEl.setAttribute('aria-hidden', 'true');
  };

  const show = () => {
    if (!anchor) return;
    const text = anchor.dataset.fcTip;
    if (!text) return;
    tipEl.textContent = text;
    tipEl.setAttribute('aria-hidden', 'false');
    const r = anchor.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 8, Math.max(8, r.left + r.width / 2));
    tipEl.style.left = `${left}px`;
    tipEl.style.top = `${r.bottom + 6}px`;
    tipEl.style.transform = 'translateX(-50%)';
    tipEl.classList.add('visible');
  };

  scope.querySelectorAll('[title]').forEach(el => {
    if (el.dataset.fcTipInit) return;
    el.dataset.fcTipInit = '1';
    const t = el.getAttribute('title');
    if (t) {
      el.dataset.fcTip = t;
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', t);
      el.removeAttribute('title');
    }
    el.addEventListener('mouseenter', () => {
      anchor = el;
      timer = setTimeout(show, 450);
    });
    el.addEventListener('mouseleave', hide);
    el.addEventListener('mousedown', hide);
    el.addEventListener('focus', () => { anchor = el; show(); });
    el.addEventListener('blur', hide);
  });
}

function initColorSwatches() {
  const fillEl = document.getElementById('propFillSwatches');
  const strokeEl = document.getElementById('propStrokeSwatches');
  if (!fillEl || !strokeEl) return;
  fillEl.innerHTML = OFFICE_FILL_SWATCHES.map(c =>
    `<button type="button" class="color-swatch" data-color="${c}" data-kind="fill" style="background:${c}" title="Fill / 填充 ${colorAccessibleName(c)}" aria-label="Fill / 填充 ${colorAccessibleName(c)}" onclick="setNodeFillColor('${c}')"></button>`
  ).join('');
  strokeEl.innerHTML = OFFICE_STROKE_SWATCHES.map(c =>
    `<button type="button" class="color-swatch color-swatch-stroke" data-color="${c}" data-kind="stroke" style="box-shadow:inset 0 0 0 3px ${c}" title="Stroke / 边框 ${colorAccessibleName(c)}" aria-label="Stroke / 边框 ${colorAccessibleName(c)}" onclick="setNodeStrokeColor('${c}')"></button>`
  ).join('');
  initFastTooltips(document.getElementById('propFillSwatches')?.parentElement);
  initFastTooltips(document.getElementById('propStrokeSwatches')?.parentElement);
}

function syncColorSwatchSelection() {
  const node = state.selectedNodeId
    ? state.nodes.find(n => n.id === state.selectedNodeId)
    : null;
  if (!node) return;
  const fill = normalizeHexColor(node.fillColor);
  const stroke = normalizeHexColor(node.strokeColor);
  document.querySelectorAll('#propFillSwatches .color-swatch').forEach(btn => {
    btn.classList.toggle('selected', normalizeHexColor(btn.dataset.color) === fill);
  });
  document.querySelectorAll('#propStrokeSwatches .color-swatch').forEach(btn => {
    btn.classList.toggle('selected', normalizeHexColor(btn.dataset.color) === stroke);
  });
}

function setNodeFillColor(color) {
  const normalized = typeof DiagramWeavePropertyTools !== 'undefined'
    ? DiagramWeavePropertyTools.normalizeColor(color)
    : color;
  if (normalized) applyBatchNodeProperty('fillColor', normalized);
}

function setNodeStrokeColor(color) {
  const normalized = typeof DiagramWeavePropertyTools !== 'undefined'
    ? DiagramWeavePropertyTools.normalizeColor(color)
    : color;
  if (normalized) applyBatchNodeProperty('strokeColor', normalized);
}
  global.DiagramWeaveUIUtils = {
    OFFICE_COLOR_NAMES,
    OFFICE_FILL_SWATCHES,
    OFFICE_STROKE_SWATCHES,
    SHAPE_PORT_ANCHORS,
    SHAPE_STROKE_SPECS,
    applyNodeStrokeColor,
    applyTheme,
    colorAccessibleName,
    getDefaultNodeFill,
    getDefaultNodeStroke,
    getShapePortAnchors,
    getThemeVar,
    initColorSwatches,
    initFastTooltips,
    initTheme,
    localeCompareTag,
    normalizeHexColor,
    refreshConnRouteLabelsFromI18n,
    setAppLanguage,
    setNodeFillColor,
    setNodeStrokeColor,
    syncColorSwatchSelection,
    syncNodeOutlineSvg,
    syncPortElements,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
