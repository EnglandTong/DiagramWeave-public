/**
 * DiagramWeave Templates
 *
 * 從 flowchart-editor.js 抽取的模板中心與確認對話框（Phase 1 拆分第 12 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveTemplates。
 *
 * 包含：
 * - 模板數據與圖標（allTemplates / flowchartTemplates / templateFavorites / templateIconSVG）
 * - 模板中心（initTemplates / rebuildAllTemplates / renderTemplateCenter / applyTemplate /
 *   toggleTemplateFavorite / showTemplateDialog / hideTemplateDialog / onTemplateDialogClick）
 * - 形狀類型選擇與頁面名解析（initShapeTypeSelect / resolvePageName）
 * - 確認對話框（showConfirm / hideConfirm）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：escapeHtml、normalizePortName、renderAll、showToast
 * - 已提取模塊函數：autoLayoutSwimlane、createNode、localeCompareTag、
 *   renderSwimlanes、runAutoLayout、saveState、shapeLabel
 * - DiagramWeave / DiagramWeaveBootstrap / DiagramWeaveEditorState / DiagramWeaveI18n /
 *   DiagramWeaveTemplateCenter 命名空間（typeof 守衛）
 *
 * 注意：allTemplates 會在 rebuildAllTemplates 中被重建（重新賦值），
 * 外部（command-system.js、e2e）通過 window.allTemplates live getter 讀取，
 * 該 getter 由 flowchart-editor.js 的別名塊定義並委託到 getAllTemplates()。
 */
/* global DiagramWeaveEditorCore, DiagramWeaveEditorState, autoLayoutSwimlane, createNode, escapeHtml, localeCompareTag, normalizePortName, renderSwimlanes, runAutoLayout, shapeLabel */
(function initDiagramWeaveTemplates(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;

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
  if (typeof DiagramWeaveEditorState !== 'undefined') DiagramWeaveEditorState.resetSelection(state);
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
  global.DiagramWeaveTemplates = {
    applyTemplate,
    getAllTemplates: () => allTemplates,
    hideConfirm,
    hideTemplateDialog,
    initShapeTypeSelect,
    initTemplates,
    onTemplateDialogClick,
    rebuildAllTemplates,
    renderTemplateCenter,
    resolvePageName,
    showConfirm,
    showTemplateDialog,
    toggleTemplateFavorite,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
