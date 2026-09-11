/**
 * DiagramWeave Presentation Mode
 *
 * 從 flowchart-editor.js 抽取的演示模式（Phase 1 拆分第 6 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeavePresentation。
 *
 * 包含：
 * - 演示進入/退出（enterPresentation / exitPresentation）
 * - 路徑導航（presentNext / presentPrev / presentFirst / presentLast、分支選擇器）
 * - 內容面板與縮放預覽（updateContentPanel / renderPresentZoomPreview）
 * - 步驟統計與樣式（countPresentationTotalSteps / applyPresentationStyles）
 * - AI 節點描述生成（generateNodeDescriptions）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / presentState（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：getNodeVisualShape、updateTransform
 * - 已提取模塊函數：getPortPos、renderAll、escapeHtml、showToast
 * - DiagramWeave / DiagramWeaveNodeColors 命名空間（typeof 守衛）
 * - window.t（i18n）
 */
/* global DiagramWeaveEditorCore, escapeHtml, getNodeVisualShape, getPortPos, t, updateTransform */
(function initDiagramWeavePresentation(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const presentState = DiagramWeaveEditorCore.presentState;
  const projectSession = DiagramWeaveEditorCore.projectSession;
  const DEFAULT_PROJECT_NAME = DiagramWeaveEditorCore.DEFAULT_PROJECT_NAME;
  const canvasWrapper = typeof document !== 'undefined' ? document.getElementById('canvasWrapper') : null;
  const connectionsLayer = typeof document !== 'undefined' ? document.getElementById('connectionsLayer') : null;

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

  // ===== 命名空间挂载 =====
  global.DiagramWeavePresentation = {
    findPresentationStartNode,
    getPresentationPathItem,
    isPresentationStepNode,
    detectPresentationStepPolarity,
    getPresentationStepPolarityLabel,
    countPresentationStepDistribution,
    countPresentationTotalSteps,
    getCurrentPresentationNodeId,
    getPresentationFocusNode,
    rebuildPresentationVisited,
    countPresentationNodeSteps,
    ensurePresentationTwoPaneLayout,
    enterPresentation,
    exitPresentation,
    generateNodeDescriptions,
    getPresentationPathContext,
    formatConnPathLabel,
    getPresentZoomScale,
    clearPresentZoomPreview,
    renderPresentZoomPreview,
    updatePresentZoomPreviewLayout,
    focusPresentationOnNode,
    updateContentPanel,
    updatePresentationView,
    applyPresentationStyles,
    clearPresentationStyles,
    cancelBranchSelector,
    getPresentationFreshOutConns,
    warnPresentationLoopBlocked,
    presentNext,
    showBranchSelector,
    presentPrev,
    presentFirst,
    presentLast,
    scrollToCurrentNode,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
