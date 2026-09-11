/**
 * DiagramWeave Import Preview
 *
 * 從 flowchart-editor.js 抽取的導入預覽工作流（Phase 1 拆分第 18 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveImportPreviewUI。
 *
 * 包含：
 * - 預覽狀態（pendingImportPreview / importPreviewTrigger）
 * - 預覽創建與展示（createImportPreview / showImportPreview / queueDocumentImport）
 * - 外部圖表文件處理（processExternalDiagramFile）
 * - 應用與取消（applyPendingImportPreview / cancelImportPreview）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - flowchart-editor.js 頂層函數：showToast
 * - 已提取模塊函數：loadFlowDocumentPayload、startMappingWizard
 * - DiagramWeaveEditorOverlay / DiagramWeaveExtensionKernel / DiagramWeaveImportPreview
 *   命名空間（typeof 守衛）
 */
/* global DiagramWeaveEditorOverlay, loadFlowDocumentPayload, startMappingWizard */
(function initDiagramWeaveImportPreviewUI(global) {
  'use strict';

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
  if (typeof DiagramWeaveEditorOverlay !== 'undefined') {
    DiagramWeaveEditorOverlay.closeOverlay(overlay, {
      bodyChildren: [...document.body.children],
      onClosed: () => {
        pendingImportPreview = null;
        if (importPreviewTrigger?.focus) importPreviewTrigger.focus();
      },
    });
  } else if (overlay?.classList.contains('visible')) {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    [...document.body.children].forEach((element) => { if (element !== overlay) element.inert = false; });
    pendingImportPreview = null;
    if (importPreviewTrigger?.focus) importPreviewTrigger.focus();
  }
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
  global.DiagramWeaveImportPreviewUI = {
    applyPendingImportPreview,
    cancelImportPreview,
    createImportPreview,
    processExternalDiagramFile,
    queueDocumentImport,
    showImportPreview,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
