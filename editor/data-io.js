/**
 * DiagramWeave Data IO
 *
 * 從 flowchart-editor.js 抽取的檔案 I/O、Excel 導入導出與設置（Phase 1 拆分第 7 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveDataIO。
 *
 * 包含：
 * - 項目檔案保存/打開（saveProjectFile / openProjectFileWithPicker / File System Access + 自動保存）
 * - JSON 導入導出（exportJSON / importJSON / handleFileLoad / loadFlowDocumentPayload）
 * - Excel 模板/導入/導出（exportExcelTemplate / loadEditableProjectExcelWorkbook / buildProjectExcelWorkbook）
 * - 設置與更新檢查（showSettingsDialog / saveSettingsFromDialog / runUpdateCheckFromSettings）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / projectSession / DEFAULT_*（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：createImportPreview、formatTargetPageForText、
 *   getDefaultNodeFill、getDefaultNodeStroke、getVersionHistoryStore、initConnRouteAlgorithms、
 *   initConnRouteMode、initShapeTypeSelect、isKnownFlowShape、isMobileViewMode、
 *   normalizePortName、queueDocumentImport、resetHistoryFingerprint、showConfirm、
 *   showImportPreview、startMappingWizard
 * - 已提取模塊函數：clearCanvasNodes、ensureNodeRefIds、getExportBaseName、renderConnections
 * - DiagramWeave / DiagramWeaveSanitize / DiagramWeaveBootstrap 等命名空間（typeof 守衛）
 * - window.t（i18n）、XLSX（vendor）
 */
/* global DiagramWeaveEditorCore, clearCanvasNodes, createImportPreview, ensureNodeRefIds, formatTargetPageForText, getDefaultNodeFill, getDefaultNodeStroke, getExportBaseName, getVersionHistoryStore, initConnRouteAlgorithms, initConnRouteMode, initShapeTypeSelect, isKnownFlowShape, isMobileViewMode, normalizePortName, queueDocumentImport, renderConnections, resetHistoryFingerprint, showConfirm, showImportPreview, startMappingWizard, t */
(function initDiagramWeaveDataIO(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const projectSession = DiagramWeaveEditorCore.projectSession;
  const DEFAULT_PROJECT_NAME = DiagramWeaveEditorCore.DEFAULT_PROJECT_NAME;
  const DEFAULT_AUTOSAVE_SECONDS = DiagramWeaveEditorCore.DEFAULT_AUTOSAVE_SECONDS;

const MAX_EXCEL_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EXCEL_NODE_ROWS = 2000;
const MAX_EXCEL_CONN_ROWS = 4000;
const MAX_EXCEL_LABEL_LENGTH = 80;
const MAX_EXCEL_ROLE_LENGTH = 80;
const MAX_EXCEL_DETAIL_LENGTH = 800;
const MAX_EXCEL_TARGET_PAGE_LENGTH = 80;
const NATIVE_VISIO_EXT_RE = /\.(vsdx|vsd|vsdm|vdx)$/i;

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
  const historyStore = getVersionHistoryStore();
  if (includeHistory && historyStore) payload.versionHistory = await historyStore.list(projectSession.historyId);
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
  resetHistoryFingerprint();
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
  const historyStore = getVersionHistoryStore();
  if (Array.isArray(raw.versionHistory) && historyStore) void historyStore.importRows(projectSession.historyId, raw.versionHistory);
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
  const themeSel = document.getElementById('settingsTheme');
  if (themeSel && typeof DiagramWeaveUIUtils !== 'undefined') {
    const stored = (function () {
      try { return localStorage.getItem('diagramweave.theme') || 'system'; } catch (_) { return 'system'; }
    })();
    themeSel.value = stored;
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
  global.DiagramWeaveDataIO = {
    buildExcelWorkbook,
    buildProjectExcelWorkbook,
    clearExcelImportStatus,
    downloadProjectExcel,
    downloadProjectJson,
    downloadProjectVso,
    ensureProjectFileForAutosave,
    exportCanvasToExcel,
    exportExcelTemplate,
    exportJSON,
    exportProjectToExcel,
    fileSystemAccessSupported,
    getExcelOpenPickerTypes,
    getExcelSheetRows,
    getFlowDocumentPayload,
    getProjectExcelArrayBuffer,
    getProjectFileBaseName,
    handleExcelLoad,
    handleFileLoad,
    handleProjectExcelLoad,
    hasProjectWritePermission,
    hideExcelDataDialog,
    hideSettingsDialog,
    importExcelWorkbookData,
    importJSON,
    isNativeVisioFileName,
    isStaleFileHandleError,
    loadEditableProjectExcelWorkbook,
    loadFlowDocumentPayload,
    loadProjectExcelArrayBuffer,
    newProject,
    normalizeAutosaveSeconds,
    normalizeProjectName,
    openExcelFilePicker,
    openProjectFileWithPicker,
    openReleasePageFromSettings,
    parseExcelBool,
    parseExcelLabelPos,
    parseExcelNodeRow,
    parseExcelNumber,
    parseOptionalExcelNumber,
    pauseAutosave,
    pickExcelField,
    processExcelFile,
    processProjectExcelFile,
    promptInitialProjectSave,
    reportExcelImportError,
    requestProjectSaveAs,
    resetToBlankProject,
    restartAutosaveTimer,
    runUpdateCheckFromSettings,
    sanitizeExcelText,
    saveProjectFile,
    saveSettingsFromDialog,
    setExcelImportStatus,
    showExcelDataDialog,
    showExcelImportWorking,
    showNativeVisioUnsupported,
    showSettingsDialog,
    showVisioPreviewResult,
    startBlankProjectAndSave,
    syncContentPackFromSettings,
    triggerExcelUpload,
    triggerProjectExcelUpload,
    updateProjectTitle,
    waitForNextPaint,
    writeProjectFile,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
