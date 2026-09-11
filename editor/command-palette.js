/**
 * DiagramWeave Command Palette
 *
 * 從 flowchart-editor.js 抽取的命令面板與字段映射嚮導（Phase 1 拆分第 15 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveCommandPalette。
 *
 * 包含：
 * - 命令上下文與註冊（getCommandContext / initEditorCommands）
 * - 面板渲染與開關（collectPaletteItems / renderCommandPalette / openCommandPalette /
 *   closeCommandPalette / runPaletteItem 外的焦點陷阱 trap*）
 * - 字段映射嚮導（startMappingWizard / cancelMappingWizard / renderMappingFields /
 *   collectCurrentMapping / refreshMappingPresetSelect / saveCurrentMappingPreset /
 *   loadSelectedMappingPreset / continueMappingToPreview）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：dismissCanvasEmptyState、escapeHtml、fitAllNodes、
 *   fitSelectedNodes、isMobileViewMode、redo、runAlignCommand、runDistributeCommand、
 *   setTool、showAISettings、showImportPreview、showProcessAnalysis、showQualityChecker、
 *   showReviewPanel、showRoutingRulesPanel、showVersionHistory、toggleOutlinePanel、
 *   undo、zoomReset
 * - 已提取模塊函數：autoLayoutNodes、getSelectedNodeIds、loadFlowDocumentPayload、
 *   runPaletteItem、showExportDialog、showTemplateDialog、triggerProjectExcelUpload
 * - DiagramWeave / DiagramWeaveEditorOverlay / DiagramWeaveExtensionKernel /
 *   DiagramWeaveFieldMapping / DiagramWeaveTemplates 命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorCore, DiagramWeaveEditorOverlay, DiagramWeaveGroupContainer, DiagramWeaveTemplates, autoLayoutNodes, dismissCanvasEmptyState, escapeHtml, fitAllNodes, fitSelectedNodes, getSelectedNodeIds, isMobileViewMode, loadFlowDocumentPayload, redo, runAlignCommand, runDistributeCommand, runPaletteItem, setTool, showAISettings, showExportDialog, showImportPreview, showProcessAnalysis, showQualityChecker, showReviewPanel, showRoutingRulesPanel, showTemplateDialog, showVersionHistory, toggleOutlinePanel, triggerProjectExcelUpload, undo, zoomReset */
(function initDiagramWeaveCommandPalette(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;

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
  // Phase 2：组合 / 容器 / 泳道集
  register('edit.group', '组合 / Group', ['组合', '分组', 'group'], 'Ctrl+G', () => DiagramWeaveGroupContainer.groupSelectedNodes(), () => getSelectedNodeIds().length > 1);
  register('edit.ungroup', '取消组合 / Ungroup', ['取消组合', '解组', 'ungroup'], 'Ctrl+Shift+G', () => DiagramWeaveGroupContainer.ungroupSelectedNodes(), () => getSelectedNodeIds().length > 0);
  register('edit.wrapContainer', '包装为容器 / Wrap in container', ['容器', '包装', 'container', 'wrap'], '', () => DiagramWeaveGroupContainer.wrapSelectionInContainer(), () => getSelectedNodeIds().length > 1);
  register('edit.unwrapContainer', '解除容器 / Unwrap container', ['容器', '解除', 'container', 'unwrap'], '', () => DiagramWeaveGroupContainer.unwrapContainer(), () => getSelectedNodeIds().length === 1);
  register('edit.toggleContainer', '切换容器模式 / Toggle container', ['容器', '切换', 'container', 'toggle'], '', () => DiagramWeaveGroupContainer.toggleContainerMode(), () => getSelectedNodeIds().length === 1);
  register('lane.nameSet', '命名泳道集 / Name swimlanes', ['泳道', '命名', 'swimlane', 'lane'], '', () => DiagramWeaveGroupContainer.createSwimlaneSetFromCurrentLanes(), () => state.nodes.some(n => n.lane !== undefined));
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
  const templates = DiagramWeaveTemplates.getAllTemplates().map((template, index) => ({ template, index }))
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
  if (typeof DiagramWeaveEditorOverlay !== 'undefined') {
    DiagramWeaveEditorOverlay.closeOverlay(overlay, {
      bodyChildren: [...document.body.children],
      onClosed: () => { if (commandPaletteTrigger?.focus) commandPaletteTrigger.focus(); },
    });
  } else if (overlay?.classList.contains('visible')) {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    [...document.body.children].forEach((element) => { if (element !== overlay) element.inert = false; });
    if (commandPaletteTrigger?.focus) commandPaletteTrigger.focus();
  }
}

function trapOverlayFocus(e, overlayId) {
  if (typeof DiagramWeaveEditorOverlay !== 'undefined'
      && DiagramWeaveEditorOverlay
      && typeof DiagramWeaveEditorOverlay.trapFocus === 'function') {
    return DiagramWeaveEditorOverlay.trapFocus(e, overlayId);
  }
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
  if (typeof DiagramWeaveEditorOverlay !== 'undefined') {
    DiagramWeaveEditorOverlay.closeOverlay(overlay, {
      bodyChildren: [...document.body.children],
      onClosed: () => {
        pendingMappingWizard = null;
        if (mappingWizardTrigger?.focus) mappingWizardTrigger.focus();
      },
    });
  } else if (overlay?.classList.contains('visible')) {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    [...document.body.children].forEach((element) => { if (element !== overlay) element.inert = false; });
    pendingMappingWizard = null;
    if (mappingWizardTrigger?.focus) mappingWizardTrigger.focus();
  }
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
  global.DiagramWeaveCommandPalette = {
    cancelMappingWizard,
    closeCommandPalette,
    collectCurrentMapping,
    collectPaletteItems,
    continueMappingToPreview,
    getCommandContext,
    initEditorCommands,
    loadSelectedMappingPreset,
    mappingSelectMarkup,
    openCommandPalette,
    refreshMappingPresetSelect,
    renderCommandPalette,
    renderMappingFields,
    saveCurrentMappingPreset,
    startMappingWizard,
    trapCommandPaletteFocus,
    trapImportPreviewFocus,
    trapMappingWizardFocus,
    trapOverlayFocus,
    updateMappingAutoLayoutDefault,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
