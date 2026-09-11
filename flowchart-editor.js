/* exported setAppLanguage, setNodeFillColor, setNodeStrokeColor, runExport, setLayoutDensity, setLayoutEngine, showLayoutDialog, applyAutoLayout, zoomIn, zoomOut, registerConnRouteMode, setConnRouteMode, editLabel, clearCanvas, bringToFront, sendToBack, deleteCurrentPage, updatePropPageName, updatePropConnFrom, updatePropConnTo, updatePropConnLabel, updatePropConnLabelPos, updatePropLabel, updatePropType, updatePropDetail, updatePropDuration, updatePropRole, openMobileReview, processExternalDiagramFile, applyPendingImportPreview, saveCurrentMappingPreset, loadSelectedMappingPreset, continueMappingToPreview, filterShapeLibrary, showStencilManager, hideStencilManager, handleStencilPackImport, hideRoutingRulesPanel, updateRoutingRulesFromPanel, updateSelectedConnectionRouting, addSelectedConnectionWaypoint, createNamedVersionSnapshot, clearVersionHistory, createSelectedReviewThread, hideAISettings, setGlobalAIState, togglePanelDrawer, updatePropTextColor, updatePropTargetPage, navigateOffpageTarget, updatePropLayer, switchFlowTableTab, addFlowTableNodeRow, addFlowTableConnRow, deleteFlowTableSelectedRows, toggleTextEditorHelp, applyFlowText, prepareFlowImportData, newProject, exportJSON, handleFileLoad, editConnectionLabel, focusConnectionProperties, deleteConnectionFromMenu, countPresentationTotalSteps, getCurrentPresentationNodeId, enterPresentation, presentFirst, presentLast, exportExcelTemplate, exportCanvasToExcel, exportProjectToExcel, parseExcelNodeRow, showExcelDataDialog, triggerExcelUpload, handleProjectExcelLoad, handleExcelLoad, showSettingsDialog, saveSettingsFromDialog, runUpdateCheckFromSettings, openReleasePageFromSettings, syncContentPackFromSettings getVersionHistoryStore, resetHistoryFingerprint, groupSelectedNodes, ungroupSelectedNodes, wrapSelectionInContainer, unwrapContainer, toggleContainerMode, createSwimlaneSetFromCurrentLanes */
// ===== 状态管理（已提取至 editor/editor-state.js → DiagramWeaveEditorCore）=====
var state = DiagramWeaveEditorCore.state;
var CONN_ROUTE_LABELS = DiagramWeaveEditorCore.CONN_ROUTE_LABELS;
var CONN_ROUTE_ALGORITHMS = DiagramWeaveEditorCore.CONN_ROUTE_ALGORITHMS;

/** 远程内容包形状 id → 画布渲染复用的内置 shape */
// ===== 形状库词法状态（已提取至 editor/shape-library.js）=====
// ===== 版本历史存储（已提取至 editor/inspector-panels.js → DiagramWeaveInspectorPanels）=====
var getVersionHistoryStore = DiagramWeaveInspectorPanels.getVersionHistoryStore;
var resetHistoryFingerprint = DiagramWeaveInspectorPanels.resetHistoryFingerprint;

var DEFAULT_PROJECT_NAME = DiagramWeaveEditorCore.DEFAULT_PROJECT_NAME;
var DEFAULT_AUTOSAVE_SECONDS = DiagramWeaveEditorCore.DEFAULT_AUTOSAVE_SECONDS;
var projectSession = DiagramWeaveEditorCore.projectSession;


// ===== 演示模式状态（已提取至 editor/editor-state.js）=====
var presentState = DiagramWeaveEditorCore.presentState;

// ===== 形状元数据（已提取至 editor/node-lifecycle.js）=====
var shapeDefaults = DiagramWeaveNodeLifecycle.shapeDefaults;
var shapeNames = DiagramWeaveNodeLifecycle.shapeNames;
var shapeLabel = DiagramWeaveNodeLifecycle.shapeLabel;

// ===== UI 工具：i18n/主题/颜色/提示（已提取至 editor/ui-utils.js → DiagramWeaveUIUtils）=====
var OFFICE_COLOR_NAMES = DiagramWeaveUIUtils.OFFICE_COLOR_NAMES;
var OFFICE_FILL_SWATCHES = DiagramWeaveUIUtils.OFFICE_FILL_SWATCHES;
var OFFICE_STROKE_SWATCHES = DiagramWeaveUIUtils.OFFICE_STROKE_SWATCHES;
var SHAPE_PORT_ANCHORS = DiagramWeaveUIUtils.SHAPE_PORT_ANCHORS;
var SHAPE_STROKE_SPECS = DiagramWeaveUIUtils.SHAPE_STROKE_SPECS;
var applyNodeStrokeColor = DiagramWeaveUIUtils.applyNodeStrokeColor;
var colorAccessibleName = DiagramWeaveUIUtils.colorAccessibleName;
var getDefaultNodeFill = DiagramWeaveUIUtils.getDefaultNodeFill;
var getDefaultNodeStroke = DiagramWeaveUIUtils.getDefaultNodeStroke;
var getShapePortAnchors = DiagramWeaveUIUtils.getShapePortAnchors;
var getThemeVar = DiagramWeaveUIUtils.getThemeVar;
var initColorSwatches = DiagramWeaveUIUtils.initColorSwatches;
var initFastTooltips = DiagramWeaveUIUtils.initFastTooltips;
var localeCompareTag = DiagramWeaveUIUtils.localeCompareTag;
var normalizeHexColor = DiagramWeaveUIUtils.normalizeHexColor;
var refreshConnRouteLabelsFromI18n = DiagramWeaveUIUtils.refreshConnRouteLabelsFromI18n;
var setAppLanguage = DiagramWeaveUIUtils.setAppLanguage;
var setNodeFillColor = DiagramWeaveUIUtils.setNodeFillColor;
var setNodeStrokeColor = DiagramWeaveUIUtils.setNodeStrokeColor;
var syncColorSwatchSelection = DiagramWeaveUIUtils.syncColorSwatchSelection;
var syncNodeOutlineSvg = DiagramWeaveUIUtils.syncNodeOutlineSvg;
var syncPortElements = DiagramWeaveUIUtils.syncPortElements;

// ===== 导出对话框（已提取至 editor/export-renderers.js → DiagramWeaveExportRenderers）=====
var hideExportDialog = DiagramWeaveExportRenderers.hideExportDialog;
var runExport = DiagramWeaveExportRenderers.runExport;
var showExportDialog = DiagramWeaveExportRenderers.showExportDialog;

// ===== 流程图模板库（已提取至 editor/templates.js → DiagramWeaveTemplates）=====
// allTemplates 在模块内会被重建；用 live getter 保持 window 契约（command-system.js / e2e 读取）
Object.defineProperty(window, 'allTemplates', { configurable: true, get() { return DiagramWeaveTemplates.getAllTemplates(); } });

// ===== DOM 引用 =====
const canvasWrapper = document.getElementById('canvasWrapper');
const canvas = document.getElementById('canvas');
const canvasTransform = document.getElementById('canvasTransform');
const connectionsLayer = document.getElementById('connectionsLayer');
const selectionBox = document.getElementById('selectionBox');
const contextMenu = document.getElementById('contextMenu');

// ===== 模板中心与确认对话框函数别名 =====
var applyTemplate = DiagramWeaveTemplates.applyTemplate;
var hideConfirm = DiagramWeaveTemplates.hideConfirm;
var hideTemplateDialog = DiagramWeaveTemplates.hideTemplateDialog;
var initShapeTypeSelect = DiagramWeaveTemplates.initShapeTypeSelect;
var initTemplates = DiagramWeaveTemplates.initTemplates;
var onTemplateDialogClick = DiagramWeaveTemplates.onTemplateDialogClick;
var rebuildAllTemplates = DiagramWeaveTemplates.rebuildAllTemplates;
var renderTemplateCenter = DiagramWeaveTemplates.renderTemplateCenter;
var resolvePageName = DiagramWeaveTemplates.resolvePageName;
var showConfirm = DiagramWeaveTemplates.showConfirm;
var showTemplateDialog = DiagramWeaveTemplates.showTemplateDialog;
var toggleTemplateFavorite = DiagramWeaveTemplates.toggleTemplateFavorite;

// ===== 自动布局（已提取至 editor/layout-engine.js → DiagramWeaveLayoutEngine）=====
var applyAutoLayout = DiagramWeaveLayoutEngine.applyAutoLayout;
var autoLayoutNodes = DiagramWeaveLayoutEngine.autoLayoutNodes;
var autoLayoutSwimlane = DiagramWeaveLayoutEngine.autoLayoutSwimlane;
var hideLayoutDialog = DiagramWeaveLayoutEngine.hideLayoutDialog;
var renderSwimlanes = DiagramWeaveLayoutEngine.renderSwimlanes;
var runAutoLayout = DiagramWeaveLayoutEngine.runAutoLayout;
var setLayoutDensity = DiagramWeaveLayoutEngine.setLayoutDensity;
var setLayoutEngine = DiagramWeaveLayoutEngine.setLayoutEngine;
var showLayoutDialog = DiagramWeaveLayoutEngine.showLayoutDialog;

// 自动调整连线端口
// ===== 连线端口计算（已迁入 editor/connection-engine.js → DiagramWeaveConnectionEngine）=====
var autoAdjustPorts = DiagramWeaveConnectionEngine.autoAdjustPorts;
var computeConnPorts = DiagramWeaveConnectionEngine.computeConnPorts;
var adjustSingleConnPorts = DiagramWeaveConnectionEngine.adjustSingleConnPorts;
var isDuplicateConnection = DiagramWeaveConnectionEngine.isDuplicateConnection;

// ===== 工具/缩放/撤销（已提取至 editor/editor-state.js）=====
var setTool = DiagramWeaveEditorCore.setTool;
var zoomIn = DiagramWeaveEditorCore.zoomIn;
var zoomOut = DiagramWeaveEditorCore.zoomOut;
var zoomReset = DiagramWeaveEditorCore.zoomReset;
var setZoom = DiagramWeaveEditorCore.setZoom;
var updateTransform = DiagramWeaveEditorCore.updateTransform;
var clearCanvasNodes = DiagramWeaveEditorCore.clearCanvasNodes;
var captureUndoSnapshot = DiagramWeaveEditorCore.captureUndoSnapshot;
var applyUndoSnapshot = DiagramWeaveEditorCore.applyUndoSnapshot;
var saveState = DiagramWeaveEditorCore.saveState;
var undo = DiagramWeaveEditorCore.undo;
var redo = DiagramWeaveEditorCore.redo;

// ===== 节点生命周期（已提取至 editor/node-lifecycle.js）=====
var createNode = DiagramWeaveNodeLifecycle.createNode;
var ensureNodeRefIds = DiagramWeaveNodeLifecycle.ensureNodeRefIds;
var formatNodeOutgoingConnections = DiagramWeaveNodeLifecycle.formatNodeOutgoingConnections;
var renderNode = DiagramWeaveNodeLifecycle.renderNode;
var refreshAllNodeBriefs = DiagramWeaveNodeLifecycle.refreshAllNodeBriefs;
var renderAllNodes = DiagramWeaveNodeLifecycle.renderAllNodes;

// ===== 属性面板工作流（已提取至 editor/property-panel-ui.js）=====
var initPropertyEditingWorkflow = DiagramWeavePropertyPanelUI.initPropertyEditingWorkflow;
var setPropertyTab = DiagramWeavePropertyPanelUI.setPropertyTab;
var applyBatchNodeProperty = DiagramWeavePropertyPanelUI.applyBatchNodeProperty;
var renderNodeContextToolbar = DiagramWeavePropertyPanelUI.renderNodeContextToolbar;
// ===== 端口方向与名称归一化（已迁入 editor/connection-engine.js）=====
var getPortDirection = DiagramWeaveConnectionEngine.getPortDirection;
var normalizePortName = DiagramWeaveConnectionEngine.normalizePortName;

// ===== 形状视觉映射（已提取至 editor/shape-library.js → DiagramWeaveShapeLibraryUI）=====
var getNodeVisualShape = DiagramWeaveShapeLibraryUI.getNodeVisualShape;

// ===== 连线路由算法注册（已迁入 editor/connection-engine.js）=====
var initConnRouteAlgorithms = DiagramWeaveConnectionEngine.initConnRouteAlgorithms;
var registerConnRouteMode = DiagramWeaveConnectionEngine.registerConnRouteMode;
var rebuildConnRouteSelect = DiagramWeaveConnectionEngine.rebuildConnRouteSelect;

// ===== 形状库与路由模式（已提取至 editor/shape-library.js → DiagramWeaveShapeLibraryUI）=====
var applyConnRouteModeFromData = DiagramWeaveShapeLibraryUI.applyConnRouteModeFromData;
var bindShapeItemElement = DiagramWeaveShapeLibraryUI.bindShapeItemElement;
var initConnRouteMode = DiagramWeaveShapeLibraryUI.initConnRouteMode;
var insertShapeFromLibrary = DiagramWeaveShapeLibraryUI.insertShapeFromLibrary;
var registerRemoteShape = DiagramWeaveShapeLibraryUI.registerRemoteShape;
var setConnRouteMode = DiagramWeaveShapeLibraryUI.setConnRouteMode;

// ===== 连线引擎（已提取至 editor/connection-engine.js）=====
var renderConnections = DiagramWeaveConnectionEngine.renderConnections;
var scheduleRenderConnections = DiagramWeaveConnectionEngine.scheduleRenderConnections;
var updateConnectionsForNode = DiagramWeaveConnectionEngine.updateConnectionsForNode;
var getConnectionPath = DiagramWeaveConnectionEngine.getConnectionPath;
var getConnectionPathBezier = DiagramWeaveConnectionEngine.getConnectionPathBezier;
var getConnectionPathOrthogonal = DiagramWeaveConnectionEngine.getConnectionPathOrthogonal;
var getConnectionPathAvoidance = DiagramWeaveConnectionEngine.getConnectionPathAvoidance;
var getConnectionPathVisio = DiagramWeaveConnectionEngine.getConnectionPathVisio;
var buildBridgeSvgFragments = DiagramWeaveConnectionEngine.buildBridgeSvgFragments;
var getConnLabelLayout = DiagramWeaveConnectionEngine.getConnLabelLayout;
var sampleSvgPath = DiagramWeaveConnectionEngine.sampleSvgPath;
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

// ===== 画布交互（已提取至 editor/canvas-interaction.js）=====
var getPortPos = DiagramWeaveCanvasInteraction.getPortPos;
var setupNodeEvents = DiagramWeaveCanvasInteraction.setupNodeEvents;
var getNearestPortByPoint = DiagramWeaveCanvasInteraction.getNearestPortByPoint;
var startReconnect = DiagramWeaveCanvasInteraction.startReconnect;
var selectConnection = DiagramWeaveCanvasInteraction.selectConnection;
var getSelectedNodeIds = DiagramWeaveCanvasInteraction.getSelectedNodeIds;
var selectNode = DiagramWeaveCanvasInteraction.selectNode;
var applyDeepLinkHighlight = DiagramWeaveCanvasInteraction.applyDeepLinkHighlight;
var loadE2eSeedNodesFromSession = DiagramWeaveCanvasInteraction.loadE2eSeedNodesFromSession;
var deselectAll = DiagramWeaveCanvasInteraction.deselectAll;
var selectAll = DiagramWeaveCanvasInteraction.selectAll;
var applyGroupHighlight = DiagramWeaveCanvasInteraction.applyGroupHighlight;
var clearGroupHighlight = DiagramWeaveCanvasInteraction.clearGroupHighlight;
var highlightDropTargetNode = DiagramWeaveCanvasInteraction.highlightDropTargetNode;
var clearDropTargetHighlight = DiagramWeaveCanvasInteraction.clearDropTargetHighlight;
var editLabel = DiagramWeaveCanvasInteraction.editLabel;
var deleteSelected = DiagramWeaveCanvasInteraction.deleteSelected;
var clearCanvas = DiagramWeaveCanvasInteraction.clearCanvas;
var duplicateSelected = DiagramWeaveCanvasInteraction.duplicateSelected;
var bringToFront = DiagramWeaveCanvasInteraction.bringToFront;
var sendToBack = DiagramWeaveCanvasInteraction.sendToBack;

// ===== 组合与容器（Phase 2 新增：editor/group-container.js → DiagramWeaveGroupContainer）=====
var groupSelectedNodes = DiagramWeaveGroupContainer.groupSelectedNodes;
var ungroupSelectedNodes = DiagramWeaveGroupContainer.ungroupSelectedNodes;
var wrapSelectionInContainer = DiagramWeaveGroupContainer.wrapSelectionInContainer;
var unwrapContainer = DiagramWeaveGroupContainer.unwrapContainer;
var toggleContainerMode = DiagramWeaveGroupContainer.toggleContainerMode;
var createSwimlaneSetFromCurrentLanes = DiagramWeaveGroupContainer.createSwimlaneSetFromCurrentLanes;
var moveNodesBy = DiagramWeaveGroupContainer.moveNodesBy;
var getMoveSet = DiagramWeaveGroupContainer.getMoveSet;
var reparentDraggedNode = DiagramWeaveGroupContainer.reparentDraggedNode;

// ===== 智能对齐线（Phase 3 新增：editor/align-guides.js → DiagramWeaveAlignGuides）=====
var computeDragSnap = DiagramWeaveAlignGuides.computeSnap;
var showAlignGuides = DiagramWeaveAlignGuides.showGuides;
var hideAlignGuides = DiagramWeaveAlignGuides.hideGuides;

// ===== 属性面板（已提取至 editor/property-panel-ui.js）=====
var formatDurationDays = DiagramWeavePropertyPanelUI.formatDurationDays;
var computeFlowPageStats = DiagramWeavePropertyPanelUI.computeFlowPageStats;
var getExportBaseName = DiagramWeavePropertyPanelUI.getExportBaseName;
var updatePagePropertiesPanel = DiagramWeavePropertyPanelUI.updatePagePropertiesPanel;
var deleteCurrentPage = DiagramWeavePropertyPanelUI.deleteCurrentPage;
var updatePropPageName = DiagramWeavePropertyPanelUI.updatePropPageName;
var updateProperties = DiagramWeavePropertyPanelUI.updateProperties;
var revertLastSaveState = DiagramWeavePropertyPanelUI.revertLastSaveState;
var updatePropConnFrom = DiagramWeavePropertyPanelUI.updatePropConnFrom;
var updatePropConnTo = DiagramWeavePropertyPanelUI.updatePropConnTo;
var updatePropConnLabel = DiagramWeavePropertyPanelUI.updatePropConnLabel;
var updatePropConnLabelPos = DiagramWeavePropertyPanelUI.updatePropConnLabelPos;
var updatePropLabel = DiagramWeavePropertyPanelUI.updatePropLabel;
var updatePropType = DiagramWeavePropertyPanelUI.updatePropType;
var updatePropDetail = DiagramWeavePropertyPanelUI.updatePropDetail;
var updatePropDuration = DiagramWeavePropertyPanelUI.updatePropDuration;
var updatePropRole = DiagramWeavePropertyPanelUI.updatePropRole;
// ===== 无障碍与模态契约（已提取至 editor/accessibility.js → DiagramWeaveAccessibility）=====
var initAccessibility = DiagramWeaveAccessibility.initAccessibility;
var initModalContracts = DiagramWeaveAccessibility.initModalContracts;
var isMobileViewMode = DiagramWeaveAccessibility.isMobileViewMode;
var openMobileReview = DiagramWeaveAccessibility.openMobileReview;

// ===== 导入预览（已提取至 editor/import-preview.js → DiagramWeaveImportPreviewUI）=====
var applyPendingImportPreview = DiagramWeaveImportPreviewUI.applyPendingImportPreview;
var cancelImportPreview = DiagramWeaveImportPreviewUI.cancelImportPreview;
var createImportPreview = DiagramWeaveImportPreviewUI.createImportPreview;
var processExternalDiagramFile = DiagramWeaveImportPreviewUI.processExternalDiagramFile;
var queueDocumentImport = DiagramWeaveImportPreviewUI.queueDocumentImport;
var showImportPreview = DiagramWeaveImportPreviewUI.showImportPreview;

// ===== 命令面板与映射向导（已提取至 editor/command-palette.js → DiagramWeaveCommandPalette）=====
var cancelMappingWizard = DiagramWeaveCommandPalette.cancelMappingWizard;
var closeCommandPalette = DiagramWeaveCommandPalette.closeCommandPalette;
var collectPaletteItems = DiagramWeaveCommandPalette.collectPaletteItems;
var continueMappingToPreview = DiagramWeaveCommandPalette.continueMappingToPreview;
var getCommandContext = DiagramWeaveCommandPalette.getCommandContext;
var initEditorCommands = DiagramWeaveCommandPalette.initEditorCommands;
var loadSelectedMappingPreset = DiagramWeaveCommandPalette.loadSelectedMappingPreset;
var openCommandPalette = DiagramWeaveCommandPalette.openCommandPalette;
var renderCommandPalette = DiagramWeaveCommandPalette.renderCommandPalette;
var saveCurrentMappingPreset = DiagramWeaveCommandPalette.saveCurrentMappingPreset;
var startMappingWizard = DiagramWeaveCommandPalette.startMappingWizard;
var trapCommandPaletteFocus = DiagramWeaveCommandPalette.trapCommandPaletteFocus;
var trapImportPreviewFocus = DiagramWeaveCommandPalette.trapImportPreviewFocus;
var trapMappingWizardFocus = DiagramWeaveCommandPalette.trapMappingWizardFocus;
var trapOverlayFocus = DiagramWeaveCommandPalette.trapOverlayFocus;

// ===== 视口导航（已提取至 editor/viewport-nav.js → DiagramWeaveViewportNav）=====
var fitAllNodes = DiagramWeaveViewportNav.fitAllNodes;
var fitSelectedNodes = DiagramWeaveViewportNav.fitSelectedNodes;
var initCanvasNavigation = DiagramWeaveViewportNav.initCanvasNavigation;
var renderCanvasMinimap = DiagramWeaveViewportNav.renderCanvasMinimap;
var renderOutlinePanel = DiagramWeaveViewportNav.renderOutlinePanel;
var runAlignCommand = DiagramWeaveViewportNav.runAlignCommand;
var runDistributeCommand = DiagramWeaveViewportNav.runDistributeCommand;
var scheduleViewportCull = DiagramWeaveViewportNav.scheduleViewportCull;
var toggleOutlinePanel = DiagramWeaveViewportNav.toggleOutlinePanel;


// ===== 形状库工作流与模板管理器（已提取至 editor/shape-library.js → DiagramWeaveShapeLibraryUI）=====
var filterShapeLibrary = DiagramWeaveShapeLibraryUI.filterShapeLibrary;
var handleStencilPackImport = DiagramWeaveShapeLibraryUI.handleStencilPackImport;
var hideStencilManager = DiagramWeaveShapeLibraryUI.hideStencilManager;
var initShapeLibraryWorkflow = DiagramWeaveShapeLibraryUI.initShapeLibraryWorkflow;
var initStencilManager = DiagramWeaveShapeLibraryUI.initStencilManager;
var recordRecentShape = DiagramWeaveShapeLibraryUI.recordRecentShape;
var runPaletteItem = DiagramWeaveShapeLibraryUI.runPaletteItem;
var showStencilManager = DiagramWeaveShapeLibraryUI.showStencilManager;
var toggleShapeFavorite = DiagramWeaveShapeLibraryUI.toggleShapeFavorite;

// ===== 检查器面板群（已提取至 editor/inspector-panels.js → DiagramWeaveInspectorPanels）=====
var addSelectedConnectionWaypoint = DiagramWeaveInspectorPanels.addSelectedConnectionWaypoint;
var captureVersionSnapshot = DiagramWeaveInspectorPanels.captureVersionSnapshot;
var clearVersionHistory = DiagramWeaveInspectorPanels.clearVersionHistory;
var createNamedVersionSnapshot = DiagramWeaveInspectorPanels.createNamedVersionSnapshot;
var createSelectedReviewThread = DiagramWeaveInspectorPanels.createSelectedReviewThread;
var hideAISettings = DiagramWeaveInspectorPanels.hideAISettings;
var hideProcessAnalysis = DiagramWeaveInspectorPanels.hideProcessAnalysis;
var hideQualityChecker = DiagramWeaveInspectorPanels.hideQualityChecker;
var hideReviewPanel = DiagramWeaveInspectorPanels.hideReviewPanel;
var hideRoutingRulesPanel = DiagramWeaveInspectorPanels.hideRoutingRulesPanel;
var hideVersionHistory = DiagramWeaveInspectorPanels.hideVersionHistory;
var initVersionHistory = DiagramWeaveInspectorPanels.initVersionHistory;
var setGlobalAIState = DiagramWeaveInspectorPanels.setGlobalAIState;
var showAISettings = DiagramWeaveInspectorPanels.showAISettings;
var showProcessAnalysis = DiagramWeaveInspectorPanels.showProcessAnalysis;
var showQualityChecker = DiagramWeaveInspectorPanels.showQualityChecker;
var showReviewPanel = DiagramWeaveInspectorPanels.showReviewPanel;
var showRoutingRulesPanel = DiagramWeaveInspectorPanels.showRoutingRulesPanel;
var showVersionHistory = DiagramWeaveInspectorPanels.showVersionHistory;
var updateRoutingRulesFromPanel = DiagramWeaveInspectorPanels.updateRoutingRulesFromPanel;
var updateSelectedConnectionRouting = DiagramWeaveInspectorPanels.updateSelectedConnectionRouting;

// ===== 面板辅助工作流（已提取至 editor/panel-extras.js → DiagramWeavePanelExtras）=====
var dismissCanvasEmptyState = DiagramWeavePanelExtras.dismissCanvasEmptyState;
var navigateOffpageTarget = DiagramWeavePanelExtras.navigateOffpageTarget;
var togglePanelDrawer = DiagramWeavePanelExtras.togglePanelDrawer;
var updateCanvasEmptyState = DiagramWeavePanelExtras.updateCanvasEmptyState;
var updatePropLayer = DiagramWeavePanelExtras.updatePropLayer;
var updatePropTargetPage = DiagramWeavePanelExtras.updatePropTargetPage;
var updatePropTextColor = DiagramWeavePanelExtras.updatePropTextColor;
var updateTimeSummary = DiagramWeavePanelExtras.updateTimeSummary;

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
    // Phase 2：增量移动整个拖拽集合（组成员 + 容器后代）
    let dx = (mx - state.dragOffset.x) - state.dragNode.x;
    let dy = (my - state.dragOffset.y) - state.dragNode.y;
    const dragIds = state.dragNodeIds || [state.dragNode.id];
    // Phase 3：智能对齐——吸附到静态节点的边缘/中心（6 方向，阈值 6 屏幕像素）
    const snap = computeDragSnap(dragIds, dx, dy);
    dx = snap.dx;
    dy = snap.dy;
    if (dx || dy) {
      moveNodesBy(dragIds, dx, dy);
    }
    if (snap.guides.v !== null || snap.guides.h !== null) {
      showAlignGuides(snap.guides.v, snap.guides.h);
    } else {
      hideAlignGuides();
    }
    updateProperties();
    // Phase 2-1b：拖拽悬停容器高亮
    if (typeof DiagramWeaveGroupContainer !== 'undefined') {
      const cx = state.dragNode.x + state.dragNode.w / 2;
      const cy = state.dragNode.y + state.dragNode.h / 2;
      const exclude = [state.dragNode.id, ...(state.dragNodeIds || [])];
      const hoverContainer = DiagramWeaveGroupContainer.containerAtPoint(cx, cy, exclude);
      highlightDropTargetNode(hoverContainer ? hoverContainer.id : null);
    }
    return;
  }
});

// ===== Phase 2-1b：拖拽结束 —— 重 parent + 清除高亮 =====
canvasWrapper.addEventListener('mouseup', () => {
  clearDropTargetHighlight();
  hideAlignGuides();
  if (state.isDragging) {
    if (state.dragNode) reparentDraggedNode(state.dragNode);
    state.isDragging = false;
    state.dragNode = null;
    state.dragNodeIds = null;
  }
  if (state.isPanning) {
    state.isPanning = false;
    canvasWrapper.style.cursor = state.tool === 'connect' ? 'crosshair' : state.tool === 'pan' ? 'grab' : 'default';
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

// ===== 键盘事件 + 点击关闭（Phase 2-3：已提取至 editor/keyboard-shortcuts.js → DiagramWeaveKeyboardShortcuts）=====
// 该模块在 DOMContentLoaded 后自动安装 keydown/keyup/click 三个全局监听器。
// 如果页面顺序加载了 editor/keyboard-shortcuts.js，此处不再重复绑定。
if (typeof DiagramWeaveKeyboardShortcuts === 'undefined') {
  // fallback：保留旧行为
  console.warn('[Phase 2-3] editor/keyboard-shortcuts.js 未加载，快捷键可能不可用。');
}

// ===== 流程文本/表格编辑（已提取至 editor/flow-table.js → DiagramWeaveFlowTable）=====
var addFlowTableConnRow = DiagramWeaveFlowTable.addFlowTableConnRow;
var addFlowTableNodeRow = DiagramWeaveFlowTable.addFlowTableNodeRow;
var applyFlowData = DiagramWeaveFlowTable.applyFlowData;
var applyFlowText = DiagramWeaveFlowTable.applyFlowText;
var deleteFlowTableSelectedRows = DiagramWeaveFlowTable.deleteFlowTableSelectedRows;
var formatTargetPageForText = DiagramWeaveFlowTable.formatTargetPageForText;
var hasGraphPath = DiagramWeaveFlowTable.hasGraphPath;
var isKnownFlowShape = DiagramWeaveFlowTable.isKnownFlowShape;
var prepareFlowImportData = DiagramWeaveFlowTable.prepareFlowImportData;
var switchFlowTableTab = DiagramWeaveFlowTable.switchFlowTableTab;
var syncFlowTableConnHighlight = DiagramWeaveFlowTable.syncFlowTableConnHighlight;
var syncFlowTableFromConnections = DiagramWeaveFlowTable.syncFlowTableFromConnections;
var syncFlowTableHighlight = DiagramWeaveFlowTable.syncFlowTableHighlight;
var syncFlowTableRowFromNode = DiagramWeaveFlowTable.syncFlowTableRowFromNode;
var syncTextFromCanvas = DiagramWeaveFlowTable.syncTextFromCanvas;
var toggleTextEditor = DiagramWeaveFlowTable.toggleTextEditor;
var toggleTextEditorHelp = DiagramWeaveFlowTable.toggleTextEditorHelp;

// ===== 导出 PNG / SVG / PDF（已提取至 editor/export-renderers.js → DiagramWeaveExportRenderers）=====
var buildExportSVG = DiagramWeaveExportRenderers.buildExportSVG;
var exportPDF = DiagramWeaveExportRenderers.exportPDF;
var exportPNG = DiagramWeaveExportRenderers.exportPNG;
var exportSVG = DiagramWeaveExportRenderers.exportSVG;

// ===== 项目文件 I/O 与 JSON 导入导出（已提取至 editor/data-io.js → DiagramWeaveDataIO）=====
var downloadProjectVso = DiagramWeaveDataIO.downloadProjectVso;
var exportJSON = DiagramWeaveDataIO.exportJSON;
var getFlowDocumentPayload = DiagramWeaveDataIO.getFlowDocumentPayload;
var getProjectFileBaseName = DiagramWeaveDataIO.getProjectFileBaseName;
var handleFileLoad = DiagramWeaveDataIO.handleFileLoad;
var importJSON = DiagramWeaveDataIO.importJSON;
var loadFlowDocumentPayload = DiagramWeaveDataIO.loadFlowDocumentPayload;
var newProject = DiagramWeaveDataIO.newProject;
var promptInitialProjectSave = DiagramWeaveDataIO.promptInitialProjectSave;
var restartAutosaveTimer = DiagramWeaveDataIO.restartAutosaveTimer;
var updateProjectTitle = DiagramWeaveDataIO.updateProjectTitle;

// ===== 连线标签编辑与右键菜单（已提取至 editor/connection-editing.js → DiagramWeaveConnectionEditing）=====
var deleteConnectionFromMenu = DiagramWeaveConnectionEditing.deleteConnectionFromMenu;
var editConnectionLabel = DiagramWeaveConnectionEditing.editConnectionLabel;
var focusConnectionProperties = DiagramWeaveConnectionEditing.focusConnectionProperties;
var hideConnContextMenu = DiagramWeaveConnectionEditing.hideConnContextMenu;
var showConnContextMenu = DiagramWeaveConnectionEditing.showConnContextMenu;
var startConnectionLabelEdit = DiagramWeaveConnectionEditing.startConnectionLabelEdit;

// ===== 演示模式（已提取至 editor/presentation-mode.js）=====
var countPresentationTotalSteps = DiagramWeavePresentation.countPresentationTotalSteps;
var getCurrentPresentationNodeId = DiagramWeavePresentation.getCurrentPresentationNodeId;
var enterPresentation = DiagramWeavePresentation.enterPresentation;
var exitPresentation = DiagramWeavePresentation.exitPresentation;
var updatePresentZoomPreviewLayout = DiagramWeavePresentation.updatePresentZoomPreviewLayout;
var focusPresentationOnNode = DiagramWeavePresentation.focusPresentationOnNode;
var applyPresentationStyles = DiagramWeavePresentation.applyPresentationStyles;
var cancelBranchSelector = DiagramWeavePresentation.cancelBranchSelector;
var presentNext = DiagramWeavePresentation.presentNext;
var presentPrev = DiagramWeavePresentation.presentPrev;
var presentFirst = DiagramWeavePresentation.presentFirst;
var presentLast = DiagramWeavePresentation.presentLast;

// ===== 工具函数 =====
function escapeHtml(str) {
  // 委託至 DiagramWeaveEditorText（editor/text-utils.js，Loop 2.4 抽取）。
  // 語義與原版完全等價：對非字符串返回 ''，並替換 & < > " '。
  if (typeof DiagramWeaveEditorText !== 'undefined' && typeof DiagramWeaveEditorText.escapeHtml === 'function') {
    return DiagramWeaveEditorText.escapeHtml(str);
  }
  // P2-01 修复：fallback 使用与 text-utils.js 等价的 5 字符转义（& < > " '），
  // 替代 div.textContent（不转义引号）。
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeSvg(svgText) {
  // P1-01 修复：委托至 DiagramWeaveSvgSanitizer（白名单 DOM 重建），
  // 替代原有可绕过的正则黑名单。
  if (typeof DiagramWeaveSvgSanitizer !== 'undefined' && typeof DiagramWeaveSvgSanitizer.sanitizeSvgSnippet === 'function') {
    return DiagramWeaveSvgSanitizer.sanitizeSvgSnippet(svgText);
  }
  // 防御性 fallback：模块未加载时拒绝一切含可疑标记的 SVG（宁严勿漏）
  if (typeof svgText !== 'string') return '';
  const t = svgText.trim();
  if (!t.startsWith('<svg')) return '';
  if (/<\s*script\b/i.test(t) || /\son\w+\s*=/i.test(t) || /<\s*foreignObject\b/i.test(t)) return '';
  if (/<\s*(animate|set|use|image|iframe|a)\b/i.test(t)) return '';
  if (/javascript\s*:/i.test(t)) return '';
  return t.slice(0, 4000);
}

// ===== Excel 导入导出与设置（已提取至 editor/data-io.js → DiagramWeaveDataIO）=====
var exportCanvasToExcel = DiagramWeaveDataIO.exportCanvasToExcel;
var exportExcelTemplate = DiagramWeaveDataIO.exportExcelTemplate;
var exportProjectToExcel = DiagramWeaveDataIO.exportProjectToExcel;
var handleExcelLoad = DiagramWeaveDataIO.handleExcelLoad;
var handleProjectExcelLoad = DiagramWeaveDataIO.handleProjectExcelLoad;
var hideExcelDataDialog = DiagramWeaveDataIO.hideExcelDataDialog;
var hideSettingsDialog = DiagramWeaveDataIO.hideSettingsDialog;
var openReleasePageFromSettings = DiagramWeaveDataIO.openReleasePageFromSettings;
var parseExcelNodeRow = DiagramWeaveDataIO.parseExcelNodeRow;
var runUpdateCheckFromSettings = DiagramWeaveDataIO.runUpdateCheckFromSettings;
var saveSettingsFromDialog = DiagramWeaveDataIO.saveSettingsFromDialog;
var showExcelDataDialog = DiagramWeaveDataIO.showExcelDataDialog;
var showSettingsDialog = DiagramWeaveDataIO.showSettingsDialog;
var syncContentPackFromSettings = DiagramWeaveDataIO.syncContentPackFromSettings;
var triggerExcelUpload = DiagramWeaveDataIO.triggerExcelUpload;
var triggerProjectExcelUpload = DiagramWeaveDataIO.triggerProjectExcelUpload;

// ===== 主题（来自 editor/ui-utils.js → DiagramWeaveUIUtils） =====
var applyTheme = DiagramWeaveUIUtils.applyTheme;

// ===== 初始化 =====
async function bootDiagramWeave() {
  try {
  if (typeof DiagramWeaveUIUtils !== 'undefined' && typeof DiagramWeaveUIUtils.initTheme === 'function') {
    DiagramWeaveUIUtils.initTheme();
  }
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
