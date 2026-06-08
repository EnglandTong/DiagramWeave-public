/**
 * DiagramWeave 中英文 i18n（轻量，无外部依赖）
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'dw-locale';
  const SUPPORTED = ['zh-CN', 'en'];
  let locale = 'zh-CN';
  let messages = {};
  const onChangeCallbacks = [];

  const PACKED = {
    'zh-CN': {
      'app.title': 'DiagramWeave - 流程图编辑器',
      'app.subtitle': '流程图编辑器',
      'toolbar.select': '选择 (V)',
      'toolbar.connect': '连线 (L)',
      'toolbar.pan': '移动画面 (H)',
      'toolbar.undo': '撤销 (Ctrl+Z)',
      'toolbar.redo': '重做 (Ctrl+Y)',
      'toolbar.table': '表格编辑 (T)',
      'toolbar.layout': '自动布局',
      'toolbar.connRoute': '连线路由样式',
      'toolbar.delete': '删除选中 (Delete)',
      'toolbar.clear': '清空画布',
      'toolbar.zoomOut': '缩小',
      'toolbar.zoomIn': '放大',
      'toolbar.zoomReset': '重置缩放 100%',
      'toolbar.present': '演示模式',
      'toolbar.export': '下载 PNG / SVG / PDF',
      'toolbar.save': '保存工作文件 (.diagramweave.json)',
      'toolbar.load': '加载工作文件',
      'toolbar.excel': 'Excel 模板与导入',
      'toolbar.settings': '设置与更新',
      'toolbar.lang': '语言',
      'conn.bezier': '曲线',
      'conn.orthogonal': '折线',
      'conn.avoidance': '避障',
      'conn.straight': '直线',
      'conn.visio': 'Visio 连线',
      'sidebar.templates': '流程模板',
      'sidebar.shapes': '图形',
      'sidebar.basic': '基本图形',
      'sidebar.extended': '扩展图形',
      'sidebar.remoteIcons': '远程图标',
      'sidebar.layers': '图层',
      'shortcut.textEdit': '文本编辑',
      'shortcut.dblclick': '编辑文字',
      'shortcut.delete': '删除选中',
      'shortcut.undo': '撤销',
      'canvas.hint.select': '选择',
      'canvas.hint.connect': '连线',
      'canvas.hint.editConn': '点击连线编辑',
      'canvas.hint.zoom': '缩放',
      'canvas.hint.pan': '按住空格拖拽画布',
      'present.step': '步骤',
      'present.prev': '上一步',
      'present.next': '下一步',
      'present.exit': '退出演示',
      'present.exitTitle': '退出演示 (Esc)',
      'present.currentStep': '当前步骤',
      'present.placeholder': '按 → 开始演示',
      'present.zoomHint': '此处显示放大图形',
      'present.choosePath': '选择路径',
      'present.shape': '图形',
      'present.refId': '编号',
      'present.role': '角色',
      'present.duration': '耗时',
      'present.desc': '详细说明',
      'present.pathIn': '来路（已点亮）',
      'present.pathOut': '去路（已点亮）',
      'present.branch': '分支选项',
      'present.startHint': '按 → 开始演示',
      'present.descHint': '进入演示后，此处显示当前步骤的完整说明。',
      'props.title': '属性',
      'props.empty': '选中形状或连线\n查看和编辑属性',
      'props.pageInfo': '页面信息',
      'props.flowContent': '流程内容',
      'props.appearance': '外观',
      'props.connection': '连线',
      'prop.pageName': '页面名称',
      'prop.pageNamePh': '页面名称',
      'prop.pageHint': '保存 JSON / 导出图片时，默认使用当前页面名称作为文件名。',
      'prop.scale': '规模',
      'prop.totalDuration': '总耗时',
      'prop.criticalPath': '关键路径',
      'prop.stepCount': '步骤数',
      'prop.deletePage': '删除当前页',
      'prop.refId': '编号',
      'prop.nextConn': '下一连线',
      'prop.label': '简介',
      'prop.labelPh': '图形上显示的一行标题',
      'prop.role': '角色',
      'prop.rolePh': '如：申请人、审批人',
      'prop.shape': '图形',
      'prop.detail': '详细说明',
      'prop.detailPh': '演示模式与导出说明中显示的完整描述',
      'prop.duration': '耗时',
      'prop.durationPh': '如：2天、4小时',
      'prop.fill': '填充色',
      'prop.stroke': '边框色',
      'prop.layer': '图层',
      'prop.targetPage': '目标页',
      'prop.targetPagePh': '跨页引用目标页名称',
      'prop.openTarget': '打开目标页',
      'prop.connLabel': '条件标签',
      'prop.connLabelPh': '如：是 / 否',
      'prop.deleteNode': '删除形状',
      'prop.deleteConn': '删除连线',
      'dialog.export.title': '下载流程图',
      'dialog.export.sub': '选择导出格式（用于分享或打印）',
      'dialog.export.png': 'PNG 图片',
      'dialog.export.svg': 'SVG 矢量',
      'dialog.export.pdf': 'PDF 文档',
      'dialog.template.title': '选择流程模板',
      'dialog.template.sub': '点击模板一键生成流程图，生成后可自由编辑',
      'dialog.layout.title': '自动布局',
      'dialog.layout.engine': '布局引擎',
      'dialog.layout.roleAxis': '主轴角色',
      'dialog.layout.density': '间距密度',
      'dialog.layout.direction': '布局方向',
      'dialog.layout.compact': '紧凑',
      'dialog.layout.normal': '标准',
      'dialog.layout.loose': '宽松',
      'dialog.layout.vertical': '纵向',
      'dialog.layout.horizontal': '横向',
      'dialog.settings.title': '设置与更新',
      'dialog.settings.hint': '内容包可远程更新：连线方式、字体、侧边栏图标。主程序大版本仍走 Releases。',
      'dialog.settings.language': '界面语言',
      'dialog.settings.version': '当前版本',
      'dialog.settings.github': 'GitHub 仓库',
      'dialog.settings.updateUrl': '更新检查地址（可选）',
      'dialog.settings.releaseUrl': '发布页地址（可选）',
      'dialog.settings.save': '保存设置',
      'dialog.settings.syncPack': '同步内容包',
      'dialog.settings.checkUpdate': '检查更新',
      'dialog.settings.openRelease': '打开下载页',
      'dialog.settings.footnote': 'Git 用户可双击 update-diagramweave.bat 一键拉取；ZIP 用户请在下载页获取新版本。',
      'dialog.confirm.title': '确认',
      'dialog.confirm.cancel': '取消',
      'dialog.confirm.ok': '确认',
      'dialog.close': '关闭',
      'dialog.excel.title': 'Excel 数据',
      'page.default': '页面 {{n}}',
      'layer.default': '图层 {{n}}',
      'page.new': '新建页面',
      'page.duplicate': '复制当前页',
      'page.delete': '删除此页',
      'page.renameHint': '双击重命名',
      'layer.add': '+ 新建图层',
      'layer.delete': '删除图层',
      'layer.show': '显示',
      'layer.hide': '隐藏',
      'layer.lock': '锁定',
      'layer.unlock': '解锁',
      'layer.keepOne': '至少保留一个图层',
      'none': '（无）',
      'unnamed': '未命名',
      'toast.undo': '已撤销',
      'toast.redo': '已重做',
      'toast.cleared': '画布已清空',
      'toast.copied': '已复制',
      'toast.deletedNode': '已删除形状',
      'toast.deletedConn': '已删除连线',
      'toast.langChanged': '语言已切换',
      'toast.settingsSaved': '设置已保存',
      'toast.connRoute': '连线路由：{{mode}}',
      'toast.addedShape': '已添加「{{label}}」',
      'toast.layoutEmpty': '画布为空，无法布局',
      'toast.layoutDone': '布局完成',
      'toast.exportPng': '已导出 PNG',
      'toast.exportSvg': '已导出 SVG（可用 Illustrator / Inkscape 编辑）',
      'toast.exportPdf': '已导出 PDF',
      'toast.saved': '已保存工作文件（含位置与连线，下次加载原样恢复）',
      'toast.fileInvalid': '文件格式无效或数据被拒绝',
      'toast.useBat': '建议双击「启动DiagramWeave.bat」打开，可避免连线丢失与控制台警告',
      'shape.rectangle': '流程',
      'shape.rounded': '子流程',
      'shape.diamond': '判断',
      'shape.terminator': '开始/结束',
      'shape.circle': '连接点',
      'shape.database': '数据',
      'shape.parallelogram': '输入/输出',
      'shape.document': '文档',
      'shape.hexagon': '准备',
      'shape.triangle': '合并',
      'shape.cross': '交叉',
      'shape.delay': '延迟',
      'shape.display': '显示',
      'shape.manual': '手动操作',
      'shape.card': '卡片',
      'shape.tape': '磁带',
      'shape.sort': '排序',
      'shape.or': '或',
      'shape.summing': '求和',
      'shape.collate': '整理',
      'shape.storage': '存储',
      'shape.multidoc': '多文档',
      'shape.internalstorage': '内部存储',
      'shape.offlinestorage': '离线存储',
      'shape.annotation': '注释',
      'shape.cloud': '云服务',
      'shape.actor': '角色',
      'shape.note': '便签',
      'shape.offpage': '跨页',
      'shape.subprocess': '子流程框',
      'shape.datastore': '数据存储',
      'shape.predefprocess': '预定义流程',
      'shape.looplimit': '循环上限',
      'shape.start': '开始',
      'shape.end': '结束',
    },
    en: {
      'app.title': 'DiagramWeave - Flowchart Editor',
      'app.subtitle': 'Flowchart Editor',
      'toolbar.select': 'Select (V)',
      'toolbar.connect': 'Connect (L)',
      'toolbar.pan': 'Pan canvas (H)',
      'toolbar.undo': 'Undo (Ctrl+Z)',
      'toolbar.redo': 'Redo (Ctrl+Y)',
      'toolbar.table': 'Table editor (T)',
      'toolbar.layout': 'Auto layout',
      'toolbar.connRoute': 'Connection routing',
      'toolbar.delete': 'Delete selection (Delete)',
      'toolbar.clear': 'Clear canvas',
      'toolbar.zoomOut': 'Zoom out',
      'toolbar.zoomIn': 'Zoom in',
      'toolbar.zoomReset': 'Reset zoom 100%',
      'toolbar.present': 'Presentation mode',
      'toolbar.export': 'Download PNG / SVG / PDF',
      'toolbar.save': 'Save project (.diagramweave.json)',
      'toolbar.load': 'Load project',
      'toolbar.excel': 'Excel template & import',
      'toolbar.settings': 'Settings & updates',
      'toolbar.lang': 'Language',
      'conn.bezier': 'Curved',
      'conn.orthogonal': 'Orthogonal',
      'conn.avoidance': 'Avoid obstacles',
      'conn.straight': 'Straight',
      'conn.visio': 'Visio-style',
      'sidebar.templates': 'Templates',
      'sidebar.shapes': 'Shapes',
      'sidebar.basic': 'Basic shapes',
      'sidebar.extended': 'Extended shapes',
      'sidebar.remoteIcons': 'Remote icons',
      'sidebar.layers': 'Layers',
      'shortcut.textEdit': 'Text editor',
      'shortcut.dblclick': 'Edit label',
      'shortcut.delete': 'Delete selection',
      'shortcut.undo': 'Undo',
      'canvas.hint.select': 'Select',
      'canvas.hint.connect': 'Connect',
      'canvas.hint.editConn': 'Click connection to edit',
      'canvas.hint.zoom': 'Zoom',
      'canvas.hint.pan': 'Hold Space to pan canvas',
      'present.step': 'Step',
      'present.prev': 'Previous',
      'present.next': 'Next',
      'present.exit': 'Exit presentation',
      'present.exitTitle': 'Exit presentation (Esc)',
      'present.currentStep': 'Current step',
      'present.placeholder': 'Press → to start',
      'present.zoomHint': 'Zoomed shape preview appears here',
      'present.choosePath': 'Choose path',
      'present.shape': 'Shape',
      'present.refId': 'ID',
      'present.role': 'Role',
      'present.duration': 'Duration',
      'present.desc': 'Description',
      'present.pathIn': 'Incoming path (visited)',
      'present.pathOut': 'Outgoing path (visited)',
      'present.branch': 'Branch options',
      'present.startHint': 'Press → to start',
      'present.descHint': 'Full step description appears here during presentation.',
      'props.title': 'Properties',
      'props.empty': 'Select a shape or connection\nto view and edit properties',
      'props.pageInfo': 'Page info',
      'props.flowContent': 'Flow content',
      'props.appearance': 'Appearance',
      'props.connection': 'Connection',
      'prop.pageName': 'Page name',
      'prop.pageNamePh': 'Page name',
      'prop.pageHint': 'JSON save / image export uses the current page name as the default filename.',
      'prop.scale': 'Scale',
      'prop.totalDuration': 'Total duration',
      'prop.criticalPath': 'Critical path',
      'prop.stepCount': 'Step count',
      'prop.deletePage': 'Delete current page',
      'prop.refId': 'ID',
      'prop.nextConn': 'Next connections',
      'prop.label': 'Label',
      'prop.labelPh': 'Title shown on shape',
      'prop.role': 'Role',
      'prop.rolePh': 'e.g. Applicant, Approver',
      'prop.shape': 'Shape',
      'prop.detail': 'Description',
      'prop.detailPh': 'Full text for presentation and exports',
      'prop.duration': 'Duration',
      'prop.durationPh': 'e.g. 2 days, 4 hours',
      'prop.fill': 'Fill color',
      'prop.stroke': 'Stroke color',
      'prop.layer': 'Layer',
      'prop.targetPage': 'Target page',
      'prop.targetPagePh': 'Target page for off-page reference',
      'prop.openTarget': 'Open target page',
      'prop.connLabel': 'Condition label',
      'prop.connLabelPh': 'e.g. Yes / No',
      'prop.deleteNode': 'Delete shape',
      'prop.deleteConn': 'Delete connection',
      'dialog.export.title': 'Export diagram',
      'dialog.export.sub': 'Choose a format for sharing or printing',
      'dialog.export.png': 'PNG image',
      'dialog.export.svg': 'SVG vector',
      'dialog.export.pdf': 'PDF document',
      'dialog.template.title': 'Choose a template',
      'dialog.template.sub': 'Click to generate a diagram; edit freely afterward',
      'dialog.layout.title': 'Auto layout',
      'dialog.layout.engine': 'Layout engine',
      'dialog.layout.roleAxis': 'Anchor role',
      'dialog.layout.density': 'Spacing density',
      'dialog.layout.direction': 'Direction',
      'dialog.layout.compact': 'Compact',
      'dialog.layout.normal': 'Normal',
      'dialog.layout.loose': 'Loose',
      'dialog.layout.vertical': 'Vertical',
      'dialog.layout.horizontal': 'Horizontal',
      'dialog.settings.title': 'Settings & updates',
      'dialog.settings.hint': 'Content packs update routing modes, fonts, and sidebar icons remotely. Major app updates use Releases.',
      'dialog.settings.language': 'Language',
      'dialog.settings.version': 'Current version',
      'dialog.settings.github': 'GitHub repository',
      'dialog.settings.updateUrl': 'Update check URL (optional)',
      'dialog.settings.releaseUrl': 'Release page URL (optional)',
      'dialog.settings.save': 'Save settings',
      'dialog.settings.syncPack': 'Sync content pack',
      'dialog.settings.checkUpdate': 'Check for updates',
      'dialog.settings.openRelease': 'Open download page',
      'dialog.settings.footnote': 'Git users: run update-diagramweave.bat. ZIP users: download from Releases.',
      'dialog.confirm.title': 'Confirm',
      'dialog.confirm.cancel': 'Cancel',
      'dialog.confirm.ok': 'OK',
      'dialog.close': 'Close',
      'dialog.excel.title': 'Excel data',
      'page.default': 'Page {{n}}',
      'layer.default': 'Layer {{n}}',
      'page.new': 'New page',
      'page.duplicate': 'Duplicate page',
      'page.delete': 'Delete page',
      'page.renameHint': 'Double-click to rename',
      'layer.add': '+ New layer',
      'layer.delete': 'Delete layer',
      'layer.show': 'Show',
      'layer.hide': 'Hide',
      'layer.lock': 'Lock',
      'layer.unlock': 'Unlock',
      'layer.keepOne': 'Keep at least one layer',
      'none': '(none)',
      'unnamed': 'Untitled',
      'toast.undo': 'Undone',
      'toast.redo': 'Redone',
      'toast.cleared': 'Canvas cleared',
      'toast.copied': 'Copied',
      'toast.deletedNode': 'Shape deleted',
      'toast.deletedConn': 'Connection deleted',
      'toast.langChanged': 'Language updated',
      'toast.settingsSaved': 'Settings saved',
      'toast.connRoute': 'Routing: {{mode}}',
      'toast.addedShape': 'Added “{{label}}”',
      'toast.layoutEmpty': 'Canvas is empty',
      'toast.layoutDone': 'Layout applied',
      'toast.exportPng': 'PNG exported',
      'toast.exportSvg': 'SVG exported',
      'toast.exportPdf': 'PDF exported',
      'toast.saved': 'Project saved',
      'toast.fileInvalid': 'Invalid or rejected file',
      'toast.useBat': 'Tip: launch via start-diagramweave.bat for best results',
      'shape.rectangle': 'Process',
      'shape.rounded': 'Subprocess',
      'shape.diamond': 'Decision',
      'shape.terminator': 'Start/End',
      'shape.circle': 'Connector',
      'shape.database': 'Database',
      'shape.parallelogram': 'Input/Output',
      'shape.document': 'Document',
      'shape.hexagon': 'Preparation',
      'shape.triangle': 'Merge',
      'shape.cross': 'Cross',
      'shape.delay': 'Delay',
      'shape.display': 'Display',
      'shape.manual': 'Manual',
      'shape.card': 'Card',
      'shape.tape': 'Tape',
      'shape.sort': 'Sort',
      'shape.or': 'Or',
      'shape.summing': 'Summing',
      'shape.collate': 'Collate',
      'shape.storage': 'Storage',
      'shape.multidoc': 'Multi-document',
      'shape.internalstorage': 'Internal storage',
      'shape.offlinestorage': 'Offline storage',
      'shape.annotation': 'Annotation',
      'shape.cloud': 'Cloud',
      'shape.actor': 'Actor',
      'shape.note': 'Note',
      'shape.offpage': 'Off-page',
      'shape.subprocess': 'Subprocess frame',
      'shape.datastore': 'Data store',
      'shape.predefprocess': 'Predefined process',
      'shape.looplimit': 'Loop limit',
      'shape.start': 'Start',
      'shape.end': 'End',
    },
  };

  function interpolate(str, vars) {
    if (!vars || !str) return str;
    return String(str).replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
  }

  function t(key, vars) {
    const bucket = messages[locale] || messages['zh-CN'] || {};
    const fb = PACKED['zh-CN'][key] || key;
    return interpolate(bucket[key] || PACKED[locale]?.[key] || fb, vars);
  }

  function getLocale() {
    return locale;
  }

  function getLocaleCompareTag() {
    return locale === 'en' ? 'en' : 'zh-CN';
  }

  function detectDefaultLocale() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch { /* ignore */ }
    const nav = (navigator.language || 'zh-CN').toLowerCase();
    return nav.startsWith('zh') ? 'zh-CN' : 'en';
  }

  async function loadLocale(next) {
    const target = SUPPORTED.includes(next) ? next : 'zh-CN';
    messages[target] = { ...PACKED[target] };
    try {
      const res = await fetch(`locales/${target}.json`, { cache: 'no-cache' });
      if (res.ok) {
        const external = await res.json();
        messages[target] = { ...messages[target], ...external };
      }
    } catch { /* packed fallback only */ }
    locale = target;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    document.title = t('app.title');
  }

  function applyDom(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
      else el.textContent = val;
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key).replace(/\n/g, '<br>');
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });
    scope.querySelectorAll('.shape-item[data-shape]').forEach(el => {
      const key = 'shape.' + el.dataset.shape;
      const label = el.querySelector('.shape-item-label');
      const text = t(key);
      if (label) label.textContent = text;
      el.dataset.label = text;
    });
  }

  function onChange(fn) {
    if (typeof fn === 'function') onChangeCallbacks.push(fn);
  }

  async function setLocale(next) {
    await loadLocale(next);
    applyDom();
    onChangeCallbacks.forEach(fn => {
      try { fn(locale); } catch { /* ignore */ }
    });
  }

  async function init() {
    await loadLocale(detectDefaultLocale());
    applyDom();
  }

  global.DiagramWeaveI18n = {
    init,
    setLocale,
    t,
    getLocale,
    getLocaleCompareTag,
    applyDom,
    onChange,
    SUPPORTED,
  };
  global.t = t;
})(typeof window !== 'undefined' ? window : globalThis);
