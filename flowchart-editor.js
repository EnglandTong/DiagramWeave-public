// ===== 状态管理 =====
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
};

const CONN_ROUTE_LABELS = {
  bezier: '平滑曲线',
  orthogonal: '正交折线',
  avoidance: '加强避障',
  straight: '直线',
  visio: 'Visio 连线',
};

/** 远程内容包形状 id → 画布渲染复用的内置 shape */
const shapeRenderAs = {};
let shapeLibraryRegistry = null;
let shapeLibraryPreferences = null;
let stencilPackStore = null;
let versionHistoryStore = null;
let lastHistoryFingerprint = '';

const CONN_ROUTE_ALGORITHMS = {};

const MAX_EXCEL_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EXCEL_NODE_ROWS = 2000;
const MAX_EXCEL_CONN_ROWS = 4000;
const MAX_EXCEL_LABEL_LENGTH = 80;
const MAX_EXCEL_ROLE_LENGTH = 80;
const MAX_EXCEL_DETAIL_LENGTH = 800;
const MAX_EXCEL_TARGET_PAGE_LENGTH = 80;
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

const NATIVE_VISIO_EXT_RE = /\.(vsdx|vsd|vsdm|vdx)$/i;

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

const shapeDefaults = {
  rectangle:    { w: 140, h: 60 },
  rounded:      { w: 140, h: 60 },
  diamond:      { w: 120, h: 80 },
  terminator:    { w: 140, h: 50 },
  circle:       { w: 60,  h: 60 },
  database:     { w: 120, h: 70 },
  parallelogram: { w: 140, h: 60 },
  document:     { w: 120, h: 70 },
  hexagon:      { w: 120, h: 70 },
  triangle:     { w: 100, h: 80 },
  cross:        { w: 80,  h: 80 },
  delay:        { w: 140, h: 50 },
  display:      { w: 140, h: 60 },
  manual:       { w: 140, h: 60 },
  card:         { w: 140, h: 60 },
  tape:         { w: 140, h: 60 },
  sort:         { w: 120, h: 80 },
  or:           { w: 100, h: 80 },
  summing:      { w: 100, h: 80 },
  collate:      { w: 120, h: 80 },
  storage:      { w: 100, h: 80 },
  multidoc:     { w: 120, h: 70 },
  internalstorage: { w: 120, h: 70 },
  offlinestorage: { w: 120, h: 70 },
  annotation:   { w: 140, h: 60 },
};

const shapeNames = {
  rectangle: '流程',
  rounded: '子流程',
  diamond: '判断',
  terminator: '开始/结束',
  circle: '连接点',
  database: '数据',
  parallelogram: '输入/输出',
  document: '文档',
  hexagon: '准备',
  triangle: '合并',
  cross: '交叉',
  delay: '延迟',
  display: '显示',
  manual: '手动操作',
  card: '卡片',
  tape: '磁带',
  sort: '排序',
  or: '或',
  summing: '求和',
  collate: '整理',
  storage: '存储',
  multidoc: '多文档',
  internalstorage: '内部存储',
  offlinestorage: '离线存储',
  annotation: '注释',
};

function shapeLabel(key) {
  if (typeof t === 'function') {
    const tr = t('shape.' + key);
    if (tr && tr !== 'shape.' + key) return tr;
  }
  return shapeNames[key] || key;
}

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

function getDefaultNodeFill() {
  return getThemeVar('--node-fill-default', '#1e2029');
}

function getDefaultNodeStroke() {
  return getThemeVar('--node-stroke-default', '#3a3e55');
}

function normalizeHexColor(c) {
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

function showExportDialog() {
  const include = document.getElementById('exportIncludeHistory'); if (include) include.checked = false;
  document.getElementById('exportOverlay').classList.add('visible');
}

function hideExportDialog() {
  document.getElementById('exportOverlay').classList.remove('visible');
}

async function runExport(format) {
  const includeHistory = document.getElementById('exportIncludeHistory')?.checked === true;
  hideExportDialog();
  if (format === 'png') exportPNG();
  else if (format === 'svg') exportSVG();
  else if (format === 'pdf') exportPDF();
  else if (format === 'vso') await downloadProjectVso(includeHistory);
  else if (format === 'vsdx') await downloadProjectVsdx();
  else if (format === 'viewer') downloadOfflineViewer();
}

async function downloadProjectVsdx() {
  if (typeof DiagramWeaveVisioBridge === 'undefined') return false;
  try {
    const blob = await DiagramWeaveVisioBridge.exportVsdx(getFlowDocumentPayload());
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = getProjectFileBaseName() + '.vsdx'; link.click(); URL.revokeObjectURL(link.href);
    showToast('Controlled VSDX exported'); return true;
  } catch (error) {
    showToast(`VSDX export failed: ${error.message}`); return false;
  }
}

function downloadOfflineViewer() {
  if (typeof DiagramWeaveOfflineViewer === 'undefined') return false;
  const html = DiagramWeaveOfflineViewer.buildViewerHtml(getFlowDocumentPayload(), { title: `${projectSession.name} - Viewer` });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = getProjectFileBaseName() + '.viewer.html'; link.click(); URL.revokeObjectURL(link.href);
  showToast('Offline HTML Viewer exported'); return true;
}

// ===== 流程图模板库 =====
let allTemplates = [];
const flowchartTemplates = [];
let templateFavorites = null;

// 模板图标SVG映射（使用第一个节点的形状）
const templateIconSVG = {
  terminator: '<svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="5"/></svg>',
  rectangle: '<svg viewBox="0 0 24 24" fill="none" stroke="#6c8cff" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/></svg>',
  diamond: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffd93d" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12"/></svg>',
  swimlane: '<svg viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" stroke-width="2"><rect x="2" y="4" width="20" height="6" rx="1"/><rect x="2" y="11" width="20" height="6" rx="1"/><rect x="2" y="18" width="20" height="3" rx="1"/></svg>',
  hexagon: '<svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7"/></svg>',
  storage: '<svg viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="2"><polygon points="12,2 22,8 22,20 2,20 2,8"/></svg>',
};

// ===== DOM 引用 =====
const canvasWrapper = document.getElementById('canvasWrapper');
const canvas = document.getElementById('canvas');
const canvasTransform = document.getElementById('canvasTransform');
const connectionsLayer = document.getElementById('connectionsLayer');
const selectionBox = document.getElementById('selectionBox');
const contextMenu = document.getElementById('contextMenu');

function rebuildAllTemplates() {
  allTemplates = flowchartTemplates.slice();
  if (typeof DiagramWeaveBootstrap !== 'undefined') {
    allTemplates = allTemplates.concat(DiagramWeaveBootstrap.getExternalTemplates());
  }
  if (typeof DiagramWeaveTemplateCenter !== 'undefined') {
    allTemplates = allTemplates.map((template, index) => DiagramWeaveTemplateCenter.normalizeTemplate(template, index));
  }
}

function initShapeTypeSelect() {
  const sel = document.getElementById('propTypeSelect');
  if (!sel) return;
  const keys = Object.keys(shapeDefaults).sort((a, b) =>
    shapeLabel(a).localeCompare(shapeLabel(b), localeCompareTag()));
  sel.innerHTML = keys.map(k =>
    `<option value="${k}">${escapeHtml(shapeLabel(k))}</option>`).join('');
}

function resolvePageName(pageId) {
  if (!pageId || typeof DiagramWeave === 'undefined') return '';
  const p = DiagramWeave.doc.pages.find(x => x.id === pageId);
  return p ? p.name : '(已删除页)';
}

// ===== 初始化模板列表 =====
function initTemplates() {
  rebuildAllTemplates();
  if (!templateFavorites && typeof DiagramWeaveTemplateCenter !== 'undefined') {
    templateFavorites = DiagramWeaveTemplateCenter.createFavorites(localStorage);
  }
  const category = document.getElementById('templateCenterCategory');
  if (category) {
    const current = category.value;
    const categories = [...new Set(allTemplates.map(template => template.category))].sort();
    category.innerHTML = '<option value="">All categories / 全部分类</option>' + categories.map(value =>
      `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if (categories.includes(current)) category.value = current;
  }
  renderTemplateCenter();
}

function renderTemplateCenter() {
  const grid = document.getElementById('templateDialogGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!allTemplates.length) {
    grid.innerHTML = `
      <div class="template-dialog-empty">
        <p>暂无内置模板。启动时画布为空白，可从左侧拖图形自行绘制。</p>
        <p class="template-dialog-empty-hint">在 <code>templates/</code> 添加 JSON 并在 <code>index.json</code> 登记后，刷新即可在此选用。详见 <code>templates/README.md</code>。</p>
      </div>`;
    return;
  }
  const query = document.getElementById('templateCenterSearch')?.value || '';
  const category = document.getElementById('templateCenterCategory')?.value || '';
  const favoriteIds = new Set(templateFavorites?.list() || []);
  let templates = typeof DiagramWeaveTemplateCenter !== 'undefined'
    ? DiagramWeaveTemplateCenter.searchTemplates(allTemplates, query, category)
    : allTemplates;
  if (document.getElementById('templateFavoritesOnly')?.checked) {
    templates = templates.filter(template => favoriteIds.has(template.id));
  }
  if (!templates.length) {
    grid.innerHTML = '<div class="template-dialog-empty">No matching templates / 没有匹配模板</div>';
    return;
  }
  templates.forEach(tmpl => {
    const idx = tmpl.sourceIndex ?? allTemplates.indexOf(tmpl);
    const el = document.createElement('div');
    el.className = 'template-dialog-item';
    const isEn = typeof DiagramWeaveI18n !== 'undefined' && DiagramWeaveI18n.getLocale() === 'en';
    const tmplName = (isEn && tmpl.nameEn) ? tmpl.nameEn : tmpl.name;
    const tmplDesc = (isEn && tmpl.descriptionEn) ? tmpl.descriptionEn : tmpl.description;
    // 泳道图显示特殊图标
    const icon = (tmpl.type === 'swimlane' || tmpl.type === 'swimlane-v')
      ? (templateIconSVG.swimlane || templateIconSVG.rectangle)
      : (templateIconSVG[tmpl.nodes[0]?.shape] || templateIconSVG.rectangle);
    const favorite = favoriteIds.has(tmpl.id);
    el.innerHTML = `
      <button type="button" class="template-favorite" aria-label="Favorite ${escapeHtml(tmplName)}" aria-pressed="${favorite}" data-template-id="${escapeHtml(tmpl.id)}">${favorite ? '★' : '☆'}</button>
      <button type="button" class="template-card-apply" aria-label="Apply ${escapeHtml(tmplName)}">
        <div class="template-dialog-item-icon">${icon}</div>
        <div class="template-dialog-item-name">${escapeHtml(tmplName)}</div>
        <div class="template-dialog-item-desc">${escapeHtml(tmplDesc)}</div>
        <div class="template-item-meta"><span>${escapeHtml(tmpl.category)}</span><span>${tmpl.preview.nodeCount} nodes</span><span>${escapeHtml(tmpl.preview.layout)}</span></div>
      </button>`;
    el.querySelector('.template-card-apply').addEventListener('click', () => onTemplateDialogClick(idx));
    el.querySelector('.template-favorite').addEventListener('click', () => toggleTemplateFavorite(tmpl.id));
    grid.appendChild(el);
  });
}

function toggleTemplateFavorite(templateId) {
  templateFavorites?.toggle(templateId);
  renderTemplateCenter();
}

// 显示模板选择弹窗
function showTemplateDialog() {
  renderTemplateCenter();
  document.getElementById('templateOverlay').classList.add('visible');
}

// 隐藏模板选择弹窗
function hideTemplateDialog() {
  document.getElementById('templateOverlay').classList.remove('visible');
}

let pendingTemplateIndex = null;

// 点击弹窗中的模板项
function onTemplateDialogClick(index) {
  hideTemplateDialog();
  if (state.nodes.length > 0) {
    pendingTemplateIndex = index;
    showConfirm('应用模板', '当前画布内容将被替换，是否继续？', () => {
      applyTemplate(pendingTemplateIndex);
      pendingTemplateIndex = null;
    });
  } else {
    applyTemplate(index);
  }
}

// 应用模板
function applyTemplate(index) {
  const tmpl = allTemplates[index];
  if (!tmpl) return;

  saveState();

  // 清空画布
  state.nodes = [];
  state.connections = [];
  state.selectedNodeId = null;
  state.selectedConnectionId = null;
  canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
  // 清除旧泳道
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());

  // 创建节点
  const nodeRefs = [];
  tmpl.nodes.forEach((n, i) => {
    const defaults = shapeDefaults[n.shape] || { w: 140, h: 60 };
    const hasX = Number.isFinite(Number(n.x));
    const hasY = Number.isFinite(Number(n.y));
    const node = createNode(n.shape, hasX ? Number(n.x) : 0, hasY ? Number(n.y) : 0, n.label);
    node.w = n.w || defaults.w;
    node.h = n.h || defaults.h;
    node.detail = n.detail || '';
    node.duration = Number.isFinite(Number(n.duration)) ? Number(n.duration) : 0;
    node.role = n.role || '';
    node.fillColor = n.fillColor || node.fillColor;
    node.strokeColor = n.strokeColor || node.strokeColor;
    node.textColor = n.textColor || 'auto';
    // 保存泳道信息
    if ((tmpl.type === 'swimlane' || tmpl.type === 'swimlane-v') && n.lane !== undefined) {
      node.lane = Math.max(0, parseInt(n.lane, 10) || 0);
    }
    state.nodes.push(node);
    nodeRefs.push(node);
  });

  // 创建连线
  tmpl.connections.forEach(c => {
    const fromNode = nodeRefs[c.fromIndex];
    const toNode = nodeRefs[c.toIndex];
    if (!fromNode || !toNode) return;
    state.connections.push({
      id: 'conn_' + state.nextId++,
      from: fromNode.id,
      fromPort: normalizePortName(c.fromPort, 'bottom'),
      to: toNode.id,
      toPort: normalizePortName(c.toPort, 'top'),
      label: c.label || '',
      labelPos: c.labelPos,
    });
  });

  const hasExplicitLayout = tmpl.preserveLayout === true ||
    tmpl.nodes.some(n => Number.isFinite(Number(n.x)) || Number.isFinite(Number(n.y)));

  // 自动布局：只有模板没有明确坐标时才接管位置。
  if (!hasExplicitLayout && (tmpl.type === 'swimlane' || tmpl.type === 'swimlane-v') && tmpl.swimlanes) {
    autoLayoutSwimlane(tmpl.swimlanes, tmpl.type === 'swimlane-v' ? 'vertical' : 'horizontal');
  } else if (!hasExplicitLayout) {
    runAutoLayout(tmpl.layout || 'vertical', 'normal');
  } else if ((tmpl.type === 'swimlane' || tmpl.type === 'swimlane-v') && tmpl.swimlanes) {
    renderSwimlanes(tmpl.swimlanes, tmpl.laneSpacing || 220, tmpl.startY || 50, tmpl.startX || 80, 60, 1, tmpl.type === 'swimlane-v' ? 'vertical' : 'horizontal');
  }

  renderAll();
  showToast(`已应用模板「${tmpl.name}」`);
}

// ===== 确认对话框 =====
function showConfirm(title, msg, onOk, onCancel, options = {}) {
  const overlay = document.getElementById('confirmOverlay');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  overlay.classList.add('visible');

  const okBtn = document.getElementById('confirmOk');
  const cancelBtn = document.getElementById('confirmCancel');
  const altBtn = document.getElementById('confirmAlt');
  okBtn.textContent = options.okText || '确认';
  cancelBtn.textContent = options.cancelText || '取消';
  if (altBtn) {
    altBtn.textContent = options.altText || '';
    altBtn.style.display = options.altText ? '' : 'none';
  }

  const cleanup = () => {
    overlay.classList.remove('visible');
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    if (altBtn) {
      altBtn.onclick = null;
      altBtn.style.display = 'none';
    }
    okBtn.textContent = '确认';
    cancelBtn.textContent = '取消';
  };

  const runAction = (fn) => {
    if (!fn) return;
    Promise.resolve(fn()).catch(err => {
      if (err?.name !== 'AbortError') showToast('操作失败：' + (err?.message || err));
    });
  };

  okBtn.onclick = () => { cleanup(); runAction(onOk); };
  cancelBtn.onclick = () => { cleanup(); runAction(onCancel); };
  if (altBtn && options.altText) {
    altBtn.onclick = () => { cleanup(); runAction(options.onAlt); };
  }
}

function hideConfirm() {
  const overlay = document.getElementById('confirmOverlay');
  overlay.classList.remove('visible');
  const okBtn = document.getElementById('confirmOk');
  const cancelBtn = document.getElementById('confirmCancel');
  const altBtn = document.getElementById('confirmAlt');
  okBtn.onclick = null;
  cancelBtn.onclick = null;
  if (altBtn) {
    altBtn.onclick = null;
    altBtn.style.display = 'none';
  }
  okBtn.textContent = '确认';
  cancelBtn.textContent = '取消';
}

// ===== 自动布局弹窗 =====
let layoutDensity = 'normal';
let layoutEngine = 'dagre';

function setLayoutDensity(density) {
  layoutDensity = density;
  document.querySelectorAll('#layoutDensity .layout-density-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.density === density);
  });
}

function setLayoutEngine(engine) {
  layoutEngine = engine;
  document.querySelectorAll('#layoutEngine .layout-density-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.engine === engine);
  });
  const roleRow = document.getElementById('layoutRoleRow');
  if (roleRow) roleRow.classList.toggle('visible', engine === 'role');
}

function showLayoutDialog() {
  if (state.nodes.length === 0) {
    showToast('画布为空，无法布局');
    return;
  }
  if (typeof DiagramWeave !== 'undefined') DiagramWeave.refreshRoleSelect();
  document.getElementById('layoutOverlay').classList.add('visible');
}

function hideLayoutDialog() {
  document.getElementById('layoutOverlay').classList.remove('visible');
}

function runAutoLayout(direction, density) {
  const d = density || layoutDensity;
  if (layoutEngine === 'spine' && typeof DiagramWeave !== 'undefined') {
    DiagramWeave.autoLayoutSpine(direction, d);
  } else if (layoutEngine === 'role' && typeof DiagramWeave !== 'undefined') {
    const role = document.getElementById('layoutAnchorRole')?.value;
    DiagramWeave.autoLayoutRoleCentric(direction, d, role);
  } else if (layoutEngine === 'dagre' && typeof dagre !== 'undefined') {
    autoLayoutDagre(direction, d);
  } else {
    autoLayoutNodes(direction, d);
  }
}

function applyAutoLayout(direction) {
  hideLayoutDialog();
  saveState();
  runAutoLayout(direction, layoutDensity);
  autoAdjustPorts();
  renderAll();
  const labels = { dagre: 'Sugiyama 布局完成', spine: '主路径布局完成', role: '角色轴布局完成', builtin: '自动布局完成' };
  showToast(labels[layoutEngine] || '布局完成');
}

// ===== Dagre Sugiyama 布局（Visio 同级分层算法）=====
function autoLayoutDagre(direction, density) {
  if (state.nodes.length === 0 || typeof dagre === 'undefined') {
    autoLayoutNodes(direction, density);
    return;
  }

  const densityConfig = {
    compact: { levelGap: 70, nodeGap: 35, padding: 50 },
    normal:  { levelGap: 90, nodeGap: 50, padding: 70 },
    loose:   { levelGap: 120, nodeGap: 70, padding: 90 },
  };
  const cfg = densityConfig[density] || densityConfig.normal;

  const g = new dagre.graphlib.Graph({ multigraph: true, compound: false });
  g.setGraph({
    rankdir: direction === 'horizontal' ? 'LR' : 'TB',
    nodesep: cfg.nodeGap,
    ranksep: cfg.levelGap,
    marginx: cfg.padding,
    marginy: cfg.padding,
    ranker: 'network-simplex',
  });
  g.setDefaultEdgeLabel(() => ({}));

  state.nodes.forEach(n => {
    g.setNode(n.id, { width: n.w + 10, height: n.h + 10 });
  });

  state.connections.forEach((c, i) => {
    g.setEdge({ v: c.from, w: c.to, name: 'e' + i });
  });

  dagre.layout(g);

  state.nodes.forEach(n => {
    const pos = g.node(n.id);
    if (pos) {
      n.x = Math.round(pos.x - n.w / 2);
      n.y = Math.round(pos.y - n.h / 2);
    }
  });
}

// ===== 自动布局算法（最长路径 + 重心排序 + 层内居中）=====
function autoLayoutNodes(direction, density) {
  if (state.nodes.length === 0) return;

  const densityConfig = {
    compact: { levelGap: 90, nodeGap: 40, padding: 60 },
    normal:  { levelGap: 120, nodeGap: 60, padding: 80 },
    loose:   { levelGap: 160, nodeGap: 90, padding: 100 },
  };
  const cfg = densityConfig[density] || densityConfig.normal;

  const adj = new Map();
  const revAdj = new Map();
  const inDegree = new Map();
  state.nodes.forEach(n => {
    adj.set(n.id, []);
    revAdj.set(n.id, []);
    inDegree.set(n.id, 0);
  });
  state.connections.forEach(c => {
    adj.get(c.from).push(c.to);
    revAdj.get(c.to).push(c.from);
    inDegree.set(c.to, inDegree.get(c.to) + 1);
  });

  // 最长路径分层（比 BFS 更适合 DAG 流程图）
  const levels = new Map();
  state.nodes.forEach(n => levels.set(n.id, 0));
  for (let iter = 0; iter < state.nodes.length; iter++) {
    let changed = false;
    state.connections.forEach(c => {
      const next = levels.get(c.from) + 1;
      if (next > levels.get(c.to)) {
        levels.set(c.to, next);
        changed = true;
      }
    });
    if (!changed) break;
  }

  // 无入边节点强制为第 0 层
  state.nodes.filter(n => inDegree.get(n.id) === 0).forEach(n => {
    if (levels.get(n.id) > 0) levels.set(n.id, 0);
  });

  // 孤立节点放到末尾
  let maxLevel = 0;
  levels.forEach(l => { if (l > maxLevel) maxLevel = l; });
  state.nodes.forEach(n => {
    if (!adj.get(n.id).length && !revAdj.get(n.id).length) {
      maxLevel++;
      levels.set(n.id, maxLevel);
    }
  });

  const levelGroups = new Map();
  levels.forEach((lvl, id) => {
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl).push(id);
  });

  // 重心排序：减少连线交叉
  const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b);

  function getIndex(nodeId, lvl) {
    const group = levelGroups.get(lvl);
    return group ? group.indexOf(nodeId) : 0;
  }

  for (let sweep = 0; sweep < 4; sweep++) {
    for (const lvl of sortedLevels) {
      if (lvl === 0) continue;
      const ids = levelGroups.get(lvl);
      if (!ids || ids.length <= 1) continue;
      const prevLvl = lvl - 1;
      ids.sort((a, b) => {
        const bary = (nodeId) => {
          const preds = revAdj.get(nodeId) || [];
          if (!preds.length) return getIndex(nodeId, lvl);
          const sum = preds.reduce((s, p) => s + getIndex(p, prevLvl), 0);
          return sum / preds.length;
        };
        return bary(a) - bary(b);
      });
    }
    for (let i = sortedLevels.length - 2; i >= 0; i--) {
      const lvl = sortedLevels[i];
      const ids = levelGroups.get(lvl);
      if (!ids || ids.length <= 1) continue;
      const nextLvl = lvl + 1;
      ids.sort((a, b) => {
        const bary = (nodeId) => {
          const succs = adj.get(nodeId) || [];
          if (!succs.length) return getIndex(nodeId, lvl);
          const sum = succs.reduce((s, p) => s + getIndex(p, nextLvl), 0);
          return sum / succs.length;
        };
        return bary(a) - bary(b);
      });
    }
  }

  // 回环节点标记
  const loopNodes = new Set();
  state.connections.forEach(c => {
    if (levels.get(c.from) >= levels.get(c.to)) {
      loopNodes.add(c.from);
      loopNodes.add(c.to);
    }
  });

  const isVertical = direction !== 'horizontal';
  const startX = cfg.padding;
  const startY = cfg.padding;

  sortedLevels.forEach(lvl => {
    const nodeIds = levelGroups.get(lvl);
    if (!nodeIds || !nodeIds.length) return;

    if (isVertical) {
      let totalWidth = 0;
      const sizes = nodeIds.map(id => {
        const node = state.nodes.find(n => n.id === id);
        return node ? node.w : 140;
      });
      totalWidth = sizes.reduce((s, w, i) => s + w + (i > 0 ? cfg.nodeGap : 0), 0);
      let cursorX = startX - totalWidth / 2 + sizes[0] / 2;
      const baseY = startY + lvl * cfg.levelGap;

      nodeIds.forEach((id, i) => {
        const node = state.nodes.find(n => n.id === id);
        if (!node) return;
        let x = cursorX - node.w / 2;
        let y = baseY;
        if (loopNodes.has(id)) x += cfg.nodeGap * 0.8;
        node.x = Math.round(x);
        node.y = Math.round(y);
        if (i < nodeIds.length - 1) {
          cursorX += sizes[i] / 2 + cfg.nodeGap + sizes[i + 1] / 2;
        }
      });
    } else {
      let totalHeight = 0;
      const sizes = nodeIds.map(id => {
        const node = state.nodes.find(n => n.id === id);
        return node ? node.h : 60;
      });
      totalHeight = sizes.reduce((s, h, i) => s + h + (i > 0 ? cfg.nodeGap : 0), 0);
      let cursorY = startY - totalHeight / 2 + sizes[0] / 2;
      const baseX = startX + lvl * cfg.levelGap;

      nodeIds.forEach((id, i) => {
        const node = state.nodes.find(n => n.id === id);
        if (!node) return;
        let x = baseX;
        let y = cursorY - node.h / 2;
        if (loopNodes.has(id)) y += cfg.nodeGap * 0.8;
        node.x = Math.round(x);
        node.y = Math.round(y);
        if (i < nodeIds.length - 1) {
          cursorY += sizes[i] / 2 + cfg.nodeGap + sizes[i + 1] / 2;
        }
      });
    }
  });

  // 整体平移到正坐标区域
  let minX = Infinity, minY = Infinity;
  state.nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
  });
  if (isFinite(minX) && minX < cfg.padding) {
    const dx = cfg.padding - minX;
    const dy = cfg.padding - minY;
    state.nodes.forEach(n => { n.x += dx; n.y += dy; });
  }
}

// 泳道图自动布局
function autoLayoutSwimlane(swimlanes, direction) {
  if (state.nodes.length === 0) return;
  direction = direction || 'horizontal'; // 'horizontal' = 横向泳道, 'vertical' = 纵向泳道

  const laneCount = swimlanes.length;
  const startX = 80;
  const startY = 50;
  const laneLabelWidth = 60;

  // 按泳道分组
  const laneNodes = [];
  for (let i = 0; i < laneCount; i++) {
    laneNodes.push(state.nodes.filter(n => n.lane === i));
  }

  let maxNodesInLane = 0;
  laneNodes.forEach(nodes => {
    maxNodesInLane = Math.max(maxNodesInLane, nodes.length);
  });

  // BFS计算全局层级
  const adj = new Map();
  const inDegree = new Map();
  state.nodes.forEach(n => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });
  state.connections.forEach(c => {
    if (hasGraphPath(adj, c.to, c.from)) return;
    adj.get(c.from).push(c.to);
    inDegree.set(c.to, inDegree.get(c.to) + 1);
  });

  const levels = new Map();
  const queue = [];
  state.nodes.filter(n => inDegree.get(n.id) === 0).forEach(n => {
    levels.set(n.id, 0);
    queue.push(n.id);
  });
  while (queue.length > 0) {
    const curId = queue.shift();
    const curLevel = levels.get(curId);
    for (const nextId of adj.get(curId)) {
      const nextLevel = levels.has(nextId) ? levels.get(nextId) : -1;
      if (nextLevel < curLevel + 1) {
        levels.set(nextId, curLevel + 1);
        queue.push(nextId);
      }
    }
  }

  // 按层级和泳道分组
  const laneNodePositions = new Map();
  for (let i = 0; i < laneCount; i++) {
    laneNodePositions.set(i, new Map());
  }
  state.nodes.forEach(n => {
    const lvl = levels.get(n.id) || 0;
    const lane = n.lane || 0;
    if (!laneNodePositions.get(lane).has(lvl)) {
      laneNodePositions.get(lane).set(lvl, []);
    }
    laneNodePositions.get(lane).get(lvl).push(n);
  });

  if (direction === 'vertical') {
    // 纵向泳道：泳道纵向排列，节点横向排列
    const laneSpacingY = 120;
    const levelSpacingX = 220;

    state.nodes.forEach(n => {
      const lvl = levels.get(n.id) || 0;
      const lane = n.lane || 0;
      const nodesAtSameLevel = laneNodePositions.get(lane).get(lvl) || [n];
      const indexInLevel = nodesAtSameLevel.indexOf(n);

      n.x = startX + lvl * levelSpacingX;
      n.y = startY + lane * laneSpacingY + indexInLevel * 20;
    });

    renderSwimlanes(swimlanes, laneSpacingY, startY, startX, laneLabelWidth, maxNodesInLane, 'vertical');
  } else {
    // 横向泳道（默认）：泳道横向排列，节点纵向排列
    const laneSpacingX = 220;
    const levelSpacingY = 120;

    state.nodes.forEach(n => {
      const lvl = levels.get(n.id) || 0;
      const lane = n.lane || 0;
      const nodesAtSameLevel = laneNodePositions.get(lane).get(lvl) || [n];
      const indexInLevel = nodesAtSameLevel.indexOf(n);

      n.x = startX + lane * laneSpacingX + indexInLevel * 20;
      n.y = startY + lvl * levelSpacingY;
    });

    renderSwimlanes(swimlanes, laneSpacingX, startY, startX, laneLabelWidth, maxNodesInLane, 'horizontal');
  }
}

// 渲染泳道背景和标签
function renderSwimlanes(swimlanes, laneSpacing, startY, startX, laneLabelWidth, maxNodesInLane, direction) {
  direction = direction || 'horizontal';
  // 清除旧泳道
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());

  const totalSize = swimlanes.length * laneSpacing + 40;
  const crossSize = 1200;

  swimlanes.forEach((name, i) => {
    const bg = document.createElement('div');
    bg.className = 'swimlane-bg';
    const label = document.createElement('div');
    label.className = 'swimlane-label';
    label.textContent = name;

    if (direction === 'vertical') {
      // 纵向泳道：泳道水平排列
      const y = startY + i * laneSpacing - 30;
      bg.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${y}px;
        width: ${crossSize}px;
        height: ${laneSpacing}px;
        background: ${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'};
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        pointer-events: none;
        z-index: 0;
      `;
      label.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${y}px;
        width: ${laneLabelWidth - 10}px;
        height: ${laneSpacing}px;
        display: flex;
        align-items: center;
        justify-content: center;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 500;
        border-right: 2px solid var(--border);
        pointer-events: none;
        z-index: 1;
        letter-spacing: 2px;
      `;
    } else {
      // 横向泳道：泳道垂直排列
      const x = startX + i * laneSpacing - 30;
      bg.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${startY}px;
        width: ${laneSpacing}px;
        height: ${crossSize}px;
        background: ${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'};
        border-left: 1px solid var(--border);
        border-right: 1px solid var(--border);
        pointer-events: none;
        z-index: 0;
      `;
      label.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${startY}px;
        width: ${laneSpacing}px;
        height: ${laneLabelWidth - 10}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 500;
        border-bottom: 2px solid var(--border);
        pointer-events: none;
        z-index: 1;
        letter-spacing: 2px;
      `;
    }

    canvasTransform.appendChild(bg);
    canvasTransform.appendChild(label);
  });
}

// 自动调整连线端口
function computeConnPorts(fromNode, toNode) {
  const dx = (toNode.x + toNode.w / 2) - (fromNode.x + fromNode.w / 2);
  const dy = (toNode.y + toNode.h / 2) - (fromNode.y + fromNode.h / 2);
  const isLoopBack = (toNode.y + toNode.h / 2) < (fromNode.y + fromNode.h / 2) - 10 ||
    (toNode.x + toNode.w / 2) < (fromNode.x + fromNode.w / 2) - 10;

  if (isLoopBack) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return { fromPort: dx > 0 ? 'right' : 'left', toPort: dx > 0 ? 'left' : 'right' };
    }
    return { fromPort: dy > 0 ? 'bottom' : 'top', toPort: dy > 0 ? 'top' : 'bottom' };
  }
  if (Math.abs(dx) > Math.abs(dy) * 1.5) {
    return { fromPort: dx > 0 ? 'right' : 'left', toPort: dx > 0 ? 'left' : 'right' };
  }
  return { fromPort: dy > 0 ? 'bottom' : 'top', toPort: dy > 0 ? 'top' : 'bottom' };
}

function adjustSingleConnPorts(conn) {
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return;
  const ports = computeConnPorts(fromNode, toNode);
  conn.fromPort = ports.fromPort;
  conn.toPort = ports.toPort;
}

function isDuplicateConnection(from, to, fromPort, toPort, excludeId = null) {
  return state.connections.some(c =>
    c.id !== excludeId &&
    c.from === from &&
    c.to === to &&
    c.fromPort === fromPort &&
    c.toPort === toPort
  );
}

function autoAdjustPorts() {
  state.connections.forEach(conn => adjustSingleConnPorts(conn));
}

// ===== 工具切换 =====
function setTool(tool) {
  state.tool = tool;
  document.getElementById('btn-select').classList.toggle('active', tool === 'select');
  document.getElementById('btn-connect').classList.toggle('active', tool === 'connect');
  document.getElementById('btn-pan')?.classList.toggle('active', tool === 'pan');
  canvas.style.cursor = tool === 'connect' ? 'crosshair' : tool === 'pan' ? 'grab' : 'default';
  canvasWrapper.style.cursor = tool === 'connect' ? 'crosshair' : tool === 'pan' ? 'grab' : 'default';
  // 连线模式下显示所有端口
  document.body.classList.toggle('connect-mode', tool === 'connect');
  document.body.classList.toggle('pan-mode', tool === 'pan');
}

// ===== 缩放 =====
function zoomIn() { setZoom(state.zoom + 0.1); }
function zoomOut() { setZoom(state.zoom - 0.1); }
function zoomReset() { setZoom(1); state.panX = 0; state.panY = 0; updateTransform(); }

function setZoom(z) {
  state.zoom = Math.max(0.2, Math.min(3, z));
  document.getElementById('zoom-level').textContent = Math.round(state.zoom * 100) + '%';
  updateTransform();
}

function updateTransform() {
  canvasTransform.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  if (state.nodes.length > 0) {
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
  if (presentState.active) updatePresentZoomPreviewLayout();
}

// ===== 保存状态（撤销/重做）=====
function clearCanvasNodes() {
  canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());
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
  };
}

function applyUndoSnapshot(snap) {
  if (!snap) return;
  state.selectedNodeId = null;
  state.selectedConnectionId = null;

  if (snap.version === 2 && snap.pages && typeof DiagramWeave !== 'undefined') {
    DiagramWeave.loadDocument(snap);
    applyConnRouteModeFromData(snap.connRouteMode);
    if (typeof DiagramWeaveRoutingRules !== 'undefined') state.routingRules = DiagramWeaveRoutingRules.normalizeRules(snap.routingRules);
    clearCanvasNodes();
    renderAll();
    return;
  }

  if (Array.isArray(snap.nodes) && Array.isArray(snap.connections)) {
    state.nodes = snap.nodes;
    state.connections = snap.connections;
    state.nextId = snap.nextId || 1;
    if (typeof DiagramWeave !== 'undefined') {
      const page = DiagramWeave.getCurrentPage();
      if (page) {
        page.nodes = state.nodes;
        page.connections = state.connections;
      }
    }
    applyConnRouteModeFromData(snap.connRouteMode);
    ensureNodeRefIds();
    clearCanvasNodes();
    renderAll();
  }
}

function saveState() {
  void captureVersionSnapshot('Edit');
  state.undoStack.push(JSON.stringify(captureUndoSnapshot()));
  if (state.undoStack.length > 50) state.undoStack.shift();
  state.redoStack = [];
  if (!projectSession.fileHandle && !sessionStorage.getItem('dw-initial-save-prompted')) {
    setTimeout(promptInitialProjectSave, 0);
  }
}

function undo() {
  if (state.undoStack.length === 0) return;
  state.redoStack.push(JSON.stringify(captureUndoSnapshot()));
  const prev = JSON.parse(state.undoStack.pop());
  applyUndoSnapshot(prev);
  showToast(typeof t === 'function' ? t('toast.undo') : '已撤销');
}

function redo() {
  if (state.redoStack.length === 0) return;
  state.undoStack.push(JSON.stringify(captureUndoSnapshot()));
  const next = JSON.parse(state.redoStack.pop());
  applyUndoSnapshot(next);
  showToast(typeof t === 'function' ? t('toast.redo') : '已重做');
}

// ===== 创建节点 =====
function createNode(shape, x, y, label, refId) {
  const defaults = shapeDefaults[shape] || { w: 140, h: 60 };
  const node = {
    id: 'node_' + state.nextId++,
    refId: refId !== undefined ? refId : getNextRefId(),
    shape,
    x,
    y,
    w: defaults.w,
    h: defaults.h,
    label: label || shapeNames[shape] || shape,
    fillColor: getDefaultNodeFill(),
    strokeColor: getDefaultNodeStroke(),
    textColor: 'auto',
    detail: '',
    duration: 0,
    role: '',
    layer: 0,
    targetPageId: null,
  };
  if (typeof DiagramWeave !== 'undefined') DiagramWeave.assignNewNodeLayer(node);
  return node;
}

function getNextRefId() {
  let max = 0;
  state.nodes.forEach(n => {
    const r = parseInt(n.refId, 10);
    if (!isNaN(r) && r > max) max = r;
  });
  return max + 1;
}

function ensureNodeRefIds() {
  const used = new Set();
  const needsId = [];

  state.nodes.forEach(n => {
    const r = parseInt(n.refId, 10);
    if (!isNaN(r) && r > 0 && !used.has(r)) {
      n.refId = r;
      used.add(r);
    } else {
      needsId.push(n);
    }
  });

  needsId.forEach(n => {
    let next = 1;
    while (used.has(next)) next++;
    n.refId = next;
    used.add(next);
  });
}

function formatNodeOutgoingConnections(node) {
  if (!node) return '';
  ensureNodeRefIds();
  const outs = state.connections.filter(c => c.from === node.id);
  if (!outs.length) return '';
  return outs.map(c => {
    const toNode = state.nodes.find(n => n.id === c.to);
    if (!toNode) return '';
    const tag = c.label ? `（${c.label}）` : '';
    return `${toNode.refId}.${toNode.label || '未命名'}${tag}`;
  }).filter(Boolean).join('；');
}

// ===== 渲染节点 =====
function renderNode(node) {
  let el = document.getElementById(node.id);
  const isNew = !el;

  if (isNew) {
    el = document.createElement('div');
    el.id = node.id;
    el.className = `node shape-${getNodeVisualShape(node.shape)}`;
    el.innerHTML = `
      <div class="node-shape">
        <span class="node-label">${escapeHtml(node.label)}</span>
      </div>
      <div class="node-brief" style="display:none;"></div>
      <div class="port port-top" data-port="top"></div>
      <div class="port port-bottom" data-port="bottom"></div>
      <div class="port port-left" data-port="left"></div>
      <div class="port port-right" data-port="right"></div>
    `;
    canvasTransform.appendChild(el);
    setupNodeEvents(el, node);
  }

  el.style.left = node.x + 'px';
  el.style.top = node.y + 'px';
  el.style.width = node.w + 'px';
  el.style.height = node.h + 'px';

  if (!isNew) {
    el.className = `node shape-${getNodeVisualShape(node.shape)}` + (getSelectedNodeIds().includes(node.id) ? ' selected' : '');
  }

  const shapeEl = el.querySelector('.node-shape');
  shapeEl.style.background = node.fillColor;
  applyNodeStrokeColor(shapeEl, node.strokeColor);
  syncNodeOutlineSvg(shapeEl, node);
  syncPortElements(el, node);

  const labelEl = el.querySelector('.node-label');
  labelEl.textContent = node.label;
  const resolvedTextColor = typeof DiagramWeaveNodeColors !== 'undefined'
    ? DiagramWeaveNodeColors.resolveTextColor(node.fillColor, node.textColor)
    : 'var(--text-primary)';
  labelEl.style.color = resolvedTextColor;
  labelEl.style.textShadow = resolvedTextColor === '#111320' ? 'none' : '0 1px 1px rgba(0,0,0,0.28)';

  // 缩放时反向缩放文字，保持文字清晰度
  if (state.zoom !== 1) {
    labelEl.style.transform = `scale(${1 / state.zoom})`;
  } else {
    labelEl.style.transform = '';
  }

  updateNodeBriefEl(node, el);

  el.classList.toggle('selected', getSelectedNodeIds().includes(node.id));
}

function updateNodeBriefEl(node, el) {
  const briefEl = el?.querySelector('.node-brief');
  if (!briefEl) return;
  if (node.shape === 'offpage' && node.targetPageId) {
    briefEl.textContent = '→ ' + resolvePageName(node.targetPageId);
    briefEl.style.display = 'block';
    return;
  }
  const outgoing = formatNodeOutgoingConnections(node);
  if (outgoing) {
    briefEl.textContent = '→ ' + outgoing;
    briefEl.style.display = 'block';
  } else if (node.detail) {
    const brief = node.detail.length > 30 ? node.detail.substring(0, 30) + '...' : node.detail;
    briefEl.textContent = brief;
    briefEl.style.display = 'block';
  } else {
    briefEl.style.display = 'none';
  }
}

function refreshAllNodeBriefs() {
  state.nodes.forEach(n => {
    const el = document.getElementById(n.id);
    if (el) updateNodeBriefEl(n, el);
  });
}

function renderAllNodes() {
  const existingEls = canvasTransform.querySelectorAll('.node');
  existingEls.forEach(el => {
    if (!state.nodes.find(n => n.id === el.id)) el.remove();
  });
  state.nodes.forEach(n => {
    if (typeof DiagramWeave !== 'undefined') {
      if (n.layer === undefined) n.layer = 0;
      if (!DiagramWeave.doc.pages.length) return;
      const page = DiagramWeave.getCurrentPage();
      const layer = page.layers.find(l => l.id === n.layer);
      if (layer && !layer.visible) {
        const el = document.getElementById(n.id);
        if (el) el.remove();
        return;
      }
    }
    renderNode(n);
  });
  updateCanvasEmptyState();
}

let activePropertyTab = 'content';

function initPropertyEditingWorkflow() {
  const sectionFor = id => {
    if (['propLabel', 'propDetail'].includes(id)) return 'content';
    if (['propRole', 'propTypeSelect', 'propDuration', 'propOffpageRow'].includes(id)) return 'flow';
    if (['propFillSwatches', 'propStrokeSwatches', 'propTextColorMode'].includes(id)) return 'appearance';
    return 'data';
  };
  document.querySelectorAll('#propsContent .prop-row').forEach(row => {
    row.dataset.propertySection = sectionFor(row.id || row.querySelector('[id]')?.id || '');
  });
  document.getElementById('propTimeSummary')?.setAttribute('data-property-section', 'flow');
  document.querySelectorAll('#propsContent > .prop-group').forEach(group => {
    if (group.querySelector('#propFillSwatches')) group.dataset.propertySection = 'appearance';
  });
  setPropertyTab('content');
}

function setPropertyTab(tab) {
  activePropertyTab = ['content', 'flow', 'appearance', 'data'].includes(tab) ? tab : 'content';
  document.querySelectorAll('[data-property-tab]').forEach(button =>
    button.setAttribute('aria-selected', String(button.dataset.propertyTab === activePropertyTab)));
  document.querySelectorAll('#propsContent .prop-row').forEach(row => {
    row.hidden = row.dataset.propertySection !== activePropertyTab;
  });
  document.querySelectorAll('#propsContent > .prop-group').forEach(group => {
    group.hidden = group.dataset.propertySection
      ? group.dataset.propertySection !== activePropertyTab
      : !group.querySelector(`.prop-row[data-property-section="${activePropertyTab}"]`);
  });
  const stats = document.getElementById('propTimeSummary');
  if (stats) stats.hidden = activePropertyTab !== 'flow';
}

function getSelectedNodes() {
  const selected = new Set(getSelectedNodeIds());
  return state.nodes.filter(node => selected.has(node.id));
}

function applyBatchNodeProperty(field, value) {
  const nodes = getSelectedNodes();
  if (!nodes.length || typeof DiagramWeavePropertyTools === 'undefined') return false;
  const patches = DiagramWeavePropertyTools.createBatchPatches(nodes, field, value);
  if (!patches.length) return false;
  saveState();
  const byId = new Map(patches.map(patch => [patch.id, patch]));
  nodes.forEach(node => Object.assign(node, byId.get(node.id) || {}));
  renderAll();
  nodes.forEach(syncFlowTableRowFromNode);
  return true;
}

function syncMixedPropertyControl(id, nodes, field, fallback = '') {
  const control = document.getElementById(id);
  if (!control || typeof DiagramWeavePropertyTools === 'undefined') return;
  const result = DiagramWeavePropertyTools.mixedValue(nodes, field, fallback);
  control.dataset.mixed = String(result.mixed);
  if (control.tagName === 'SELECT' && result.mixed) {
    let option = control.querySelector('option[value="__mixed__"]');
    if (!option) { option = new Option('Mixed', '__mixed__'); control.prepend(option); }
    control.value = '__mixed__';
  } else if (control.tagName === 'SELECT') {
    control.querySelector('option[value="__mixed__"]')?.remove();
    control.value = String(result.value);
  } else {
    control.value = result.mixed ? '' : String(result.value);
    if (result.mixed) control.placeholder = 'Mixed';
  }
}

function renderNodeContextToolbar() {
  const toolbar = document.getElementById('nodeContextToolbar');
  const nodeElement = state.selectedNodeId ? document.getElementById(state.selectedNodeId) : null;
  if (!toolbar || !nodeElement || presentState.active) { if (toolbar) toolbar.hidden = true; return; }
  const wrapperRect = canvasWrapper.getBoundingClientRect();
  const nodeRect = nodeElement.getBoundingClientRect();
  toolbar.hidden = false;
  toolbar.style.left = `${Math.max(8, nodeRect.left - wrapperRect.left)}px`;
  toolbar.style.top = `${Math.max(8, nodeRect.top - wrapperRect.top - 40)}px`;
}

// ===== 渲染连线 =====

const PORT_DIR = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function getPortDirection(port) {
  return PORT_DIR[port] || PORT_DIR.bottom;
}

function normalizePortName(port, fallback = 'bottom') {
  const val = String(port || '').trim().toLowerCase();
  return PORT_DIR[val] ? val : fallback;
}

function getNodeVisualShape(shape) {
  return shapeRenderAs[shape] || shape;
}

function initConnRouteAlgorithms() {
  CONN_ROUTE_ALGORITHMS.bezier = (from, to, fromPort, toPort) =>
    getConnectionPathBezier(from, to, fromPort, toPort);
  CONN_ROUTE_ALGORITHMS.orthogonal = (from, to, fromPort, toPort) =>
    getConnectionPathOrthogonal(from, to, fromPort, toPort);
  CONN_ROUTE_ALGORITHMS.avoidance = (from, to, fromPort, toPort, routeOpts) =>
    getConnectionPathAvoidance(from, to, fromPort, toPort, routeOpts);
  CONN_ROUTE_ALGORITHMS.straight = (from, to) =>
    `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  CONN_ROUTE_ALGORITHMS.visio = (from, to, fromPort, toPort, routeOpts) =>
    getConnectionPathVisio(from, to, fromPort, toPort, routeOpts);
  if (typeof DiagramWeaveContent !== 'undefined') {
    DiagramWeaveContent.attachConnAlgorithms(CONN_ROUTE_ALGORITHMS);
  }
}

function registerConnRouteMode(id, label, algorithmId) {
  if (!id || !label) return;
  CONN_ROUTE_LABELS[id] = label;
  const algo = algorithmId || id;
  if (CONN_ROUTE_ALGORITHMS[algo] && !CONN_ROUTE_ALGORITHMS[id]) {
    CONN_ROUTE_ALGORITHMS[id] = CONN_ROUTE_ALGORITHMS[algo];
  }
  if (typeof DiagramWeaveSanitize !== 'undefined' && typeof DiagramWeaveSanitize.registerConnMode === 'function') {
    DiagramWeaveSanitize.registerConnMode(id);
  }
  rebuildConnRouteSelect();
}

function rebuildConnRouteSelect() {
  refreshConnRouteLabelsFromI18n();
  const sel = document.getElementById('connRouteMode');
  if (!sel) return;
  const cur = state.connRouteMode || 'bezier';
  sel.innerHTML = Object.entries(CONN_ROUTE_LABELS).map(([k, v]) =>
    `<option value="${escapeHtml(k)}">${escapeHtml(v)}</option>`).join('');
  if (CONN_ROUTE_LABELS[cur]) sel.value = cur;
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

function pointInNodeRect(px, py, node, pad) {
  return px > node.x - pad && px < node.x + node.w + pad &&
    py > node.y - pad && py < node.y + node.h + pad;
}

const ROUTING_NODE_PAD = 28;
const ROUTING_LINE_PAD = 12;

function sampleCubicBezier(p0, p1, p2, p3, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

function isPointNear(pt1, pt2, tolerance) {
  return Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y) <= tolerance;
}

function buildLineAvoidRect(seg, padding) {
  if (!seg?.from || !seg?.to || !Number.isFinite(padding) || padding <= 0) return null;
  return {
    x1: Math.min(seg.from.x, seg.to.x) - padding,
    y1: Math.min(seg.from.y, seg.to.y) - padding,
    x2: Math.max(seg.from.x, seg.to.x) + padding,
    y2: Math.max(seg.from.y, seg.to.y) + padding,
    sourceType: 'line',
  };
}

function getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts = {}, nodePad = ROUTING_NODE_PAD) {
  const avoidSegments = routeOpts?.avoidSegments || [];
  const rects = getRoutingObstacleRects(fromNodeId, toNodeId, nodePad);
  avoidSegments.forEach(seg => {
    const box = buildLineAvoidRect(seg, ROUTING_LINE_PAD);
    if (box) rects.push(box);
  });
  return rects;
}

function segmentIntersectsAvoidSegments(a, b, avoidSegments, start, end, tolerance = 10) {
  if (!avoidSegments || avoidSegments.length === 0) return false;
  for (const seg of avoidSegments) {
    const c = seg.from;
    const d = seg.to;
    const hit = getSegmentIntersection(a, b, c, d, { trim: 0.0001 });
    const overlap = hit ? null : getCollinearOverlapBridgePoint(a, b, c, d);
    if (!hit && !overlap) continue;
    const point = hit || overlap;
    if (isPointNear(point, start, tolerance) || isPointNear(point, end, tolerance)) continue;
    return true;
  }
  return false;
}

function countPathObstacleHits(points, fromNodeId, toNodeId, pad, routeOpts = {}) {
  const safePad = Number.isFinite(pad) ? pad : ROUTING_NODE_PAD;
  const rects = getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts, safePad);
  const avoidSegments = routeOpts?.avoidSegments || [];
  let hits = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (const rect of rects) {
      if (segmentIntersectsRect(a, b, rect)) hits++;
    }
    if (segmentIntersectsAvoidSegments(a, b, avoidSegments, points[0], points[points.length - 1])) hits++;
  }
  return hits;
}

function getRoutingObstacleRects(fromNodeId, toNodeId, pad = 18) {
  return state.nodes
    .filter(node => node.id !== fromNodeId && node.id !== toNodeId)
    .map(node => ({
      id: node.id,
      x1: node.x - pad,
      y1: node.y - pad,
      x2: node.x + node.w + pad,
      y2: node.y + node.h + pad,
    }));
}

function pointInRect(pt, rect) {
  return pt.x > rect.x1 && pt.x < rect.x2 && pt.y > rect.y1 && pt.y < rect.y2;
}

function segmentIntersectsRect(a, b, rect) {
  const inA = a.x > rect.x1 && a.x < rect.x2 && a.y > rect.y1 && a.y < rect.y2;
  const inB = b.x > rect.x1 && b.x < rect.x2 && b.y > rect.y1 && b.y < rect.y2;
  if (inA || inB) return true;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (maxX < rect.x1 || minX > rect.x2 || maxY < rect.y1 || minY > rect.y2) return false;

  if (Math.abs(a.x - b.x) < 0.001) {
    return a.x >= rect.x1 && a.x <= rect.x2 && maxY >= rect.y1 && minY <= rect.y2;
  }
  if (Math.abs(a.y - b.y) < 0.001) {
    return a.y >= rect.y1 && a.y <= rect.y2 && maxX >= rect.x1 && minX <= rect.x2;
  }

  const edges = [
    [{ x: rect.x1, y: rect.y1 }, { x: rect.x2, y: rect.y1 }],
    [{ x: rect.x2, y: rect.y1 }, { x: rect.x2, y: rect.y2 }],
    [{ x: rect.x2, y: rect.y2 }, { x: rect.x1, y: rect.y2 }],
    [{ x: rect.x1, y: rect.y2 }, { x: rect.x1, y: rect.y1 }],
  ];
  return edges.some(edge => getSegmentIntersection(a, b, edge[0], edge[1]));
}

function scorePolylineRoute(points, fromNodeId, toNodeId, routeOpts = {}) {
  const rects = getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts, ROUTING_NODE_PAD);
  const avoidSegments = routeOpts.avoidSegments || [];
  let hits = 0;
  let length = 0;
  let bends = Math.max(0, points.length - 2);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    length += Math.hypot(b.x - a.x, b.y - a.y);
    rects.forEach(rect => {
      if (segmentIntersectsRect(a, b, rect)) hits++;
    });
    if (segmentIntersectsAvoidSegments(a, b, avoidSegments, points[0], points[points.length - 1])) hits++;
  }
  return hits * 100000 + bends * 250 + length;
}

function simplifyPolyline(points) {
  const simplified = [];
  points.forEach(pt => {
    const prev = simplified[simplified.length - 1];
    if (!prev || Math.abs(prev.x - pt.x) > 0.001 || Math.abs(prev.y - pt.y) > 0.001) {
      simplified.push({ x: pt.x, y: pt.y });
    }
  });
  for (let i = simplified.length - 2; i > 0; i--) {
    const a = simplified[i - 1];
    const b = simplified[i];
    const c = simplified[i + 1];
    const sameX = Math.abs(a.x - b.x) < 0.001 && Math.abs(b.x - c.x) < 0.001;
    const sameY = Math.abs(a.y - b.y) < 0.001 && Math.abs(b.y - c.y) < 0.001;
    if (sameX || sameY) simplified.splice(i, 1);
  }
  return simplified;
}

function polylineToPath(points) {
  const simplified = simplifyPolyline(points);
  if (!simplified.length) return '';
  return simplified
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`)
    .join(' ');
}

function getConnectionPathCandidateRoute(from, to, fromPort, toPort, routeOpts) {
  const { fromNodeId, toNodeId } = routeOpts || {};
  const avoidSegments = routeOpts?.avoidSegments || [];
  const stub = 28;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  const xs = [p1.x, p2.x, (p1.x + p2.x) / 2];
  const ys = [p1.y, p2.y, (p1.y + p2.y) / 2];

  getRoutingAvoidRects(fromNodeId, toNodeId, { avoidSegments }).forEach(rect => {
    xs.push(rect.x1 - 18, rect.x2 + 18);
    ys.push(rect.y1 - 18, rect.y2 + 18);
  });

  const candidates = [];
  xs.forEach(x => candidates.push([from, p1, { x, y: p1.y }, { x, y: p2.y }, p2, to]));
  ys.forEach(y => candidates.push([from, p1, { x: p1.x, y }, { x: p2.x, y }, p2, to]));
  candidates.push([from, p1, { x: p1.x, y: p2.y }, p2, to]);
  candidates.push([from, p1, { x: p2.x, y: p1.y }, p2, to]);

  let best = candidates[0];
  let bestScore = Infinity;
  candidates.forEach(route => {
    const points = simplifyPolyline(route);
    const score = scorePolylineRoute(points, fromNodeId, toNodeId, { avoidSegments });
    if (score < bestScore) {
      best = points;
      bestScore = score;
    }
  });
  return polylineToPath(best);
}

function uniqueSortedValues(values) {
  return [...new Set(values
    .filter(v => Number.isFinite(v))
    .map(v => Math.round(v * 1000) / 1000))]
    .sort((a, b) => a - b);
}

function makeGridPointKey(x, y) {
  return `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;
}

function getConnectionPathVisio(from, to, fromPort, toPort, routeOpts) {
  const { fromNodeId, toNodeId } = routeOpts || {};
  const avoidSegments = routeOpts?.avoidSegments || [];
  const stub = 28;
  const margin = 24;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  const obstacles = getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts);
  const minX = Math.min(from.x, to.x, ...obstacles.map(r => r.x1)) - 80;
  const maxX = Math.max(from.x, to.x, ...obstacles.map(r => r.x2)) + 80;
  const minY = Math.min(from.y, to.y, ...obstacles.map(r => r.y1)) - 80;
  const maxY = Math.max(from.y, to.y, ...obstacles.map(r => r.y2)) + 80;

  const xValues = [minX, maxX, from.x, to.x, p1.x, p2.x, (p1.x + p2.x) / 2];
  const yValues = [minY, maxY, from.y, to.y, p1.y, p2.y, (p1.y + p2.y) / 2];
  obstacles.forEach(rect => {
    xValues.push(rect.x1 - margin, rect.x1, rect.x2, rect.x2 + margin, (rect.x1 + rect.x2) / 2);
    yValues.push(rect.y1 - margin, rect.y1, rect.y2, rect.y2 + margin, (rect.y1 + rect.y2) / 2);
  });

  const xs = uniqueSortedValues(xValues);
  const ys = uniqueSortedValues(yValues);
  const nodes = new Map();
  xs.forEach(x => {
    ys.forEach(y => {
      const pt = { x, y };
      if (obstacles.some(rect => pointInRect(pt, rect))) return;
      nodes.set(makeGridPointKey(x, y), pt);
    });
  });

  const startKey = makeGridPointKey(p1.x, p1.y);
  const goalKey = makeGridPointKey(p2.x, p2.y);
  nodes.set(startKey, p1);
  nodes.set(goalKey, p2);

  const neighbors = new Map();
  const addEdge = (a, b) => {
    if (!a || !b) return;
    if (obstacles.some(rect => segmentIntersectsRect(a, b, rect))) return;
    const ak = makeGridPointKey(a.x, a.y);
    const bk = makeGridPointKey(b.x, b.y);
    const cost = Math.hypot(b.x - a.x, b.y - a.y);
    if (!neighbors.has(ak)) neighbors.set(ak, []);
    if (!neighbors.has(bk)) neighbors.set(bk, []);
    neighbors.get(ak).push({ key: bk, cost });
    neighbors.get(bk).push({ key: ak, cost });
  };

  ys.forEach(y => {
    const row = xs.map(x => nodes.get(makeGridPointKey(x, y))).filter(Boolean);
    for (let i = 0; i < row.length - 1; i++) addEdge(row[i], row[i + 1]);
  });
  xs.forEach(x => {
    const col = ys.map(y => nodes.get(makeGridPointKey(x, y))).filter(Boolean);
    for (let i = 0; i < col.length - 1; i++) addEdge(col[i], col[i + 1]);
  });

  const open = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map([[startKey, Math.hypot(p2.x - p1.x, p2.y - p1.y)]]);
  let guard = 0;
  while (open.size && guard++ < 5000) {
    let current = null;
    let bestF = Infinity;
    open.forEach(key => {
      const f = fScore.get(key) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = key;
      }
    });
    if (current === goalKey) {
      const routed = [nodes.get(goalKey)];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        routed.push(nodes.get(current));
      }
      routed.reverse();
      return polylineToPath([from, p1, ...routed, p2, to]);
    }
    open.delete(current);
    for (const next of neighbors.get(current) || []) {
      const curPt = nodes.get(current);
      const nextPt = nodes.get(next.key);
      const prevKey = cameFrom.get(current);
      const prevPt = prevKey ? nodes.get(prevKey) : null;
      const bendPenalty = prevPt && curPt
        && Math.abs((curPt.x - prevPt.x) * (nextPt.y - curPt.y) - (curPt.y - prevPt.y) * (nextPt.x - curPt.x)) > 0.001
        ? 120
        : 0;
      const tentative = (gScore.get(current) ?? Infinity) + next.cost + bendPenalty;
      if (tentative >= (gScore.get(next.key) ?? Infinity)) continue;
      cameFrom.set(next.key, current);
      gScore.set(next.key, tentative);
      fScore.set(next.key, tentative + Math.hypot(p2.x - nextPt.x, p2.y - nextPt.y));
      open.add(next.key);
    }
  }

  return getConnectionPathCandidateRoute(from, to, fromPort, toPort, routeOpts);
}

function computeBezierControlPoints(from, to, fromPort, toPort, offsetScale) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const minOffset = 40;
  const maxOffset = 200;
  let baseOffset = Math.max(minOffset, Math.min(maxOffset, dist * 0.4)) * (offsetScale || 1);

  const isReverse = (fromPort === toPort) ||
    (fromPort === 'bottom' && toPort === 'top' && dy < -10) ||
    (fromPort === 'top' && toPort === 'bottom' && dy > 10) ||
    (fromPort === 'left' && toPort === 'right' && dx > 10) ||
    (fromPort === 'right' && toPort === 'left' && dx < -10);

  const isOrthogonal =
    (fromPort === 'bottom' && toPort === 'top') ||
    (fromPort === 'top' && toPort === 'bottom') ||
    (fromPort === 'left' && toPort === 'right') ||
    (fromPort === 'right' && toPort === 'left');

  let cp1x;
  let cp1y;
  let cp2x;
  let cp2y;

  if (isReverse) {
    const offset = Math.max(minOffset, Math.min(maxOffset,
      Math.abs(fromPort === 'top' || fromPort === 'bottom' ? dy : dx) * 0.5 + 40) * (offsetScale || 1));
    cp1x = from.x + fd.x * offset;
    cp1y = from.y + fd.y * offset;
    cp2x = to.x + td.x * offset;
    cp2y = to.y + td.y * offset;
  } else {
    cp1x = from.x + fd.x * baseOffset;
    cp1y = from.y + fd.y * baseOffset;
    cp2x = to.x + td.x * baseOffset;
    cp2y = to.y + td.y * baseOffset;
  }

  if (!isReverse) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    for (const node of state.nodes) {
      if (node.x === from.x && node.y === from.y) continue;
      if (node.x === to.x && node.y === to.y) continue;
      if (pointInNodeRect(midX, midY, node, 20)) {
        baseOffset = Math.max(baseOffset, Math.max(node.w, node.h) + 60);
        cp1x = from.x + fd.x * baseOffset;
        cp1y = from.y + fd.y * baseOffset;
        cp2x = to.x + td.x * baseOffset;
        cp2y = to.y + td.y * baseOffset;
        break;
      }
    }
  }

  return { cp1x, cp1y, cp2x, cp2y, isReverse, isOrthogonal };
}

function bezierPathFromControls(from, to, cp1x, cp1y, cp2x, cp2y) {
  return `M${from.x},${from.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${to.x},${to.y}`;
}

function getConnectionPathBezier(from, to, fromPort, toPort, offsetScale) {
  const { cp1x, cp1y, cp2x, cp2y } = computeBezierControlPoints(from, to, fromPort, toPort, offsetScale);
  return bezierPathFromControls(from, to, cp1x, cp1y, cp2x, cp2y);
}

function getConnectionPathOrthogonal(from, to, fromPort, toPort) {
  const stub = 22;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };

  if (fromPort === toPort) {
    if (fromPort === 'bottom' || fromPort === 'top') {
      const yArc = fromPort === 'bottom'
        ? Math.max(p1.y, p2.y) + Math.max(40, Math.abs(p1.x - p2.x) * 0.2 + 30)
        : Math.min(p1.y, p2.y) - Math.max(40, Math.abs(p1.x - p2.x) * 0.2 + 30);
      return `M${from.x},${from.y} L${p1.x},${p1.y} L${p1.x},${yArc} L${p2.x},${yArc} L${p2.x},${p2.y} L${to.x},${to.y}`;
    }
    const xArc = fromPort === 'right'
      ? Math.max(p1.x, p2.x) + Math.max(40, Math.abs(p1.y - p2.y) * 0.2 + 30)
      : Math.min(p1.x, p2.x) - Math.max(40, Math.abs(p1.y - p2.y) * 0.2 + 30);
    return `M${from.x},${from.y} L${p1.x},${p1.y} L${xArc},${p1.y} L${xArc},${p2.y} L${p2.x},${p2.y} L${to.x},${to.y}`;
  }

  const segs = [`M${from.x},${from.y}`, `L${p1.x},${p1.y}`];
  if (fd.x === 0 && td.x === 0) {
    const midY = (p1.y + p2.y) / 2;
    segs.push(`L${p1.x},${midY}`, `L${p2.x},${midY}`);
  } else if (fd.y === 0 && td.y === 0) {
    const midX = (p1.x + p2.x) / 2;
    segs.push(`L${midX},${p1.y}`, `L${midX},${p2.y}`);
  } else if (fd.x === 0) {
    segs.push(`L${p1.x},${p2.y}`);
  } else {
    segs.push(`L${p2.x},${p1.y}`);
  }
  segs.push(`L${p2.x},${p2.y}`, `L${to.x},${to.y}`);
  return segs.join(' ');
}

function getConnectionPathAvoidance(from, to, fromPort, toPort, routeOpts) {
  const { fromNodeId, toNodeId } = routeOpts || {};
  const avoidSegments = routeOpts?.avoidSegments || [];
  let scale = 1;
  let bestPath = getConnectionPathBezier(from, to, fromPort, toPort, scale);
  let bestHits = Infinity;

  for (let i = 0; i < 8; i++) {
    const { cp1x, cp1y, cp2x, cp2y } = computeBezierControlPoints(from, to, fromPort, toPort, scale);
    const path = bezierPathFromControls(from, to, cp1x, cp1y, cp2x, cp2y);
    const samples = sampleCubicBezier(from, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, to, 12);
    const chordSamples = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      chordSamples.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
    const hits = countPathObstacleHits(
      [...samples, ...chordSamples],
      fromNodeId,
      toNodeId,
      state.routingRules?.obstaclePadding ?? 18,
      { avoidSegments },
    );
    if (hits < bestHits) {
      bestHits = hits;
      bestPath = path;
    }
    if (hits === 0) return path;
    scale += 0.35;
  }

  if (bestHits > 0) {
    return getConnectionPathOrthogonal(from, to, fromPort, toPort);
  }
  return bestPath;
}

function getConnectionPath(from, to, fromPort, toPort, routeOpts) {
  if (routeOpts?.fastRouting) {
    return getConnectionPathBezier(from, to, fromPort, toPort, 1);
  }
  const mode = state.connRouteMode || 'bezier';
  const fn = CONN_ROUTE_ALGORITHMS[mode] || CONN_ROUTE_ALGORITHMS.bezier;
  const path = fn(from, to, fromPort, toPort, routeOpts);
  if (mode === 'visio') return path;
  const samples = sampleSvgPath(path, 8);
  const hits = countPathObstacleHits(
    samples,
    routeOpts?.fromNodeId,
    routeOpts?.toNodeId,
    state.routingRules?.obstaclePadding ?? 12,
    { avoidSegments: routeOpts?.avoidSegments },
  );
  return hits > 0
    ? getConnectionPathVisio(from, to, fromPort, toPort, routeOpts)
    : path;
}

function sampleSvgPath(pathD, curveSteps = 10) {
  const tokens = String(pathD || '').match(/[MLC]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const points = [];
  let i = 0;
  let cmd = '';
  let cur = null;
  while (i < tokens.length) {
    if (/^[MLC]$/i.test(tokens[i])) {
      cmd = tokens[i++].toUpperCase();
    }
    if (cmd === 'M' || cmd === 'L') {
      const x = Number(tokens[i++]);
      const y = Number(tokens[i++]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) break;
      cur = { x, y };
      points.push(cur);
      cmd = 'L';
    } else if (cmd === 'C') {
      const p0 = cur;
      const p1 = { x: Number(tokens[i++]), y: Number(tokens[i++]) };
      const p2 = { x: Number(tokens[i++]), y: Number(tokens[i++]) };
      const p3 = { x: Number(tokens[i++]), y: Number(tokens[i++]) };
      if (!p0 || [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y].some(v => !Number.isFinite(v))) break;
      const sampled = sampleCubicBezier(p0, p1, p2, p3, curveSteps);
      points.push(...sampled.slice(1));
      cur = p3;
    } else {
      i++;
    }
  }
  return points;
}

function getSegmentIntersection(a, b, c, d, opts = {}) {
  const trim = opts.trim ?? 0.04;
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 0.001) return null;
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const t = (dx * s.y - dy * s.x) / denom;
  const u = (dx * r.y - dy * r.x) / denom;
  if (t <= trim || t >= 1 - trim || u <= trim || u >= 1 - trim) return null;
  return {
    x: a.x + t * r.x,
    y: a.y + t * r.y,
    ta: t,
    tb: u,
  };
}

function getCollinearOverlapBridgePoint(a, b, c, d) {
  const horizontal = Math.abs(a.y - b.y) < 0.001 && Math.abs(c.y - d.y) < 0.001 && Math.abs(a.y - c.y) < 0.001;
  const vertical = Math.abs(a.x - b.x) < 0.001 && Math.abs(c.x - d.x) < 0.001 && Math.abs(a.x - c.x) < 0.001;
  if (!horizontal && !vertical) return null;

  const axisA1 = horizontal ? a.x : a.y;
  const axisA2 = horizontal ? b.x : b.y;
  const axisB1 = horizontal ? c.x : c.y;
  const axisB2 = horizontal ? d.x : d.y;
  const aMin = Math.min(axisA1, axisA2);
  const aMax = Math.max(axisA1, axisA2);
  const bMin = Math.min(axisB1, axisB2);
  const bMax = Math.max(axisB1, axisB2);
  const start = Math.max(aMin, bMin);
  const end = Math.min(aMax, bMax);
  if (end - start < 8) return null;
  const mid = (start + end) / 2;
  return horizontal
    ? { x: mid, y: a.y }
    : { x: a.x, y: mid };
}

function getCrossingForSegments(a, b, c, d) {
  const hit = getSegmentIntersection(a, b, c, d);
  if (hit) return hit;
  return getCollinearOverlapBridgePoint(a, b, c, d);
}

function connectionsShareEndpoint(a, b) {
  return a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to;
}

function pointInsideAnyNode(pt, pad = 4) {
  return state.nodes.some(node => pointInNodeRect(pt.x, pt.y, node, pad));
}

function segmentLength(a, b) {
  return Math.hypot((b?.x || 0) - (a?.x || 0), (b?.y || 0) - (a?.y || 0));
}

function pickBridgeSegment(aConn, bConn, aFrom, aTo, bFrom, bTo, aOrder, bOrder) {
  const aLen = segmentLength(aFrom, aTo);
  const bLen = segmentLength(bFrom, bTo);
  if (Math.abs(aLen - bLen) > 0.001) {
    return aLen > bLen
      ? { connId: aConn.id, from: aFrom, to: aTo }
      : { connId: bConn.id, from: bFrom, to: bTo };
  }
  return aOrder > bOrder
    ? { connId: aConn.id, from: aFrom, to: aTo }
    : { connId: bConn.id, from: bFrom, to: bTo };
}

function findConnectionCrossings(dataList) {
  const crossings = new Map();
  dataList.forEach(data => crossings.set(data.conn.id, []));

  for (let i = 0; i < dataList.length; i++) {
    for (let j = i + 1; j < dataList.length; j++) {
      const a = dataList[i];
      const b = dataList[j];
      if (connectionsShareEndpoint(a.conn, b.conn)) continue;
      for (let ai = 0; ai < a.points.length - 1; ai++) {
        for (let bi = 0; bi < b.points.length - 1; bi++) {
          const hit = getCrossingForSegments(a.points[ai], a.points[ai + 1], b.points[bi], b.points[bi + 1]);
          if (!hit || pointInsideAnyNode(hit, 8)) continue;
          const jumpSeg = pickBridgeSegment(
            a.conn,
            b.conn,
            a.points[ai],
            a.points[ai + 1],
            b.points[bi],
            b.points[bi + 1],
            i,
            j,
          );
          crossings.get(jumpSeg.connId)?.push({ from: jumpSeg.from, to: jumpSeg.to, hit });
        }
      }
    }
  }
  return crossings;
}

function buildBridgeSvgFragments(dataList, bridgeBg) {
  const behavior = state.routingRules?.bridgeBehavior || 'jump';
  if (behavior === 'none') return '';
  const crossings = findConnectionCrossings(dataList);
  let svg = '';
  dataList.forEach(data => {
    const items = crossings.get(data.conn.id) || [];
    items.forEach(({ from, to, hit }) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const half = Math.min(12, Math.max(7, len * 0.22));
      const gapHalf = Math.max(3, half - 4);
      const height = state.routingRules?.bridgeSize || 8;
      const p1 = { x: hit.x - ux * half, y: hit.y - uy * half };
      const p2 = { x: hit.x + ux * half, y: hit.y + uy * half };
      const g1 = { x: hit.x - ux * gapHalf, y: hit.y - uy * gapHalf };
      const g2 = { x: hit.x + ux * gapHalf, y: hit.y + uy * gapHalf };
      const cp = { x: hit.x + nx * height, y: hit.y + ny * height };
      const bridgeD = `M${p1.x},${p1.y} Q${cp.x},${cp.y} ${p2.x},${p2.y}`;
      svg += `<path class="connection-bridge-gap" d="M${g1.x},${g1.y} L${g2.x},${g2.y}" fill="none" stroke="${bridgeBg}" stroke-width="${data.width + 4}" stroke-linecap="round" pointer-events="none"/>`;
      if (behavior === 'jump') svg += `<path class="connection-bridge" d="${bridgeD}" fill="none" stroke="${data.color}" stroke-width="${data.width}" stroke-linecap="round" pointer-events="none" data-conn-id="${data.conn.id}"/>`;
    });
  });
  return svg;
}

function getConnLabelLayout(from, to, labelPos, labelOffset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const gap = 12;
  const mode = labelPos || 'auto';
  if (mode === 'custom') return { x: mx + (labelOffset?.x || 0), y: my + (labelOffset?.y || 0), anchor: 'middle', baseline: 'middle' };
  const placeAbove = mode === 'above' || (mode === 'auto' && Math.abs(dx) > Math.abs(dy));
  if (placeAbove) {
    return { x: mx, y: my - gap, anchor: 'middle', baseline: 'auto' };
  }
  return { x: mx + gap, y: my - 2, anchor: 'start', baseline: 'middle' };
}

function getConnectionRenderData(conn, avoidSegments = [], options = {}) {
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return null;

  const effectivePorts = state.routingRules?.endpointLock === false ? computeConnPorts(fromNode, toNode) : conn;
  const fromPort = effectivePorts.fromPort || conn.fromPort;
  const toPort = effectivePorts.toPort || conn.toPort;
  const from = getPortPos(fromNode, fromPort);
  const to = getPortPos(toNode, toPort);
  const isSelected = state.selectedConnectionId === conn.id;
  const color = isSelected ? getThemeVar('--accent', '#6c8cff') : getThemeVar('--conn-color', '#6b6f85');
  const width = isSelected ? 2.5 : 1.8;
  const routeOpts = {
    fromNodeId: conn.from,
    toNodeId: conn.to,
    avoidSegments,
    fastRouting: options.fastRouting,
  };
  const waypoints = Array.isArray(conn.waypoints) ? conn.waypoints : [];
  const pathD = waypoints.length
    ? `M${from.x},${from.y} ${waypoints.map(point => `L${point.x},${point.y}`).join(' ')} L${to.x},${to.y}`
    : getConnectionPath(from, to, fromPort, toPort, routeOpts);
  const points = sampleSvgPath(pathD, 12);
  const layout = conn.label ? getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset) : null;
  return { conn, color, width, pathD, points, layout };
}

function buildConnectionSvgFragment(data) {
  const { conn, color, width, pathD, layout } = data;
  const markerId = conn.id + '_arrow';
  let svg = `<defs><marker id="${markerId}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L10,4 L0,8 L2,4 Z" fill="${color}"/>
  </marker></defs>`;
  svg += `<path class="connection-hitarea" d="${pathD}" fill="none" stroke="transparent" stroke-width="16" data-conn-id="${conn.id}"/>`;
  svg += `<path class="connection-line" d="${pathD}" fill="none" stroke="${color}" stroke-width="${width}" marker-end="url(#${markerId})" data-conn-id="${conn.id}"/>`;
  if (Array.isArray(conn.waypoints) && conn.waypoints.length && state.selectedConnectionId === conn.id) {
    conn.waypoints.forEach((point, index) => { svg += `<circle class="connection-waypoint${point.locked ? ' locked' : ''}" cx="${point.x}" cy="${point.y}" r="5" data-conn-id="${conn.id}" data-waypoint-index="${index}"/>`; });
  }
  if (conn.label && layout) {
    svg += `<text class="connection-label" data-conn-id="${conn.id}" x="${layout.x}" y="${layout.y}" fill="${color}" font-size="11" text-anchor="${layout.anchor}" dominant-baseline="${layout.baseline}" font-family="DiagramWeaveZh, Microsoft YaHei, sans-serif">${escapeHtml(conn.label)}</text>`;
  }
  return svg;
}

function connDomSelector(connId) {
  const esc = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(connId) : connId.replace(/"/g, '\\"');
  return `[data-conn-id="${esc}"]`;
}

let pendingConnectionRender = false;

function scheduleRenderConnections() {
  if (pendingConnectionRender) return;
  pendingConnectionRender = true;
  requestAnimationFrame(() => {
    pendingConnectionRender = false;
    renderConnections();
  });
}

/** 节点移动会影响避障和交叉桥，统一重绘连线以保持路径一致。 */
function updateConnectionsForNode(nodeId) {
  if (!connectionsLayer || !nodeId) return;
  scheduleRenderConnections();
}

function renderConnections() {
  let svg = '';
  const dataList = [];
  const avoidSegments = [];
  const fastRouting = state.nodes.length > 30 || state.connections.length > 30;
  for (const conn of state.connections) {
    const data = getConnectionRenderData(conn, avoidSegments, { fastRouting });
    if (!data) continue;
    dataList.push(data);
    for (let i = 0; i < data.points.length - 1; i++) {
      avoidSegments.push({
        from: data.points[i],
        to: data.points[i + 1],
        connId: data.conn.id,
        fromNodeId: data.conn.from,
        toNodeId: data.conn.to,
      });
    }
  }
  dataList.forEach(data => { svg += buildConnectionSvgFragment(data); });
  svg += buildBridgeSvgFragments(dataList, getThemeVar('--canvas-bg', '#13151d'));

  // 重连时的临时连线
  if (state.isReconnecting && state.reconnectConnId && state.connectTempEnd) {
    const conn = state.connections.find(c => c.id === state.reconnectConnId);
    if (conn) {
      const fromNode = state.nodes.find(n => n.id === conn.from);
      const toNode = state.nodes.find(n => n.id === conn.to);
      if (fromNode && toNode) {
        let fixed;
        let tempPort;
        if (state.reconnectEnd === 'from') {
          fixed = getPortPos(toNode, conn.toPort);
          tempPort = getNearestPortByPoint(state.connectTempEnd.x, state.connectTempEnd.y, fromNode);
          const pathD = getConnectionPath(state.connectTempEnd, fixed, tempPort, conn.toPort, {
            fromNodeId: conn.from,
            toNodeId: conn.to,
            avoidSegments,
          });
          svg += `<path class="connection-temp" d="${pathD}" fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
        } else {
          fixed = getPortPos(fromNode, conn.fromPort);
          tempPort = getNearestPortByPoint(state.connectTempEnd.x, state.connectTempEnd.y, toNode);
          const pathD = getConnectionPath(fixed, state.connectTempEnd, conn.fromPort, tempPort, {
            fromNodeId: conn.from,
            toNodeId: conn.to,
            avoidSegments,
          });
          svg += `<path class="connection-temp" d="${pathD}" fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
        }
      }
    }
  }

  // 临时连线（也使用智能路径）
  if (state.isConnecting && state.connectFrom && state.connectTempEnd) {
    const fromNode = state.nodes.find(n => n.id === state.connectFrom.nodeId);
    if (fromNode) {
      const from = getPortPos(fromNode, state.connectFrom.port);
      const to = state.connectTempEnd;
      const pathD = getConnectionPath(from, to, state.connectFrom.port, 'top', {
        fromNodeId: state.connectFrom.nodeId,
        toNodeId: null,
        avoidSegments,
      });
      svg += `<path class="connection-temp" d="${pathD}"
        fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
    }
  }

  connectionsLayer.innerHTML = svg;
  syncConnectionsLayerOrder();

  const bindConnInteraction = (el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectConnection(el.dataset.connId);
    });
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      state.selectedConnectionId = el.dataset.connId;
      startConnectionLabelEdit(el.dataset.connId, e);
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.selectedNodeId = null;
      state.selectedConnectionId = el.dataset.connId;
      renderAll();
      showConnContextMenu(e.clientX, e.clientY, el.dataset.connId);
    });
  };

  connectionsLayer.querySelectorAll('.connection-hitarea, .connection-line').forEach(bindConnInteraction);
  connectionsLayer.querySelectorAll('.connection-label').forEach(labelEl => {
    labelEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectConnection(labelEl.dataset.connId);
    });
    labelEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startConnectionLabelEdit(labelEl.dataset.connId, e);
    });
  });
  renderConnEndpointHandles();
  refreshAllNodeBriefs();
  if (state.selectedNodeId && !state.selectedConnectionId) {
    const propNextConn = document.getElementById('propNextConn');
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (propNextConn && node) {
      propNextConn.textContent = formatNodeOutgoingConnections(node) || '（无出线）';
    }
  }
}

function syncConnectionsLayerOrder() {
  if (!connectionsLayer || !canvasTransform) return;
  const firstNode = canvasTransform.querySelector('.node');
  if (firstNode) canvasTransform.insertBefore(connectionsLayer, firstNode);
  else canvasTransform.appendChild(connectionsLayer);
}

function clearConnEndpointHandles() {
  canvasTransform?.querySelectorAll('.conn-handle-node').forEach(el => el.remove());
}

function renderConnEndpointHandles() {
  clearConnEndpointHandles();
  if (!state.selectedConnectionId || presentState.active || state.tool !== 'select') return;

  const conn = state.connections.find(c => c.id === state.selectedConnectionId);
  if (!conn) return;
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return;

  [
    { end: 'from', node: fromNode, port: conn.fromPort },
    { end: 'to', node: toNode, port: conn.toPort },
  ].forEach(({ end, node, port }) => {
    const pos = getPortPos(node, port);
    const el = document.createElement('div');
    el.className = 'conn-handle-node';
    el.dataset.connId = conn.id;
    el.dataset.end = end;
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.title = end === 'from' ? '拖动改起点' : '拖动改终点';
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startReconnect(conn.id, end, e);
    });
    canvasTransform.appendChild(el);
  });
}

function renderAll() {
  ensureNodeRefIds();
  renderAllNodes();
  renderConnections();
  updateProperties();
  renderOutlinePanel();
  renderCanvasMinimap();
  renderNodeContextToolbar();
  // 演示模式下应用样式和更新内容面板位置
  if (presentState.active) {
    applyPresentationStyles();
  }
}

// ===== 获取连接点位置 =====
function getPortPos(node, port) {
  const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
  const a = anchors[port] || anchors.top;
  return { x: node.x + node.w * a.x, y: node.y + node.h * a.y };
}

// ===== 节点事件 =====
function setupNodeEvents(el, node) {
  // 鼠标按下
  el.addEventListener('mousedown', (e) => {
    if (isMobileViewMode()) { e.preventDefault(); selectNode(node.id); return; }
    if (state.tool === 'pan') return;

    // 检查是否点击了端口（包括端口的热区伪元素）
    const portEl = e.target.closest('.port');
    if (portEl) {
      // 开始连线
      e.preventDefault();
      e.stopPropagation();
      startConnection(node.id, portEl.dataset.port, e);
      return;
    }

    if (state.tool === 'connect') {
      e.preventDefault();
      e.stopPropagation();
      // 连线模式：点击节点自动找最近端口
      const port = getNearestPort(node, e);
      startConnection(node.id, port, e);
      return;
    }

    if (presentState.active) {
      e.preventDefault();
      e.stopPropagation();
      focusPresentationOnNode(node.id);
      return;
    }

    e.stopPropagation();
    selectNode(node.id, e.shiftKey || e.ctrlKey || e.metaKey);

    // 开始拖拽
    state.isDragging = true;
    state.dragNode = node;
    const rect = canvasWrapper.getBoundingClientRect();
    const mx = (e.clientX - rect.left - state.panX) / state.zoom;
    const my = (e.clientY - rect.top - state.panY) / state.zoom;
    state.dragOffset = { x: mx - node.x, y: my - node.y };
    saveState();
  });

  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    if (node.shape === 'offpage' && node.targetPageId && e.altKey && typeof DiagramWeave !== 'undefined') {
      DiagramWeave.switchPage(node.targetPageId);
      return;
    }
    startEditing(node);
  });

  // 右键菜单
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectNode(node.id);
    showContextMenu(e.clientX, e.clientY);
  });
}

function getNearestPort(node, e) {
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = (e.clientX - rect.left - state.panX) / state.zoom;
  const my = (e.clientY - rect.top - state.panY) / state.zoom;
  return getNearestPortByPoint(mx, my, node);
}

function getNearestPortByPoint(mx, my, node) {
  const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
  let nearest = 'top';
  let minDist = Infinity;
  for (const name of ['top', 'bottom', 'left', 'right']) {
    const a = anchors[name];
    const px = node.x + node.w * a.x;
    const py = node.y + node.h * a.y;
    const dist = Math.hypot(px - mx, py - my);
    if (dist < minDist) { minDist = dist; nearest = name; }
  }
  return nearest;
}

function resolveConnectTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = (e.clientX - rect.left - state.panX) / state.zoom;
  const my = (e.clientY - rect.top - state.panY) / state.zoom;

  if (el) {
    const targetPort = el.closest('.port');
    if (targetPort) {
      const targetNode = targetPort.closest('.node');
      if (targetNode) return { nodeId: targetNode.id, port: targetPort.dataset.port };
    }
    const targetNodeEl = el.closest('.node');
    if (targetNodeEl) {
      const targetNode = state.nodes.find(n => n.id === targetNodeEl.id);
      if (targetNode) return { nodeId: targetNode.id, port: getNearestPortByPoint(mx, my, targetNode) };
    }
  }

  for (const node of state.nodes) {
    const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
    for (const [portName, anchor] of Object.entries(anchors)) {
      const pos = { x: node.x + node.w * anchor.x, y: node.y + node.h * anchor.y };
      if (Math.hypot(pos.x - mx, pos.y - my) < 34) {
        return { nodeId: node.id, port: portName };
      }
    }
  }
  return null;
}

// ===== 连线逻辑 =====
function startConnection(nodeId, port, e) {
  if (state.isReconnecting) return;
  e.preventDefault();
  e.stopPropagation();
  state.isConnecting = true;
  state.connectFrom = { nodeId, port };
  state.connectTempEnd = null;
  document.body.classList.add('conn-edit-mode');
  // 绑定 document 级别事件，确保拖拽过程中不丢失
  document.addEventListener('mousemove', onConnectMouseMove);
  document.addEventListener('mouseup', onConnectMouseUp);
}

// document 级别的连线鼠标移动
function onConnectMouseMove(e) {
  if (!state.isConnecting) return;
  e.preventDefault();
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = (e.clientX - rect.left - state.panX) / state.zoom;
  const my = (e.clientY - rect.top - state.panY) / state.zoom;
  state.connectTempEnd = { x: mx, y: my };
  scheduleRenderConnections();
}

// document 级别的连线鼠标释放
function onConnectMouseUp(e) {
  if (!state.isConnecting) return;
  document.removeEventListener('mousemove', onConnectMouseMove);
  document.removeEventListener('mouseup', onConnectMouseUp);
  document.body.classList.remove('conn-edit-mode');

  const target = resolveConnectTarget(e);
  if (target && target.nodeId !== state.connectFrom.nodeId) {
    endConnection(target.nodeId, target.port);
    return;
  }

  state.isConnecting = false;
  state.connectTempEnd = null;
  renderConnections();
}

function endConnection(targetNodeId, port) {
  if (!state.isConnecting) return;
  if (state.connectFrom.nodeId === targetNodeId) {
    state.isConnecting = false;
    document.body.classList.remove('conn-edit-mode');
    renderConnections();
    return;
  }

  // 检查是否已存在相同连线
  const exists = state.connections.find(c =>
    c.from === state.connectFrom.nodeId && c.to === targetNodeId &&
    c.fromPort === state.connectFrom.port && c.toPort === port
  );
  if (exists) {
    state.isConnecting = false;
    document.body.classList.remove('conn-edit-mode');
    renderConnections();
    return;
  }

  saveState();
  state.connections.push({
    id: 'conn_' + state.nextId++,
    from: state.connectFrom.nodeId,
    fromPort: state.connectFrom.port,
    to: targetNodeId,
    toPort: port,
    label: '',
  });
  state.isConnecting = false;
  renderConnections();
}

function startReconnect(connId, end, e) {
  e.preventDefault();
  e.stopPropagation();
  const conn = state.connections.find(c => c.id === connId);
  if (!conn) return;

  state.isReconnecting = true;
  state.reconnectConnId = connId;
  state.reconnectEnd = end;
  state.connectTempEnd = null;
  state.selectedConnectionId = connId;
  state.selectedNodeId = null;
  document.body.classList.add('conn-edit-mode');
  document.addEventListener('mousemove', onReconnectMouseMove);
  document.addEventListener('mouseup', onReconnectMouseUp);
}

function onReconnectMouseMove(e) {
  if (!state.isReconnecting) return;
  e.preventDefault();
  const rect = canvasWrapper.getBoundingClientRect();
  state.connectTempEnd = {
    x: (e.clientX - rect.left - state.panX) / state.zoom,
    y: (e.clientY - rect.top - state.panY) / state.zoom,
  };
  scheduleRenderConnections();
}

function onReconnectMouseUp(e) {
  if (!state.isReconnecting) return;
  document.removeEventListener('mousemove', onReconnectMouseMove);
  document.removeEventListener('mouseup', onReconnectMouseUp);
  document.body.classList.remove('conn-edit-mode');

  const conn = state.connections.find(c => c.id === state.reconnectConnId);
  const end = state.reconnectEnd;
  state.isReconnecting = false;
  state.connectTempEnd = null;

  if (!conn) {
    state.reconnectConnId = null;
    state.reconnectEnd = null;
    renderConnections();
    return;
  }

  const target = resolveConnectTarget(e);
  state.reconnectConnId = null;
  state.reconnectEnd = null;

  if (!target) {
    renderConnections();
    return;
  }

  const otherNodeId = end === 'from' ? conn.to : conn.from;
  if (target.nodeId === otherNodeId) {
    showToast('连线两端不能是同一个节点');
    renderConnections();
    return;
  }

  saveState();
  if (end === 'from') {
    conn.from = target.nodeId;
    conn.fromPort = target.port;
  } else {
    conn.to = target.nodeId;
    conn.toPort = target.port;
  }

  if (isDuplicateConnection(conn.from, conn.to, conn.fromPort, conn.toPort, conn.id)) {
    revertLastSaveState();
    showToast('已存在相同连线');
    renderAll();
    return;
  }

  renderAll();
  syncFlowTableFromConnections();
  showToast('连线已更新');
}

// ===== 选中 =====
function selectConnection(connId) {
  state.selectedNodeId = null;
  state.selectedConnectionId = connId;
  renderAll();
  syncFlowTableConnHighlight(connId);
}

function getSelectedNodeIds() {
  const ids = Array.isArray(state.selectedNodeIds) ? state.selectedNodeIds : [];
  const valid = ids.filter(id => state.nodes.some(node => node.id === id));
  if (!valid.length && state.selectedNodeId && state.nodes.some(node => node.id === state.selectedNodeId)) valid.push(state.selectedNodeId);
  state.selectedNodeIds = [...new Set(valid)];
  return state.selectedNodeIds;
}

function selectNode(nodeId, additive = false) {
  const selected = getSelectedNodeIds();
  if (additive) {
    state.selectedNodeIds = selected.includes(nodeId)
      ? selected.filter(id => id !== nodeId)
      : [...selected, nodeId];
    state.selectedNodeId = state.selectedNodeIds.at(-1) || null;
  } else {
    state.selectedNodeId = nodeId;
    state.selectedNodeIds = nodeId ? [nodeId] : [];
  }
  state.selectedConnectionId = null;
  renderAll();
  syncFlowTableHighlight();
}

function applyDeepLinkHighlight() {
  const params = new URLSearchParams(window.location.search);
  const highlight = params.get('highlightNode');
  if (!highlight) return;
  const node = state.nodes.find(
    (n) => n.id === highlight || String(n.refId) === highlight,
  );
  if (!node) {
    showToast(`Node not found: ${highlight}`);
    return;
  }
  selectNode(node.id);
  const el = document.getElementById(node.id);
  if (el) {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  }
  showToast(`Highlighted: ${node.label || node.id}`);
}

function loadE2eSeedNodesFromSession() {
  try {
    const raw = sessionStorage.getItem('dw-e2e-seed-nodes');
    if (!raw) return;
    const nodes = JSON.parse(raw);
    if (!Array.isArray(nodes)) return;
    for (const seed of nodes) {
      const shape = seed.shape || 'rectangle';
      const defaults = shapeDefaults[shape] || shapeDefaults.rectangle;
      state.nodes.push({
        ...defaults,
        id: seed.id || `node_${state.nextId++}`,
        shape,
        x: seed.x ?? 80,
        y: seed.y ?? 80,
        w: seed.w ?? defaults.w,
        h: seed.h ?? defaults.h,
        label: seed.label || 'Node',
        refId: seed.refId,
      });
    }
    ensureNodeRefIds();
    if (typeof DiagramWeave !== 'undefined') {
      const page = DiagramWeave.getCurrentPage();
      if (page) {
        page.nodes = state.nodes;
      }
    }
  } catch {
    // ignore invalid e2e seed payload
  }
}

function deselectAll() {
  state.selectedNodeId = null;
  state.selectedNodeIds = [];
  state.selectedConnectionId = null;
  renderAll();
}

// ===== 编辑标签 =====
function startEditing(node) {
  const el = document.getElementById(node.id);
  if (!el) return;
  const labelEl = el.querySelector('.node-label');
  labelEl.contentEditable = 'true';
  labelEl.focus();

  // 选中全部文字
  const range = document.createRange();
  range.selectNodeContents(labelEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finish = () => {
    labelEl.contentEditable = 'false';
    const newLabel = labelEl.textContent.trim() || node.label;
    if (newLabel !== node.label) {
      saveState();
      node.label = newLabel;
    }
    labelEl.textContent = node.label;
    updateProperties();
    labelEl.removeEventListener('blur', finish);
    labelEl.removeEventListener('keydown', handleKey);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(); }
    if (e.key === 'Escape') { labelEl.textContent = node.label; finish(); }
  };

  labelEl.addEventListener('blur', finish);
  labelEl.addEventListener('keydown', handleKey);
}

function editLabel() {
  hideContextMenu();
  if (state.selectedNodeId) {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (node) startEditing(node);
  }
}

// ===== 删除 =====
function deleteSelected() {
  hideContextMenu();
  const selectedIds = getSelectedNodeIds();
  if (selectedIds.length) {
    saveState();
    selectedIds.forEach(id => document.getElementById(id)?.remove());
    const selectedSet = new Set(selectedIds);
    state.nodes = state.nodes.filter(n => !selectedSet.has(n.id));
    state.connections = state.connections.filter(c => !selectedSet.has(c.from) && !selectedSet.has(c.to));
    state.selectedNodeId = null;
    state.selectedNodeIds = [];
    renderAll();
    showToast('已删除形状');
  } else if (state.selectedConnectionId) {
    saveState();
    state.connections = state.connections.filter(c => c.id !== state.selectedConnectionId);
    state.selectedConnectionId = null;
    renderAll();
    showToast('已删除连线');
  }
}

function clearCanvas() {
  if (state.nodes.length === 0) return;
  saveState();
  state.nodes = [];
  state.connections = [];
  state.selectedNodeId = null;
  state.selectedConnectionId = null;
  // 移除所有节点DOM和泳道
  canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());
  renderAll();
  showToast(typeof t === 'function' ? t('toast.cleared') : '画布已清空');
}

// ===== 复制 =====
function duplicateSelected() {
  hideContextMenu();
  if (!state.selectedNodeId) return;
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  const newNode = createNode(node.shape, node.x + 20, node.y + 20, node.label);
  newNode.w = node.w;
  newNode.h = node.h;
  newNode.fillColor = node.fillColor;
  newNode.strokeColor = node.strokeColor;
  newNode.textColor = node.textColor || 'auto';
  state.nodes.push(newNode);
  selectNode(newNode.id);
  showToast('已复制');
}

// ===== 层级 =====
function bringToFront() {
  hideContextMenu();
  if (!state.selectedNodeId) return;
  const idx = state.nodes.findIndex(n => n.id === state.selectedNodeId);
  if (idx >= 0) {
    const [node] = state.nodes.splice(idx, 1);
    state.nodes.push(node);
    renderAllNodes();
  }
}

function sendToBack() {
  hideContextMenu();
  if (!state.selectedNodeId) return;
  const idx = state.nodes.findIndex(n => n.id === state.selectedNodeId);
  if (idx >= 0) {
    const [node] = state.nodes.splice(idx, 1);
    state.nodes.unshift(node);
    renderAllNodes();
  }
}

// ===== 属性面板 =====

function isFlowStepNode(node) {
  if (!node) return false;
  return !['terminator', 'start', 'end'].includes(node.shape);
}

function formatDurationDays(days) {
  const n = Number(days) || 0;
  if (Number.isInteger(n)) return `${n} 天`;
  return `${n.toFixed(1)} 天`;
}

function computeFlowPageStats() {
  const nodes = state.nodes;
  const totalShapes = nodes.length;
  const totalDuration = nodes.reduce((sum, n) => sum + (Number(n.duration) || 0), 0);

  let longestIds = [];
  if (typeof DiagramWeave !== 'undefined' && typeof DiagramWeave.findLongestPathIds === 'function') {
    longestIds = DiagramWeave.findLongestPathIds();
  } else if (nodes.length) {
    longestIds = [nodes[0].id];
  }

  const longestNodeCount = longestIds.length;
  const longestDuration = longestIds.reduce((sum, id) => {
    const n = nodes.find(item => item.id === id);
    return sum + (Number(n?.duration) || 0);
  }, 0);

  const stepCount = nodes.filter(isFlowStepNode).length;

  let pageCount = 1;
  let pageName = '页面 1';
  if (typeof DiagramWeave !== 'undefined') {
    pageCount = DiagramWeave.doc.pages.length;
    pageName = DiagramWeave.getCurrentPage()?.name || pageName;
  }

  return {
    pageCount,
    pageName,
    totalShapes,
    totalDuration,
    longestNodeCount,
    longestDuration,
    stepCount,
  };
}

function getExportBaseName() {
  const stats = computeFlowPageStats();
  const raw = (stats.pageName || 'diagramweave').trim();
  const safe = raw.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80);
  return safe || 'diagramweave';
}

function updatePagePropertiesPanel() {
  const pageContent = document.getElementById('propsPageContent');
  if (!pageContent) return;

  const stats = computeFlowPageStats();
  const nameInput = document.getElementById('propPageName');
  if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = stats.pageName;
  }

  const scaleEl = document.getElementById('propPageScale');
  if (scaleEl) {
    scaleEl.textContent = stats.pageCount > 1
      ? `共 ${stats.pageCount} 页 · 当前页 ${stats.totalShapes} 个图形`
      : `当前页 ${stats.totalShapes} 个图形`;
  }

  const totalDurEl = document.getElementById('propPageTotalDuration');
  if (totalDurEl) totalDurEl.textContent = formatDurationDays(stats.totalDuration);

  const criticalEl = document.getElementById('propPageCriticalPath');
  if (criticalEl) {
    criticalEl.textContent = longestNodeCountLabel(stats.longestNodeCount, stats.longestDuration);
  }

  const stepEl = document.getElementById('propPageStepCount');
  if (stepEl) stepEl.textContent = `${stats.stepCount} 步`;

  const delRow = document.getElementById('propDeletePageRow');
  if (delRow) delRow.style.display = stats.pageCount > 1 ? 'block' : 'none';
}

function deleteCurrentPage() {
  if (typeof DiagramWeave === 'undefined') return;
  const page = DiagramWeave.getCurrentPage();
  if (page) DiagramWeave.deletePage(page.id);
}

function longestNodeCountLabel(count, duration) {
  if (!count) return '—';
  return `${count} 个节点 · ${formatDurationDays(duration)}`;
}

function updatePropPageName(val) {
  const name = val.trim();
  if (!name) {
    updatePagePropertiesPanel();
    showToast('页面名称不能为空');
    return;
  }
  if (typeof DiagramWeave === 'undefined') return;
  const page = DiagramWeave.getCurrentPage();
  if (!page || page.name === name) return;
  DiagramWeave.setPageName(page.id, name);
  showToast(`页面已重命名为「${name}」`);
}

function updateProperties() {
  const empty = document.getElementById('propsEmpty');
  const pageContent = document.getElementById('propsPageContent');
  const content = document.getElementById('propsContent');
  const connContent = document.getElementById('propsConnContent');

  if (state.selectedConnectionId) {
    const conn = state.connections.find(c => c.id === state.selectedConnectionId);
    if (!conn) return;
    if (empty) empty.style.display = 'none';
    if (pageContent) pageContent.style.display = 'none';
    content.style.display = 'none';
    connContent.style.display = 'block';

    ensureNodeRefIds();
    const fromSel = document.getElementById('propConnFrom');
    const toSel = document.getElementById('propConnTo');
    const labelInput = document.getElementById('propConnLabel');
    if (fromSel) {
      fromSel.innerHTML = buildNodeSelectOptions(conn.from);
      fromSel.value = conn.from;
    }
    if (toSel) {
      toSel.innerHTML = buildNodeSelectOptions(conn.to);
      toSel.value = conn.to;
    }
    if (labelInput) labelInput.value = conn.label || '';
    const labelPosSel = document.getElementById('propConnLabelPos');
    if (labelPosSel) labelPosSel.value = conn.labelPos || 'auto';
    return;
  }

  if (connContent) connContent.style.display = 'none';

  if (state.selectedNodeId) {
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!node) return;
    const selectedNodes = getSelectedNodes();
    const batchStatus = document.getElementById('propertyBatchStatus');
    if (batchStatus) {
      batchStatus.hidden = selectedNodes.length < 2;
      batchStatus.textContent = selectedNodes.length > 1 ? `${selectedNodes.length} nodes selected · batch editing` : '';
    }
    if (empty) empty.style.display = 'none';
    if (pageContent) pageContent.style.display = 'none';
    content.style.display = 'block';
    const propRefId = document.getElementById('propRefId');
    if (propRefId) propRefId.textContent = node.refId ?? '—';
    const propNextConn = document.getElementById('propNextConn');
    if (propNextConn) {
      const outgoing = formatNodeOutgoingConnections(node);
      propNextConn.textContent = outgoing || '（无出线）';
    }
    document.getElementById('propLabel').value = node.label;
    document.getElementById('propTypeSelect').value = node.shape;
    syncColorSwatchSelection();
    const textColorMode = document.getElementById('propTextColorMode');
    const textColorCustom = document.getElementById('propTextColorCustom');
    const nodeTextColor = node.textColor || 'auto';
    if (textColorMode) {
      textColorMode.value = ['auto', '#111320', '#ffffff'].includes(nodeTextColor)
        ? nodeTextColor
        : 'custom';
    }
    if (textColorCustom) {
      textColorCustom.value = /^#[0-9a-f]{6}$/i.test(nodeTextColor)
        ? nodeTextColor
        : (typeof DiagramWeaveNodeColors !== 'undefined'
          ? DiagramWeaveNodeColors.resolveTextColor(node.fillColor, nodeTextColor)
          : '#ffffff');
    }
    document.getElementById('propDetail').value = node.detail || '';
    document.getElementById('propDuration').value = node.duration || '';
    const propRole = document.getElementById('propRole');
    if (propRole) propRole.value = node.role || '';
    const propLayer = document.getElementById('propLayer');
    if (propLayer && typeof DiagramWeave !== 'undefined') {
      const page = DiagramWeave.getCurrentPage();
      propLayer.innerHTML = page.layers.map(l =>
        `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
      propLayer.value = String(node.layer ?? 0);
    }
    if (selectedNodes.length > 1) {
      syncMixedPropertyControl('propRole', selectedNodes, 'role', '');
      syncMixedPropertyControl('propLayer', selectedNodes, 'layer', 0);
      syncMixedPropertyControl('propTextColorMode', selectedNodes, 'textColor', 'auto');
      const fill = DiagramWeavePropertyTools.mixedValue(selectedNodes, 'fillColor', getDefaultNodeFill());
      const stroke = DiagramWeavePropertyTools.mixedValue(selectedNodes, 'strokeColor', getDefaultNodeStroke());
      if (fill.mixed) document.querySelectorAll('#propFillSwatches .color-swatch').forEach(button => button.classList.remove('selected'));
      if (stroke.mixed) document.querySelectorAll('#propStrokeSwatches .color-swatch').forEach(button => button.classList.remove('selected'));
    }
    const offpageRow = document.getElementById('propOffpageRow');
    const propTargetPage = document.getElementById('propTargetPage');
    if (offpageRow && propTargetPage) {
      const isOffpage = node.shape === 'offpage';
      offpageRow.style.display = isOffpage ? 'flex' : 'none';
      if (isOffpage && typeof DiagramWeave !== 'undefined') {
        propTargetPage.innerHTML = '<option value="">（未选择）</option>' +
          DiagramWeave.doc.pages
            .filter(p => p.id !== DiagramWeave.doc.currentPageId)
            .map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
            .join('');
        propTargetPage.value = node.targetPageId || '';
      }
    }
    // 显示耗时统计
    document.getElementById('propTimeSummary').style.display = 'block';
    updateTimeSummary();
  } else {
    const batchStatus = document.getElementById('propertyBatchStatus');
    if (batchStatus) batchStatus.hidden = true;
    if (empty) empty.style.display = 'none';
    content.style.display = 'none';
    if (pageContent) {
      pageContent.style.display = 'block';
      updatePagePropertiesPanel();
    } else if (empty) {
      empty.style.display = 'block';
    }
  }
}

function buildNodeSelectOptions(selectedId) {
  ensureNodeRefIds();
  return [...state.nodes]
    .sort((a, b) => (a.refId || 0) - (b.refId || 0))
    .map(n => `<option value="${n.id}"${n.id === selectedId ? ' selected' : ''}>${n.refId}. ${escapeHtml(n.label || '未命名')}</option>`)
    .join('');
}

function getSelectedConnection() {
  return state.connections.find(c => c.id === state.selectedConnectionId) || null;
}

function revertLastSaveState() {
  if (!state.undoStack.length) return;
  const snap = state.undoStack.pop();
  const prev = JSON.parse(snap);
  state.nodes = prev.nodes;
  state.connections = prev.connections;
  state.nextId = prev.nextId;
}

function updatePropConnFrom(nodeId) {
  const conn = getSelectedConnection();
  if (!conn || conn.from === nodeId) return;
  if (nodeId === conn.to) {
    showToast('起点不能与终点相同');
    updateProperties();
    return;
  }
  saveState();
  conn.from = nodeId;
  adjustSingleConnPorts(conn);
  if (isDuplicateConnection(conn.from, conn.to, conn.fromPort, conn.toPort, conn.id)) {
    revertLastSaveState();
    showToast('已存在相同连线');
    renderAll();
    return;
  }
  renderAll();
  syncFlowTableFromConnections();
}

function updatePropConnTo(nodeId) {
  const conn = getSelectedConnection();
  if (!conn || conn.to === nodeId) return;
  if (nodeId === conn.from) {
    showToast('终点不能与起点相同');
    updateProperties();
    return;
  }
  saveState();
  conn.to = nodeId;
  adjustSingleConnPorts(conn);
  if (isDuplicateConnection(conn.from, conn.to, conn.fromPort, conn.toPort, conn.id)) {
    revertLastSaveState();
    showToast('已存在相同连线');
    renderAll();
    return;
  }
  renderAll();
  syncFlowTableFromConnections();
}

function updatePropConnLabel(val) {
  const conn = getSelectedConnection();
  if (!conn) return;
  const label = val.trim();
  if (label === (conn.label || '')) return;
  saveState();
  conn.label = label;
  renderAll();
  syncFlowTableFromConnections();
}

function updatePropConnLabelPos(val) {
  const conn = getSelectedConnection();
  if (!conn) return;
  const pos = val || 'auto';
  if ((conn.labelPos || 'auto') === pos) return;
  saveState();
  conn.labelPos = pos;
  renderConnections();
}

function updatePropLabel(val) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.label = val;
  renderNode(node);
  syncFlowTableRowFromNode(node);
}

function updatePropType(newShape) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node || node.shape === newShape) return;
  saveState();
  node.shape = newShape;
  // 移除旧 DOM 并重新渲染
  const oldEl = document.getElementById(node.id);
  if (oldEl) oldEl.remove();
  renderNode(node);
  renderConnections();
  updateProperties();
  syncFlowTableRowFromNode(node);
}

function updatePropDetail(val) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.detail = val;
  syncFlowTableRowFromNode(node);
}

function updatePropDuration(val) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.duration = parseFloat(val) || 0;
  updateTimeSummary();
  syncFlowTableRowFromNode(node);
}

function updatePropRole(val) {
  applyBatchNodeProperty('role', val.trim());
}

function initAccessibility() {
  document.querySelectorAll('button').forEach(button => {
    if (button.getAttribute('aria-label')) return;
    const label = button.getAttribute('title')
      || button.dataset.fcTip
      || button.dataset.i18nTitle
      || button.textContent.trim();
    if (label) button.setAttribute('aria-label', label);
  });

  document.querySelectorAll('.template-dialog, .confirm-dialog, .layout-dialog, .branch-selector, .import-preview-dialog, .mapping-wizard-dialog').forEach((dialog, index) => {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;
    const title = dialog.querySelector('.template-dialog-title, .confirm-title, .layout-dialog-title, .branch-selector-title, #importPreviewTitle, #mappingWizardTitle');
    if (title) {
      if (!title.id) title.id = `dw-dialog-title-${index + 1}`;
      dialog.setAttribute('aria-labelledby', title.id);
    } else if (!dialog.getAttribute('aria-label')) {
      dialog.setAttribute('aria-label', 'DiagramWeave dialog');
    }
  });

  document.querySelectorAll('.shape-item').forEach(item => {
    item.setAttribute('role', 'group');
    item.setAttribute('aria-keyshortcuts', 'Enter Space F');
    item.tabIndex = 0;
    if (!item.getAttribute('aria-label')) {
      item.setAttribute('aria-label', item.dataset.label || item.textContent.trim());
    }
  });
}

const MODAL_OVERLAY_IDS = [
  'templateOverlay', 'commandPaletteOverlay', 'importPreviewOverlay', 'mappingWizardOverlay',
  'excelDataOverlay', 'exportOverlay', 'settingsOverlay', 'confirmOverlay', 'layoutOverlay', 'branchOverlay',
];
let activeModalOverlay = null;
const modalTriggers = new WeakMap();

function modalFocusableElements(overlay) {
  return [...overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.getClientRects().length > 0);
}

function setModalBackgroundInert(overlay, inert) {
  [...document.body.children].forEach(element => { if (element !== overlay) element.inert = inert; });
}

function activateModalContract(overlay) {
  if (activeModalOverlay === overlay) return;
  modalTriggers.set(overlay, document.activeElement);
  activeModalOverlay = overlay;
  overlay.setAttribute('aria-hidden', 'false');
  setModalBackgroundInert(overlay, true);
  const preferredFocus = {
    commandPaletteOverlay: '#commandPaletteInput',
    importPreviewOverlay: '#applyImportPreviewBtn',
    mappingWizardOverlay: '#nodeMappingFields select',
  };
  requestAnimationFrame(() => {
    const preferred = preferredFocus[overlay.id] ? overlay.querySelector(preferredFocus[overlay.id]) : null;
    (preferred || modalFocusableElements(overlay)[0])?.focus();
  });
}

function deactivateModalContract(overlay) {
  overlay.setAttribute('aria-hidden', 'true');
  if (activeModalOverlay !== overlay) return;
  setModalBackgroundInert(overlay, false);
  activeModalOverlay = null;
  const trigger = modalTriggers.get(overlay);
  if (trigger?.isConnected) requestAnimationFrame(() => trigger.focus());
}

function closeActiveModal() {
  if (!activeModalOverlay) return;
  const closeById = {
    templateOverlay: hideTemplateDialog, commandPaletteOverlay: closeCommandPalette,
    importPreviewOverlay: cancelImportPreview, mappingWizardOverlay: cancelMappingWizard,
    excelDataOverlay: hideExcelDataDialog, exportOverlay: hideExportDialog,
    settingsOverlay: hideSettingsDialog, confirmOverlay: hideConfirm,
    layoutOverlay: hideLayoutDialog, branchOverlay: cancelBranchSelector,
  };
  closeById[activeModalOverlay.id]?.();
}

function initModalContracts() {
  MODAL_OVERLAY_IDS.forEach((id, index) => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    const dialog = overlay.querySelector('[role="dialog"], .template-dialog, .confirm-dialog, .layout-dialog, .branch-selector');
    if (dialog) {
      dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
      let title = dialog.querySelector('h1, h2, .template-dialog-title, .confirm-title, .layout-title, .layout-dialog-title, .branch-selector-title, .excel-data-title');
      if (!title) {
        title = document.createElement('span');
        title.className = 'dw-visually-hidden';
        title.textContent = dialog.getAttribute('aria-label') || 'DiagramWeave dialog';
        dialog.prepend(title);
      }
      if (!title.id) title.id = `dw-modal-title-${index + 1}`;
      dialog.setAttribute('aria-labelledby', title.id);
      dialog.removeAttribute('aria-label');
    }
    overlay.setAttribute('aria-hidden', overlay.classList.contains('visible') ? 'false' : 'true');
    new MutationObserver(() => {
      if (overlay.classList.contains('visible')) activateModalContract(overlay);
      else deactivateModalContract(overlay);
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  });
  document.addEventListener('keydown', event => {
    if (!activeModalOverlay) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); closeActiveModal(); return;
    }
    if (event.key !== 'Tab') return;
    const focusable = modalFocusableElements(activeModalOverlay);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);
}

function isMobileViewMode() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function openMobileReview() {
  window.dispatchEvent(new CustomEvent('DiagramWeave:open-review'));
  showReviewPanel();
}

let pendingImportPreview = null;
let importPreviewTrigger = null;

function createImportPreview(raw, sourceType = 'json') {
  if (typeof DiagramWeaveExtensionKernel !== 'undefined') {
    return DiagramWeaveExtensionKernel.invokeExtension('import.preview.document', {
      raw, sourceType, options: { knownShapes: shapeDefaults },
    });
  }
  return DiagramWeaveImportPreview.createDocumentPreview(raw, {
    sourceType, sanitizeOptions: { knownShapes: shapeDefaults },
  });
}

function queueDocumentImport(raw, options) {
  const rawNodes = raw?.version === 2
    ? raw.pages?.flatMap(page => page.nodes || [])
    : raw?.nodes;
  const rawConnections = raw?.version === 2
    ? raw.pages?.flatMap(page => page.connections || [])
    : raw?.connections;
  const requiresMapping = Array.isArray(rawNodes) && rawNodes.length > 0
    && rawNodes.some(node => !node || !Object.prototype.hasOwnProperty.call(node, 'id'));
  if (requiresMapping) {
    startMappingWizard({
      nodeRows: rawNodes,
      connectionRows: Array.isArray(rawConnections) ? rawConnections : [],
      sourceName: options.sourceName,
      sourceType: options.sourceType || 'json',
      onApply: options.apply,
    });
    return;
  }
  const preview = createImportPreview(raw, options.sourceType || 'json');
  preview.issues = [...(preview.issues || []), ...(options.issues || [])];
  preview.warnings = [...(preview.warnings || []), ...(options.warnings || [])];
  showImportPreview(preview, {
    sourceName: options.sourceName,
    apply: options.apply,
  });
}

function showImportPreview(result, options = {}) {
  const overlay = document.getElementById('importPreviewOverlay');
  const summary = result?.data?.summary || { pages: 0, nodes: 0, connections: 0, cycles: 0 };
  pendingImportPreview = { result, apply: options.apply };
  importPreviewTrigger = document.activeElement;
  [...document.body.children].forEach(element => {
    if (element !== overlay) element.inert = true;
  });
  document.getElementById('importPreviewSource').textContent = options.sourceName
    ? `${options.sourceName} · 确认后才会修改当前画布`
    : '确认后才会修改当前画布';
  document.getElementById('importPreviewSummary').innerHTML = [
    ['页面', summary.pages], ['节点', summary.nodes], ['连线', summary.connections], ['循环', summary.cycles || 0],
  ].map(([label, value]) => `<div class="import-preview-stat"><strong>${Number(value) || 0}</strong><span>${label}</span></div>`).join('');
  const items = [...(result?.issues || []), ...(result?.warnings || [])];
  const issues = document.getElementById('importPreviewIssues');
  if (!items.length) issues.innerHTML = '<div class="import-preview-empty">未发现需要跳过的行或警告</div>';
  else issues.replaceChildren(...items.map(item => {
    const row = document.createElement('div');
    row.className = `import-preview-issue ${item.severity === 'warning' ? 'warning' : ''}`;
    const heading = document.createElement('strong');
    heading.textContent = item.severity === 'warning' ? '警告' : '跳过';
    const detail = document.createElement('span');
    detail.textContent = ` 第 ${item.row || '-'} 行 · ${item.field || 'document'} · ${item.reason || item.message || item.code}`;
    row.append(heading, detail);
    return row;
  }));
  document.getElementById('applyImportPreviewBtn').disabled = !result?.success || !result?.data?.document;
  overlay.classList.add('visible');
  overlay.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => document.getElementById('applyImportPreviewBtn').focus());
}

async function processExternalDiagramFile(file, format) {
  if (!file || !['mermaid', 'bpmn'].includes(format) || typeof DiagramWeaveExtensionKernel === 'undefined') return false;
  const operation = format === 'mermaid' ? 'import.mermaid' : 'import.bpmn'; const input = format === 'mermaid' ? { text: await file.text() } : { xml: await file.text() };
  const converted = await DiagramWeaveExtensionKernel.invokeExtensionAsync(operation, input);
  if (!converted.success || !converted.data?.document) { const message = converted.issues?.[0]?.message?.en || converted.issues?.[0]?.message || `Unable to import ${format}`; showToast(String(message)); return false; }
  const preview = createImportPreview(converted.data.document, format);
  preview.issues.push(...(converted.issues || []), ...(converted.warnings || []));
  showImportPreview(preview, { sourceName: file.name, apply: document => loadFlowDocumentPayload(document) }); return true;
}

function cancelImportPreview() {
  const overlay = document.getElementById('importPreviewOverlay');
  if (!overlay?.classList.contains('visible')) return;
  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
  [...document.body.children].forEach(element => {
    if (element !== overlay) element.inert = false;
  });
  pendingImportPreview = null;
  if (importPreviewTrigger?.focus) importPreviewTrigger.focus();
}

async function applyPendingImportPreview() {
  const pending = pendingImportPreview;
  if (!pending?.result?.success || !pending.result.data?.document) return false;
  const applied = pending.apply
    ? await pending.apply(pending.result.data.document)
    : loadFlowDocumentPayload(pending.result.data.document);
  if (applied !== false) cancelImportPreview();
  return applied !== false;
}

function getCommandContext() {
  return { state, editor: window, document: typeof DiagramWeave !== 'undefined' ? DiagramWeave.doc : null };
}

function initEditorCommands() {
  const api = typeof DiagramWeave !== 'undefined' ? DiagramWeave.commands : null;
  if (!api || api.listCommands().length) return;
  const register = (id, label, keywords, shortcut, run, when) => api.registerCommand({
    id, labelKey: label, label, keywords, shortcut, run, when,
  });
  register('tool.select', '选择工具 / Select', ['选择', 'select', 'pointer'], 'V', () => setTool('select'));
  register('tool.connect', '连线工具 / Connect', ['连线', 'connect', 'edge'], 'L', () => setTool('connect'));
  register('edit.undo', '撤销 / Undo', ['撤销', 'undo'], 'Ctrl+Z', () => undo(), () => state.undoStack.length > 0);
  register('edit.redo', '重做 / Redo', ['重做', 'redo'], 'Ctrl+Shift+Z', () => redo(), () => state.redoStack.length > 0);
  register('layout.auto', '自动布局 / Auto layout', ['布局', 'layout', 'arrange'], '', () => autoLayoutNodes('TB', 'normal'), () => state.nodes.length > 1);
  register('template.open', '模板中心 / Templates', ['模板', 'template'], '', () => showTemplateDialog());
  register('project.import', '导入项目 / Import', ['导入', 'import', 'excel'], '', () => triggerProjectExcelUpload());
  register('project.importMermaid', '导入 Mermaid / Import Mermaid', ['导入', 'mermaid', 'mmd', 'flowchart'], '', () => document.getElementById('mermaidFileInput')?.click());
  register('project.importBpmn', '导入 BPMN / Import BPMN', ['导入', 'bpmn', 'xml', 'process'], '', () => document.getElementById('bpmnFileInput')?.click());
  register('project.export', '导出 / Export', ['导出', 'export', 'png', 'svg', 'pdf'], '', () => showExportDialog());
  register('view.resetZoom', '重置缩放 / Reset zoom', ['缩放', 'zoom', '100%'], '0', () => zoomReset());
  register('view.fitAll', '适应全部 / Fit all', ['适应', '全部', 'fit all'], '', () => fitAllNodes(), () => state.nodes.length > 0);
  register('view.fitSelection', '适应选区 / Fit selection', ['适应', '选区', 'fit selection'], '', () => fitSelectedNodes(), () => getSelectedNodeIds().length > 0);
  register('view.outline', '显示大纲 / Outline', ['大纲', 'outline', '节点搜索'], '', () => toggleOutlinePanel());
  ['left', 'center', 'right', 'top', 'middle', 'bottom'].forEach(mode => {
    register(`layout.align.${mode}`, `对齐 ${mode} / Align ${mode}`, ['对齐', 'align', mode], '', () => runAlignCommand(mode), () => getSelectedNodeIds().length > 1);
  });
  ['horizontal', 'vertical'].forEach(axis => {
    register(`layout.distribute.${axis}`, `等距分布 ${axis} / Distribute ${axis}`, ['等距', '分布', 'distribute', axis], '', () => runDistributeCommand(axis), () => getSelectedNodeIds().length > 2);
  });
  register('project.blank', '新建空白流程 / Blank diagram', ['新建', '空白', 'blank'], '', () => dismissCanvasEmptyState());
  register('routing.rules', '连线规则 / Connection rules', ['连线', '路由', '规则', 'routing', 'connection rules'], '', () => showRoutingRulesPanel());
  register('history.local', '版本历史 / Version history', ['版本', '历史', '恢复', 'history', 'restore'], '', () => showVersionHistory());
  register('quality.check', '流程质量检查 / Process quality check', ['质量', '检查', '问题', 'quality', 'validation'], '', () => showQualityChecker());
  register('analysis.process', '流程分析 / Process analysis', ['分析', '关键路径', '瓶颈', 'SLA', 'analysis', 'critical path', 'bottleneck'], '', () => showProcessAnalysis());
  register('review.open', '评论审阅 / Comments and review', ['评论', '审阅', '批准', 'review', 'comment', 'approve'], '', () => showReviewPanel());
  register('ai.settings', 'AI 提供者设置 / AI provider settings', ['AI', 'provider', '权限', 'preview', 'disable'], '', () => showAISettings());
}

function collectPaletteItems(query) {
  const needle = String(query || '').trim().toLocaleLowerCase();
  const matches = value => !needle || String(value || '').toLocaleLowerCase().includes(needle);
  const structuralCommands = /^(tool\.|edit\.|layout\.|routing\.|history\.|project\.(blank|import)|template\.)/;
  const commandItems = DiagramWeave.commands.searchCommands(needle, getCommandContext())
    .filter(command => !isMobileViewMode() || !structuralCommands.test(command.id))
    .map(command => ({
    kind: 'command', id: command.id, label: command.label, meta: command.shortcut || '命令',
  }));
  const pages = (DiagramWeave.doc?.pages || []).filter(page => matches(page.name)).map(page => ({
    kind: 'page', id: page.id, label: page.name, meta: '页面',
  }));
  const nodes = state.nodes.filter(node => matches(node.label)).map(node => ({
    kind: 'node', id: node.id, label: node.label || node.id, meta: '节点',
  }));
  const templates = allTemplates.map((template, index) => ({ template, index }))
    .filter(item => matches(`${item.template.name} ${item.template.nameEn || ''}`))
    .map(item => ({ kind: 'template', id: String(item.index), label: item.template.name, meta: '模板' }));
  return [...commandItems, ...pages, ...nodes, ...templates].slice(0, 40);
}

function renderCommandPalette(query = '') {
  const results = document.getElementById('commandPaletteResults');
  if (!results || typeof DiagramWeave === 'undefined' || !DiagramWeave.commands) return;
  const items = collectPaletteItems(query);
  results.replaceChildren(...items.map(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'command-palette-item';
    button.setAttribute('role', 'option');
    button.innerHTML = `<span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.meta)}</small>`;
    button.addEventListener('click', () => runPaletteItem(item.kind, item.id));
    return button;
  }));
  if (!items.length) results.innerHTML = '<div class="command-palette-empty">没有匹配项</div>';
}

let commandPaletteTrigger = null;
function openCommandPalette() {
  const overlay = document.getElementById('commandPaletteOverlay');
  const input = document.getElementById('commandPaletteInput');
  commandPaletteTrigger = document.activeElement;
  [...document.body.children].forEach(element => {
    if (element !== overlay) element.inert = true;
  });
  overlay.classList.add('visible');
  overlay.setAttribute('aria-hidden', 'false');
  input.value = '';
  renderCommandPalette('');
  requestAnimationFrame(() => input.focus());
}

function closeCommandPalette() {
  const overlay = document.getElementById('commandPaletteOverlay');
  if (!overlay?.classList.contains('visible')) return;
  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
  [...document.body.children].forEach(element => {
    if (element !== overlay) element.inert = false;
  });
  if (commandPaletteTrigger?.focus) commandPaletteTrigger.focus();
}

function trapOverlayFocus(e, overlayId) {
  if (e.key !== 'Tab') return false;
  const overlay = document.getElementById(overlayId);
  if (!overlay?.classList.contains('visible')) return false;
  const focusable = [...overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hidden && element.getClientRects().length > 0);
  if (!focusable.length) return false;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

function trapCommandPaletteFocus(e) {
  return trapOverlayFocus(e, 'commandPaletteOverlay');
}

function trapImportPreviewFocus(e) {
  return trapOverlayFocus(e, 'importPreviewOverlay');
}

function trapMappingWizardFocus(e) {
  return trapOverlayFocus(e, 'mappingWizardOverlay');
}

let pendingMappingWizard = null;
let mappingWizardTrigger = null;

function mappingSelectMarkup(field, columns, selected, kind) {
  const options = ['<option value="">不映射</option>', ...columns.map(column =>
    `<option value="${escapeHtml(column)}"${column === selected ? ' selected' : ''}>${escapeHtml(column)}</option>`)].join('');
  return `<label class="mapping-field${field.required ? ' required' : ''}"><span>${escapeHtml(field.label)}</span><select data-mapping-kind="${kind}" data-mapping-field="${field.id}" onchange="updateMappingAutoLayoutDefault()">${options}</select></label>`;
}

function renderMappingFields(kind, columns, selected) {
  const fields = kind === 'connection'
    ? DiagramWeaveFieldMapping.CONNECTION_FIELDS
    : DiagramWeaveFieldMapping.NODE_FIELDS;
  const container = document.getElementById(kind === 'connection' ? 'connectionMappingFields' : 'nodeMappingFields');
  container.innerHTML = fields.map(field => mappingSelectMarkup(field, columns, selected[field.id], kind)).join('');
}

function collectCurrentMapping(kind) {
  return Object.fromEntries([...document.querySelectorAll(`[data-mapping-kind="${kind}"]`)]
    .map(select => [select.dataset.mappingField, select.value]));
}

function updateMappingAutoLayoutDefault() {
  const mapping = collectCurrentMapping('node');
  document.getElementById('mappingAutoLayout').checked = !DiagramWeaveFieldMapping.hasCoordinateMapping(mapping);
}

function refreshMappingPresetSelect(selectedName = '') {
  const select = document.getElementById('mappingPresetSelect');
  let presets = [];
  try { presets = DiagramWeaveFieldMapping.listPresets(); } catch { /* storage unavailable */ }
  select.innerHTML = '<option value="">选择预设</option>' + presets.map(preset =>
    `<option value="${escapeHtml(preset.name)}"${preset.name === selectedName ? ' selected' : ''}>${escapeHtml(preset.name)}</option>`).join('');
}

function startMappingWizard(options) {
  const nodeRows = Array.isArray(options?.nodeRows) ? options.nodeRows : [];
  const connectionRows = Array.isArray(options?.connectionRows) ? options.connectionRows : [];
  const nodeColumns = DiagramWeaveFieldMapping.detectColumns(nodeRows);
  const connectionColumns = DiagramWeaveFieldMapping.detectColumns(connectionRows);
  const nodeMapping = options.nodeMapping || DiagramWeaveFieldMapping.suggestMapping(nodeColumns, 'node');
  const connectionMapping = options.connectionMapping || DiagramWeaveFieldMapping.suggestMapping(connectionColumns, 'connection');
  pendingMappingWizard = { ...options, nodeRows, connectionRows, nodeColumns, connectionColumns };
  mappingWizardTrigger = document.activeElement;
  renderMappingFields('node', nodeColumns, nodeMapping);
  renderMappingFields('connection', connectionColumns, connectionMapping);
  document.getElementById('mappingWizardSource').textContent = `${options.sourceName || '导入数据'} · 选择来源列，然后生成预览`;
  document.getElementById('mappingValidation').textContent = '';
  document.getElementById('mappingPresetName').value = '';
  refreshMappingPresetSelect();
  updateMappingAutoLayoutDefault();
  const overlay = document.getElementById('mappingWizardOverlay');
  [...document.body.children].forEach(element => { if (element !== overlay) element.inert = true; });
  overlay.classList.add('visible');
  overlay.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => document.querySelector('#nodeMappingFields select')?.focus());
}

function cancelMappingWizard() {
  const overlay = document.getElementById('mappingWizardOverlay');
  if (!overlay?.classList.contains('visible')) return;
  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
  [...document.body.children].forEach(element => { if (element !== overlay) element.inert = false; });
  pendingMappingWizard = null;
  if (mappingWizardTrigger?.focus) mappingWizardTrigger.focus();
}

function saveCurrentMappingPreset() {
  const name = document.getElementById('mappingPresetName').value.trim();
  const validation = document.getElementById('mappingValidation');
  if (!name) { validation.textContent = '请输入预设名称'; return; }
  try {
    DiagramWeaveFieldMapping.savePreset(name, {
      node: collectCurrentMapping('node'), connection: collectCurrentMapping('connection'),
    });
    refreshMappingPresetSelect(name);
    validation.textContent = '预设已保存到当前浏览器';
  } catch (error) {
    validation.textContent = error?.message || '预设保存失败';
  }
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

function loadSelectedMappingPreset(name) {
  if (!name || !pendingMappingWizard) return;
  const preset = DiagramWeaveFieldMapping.loadPreset(name);
  if (!preset) return;
  renderMappingFields('node', pendingMappingWizard.nodeColumns, preset.node || {});
  renderMappingFields('connection', pendingMappingWizard.connectionColumns, preset.connection || {});
  document.getElementById('mappingPresetName').value = preset.name;
  updateMappingAutoLayoutDefault();
}

function continueMappingToPreview() {
  if (!pendingMappingWizard) return false;
  const nodeMapping = collectCurrentMapping('node');
  const connectionMapping = collectCurrentMapping('connection');
  const nodeResult = DiagramWeaveFieldMapping.mapRows(pendingMappingWizard.nodeRows, nodeMapping, 'node');
  const connectionResult = DiagramWeaveFieldMapping.mapRows(pendingMappingWizard.connectionRows, connectionMapping, 'connection');
  const mappingIssues = [...nodeResult.issues, ...(pendingMappingWizard.connectionRows.length ? connectionResult.issues : [])];
  if (mappingIssues.length) {
    document.getElementById('mappingValidation').textContent = mappingIssues.map(item => item.reason).join('；');
    return false;
  }
  const autoLayout = document.getElementById('mappingAutoLayout').checked;
  const sourceName = pendingMappingWizard.sourceName || '映射数据';
  const preview = DiagramWeaveExtensionKernel.invokeExtension('import.preview.tabular', {
    nodes: nodeResult.rows, connections: connectionResult.rows, sourceType: pendingMappingWizard.sourceType || 'excel',
  });
  const applyHook = pendingMappingWizard.onApply;
  cancelMappingWizard();
  showImportPreview(preview, {
    sourceName,
    apply: document => {
      const loaded = applyHook ? applyHook(document) : loadFlowDocumentPayload(document);
      if (loaded !== false && autoLayout && state.nodes.length > 1) autoLayoutNodes('TB', 'normal');
      return loaded;
    },
  });
  return true;
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

function renderRoutingRulesPanel() {
  if (typeof DiagramWeaveRoutingRules === 'undefined') return;
  state.routingRules = DiagramWeaveRoutingRules.normalizeRules(state.routingRules);
  document.getElementById('routingEndpointLock').checked = state.routingRules.endpointLock;
  document.getElementById('routingObstaclePadding').value = state.routingRules.obstaclePadding;
  document.getElementById('routingBridgeBehavior').value = state.routingRules.bridgeBehavior;
  document.getElementById('routingBridgeSize').value = state.routingRules.bridgeSize;
  document.getElementById('routingDefaultLabel').value = state.routingRules.defaultLabelPlacement;
  const conn = state.connections.find(item => item.id === state.selectedConnectionId);
  document.getElementById('routingNoConnection').hidden = Boolean(conn);
  const controls = document.getElementById('routingConnectionControls'); controls.hidden = !conn;
  if (!conn) return;
  Object.assign(conn, DiagramWeaveRoutingRules.normalizeConnectionRouting(conn, state.routingRules.defaultLabelPlacement));
  document.getElementById('routingConnLabel').value = conn.labelPlacement;
  document.getElementById('routingLabelOffsetX').value = conn.labelOffset?.x || 0;
  document.getElementById('routingLabelOffsetY').value = conn.labelOffset?.y ?? -12;
  const list = document.getElementById('routingWaypointList');
  list.replaceChildren(...conn.waypoints.map((point, index) => {
    const row = document.createElement('div'); row.className = 'routing-waypoint-row';
    const x = document.createElement('label'); x.textContent = `X ${index + 1}`; const xi = document.createElement('input'); xi.type = 'number'; xi.value = point.x; xi.disabled = point.locked; xi.addEventListener('change', () => moveSelectedConnectionWaypoint(index, 'x', xi.value)); x.append(xi);
    const y = document.createElement('label'); y.textContent = `Y ${index + 1}`; const yi = document.createElement('input'); yi.type = 'number'; yi.value = point.y; yi.disabled = point.locked; yi.addEventListener('change', () => moveSelectedConnectionWaypoint(index, 'y', yi.value)); y.append(yi);
    const lock = document.createElement('label'); lock.textContent = 'Lock'; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = point.locked; checkbox.addEventListener('change', () => lockSelectedConnectionWaypoint(index, checkbox.checked)); lock.append(checkbox);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.addEventListener('click', () => removeSelectedConnectionWaypoint(index));
    row.append(x, y, lock, remove); return row;
  }));
}

function showRoutingRulesPanel() {
  renderRoutingRulesPanel(); const overlay = document.getElementById('routingRulesOverlay'); overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('visible');
}
function hideRoutingRulesPanel() { const overlay = document.getElementById('routingRulesOverlay'); overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
function updateRoutingRulesFromPanel() {
  saveState(); state.routingRules = DiagramWeaveRoutingRules.normalizeRules({
    endpointLock: document.getElementById('routingEndpointLock').checked,
    obstaclePadding: document.getElementById('routingObstaclePadding').value,
    bridgeBehavior: document.getElementById('routingBridgeBehavior').value,
    bridgeSize: document.getElementById('routingBridgeSize').value,
    defaultLabelPlacement: document.getElementById('routingDefaultLabel').value,
  }); renderConnections();
}
function updateSelectedConnectionRouting() {
  const conn = state.connections.find(item => item.id === state.selectedConnectionId); if (!conn) return;
  saveState(); conn.labelPlacement = document.getElementById('routingConnLabel').value;
  conn.labelOffset = { x: Number(document.getElementById('routingLabelOffsetX').value) || 0, y: Number(document.getElementById('routingLabelOffsetY').value) || 0 };
  Object.assign(conn, DiagramWeaveRoutingRules.normalizeConnectionRouting(conn, state.routingRules.defaultLabelPlacement)); renderConnections();
}
function addSelectedConnectionWaypoint() {
  const conn = state.connections.find(item => item.id === state.selectedConnectionId); if (!conn) return;
  const fromNode = state.nodes.find(node => node.id === conn.from); const toNode = state.nodes.find(node => node.id === conn.to); if (!fromNode || !toNode) return;
  saveState(); conn.waypoints ||= []; conn.waypoints.push({ x: (fromNode.x + fromNode.w / 2 + toNode.x + toNode.w / 2) / 2, y: (fromNode.y + fromNode.h / 2 + toNode.y + toNode.h / 2) / 2, locked: false });
  renderConnections(); renderRoutingRulesPanel();
}
function moveSelectedConnectionWaypoint(index, axis, value) { const conn = state.connections.find(item => item.id === state.selectedConnectionId); const point = conn?.waypoints?.[index]; if (!point || point.locked) return; saveState(); point[axis] = Number(value) || 0; renderConnections(); }
function lockSelectedConnectionWaypoint(index, locked) { const conn = state.connections.find(item => item.id === state.selectedConnectionId); const point = conn?.waypoints?.[index]; if (!point) return; saveState(); point.locked = Boolean(locked); renderConnections(); renderRoutingRulesPanel(); }
function removeSelectedConnectionWaypoint(index) { const conn = state.connections.find(item => item.id === state.selectedConnectionId); if (!conn?.waypoints?.[index]) return; saveState(); conn.waypoints.splice(index, 1); renderConnections(); renderRoutingRulesPanel(); }

function initVersionHistory() {
  if (typeof DiagramWeaveHistory === 'undefined') return;
  versionHistoryStore = DiagramWeaveHistory.createIndexedDbStore(window.indexedDB, { limit: 50, maxBytes: 20 * 1024 * 1024 });
  window.DiagramWeave = window.DiagramWeave || {};
  DiagramWeave.history = versionHistoryStore;
}

async function captureVersionSnapshot(operation = 'Edit', force = false) {
  if (!versionHistoryStore || typeof DiagramWeave === 'undefined') return null;
  const document = getFlowDocumentPayload();
  delete document.versionHistory;
  const fingerprint = JSON.stringify({ pages: document.pages, currentPageId: document.currentPageId, routingRules: document.routingRules });
  if (!force && fingerprint === lastHistoryFingerprint) return null;
  lastHistoryFingerprint = fingerprint;
  return versionHistoryStore.addSnapshot(projectSession.historyId, operation, document);
}

async function renderVersionHistory() {
  const list = document.getElementById('versionHistoryList'); if (!list || !versionHistoryStore) return;
  const rows = await versionHistoryStore.list(projectSession.historyId);
  list.replaceChildren(...rows.map(row => {
    const item = document.createElement('div'); item.className = 'version-history-row'; item.dataset.snapshotId = row.id;
    const detail = document.createElement('div'); const title = document.createElement('strong'); title.textContent = row.operation;
    const meta = document.createElement('div'); meta.className = 'version-history-meta'; meta.textContent = `${new Date(row.createdAt).toLocaleString()} · ${Math.max(1, Math.round(row.bytes / 1024))} KB`; detail.append(title, meta);
    const restore = document.createElement('button'); restore.type = 'button'; restore.textContent = 'Restore'; restore.addEventListener('click', () => restoreVersionSnapshot(row.id));
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete'; remove.addEventListener('click', async () => { await versionHistoryStore.delete(row.id); await renderVersionHistory(); });
    item.append(detail, restore, remove); return item;
  }));
  if (!rows.length) { const empty = document.createElement('p'); empty.className = 'settings-hint'; empty.textContent = 'No local snapshots.'; list.append(empty); }
}

async function showVersionHistory() {
  if (!versionHistoryStore) initVersionHistory(); await renderVersionHistory();
  const overlay = document.getElementById('versionHistoryOverlay'); overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('visible');
}
function hideVersionHistory() { const overlay = document.getElementById('versionHistoryOverlay'); overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
async function createNamedVersionSnapshot() { await captureVersionSnapshot('Manual snapshot', true); await renderVersionHistory(); }
async function restoreVersionSnapshot(id) {
  const row = await versionHistoryStore?.get(id); if (!row) return false;
  await captureVersionSnapshot('Before restore', true);
  const restored = loadFlowDocumentPayload(row.document); if (restored) { hideVersionHistory(); showToast('Version restored'); }
  return restored;
}
async function clearVersionHistory() { await versionHistoryStore?.clear(projectSession.historyId); lastHistoryFingerprint = ''; await renderVersionHistory(); }

let currentQualityIssues = [];
function getQualityDocument() { return getFlowDocumentPayload(); }
function renderQualityChecker() {
  const list = document.getElementById('qualityCheckerList'); const summary = document.getElementById('qualityCheckerSummary');
  if (!list || typeof DiagramWeaveContracts === 'undefined') return;
  currentQualityIssues = DiagramWeaveContracts.inspectQuality(getQualityDocument());
  const locale = typeof DiagramWeaveI18n !== 'undefined' ? DiagramWeaveI18n.getLocale() : 'en';
  const language = locale.startsWith('zh') ? 'zh' : 'en';
  const counts = currentQualityIssues.reduce((result, issue) => { result[issue.severity] = (result[issue.severity] || 0) + 1; return result; }, {});
  summary.textContent = `${currentQualityIssues.length} issues · ${counts.error || 0} errors · ${counts.warning || 0} warnings · ${counts.info || 0} info`;
  list.replaceChildren(...currentQualityIssues.map((issue, index) => {
    const row = document.createElement('div'); row.className = 'quality-issue-row'; row.dataset.issueIndex = index;
    const severity = document.createElement('span'); severity.className = `quality-severity ${issue.severity}`; severity.textContent = issue.severity;
    const message = document.createElement('div'); const title = document.createElement('strong'); title.textContent = issue.message?.[language] || issue.message?.en || issue.rule;
    const meta = document.createElement('div'); meta.className = 'version-history-meta'; meta.textContent = `${issue.rule} · ${issue.targetType}:${issue.targetId}`; message.append(title, meta);
    const locate = document.createElement('button'); locate.type = 'button'; locate.textContent = 'Locate'; locate.addEventListener('click', () => locateQualityIssue(index));
    row.append(severity, message, locate);
    if (issue.fix && issue.fix.destructive === false) { const fix = document.createElement('button'); fix.type = 'button'; fix.textContent = 'Fix'; fix.addEventListener('click', () => applyQualityIssueFix(index)); row.append(fix); }
    return row;
  }));
  if (!currentQualityIssues.length) { const ok = document.createElement('p'); ok.className = 'settings-hint'; ok.textContent = 'No quality issues found.'; list.append(ok); }
}
function showQualityChecker() { renderQualityChecker(); const overlay = document.getElementById('qualityCheckerOverlay'); overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('visible'); }
function hideQualityChecker() { const overlay = document.getElementById('qualityCheckerOverlay'); overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
function locateQualityIssue(index) {
  const issue = currentQualityIssues[index]; if (!issue || typeof DiagramWeave === 'undefined') return;
  const page = DiagramWeave.doc.pages.find(item => issue.targetType === 'node' ? item.nodes.some(node => node.id === issue.targetId) : item.connections.some(connection => connection.id === issue.targetId));
  if (page && page.id !== DiagramWeave.doc.currentPageId) DiagramWeave.switchPage(page.id);
  hideQualityChecker(); if (issue.targetType === 'node') selectNode(issue.targetId); else selectConnection(issue.targetId);
}
function applyQualityIssueFix(index) {
  const issue = currentQualityIssues[index]; if (!issue?.fix || issue.fix.destructive !== false) return false;
  if (issue.fix.id === 'assign-default-label' && issue.targetType === 'node') {
    const page = DiagramWeave.doc.pages.find(item => item.nodes.some(node => node.id === issue.targetId)); const node = page?.nodes.find(item => item.id === issue.targetId); if (!node) return false;
    saveState(); node.label = node.shape || 'Process'; if (page.id === DiagramWeave.doc.currentPageId) { state.nodes = page.nodes; clearCanvasNodes(); renderAll(); }
    renderQualityChecker(); return true;
  }
  return false;
}

let currentProcessAnalysis = null;
function analysisNodeButton(pageId, nodeId) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'analysis-node-link'; button.textContent = nodeId;
  button.addEventListener('click', () => locateAnalysisNode(pageId, nodeId)); return button;
}
function analysisMetric(label, value) {
  const item = document.createElement('div'); item.className = 'analysis-metric';
  const title = document.createElement('strong'); title.textContent = label; const content = document.createElement('span'); content.textContent = value;
  item.append(title, content); return item;
}
function renderProcessAnalysis() {
  const list = document.getElementById('processAnalysisList'); const summary = document.getElementById('processAnalysisSummary');
  if (!list || typeof DiagramWeaveProcessAnalysis === 'undefined') return;
  currentProcessAnalysis = DiagramWeaveProcessAnalysis.analyzeProcess(getQualityDocument());
  const total = currentProcessAnalysis.summary;
  summary.textContent = `${total.pageCount} pages · ${total.unreachableCount} unreachable · ${total.bottleneckCount} bottlenecks · ${total.cycleCount} cycles · ${total.slaRiskCount} SLA risks`;
  list.replaceChildren(...currentProcessAnalysis.pages.map(page => {
    const section = document.createElement('section'); section.className = 'process-analysis-page';
    const heading = document.createElement('h3'); heading.textContent = page.pageName || page.pageId || 'Page';
    const metrics = document.createElement('div'); metrics.className = 'analysis-metrics';
    metrics.append(
      analysisMetric('Critical path / 关键路径', page.criticalPath.length ? `${page.criticalPath.join(' → ')} (${page.criticalDuration}d)` : 'None / 无'),
      analysisMetric('Unreachable / 不可达', page.unreachable.length ? page.unreachable.join(', ') : '0'),
      analysisMetric('Bottlenecks / 瓶颈', page.bottlenecks.length ? page.bottlenecks.map(row => row.nodeId).join(', ') : '0'),
      analysisMetric('Longest wait / 最长等待', page.longestWait ? `${page.longestWait.nodeId}: ${page.longestWait.days}d` : 'Not configured / 未配置'),
      analysisMetric('Cycles / 循环', page.cycles.length ? page.cycles.map(group => group.join(' → ')).join('; ') : '0'),
      analysisMetric('SLA', !page.sla.configured ? 'Not configured / 未配置' : page.sla.risk ? `Risk / 风险 (+${page.sla.overBy}d)` : `Within ${page.sla.days}d / 达标`),
      analysisMetric('Role load / 角色负荷', page.roleLoad.length ? page.roleLoad.map(row => `${row.role}: ${row.nodeCount} / ${row.duration}d`).join('; ') : 'None / 无')
    );
    const targets = document.createElement('div'); targets.className = 'version-history-meta'; targets.append('Targets / 目标: ');
    [...new Set([...page.criticalPath, ...page.unreachable, ...page.bottlenecks.map(row => row.nodeId)])].forEach(id => targets.append(analysisNodeButton(page.pageId, id)));
    section.append(heading, metrics, targets); return section;
  }));
}
function showProcessAnalysis() { renderProcessAnalysis(); const overlay = document.getElementById('processAnalysisOverlay'); overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('visible'); overlay.querySelector('.dialog-close-btn')?.focus(); }
function hideProcessAnalysis() { const overlay = document.getElementById('processAnalysisOverlay'); overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
function locateAnalysisNode(pageId, nodeId) {
  if (typeof DiagramWeave === 'undefined') return;
  if (pageId && pageId !== DiagramWeave.doc.currentPageId) DiagramWeave.switchPage(pageId);
  hideProcessAnalysis(); selectNode(nodeId);
}

function getReviewThreads() {
  if (typeof DiagramWeave === 'undefined') return [];
  if (!Array.isArray(DiagramWeave.doc.reviewThreads)) DiagramWeave.doc.reviewThreads = [];
  return DiagramWeave.doc.reviewThreads;
}
function selectedReviewTarget() {
  if (state.selectedNodeId) return { targetType: 'node', targetId: state.selectedNodeId };
  if (state.selectedConnectionId) return { targetType: 'connection', targetId: state.selectedConnectionId };
  return null;
}
function findReviewTarget(thread) {
  for (const page of DiagramWeave.doc.pages || []) {
    const exists = thread.targetType === 'connection' ? (page.connections || []).some(item => item.id === thread.targetId) : (page.nodes || []).some(item => item.id === thread.targetId);
    if (exists) return page;
  }
  return null;
}
function reviewStatusLabel(status) {
  return ({ pending: 'Pending / 待确认', approved: 'Approved / 已批准', changes_requested: 'Changes requested / 需修改', resolved: 'Resolved / 已解决' })[status] || status;
}
function renderReviewPanel() {
  const list = document.getElementById('reviewList'); const summary = document.getElementById('reviewTargetSummary'); const composer = document.getElementById('reviewComposer');
  if (!list || typeof DiagramWeaveContracts === 'undefined') return;
  const target = selectedReviewTarget(); summary.textContent = target ? `Selected ${target.targetType}: ${target.targetId}` : 'Select a node or connection to create a thread. / 请选择节点或连线';
  composer?.querySelector('button')?.toggleAttribute('disabled', !target);
  const threads = getReviewThreads(); list.replaceChildren(...threads.map(thread => {
    const section = document.createElement('section'); section.className = 'review-thread'; section.dataset.threadId = thread.id;
    const head = document.createElement('div'); head.className = 'review-thread-head'; const title = document.createElement('strong'); title.textContent = `${thread.targetType}:${thread.targetId}`;
    const status = document.createElement('select'); status.setAttribute('aria-label', `Review status for ${thread.targetId}`);
    DiagramWeaveContracts.REVIEW_STATUSES.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = reviewStatusLabel(value); status.append(option); }); status.value = thread.status;
    if (isMobileViewMode()) status.disabled = true; else status.addEventListener('change', () => updateReviewThreadStatus(thread.id, status.value));
    const locate = document.createElement('button'); locate.type = 'button'; locate.textContent = findReviewTarget(thread) ? 'Locate / 定位' : 'Missing target / 目标缺失'; locate.disabled = !findReviewTarget(thread); locate.addEventListener('click', () => locateReviewThread(thread.id));
    head.append(title, status, locate); section.append(head);
    (thread.comments || []).forEach(comment => { const row = document.createElement('div'); row.className = 'review-comment'; const meta = document.createElement('div'); meta.className = 'review-comment-meta'; meta.textContent = `${comment.author || 'Anonymous'} · ${comment.createdAt || ''}`; const body = document.createElement('div'); body.textContent = comment.body; row.append(meta, body); section.append(row); });
    const form = document.createElement('form'); form.className = 'review-comment-form'; const body = document.createElement('textarea'); body.maxLength = 5000; body.required = true; body.placeholder = 'Reply / 回复'; body.setAttribute('aria-label', `Reply to ${thread.targetId}`); const add = document.createElement('button'); add.type = 'submit'; add.textContent = 'Add / 添加'; form.append(body, add); form.addEventListener('submit', event => { event.preventDefault(); appendReviewComment(thread.id, body.value); }); section.append(form);
    return section;
  }));
  if (!threads.length) { const empty = document.createElement('p'); empty.className = 'settings-hint'; empty.textContent = 'No review threads. / 暂无审阅线程'; list.append(empty); }
}
function showReviewPanel() { renderReviewPanel(); const overlay = document.getElementById('reviewOverlay'); overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('visible'); overlay.querySelector('.dialog-close-btn')?.focus(); }
function hideReviewPanel() { const overlay = document.getElementById('reviewOverlay'); overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
function createSelectedReviewThread(event) {
  event?.preventDefault(); if (isMobileViewMode()) return false; const target = selectedReviewTarget(); const body = document.getElementById('reviewBody')?.value || ''; if (!target || !body.trim()) return false;
  let thread = DiagramWeaveContracts.createReviewThread({ ...target, id: `review_${Date.now()}_${getReviewThreads().length + 1}` });
  thread = DiagramWeaveContracts.addReviewComment(thread, { author: document.getElementById('reviewAuthor')?.value || '', body }); getReviewThreads().push(thread);
  document.getElementById('reviewBody').value = ''; void captureVersionSnapshot('Review comment', true); renderReviewPanel(); return true;
}
function appendReviewComment(threadId, body) {
  if (isMobileViewMode()) return false; const threads = getReviewThreads(); const index = threads.findIndex(thread => thread.id === threadId); if (index < 0) return false;
  try { threads[index] = DiagramWeaveContracts.addReviewComment(threads[index], { author: document.getElementById('reviewAuthor')?.value || '', body }); } catch { return false; }
  void captureVersionSnapshot('Review comment', true); renderReviewPanel(); return true;
}
function updateReviewThreadStatus(threadId, status) {
  if (isMobileViewMode()) return false; const threads = getReviewThreads(); const index = threads.findIndex(thread => thread.id === threadId); if (index < 0) return false;
  threads[index] = DiagramWeaveContracts.setReviewStatus(threads[index], status); void captureVersionSnapshot('Review status', true); renderReviewPanel(); return true;
}
function locateReviewThread(threadId) {
  const thread = getReviewThreads().find(item => item.id === threadId); const page = thread && findReviewTarget(thread); if (!thread || !page) return false;
  if (page.id !== DiagramWeave.doc.currentPageId) DiagramWeave.switchPage(page.id); hideReviewPanel(); if (thread.targetType === 'connection') selectConnection(thread.targetId); else selectNode(thread.targetId); return true;
}

function renderAISettings() {
  if (typeof DiagramWeaveContracts === 'undefined') return;
  const toggle = document.getElementById('aiGlobalEnabled'); const list = document.getElementById('aiProviderList'); const preview = document.getElementById('aiDataPreview');
  toggle.checked = DiagramWeaveContracts.isAIEnabled(); const providers = DiagramWeaveContracts.listAIProviders(); list.replaceChildren(...providers.map(provider => { const row = document.createElement('div'); row.className = 'ai-provider-row'; row.textContent = `${provider.name} (${provider.id}) · ${provider.enabled ? 'enabled' : 'disabled'} · ${(provider.capabilities || []).join(', ')}`; return row; }));
  if (!providers.length) { const empty = document.createElement('p'); empty.className = 'settings-hint'; empty.textContent = 'No AI providers registered. / 未注册 AI 提供者'; list.append(empty); }
  preview.textContent = JSON.stringify(DiagramWeaveContracts.createAIDataPreview(getFlowDocumentPayload()), null, 2);
}
function showAISettings() { renderAISettings(); const overlay = document.getElementById('aiSettingsOverlay'); overlay.setAttribute('aria-hidden', 'false'); overlay.classList.add('visible'); overlay.querySelector('.dialog-close-btn')?.focus(); }
function hideAISettings() { const overlay = document.getElementById('aiSettingsOverlay'); overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
function setGlobalAIState(enabled) { if (typeof DiagramWeaveContracts === 'undefined') return false; DiagramWeaveContracts.setAIEnabled(enabled === true); renderAISettings(); return DiagramWeaveContracts.isAIEnabled(); }

function updateCanvasEmptyState() {
  const emptyState = document.getElementById('canvasEmptyState');
  if (emptyState) emptyState.hidden = state.nodes.length > 0 || emptyState.dataset.dismissed === 'true';
}

function dismissCanvasEmptyState() {
  const emptyState = document.getElementById('canvasEmptyState');
  if (emptyState) {
    emptyState.dataset.dismissed = 'true';
    emptyState.hidden = true;
  }
  canvasWrapper.focus();
}

function togglePanelDrawer(panel) {
  const className = panel === 'properties' ? 'properties-drawer-open' : 'shapes-drawer-open';
  document.body.classList.toggle(className);
  if (panel === 'properties') document.body.classList.remove('shapes-drawer-open');
  else document.body.classList.remove('properties-drawer-open');
}

function updatePropTextColor(value) {
  if (value === 'custom' || value === '__mixed__') return;
  const next = typeof DiagramWeaveSanitize !== 'undefined'
    ? DiagramWeaveSanitize.sanitizeTextColor(value)
    : value;
  applyBatchNodeProperty('textColor', next);
}

function updatePropTargetPage(pageId) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.targetPageId = pageId || null;
  renderNode(node);
  syncFlowTableRowFromNode(node);
}

function navigateOffpageTarget() {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node?.targetPageId || typeof DiagramWeave === 'undefined') {
    showToast('请先选择目标页');
    return;
  }
  DiagramWeave.switchPage(node.targetPageId);
}

function updatePropLayer(layerId) {
  if (!Number.isFinite(layerId)) return;
  applyBatchNodeProperty('layer', layerId);
}

// 更新流程耗时统计
function updateTimeSummary() {
  const stats = computeFlowPageStats();
  document.getElementById('propTotalDuration').textContent = formatDurationDays(stats.totalDuration);
  document.getElementById('propNodeCount').textContent = stats.totalShapes;
  if (!state.selectedNodeId && !state.selectedConnectionId) {
    updatePagePropertiesPanel();
  }
}

// ===== 右键菜单 =====
function showContextMenu(x, y) {
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.classList.add('visible');
}

function hideContextMenu() {
  contextMenu.classList.remove('visible');
}

// ===== Toast =====
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ===== 拖拽形状到画布 =====
document.querySelectorAll('.shape-item[draggable]').forEach(bindShapeItemElement);

canvasWrapper.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

canvasWrapper.addEventListener('drop', (e) => {
  e.preventDefault();
  if (isMobileViewMode()) return;
  const shape = e.dataTransfer.getData('shape');
  const label = e.dataTransfer.getData('label');
  if (!shape) return;

  const rect = canvasWrapper.getBoundingClientRect();
  const x = (e.clientX - rect.left - state.panX) / state.zoom;
  const y = (e.clientY - rect.top - state.panY) / state.zoom;
  const defaults = shapeDefaults[shape] || { w: 140, h: 60 };

  saveState();
  const node = createNode(shape, x - defaults.w / 2, y - defaults.h / 2, label);
  state.nodes.push(node);
  recordRecentShape(shape);
  selectNode(node.id);
  showToast(typeof t === 'function' ? t('toast.addedShape', { label }) : `已添加「${label}」`);
});

// ===== 画布鼠标事件 =====
canvasWrapper.addEventListener('mousedown', (e) => {
  hideContextMenu();

  // 手指工具、空格键或中键拖动画布
  if (state.tool === 'pan' || state.spacePressed || e.button === 1) {
    state.isPanning = true;
    state.panStart = { x: e.clientX - state.panX, y: e.clientY - state.panY };
    canvasWrapper.style.cursor = 'grabbing';
    e.preventDefault();
    return;
  }

  // 点击空白区域取消选中
  if (e.target === canvasWrapper || e.target === canvas || e.target.classList.contains('canvas-grid-bg') || e.target === canvasTransform || e.target === connectionsLayer) {
    deselectAll();
  }
});

canvasWrapper.addEventListener('mousemove', (e) => {
  if (state.isPanning) {
    state.panX = e.clientX - state.panStart.x;
    state.panY = e.clientY - state.panStart.y;
    updateTransform();
    return;
  }

  if (state.isDragging && state.dragNode) {
    const rect = canvasWrapper.getBoundingClientRect();
    const mx = (e.clientX - rect.left - state.panX) / state.zoom;
    const my = (e.clientY - rect.top - state.panY) / state.zoom;
    state.dragNode.x = mx - state.dragOffset.x;
    state.dragNode.y = my - state.dragOffset.y;
    renderNode(state.dragNode);
    updateConnectionsForNode(state.dragNode.id);
    updateProperties();
    return;
  }

});

canvasWrapper.addEventListener('mouseup', (e) => {
  if (state.isPanning) {
    state.isPanning = false;
    canvasWrapper.style.cursor = state.tool === 'connect' ? 'crosshair' : state.tool === 'pan' ? 'grab' : 'default';
    return;
  }

  if (state.isDragging) {
    state.isDragging = false;
    state.dragNode = null;
  }

});

// ===== 缩放 =====
canvasWrapper.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.08 : 0.08;
  const rect = canvasWrapper.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const oldZoom = state.zoom;
  const newZoom = Math.max(0.2, Math.min(3, oldZoom + delta));
  const ratio = newZoom / oldZoom;

  state.panX = mx - ratio * (mx - state.panX);
  state.panY = my - ratio * (my - state.panY);
  state.zoom = newZoom;

  document.getElementById('zoom-level').textContent = Math.round(state.zoom * 100) + '%';
  updateTransform();
}, { passive: false });

// ===== 键盘事件 =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLocaleLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (e.key === 'Escape' && document.getElementById('commandPaletteOverlay')?.classList.contains('visible')) {
    e.preventDefault();
    closeCommandPalette();
    return;
  }
  if (e.key === 'Escape' && document.getElementById('importPreviewOverlay')?.classList.contains('visible')) {
    e.preventDefault();
    cancelImportPreview();
    return;
  }
  if (e.key === 'Escape' && document.getElementById('mappingWizardOverlay')?.classList.contains('visible')) {
    e.preventDefault();
    cancelMappingWizard();
    return;
  }
  if (trapCommandPaletteFocus(e)) return;
  if (trapImportPreviewFocus(e)) return;
  if (trapMappingWizardFocus(e)) return;
  if (e.target.contentEditable === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // 演示模式快捷键
  if (presentState.active) {
    if (e.key === 'Escape') {
      e.preventDefault();
      exitPresentation();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      presentNext();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      presentPrev();
      return;
    }
    // 演示模式下屏蔽其他快捷键
    return;
  }

  if (isMobileViewMode()) return;

  if (e.key === ' ') {
    e.preventDefault();
    state.spacePressed = true;
    canvasWrapper.style.cursor = 'grab';
  }

  if (e.key === 'v' || e.key === 'V') setTool('select');
  if (e.key === 'l' || e.key === 'L') setTool('connect');
  if (e.key === 'h' || e.key === 'H') setTool('pan');
  if (e.key === 't' || e.key === 'T') toggleTextEditor();
  if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();

  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
  if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); duplicateSelected(); }

  // 方向键微调
  if (state.selectedNodeId && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!node) return;
    const step = e.shiftKey ? 10 : 1;
    saveState();
    if (e.key === 'ArrowUp') node.y -= step;
    if (e.key === 'ArrowDown') node.y += step;
    if (e.key === 'ArrowLeft') node.x -= step;
    if (e.key === 'ArrowRight') node.x += step;
    renderNode(node);
    updateConnectionsForNode(node.id);
    updateProperties();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    state.spacePressed = false;
    canvasWrapper.style.cursor = state.tool === 'connect' ? 'crosshair' : 'default';
  }
});

// ===== 点击其他区域关闭菜单 =====
document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) hideContextMenu();
  const connMenu = document.getElementById('connContextMenu');
  if (connMenu && !connMenu.contains(e.target)) hideConnContextMenu();
  // 点击遮罩关闭弹窗
  if (e.target.id === 'confirmOverlay') {
    document.getElementById('confirmOverlay').classList.remove('visible');
  }
  if (e.target.id === 'layoutOverlay') {
    hideLayoutDialog();
  }
});

// ===== 流程文本编辑 =====
const FC_TEXT_VERSION = 2;

function escapeFlowField(val) {
  return String(val ?? '').replace(/\|/g, '/').replace(/\n/g, ' ').trim();
}

function isKnownFlowShape(val) {
  return !!val && Object.prototype.hasOwnProperty.call(shapeDefaults, val);
}

function formatTargetPageForText(node) {
  if (!node.targetPageId || typeof DiagramWeave === 'undefined') return '';
  const page = DiagramWeave.getPageById(node.targetPageId);
  return page ? page.name : node.targetPageId;
}

function resolveTargetPageFromText(raw) {
  const trimmed = escapeFlowField(raw);
  if (!trimmed || typeof DiagramWeave === 'undefined') return null;
  const byId = DiagramWeave.doc.pages.find(p => p.id === trimmed);
  if (byId) return byId.id;
  const byName = DiagramWeave.doc.pages.find(p => p.name === trimmed);
  return byName ? byName.id : null;
}

function toggleTextEditor() {
  const panel = document.getElementById('textEditorPanel');
  const isOpen = panel.classList.toggle('open');
  document.getElementById('btn-text-editor').classList.toggle('active', isOpen);
  if (isOpen) {
    syncTextFromCanvas(true);
    initFastTooltips(panel);
  }
}

function syncTextFromCanvas(silent) {
  ensureNodeRefIds();
  document.getElementById('flowTextArea').value = flowToText();
  renderFlowTableFromState();
  if (!silent) showToast('已从图形刷新表格');
}

function switchFlowTableTab(tab) {
  document.querySelectorAll('.flow-table-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.flowTab === tab);
  });
  document.getElementById('flowNodeTable').style.display = tab === 'nodes' ? '' : 'none';
  document.getElementById('flowConnTable').style.display = tab === 'connections' ? '' : 'none';
  document.getElementById('flowNodeToolbar').style.display = tab === 'nodes' ? '' : 'none';
  document.getElementById('flowConnToolbar').style.display = tab === 'connections' ? '' : 'none';
  if (tab === 'connections') renderFlowTableFromState();
}

function buildShapeSelectOptions(selected) {
  const keys = Object.keys(shapeDefaults).sort((a, b) =>
    (shapeNames[a] || a).localeCompare(shapeNames[b] || b, 'zh-CN'));
  return keys.map(k =>
    `<option value="${k}"${k === selected ? ' selected' : ''}>${escapeHtml(shapeNames[k] || k)}</option>`).join('');
}

function getNextFlowTableRefId() {
  let max = 0;
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    const v = parseInt(tr.querySelector('[data-f="refId"]')?.value, 10);
    if (!isNaN(v) && v > max) max = v;
  });
  state.nodes.forEach(n => {
    const v = parseInt(n.refId, 10);
    if (!isNaN(v) && v > max) max = v;
  });
  return max + 1;
}

function createFlowNodeTableRow(row) {
  const tr = document.createElement('tr');
  tr.dataset.refId = row.refId;
  tr.innerHTML = `
    <td><input data-f="refId" type="number" min="1" value="${escapeHtml(String(row.refId))}"></td>
    <td><input data-f="label" type="text" value="${escapeHtml(row.label || '')}" placeholder="简介"></td>
    <td class="col-next"><span class="flow-table-readonly" data-f="next">${escapeHtml(row.next || '—')}</span></td>
    <td><input data-f="role" type="text" value="${escapeHtml(row.role || '')}" placeholder="角色"></td>
    <td><select data-f="shape">${buildShapeSelectOptions(row.shape || 'rectangle')}</select></td>
    <td><textarea data-f="detail" rows="1">${escapeHtml(row.detail || '')}</textarea></td>
    <td><input data-f="duration" type="number" min="0" step="0.5" value="${row.duration ?? 0}"></td>
    <td><input data-f="lane" type="number" min="0" value="${row.lane !== '' && row.lane !== undefined ? row.lane : ''}"></td>
    <td><input data-f="layer" type="number" min="0" value="${row.layer !== '' && row.layer !== undefined ? row.layer : ''}"></td>
    <td><input data-f="targetPage" type="text" value="${escapeHtml(row.targetPage || '')}" placeholder="页名"></td>
  `;
  tr.querySelector('[data-f="refId"]').addEventListener('change', (e) => {
    tr.dataset.refId = e.target.value;
  });
  tr.addEventListener('click', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    const refId = tr.querySelector('[data-f="refId"]').value;
    focusFlowTableNodeRow(refId);
  });
  return tr;
}

function createFlowConnTableRow(row, connId) {
  const tr = document.createElement('tr');
  if (connId) tr.dataset.connId = connId;
  tr.innerHTML = `
    <td><input data-f="from" type="number" min="1" value="${row.from ?? ''}"></td>
    <td><input data-f="to" type="number" min="1" value="${row.to ?? ''}"></td>
    <td><input data-f="label" type="text" value="${escapeHtml(row.label || '')}" placeholder="条件"></td>
  `;
  tr.addEventListener('click', (e) => {
    if (e.target.closest('input')) return;
    document.querySelectorAll('#flowConnTableBody tr').forEach(r => r.classList.remove('selected'));
    tr.classList.add('selected');
    if (connId) selectConnection(connId);
  });
  return tr;
}

function renderFlowTableFromState() {
  ensureNodeRefIds();
  const refByNodeId = new Map(state.nodes.map(n => [n.id, n.refId]));
  const nodeBody = document.getElementById('flowNodeTableBody');
  const connBody = document.getElementById('flowConnTableBody');
  if (!nodeBody || !connBody) return;

  nodeBody.innerHTML = '';
  [...state.nodes]
    .sort((a, b) => (a.refId || 0) - (b.refId || 0))
    .forEach(n => {
      nodeBody.appendChild(createFlowNodeTableRow({
        refId: n.refId,
        label: n.label,
        next: formatNodeOutgoingConnections(n) || '—',
        role: n.role || '',
        shape: n.shape,
        detail: n.detail || '',
        duration: n.duration || 0,
        lane: n.lane ?? '',
        layer: n.layer ?? '',
        targetPage: formatTargetPageForText(n),
      }));
    });

  connBody.innerHTML = '';
  let connCount = 0;
  state.connections.forEach(c => {
    const from = refByNodeId.get(c.from);
    const to = refByNodeId.get(c.to);
    if (from === undefined || to === undefined) return;
    connCount++;
    connBody.appendChild(createFlowConnTableRow({ from, to, label: c.label || '' }, c.id));
  });
  if (connCount === 0) {
    connBody.innerHTML = '<tr class="flow-table-empty"><td colspan="3">暂无连线。在画布上用连线工具拖拽，或点「+ 添加连线行」。</td></tr>';
  }

  const connTabCount = document.getElementById('flowConnTabCount');
  if (connTabCount) {
    connTabCount.textContent = connCount > 0 ? `(${connCount})` : '';
  }

  syncFlowTableHighlight();
  if (state.selectedConnectionId) syncFlowTableConnHighlight(state.selectedConnectionId);
}

function syncFlowTableConnHighlight(connId) {
  document.querySelectorAll('#flowConnTableBody tr').forEach(tr => {
    tr.classList.toggle('selected', tr.dataset.connId === connId);
  });
  const tr = document.querySelector(`#flowConnTableBody tr[data-conn-id="${connId}"]`);
  if (tr) tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function syncFlowTableFromConnections() {
  const panel = document.getElementById('textEditorPanel');
  if (!panel || !panel.classList.contains('open')) return;
  renderFlowTableFromState();
}

function syncFlowTableHighlight(refId) {
  const node = state.selectedNodeId
    ? state.nodes.find(n => n.id === state.selectedNodeId)
    : null;
  const highlightRef = refId ?? node?.refId;
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    tr.classList.toggle('selected', highlightRef != null && String(tr.dataset.refId) === String(highlightRef));
  });
  if (state.selectedConnectionId) {
    syncFlowTableConnHighlight(state.selectedConnectionId);
  } else {
    document.querySelectorAll('#flowConnTableBody tr').forEach(tr => tr.classList.remove('selected'));
  }
  if (highlightRef != null) {
    const tr = document.querySelector(`#flowNodeTableBody tr[data-ref-id="${highlightRef}"]`);
    if (tr) tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function syncFlowTableRowFromNode(node) {
  const tr = document.querySelector(`#flowNodeTableBody tr[data-ref-id="${node.refId}"]`);
  if (!tr) return;
  tr.querySelector('[data-f="label"]').value = node.label || '';
  const nextEl = tr.querySelector('[data-f="next"]');
  if (nextEl) nextEl.textContent = formatNodeOutgoingConnections(node) || '—';
  tr.querySelector('[data-f="role"]').value = node.role || '';
  tr.querySelector('[data-f="shape"]').value = node.shape || 'rectangle';
  tr.querySelector('[data-f="detail"]').value = node.detail || '';
  tr.querySelector('[data-f="duration"]').value = node.duration || 0;
  if (tr.querySelector('[data-f="lane"]')) tr.querySelector('[data-f="lane"]').value = node.lane ?? '';
  if (tr.querySelector('[data-f="layer"]')) tr.querySelector('[data-f="layer"]').value = node.layer ?? '';
  if (tr.querySelector('[data-f="targetPage"]')) {
    tr.querySelector('[data-f="targetPage"]').value = formatTargetPageForText(node);
  }
}

function focusFlowTableNodeRow(refId) {
  const node = state.nodes.find(n => String(n.refId) === String(refId));
  if (node) {
    selectNode(node.id);
    focusNodeInView(node);
  }
  syncFlowTableHighlight(refId);
}

function focusNodeInView(node) {
  const rect = canvasWrapper.getBoundingClientRect();
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  state.panX = rect.width / 2 - cx * state.zoom;
  state.panY = rect.height / 2 - cy * state.zoom;
  updateTransform();
}

function addFlowTableNodeRow() {
  const body = document.getElementById('flowNodeTableBody');
  const row = createFlowNodeTableRow({
    refId: getNextFlowTableRefId(),
    label: '',
    role: '',
    shape: 'rectangle',
    detail: '',
    duration: 0,
    lane: '',
    layer: '',
    targetPage: '',
  });
  body.appendChild(row);
  row.scrollIntoView({ block: 'nearest' });
}

function addFlowTableConnRow() {
  document.getElementById('flowConnTableBody').appendChild(createFlowConnTableRow({ from: '', to: '', label: '' }));
}

function deleteFlowTableSelectedRows(kind) {
  if (kind === 'nodes') {
    const selected = document.querySelectorAll('#flowNodeTableBody tr.selected');
    if (!selected.length) {
      showToast('请先点击节点表中的一行使其高亮');
      return;
    }
    selected.forEach(tr => tr.remove());
    return;
  }
  const selected = document.querySelectorAll('#flowConnTableBody tr.selected:not(.flow-table-empty)');
  if (!selected.length) {
    showToast('请先点击连线表中的一行使其高亮');
    return;
  }
  selected.forEach(tr => tr.remove());
}

function toggleTextEditorHelp() {
  const help = document.getElementById('textEditorHelp');
  const hint = document.getElementById('textEditorHint');
  const btn = document.getElementById('textEditorHelpToggle');
  if (!help || !hint) return;
  const expanded = hint.classList.toggle('text-editor-hint-expanded');
  help.classList.toggle('text-editor-help-expanded', expanded);
  if (btn) btn.textContent = expanded ? '收起' : '说明';
}

function collectFlowRowsFromTable() {
  const getCellValue = (row, field) => row.querySelector(`[data-f="${field}"]`)?.value ?? '';
  const nodeRows = [];
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    const refId = parseInt(getCellValue(tr, 'refId'), 10);
    if (isNaN(refId)) return;
    nodeRows.push({
      refId,
      label: getCellValue(tr, 'label').trim() || '未命名',
      role: getCellValue(tr, 'role').trim(),
      shape: getCellValue(tr, 'shape') || 'rectangle',
      detail: getCellValue(tr, 'detail').trim(),
      duration: parseFloat(getCellValue(tr, 'duration')) || 0,
      lane: getCellValue(tr, 'lane') !== '' ? parseInt(getCellValue(tr, 'lane'), 10) || 0 : undefined,
      layer: getCellValue(tr, 'layer') !== '' ? parseInt(getCellValue(tr, 'layer'), 10) || 0 : undefined,
      targetPage: getCellValue(tr, 'targetPage').trim(),
    });
  });

  const connRows = [];
  document.querySelectorAll('#flowConnTableBody tr').forEach(tr => {
    const from = parseInt(getCellValue(tr, 'from'), 10);
    const to = parseInt(getCellValue(tr, 'to'), 10);
    if (isNaN(from) || isNaN(to)) return;
    connRows.push({
      from,
      to,
      label: getCellValue(tr, 'label').trim(),
    });
  });

  return { nodeRows, connRows };
}

function flowToText() {
  ensureNodeRefIds();
  const sorted = [...state.nodes].sort((a, b) => (a.refId || 0) - (b.refId || 0));
  const refByNodeId = new Map(sorted.map(n => [n.id, n.refId]));

  const lines = [
    `# FC-TEXT v${FC_TEXT_VERSION}`,
    '# 列: 编号 | 简介 | 角色 | 形状 | 详细说明 | 耗时(天) | 泳道 | 图层 | 目标页',
    '# 简介=形状上显示的一行标题 · 形状=图形类型 · 详细说明=右侧面板长文 · 目标页=跨页引用时填页名',
    '# 连线: 起点编号 -> 终点编号 | 条件标签',
    '# 去向（只读，导出时自动生成，编辑请改「连线」段）',
    '',
    '[节点]',
  ];

  sorted.forEach(n => {
    const lane = n.lane !== undefined && n.lane !== null && n.lane !== '' ? n.lane : '';
    const layer = n.layer !== undefined && n.layer !== null && n.layer !== '' ? n.layer : '';
    const outgoing = formatNodeOutgoingConnections(n);
    lines.push([
      n.refId,
      escapeFlowField(n.label),
      escapeFlowField(n.role),
      n.shape || 'rectangle',
      escapeFlowField(n.detail),
      n.duration || 0,
      lane,
      layer,
      escapeFlowField(formatTargetPageForText(n)),
    ].join(' | ') + (outgoing ? `  # → ${outgoing}` : ''));
  });

  lines.push('', '[连线]');
  state.connections.forEach(c => {
    const fromRef = refByNodeId.get(c.from);
    const toRef = refByNodeId.get(c.to);
    if (fromRef === undefined || toRef === undefined) return;
    const label = c.label ? ` | ${c.label}` : '';
    lines.push(`${fromRef} -> ${toRef}${label}`);
  });

  return lines.join('\n');
}

function parseFlowTextNodeRow(parts, version) {
  const refId = parseInt(parts[0], 10);
  if (isNaN(refId)) return null;

  const useV2 = version >= 2
    || (parts.length >= 4 && isKnownFlowShape(parts[3]) && !isKnownFlowShape(parts[2]));

  if (useV2) {
    return {
      refId,
      label: parts[1] || '未命名',
      role: parts[2] || '',
      shape: isKnownFlowShape(parts[3]) ? parts[3] : 'rectangle',
      detail: parts[4] || '',
      duration: parseFloat(parts[5]) || 0,
      lane: parts[6] !== undefined && parts[6] !== '' ? parseInt(parts[6], 10) || 0 : undefined,
      layer: parts[7] !== undefined && parts[7] !== '' ? parseInt(parts[7], 10) || 0 : undefined,
      targetPage: parts[8] || '',
    };
  }

  return {
    refId,
    label: parts[1] || '未命名',
    shape: isKnownFlowShape(parts[2]) ? parts[2] : 'rectangle',
    detail: parts[3] || '',
    duration: parseFloat(parts[4]) || 0,
    lane: parts[5] !== undefined && parts[5] !== '' ? parseInt(parts[5], 10) || 0 : undefined,
    role: parts[6] || '',
    targetPage: '',
  };
}

function parseFlowText(text) {
  const nodeRows = [];
  const connRows = [];
  let section = '';
  let version = 1;

  text.split('\n').forEach(rawLine => {
    let line = rawLine.trim();
    if (!line) return;
    const commentIdx = line.indexOf('  #');
    if (commentIdx >= 0) line = line.slice(0, commentIdx).trim();
    const versionMatch = line.match(/^#\s*FC-TEXT\s+v(\d+)/i);
    if (versionMatch) {
      version = parseInt(versionMatch[1], 10) || 1;
      return;
    }
    if (line.startsWith('#')) return;
    if (line === '[节点]') { section = 'nodes'; return; }
    if (line === '[连线]') { section = 'connections'; return; }

    if (section === 'nodes') {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 2) return;
      const row = parseFlowTextNodeRow(parts, version);
      if (row) nodeRows.push(row);
    } else if (section === 'connections') {
      const connMatch = line.match(/^(\d+)\s*->\s*(\d+)(?:\s*\|\s*(.+))?$/);
      if (connMatch) {
        connRows.push({
          from: parseInt(connMatch[1], 10),
          to: parseInt(connMatch[2], 10),
          label: (connMatch[3] || '').trim(),
        });
      }
    }
  });

  return { nodeRows, connRows };
}

function applyFlowText() {
  let { nodeRows, connRows } = collectFlowRowsFromTable();
  if (nodeRows.length === 0) {
    const text = document.getElementById('flowTextArea').value;
    if (text.trim()) ({ nodeRows, connRows } = parseFlowText(text));
  }

  if (nodeRows.length === 0) {
    showToast('请至少在节点表中填写一行（含编号）');
    return;
  }

  applyFlowData(nodeRows, connRows);
}

function hasGraphPath(adjacency, from, to) {
  if (from === to) return true;
  const seen = new Set();
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    (adjacency.get(cur) || []).forEach(next => queue.push(next));
  }
  return false;
}

function appendImportNote(row, note) {
  const existing = String(row.detail || '').trim();
  const suffix = `导入参考：${note}`;
  row.detail = existing ? `${existing}\n${suffix}` : suffix;
}

function prepareFlowImportData(nodeRows, connRows, options = {}) {
  const cleanedNodes = nodeRows.map(row => ({ ...row }));
  const nodeByRef = new Map(cleanedNodes.map(row => [row.refId, row]));
  const adjacency = new Map(cleanedNodes.map(row => [row.refId, []]));
  const validConnections = [];
  const skippedConnections = [];
  const referenceConnections = [];

  connRows.forEach((row, index) => {
    const fromNode = nodeByRef.get(row.from);
    const toNode = nodeByRef.get(row.to);
    const rowLabel = row.sourceRow ? `连线表第 ${row.sourceRow} 行` : `连线第 ${index + 1} 行`;
    const reasonPrefix = `${rowLabel} ${row.from} -> ${row.to}`;

    if (!fromNode || !toNode) {
      skippedConnections.push({
        ...row,
        reason: `${reasonPrefix} 引用了不存在的节点`,
      });
      return;
    }

    if (options.reportCycleConnections && hasGraphPath(adjacency, row.to, row.from)) {
      const label = row.label ? `（条件：${row.label}）` : '';
      referenceConnections.push({
        ...row,
        reason: `${reasonPrefix}${label} 与已有路径形成回路，已按文档导入，仅供参考`,
      });
      appendImportNote(fromNode, `存在到「${toNode.label || row.to}」的回路连线${label}，已按文档导入，仅供参考`);
      appendImportNote(toNode, `存在来自「${fromNode.label || row.from}」的回路连线${label}，已按文档导入，仅供参考`);
    }

    validConnections.push(row);
    adjacency.get(row.from).push(row.to);
  });

  return { nodeRows: cleanedNodes, connRows: validConnections, skippedConnections, referenceConnections };
}

function applyFlowData(nodeRows, connRows, showResultToast = true) {
  saveState();
  state.nodes = [];
  state.connections = [];
  state.selectedNodeId = null;
  state.selectedConnectionId = null;
  canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
  canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());

  const nodeMap = new Map();
  nodeRows.forEach(row => {
    const shape = shapeDefaults[row.shape] ? row.shape : 'rectangle';
    const nodeX = Number.isFinite(row.x) ? row.x : 0;
    const nodeY = Number.isFinite(row.y) ? row.y : 0;
    const node = createNode(shape, nodeX, nodeY, row.label, row.refId);
    if (Number.isFinite(row.w) && row.w > 0) node.w = row.w;
    if (Number.isFinite(row.h) && row.h > 0) node.h = row.h;
    if (row.fillColor) node.fillColor = row.fillColor;
    if (row.strokeColor) node.strokeColor = row.strokeColor;
    node.detail = row.detail;
    node.duration = row.duration;
    if (row.role) node.role = row.role;
    if (row.lane !== undefined) {
      const laneIndex = parseInt(row.lane, 10);
      if (Number.isFinite(laneIndex)) node.lane = Math.max(0, laneIndex);
    }
    if (row.layer !== undefined) node.layer = row.layer;
    const targetPageId = resolveTargetPageFromText(row.targetPage);
    if (targetPageId) node.targetPageId = targetPageId;
    state.nodes.push(node);
    nodeMap.set(row.refId, node);
  });

  ensureNodeRefIds();
  nodeMap.clear();
  state.nodes.forEach(n => nodeMap.set(n.refId, n));

  connRows.forEach(row => {
    const fromNode = nodeMap.get(row.from);
    const toNode = nodeMap.get(row.to);
    if (fromNode && toNode) {
      state.connections.push({
        id: 'conn_' + state.nextId++,
        from: fromNode.id,
        fromPort: normalizePortName(row.fromPort, 'bottom'),
        to: toNode.id,
        toPort: normalizePortName(row.toPort, 'top'),
        label: row.label,
        labelPos: row.labelPos,
      });
    }
  });

  const hasExplicitCoordinates = nodeRows.some(row => Number.isFinite(row.x) || Number.isFinite(row.y));
  const hasLanes = state.nodes.some(n => n.lane !== undefined);
  if (!hasExplicitCoordinates && hasLanes) {
    const laneSet = new Set(state.nodes.map(n => n.lane || 0));
    const swimlanes = Array.from(laneSet).sort((a, b) => a - b).map(i => `泳道${i + 1}`);
    autoLayoutSwimlane(swimlanes, 'horizontal');
  } else if (!hasExplicitCoordinates) {
    runAutoLayout('vertical', layoutDensity);
  } else if (hasLanes) {
    const laneSet = new Set(state.nodes.map(n => n.lane || 0));
    const swimlanes = Array.from(laneSet).sort((a, b) => a - b).map(i => `泳道${i + 1}`);
    renderSwimlanes(swimlanes, 220, 50, 80, 60, 1, 'horizontal');
  }
  renderAll();
  syncTextFromCanvas(true);
  if (showResultToast) {
    showToast(`已应用：${state.nodes.length} 个节点，${state.connections.length} 条连线`);
  }
}

// ===== 导出 PNG / SVG / PDF =====
function getExportBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  state.nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
  });
  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }
  const padding = 48;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

function exportNodeShapeSvg(node) {
  if (typeof DiagramWeaveExtensionKernel !== 'undefined') {
    const result = DiagramWeaveExtensionKernel.invokeExtension('export.nodeShape', { node });
    if (result.success && result.data?.svg) return result.data.svg;
  }
  if (typeof DiagramWeaveExport !== 'undefined') {
    return DiagramWeaveExport.buildExportNodeShapeSvg(node);
  }
  return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="#1e2029" stroke="#3a3e55" stroke-width="2"/>`;
}

function buildExportSVG() {
  const bounds = getExportBounds();
  const { minX, minY, width, height } = bounds;
  const canvasBg = getThemeVar('--canvas-bg', '#13151d');
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`;
  svg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${canvasBg}"/>`;
  svg += `<style>${typeof DiagramWeave !== 'undefined' ? DiagramWeave.getSvgFontStyleBlock() : 'text { font-family: "Microsoft YaHei", sans-serif; }'}</style>`;

  const exportConnData = [];
  const exportLabels = [];
  state.connections.forEach(conn => {
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;
    const from = getPortPos(fromNode, conn.fromPort);
    const to = getPortPos(toNode, conn.toPort);
    const markerId = 'exp_' + conn.id.replace(/[^a-zA-Z0-9]/g, '');
    svg += `<defs><marker id="${markerId}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 L2,4 Z" fill="#6b6f85"/></marker></defs>`;
    const pathD = getConnectionPath(from, to, conn.fromPort, conn.toPort, {
      fromNodeId: conn.from,
      toNodeId: conn.to,
    });
    exportConnData.push({
      conn,
      color: '#6b6f85',
      width: 1.8,
      pathD,
      points: sampleSvgPath(pathD, 12),
      layout: conn.label ? getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset) : null,
    });
    svg += `<path d="${pathD}" fill="none" stroke="#6b6f85" stroke-width="1.8" marker-end="url(#${markerId})"/>`;
    if (conn.label) {
      const layout = getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset);
      exportLabels.push({ conn, layout });
    }
  });
  svg += buildBridgeSvgFragments(exportConnData, canvasBg);
  exportLabels.forEach(({ conn, layout }) => {
    svg += `<text x="${layout.x}" y="${layout.y}" fill="#9498ad" font-size="11" text-anchor="${layout.anchor}" dominant-baseline="${layout.baseline}">${escapeHtml(conn.label)}</text>`;
  });

  state.nodes.forEach(node => {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    if (typeof DiagramWeaveExport !== 'undefined' || typeof DiagramWeaveExtensionKernel !== 'undefined') {
      svg += exportNodeShapeSvg(node);
    } else {
      svg += `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="#1e2029" stroke="#3a3e55" stroke-width="2"/>`;
    }
    const textColor = typeof DiagramWeaveNodeColors !== 'undefined'
      ? DiagramWeaveNodeColors.resolveTextColor(node.fillColor, node.textColor)
      : (node.textColor && node.textColor !== 'auto' ? node.textColor : '#ffffff');
    svg += `<text x="${cx}" y="${cy}" fill="${escapeHtml(textColor)}" font-size="13" text-anchor="middle" dominant-baseline="central">${escapeHtml(node.label)}</text>`;
  });

  svg += '</svg>';
  return svg;
}

function exportPNG() {
  const svgData = buildExportSVG();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const bounds = getExportBounds();

  const canvas2 = document.createElement('canvas');
  const ctx = canvas2.getContext('2d');
  const img = new Image();
  img.onload = () => {
    canvas2.width = bounds.width * 2;
    canvas2.height = bounds.height * 2;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, bounds.width, bounds.height);
    canvas2.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = getExportBaseName() + '.png';
      a.click();
      URL.revokeObjectURL(a.href);
      URL.revokeObjectURL(url);
      showToast('已导出 PNG');
    });
  };
  img.src = url;
}

function exportSVG() {
  const svgData = buildExportSVG();
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = getExportBaseName() + '.svg';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('已导出 SVG（可用 Illustrator / Inkscape 编辑）');
}

function exportPDF() {
  if (typeof jspdf === 'undefined') {
    showToast('PDF 库未加载，请确认 vendor 目录完整');
    return;
  }

  const run = async () => {
    if (typeof DiagramWeave !== 'undefined') await DiagramWeave.loadChineseFont();

    const bounds = getExportBounds();
    const svgData = buildExportSVG();
    const pageW = Math.max(bounds.width, 200);
    const pageH = Math.max(bounds.height, 200);

    const pdf = new jspdf.jsPDF({
      orientation: pageW > pageH ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pageW, pageH],
    });

    if (typeof DiagramWeave !== 'undefined') DiagramWeave.registerPdfChineseFont(pdf);

    const finish = () => {
      pdf.save(getExportBaseName() + '.pdf');
      showToast('已导出 PDF');
    };

    const fallbackCanvas = () => {
      const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pageW * 2;
        canvas.height = pageH * 2;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = getThemeVar('--canvas-bg', '#13151d');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, pageW, pageH);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
        URL.revokeObjectURL(url);
        finish();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        showToast('PDF 导出失败');
      };
      img.src = url;
    };

    if (typeof svg2pdf !== 'undefined' && svg2pdf.svg2pdf) {
      try {
        const doc = new DOMParser().parseFromString(svgData, 'image/svg+xml');
        const svgEl = doc.documentElement;
        const result = svg2pdf.svg2pdf(svgEl, pdf, {
          x: 0,
          y: 0,
          width: pageW,
          height: pageH,
        });
        Promise.resolve(result).then(finish).catch(fallbackCanvas);
      } catch {
        fallbackCanvas();
      }
    } else {
      fallbackCanvas();
    }
  };

  run().catch(() => showToast('PDF 导出失败'));
}

// ===== 导出/导入 JSON =====
function normalizeProjectName(name) {
  return String(name || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().slice(0, 80) || DEFAULT_PROJECT_NAME;
}

function normalizeAutosaveSeconds(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return DEFAULT_AUTOSAVE_SECONDS;
  return Math.min(3600, Math.max(5, n));
}

function getProjectFileBaseName() {
  return normalizeProjectName(projectSession.name).replace(/\s+/g, '_') || 'DiagramWeave';
}

function fileSystemAccessSupported() {
  return typeof window.showSaveFilePicker === 'function'
    && typeof window.showOpenFilePicker === 'function';
}

function updateProjectTitle() {
  const name = normalizeProjectName(projectSession.name);
  projectSession.name = name;
  const el = document.getElementById('toolbarProjectName');
  if (el) {
    el.textContent = name;
    el.title = name;
  }
  document.title = `${name} - DiagramWeave`;
}

function restartAutosaveTimer() {
  if (projectSession.autosaveTimer) clearInterval(projectSession.autosaveTimer);
  projectSession.autosaveTimer = null;
  if (!projectSession.fileHandle) return;
  projectSession.autosaveTimer = setInterval(() => {
    saveProjectFile({ autosave: true });
  }, projectSession.autosaveSeconds * 1000);
}

async function hasProjectWritePermission(fileHandle) {
  if (!fileHandle) return false;
  if (typeof fileHandle.queryPermission !== 'function') return true;
  try {
    return await fileHandle.queryPermission({ mode: 'readwrite' }) === 'granted';
  } catch {
    return false;
  }
}

function isStaleFileHandleError(err) {
  return err?.name === 'InvalidStateError'
    || String(err?.message || '').includes('state had changed since it was read from disk');
}

function pauseAutosave() {
  if (projectSession.autosaveTimer) clearInterval(projectSession.autosaveTimer);
  projectSession.autosaveTimer = null;
}

async function writeProjectFile(fileHandle) {
  const payload = projectSession.fileFormat === 'excel'
    ? getProjectExcelArrayBuffer()
    : JSON.stringify(getFlowDocumentPayload(), null, 2);
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  await writable.write(payload);
  await writable.close();
  projectSession.lastSavedAt = new Date();
}

async function downloadProjectJson(includeHistory = false) {
  const payload = getFlowDocumentPayload();
  if (includeHistory && versionHistoryStore) payload.versionHistory = await versionHistoryStore.list(projectSession.historyId);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = getProjectFileBaseName() + (projectSession.fileFormat === 'vso' ? '.vso' : '.diagramweave.json');
  a.click();
  URL.revokeObjectURL(a.href);
}

async function downloadProjectVso(includeHistory = false) {
  const prev = projectSession.fileFormat;
  projectSession.fileFormat = 'vso';
  await downloadProjectJson(includeHistory);
  projectSession.fileFormat = prev;
  showToast(typeof t === 'function' ? t('toast.exportVso') : '已导出 DiagramWeave VSO 工作档案');
}

function isNativeVisioFileName(name) {
  return NATIVE_VISIO_EXT_RE.test(String(name || ''));
}

function showVisioPreviewResult(result) {
  if (!result || !result.success) {
    const msg = result?.issues?.[0]?.message || 'Visio preview failed';
    setExcelImportStatus(msg, 'error');
    showToast(msg);
    return;
  }
  const pages = result.data?.pageCount || 0;
  const msg = `Visio preview: ${pages} page(s) detected. Mapping stub only — use JSON/VSO/Excel for full import.`;
  setExcelImportStatus(msg, pages > 0 ? 'info' : 'warn');
  showToast(msg);
}

function showNativeVisioUnsupported(fileName = '') {
  const message = typeof t === 'function'
    ? t('toast.nativeVisioUnsupported', { file: fileName || '.vsdx/.vsd' })
    : `暂不支持直接导入 Microsoft Visio 原生档案（${fileName || '.vsdx/.vsd'}）。请先转成 DiagramWeave JSON / VSO 或 Excel。`;
  setExcelImportStatus(message, 'error');
  showToast(message);
}

function downloadProjectExcel() {
  const blob = new Blob([getProjectExcelArrayBuffer()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = getProjectFileBaseName() + '.diagramweave.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function requestProjectSaveAs() {
  if (!fileSystemAccessSupported()) {
    if (projectSession.fileFormat === 'excel') downloadProjectExcel();
    else downloadProjectJson();
    showToast('浏览器不支持自动保存到原文件，已改为下载工作文件');
    return false;
  }
  const suggestedExt = projectSession.fileFormat === 'excel'
    ? '.diagramweave.xlsx'
    : projectSession.fileFormat === 'vso'
      ? '.vso'
      : '.diagramweave.json';
  const handle = await window.showSaveFilePicker({
    suggestedName: getProjectFileBaseName() + suggestedExt,
    types: [{
      description: 'DiagramWeave JSON / VSO Project',
      accept: { 'application/json': ['.json', '.vso'] },
    }, {
      description: 'DiagramWeave Excel Project',
      accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    }],
  });
  const lowerName = handle.name?.toLowerCase() || '';
  projectSession.fileFormat = lowerName.endsWith('.xlsx') ? 'excel' : lowerName.endsWith('.vso') ? 'vso' : 'json';
  await writeProjectFile(handle);
  projectSession.fileHandle = handle;
  restartAutosaveTimer();
  return true;
}

async function saveProjectFile(options = {}) {
  if (projectSession.saving) return false;
  projectSession.saving = true;
  try {
    if (!projectSession.fileHandle) {
      if (options.autosave) return false;
      const ok = await requestProjectSaveAs();
      if (ok) showToast('已保存工作文件，自动保存已启用');
      return ok;
    }
    if (options.autosave && !(await hasProjectWritePermission(projectSession.fileHandle))) {
      pauseAutosave();
      showToast('自动保存已暂停：浏览器没有文件写入权限，请手动保存一次后再继续');
      return false;
    }
    await writeProjectFile(projectSession.fileHandle);
    if (!options.autosave) showToast('已保存工作文件');
    return true;
  } catch (err) {
    if (isStaleFileHandleError(err)) {
      const format = projectSession.fileFormat;
      projectSession.fileHandle = null;
      pauseAutosave();
      if (options.autosave) {
        showToast('自动保存已暂停：档案可能被 OneDrive 或其他程序更新，请手动保存一次重新绑定档案');
        return false;
      }
      projectSession.fileFormat = format;
      showToast('原档案状态已变化，请重新选择保存位置');
      try {
        return await requestProjectSaveAs();
      } catch (retryErr) {
        if (retryErr?.name !== 'AbortError') showToast('重新保存失败：' + retryErr.message);
        return false;
      }
    }
    if (err?.name !== 'AbortError') showToast((options.autosave ? '自动保存失败：' : '保存失败：') + err.message);
    return false;
  } finally {
    projectSession.saving = false;
  }
}

async function openProjectFileWithPicker() {
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{
      description: 'DiagramWeave Project',
      accept: { 'application/json': ['.json', '.vso'] },
    }, {
      description: 'DiagramWeave Excel Project',
      accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    }, {
      description: 'Microsoft Visio (not yet supported)',
      accept: {
        'application/vnd.ms-visio.drawing.main+xml': ['.vsdx', '.vsdm'],
        'application/vnd.visio': ['.vsd', '.vdx'],
      },
    }],
  });
  const file = await handle.getFile();
  const lowerName = file.name.toLowerCase();
  if (isNativeVisioFileName(file.name)) {
    showNativeVisioUnsupported(file.name);
    return;
  }
  const isExcel = lowerName.endsWith('.xlsx');
  const isVso = lowerName.endsWith('.vso');
  let raw = null;
  if (!isExcel) {
    try {
      raw = JSON.parse(await file.text());
    } catch (parseError) {
      const message = typeof t === 'function'
        ? t('error.invalidJsonFile', { file: file.name })
        : `文件 ${file.name} 不是有效的 JSON 文件，无法打开。`;
      showToast(message, 'error');
      return;
    }
  }
  if (!isExcel) {
    queueDocumentImport(raw, {
      sourceName: file.name,
      sourceType: isVso ? 'vso' : 'json',
      apply: document => {
        const loaded = loadFlowDocumentPayload(document);
        if (!loaded) return false;
        projectSession.fileHandle = handle;
        projectSession.fileFormat = isVso ? 'vso' : 'json';
        if (!raw.projectName) projectSession.name = file.name.replace(/\.diagramweave\.json$|\.json$|\.vso$/i, '');
        updateProjectTitle();
        restartAutosaveTimer();
        showToast('已打开工作文件，自动保存已启用');
        return true;
      },
    });
    return;
  }

  if (isMobileViewMode()) return;
  const loaded = isExcel
    ? loadProjectExcelArrayBuffer(await file.arrayBuffer())
    : false;
  if (loaded) {
    if (isExcel && projectSession.lastExcelLoadKind === 'data') {
      projectSession.fileHandle = null;
      projectSession.fileFormat = 'json';
      updateProjectTitle();
      restartAutosaveTimer();
      showToast('已导入 Excel 数据表；请保存为新的工作档案以启用自动保存');
      return;
    }
    projectSession.fileHandle = handle;
    projectSession.fileFormat = isExcel ? 'excel' : isVso ? 'vso' : 'json';
    if (!isExcel && !raw.projectName) projectSession.name = file.name.replace(/\.diagramweave\.json$|\.json$|\.vso$/i, '');
    updateProjectTitle();
    restartAutosaveTimer();
    showToast('已打开工作文件，自动保存已启用');
  }
}

async function ensureProjectFileForAutosave() {
  if (projectSession.fileHandle) return true;
  const ok = await requestProjectSaveAs();
  if (!ok) showToast('未选择保存位置，自动保存暂不可用');
  return ok;
}

function resetToBlankProject() {
  projectSession.fileHandle = null;
  projectSession.fileFormat = 'json';
  projectSession.lastSavedAt = null;
  if (projectSession.autosaveTimer) clearInterval(projectSession.autosaveTimer);
  projectSession.autosaveTimer = null;
  projectSession.name = DEFAULT_PROJECT_NAME;
  projectSession.historyId = `history_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  lastHistoryFingerprint = '';
  state.nodes = [];
  state.connections = [];
  state.nextId = 1;
  state.selectedNodeId = null;
  state.selectedConnectionId = null;
  state.undoStack = [];
  state.redoStack = [];
  const blankPage = {
    id: 'page_1',
    name: 'Page 1',
    nodes: [],
    connections: [],
    layers: [{ id: 0, name: '图层 1', visible: true, locked: false }],
    nextLayerId: 1,
  };
  if (typeof DiagramWeave !== 'undefined') {
    DiagramWeave.loadDocument({
      version: 2,
      pages: [blankPage],
      currentPageId: blankPage.id,
      nextPageId: 2,
      nextId: 1,
      connRouteMode: state.connRouteMode,
    });
  }
  document.getElementById('textEditorPanel')?.classList.remove('open');
  document.getElementById('btn-text-editor')?.classList.remove('active');
  clearCanvasNodes();
  renderAll();
  updateProjectTitle();
}

async function startBlankProjectAndSave() {
  resetToBlankProject();
  await ensureProjectFileForAutosave();
  updateProjectTitle();
}

function newProject() {
  showConfirm(
    '新项目',
    '开始新项目之前，是否先保存当前项目？',
    async () => {
      await saveProjectFile();
      await startBlankProjectAndSave();
    },
    async () => {
      await startBlankProjectAndSave();
    },
  );
}

function promptInitialProjectSave() {
  if (projectSession.fileHandle || sessionStorage.getItem('dw-initial-save-prompted')) return;
  sessionStorage.setItem('dw-initial-save-prompted', '1');
  showConfirm(
    '开始项目',
    '请选择保存新档案、打开旧档案，或暂不处理。',
    async () => {
      await ensureProjectFileForAutosave();
    },
    null,
    {
      okText: '保存新档案',
      cancelText: '暂不处理',
      altText: '打开旧档案',
      onAlt: async () => {
        await importJSON();
      },
    },
  );
}

function getFlowDocumentPayload() {
  if (typeof DiagramWeave !== 'undefined') DiagramWeave.syncPageFromState();
  const payload = typeof DiagramWeave !== 'undefined'
    ? DiagramWeave.serializeDocument()
    : { version: 1, nodes: state.nodes, connections: state.connections, nextId: state.nextId, connRouteMode: state.connRouteMode, routingRules: state.routingRules };
  payload.projectName = projectSession.name;
  payload.autosaveSeconds = projectSession.autosaveSeconds;
  payload.historyId = projectSession.historyId;
  return payload;
}

function loadFlowDocumentPayload(raw) {
  let data = null;
  if (typeof DiagramWeaveExtensionKernel !== 'undefined') {
    const result = DiagramWeaveExtensionKernel.invokeExtension('sanitize.document', {
      raw,
      options: { knownShapes: shapeDefaults },
    });
    if (result.success) data = result.data;
  } else if (typeof DiagramWeaveSanitize !== 'undefined') {
    data = DiagramWeaveSanitize.sanitizeFlowDocument(raw, { knownShapes: shapeDefaults });
  } else {
    data = raw;
  }
  if (!data) {
    showToast('文件格式无效或数据被拒绝');
    return false;
  }
  if (typeof DiagramWeaveRoutingRules !== 'undefined') state.routingRules = DiagramWeaveRoutingRules.normalizeRules(data.routingRules);
  projectSession.historyId = data.historyId || raw.historyId || projectSession.historyId;
  if (Array.isArray(raw.versionHistory) && versionHistoryStore) void versionHistoryStore.importRows(projectSession.historyId, raw.versionHistory);
  if (data.version === 2 && data.pages && typeof DiagramWeave !== 'undefined') {
    saveState();
    projectSession.name = normalizeProjectName(data.projectName || raw.projectName || projectSession.name);
    projectSession.autosaveSeconds = normalizeAutosaveSeconds(data.autosaveSeconds || raw.autosaveSeconds || projectSession.autosaveSeconds);
    DiagramWeave.loadDocument(data);
    applyConnRouteModeFromData(data.connRouteMode);
    clearCanvasNodes();
    renderAll();
    updateProjectTitle();
    restartAutosaveTimer();
    showToast(`已加载 ${data.pages.length} 个页面`);
    return true;
  }
  if (data.nodes && data.connections) {
    saveState();
    projectSession.name = normalizeProjectName(data.projectName || raw.projectName || projectSession.name);
    projectSession.autosaveSeconds = normalizeAutosaveSeconds(data.autosaveSeconds || raw.autosaveSeconds || projectSession.autosaveSeconds);
    state.nodes = data.nodes;
    state.connections = data.connections;
    state.nextId = data.nextId || state.nodes.length + 1;
    state.selectedNodeId = null;
    state.selectedConnectionId = null;
    if (typeof DiagramWeave !== 'undefined') {
      const page = DiagramWeave.getCurrentPage();
      if (page) {
        page.nodes = state.nodes;
        page.connections = state.connections;
      }
    }
    applyConnRouteModeFromData(data.connRouteMode);
    ensureNodeRefIds();
    clearCanvasNodes();
    renderAll();
    updateProjectTitle();
    restartAutosaveTimer();
    showToast('已加载：形状位置与连线已按文件恢复');
    return true;
  }
  showToast('文件格式无效或数据被拒绝');
  return false;
}

async function exportJSON() {
  await saveProjectFile();
}

async function importJSON() {
  if (fileSystemAccessSupported()) {
    try {
      await openProjectFileWithPicker();
      return;
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('打开文件失败：' + err.message);
      return;
    }
  }
  document.getElementById('fileInput').click();
}

function handleFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const lowerName = file.name.toLowerCase();
  if (isNativeVisioFileName(file.name)) {
    file.arrayBuffer()
      .then(async (buffer) => {
        if (typeof DiagramWeaveVisioBridge === 'undefined') return showNativeVisioUnsupported(file.name);
        const result = await DiagramWeaveVisioBridge.importVsdx(buffer, file.name);
        if (!result.success) return showVisioPreviewResult(result);
        queueDocumentImport(result.data, {
          sourceName: file.name,
          sourceType: 'vsdx',
          issues: result.issues,
          warnings: result.warnings,
          apply: documentPayload => {
            const loaded = loadFlowDocumentPayload(documentPayload);
            if (!loaded) return false;
            projectSession.fileHandle = null; projectSession.fileFormat = 'json'; updateProjectTitle(); restartAutosaveTimer();
            showToast('VSDX preview applied as a DiagramWeave document'); return true;
          },
        });
      })
      .catch((error) => showVisioPreviewResult({ success: false, issues: [{ message: error.message }] }));
    e.target.value = '';
    return;
  }
  if (lowerName.endsWith('.xlsx')) {
    file.arrayBuffer()
      .then(buffer => {
        if (loadProjectExcelArrayBuffer(buffer)) {
          projectSession.fileHandle = null;
          projectSession.fileFormat = 'excel';
          updateProjectTitle();
          restartAutosaveTimer();
          showToast('浏览器不支持原文件自动保存；请使用保存按钮下载更新后的工作文件');
        }
      })
      .catch(() => showToast('Excel 工作文件解析失败'));
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const raw = JSON.parse(ev.target.result);
      const isVso = lowerName.endsWith('.vso');
      queueDocumentImport(raw, {
        sourceName: file.name,
        sourceType: isVso ? 'vso' : 'json',
        apply: document => {
          const loaded = loadFlowDocumentPayload(document);
          if (!loaded) return false;
          projectSession.fileHandle = null;
          projectSession.fileFormat = isVso ? 'vso' : 'json';
          if (!raw.projectName) projectSession.name = file.name.replace(/\.diagramweave\.json$|\.json$|\.vso$/i, '');
          updateProjectTitle();
          restartAutosaveTimer();
          showToast('文件已导入；请保存新的工作文件以继续编辑');
          return true;
        },
      });
    } catch (err) {
      showToast('文件格式错误');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

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

// ===== 演示模式 =====

function findPresentationStartNode() {
  const nodesWithIncoming = new Set(state.connections.map(c => c.to));
  let startNodes = state.nodes.filter(n => !nodesWithIncoming.has(n.id));
  if (startNodes.length === 0) {
    startNodes = state.nodes.filter(n =>
      n.label.includes('开始') || n.label.toLowerCase().includes('start'));
  }
  if (startNodes.length === 0 && state.nodes.length) {
    startNodes = [state.nodes[0]];
  }
  return startNodes[0] || null;
}

function getPresentationPathItem(index = presentState.cursor) {
  if (index < 0 || index >= presentState.pathHistory.length) return null;
  return presentState.pathHistory[index];
}

function isPresentationStepNode(node) {
  if (!node) return false;
  return !['circle', 'annotation', 'note', 'offpage'].includes(node.shape);
}

function detectPresentationStepPolarity(node) {
  const explicit = String(
    node.stepType || node.polarity || node.stepTypeLabel || node.phase || node.type || '',
  ).trim().toLowerCase();
  if (explicit.includes('virtual') || explicit.includes('虚')) return 'virtual';
  if (explicit.includes('real') || explicit.includes('实')) return 'real';

  const markerText = String(
    `${node.role || ''} ${node.detail || ''} ${node.label || ''}`,
  ).toLowerCase();
  if (markerText.includes('虚')) return 'virtual';
  if (markerText.includes('实')) return 'real';
  return 'unknown';
}

function getPresentationStepPolarityLabel(node) {
  const kind = detectPresentationStepPolarity(node);
  if (kind === 'virtual') return '虚步';
  if (kind === 'real') return '实步';
  return '未标注';
}

function countPresentationStepDistribution() {
  const counts = { virtual: 0, real: 0, unknown: 0, total: 0 };
  state.nodes.forEach(node => {
    if (!isPresentationStepNode(node)) return;
    counts.total += 1;
    const kind = detectPresentationStepPolarity(node);
    if (counts[kind] !== undefined) counts[kind]++;
    else counts.unknown++;
  });
  return counts;
}

function countPresentationTotalSteps() {
  return countPresentationStepDistribution().total;
}

function getCurrentPresentationNodeId() {
  const item = getPresentationPathItem();
  if (!item) return null;
  if (item.nodeId) return item.nodeId;
  if (item.connId) {
    const conn = state.connections.find(c => c.id === item.connId);
    return conn ? conn.from : null;
  }
  return null;
}

function getPresentationFocusNode() {
  const item = getPresentationPathItem();
  if (!item) return null;
  if (item.nodeId) {
    return state.nodes.find(n => n.id === item.nodeId) || null;
  }
  if (item.connId) {
    const conn = state.connections.find(c => c.id === item.connId);
    if (!conn) return null;
    return state.nodes.find(n => n.id === conn.to) || state.nodes.find(n => n.id === conn.from) || null;
  }
  return null;
}

function rebuildPresentationVisited(endIndex) {
  presentState.visitedNodes.clear();
  presentState.visitedConns.clear();
  presentState.currentConnId = null;
  for (let i = 0; i <= endIndex; i++) {
    const step = presentState.pathHistory[i];
    if (step.nodeId) presentState.visitedNodes.add(step.nodeId);
    if (step.connId) presentState.visitedConns.add(step.connId);
  }
  const cur = presentState.pathHistory[endIndex];
  if (cur?.connId) presentState.currentConnId = cur.connId;
}

function countPresentationNodeSteps(upToIndex) {
  let count = 0;
  for (let i = 0; i <= upToIndex; i++) {
    if (presentState.pathHistory[i]?.nodeId) count++;
  }
  return count;
}

function ensurePresentationTwoPaneLayout() {
  const sidebar = document.getElementById('presentSidebar');
  const body = document.getElementById('presentSidebarBody');
  const dock = document.getElementById('presentZoomDock');
  if (!sidebar || !body || !dock || dock.parentElement === sidebar) return;
  sidebar.insertBefore(dock, body);
}

// 进入演示模式
function enterPresentation() {
  if (state.nodes.length === 0) {
    showToast('画布为空，无法演示');
    return;
  }

  const startNode = findPresentationStartNode();
  if (!startNode) {
    showToast('未找到流程起点');
    return;
  }

  presentState.active = true;
  presentState.startNodeId = startNode.id;
  presentState.pathHistory = [];
  presentState.cursor = -1;
  presentState.visitedNodes = new Set();
  presentState.visitedConns = new Set();
  presentState.currentConnId = null;
  presentState.branchResolve = null;

  generateNodeDescriptions();
  ensurePresentationTwoPaneLayout();

  state.selectedNodeId = null;
  state.selectedConnectionId = null;

  const textPanel = document.getElementById('textEditorPanel');
  textPanel?.classList.remove('open');
  document.getElementById('btn-text-editor')?.classList.remove('active');

  document.body.classList.add('presentation-mode');

  const hints = document.querySelector('.shortcuts-hint');
  if (hints) hints.style.display = 'none';

  const panel = document.getElementById('presentSidebar');
  if (panel) panel.classList.add('visible');

  updatePresentationView();
  updateContentPanel();
  renderAll();

  showToast('已进入演示模式 — 按下一步沿连线行走');
}

// 退出演示模式
function exitPresentation() {
  if (!presentState.active) return;

  presentState.active = false;
  presentState.startNodeId = null;
  presentState.pathHistory = [];
  presentState.cursor = -1;
  presentState.visitedNodes.clear();
  presentState.visitedConns.clear();
  presentState.currentConnId = null;
  cancelBranchSelector();
  presentState.descriptions = {};

  document.body.classList.remove('presentation-mode');

  const hints = document.querySelector('.shortcuts-hint');
  if (hints) hints.style.display = '';

  const panel = document.getElementById('presentSidebar');
  if (panel) panel.classList.remove('visible');

  document.getElementById('presentZoomPreview').innerHTML = '';
  document.getElementById('presentZoomDock')?.classList.remove('has-preview');

  clearPresentationStyles();
  renderAll();

  showToast('已退出演示模式');
}

// 根据节点标签和类型生成说明文字
function generateNodeDescriptions() {
  presentState.descriptions = {};
  state.nodes.forEach(node => {
    const label = node.label;
    const type = shapeNames[node.shape] || node.shape;
    let desc = '';

    // 根据节点类型和标签内容生成说明
    if (node.shape === 'terminator') {
      if (label.includes('开始') || label.toLowerCase().includes('start')) {
        desc = '流程的起点，标志着整个工作流程的启动。';
      } else if (label.includes('结束') || label.toLowerCase().includes('end')) {
        desc = '流程的终点，表示工作流程到此完成。';
      } else {
        desc = '流程的起止节点，标志着一个阶段的开始或结束。';
      }
    } else if (node.shape === 'diamond') {
      desc = '这是一个判断节点，需要根据不同的条件做出决策，选择不同的执行路径。';
    } else if (node.shape === 'rectangle') {
      if (label.includes('检查') || label.includes('验证') || label.includes('审核')) {
        desc = '对输入的数据或条件进行检查和验证，确保符合要求后再继续下一步。';
      } else if (label.includes('处理') || label.includes('执行') || label.includes('计算')) {
        desc = '执行核心的业务逻辑或数据处理操作，完成特定的任务目标。';
      } else if (label.includes('打包') || label.includes('构建') || label.includes('部署')) {
        desc = '将处理结果进行打包、构建或部署，为后续步骤做准备。';
      } else if (label.includes('通知') || label.includes('发送') || label.includes('提示')) {
        desc = '向相关人员或系统发送通知、消息或提醒。';
      } else if (label.includes('填写') || label.includes('输入')) {
        desc = '收集必要的信息或数据，作为后续处理的输入。';
      } else {
        desc = '执行该流程步骤，完成相应的业务操作。';
      }
    } else if (node.shape === 'rounded') {
      desc = '执行子流程或子程序，完成一个相对独立的子任务模块。';
    } else if (node.shape === 'parallelogram') {
      desc = '进行数据的输入或输出操作，与外部系统或用户交互。';
    } else if (node.shape === 'document') {
      desc = '处理文档相关的操作，如生成、编辑或归档文档。';
    } else if (node.shape === 'database') {
      desc = '与数据库进行交互，执行查询、存储或更新数据等操作。';
    } else if (node.shape === 'circle') {
      desc = '连接点，用于连接不同部分的流程，保持流程的连续性。';
    } else {
      desc = '执行该流程步骤。';
    }

    presentState.descriptions[node.id] = desc;
  });
}

// 获取当前步骤的来路 / 去路（用于高亮与详情栏）
function getPresentationPathContext() {
  const ctx = {
    inConnIds: new Set(),
    outConnIds: new Set(),
    inNodeIds: new Set(),
    outNodeIds: new Set(),
    historyInConnId: null,
    historyInNodeId: null,
  };

  const step = getPresentationPathItem();
  if (!step) return ctx;

  if (step.nodeId) {
    const nodeId = step.nodeId;
    if (presentState.cursor > 0) {
      const prev = presentState.pathHistory[presentState.cursor - 1];
      if (prev?.connId) {
        ctx.historyInConnId = prev.connId;
        ctx.inConnIds.add(prev.connId);
        const conn = state.connections.find(c => c.id === prev.connId);
        if (conn) ctx.inNodeIds.add(conn.from);
      } else if (prev?.nodeId) {
        ctx.historyInNodeId = prev.nodeId;
        ctx.inNodeIds.add(prev.nodeId);
      }
    }
    state.connections.filter(c => c.to === nodeId).forEach(c => {
      ctx.inConnIds.add(c.id);
      ctx.inNodeIds.add(c.from);
    });
    state.connections.filter(c => c.from === nodeId).forEach(c => {
      ctx.outConnIds.add(c.id);
      ctx.outNodeIds.add(c.to);
    });
  } else if (step.connId) {
    const conn = state.connections.find(c => c.id === step.connId);
    if (conn) {
      ctx.inConnIds.add(conn.id);
      ctx.inNodeIds.add(conn.from);
      ctx.outNodeIds.add(conn.to);
      state.connections.filter(c => c.from === conn.to).forEach(c => {
        ctx.outConnIds.add(c.id);
        ctx.outNodeIds.add(c.to);
      });
      if (presentState.cursor > 0) {
        const prev = presentState.pathHistory[presentState.cursor - 1];
        if (prev?.nodeId) ctx.inNodeIds.add(prev.nodeId);
      }
    }
  }

  return ctx;
}

function formatConnPathLabel(conn) {
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  const cond = conn.label ? `「${conn.label}」` : '';
  return `${fromNode?.label || '?'} ${cond} → ${toNode?.label || '?'}`;
}

function getPresentZoomScale(node) {
  const dockInner = document.getElementById('presentZoomLensInner');
  const maxW = dockInner ? Math.max(140, dockInner.clientWidth - 24) : 176;
  const maxH = 220;
  const scaleW = maxW / node.w;
  const scaleH = maxH / node.h;
  return Math.min(2.8, Math.max(1.4, Math.min(scaleW, scaleH)));
}

function clearPresentZoomPreview() {
  const dock = document.getElementById('presentZoomDock');
  const preview = document.getElementById('presentZoomPreview');
  const label = document.getElementById('presentZoomLabel');
  if (preview) preview.innerHTML = '';
  dock?.classList.remove('has-preview');
  if (label) label.textContent = t('present.currentStep');
}

function renderPresentZoomPreview(node, connStep) {
  const dock = document.getElementById('presentZoomDock');
  const preview = document.getElementById('presentZoomPreview');
  const label = document.getElementById('presentZoomLabel');
  if (!dock || !preview) return;

  if (connStep) {
    if (label) label.textContent = t('present.path');
    const conn = state.connections.find(c => c.id === connStep.connId);
    if (!conn) {
      clearPresentZoomPreview();
      return;
    }
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    preview.innerHTML = `
      <div class="present-zoom-path-card">
        <div class="present-zoom-route"><span>${escapeHtml(fromNode?.label || '?')}</span>
          <span class="route-arrow">→</span><span>${escapeHtml(conn.label || t('present.path'))}</span>
          <span class="route-arrow">→</span><span>${escapeHtml(toNode?.label || '?')}</span></div>
      </div>`;
    dock.classList.add('has-preview');
    return;
  }

  if (label) label.textContent = t('present.currentStep');

  if (!node) {
    clearPresentZoomPreview();
    return;
  }

  const scale = getPresentZoomScale(node);
  const w = Math.round(node.w * scale);
  const h = Math.round(node.h * scale);
  preview.innerHTML = `
    <div class="present-zoom-node shape-${getNodeVisualShape(node.shape)}" style="width:${w}px;height:${h}px">
      <div class="present-zoom-shape" style="width:100%;height:100%;background:${node.fillColor};border-color:${node.strokeColor};color:${typeof DiagramWeaveNodeColors !== 'undefined' ? DiagramWeaveNodeColors.resolveTextColor(node.fillColor, node.textColor) : '#ffffff'}">
        <span class="present-zoom-label">${escapeHtml(node.label)}</span>
      </div>
    </div>`;
  dock.classList.add('has-preview');
}

function updatePresentZoomPreviewLayout() {
  if (!presentState.active || presentState.cursor < 0) return;
  const step = getPresentationPathItem();
  if (!step) return;
  if (step.connId) {
    renderPresentZoomPreview(null, step);
    return;
  }
  const node = state.nodes.find(n => n.id === step.nodeId);
  if (node) renderPresentZoomPreview(node, null);
}

function focusPresentationOnNode(nodeId) {
  if (!presentState.active) return;
  let hit = -1;
  for (let i = presentState.pathHistory.length - 1; i >= 0; i--) {
    if (presentState.pathHistory[i].nodeId === nodeId) {
      hit = i;
      break;
    }
  }
  if (hit < 0) {
    showToast('该节点尚未走到，请用「下一步」沿路径前进');
    return;
  }
  presentState.cursor = hit;
  if (presentState.cursor < presentState.pathHistory.length - 1) {
    presentState.pathHistory = presentState.pathHistory.slice(0, presentState.cursor + 1);
  }
  rebuildPresentationVisited(presentState.cursor);
  updatePresentationView();
  applyPresentationStyles();
  updateContentPanel();
  scrollToCurrentNode();
}

// 更新内容说明面板的位置和内容
function updateContentPanel() {
  const sidebar = document.getElementById('presentSidebar');
  if (!sidebar) return;

  if (presentState.cursor < 0) {
    document.getElementById('sidebarStepNum').textContent = `${t('present.step')} —`;
    document.getElementById('sidebarTitle').textContent = t('present.placeholder');
    document.getElementById('sidebarName').textContent = '—';
    document.getElementById('sidebarPolarity').textContent = '—';
    document.getElementById('sidebarType').textContent = '—';
    document.getElementById('sidebarRefId').textContent = '—';
    document.getElementById('sidebarRole').textContent = '—';
    document.getElementById('sidebarDuration').textContent = '—';
    document.getElementById('sidebarDesc').textContent = t('present.leftDescHint');
    clearPresentZoomPreview();
    return;
  }

  const step = getPresentationPathItem();
  if (!step) return;

  const ctx = getPresentationPathContext();
  const nodeStepNum = countPresentationNodeSteps(presentState.cursor);

  const setPathLists = () => {
    const inList = document.getElementById('sidebarPathInList');
    const outList = document.getElementById('sidebarPathOutList');
    const inItems = [...ctx.inConnIds].map(id => {
      const c = state.connections.find(x => x.id === id);
      return c ? `<li>${escapeHtml(formatConnPathLabel(c))}</li>` : '';
    }).filter(Boolean);
    const outItems = [...ctx.outConnIds].map(id => {
      const c = state.connections.find(x => x.id === id);
      return c ? `<li>${escapeHtml(formatConnPathLabel(c))}</li>` : '';
    }).filter(Boolean);
    inList.innerHTML = inItems.length ? inItems.join('') : `<li>${escapeHtml(t('present.noIncoming'))}</li>`;
    outList.innerHTML = outItems.length ? outItems.join('') : `<li>${escapeHtml(t('present.noOutgoing'))}</li>`;
  };

  if (step.connId) {
    const conn = state.connections.find(c => c.id === step.connId);
    if (!conn) return;
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    const cond = conn.label || t('present.defaultPath');

    document.getElementById('sidebarStepNum').textContent = `${t('present.path')} ${nodeStepNum}`;
    document.getElementById('sidebarTitle').textContent = `${cond}`;
    document.getElementById('sidebarName').textContent = `${fromNode?.label || ''} -> ${toNode?.label || ''}`.trim() || '—';
    document.getElementById('sidebarType').textContent = t('present.pathLabel');
    document.getElementById('sidebarPolarity').textContent = '—';
    document.getElementById('sidebarRefId').textContent = '—';
    document.getElementById('sidebarRole').textContent = '—';
    document.getElementById('sidebarDuration').textContent = '—';
    document.getElementById('sidebarDesc').textContent = fromNode && toNode
      ? t('present.routeTo', { from: fromNode.label, cond, to: toNode.label })
      : t('present.routeMoving');
    document.getElementById('sidebarBranchRow').style.display = 'none';
    setPathLists();
    renderPresentZoomPreview(null, step);
    return;
  }

  const node = state.nodes.find(n => n.id === step.nodeId);
  if (!node) return;

  const typeName = shapeNames[node.shape] || node.shape;
  const desc = node.detail?.trim()
    || presentState.descriptions[node.id]
    || t('present.runStep');

  document.getElementById('sidebarStepNum').textContent = `${t('present.step')} ${nodeStepNum}`;
  document.getElementById('sidebarTitle').textContent = node.label;
  document.getElementById('sidebarName').textContent = node.label || '—';
  document.getElementById('sidebarType').textContent = typeName;
  document.getElementById('sidebarPolarity').textContent = getPresentationStepPolarityLabel(node);
  document.getElementById('sidebarRefId').textContent = node.refId ?? '—';
  document.getElementById('sidebarRole').textContent = node.role?.trim() || '—';
  document.getElementById('sidebarDuration').textContent =
    node.duration ? `${node.duration} 天` : '—';
  document.getElementById('sidebarDesc').textContent = desc;

  const branchRow = document.getElementById('sidebarBranchRow');
  const outConns = state.connections.filter(c => c.from === node.id);
  if (outConns.length > 1) {
    document.getElementById('sidebarBranch').textContent =
      outConns.map(c => c.label || t('present.defaultBranch')).join(' / ');
    branchRow.style.display = 'flex';
  } else {
    branchRow.style.display = 'none';
  }

  setPathLists();
  renderPresentZoomPreview(node, null);
}

// 更新演示视图
function updatePresentationView() {
  const stepDistribution = countPresentationStepDistribution();
  const totalSteps = stepDistribution.total;
  const nodeStepNum = presentState.cursor >= 0
    ? countPresentationNodeSteps(presentState.cursor)
    : 0;

  const stepInfo = document.getElementById('presentStepInfo');
  if (stepInfo) {
    stepInfo.innerHTML = presentState.cursor < 0
      ? `${escapeHtml(t('present.step'))} <span>${escapeHtml(t('present.placeholder'))}</span>`
      : `${escapeHtml(t('present.step'))} <span>${nodeStepNum}</span>`;
  }

  const floatIndicator = document.getElementById('presentFloatIndicator');
  if (!floatIndicator) return;

  const summaryProjectEl = document.getElementById('presentSummaryProject');
  const summaryTotalEl = document.getElementById('presentSummaryTotalSteps');
  const summaryCurrentEl = document.getElementById('presentSummaryCurrentStep');
  const summaryVirtualEl = document.getElementById('presentSummaryVirtualSteps');
  const summaryRealEl = document.getElementById('presentSummaryRealSteps');
  const summaryUnknownEl = document.getElementById('presentSummaryUnknownSteps');
  if (summaryProjectEl) summaryProjectEl.textContent = projectSession.name || DEFAULT_PROJECT_NAME;
  if (summaryTotalEl) summaryTotalEl.textContent = `${totalSteps}`;
  if (summaryCurrentEl) summaryCurrentEl.textContent = `${nodeStepNum}/${totalSteps}`;
  if (summaryVirtualEl) summaryVirtualEl.textContent = `${stepDistribution.virtual}`;
  if (summaryRealEl) summaryRealEl.textContent = `${stepDistribution.real}`;
  if (summaryUnknownEl) summaryUnknownEl.textContent = `${stepDistribution.unknown}`;

  let currentLabel = t('present.notStarted');
  const step = getPresentationPathItem();
  if (step?.nodeId) {
    const node = state.nodes.find(n => n.id === step.nodeId);
    if (node) currentLabel = node.label;
  } else if (step?.connId) {
    const conn = state.connections.find(c => c.id === step.connId);
    const toNode = conn ? state.nodes.find(n => n.id === conn.to) : null;
    currentLabel = conn?.label
      ? `→ ${conn.label} → ${toNode?.label || ''}`
      : `→ ${toNode?.label || t('present.nextNode')}`;
  }
  floatIndicator.innerHTML = `<span class="step-num">${nodeStepNum > 0 ? nodeStepNum : '—'}</span> · ${escapeHtml(t('present.current'))}: ${escapeHtml(currentLabel)}`;
}

// 应用演示样式到节点和连线
function applyPresentationStyles() {
  clearPresentationStyles();

  if (!presentState.active) return;

  const step = getPresentationPathItem();
  const ctx = getPresentationPathContext();
  const currentNodeId = step?.nodeId || (step?.connId
    ? state.connections.find(c => c.id === step.connId)?.from
    : null);
  const currentConnId = step?.connId || null;

  state.nodes.forEach(node => {
    const el = document.getElementById(node.id);
    if (!el) return;

    if (node.id === currentNodeId && step?.nodeId) {
      el.classList.add('present-current');
    } else if (ctx.inNodeIds.has(node.id) && ctx.outNodeIds.has(node.id)) {
      el.classList.add('present-path-in-node', 'present-path-out-node');
    } else if (ctx.inNodeIds.has(node.id)) {
      el.classList.add('present-path-in-node');
    } else if (ctx.outNodeIds.has(node.id)) {
      el.classList.add('present-path-out-node');
    } else if (presentState.visitedNodes.has(node.id)) {
      el.classList.add('present-visited');
    } else {
      el.classList.add('present-future');
    }
  });

  connectionsLayer.querySelectorAll('.connection-line').forEach(line => {
    const connId = line.dataset.connId;
    if (connId === currentConnId) {
      line.classList.add('present-current');
    } else if (ctx.inConnIds.has(connId) && ctx.outConnIds.has(connId)) {
      line.classList.add('present-path-in', 'present-path-out');
    } else if (ctx.inConnIds.has(connId)) {
      line.classList.add('present-path-in');
    } else if (ctx.outConnIds.has(connId)) {
      line.classList.add('present-path-out');
    } else if (presentState.visitedConns.has(connId)) {
      line.classList.add('present-visited');
    } else {
      line.classList.add('present-future');
    }
  });
}

// 清除演示样式
function clearPresentationStyles() {
  document.querySelectorAll('.node').forEach(el => {
    el.classList.remove(
      'present-current', 'present-visited', 'present-future',
      'present-path-in-node', 'present-path-out-node',
    );
  });
  connectionsLayer.querySelectorAll('.connection-line').forEach(line => {
    line.classList.remove(
      'present-current', 'present-visited', 'present-future',
      'present-path-in', 'present-path-out',
    );
  });
}

// 演示：下一步（节点 → 连线 → 节点，沿实际路径行走）
function cancelBranchSelector() {
  document.getElementById('branchOverlay')?.classList.remove('visible');
  const resolve = presentState.branchResolve;
  presentState.branchResolve = null;
  if (resolve) resolve(null);
}

function getPresentationFreshOutConns(nodeId) {
  return state.connections.filter(c =>
    c.from === nodeId
    && !presentState.visitedConns.has(c.id)
    && !presentState.visitedNodes.has(c.to)
  );
}

function warnPresentationLoopBlocked() {
  showToast('检测到回路：当前出口会回到已走过的节点。系统已停止继续自动推进，可上一步选择其他路径或退出演示。');
}

async function presentNext() {
  if (!presentState.active) return;
  if (document.getElementById('branchOverlay').classList.contains('visible')) return;

  if (presentState.cursor < 0) {
    presentState.pathHistory = [{ nodeId: presentState.startNodeId }];
    presentState.cursor = 0;
    rebuildPresentationVisited(0);
    updatePresentationView();
    applyPresentationStyles();
    updateContentPanel();
    scrollToCurrentNode();
    return;
  }

  const current = getPresentationPathItem();
  if (!current) return;

  if (current.connId) {
    const conn = state.connections.find(c => c.id === current.connId);
    if (!conn) return;
    if (presentState.cursor < presentState.pathHistory.length - 1) {
      presentState.pathHistory = presentState.pathHistory.slice(0, presentState.cursor + 1);
    }
    presentState.pathHistory.push({ nodeId: conn.to });
    presentState.cursor = presentState.pathHistory.length - 1;
    rebuildPresentationVisited(presentState.cursor);
    updatePresentationView();
    applyPresentationStyles();
    updateContentPanel();
    scrollToCurrentNode();
    return;
  }

  const nodeId = current.nodeId;
  const outConns = state.connections.filter(c => c.from === nodeId);

  if (outConns.length === 0) {
    showToast('已到达流程终点');
    return;
  }

  const freshOutConns = getPresentationFreshOutConns(nodeId);
  if (freshOutConns.length === 0) {
    warnPresentationLoopBlocked();
    return;
  }

  let conn = freshOutConns[0];
  if (freshOutConns.length > 1) {
    conn = await showBranchSelector(freshOutConns);
    if (!conn) return;
  }

  if (presentState.cursor < presentState.pathHistory.length - 1) {
    presentState.pathHistory = presentState.pathHistory.slice(0, presentState.cursor + 1);
  }
  presentState.pathHistory.push({ connId: conn.id });
  presentState.cursor = presentState.pathHistory.length - 1;
  rebuildPresentationVisited(presentState.cursor);

  updatePresentationView();
  applyPresentationStyles();
  updateContentPanel();
  scrollToCurrentNode();
}

// 显示分支选择弹窗
function showBranchSelector(outConns) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('branchOverlay');
    const optionsContainer = document.getElementById('branchOptions');
    optionsContainer.innerHTML = '';

    outConns.forEach(conn => {
      const targetNode = state.nodes.find(n => n.id === conn.to);
      const targetName = targetNode ? targetNode.label : '未知';
      const label = conn.label || '(无标签)';

      const btn = document.createElement('button');
      btn.className = 'branch-option';
      btn.innerHTML = `
        <span class="branch-option-label">${escapeHtml(label)}</span>
        <span class="branch-option-target">→ ${escapeHtml(targetName)}</span>
      `;
      btn.addEventListener('click', () => {
        overlay.classList.remove('visible');
        presentState.branchResolve = null;
        resolve(conn);
      });
      optionsContainer.appendChild(btn);
    });

    const stopBtn = document.createElement('button');
    stopBtn.className = 'branch-option';
    stopBtn.innerHTML = `
      <span class="branch-option-label">停止在当前步骤</span>
      <span class="branch-option-target">可上一步或退出演示</span>
    `;
    stopBtn.addEventListener('click', () => cancelBranchSelector());
    optionsContainer.appendChild(stopBtn);

    overlay.classList.add('visible');
    presentState.branchResolve = resolve;
  });
}

// 演示：上一步（沿已走过的路径原路退回）
function presentPrev() {
  if (!presentState.active) return;
  if (presentState.cursor < 0) return;

  cancelBranchSelector();

  presentState.cursor--;
  if (presentState.cursor < 0) {
    presentState.pathHistory = [];
    presentState.visitedNodes.clear();
    presentState.visitedConns.clear();
    presentState.currentConnId = null;
  } else {
    if (presentState.cursor < presentState.pathHistory.length - 1) {
      presentState.pathHistory = presentState.pathHistory.slice(0, presentState.cursor + 1);
    }
    rebuildPresentationVisited(presentState.cursor);
  }

  updatePresentationView();
  applyPresentationStyles();
  updateContentPanel();
  scrollToCurrentNode();
}

// 演示：第一步
function presentFirst() {
  if (!presentState.active || !presentState.startNodeId) return;

  cancelBranchSelector();
  presentState.pathHistory = [{ nodeId: presentState.startNodeId }];
  presentState.cursor = 0;
  rebuildPresentationVisited(0);

  updatePresentationView();
  applyPresentationStyles();
  updateContentPanel();
  scrollToCurrentNode();
}

// 演示：沿默认路径（每条分支选第一条连线）快进到终点
async function presentLast() {
  if (!presentState.active) return;
  cancelBranchSelector();

  if (presentState.cursor < 0) {
    await presentNext();
  }

  let guard = 0;
  while (guard++ < 500) {
    const step = getPresentationPathItem();
    if (!step) break;

    if (step.connId) {
      await presentNext();
      continue;
    }

    const outConns = state.connections.filter(c => c.from === step.nodeId);
    if (outConns.length === 0) break;

    const freshOutConns = getPresentationFreshOutConns(step.nodeId);
    if (freshOutConns.length === 0) {
      warnPresentationLoopBlocked();
      break;
    }

    const conn = freshOutConns[0];
    if (presentState.cursor < presentState.pathHistory.length - 1) {
      presentState.pathHistory = presentState.pathHistory.slice(0, presentState.cursor + 1);
    }
    presentState.pathHistory.push({ connId: conn.id });
    presentState.cursor = presentState.pathHistory.length - 1;
    rebuildPresentationVisited(presentState.cursor);
    await presentNext();
  }

  updatePresentationView();
  applyPresentationStyles();
  updateContentPanel();
  scrollToCurrentNode();
}

// 滚动到当前节点或连线（带动画和内容面板更新）
function scrollToCurrentNode() {
  if (presentState.cursor < 0) return;
  const step = getPresentationPathItem();
  if (!step) return;

  let focusX;
  let focusY;

  if (step.connId) {
    const conn = state.connections.find(c => c.id === step.connId);
    if (!conn) return;
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;
    const from = getPortPos(fromNode, conn.fromPort);
    const to = getPortPos(toNode, conn.toPort);
    focusX = (from.x + to.x) / 2;
    focusY = (from.y + to.y) / 2;
  } else if (step.nodeId) {
    const node = state.nodes.find(n => n.id === step.nodeId);
    if (!node) return;
    focusX = node.x + node.w / 2;
    focusY = node.y + node.h / 2;
  } else {
    return;
  }

  const rect = canvasWrapper.getBoundingClientRect();

  const targetPanX = rect.width / 2 - focusX * state.zoom;
  const targetPanY = rect.height / 2 - focusY * state.zoom;

  const startPanX = state.panX;
  const startPanY = state.panY;
  const duration = 400;
  const startTime = performance.now();
  const focusNode = getPresentationFocusNode();

  function animateScroll(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    state.panX = startPanX + (targetPanX - startPanX) * ease;
    state.panY = startPanY + (targetPanY - startPanY) * ease;
    updateTransform();

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    } else {
      // 动画结束后更新内容面板
      if (presentState.active) {
        updateContentPanel();
      }
    }
  }

  requestAnimationFrame(animateScroll);
}

// ===== 工具函数 =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function sanitizeSvg(svgText) {
  if (typeof svgText !== 'string') return '';
  return svgText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:');
}

// ===== Excel 模板导出 / 导入（离线 SheetJS）=====
function exportExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    return;
  }
  buildExcelWorkbook(null, 'DiagramWeave流程模板.xlsx');
  showToast('Excel 模板已下载');
}

function exportCanvasToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    return;
  }
  ensureNodeRefIds();
  const refByNodeId = new Map(state.nodes.map(n => [n.id, n.refId]));
  const nodeData = [...state.nodes]
    .sort((a, b) => (a.refId || 0) - (b.refId || 0))
    .map(n => ({
      '编号': n.refId,
      '简介': n.label || '',
      '角色': n.role || '',
      '形状': n.shape || 'rectangle',
      'X': n.x,
      'Y': n.y,
      '宽': n.w,
      '高': n.h,
      '填充色': n.fillColor || '',
      '线条色': n.strokeColor || '',
      '文字色': n.textColor || 'auto',
      '详细说明': n.detail || '',
      '耗时天': n.duration || 0,
      '泳道': n.lane ?? '',
      '图层': n.layer ?? '',
      '目标页': formatTargetPageForText(n),
    }));
  const connData = state.connections.map(c => ({
    '起点编号': refByNodeId.get(c.from),
    '起点端口': c.fromPort || 'bottom',
    '终点编号': refByNodeId.get(c.to),
    '终点端口': c.toPort || 'top',
    '条件': c.label || '',
    '标签位置': c.labelPos ?? '',
  })).filter(c => c['起点编号'] != null && c['终点编号'] != null);
  buildExcelWorkbook({ nodeData, connData }, 'DiagramWeave流程数据.xlsx');
  showToast('已导出当前流程到 Excel');
}

function exportProjectToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    return;
  }
  const wb = buildProjectExcelWorkbook();
  XLSX.writeFile(wb, getExportBaseName() + '.diagramweave.xlsx');
  showToast('已保存完整 Excel 工作文件');
}

function buildProjectExcelWorkbook() {
  const payload = getFlowDocumentPayload();
  const wb = XLSX.utils.book_new();

  const pages = payload.version === 2 && Array.isArray(payload.pages)
    ? payload.pages
    : [{
      id: 'page_1',
      name: 'Page 1',
      nodes: payload.nodes || [],
      connections: payload.connections || [],
      layers: [{ id: 0, name: '图层 1', visible: true, locked: false }],
      nextLayerId: 1,
    }];

  const projectRows = [{
    '格式': 'DiagramWeaveEditableExcel',
    '格式版本': 1,
    'Project Name': payload.projectName || projectSession.name,
    '自动保存秒': payload.autosaveSeconds || projectSession.autosaveSeconds,
    '当前页面ID': payload.currentPageId || pages[0]?.id || 'page_1',
    '下一个页面ID': payload.nextPageId || pages.length + 1,
    '下一个对象ID': payload.nextId || state.nextId || 1,
    '连线模式': payload.connRouteMode || state.connRouteMode || 'bezier',
    '保存时间': new Date().toISOString(),
  }];
  const projectSheet = XLSX.utils.json_to_sheet(projectRows);
  projectSheet['!cols'] = [
    { wch: 24 }, { wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, projectSheet, '项目');

  const pageRows = pages.map((page, index) => ({
    '页面ID': page.id,
    '页面名称': page.name || `Page ${index + 1}`,
    '顺序': index + 1,
    '当前页面': page.id === payload.currentPageId ? '是' : '',
  }));
  const pageSheet = XLSX.utils.json_to_sheet(pageRows);
  pageSheet['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, pageSheet, '页面');

  const layerRows = [];
  pages.forEach(page => {
    const layers = Array.isArray(page.layers) && page.layers.length
      ? page.layers
      : [{ id: 0, name: '图层 1', visible: true, locked: false }];
    layers.forEach(layer => {
      layerRows.push({
        '页面ID': page.id,
        '图层ID': layer.id,
        '图层名称': layer.name || `图层 ${layer.id + 1}`,
        '可见': layer.visible === false ? '否' : '是',
        '锁定': layer.locked ? '是' : '否',
      });
    });
  });
  const layerSheet = XLSX.utils.json_to_sheet(layerRows);
  layerSheet['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, layerSheet, '图层');

  const nodeRows = [];
  pages.forEach(page => {
    (page.nodes || []).forEach(node => {
      nodeRows.push({
        '页面ID': page.id,
        '节点ID': node.id,
        '编号': node.refId,
        '简介': node.label || '',
        '角色': node.role || '',
        '形状': node.shape || 'rectangle',
        'X': node.x,
        'Y': node.y,
        '宽': node.w,
        '高': node.h,
        '填充色': node.fillColor || '',
        '线条色': node.strokeColor || '',
        '文字色': node.textColor || 'auto',
        '详细说明': node.detail || '',
        '耗时天': node.duration || 0,
        '泳道': node.lane ?? '',
        '图层ID': node.layer ?? 0,
        '目标页ID': node.targetPageId || '',
      });
    });
  });
  const nodeSheet = XLSX.utils.json_to_sheet(nodeRows);
  nodeSheet['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 34 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, nodeSheet, '节点');

  const connRows = [];
  pages.forEach(page => {
    const refByNodeId = new Map((page.nodes || []).map(n => [n.id, n.refId]));
    (page.connections || []).forEach(conn => {
      connRows.push({
        '页面ID': page.id,
        '连线ID': conn.id,
        '起点节点ID': conn.from,
        '起点编号': refByNodeId.get(conn.from) ?? '',
        '起点端口': conn.fromPort || 'bottom',
        '终点节点ID': conn.to,
        '终点编号': refByNodeId.get(conn.to) ?? '',
        '终点端口': conn.toPort || 'top',
        '条件': conn.label || '',
        '标签位置': conn.labelPos ?? '',
      });
    });
  });
  const connSheet = XLSX.utils.json_to_sheet(connRows);
  connSheet['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
    { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, connSheet, '连线');

  const helpRows = [
    { '工作表': '项目', '说明': '项目级设置。格式字段请勿修改。Project Name 和自动保存秒可以修改。' },
    { '工作表': '页面', '说明': '每一页一行。页面ID 被节点、图层、连线引用。' },
    { '工作表': '图层', '说明': '页面内图层。可见/锁定可填 是/否、true/false、1/0。' },
    { '工作表': '节点', '说明': '可直接修改编号、简介、角色、形状、位置、颜色、说明、图层和目标页。节点ID 建议不要修改。' },
    { '工作表': '连线', '说明': '可用起点/终点节点ID 或起点/终点编号连接节点。端口可填 top/bottom/left/right。' },
    { '工作表': '形状代码', '说明': '下方列出当前支持的形状代码。' },
  ];
  Object.keys(shapeDefaults).sort().forEach(key => {
    helpRows.push({ '工作表': key, '说明': shapeNames[key] || key });
  });
  const helpSheet = XLSX.utils.json_to_sheet(helpRows);
  helpSheet['!cols'] = [{ wch: 18 }, { wch: 72 }];
  XLSX.utils.book_append_sheet(wb, helpSheet, '填写说明');

  return wb;
}

function getProjectExcelArrayBuffer() {
  if (typeof XLSX === 'undefined') throw new Error('Excel 库未加载，请确认 vendor 目录完整');
  const wb = buildProjectExcelWorkbook();
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

function buildExcelWorkbook(data, filename) {
  const wb = XLSX.utils.book_new();
  const nodeData = data?.nodeData ?? [
    { '编号': 1, '简介': '开始', '角色': '', '形状': 'terminator', 'X': 120, 'Y': 80, '宽': 140, '高': 50, '填充色': '', '线条色': '', '详细说明': '流程起点', '耗时天': 0, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 2, '简介': '提交申请', '角色': '申请人', '形状': 'rectangle', 'X': 120, 'Y': 180, '宽': 140, '高': 60, '填充色': '', '线条色': '', '详细说明': '填写并提交表单', '耗时天': 0.5, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 3, '简介': '经理审批', '角色': '经理', '形状': 'rectangle', 'X': 120, 'Y': 300, '宽': 140, '高': 60, '填充色': '', '线条色': '', '详细说明': '审核材料', '耗时天': 2, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 4, '简介': '通过？', '角色': '经理', '形状': 'diamond', 'X': 130, 'Y': 430, '宽': 120, '高': 80, '填充色': '', '线条色': '', '详细说明': '', '耗时天': 0, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 5, '简介': '结束', '角色': '', '形状': 'terminator', 'X': 120, 'Y': 560, '宽': 140, '高': 50, '填充色': '', '线条色': '', '详细说明': '流程结束', '耗时天': 0, '泳道': '', '图层': '', '目标页': '' },
  ];
  const connData = data?.connData ?? [
    { '起点编号': 1, '起点端口': 'bottom', '终点编号': 2, '终点端口': 'top', '条件': '', '标签位置': '' },
    { '起点编号': 2, '起点端口': 'bottom', '终点编号': 3, '终点端口': 'top', '条件': '', '标签位置': '' },
    { '起点编号': 3, '起点端口': 'bottom', '终点编号': 4, '终点端口': 'top', '条件': '', '标签位置': '' },
    { '起点编号': 4, '起点端口': 'bottom', '终点编号': 5, '终点端口': 'top', '条件': '是', '标签位置': 'auto' },
  ];

  const nodeSheet = XLSX.utils.json_to_sheet(nodeData);
  nodeSheet['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
    { wch: 28 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, nodeSheet, '节点表');

  const connSheet = XLSX.utils.json_to_sheet(connData);
  connSheet['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, connSheet, '连线表');

  const helpRows = [
    { '列名': '编号', '说明': '节点唯一编号，连线表用同一编号', '必填': '是', '示例': '1, 2, 3' },
    { '列名': '简介', '说明': '形状上显示的一行标题', '必填': '建议', '示例': '开始、提交申请' },
    { '列名': '角色', '说明': '负责该步骤的角色', '必填': '否', '示例': '申请人、经理' },
    { '列名': '形状', '说明': '图形类型（见下方列表）', '必填': '否', '示例': 'rectangle' },
    { '列名': 'X / Y', '说明': '节点左上角坐标；填写后导入会按坐标原样落图，不自动排版', '必填': '否', '示例': '120, 180' },
    { '列名': '宽 / 高', '说明': '节点尺寸；留空时使用图形默认尺寸', '必填': '否', '示例': '140, 60' },
    { '列名': '填充色 / 线条色', '说明': '节点颜色，支持 #RRGGBB；留空时使用主题默认色', '必填': '否', '示例': '#ffffff' },
    { '列名': '详细说明', '说明': '步骤详细内容介绍', '必填': '否', '示例': '填写表单并上传附件' },
    { '列名': '耗时天', '说明': '该步骤需时（天，可小数）', '必填': '否', '示例': '0.5, 2' },
    { '列名': '泳道', '说明': '泳道图分区（从 0 起）', '必填': '否', '示例': '0, 1' },
    { '列名': '图层', '说明': '图层编号', '必填': '否', '示例': '0' },
    { '列名': '目标页', '说明': '跨页引用时填目标页名称', '必填': '否', '示例': '页面 2' },
    { '列名': '', '说明': '', '必填': '', '示例': '' },
    { '列名': '起点编号', '说明': '连线表：起始节点编号', '必填': '是', '示例': '1' },
    { '列名': '起点端口', '说明': '起点连接点，只允许 top / bottom / left / right', '必填': '否', '示例': 'bottom' },
    { '列名': '终点编号', '说明': '连线表：目标节点编号', '必填': '是', '示例': '2' },
    { '列名': '终点端口', '说明': '终点连接点，只允许 top / bottom / left / right', '必填': '否', '示例': 'top' },
    { '列名': '条件', '说明': '连线条件标签', '必填': '否', '示例': '是、否' },
    { '列名': '标签位置', '说明': '连线文字位置，可填 auto / above / right', '必填': '否', '示例': 'auto' },
    { '列名': '', '说明': '', '必填': '', '示例': '' },
    { '列名': '形状代码', '说明': '中文名', '必填': '', '示例': '' },
  ];
  Object.keys(shapeDefaults).sort().forEach(key => {
    helpRows.push({ '列名': key, '说明': shapeNames[key] || key, '必填': '', '示例': '' });
  });
  const helpSheet = XLSX.utils.json_to_sheet(helpRows);
  helpSheet['!cols'] = [{ wch: 14 }, { wch: 36 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, helpSheet, '填写说明');

  XLSX.writeFile(wb, filename);
}

function pickExcelField(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
  }
  return '';
}

function sanitizeExcelText(value, maxLen) {
  return String(value || '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLen);
}

function parseOptionalExcelNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseExcelLabelPos(value) {
  const text = String(value || '').trim().toLowerCase();
  return ['auto', 'above', 'right'].includes(text) ? text : undefined;
}

function parseExcelNodeRow(row) {
  const id = pickExcelField(row, ['编号', 'id', 'ID', 'refId']);
  const label = pickExcelField(row, ['简介', 'label', '名称', '节点名称', 'name']);
  const role = pickExcelField(row, ['角色', 'role']);
  const shape = pickExcelField(row, ['形状', 'shape', 'type', '图形']) || 'rectangle';
  const x = parseOptionalExcelNumber(pickExcelField(row, ['X', 'x', '横坐标']));
  const y = parseOptionalExcelNumber(pickExcelField(row, ['Y', 'y', '纵坐标']));
  const w = parseOptionalExcelNumber(pickExcelField(row, ['宽', 'width', 'W']));
  const h = parseOptionalExcelNumber(pickExcelField(row, ['高', 'height', 'H']));
  const fillColor = pickExcelField(row, ['填充色', 'fillColor', 'fill', '背景色']);
  const strokeColor = pickExcelField(row, ['线条色', '边框色', 'strokeColor', 'stroke']);
  const textColor = pickExcelField(row, ['文字色', 'textColor', '文本色']);
  const detail = pickExcelField(row, ['详细说明', 'detail', '说明', 'description']);
  const rawDuration = parseFloat(pickExcelField(row, ['耗时天', '耗时', 'duration', '时间', 'time']) || 0) || 0;
  const duration = Math.max(0, Math.min(999999, rawDuration));
  const laneRaw = pickExcelField(row, ['泳道', 'lane', '分区']);
  const layerRaw = pickExcelField(row, ['图层', 'layer']);
  const targetPage = pickExcelField(row, ['目标页', 'targetPage', '目标页面']);
  return {
    id: sanitizeExcelText(id, 80),
    label: sanitizeExcelText(label || '未命名', MAX_EXCEL_LABEL_LENGTH),
    role: sanitizeExcelText(role, MAX_EXCEL_ROLE_LENGTH),
    shape: isKnownFlowShape(shape) ? shape : 'rectangle',
    x,
    y,
    w,
    h,
    fillColor: sanitizeExcelText(fillColor, 20),
    strokeColor: sanitizeExcelText(strokeColor, 20),
    textColor: typeof DiagramWeaveSanitize !== 'undefined'
      ? DiagramWeaveSanitize.sanitizeTextColor(textColor)
      : (sanitizeExcelText(textColor, 20) || 'auto'),
    detail: sanitizeExcelText(detail, MAX_EXCEL_DETAIL_LENGTH),
    duration,
    lane: laneRaw !== '' ? Math.max(0, Math.min(99999, parseInt(laneRaw, 10) || 0)) : undefined,
    layer: layerRaw !== '' ? Math.max(0, Math.min(9999, parseInt(layerRaw, 10) || 0)) : undefined,
    targetPage: sanitizeExcelText(targetPage, MAX_EXCEL_TARGET_PAGE_LENGTH),
  };
}

function showExcelDataDialog() {
  setExcelImportStatus('');
  document.getElementById('excelDataOverlay').classList.add('visible');
}

function hideExcelDataDialog() {
  setExcelImportStatus('');
  document.getElementById('excelDataOverlay').classList.remove('visible');
}

function setExcelImportStatus(message, kind = '') {
  const el = document.getElementById('excelImportStatus');
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
  el.classList.toggle('is-working', kind === 'working');
  el.classList.toggle('is-error', kind === 'error');
  el.classList.toggle('is-success', kind === 'success');
}

function reportExcelImportError(message) {
  setExcelImportStatus(message, 'error');
  showToast(message);
}

function clearExcelImportStatus() {
  setExcelImportStatus('');
}

function waitForNextPaint() {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

async function showExcelImportWorking() {
  setExcelImportStatus('正在导入中...', 'working');
  await waitForNextPaint();
}

function getExcelOpenPickerTypes() {
  return [{
    description: 'Excel file',
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
  }];
}

async function triggerExcelUpload() {
  await openExcelFilePicker(processExcelFile, 'excelInput');
}

async function triggerProjectExcelUpload() {
  await openExcelFilePicker(processProjectExcelFile, 'projectExcelInput');
}

function loadProjectExcelArrayBuffer(arrayBuffer) {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    return false;
  }
  projectSession.lastExcelLoadKind = null;
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const projectSheetName = workbook.SheetNames.find(n => n === '项目');
  if (projectSheetName) {
    const candidate = loadEditableProjectExcelWorkbook(workbook, { previewOnly: true });
    if (!candidate?.document) return false;
    const preview = createImportPreview(candidate.document, 'excel');
    preview.issues.push(
      ...candidate.skippedNodes.map(item => ({ code: 'SKIPPED_NODE', severity: 'error', row: item.row, field: 'node', reason: item.reason })),
      ...candidate.skippedConnections.map(item => ({ code: 'SKIPPED_CONNECTION', severity: 'error', row: item.row, field: 'connection', reason: item.reason })),
    );
    projectSession.lastExcelLoadKind = 'project';
    showImportPreview(preview, {
      sourceName: 'Excel 项目',
      apply: document => loadFlowDocumentPayload(document),
    });
    return true;
  }
  const sheetName = workbook.SheetNames.find(n => n === '_DiagramWeaveJSON' || n === 'DiagramWeaveJSON');
  if (!sheetName) {
    projectSession.lastExcelLoadKind = 'data';
    return importExcelWorkbookData(workbook);
  }
  projectSession.lastExcelLoadKind = 'project';
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false });
  const map = new Map(rows.map(row => [String(row[0] || ''), String(row[1] || '')]));
  if (map.get('format') !== 'DiagramWeaveProjectExcel') {
    showToast('Excel 工作文件格式无效');
    return false;
  }
  const chunkCount = Math.max(0, parseInt(map.get('chunkCount') || '0', 10));
  let json = '';
  for (let i = 1; i <= chunkCount; i++) json += map.get(`chunk${i}`) || '';
  if (!json) {
    showToast('Excel 工作文件缺少图形数据');
    return false;
  }
  const preview = createImportPreview(JSON.parse(json), 'excel');
  showImportPreview(preview, {
    sourceName: 'Excel 项目',
    apply: document => loadFlowDocumentPayload(document),
  });
  return true;
}

function parseExcelBool(value, fallback = false) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const text = String(value ?? '').trim().toLowerCase();
  if (['是', 'true', 'yes', 'y', '1'].includes(text)) return true;
  if (['否', 'false', 'no', 'n', '0'].includes(text)) return false;
  return fallback;
}

function parseExcelNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getExcelSheetRows(workbook, names) {
  const sheetName = names.find(name => workbook.Sheets[name]);
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

function loadEditableProjectExcelWorkbook(workbook, options = {}) {
  const projectRows = getExcelSheetRows(workbook, ['项目']);
  const project = projectRows[0] || {};
  if (project['格式'] && String(project['格式']).trim() !== 'DiagramWeaveEditableExcel') {
    showToast('Excel 项目格式无效');
    return false;
  }

  const pageRows = getExcelSheetRows(workbook, ['页面']);
  const layerRows = getExcelSheetRows(workbook, ['图层']);
  const nodeRows = getExcelSheetRows(workbook, ['节点', '节点表']);
  const connRows = getExcelSheetRows(workbook, ['连线', '连线表']);

  if (!nodeRows.length && !pageRows.length) {
    showToast('Excel 项目缺少页面或节点数据');
    return false;
  }

  const pages = (pageRows.length ? pageRows : [{ '页面ID': 'page_1', '页面名称': 'Page 1', '顺序': 1 }])
    .sort((a, b) => parseExcelNumber(a['顺序'], 0) - parseExcelNumber(b['顺序'], 0))
    .map((row, index) => ({
      id: sanitizeExcelText(row['页面ID'] || `page_${index + 1}`, 80),
      name: sanitizeExcelText(row['页面名称'] || `Page ${index + 1}`, 80),
      nodes: [],
      connections: [],
      layers: [],
      nextLayerId: 1,
    }));

  const pageById = new Map(pages.map(page => [page.id, page]));
  const fallbackPage = pages[0];
  layerRows.forEach((row, index) => {
    const page = pageById.get(sanitizeExcelText(row['页面ID'], 80)) || fallbackPage;
    page.layers.push({
      id: parseExcelNumber(row['图层ID'], index),
      name: sanitizeExcelText(row['图层名称'] || `图层 ${index + 1}`, 80),
      visible: parseExcelBool(row['可见'], true),
      locked: parseExcelBool(row['锁定'], false),
    });
  });
  pages.forEach(page => {
    if (!page.layers.length) page.layers.push({ id: 0, name: '图层 1', visible: true, locked: false });
    page.nextLayerId = Math.max(...page.layers.map(layer => parseExcelNumber(layer.id, 0)), 0) + 1;
  });

  const nodeByPageAndId = new Map();
  const nodeByPageAndRef = new Map();
  const isEn = typeof DiagramWeaveI18n !== 'undefined' && DiagramWeaveI18n.getLocale() === 'en';
  const skippedNodes = [];
  const skippedConnections = [];
  nodeRows.forEach((row, index) => {
    const rawPageId = sanitizeExcelText(row['页面ID'], 80);
    if (rawPageId && !pageById.has(rawPageId)) {
      skippedNodes.push({
        row: index + 2,
        reason: isEn
          ? `Node sheet row ${index + 2}: Page ID "${rawPageId}" does not exist; skipped.`
          : `节点表第 ${index + 2} 行：页面ID「${rawPageId}」不存在，已跳过`,
      });
      return;
    }
    const page = rawPageId ? pageById.get(rawPageId) : fallbackPage;
    const refId = parseExcelNumber(row['编号'], index + 1);
    const nodeId = sanitizeExcelText(row['节点ID'] || `${page.id}_node_${refId}`, 80);
    const node = {
      id: nodeId,
      refId,
      shape: sanitizeExcelText(row['形状'] || 'rectangle', 64),
      x: parseExcelNumber(row['X'], 100 + index * 30),
      y: parseExcelNumber(row['Y'], 100 + index * 30),
      w: parseExcelNumber(row['宽'], 140),
      h: parseExcelNumber(row['高'], 60),
      label: sanitizeExcelText(row['简介'] || '未命名', MAX_EXCEL_LABEL_LENGTH),
      fillColor: sanitizeExcelText(row['填充色'] || getDefaultNodeFill(), 20),
      strokeColor: sanitizeExcelText(row['线条色'] || getDefaultNodeStroke(), 20),
      textColor: typeof DiagramWeaveSanitize !== 'undefined'
        ? DiagramWeaveSanitize.sanitizeTextColor(row['文字色'])
        : (sanitizeExcelText(row['文字色'], 20) || 'auto'),
      detail: sanitizeExcelText(row['详细说明'], MAX_EXCEL_DETAIL_LENGTH),
      duration: parseExcelNumber(row['耗时天'], 0),
      role: sanitizeExcelText(row['角色'], MAX_EXCEL_ROLE_LENGTH),
      layer: parseExcelNumber(row['图层ID'], 0),
      targetPageId: sanitizeExcelText(row['目标页ID'], 80) || null,
    };
    const lane = row['泳道'];
    if (lane !== '') node.lane = parseExcelNumber(lane, 0);
    page.nodes.push(node);
    nodeByPageAndId.set(`${page.id}::${node.id}`, node);
    nodeByPageAndRef.set(`${page.id}::${node.refId}`, node);
  });

  connRows.forEach((row, index) => {
    const rawPageId = sanitizeExcelText(row['页面ID'], 80);
    if (rawPageId && !pageById.has(rawPageId)) {
      skippedConnections.push({
        row: index + 2,
        reason: isEn
          ? `Connection sheet row ${index + 2}: Page ID "${rawPageId}" does not exist; skipped.`
          : `连线表第 ${index + 2} 行：页面ID「${rawPageId}」不存在，已跳过`,
      });
      return;
    }
    const page = rawPageId ? pageById.get(rawPageId) : fallbackPage;
    const fromId = sanitizeExcelText(row['起点节点ID'], 80);
    const toId = sanitizeExcelText(row['终点节点ID'], 80);
    const fromRef = parseExcelNumber(row['起点编号'], NaN);
    const toRef = parseExcelNumber(row['终点编号'], NaN);
    const fromNode = nodeByPageAndId.get(`${page.id}::${fromId}`) || nodeByPageAndRef.get(`${page.id}::${fromRef}`);
    const toNode = nodeByPageAndId.get(`${page.id}::${toId}`) || nodeByPageAndRef.get(`${page.id}::${toRef}`);
    if (!fromNode || !toNode) {
      const missing = [];
      if (!fromNode) {
        const label = fromId || (Number.isFinite(fromRef) ? fromRef : '');
        missing.push(isEn ? `start node "${label || 'blank'}"` : `起点「${label || '空白'}」`);
      }
      if (!toNode) {
        const label = toId || (Number.isFinite(toRef) ? toRef : '');
        missing.push(isEn ? `end node "${label || 'blank'}"` : `终点「${label || '空白'}」`);
      }
      skippedConnections.push({
        row: index + 2,
        reason: isEn
          ? `Connection sheet row ${index + 2}: ${missing.join(' and ')} was not found; skipped.`
          : `连线表第 ${index + 2} 行：${missing.join('和')}找不到，已跳过`,
      });
      return;
    }
    const labelPos = parseExcelLabelPos(row['标签位置']);
    const conn = {
      id: sanitizeExcelText(row['连线ID'] || `${page.id}_conn_${index + 1}`, 80),
      from: fromNode.id,
      fromPort: normalizePortName(row['起点端口'], 'bottom'),
      to: toNode.id,
      toPort: normalizePortName(row['终点端口'], 'top'),
      label: sanitizeExcelText(row['条件'], MAX_EXCEL_LABEL_LENGTH),
    };
    if (labelPos !== undefined) conn.labelPos = labelPos;
    page.connections.push(conn);
  });

  const currentPageId = sanitizeExcelText(project['当前页面ID'], 80);
  const doc = {
    version: 2,
    projectName: sanitizeExcelText(project['Project Name'] || projectSession.name, 80),
    autosaveSeconds: parseExcelNumber(project['自动保存秒'], DEFAULT_AUTOSAVE_SECONDS),
    pages,
    currentPageId: pageById.has(currentPageId) ? currentPageId : pages[0].id,
    nextPageId: parseExcelNumber(project['下一个页面ID'], pages.length + 1),
    nextId: parseExcelNumber(project['下一个对象ID'], 1),
    connRouteMode: sanitizeExcelText(project['连线模式'] || state.connRouteMode, 32),
  };

  if (options.previewOnly) {
    return { document: doc, skippedNodes, skippedConnections };
  }

  const loaded = loadFlowDocumentPayload(doc);
  if (loaded) {
    projectSession.lastExcelImportDiagnostics = {
      skippedNodes,
      skippedConnections,
      referenceConnections: [],
    };
    const skippedTotal = skippedNodes.length + skippedConnections.length;
    if (skippedTotal) {
      const issueSummary = [...skippedNodes, ...skippedConnections]
        .slice(0, 3)
        .map(item => item.reason)
        .join(isEn ? '; ' : '；');
      const message = isEn
        ? `Imported editable Excel project; skipped ${skippedTotal} invalid row(s): ${issueSummary}`
        : `已导入完整 Excel 工作文件；已跳过 ${skippedTotal} 行问题数据：${issueSummary}`;
      setExcelImportStatus(message, 'success');
      showToast(message);
    }
  }
  return loaded;
}

async function openExcelFilePicker(processFile, inputId) {
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: getExcelOpenPickerTypes(),
      });
      if (!handle) return;
      await processFile(await handle.getFile());
      return;
    } catch (err) {
      if (err?.name === 'AbortError') {
        clearExcelImportStatus();
      } else {
        reportExcelImportError('打开文件失败：' + (err?.message || err));
      }
      return;
    }
  }

  const input = document.getElementById(inputId);
  if (!input) {
    reportExcelImportError('浏览器不支持文件选择');
    return;
  }
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // Keep the legacy path for browsers that expose showPicker but reject it.
    }
  }
  input.click();
}

async function handleProjectExcelLoad(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) {
    clearExcelImportStatus();
    return;
  }
  await processProjectExcelFile(file);
}

async function processProjectExcelFile(file) {
  if (typeof XLSX === 'undefined') {
    reportExcelImportError('Excel 库未加载，请确认 vendor 目录完整');
    return false;
  }
  if (file.size > MAX_EXCEL_FILE_BYTES) {
    reportExcelImportError('Excel 文件过大，最大允许 5MB');
    return false;
  }
  await showExcelImportWorking();
  try {
    const loaded = loadProjectExcelArrayBuffer(await file.arrayBuffer());
    if (loaded) {
      projectSession.fileHandle = null;
      projectSession.fileFormat = 'excel';
      hideExcelDataDialog();
      return true;
    }
    reportExcelImportError('Excel 工作文件导入失败，请检查文件格式');
    return false;
  } catch (err) {
    reportExcelImportError('Excel 工作文件解析失败：' + (err?.message || err));
    return false;
  }
}

async function handleExcelLoad(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) {
    clearExcelImportStatus();
    return;
  }
  await processExcelFile(file);
}

async function processExcelFile(file) {
  if (typeof XLSX === 'undefined') {
    reportExcelImportError('Excel 库未加载，请确认 vendor 目录完整');
    return false;
  }
  if (file.size > MAX_EXCEL_FILE_BYTES) {
    reportExcelImportError('Excel 文件过大，最大允许 5MB');
    return false;
  }
  await showExcelImportWorking();
  try {
    const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const loaded = importExcelWorkbookData(workbook);
    if (loaded) {
      return true;
    }
    setExcelImportStatus('Excel 数据导入失败，请检查列名与内容', 'error');
    return false;
  } catch (err) {
    reportExcelImportError('Excel 解析失败：' + (err?.message || err));
    return false;
  }
}

function importExcelWorkbookData(workbook) {
  projectSession.lastExcelImportDiagnostics = null;
  const nodeSheetName = workbook.SheetNames.find(n => n.includes('节点')) || workbook.SheetNames[0];
  const connSheetName = workbook.SheetNames.find(n => n.includes('连线')) || workbook.SheetNames[1];
  const nodeData = XLSX.utils.sheet_to_json(workbook.Sheets[nodeSheetName]);
  const connData = connSheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[connSheetName]) : [];

  if (nodeData.length === 0) {
    showToast('Excel 中没有找到节点数据');
    return false;
  }
  if (nodeData.length > MAX_EXCEL_NODE_ROWS) {
    showToast(`Excel 节点超限，最多允许 ${MAX_EXCEL_NODE_ROWS} 行`);
    return false;
  }
  if (connData.length > MAX_EXCEL_CONN_ROWS) {
    showToast(`Excel 连线超限，最多允许 ${MAX_EXCEL_CONN_ROWS} 行`);
    return false;
  }
  startMappingWizard({
    nodeRows: nodeData,
    connectionRows: connData,
    sourceName: 'Excel 数据表',
    sourceType: 'excel',
    onApply: document => {
      const loaded = loadFlowDocumentPayload(document);
      if (loaded) {
        hideExcelDataDialog();
        setExcelImportStatus('映射后的 Excel 数据已导入', 'success');
      }
      return loaded;
    },
  });
  return true;
}

// ===== 设置与更新 =====
function showSettingsDialog() {
  if (typeof DiagramWeaveBootstrap === 'undefined') return;
  const m = DiagramWeaveBootstrap.getManifest();
  const saved = DiagramWeaveBootstrap.getUpdateSettings();
  document.getElementById('settingsVersion').textContent = m?.version || '—';
  const repoInput = document.getElementById('settingsGithubRepo');
  repoInput.value = saved.githubRepo || '';
  repoInput.placeholder = m?.githubRepo || 'yourname/DiagramWeave';
  document.getElementById('settingsUpdateCheckUrl').value = saved.updateCheckUrl || '';
  document.getElementById('settingsReleasePageUrl').value = saved.releasePageUrl || '';
  const setLang = document.getElementById('settingsLanguage');
  if (setLang && typeof DiagramWeaveI18n !== 'undefined') {
    setLang.value = DiagramWeaveI18n.getLocale();
  }
  document.getElementById('settingsProjectName').value = projectSession.name;
  document.getElementById('settingsAutosaveSeconds').value = projectSession.autosaveSeconds;
  if (typeof DiagramWeaveI18n !== 'undefined') DiagramWeaveI18n.applyDom(document.getElementById('settingsOverlay'));
  document.getElementById('settingsUpdateStatus').textContent = '';
  const packStatus = document.getElementById('settingsPackStatus');
  if (packStatus) {
    if (typeof DiagramWeaveContent !== 'undefined') {
      const s = DiagramWeaveContent.getAppliedSummary();
      packStatus.textContent = s.packVersion
        ? `内容包 v${s.packVersion}：${s.connModes} 连线 / ${s.fonts} 字体 / ${s.shapes} 图标`
        : '尚未同步远程内容包';
    } else {
      packStatus.textContent = '';
    }
  }
  const releaseBtn = document.getElementById('settingsOpenReleaseBtn');
  releaseBtn.disabled = !DiagramWeaveBootstrap.getReleasePageUrl();
  document.getElementById('settingsOverlay').classList.add('visible');
}

function hideSettingsDialog() {
  document.getElementById('settingsOverlay').classList.remove('visible');
}

function saveSettingsFromDialog() {
  if (typeof DiagramWeaveBootstrap === 'undefined') return;
  projectSession.name = normalizeProjectName(document.getElementById('settingsProjectName').value);
  projectSession.autosaveSeconds = normalizeAutosaveSeconds(document.getElementById('settingsAutosaveSeconds').value);
  updateProjectTitle();
  restartAutosaveTimer();
  DiagramWeaveBootstrap.saveUpdateSettings({
    githubRepo: document.getElementById('settingsGithubRepo').value,
    updateCheckUrl: document.getElementById('settingsUpdateCheckUrl').value,
    releasePageUrl: document.getElementById('settingsReleasePageUrl').value,
  });
  document.getElementById('settingsOpenReleaseBtn').disabled = !DiagramWeaveBootstrap.getReleasePageUrl();
  showToast(typeof t === 'function' ? t('toast.settingsSaved') : '设置已保存');
}

async function runUpdateCheckFromSettings() {
  if (typeof DiagramWeaveBootstrap === 'undefined') return;
  const statusEl = document.getElementById('settingsUpdateStatus');
  statusEl.textContent = '检查中…';
  const result = await DiagramWeaveBootstrap.checkForUpdate();
  statusEl.textContent = result.message;
  const releaseBtn = document.getElementById('settingsOpenReleaseBtn');
  releaseBtn.disabled = !result.releasePageUrl;
  if (result.releasePageUrl) {
    releaseBtn.dataset.releaseUrl = result.releasePageUrl;
  }
  if (result.hasUpdate) {
    showToast(result.message);
  }
}

function openReleasePageFromSettings() {
  if (typeof DiagramWeaveBootstrap === 'undefined') return;
  const btn = document.getElementById('settingsOpenReleaseBtn');
  const url = btn.dataset.releaseUrl || DiagramWeaveBootstrap.getReleasePageUrl();
  if (url) {
    window.open(url, '_blank', 'noopener');
  } else {
    showToast('未配置发布页。请在设置中填写 GitHub 仓库或发布页地址。');
  }
}

async function syncContentPackFromSettings() {
  if (typeof DiagramWeaveContent === 'undefined') {
    showToast('内容包模块未加载');
    return;
  }
  const statusEl = document.getElementById('settingsPackStatus');
  if (statusEl) statusEl.textContent = '同步中…';
  const result = await DiagramWeaveContent.loadContentPack({ forceRemote: true });
  if (statusEl) statusEl.textContent = result.message || '完成';
  initConnRouteAlgorithms();
  initConnRouteMode();
  initShapeTypeSelect();
  renderConnections();
  showToast(result.message || '内容包已同步');
}

// ===== 初始化 =====
async function bootDiagramWeave() {
  try {
  if (typeof DiagramWeaveI18n !== 'undefined') {
    await DiagramWeaveI18n.init();
    const lang = DiagramWeaveI18n.getLocale();
    const appLang = document.getElementById('appLanguage');
    const setLang = document.getElementById('settingsLanguage');
    if (appLang) appLang.value = lang;
    if (setLang) setLang.value = lang;
    DiagramWeaveI18n.onChange(() => {
      refreshConnRouteLabelsFromI18n();
      rebuildConnRouteSelect();
      initShapeTypeSelect();
      initTemplates();
      if (typeof DiagramWeave !== 'undefined') {
        DiagramWeave.renderPageTabs();
        DiagramWeave.renderLayerPanel();
      }
    });
    refreshConnRouteLabelsFromI18n();
  }
  if (typeof DiagramWeaveBootstrap !== 'undefined') {
    await DiagramWeaveBootstrap.ensureRuntime();
    if (!window.__dwSkipRemoteBootstrap) {
      await DiagramWeaveBootstrap.checkRemoteUpdate();
    }
    await DiagramWeaveBootstrap.loadTemplateLibrary();
  }
  if (typeof DiagramWeave !== 'undefined') DiagramWeave.mergeShapeRegistry();
  initConnRouteAlgorithms();
  if (typeof DiagramWeaveContent !== 'undefined') {
    await DiagramWeaveContent.loadContentPack({ forceRemote: false });
    initConnRouteAlgorithms();
  }
  initColorSwatches();
  initPropertyEditingWorkflow();
  initAccessibility();
  initModalContracts();
  initEditorCommands();
  initFastTooltips(document.querySelector('.toolbar'));
  initFastTooltips(document.getElementById('propertiesPanel'));
  initConnRouteMode();
  initShapeTypeSelect();
  setTool('select');
  initTemplates();
  initShapeLibraryWorkflow();
  initStencilManager();
  initVersionHistory();
  initCanvasNavigation();
  updateProjectTitle();
  restartAutosaveTimer();

  if (typeof DiagramWeave !== 'undefined') {
    DiagramWeave.initDocument();
    DiagramWeave.loadChineseFont();
  }
  renderAll();
  loadE2eSeedNodesFromSession();
  renderAll();
  applyDeepLinkHighlight();
  if (location.protocol === 'file:' && !sessionStorage.getItem('fc-file-protocol-hint')) {
    sessionStorage.setItem('fc-file-protocol-hint', '1');
    setTimeout(() => {
      showToast(typeof t === 'function' ? t('toast.useBat') : '建议双击 bat 启动');
    }, 800);
  }
  } catch (bootError) {
    console.error('[DiagramWeave] boot error', bootError);
    try { renderAll(); } catch { /* ignore */ }
  } finally {
    window.__dwEditorReady = true;
  }
}
bootDiagramWeave();
