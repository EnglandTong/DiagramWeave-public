/**
 * DiagramWeave Node Lifecycle
 *
 * 從 flowchart-editor.js 抽取的節點生命週期管理（Phase 1 拆分第 3 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveNodeLifecycle。
 *
 * 包含：
 * - 形狀元數據（shapeDefaults / shapeNames / shapeLabel）
 * - 節點創建（createNode、refId 管理）
 * - 節點渲染（renderNode、renderAllNodes、brief 刷新）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：applyNodeStrokeColor、escapeHtml、
 *   getDefaultNodeFill、getDefaultNodeStroke、getNodeVisualShape、
 *   getSelectedNodeIds、resolvePageName、setupNodeEvents、syncNodeOutlineSvg、
 *   syncPortElements、updateCanvasEmptyState
 * - DiagramWeave / DiagramWeaveNodeColors / DiagramWeaveViewportNav 命名空間（typeof 守衛）
 * - window.t（i18n）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveGroupContainer, DiagramWeaveViewportNav, applyNodeStrokeColor, escapeHtml, getDefaultNodeFill, getDefaultNodeStroke, getNodeVisualShape, getSelectedNodeIds, resolvePageName, setupNodeEvents, syncNodeOutlineSvg, syncPortElements, updateCanvasEmptyState, t */
(function initDiagramWeaveNodeLifecycle(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const canvasTransform = typeof document !== 'undefined' ? document.getElementById('canvasTransform') : null;

/**
 * Phase 3-2：根据文本内容自动调整节点尺寸。
 * 策略：仅放大（shrink=false）或也缩小（shrink=true），受 minW/maxW/minH/maxH 约束。
 * 返回 { w, h, changed } —— changed=true 表示尺寸实际发生了变化。
 * 不修改传入 node，调用方自行更新 node.w / node.h。
 */
function fitNodeToLabel(node, opts) {
  const label = String(node.label || '');
  const lines = label.split('\n');
  const o = opts || {};
  const fontSize = o.fontSize || 13;
  const lineHeight = fontSize * 1.3 + 8; // + padding 4*2
  const padX = 24; // left+right padding (12*2)

  // 测量：用离屏 canvas 测最宽行
  let measureCtx = null;
  if (typeof document !== 'undefined') {
    if (!fitNodeToLabel._canvas) {
      fitNodeToLabel._canvas = document.createElement('canvas');
    }
    measureCtx = fitNodeToLabel._canvas.getContext('2d');
    measureCtx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  }
  let maxLineW = 0;
  for (const ln of lines) {
    let w;
    if (measureCtx) {
      w = measureCtx.measureText(ln || ' ').width;
    } else {
      // fallback：估算
      w = (ln || '').length * fontSize * 0.55;
    }
    maxLineW = Math.max(maxLineW, w);
  }
  // 多行自动换行：如果单行超 maxW，按单词拆行后重新估算
  const maxW = Math.max(o.minW || 80, o.maxW || 280);
  let effectiveLines = lines;
  if (maxLineW + padX > maxW && lines.length === 1) {
    const perLine = Math.max(10, Math.floor((maxW - padX) / (fontSize * 0.55)));
    const words = lines[0].split(/\s+/);
    const rebuilt = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > perLine) {
        if (cur) rebuilt.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + ' ' + w).trim();
      }
    }
    if (cur) rebuilt.push(cur.trim());
    effectiveLines = rebuilt.length ? rebuilt : lines;
    maxLineW = Math.min(maxLineW, maxW - padX);
  }

  const contentW = maxLineW + padX;
  const contentH = effectiveLines.length * lineHeight + 8; // top+bottom padding

  const minW = o.minW || 80;
  const minH = o.minH || 40;
  const hardMaxW = o.maxW || 360;
  const hardMaxH = o.maxH || 200;

  let targetW = Math.round(Math.max(minW, Math.min(hardMaxW, contentW)));
  let targetH = Math.round(Math.max(minH, Math.min(hardMaxH, contentH)));

  // shrink 策略：默认只放大（避免意外缩小用户手工调的尺寸）
  const shrink = !!o.shrink;
  if (!shrink) {
    targetW = Math.max(targetW, node.w || 80);
    targetH = Math.max(targetH, node.h || 40);
  }

  const changed = targetW !== node.w || targetH !== node.h;
  return { w: targetW, h: targetH, changed };
}

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
  // Phase 3：清除视口裁剪设置的隐藏，保证重新渲染的节点可见
  el.style.display = '';

  if (!isNew) {
    el.className = `node shape-${getNodeVisualShape(node.shape)}` + (getSelectedNodeIds().includes(node.id) ? ' selected' : '');
  }

  // Phase 2：容器样式与堆叠（容器 z-index 1 下沉到普通节点之下，普通节点保持 CSS 默认）
  // 必须置于 className 重置之后，否则 container-node 类名会被覆盖
  if (typeof DiagramWeaveGroupContainer !== 'undefined') {
    el.classList.toggle('container-node', node.isContainer === true);
    const zIndex = DiagramWeaveGroupContainer.getNodeZIndex(node);
    if (zIndex === null) el.style.zIndex = '';
    else el.style.zIndex = String(zIndex);
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
  // Phase 3：视口裁剪——仅渲染视口（含 CULL_MARGIN）附近的节点，
  // 越界节点保留 DOM 元素但 display:none（bounds 为 null 时不裁剪）
  const cullBounds = typeof DiagramWeaveViewportNav !== 'undefined'
    ? DiagramWeaveViewportNav.getViewportBounds()
    : null;
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
    if (cullBounds && !DiagramWeaveViewportNav.nodeInViewport(n, cullBounds)) {
      const el = document.getElementById(n.id);
      if (el) el.style.display = 'none';
      return;
    }
    renderNode(n);
  });
  updateCanvasEmptyState();
}

  // ===== 命名空间挂载 =====
  global.DiagramWeaveNodeLifecycle = {
    shapeDefaults,
    shapeNames,
    shapeLabel,
    createNode,
    fitNodeToLabel,
    getNextRefId,
    ensureNodeRefIds,
    formatNodeOutgoingConnections,
    renderNode,
    updateNodeBriefEl,
    refreshAllNodeBriefs,
    renderAllNodes,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
