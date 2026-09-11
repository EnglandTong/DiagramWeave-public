/**
 * DiagramWeave Inspector Panels
 *
 * 從 flowchart-editor.js 抽取的檢查器面板群（Phase 1 拆分第 19 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveInspectorPanels。
 *
 * 包含：
 * - 連線路由規則面板與折點編輯（renderRoutingRulesPanel / showRoutingRulesPanel /
 *   hideRoutingRulesPanel / updateRoutingRulesFromPanel / updateSelectedConnectionRouting /
 *   addSelectedConnectionWaypoint / moveSelectedConnectionWaypoint /
 *   lockSelectedConnectionWaypoint / removeSelectedConnectionWaypoint）
 * - 版本歷史（initVersionHistory / captureVersionSnapshot / renderVersionHistory /
 *   showVersionHistory / hideVersionHistory / createNamedVersionSnapshot /
 *   restoreVersionSnapshot / clearVersionHistory；versionHistoryStore 詞法狀態由本模塊持有）
 * - 質量檢查（renderQualityChecker / showQualityChecker / hideQualityChecker /
 *   locateQualityIssue / applyQualityIssueFix）
 * - 流程分析（renderProcessAnalysis / showProcessAnalysis / hideProcessAnalysis /
 *   locateAnalysisNode）
 * - 評審面板（renderReviewPanel / showReviewPanel / hideReviewPanel /
 *   createSelectedReviewThread / appendReviewComment / updateReviewThreadStatus /
 *   locateReviewThread）
 * - AI 設置（renderAISettings / showAISettings / hideAISettings / setGlobalAIState）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / projectSession（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：renderAll、saveState、showToast
 * - 已提取模塊函數：clearCanvasNodes、getFlowDocumentPayload、isMobileViewMode、
 *   loadFlowDocumentPayload、renderConnections、selectConnection、selectNode
 * - DiagramWeave / DiagramWeaveContracts / DiagramWeaveHistory / DiagramWeaveI18n /
 *   DiagramWeaveProcessAnalysis / DiagramWeaveRoutingRules 命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveProcessAnalysis, clearCanvasNodes, getFlowDocumentPayload, isMobileViewMode, loadFlowDocumentPayload, renderConnections, selectConnection, selectNode */
(function initDiagramWeaveInspectorPanels(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const projectSession = DiagramWeaveEditorCore.projectSession;

  let versionHistoryStore = null;
  let lastHistoryFingerprint = '';
  function getVersionHistoryStore() { return versionHistoryStore; }
  function resetHistoryFingerprint() { lastHistoryFingerprint = ''; }

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
  global.DiagramWeaveInspectorPanels = {
    addSelectedConnectionWaypoint,
    appendReviewComment,
    applyQualityIssueFix,
    captureVersionSnapshot,
    clearVersionHistory,
    createNamedVersionSnapshot,
    createSelectedReviewThread,
    getQualityDocument,
    getReviewThreads,
    getVersionHistoryStore,
    hideAISettings,
    hideProcessAnalysis,
    hideQualityChecker,
    hideReviewPanel,
    hideRoutingRulesPanel,
    hideVersionHistory,
    initVersionHistory,
    locateAnalysisNode,
    locateQualityIssue,
    locateReviewThread,
    lockSelectedConnectionWaypoint,
    moveSelectedConnectionWaypoint,
    removeSelectedConnectionWaypoint,
    renderAISettings,
    renderProcessAnalysis,
    renderQualityChecker,
    renderReviewPanel,
    renderRoutingRulesPanel,
    renderVersionHistory,
    resetHistoryFingerprint,
    restoreVersionSnapshot,
    setGlobalAIState,
    showAISettings,
    showProcessAnalysis,
    showQualityChecker,
    showReviewPanel,
    showRoutingRulesPanel,
    showVersionHistory,
    updateReviewThreadStatus,
    updateRoutingRulesFromPanel,
    updateSelectedConnectionRouting,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
