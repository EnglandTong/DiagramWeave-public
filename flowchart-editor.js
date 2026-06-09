// ===== 状态管理 =====
const state = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
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
  connRouteMode: 'bezier', // bezier | orthogonal | avoidance | straight | visio
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

const CONN_ROUTE_ALGORITHMS = {};

const MAX_EXCEL_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EXCEL_NODE_ROWS = 2000;
const MAX_EXCEL_CONN_ROWS = 4000;
const MAX_EXCEL_LABEL_LENGTH = 80;
const MAX_EXCEL_ROLE_LENGTH = 80;
const MAX_EXCEL_DETAIL_LENGTH = 800;
const MAX_EXCEL_TARGET_PAGE_LENGTH = 80;

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
    document.body.appendChild(tipEl);
  }

  let timer = null;
  let anchor = null;

  const hide = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    anchor = null;
    tipEl.classList.remove('visible');
  };

  const show = () => {
    if (!anchor) return;
    const text = anchor.dataset.fcTip;
    if (!text) return;
    tipEl.textContent = text;
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
      el.removeAttribute('title');
    }
    el.addEventListener('mouseenter', () => {
      anchor = el;
      timer = setTimeout(show, 450);
    });
    el.addEventListener('mouseleave', hide);
    el.addEventListener('mousedown', hide);
  });
}

function initColorSwatches() {
  const fillEl = document.getElementById('propFillSwatches');
  const strokeEl = document.getElementById('propStrokeSwatches');
  if (!fillEl || !strokeEl) return;
  fillEl.innerHTML = OFFICE_FILL_SWATCHES.map(c =>
    `<button type="button" class="color-swatch" data-color="${c}" data-kind="fill" style="background:${c}" title="填充 ${c}" onclick="setNodeFillColor('${c}')"></button>`
  ).join('');
  strokeEl.innerHTML = OFFICE_STROKE_SWATCHES.map(c =>
    `<button type="button" class="color-swatch color-swatch-stroke" data-color="${c}" data-kind="stroke" style="box-shadow:inset 0 0 0 3px ${c}" title="边框 ${c}" onclick="setNodeStrokeColor('${c}')"></button>`
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
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node || normalizeHexColor(node.fillColor) === normalizeHexColor(color)) return;
  saveState();
  node.fillColor = color;
  renderNode(node);
  syncColorSwatchSelection();
}

function setNodeStrokeColor(color) {
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node || normalizeHexColor(node.strokeColor) === normalizeHexColor(color)) return;
  saveState();
  node.strokeColor = color;
  renderNode(node);
  syncColorSwatchSelection();
}

function showExportDialog() {
  document.getElementById('exportOverlay').classList.add('visible');
}

function hideExportDialog() {
  document.getElementById('exportOverlay').classList.remove('visible');
}

function runExport(format) {
  hideExportDialog();
  if (format === 'png') exportPNG();
  else if (format === 'svg') exportSVG();
  else if (format === 'pdf') exportPDF();
}

// ===== 流程图模板库 =====
let allTemplates = [];
const flowchartTemplates = [];

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
  const grid = document.getElementById('templateDialogGrid');
  grid.innerHTML = '';
  rebuildAllTemplates();
  if (!allTemplates.length) {
    grid.innerHTML = `
      <div class="template-dialog-empty">
        <p>暂无内置模板。启动时画布为空白，可从左侧拖图形自行绘制。</p>
        <p class="template-dialog-empty-hint">在 <code>templates/</code> 添加 JSON 并在 <code>index.json</code> 登记后，刷新即可在此选用。详见 <code>templates/README.md</code>。</p>
      </div>`;
    return;
  }
  allTemplates.forEach((tmpl, idx) => {
    const el = document.createElement('div');
    el.className = 'template-dialog-item';
    // 泳道图显示特殊图标
    const icon = (tmpl.type === 'swimlane' || tmpl.type === 'swimlane-v')
      ? (templateIconSVG.swimlane || templateIconSVG.rectangle)
      : (templateIconSVG[tmpl.nodes[0]?.shape] || templateIconSVG.rectangle);
    el.innerHTML = `
      <div class="template-dialog-item-icon">${icon}</div>
      <div class="template-dialog-item-name">${escapeHtml(tmpl.name)}</div>
      <div class="template-dialog-item-desc">${escapeHtml(tmpl.description)}</div>
    `;
    el.addEventListener('click', () => onTemplateDialogClick(idx));
    grid.appendChild(el);
  });
}

// 显示模板选择弹窗
function showTemplateDialog() {
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
    const node = createNode(n.shape, n.x || 0, n.y || 0, n.label);
    node.w = n.w || defaults.w;
    node.h = n.h || defaults.h;
    // 保存泳道信息
    if (tmpl.type === 'swimlane' && n.lane !== undefined) {
      node.lane = n.lane;
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
      fromPort: 'bottom',
      to: toNode.id,
      toPort: 'top',
      label: c.label || '',
    });
  });

  // 自动布局
  if ((tmpl.type === 'swimlane' || tmpl.type === 'swimlane-v') && tmpl.swimlanes) {
    autoLayoutSwimlane(tmpl.swimlanes, tmpl.type === 'swimlane-v' ? 'vertical' : 'horizontal');
  } else {
    runAutoLayout(tmpl.layout || 'vertical', 'normal');
  }

  // 自动调整连线端口
  autoAdjustPorts();

  renderAll();
  showToast(`已应用模板「${tmpl.name}」`);
}

// ===== 确认对话框 =====
function showConfirm(title, msg, onOk) {
  const overlay = document.getElementById('confirmOverlay');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  overlay.classList.add('visible');

  const okBtn = document.getElementById('confirmOk');
  const cancelBtn = document.getElementById('confirmCancel');

  const cleanup = () => {
    overlay.classList.remove('visible');
    okBtn.onclick = null;
    cancelBtn.onclick = null;
  };

  okBtn.onclick = () => { cleanup(); if (onOk) onOk(); };
  cancelBtn.onclick = cleanup;
}

function hideConfirm() {
  const overlay = document.getElementById('confirmOverlay');
  overlay.classList.remove('visible');
  const okBtn = document.getElementById('confirmOk');
  const cancelBtn = document.getElementById('confirmCancel');
  okBtn.onclick = null;
  cancelBtn.onclick = null;
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
        labelEl.style.fontSize = `${13 * state.zoom}px`;
      } else {
        labelEl.style.transform = '';
        labelEl.style.fontSize = '';
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
  };
}

function applyUndoSnapshot(snap) {
  if (!snap) return;
  state.selectedNodeId = null;
  state.selectedConnectionId = null;

  if (snap.version === 2 && snap.pages && typeof DiagramWeave !== 'undefined') {
    DiagramWeave.loadDocument(snap);
    applyConnRouteModeFromData(snap.connRouteMode);
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
  state.undoStack.push(JSON.stringify(captureUndoSnapshot()));
  if (state.undoStack.length > 50) state.undoStack.shift();
  state.redoStack = [];
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
    el.className = `node shape-${getNodeVisualShape(node.shape)}` + (state.selectedNodeId === node.id ? ' selected' : '');
  }

  const shapeEl = el.querySelector('.node-shape');
  shapeEl.style.background = node.fillColor;
  applyNodeStrokeColor(shapeEl, node.strokeColor);
  syncNodeOutlineSvg(shapeEl, node);
  syncPortElements(el, node);

  const labelEl = el.querySelector('.node-label');
  labelEl.textContent = node.label;

  // 缩放时反向缩放文字，保持文字清晰度
  if (state.zoom !== 1) {
    labelEl.style.transform = `scale(${1 / state.zoom})`;
    labelEl.style.fontSize = `${13 * state.zoom}px`;
  } else {
    labelEl.style.transform = '';
    labelEl.style.fontSize = '';
  }

  updateNodeBriefEl(node, el);

  el.classList.toggle('selected', state.selectedNodeId === node.id);
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
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('shape', item.dataset.shape);
    e.dataTransfer.setData('label', item.dataset.label);
    e.dataTransfer.effectAllowed = 'copy';
  });
}

function registerRemoteShape(entry) {
  if (!entry?.id) return;
  shapeDefaults[entry.id] = entry.defaults || { w: 140, h: 60 };
  shapeNames[entry.id] = entry.label || entry.id;
  if (entry.renderAs && entry.renderAs !== entry.id) {
    shapeRenderAs[entry.id] = entry.renderAs;
  }
  if (typeof DiagramWeaveSanitize !== 'undefined' && typeof DiagramWeaveSanitize.registerShape === 'function') {
    DiagramWeaveSanitize.registerShape(entry.id);
  }
  const section = document.getElementById('remoteShapesSection');
  const grid = document.getElementById('remoteShapesGrid');
  if (!section || !grid) return;
  section.style.display = '';
  const el = document.createElement('div');
  el.className = 'shape-item';
  el.draggable = true;
  el.dataset.shape = entry.id;
  el.dataset.label = entry.label || entry.id;
  el.innerHTML = `${entry.svg}<span class="shape-item-label">${escapeHtml(entry.label || entry.id)}</span>`;
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

function countPathObstacleHits(points, fromNodeId, toNodeId, pad) {
  let hits = 0;
  for (const node of state.nodes) {
    if (node.id === fromNodeId || node.id === toNodeId) continue;
    for (const pt of points) {
      if (pointInNodeRect(pt.x, pt.y, node, pad)) hits++;
    }
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
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
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

function scorePolylineRoute(points, fromNodeId, toNodeId) {
  const rects = getRoutingObstacleRects(fromNodeId, toNodeId, 18);
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
  const stub = 28;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  const xs = [p1.x, p2.x, (p1.x + p2.x) / 2];
  const ys = [p1.y, p2.y, (p1.y + p2.y) / 2];

  getRoutingObstacleRects(fromNodeId, toNodeId, 24).forEach(rect => {
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
    const score = scorePolylineRoute(points, fromNodeId, toNodeId);
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
  const stub = 28;
  const margin = 24;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  const obstacles = getRoutingObstacleRects(fromNodeId, toNodeId, margin);
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
    const hits = countPathObstacleHits([...samples, ...chordSamples], fromNodeId, toNodeId, 18);
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
  const mode = state.connRouteMode || 'bezier';
  const fn = CONN_ROUTE_ALGORITHMS[mode] || CONN_ROUTE_ALGORITHMS.bezier;
  const path = fn(from, to, fromPort, toPort, routeOpts);
  if (mode === 'visio') return path;
  const samples = sampleSvgPath(path, 8);
  const hits = countPathObstacleHits(samples, routeOpts?.fromNodeId, routeOpts?.toNodeId, 12);
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

function getSegmentIntersection(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 0.001) return null;
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const t = (dx * s.y - dy * s.x) / denom;
  const u = (dx * r.y - dy * r.x) / denom;
  if (t <= 0.04 || t >= 0.96 || u <= 0.04 || u >= 0.96) return null;
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
          const jumpConn = j > i ? b.conn.id : a.conn.id;
          const jumpSeg = j > i
            ? { from: b.points[bi], to: b.points[bi + 1], hit }
            : { from: a.points[ai], to: a.points[ai + 1], hit };
          crossings.get(jumpConn)?.push(jumpSeg);
        }
      }
    }
  }
  return crossings;
}

function buildBridgeSvgFragments(dataList, bridgeBg) {
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
      const height = 8;
      const p1 = { x: hit.x - ux * half, y: hit.y - uy * half };
      const p2 = { x: hit.x + ux * half, y: hit.y + uy * half };
      const g1 = { x: hit.x - ux * gapHalf, y: hit.y - uy * gapHalf };
      const g2 = { x: hit.x + ux * gapHalf, y: hit.y + uy * gapHalf };
      const cp = { x: hit.x + nx * height, y: hit.y + ny * height };
      const bridgeD = `M${p1.x},${p1.y} Q${cp.x},${cp.y} ${p2.x},${p2.y}`;
      svg += `<path class="connection-bridge-gap" d="M${g1.x},${g1.y} L${g2.x},${g2.y}" fill="none" stroke="${bridgeBg}" stroke-width="${data.width + 4}" stroke-linecap="round" pointer-events="none"/>`;
      svg += `<path class="connection-bridge" d="${bridgeD}" fill="none" stroke="${data.color}" stroke-width="${data.width}" stroke-linecap="round" pointer-events="none" data-conn-id="${data.conn.id}"/>`;
    });
  });
  return svg;
}

function getConnLabelLayout(from, to, labelPos) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const gap = 12;
  const mode = labelPos || 'auto';
  const placeAbove = mode === 'above' || (mode === 'auto' && Math.abs(dx) > Math.abs(dy));
  if (placeAbove) {
    return { x: mx, y: my - gap, anchor: 'middle', baseline: 'auto' };
  }
  return { x: mx + gap, y: my - 2, anchor: 'start', baseline: 'middle' };
}

function getConnectionRenderData(conn) {
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return null;

  const from = getPortPos(fromNode, conn.fromPort);
  const to = getPortPos(toNode, conn.toPort);
  const isSelected = state.selectedConnectionId === conn.id;
  const color = isSelected ? getThemeVar('--accent', '#6c8cff') : getThemeVar('--conn-color', '#6b6f85');
  const width = isSelected ? 2.5 : 1.8;
  const pathD = getConnectionPath(from, to, conn.fromPort, conn.toPort, {
    fromNodeId: conn.from,
    toNodeId: conn.to,
  });
  const points = sampleSvgPath(pathD, 12);
  const layout = conn.label ? getConnLabelLayout(from, to, conn.labelPos) : null;
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
  const dataList = state.connections
    .map(conn => getConnectionRenderData(conn))
    .filter(Boolean);
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
          });
          svg += `<path class="connection-temp" d="${pathD}" fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
        } else {
          fixed = getPortPos(fromNode, conn.fromPort);
          tempPort = getNearestPortByPoint(state.connectTempEnd.x, state.connectTempEnd.y, toNode);
          const pathD = getConnectionPath(fixed, state.connectTempEnd, conn.fromPort, tempPort, {
            fromNodeId: conn.from,
            toNodeId: conn.to,
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
    selectNode(node.id);

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

function selectNode(nodeId) {
  state.selectedNodeId = nodeId;
  state.selectedConnectionId = null;
  renderAll();
  syncFlowTableHighlight();
}

function deselectAll() {
  state.selectedNodeId = null;
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
  if (state.selectedNodeId) {
    saveState();
    const el = document.getElementById(state.selectedNodeId);
    if (el) el.remove();
    state.nodes = state.nodes.filter(n => n.id !== state.selectedNodeId);
    state.connections = state.connections.filter(c => c.from !== state.selectedNodeId && c.to !== state.selectedNodeId);
    state.selectedNodeId = null;
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
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.role = val.trim();
  syncFlowTableRowFromNode(node);
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
  const node = state.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return;
  saveState();
  node.layer = layerId;
  renderAll();
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
  const nodeRows = [];
  document.querySelectorAll('#flowNodeTableBody tr').forEach(tr => {
    const refId = parseInt(tr.querySelector('[data-f="refId"]').value, 10);
    if (isNaN(refId)) return;
    nodeRows.push({
      refId,
      label: tr.querySelector('[data-f="label"]').value.trim() || '未命名',
      role: tr.querySelector('[data-f="role"]').value.trim(),
      shape: tr.querySelector('[data-f="shape"]').value || 'rectangle',
      detail: tr.querySelector('[data-f="detail"]').value.trim(),
      duration: parseFloat(tr.querySelector('[data-f="duration"]').value) || 0,
      lane: tr.querySelector('[data-f="lane"]').value !== '' ? parseInt(tr.querySelector('[data-f="lane"]').value, 10) || 0 : undefined,
      layer: tr.querySelector('[data-f="layer"]').value !== '' ? parseInt(tr.querySelector('[data-f="layer"]').value, 10) || 0 : undefined,
      targetPage: tr.querySelector('[data-f="targetPage"]').value.trim(),
    });
  });

  const connRows = [];
  document.querySelectorAll('#flowConnTableBody tr').forEach(tr => {
    const from = parseInt(tr.querySelector('[data-f="from"]').value, 10);
    const to = parseInt(tr.querySelector('[data-f="to"]').value, 10);
    if (isNaN(from) || isNaN(to)) return;
    connRows.push({
      from,
      to,
      label: tr.querySelector('[data-f="label"]').value.trim(),
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
    const node = createNode(shape, 0, 0, row.label, row.refId);
    node.detail = row.detail;
    node.duration = row.duration;
    if (row.role) node.role = row.role;
    if (row.lane !== undefined) node.lane = row.lane;
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
        fromPort: 'bottom',
        to: toNode.id,
        toPort: 'top',
        label: row.label,
      });
    }
  });

  const hasLanes = state.nodes.some(n => n.lane !== undefined && n.lane > 0);
  if (hasLanes) {
    const laneSet = new Set(state.nodes.map(n => n.lane || 0));
    const swimlanes = Array.from(laneSet).sort((a, b) => a - b).map(i => `泳道${i + 1}`);
    autoLayoutSwimlane(swimlanes, 'horizontal');
  } else {
    runAutoLayout('vertical', layoutDensity);
  }
  autoAdjustPorts();
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
      layout: conn.label ? getConnLabelLayout(from, to, conn.labelPos) : null,
    });
    svg += `<path d="${pathD}" fill="none" stroke="#6b6f85" stroke-width="1.8" marker-end="url(#${markerId})"/>`;
    if (conn.label) {
      const layout = getConnLabelLayout(from, to, conn.labelPos);
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
    if (typeof DiagramWeaveExport !== 'undefined') {
      svg += DiagramWeaveExport.buildExportNodeShapeSvg(node);
    } else {
      svg += `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="6" fill="#1e2029" stroke="#3a3e55" stroke-width="2"/>`;
    }
    svg += `<text x="${cx}" y="${cy}" fill="#e8eaf0" font-size="13" text-anchor="middle" dominant-baseline="central">${escapeHtml(node.label)}</text>`;
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
function getFlowDocumentPayload() {
  if (typeof DiagramWeave !== 'undefined') DiagramWeave.syncPageFromState();
  return typeof DiagramWeave !== 'undefined'
    ? DiagramWeave.serializeDocument()
    : { version: 1, nodes: state.nodes, connections: state.connections, nextId: state.nextId, connRouteMode: state.connRouteMode };
}

function loadFlowDocumentPayload(raw) {
  const data = typeof DiagramWeaveSanitize !== 'undefined'
    ? DiagramWeaveSanitize.sanitizeFlowDocument(raw, { knownShapes: shapeDefaults })
    : raw;
  if (!data) {
    showToast('文件格式无效或数据被拒绝');
    return false;
  }
  if (data.version === 2 && data.pages && typeof DiagramWeave !== 'undefined') {
    saveState();
    DiagramWeave.loadDocument(data);
    applyConnRouteModeFromData(data.connRouteMode);
    clearCanvasNodes();
    renderAll();
    showToast(`已加载 ${data.pages.length} 个页面`);
    return true;
  }
  if (data.nodes && data.connections) {
    saveState();
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
    showToast('已加载：形状位置与连线已按文件恢复');
    return true;
  }
  showToast('文件格式无效或数据被拒绝');
  return false;
}

function exportJSON() {
  const payload = getFlowDocumentPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = getExportBaseName() + '.diagramweave.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('已保存工作文件（含位置与连线，下次加载原样恢复）');
}

function importJSON() {
  document.getElementById('fileInput').click();
}

function handleFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const raw = JSON.parse(ev.target.result);
      loadFlowDocumentPayload(raw);
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
  const layout = getConnLabelLayout(from, to, conn.labelPos);

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

  state.selectedNodeId = null;
  state.selectedConnectionId = null;

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
  presentState.branchResolve = null;
  presentState.descriptions = {};

  document.body.classList.remove('presentation-mode');

  const hints = document.querySelector('.shortcuts-hint');
  if (hints) hints.style.display = '';

  document.getElementById('branchOverlay').classList.remove('visible');

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
  if (label) label.textContent = '当前步骤';
}

function renderPresentZoomPreview(node, connStep) {
  const dock = document.getElementById('presentZoomDock');
  const preview = document.getElementById('presentZoomPreview');
  const label = document.getElementById('presentZoomLabel');
  if (!dock || !preview) return;

  if (connStep) {
    if (label) label.textContent = '当前路径';
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
          <span class="route-arrow">→</span><span>${escapeHtml(conn.label || '路径')}</span>
          <span class="route-arrow">→</span><span>${escapeHtml(toNode?.label || '?')}</span></div>
      </div>`;
    dock.classList.add('has-preview');
    return;
  }

  if (label) label.textContent = '当前步骤';

  if (!node) {
    clearPresentZoomPreview();
    return;
  }

  const scale = getPresentZoomScale(node);
  const w = Math.round(node.w * scale);
  const h = Math.round(node.h * scale);
  preview.innerHTML = `
    <div class="present-zoom-node shape-${getNodeVisualShape(node.shape)}" style="width:${w}px;height:${h}px">
      <div class="present-zoom-shape" style="width:100%;height:100%;background:${node.fillColor};border-color:${node.strokeColor}">
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
    document.getElementById('sidebarStepNum').textContent = '步骤 —';
    document.getElementById('sidebarTitle').textContent = '按 → 开始演示';
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
    inList.innerHTML = inItems.length ? inItems.join('') : '<li>（无来路连线）</li>';
    outList.innerHTML = outItems.length ? outItems.join('') : '<li>（无去路连线）</li>';
  };

  if (step.connId) {
    const conn = state.connections.find(c => c.id === step.connId);
    if (!conn) return;
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    const cond = conn.label || '默认路径';

    document.getElementById('sidebarStepNum').textContent = `路径 ${nodeStepNum}`;
    document.getElementById('sidebarTitle').textContent = `沿「${cond}」前进`;
    document.getElementById('sidebarType').textContent = '连线路径';
    document.getElementById('sidebarRefId').textContent = '—';
    document.getElementById('sidebarRole').textContent = '—';
    document.getElementById('sidebarDuration').textContent = '—';
    document.getElementById('sidebarDesc').textContent = fromNode && toNode
      ? `正在从「${fromNode.label}」沿「${cond}」前往「${toNode.label}」。再按一次下一步到达目标节点。`
      : '沿当前连线前进中。';
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
    || '执行该流程步骤。';

  document.getElementById('sidebarStepNum').textContent = `步骤 ${nodeStepNum}`;
  document.getElementById('sidebarTitle').textContent = node.label;
  document.getElementById('sidebarType').textContent = typeName;
  document.getElementById('sidebarRefId').textContent = node.refId ?? '—';
  document.getElementById('sidebarRole').textContent = node.role?.trim() || '—';
  document.getElementById('sidebarDuration').textContent =
    node.duration ? `${node.duration} 天` : '—';
  document.getElementById('sidebarDesc').textContent = desc;

  const branchRow = document.getElementById('sidebarBranchRow');
  const outConns = state.connections.filter(c => c.from === node.id);
  if (outConns.length > 1) {
    document.getElementById('sidebarBranch').textContent =
      outConns.map(c => c.label || '默认').join(' / ');
    branchRow.style.display = 'flex';
  } else {
    branchRow.style.display = 'none';
  }

  setPathLists();
  renderPresentZoomPreview(node, null);
}

// 更新演示视图
function updatePresentationView() {
  const nodeStepNum = presentState.cursor >= 0
    ? countPresentationNodeSteps(presentState.cursor)
    : 0;

  const stepInfo = document.getElementById('presentStepInfo');
  stepInfo.innerHTML = presentState.cursor < 0
    ? '步骤 <span>按 → 开始</span>'
    : `步骤 <span>${nodeStepNum}</span>`;

  const floatIndicator = document.getElementById('presentFloatIndicator');
  let currentLabel = '未开始';
  const step = getPresentationPathItem();
  if (step?.nodeId) {
    const node = state.nodes.find(n => n.id === step.nodeId);
    if (node) currentLabel = node.label;
  } else if (step?.connId) {
    const conn = state.connections.find(c => c.id === step.connId);
    const toNode = conn ? state.nodes.find(n => n.id === conn.to) : null;
    currentLabel = conn?.label
      ? `→ ${conn.label} → ${toNode?.label || ''}`
      : `→ ${toNode?.label || '下一节点'}`;
  }
  floatIndicator.innerHTML = `<span class="step-num">${nodeStepNum > 0 ? nodeStepNum : '—'}</span> · 当前：${escapeHtml(currentLabel)}`;
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

  let conn = outConns[0];
  if (outConns.length > 1) {
    conn = await showBranchSelector(outConns);
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

    overlay.classList.add('visible');
    presentState.branchResolve = resolve;
  });
}

// 演示：上一步（沿已走过的路径原路退回）
function presentPrev() {
  if (!presentState.active) return;
  if (presentState.cursor < 0) return;

  document.getElementById('branchOverlay').classList.remove('visible');
  presentState.branchResolve = null;

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

  document.getElementById('branchOverlay').classList.remove('visible');
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
  document.getElementById('branchOverlay').classList.remove('visible');

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

    const conn = outConns[0];
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
      '详细说明': n.detail || '',
      '耗时天': n.duration || 0,
      '泳道': n.lane ?? '',
      '图层': n.layer ?? '',
      '目标页': formatTargetPageForText(n),
    }));
  const connData = state.connections.map(c => ({
    '起点编号': refByNodeId.get(c.from),
    '终点编号': refByNodeId.get(c.to),
    '条件': c.label || '',
  })).filter(c => c['起点编号'] != null && c['终点编号'] != null);
  buildExcelWorkbook({ nodeData, connData }, 'DiagramWeave流程数据.xlsx');
  showToast('已导出当前流程到 Excel');
}

function exportProjectToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    return;
  }
  const payload = getFlowDocumentPayload();
  const json = JSON.stringify(payload, null, 2);
  const chunkSize = 30000;
  const chunks = [];
  for (let i = 0; i < json.length; i += chunkSize) chunks.push(json.slice(i, i + chunkSize));

  const wb = XLSX.utils.book_new();
  const summaryRows = [
    ['DiagramWeave 完整工作文件'],
    ['说明', '此 Excel 可作为 JSON 之外的完整备份格式。请用 DiagramWeave 的“加载完整工作文件 Excel”恢复。'],
    ['保存时间', new Date().toISOString()],
    ['页面/节点/连线等完整数据保存在隐藏工作表 _DiagramWeaveJSON 中。'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 18 }, { wch: 86 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, '说明');

  const dataRows = [
    ['format', 'DiagramWeaveProjectExcel'],
    ['version', '1'],
    ['chunkCount', String(chunks.length)],
    ...chunks.map((chunk, index) => [`chunk${index + 1}`, chunk]),
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);
  dataSheet['!cols'] = [{ wch: 14 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, dataSheet, '_DiagramWeaveJSON');
  wb.Workbook = wb.Workbook || {};
  wb.Workbook.Sheets = [{ Hidden: 0 }, { Hidden: 1 }];

  XLSX.writeFile(wb, getExportBaseName() + '.diagramweave.xlsx');
  showToast('已保存完整 Excel 工作文件');
}

function buildExcelWorkbook(data, filename) {
  const wb = XLSX.utils.book_new();
  const nodeData = data?.nodeData ?? [
    { '编号': 1, '简介': '开始', '角色': '', '形状': 'terminator', '详细说明': '流程起点', '耗时天': 0, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 2, '简介': '提交申请', '角色': '申请人', '形状': 'rectangle', '详细说明': '填写并提交表单', '耗时天': 0.5, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 3, '简介': '经理审批', '角色': '经理', '形状': 'rectangle', '详细说明': '审核材料', '耗时天': 2, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 4, '简介': '通过？', '角色': '经理', '形状': 'diamond', '详细说明': '', '耗时天': 0, '泳道': '', '图层': '', '目标页': '' },
    { '编号': 5, '简介': '结束', '角色': '', '形状': 'terminator', '详细说明': '流程结束', '耗时天': 0, '泳道': '', '图层': '', '目标页': '' },
  ];
  const connData = data?.connData ?? [
    { '起点编号': 1, '终点编号': 2, '条件': '' },
    { '起点编号': 2, '终点编号': 3, '条件': '' },
    { '起点编号': 3, '终点编号': 4, '条件': '' },
    { '起点编号': 4, '终点编号': 5, '条件': '是' },
  ];

  const nodeSheet = XLSX.utils.json_to_sheet(nodeData);
  nodeSheet['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 28 },
    { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, nodeSheet, '节点表');

  const connSheet = XLSX.utils.json_to_sheet(connData);
  connSheet['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, connSheet, '连线表');

  const helpRows = [
    { '列名': '编号', '说明': '节点唯一编号，连线表用同一编号', '必填': '是', '示例': '1, 2, 3' },
    { '列名': '简介', '说明': '形状上显示的一行标题', '必填': '建议', '示例': '开始、提交申请' },
    { '列名': '角色', '说明': '负责该步骤的角色', '必填': '否', '示例': '申请人、经理' },
    { '列名': '形状', '说明': '图形类型（见下方列表）', '必填': '否', '示例': 'rectangle' },
    { '列名': '详细说明', '说明': '步骤详细内容介绍', '必填': '否', '示例': '填写表单并上传附件' },
    { '列名': '耗时天', '说明': '该步骤需时（天，可小数）', '必填': '否', '示例': '0.5, 2' },
    { '列名': '泳道', '说明': '泳道图分区（从 0 起）', '必填': '否', '示例': '0, 1' },
    { '列名': '图层', '说明': '图层编号', '必填': '否', '示例': '0' },
    { '列名': '目标页', '说明': '跨页引用时填目标页名称', '必填': '否', '示例': '页面 2' },
    { '列名': '', '说明': '', '必填': '', '示例': '' },
    { '列名': '起点编号', '说明': '连线表：起始节点编号', '必填': '是', '示例': '1' },
    { '列名': '终点编号', '说明': '连线表：目标节点编号', '必填': '是', '示例': '2' },
    { '列名': '条件', '说明': '连线条件标签', '必填': '否', '示例': '是、否' },
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

function parseExcelNodeRow(row) {
  const id = pickExcelField(row, ['编号', 'id', 'ID', 'refId']);
  const label = pickExcelField(row, ['简介', 'label', '名称', '节点名称', 'name']);
  const role = pickExcelField(row, ['角色', 'role']);
  const shape = pickExcelField(row, ['形状', 'shape', 'type', '图形']) || 'rectangle';
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
    detail: sanitizeExcelText(detail, MAX_EXCEL_DETAIL_LENGTH),
    duration,
    lane: laneRaw !== '' ? Math.max(0, Math.min(99999, parseInt(laneRaw, 10) || 0)) : undefined,
    layer: layerRaw !== '' ? Math.max(0, Math.min(9999, parseInt(layerRaw, 10) || 0)) : undefined,
    targetPage: sanitizeExcelText(targetPage, MAX_EXCEL_TARGET_PAGE_LENGTH),
  };
}

function showExcelDataDialog() {
  document.getElementById('excelDataOverlay').classList.add('visible');
}

function hideExcelDataDialog() {
  document.getElementById('excelDataOverlay').classList.remove('visible');
}

function triggerExcelUpload() {
  document.getElementById('excelInput').click();
}

function triggerProjectExcelUpload() {
  document.getElementById('projectExcelInput').click();
}

function handleProjectExcelLoad(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    e.target.value = '';
    return;
  }
  processProjectExcelFile(file);
  e.target.value = '';
}

function processProjectExcelFile(file) {
  if (file.size > MAX_EXCEL_FILE_BYTES) {
    showToast(`Excel 文件过大，最大允许 5MB`);
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
      const sheetName = workbook.SheetNames.find(n => n === '_DiagramWeaveJSON' || n === 'DiagramWeaveJSON');
      if (!sheetName) {
        showToast('未找到完整工作文件数据，请使用“上传并导入”读取普通 Excel 数据表');
        return;
      }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false });
      const map = new Map(rows.map(row => [String(row[0] || ''), String(row[1] || '')]));
      if (map.get('format') !== 'DiagramWeaveProjectExcel') {
        showToast('Excel 工作文件格式无效');
        return;
      }
      const chunkCount = Math.max(0, parseInt(map.get('chunkCount') || '0', 10));
      let json = '';
      for (let i = 1; i <= chunkCount; i++) json += map.get(`chunk${i}`) || '';
      if (!json) {
        showToast('Excel 工作文件缺少图形数据');
        return;
      }
      const raw = JSON.parse(json);
      if (loadFlowDocumentPayload(raw)) hideExcelDataDialog();
    } catch (err) {
      showToast('Excel 工作文件解析失败：' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleExcelLoad(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    showToast('Excel 库未加载，请确认 vendor 目录完整');
    e.target.value = '';
    return;
  }
  processExcelFile(file);
  e.target.value = '';
}

function processExcelFile(file) {
  if (file.size > MAX_EXCEL_FILE_BYTES) {
    showToast(`Excel 文件过大，最大允许 5MB`);
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const nodeSheetName = workbook.SheetNames.find(n => n.includes('节点')) || workbook.SheetNames[0];
      const connSheetName = workbook.SheetNames.find(n => n.includes('连线')) || workbook.SheetNames[1];
      const nodeData = XLSX.utils.sheet_to_json(workbook.Sheets[nodeSheetName]);
      const connData = connSheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[connSheetName]) : [];

      if (nodeData.length === 0) {
        showToast('Excel 中没有找到节点数据');
        return;
      }
      if (nodeData.length > MAX_EXCEL_NODE_ROWS) {
        showToast(`Excel 节点超限，最多允许 ${MAX_EXCEL_NODE_ROWS} 行`);
        return;
      }
      if (connData.length > MAX_EXCEL_CONN_ROWS) {
        showToast(`Excel 连线超限，最多允许 ${MAX_EXCEL_CONN_ROWS} 行`);
        return;
      }

      const nodeRows = [];

      nodeData.forEach(row => {
        const parsed = parseExcelNodeRow(row);
        if (parsed.id === '' || parsed.id === undefined || parsed.id === null) return;
        const refId = parseInt(parsed.id, 10);
        if (isNaN(refId)) return;
        nodeRows.push({
          refId,
          label: parsed.label,
          role: parsed.role,
          shape: parsed.shape,
          detail: parsed.detail,
          duration: parsed.duration,
          lane: parsed.lane,
          layer: parsed.layer,
          targetPage: parsed.targetPage,
        });
      });

      const connRows = [];
      connData.forEach(row => {
        const from = parseInt(pickExcelField(row, ['起点编号', 'from', '起始', 'source']), 10);
        const to = parseInt(pickExcelField(row, ['终点编号', 'to', '目标', 'target']), 10);
        if (isNaN(from) || isNaN(to)) return;
        connRows.push({
          from,
          to,
          label: sanitizeExcelText(pickExcelField(row, ['条件', 'label', '标签']) || '', MAX_EXCEL_LABEL_LENGTH),
        });
      });

      if (nodeRows.length === 0) {
        showToast('未解析到有效节点行，请检查「编号」列');
        return;
      }

      applyFlowData(nodeRows, connRows, false);
      hideExcelDataDialog();
      showToast(`已从 Excel 导入 ${state.nodes.length} 个节点，${state.connections.length} 条连线`);
    } catch (err) {
      showToast('Excel 解析失败：' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
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
      if (typeof DiagramWeave !== 'undefined') {
        DiagramWeave.renderPageTabs();
        DiagramWeave.renderLayerPanel();
      }
    });
    refreshConnRouteLabelsFromI18n();
  }
  if (typeof DiagramWeaveBootstrap !== 'undefined') {
    await DiagramWeaveBootstrap.ensureRuntime();
    await DiagramWeaveBootstrap.checkRemoteUpdate();
    await DiagramWeaveBootstrap.loadTemplateLibrary();
  }
  if (typeof DiagramWeave !== 'undefined') DiagramWeave.mergeShapeRegistry();
  initConnRouteAlgorithms();
  if (typeof DiagramWeaveContent !== 'undefined') {
    await DiagramWeaveContent.loadContentPack({ forceRemote: false });
    initConnRouteAlgorithms();
  }
  initColorSwatches();
  initFastTooltips(document.querySelector('.toolbar'));
  initFastTooltips(document.getElementById('propertiesPanel'));
  initConnRouteMode();
  initShapeTypeSelect();
  setTool('select');
  initTemplates();

  if (typeof DiagramWeave !== 'undefined') {
    DiagramWeave.initDocument();
    DiagramWeave.loadChineseFont();
  }
  renderAll();

  if (location.protocol === 'file:' && !sessionStorage.getItem('fc-file-protocol-hint')) {
    sessionStorage.setItem('fc-file-protocol-hint', '1');
    setTimeout(() => {
      showToast(typeof t === 'function' ? t('toast.useBat') : '建议双击 bat 启动');
    }, 800);
  }
}
bootDiagramWeave();
