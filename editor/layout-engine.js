/**
 * DiagramWeave Layout Engine
 *
 * 從 flowchart-editor.js 抽取的自動佈局引擎（Phase 1 拆分第 8 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveLayoutEngine。
 *
 * 包含：
 * - 佈局對話框與參數（setLayoutDensity / setLayoutEngine / showLayoutDialog）
 * - Dagre Sugiyama 分層佈局（autoLayoutDagre）
 * - 最長路徑 + 重心排序佈局（autoLayoutNodes）
 * - 泳道佈局（autoLayoutSwimlane / renderSwimlanes）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：autoAdjustPorts、hasGraphPath
 * - dagre（vendor，typeof 守衛）、DiagramWeave 命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorCore, autoAdjustPorts, hasGraphPath */
(function initDiagramWeaveLayoutEngine(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;

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
  global.DiagramWeaveLayoutEngine = {
    applyAutoLayout,
    autoLayoutDagre,
    autoLayoutNodes,
    autoLayoutSwimlane,
    hideLayoutDialog,
    renderSwimlanes,
    runAutoLayout,
    setLayoutDensity,
    setLayoutEngine,
    showLayoutDialog,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
