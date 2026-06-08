/**
 * DiagramWeave 扩展：多页/图层、专业布局、中文字体、额外形状
 * 依赖 flowchart-editor.html 中的 state、shapeDefaults、shapeNames 等全局对象
 */
(function (global) {
  'use strict';

  function dwT(key, vars) {
    return typeof global.t === 'function' ? global.t(key, vars) : key;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const EXT_SHAPE_DEFAULTS = {
    cross: { w: 80, h: 80 },
    card: { w: 140, h: 60 },
    tape: { w: 140, h: 60 },
    summing: { w: 100, h: 80 },
    collate: { w: 120, h: 80 },
    cloud: { w: 140, h: 80 },
    actor: { w: 80, h: 100 },
    note: { w: 120, h: 80 },
    offpage: { w: 100, h: 70 },
    subprocess: { w: 160, h: 70 },
    datastore: { w: 100, h: 80 },
    predefprocess: { w: 140, h: 60 },
    looplimit: { w: 120, h: 70 },
    start: { w: 60, h: 60 },
    end: { w: 60, h: 60 },
  };

  const EXT_SHAPE_NAMES = {
    cross: '交叉',
    card: '卡片',
    tape: '磁带',
    summing: '求和',
    collate: '整理',
    cloud: '云服务',
    actor: '角色/用户',
    note: '便签',
    offpage: '跨页引用',
    subprocess: '子流程框',
    datastore: '数据存储',
    predefprocess: '预定义流程',
    looplimit: '循环上限',
    start: '开始',
    end: '结束',
  };

  function mergeShapeRegistry() {
    if (typeof shapeDefaults === 'undefined') return;
    Object.assign(shapeDefaults, EXT_SHAPE_DEFAULTS);
    Object.assign(shapeNames, EXT_SHAPE_NAMES);
  }

  // ===== 文档：多页 + 图层 =====
  const doc = {
    pages: [],
    currentPageId: null,
    nextPageId: 1,
    activeLayerId: 0,
  };

  function createPageData(name) {
    const id = 'page_' + doc.nextPageId++;
    return {
      id,
      name: name || dwT('page.default', { n: doc.pages.length + 1 }),
      nodes: [],
      connections: [],
      layers: [
        { id: 0, name: dwT('layer.default', { n: 1 }), visible: true, locked: false },
      ],
      nextLayerId: 1,
    };
  }

  function getCurrentPage() {
    return doc.pages.find(p => p.id === doc.currentPageId) || doc.pages[0];
  }

  function syncPageFromState() {
    const page = getCurrentPage();
    if (!page || typeof state === 'undefined') return;
    page.nodes = state.nodes;
    page.connections = state.connections;
  }

  function syncStateFromPage() {
    const page = getCurrentPage();
    if (!page || typeof state === 'undefined') return;
    state.nodes = page.nodes;
    state.connections = page.connections;
    state.selectedNodeId = null;
    state.selectedConnectionId = null;
  }

  function initDocument() {
    if (doc.pages.length) {
      syncStateFromPage();
      renderPageTabs();
      renderLayerPanel();
      return;
    }
    const first = createPageData();
    if (typeof state !== 'undefined') {
      first.nodes = state.nodes;
      first.connections = state.connections;
    }
    doc.pages.push(first);
    doc.currentPageId = first.id;
    renderPageTabs();
    renderLayerPanel();
  }

  function switchPage(pageId) {
    if (pageId === doc.currentPageId) return;
    if (typeof saveState === 'function') saveState();
    syncPageFromState();
    doc.currentPageId = pageId;
    syncStateFromPage();
    doc.activeLayerId = 0;
    if (typeof canvasTransform !== 'undefined') {
      canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
      canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());
    }
    renderPageTabs();
    renderLayerPanel();
    if (typeof renderAll === 'function') renderAll();
    if (typeof showToast === 'function') showToast('已切换页面');
  }

  function addPage() {
    syncPageFromState();
    const page = createPageData();
    doc.pages.push(page);
    switchPage(page.id);
  }

  function duplicatePage() {
    syncPageFromState();
    const cur = getCurrentPage();
    const copy = createPageData(cur.name + ' 副本');
    copy.nodes = JSON.parse(JSON.stringify(cur.nodes));
    copy.connections = JSON.parse(JSON.stringify(cur.connections));
    copy.layers = JSON.parse(JSON.stringify(cur.layers));
    doc.pages.push(copy);
    switchPage(copy.id);
  }

  function renamePage(pageId) {
    const page = doc.pages.find(p => p.id === pageId);
    if (!page) return;
    const name = prompt('页面名称', page.name);
    if (name && name.trim()) {
      setPageName(pageId, name.trim());
    }
  }

  function setPageName(pageId, name) {
    const page = doc.pages.find(p => p.id === pageId);
    if (!page || !name || !name.trim()) return false;
    page.name = name.trim();
    renderPageTabs();
    if (typeof updatePagePropertiesPanel === 'function') updatePagePropertiesPanel();
    return true;
  }

  function deletePage(pageId) {
    if (doc.pages.length <= 1) {
      if (typeof showToast === 'function') showToast('至少保留一个页面');
      return;
    }
    const target = doc.pages.find(p => p.id === pageId);
    if (!target) return;

    if (!confirm(`确定删除页面「${target.name}」？\n可用 Ctrl+Z 撤销。`)) return;

    if (typeof saveState === 'function') saveState();
    syncPageFromState();

    doc.pages.forEach(p => {
      p.nodes.forEach(n => {
        if (n.targetPageId === pageId) n.targetPageId = null;
      });
    });

    const wasCurrent = doc.currentPageId === pageId;
    doc.pages = doc.pages.filter(p => p.id !== pageId);

    if (wasCurrent) {
      doc.currentPageId = doc.pages[0].id;
      doc.activeLayerId = 0;
      syncStateFromPage();
      if (typeof canvasTransform !== 'undefined') {
        canvasTransform.querySelectorAll('.node').forEach(el => el.remove());
        canvasTransform.querySelectorAll('.swimlane-bg, .swimlane-label').forEach(el => el.remove());
      }
      renderLayerPanel();
      if (typeof renderAll === 'function') renderAll();
    } else {
      renderLayerPanel();
      if (typeof updatePagePropertiesPanel === 'function') updatePagePropertiesPanel();
    }
    renderPageTabs();
    if (typeof showToast === 'function') showToast(`已删除页面「${target.name}」`);
  }

  function renderPageTabs() {
    const bar = document.getElementById('pageTabs');
    if (!bar) return;
    const canDelete = doc.pages.length > 1;
    bar.innerHTML = doc.pages.map(p => {
      const closeBtn = canDelete
        ? `<button type="button" class="page-tab-close" onclick="event.stopPropagation();DiagramWeave.deletePage('${p.id}')" title="${escapeHtml(dwT('page.delete'))}" aria-label="${escapeHtml(dwT('page.delete'))}">×</button>`
        : '';
      return `
      <span class="page-tab-wrap${p.id === doc.currentPageId ? ' active' : ''}">
        <button type="button" class="page-tab"
          onclick="DiagramWeave.switchPage('${p.id}')"
          ondblclick="DiagramWeave.renamePage('${p.id}')"
          title="${escapeHtml(dwT('page.renameHint'))}">${escapeHtml(p.name)}</button>
        ${closeBtn}
      </span>`;
    }).join('') +
      `<button type="button" class="page-tab-add" onclick="DiagramWeave.addPage()" title="${escapeHtml(dwT('page.new'))}">+</button>` +
      `<button type="button" class="page-tab-add" onclick="DiagramWeave.duplicatePage()" title="${escapeHtml(dwT('page.duplicate'))}">⧉</button>`;
  }

  function ensureNodeLayer(node) {
    if (node.layer === undefined || node.layer === null) node.layer = 0;
  }

  function isLayerVisible(layerId) {
    const page = getCurrentPage();
    const layer = page.layers.find(l => l.id === layerId);
    return layer ? layer.visible : true;
  }

  function isLayerLocked(layerId) {
    const page = getCurrentPage();
    const layer = page.layers.find(l => l.id === layerId);
    return layer ? layer.locked : false;
  }

  function getVisibleNodes() {
    if (typeof state === 'undefined') return [];
    return state.nodes.filter(n => {
      ensureNodeLayer(n);
      return isLayerVisible(n.layer);
    });
  }

  function renderLayerPanel() {
    const panel = document.getElementById('layerList');
    if (!panel) return;
    const page = getCurrentPage();
    const canDelete = page.layers.length > 1;
    panel.innerHTML = page.layers.map(layer => {
      const deleteBtn = canDelete
        ? `<button type="button" class="layer-delete" onclick="event.stopPropagation();DiagramWeave.deleteLayer(${layer.id})" title="${escapeHtml(dwT('layer.delete'))}" aria-label="${escapeHtml(dwT('layer.delete'))}">×</button>`
        : '';
      return `
      <div class="layer-row${layer.id === doc.activeLayerId ? ' active' : ''}${layer.locked ? ' locked' : ''}"
        onclick="DiagramWeave.setActiveLayer(${layer.id})">
        <button type="button" class="layer-eye" onclick="event.stopPropagation();DiagramWeave.toggleLayerVisible(${layer.id})"
          title="${escapeHtml(layer.visible ? dwT('layer.hide') : dwT('layer.show'))}">${layer.visible ? '👁' : '○'}</button>
        <span class="layer-name">${escapeHtml(layer.name)}</span>
        <button type="button" class="layer-lock" onclick="event.stopPropagation();DiagramWeave.toggleLayerLock(${layer.id})"
          title="${escapeHtml(layer.locked ? dwT('layer.unlock') : dwT('layer.lock'))}">${layer.locked ? '🔒' : '🔓'}</button>
        ${deleteBtn}
      </div>`;
    }).join('') +
      `<button type="button" class="layer-add-btn" onclick="DiagramWeave.addLayer()">${escapeHtml(dwT('layer.add'))}</button>`;
  }

  function setActiveLayer(id) {
    doc.activeLayerId = id;
    renderLayerPanel();
  }

  function toggleLayerVisible(id) {
    const layer = getCurrentPage().layers.find(l => l.id === id);
    if (layer) layer.visible = !layer.visible;
    renderLayerPanel();
    if (typeof renderAll === 'function') renderAll();
  }

  function toggleLayerLock(id) {
    const layer = getCurrentPage().layers.find(l => l.id === id);
    if (layer) layer.locked = !layer.locked;
    renderLayerPanel();
  }

  function addLayer() {
    const page = getCurrentPage();
    const id = page.nextLayerId++;
    page.layers.push({ id, name: dwT('layer.default', { n: page.layers.length + 1 }), visible: true, locked: false });
    doc.activeLayerId = id;
    renderLayerPanel();
  }

  function deleteLayer(layerId) {
    const page = getCurrentPage();
    if (!page) return;
    if (page.layers.length <= 1) {
      if (typeof showToast === 'function') showToast(dwT('layer.keepOne'));
      return;
    }
    const layer = page.layers.find(l => l.id === layerId);
    if (!layer) return;

    syncPageFromState();

    const remaining = page.layers.filter(l => l.id !== layerId);
    const targetLayer = doc.activeLayerId !== layerId
      ? remaining.find(l => l.id === doc.activeLayerId) || remaining[0]
      : remaining[0];
    const nodesOnLayer = state.nodes.filter(n => (n.layer ?? 0) === layerId);

    let msg = `确定删除图层「${layer.name}」？`;
    if (nodesOnLayer.length) {
      msg += `\n该图层 ${nodesOnLayer.length} 个图形将移至「${targetLayer.name}」。`;
    }
    msg += '\n可用 Ctrl+Z 撤销。';
    if (!confirm(msg)) return;

    if (typeof saveState === 'function') saveState();

    nodesOnLayer.forEach(n => { n.layer = targetLayer.id; });

    page.layers = remaining;
    if (doc.activeLayerId === layerId) doc.activeLayerId = targetLayer.id;

    renderLayerPanel();
    if (typeof renderAll === 'function') renderAll();
    if (typeof showToast === 'function') {
      const moved = nodesOnLayer.length
        ? `，${nodesOnLayer.length} 个图形已移至「${targetLayer.name}」`
        : '';
      showToast(`已删除图层「${layer.name}」${moved}`);
    }
  }

  function assignNewNodeLayer(node) {
    ensureNodeLayer(node);
    node.layer = doc.activeLayerId;
  }

  function canEditNode(node) {
    ensureNodeLayer(node);
    return isLayerVisible(node.layer) && !isLayerLocked(node.layer);
  }

  // ===== 图算法辅助 =====
  function buildGraph() {
    const adj = new Map();
    const revAdj = new Map();
    const inDegree = new Map();
    state.nodes.forEach(n => {
      adj.set(n.id, []);
      revAdj.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    state.connections.forEach(c => {
      if (!adj.has(c.from) || !adj.has(c.to)) return;
      adj.get(c.from).push(c.to);
      revAdj.get(c.to).push(c.from);
      inDegree.set(c.to, inDegree.get(c.to) + 1);
    });
    return { adj, revAdj, inDegree };
  }

  function findLongestPathIds() {
    const { adj, inDegree } = buildGraph();
    let starts = state.nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);
    if (!starts.length && state.nodes.length) starts = [state.nodes[0].id];

    let longest = [];
    const visiting = new Set();

    function dfs(id, path) {
      if (visiting.has(id)) return;
      visiting.add(id);
      path.push(id);
      const outs = adj.get(id) || [];
      if (!outs.length) {
        if (path.length > longest.length) longest = path.slice();
      } else {
        outs.forEach(next => dfs(next, path));
      }
      path.pop();
      visiting.delete(id);
    }

    starts.forEach(s => dfs(s, []));
    if (!longest.length && state.nodes.length) longest = [state.nodes[0].id];
    return longest;
  }

  function getLayoutCfg(density) {
    const densityConfig = {
      compact: { levelGap: 90, nodeGap: 55, branchGap: 120, padding: 60 },
      normal: { levelGap: 120, nodeGap: 70, branchGap: 160, padding: 80 },
      loose: { levelGap: 160, nodeGap: 90, branchGap: 200, padding: 100 },
    };
    return densityConfig[density] || densityConfig.normal;
  }

  /** 最长路径居中，分支向两侧环绕 */
  function autoLayoutSpine(direction, density) {
    if (!state.nodes.length) return;
    const cfg = getLayoutCfg(density);
    const spine = findLongestPathIds();
    const spineSet = new Set(spine);
    const { adj, revAdj } = buildGraph();
    const isVertical = direction !== 'horizontal';

    const spineIndex = new Map();
    spine.forEach((id, i) => spineIndex.set(id, i));

    const side = new Map();
    spine.forEach(id => side.set(id, 0));

    const queue = [...spine];
    let branchCounter = 0;
    while (queue.length) {
      const id = queue.shift();
      const baseSide = side.get(id) || 0;
      (adj.get(id) || []).forEach(next => {
        if (spineSet.has(next)) return;
        if (side.has(next)) return;
        branchCounter++;
        const s = branchCounter % 2 === 0 ? 1 : -1;
        side.set(next, baseSide + s * (1 + Math.floor(branchCounter / 2)));
        queue.push(next);
      });
    }

    state.nodes.forEach(n => {
      if (!side.has(n)) {
        const preds = revAdj.get(n.id) || [];
        if (preds.length) {
          const avg = preds.reduce((s, p) => s + (side.get(p) || 0), 0) / preds.length;
          side.set(n.id, Math.round(avg) || 1);
        } else {
          side.set(n.id, 1);
        }
      }
    });

    const depth = new Map();
    function assignDepth(id, d) {
      if ((depth.get(id) || 0) >= d) return;
      depth.set(id, d);
      (adj.get(id) || []).forEach(next => assignDepth(next, d + 1));
    }
    spine.forEach((id, i) => depth.set(id, i));
    spine.forEach(id => (adj.get(id) || []).forEach(next => {
      if (!spineSet.has(next)) assignDepth(next, (spineIndex.get(id) || 0) + 1);
    }));

    state.nodes.forEach(n => {
      if (!depth.has(n.id)) depth.set(n.id, 0);
    });

    state.nodes.forEach(n => {
      const si = spineIndex.has(n.id) ? spineIndex.get(n.id) : null;
      const sd = side.get(n.id) || 0;
      const d = depth.get(n.id) || 0;
      if (isVertical) {
        const cx = cfg.padding + cfg.branchGap + Math.max(0, spine.length - 1) * cfg.nodeGap;
        n.x = Math.round(cx + sd * cfg.branchGap - n.w / 2);
        n.y = Math.round(cfg.padding + (si !== null ? si : d) * cfg.levelGap);
      } else {
        const cy = cfg.padding + cfg.branchGap;
        n.y = Math.round(cy + sd * cfg.branchGap - n.h / 2);
        n.x = Math.round(cfg.padding + (si !== null ? si : d) * cfg.levelGap);
      }
    });
  }

  /** 以指定角色（泳道/role）为主轴，其他角色平行跟随 */
  function autoLayoutRoleCentric(direction, density, anchorRole) {
    if (!state.nodes.length) return;
    const cfg = getLayoutCfg(density);
    const isVertical = direction !== 'horizontal';
    const roles = [...new Set(state.nodes.map(n => (n.role || n.laneLabel || (n.lane !== undefined ? String(n.lane) : '') || '默认')))];
    const anchor = anchorRole || roles[0] || '默认';

    state.nodes.forEach(n => {
      if (!n.role) {
        n.role = n.laneLabel || (n.lane !== undefined ? String(n.lane) : '默认');
      }
    });

    const roleOrder = [anchor, ...roles.filter(r => r !== anchor)];
    const roleIndex = new Map(roleOrder.map((r, i) => [r, i]));

    const { adj, inDegree } = buildGraph();
    const levels = new Map();
    state.nodes.forEach(n => levels.set(n.id, 0));
    for (let iter = 0; iter < state.nodes.length; iter++) {
      let changed = false;
      state.connections.forEach(c => {
        const next = levels.get(c.from) + 1;
        if (next > levels.get(c.to)) { levels.set(c.to, next); changed = true; }
      });
      if (!changed) break;
    }

    const byRoleLevel = new Map();
    state.nodes.forEach(n => {
      const r = n.role || '默认';
      const lvl = levels.get(n.id) || 0;
      const key = r + '@' + lvl;
      if (!byRoleLevel.has(key)) byRoleLevel.set(key, []);
      byRoleLevel.get(key).push(n);
    });

    byRoleLevel.forEach(nodes => {
      nodes.forEach((n, i) => { n._idxInCell = i; });
    });

    state.nodes.forEach(n => {
      const r = n.role || '默认';
      const ri = roleIndex.get(r) ?? 0;
      const lvl = levels.get(n.id) || 0;
      const idx = n._idxInCell || 0;
      const offset = ri - roleIndex.get(anchor);
      if (isVertical) {
        n.x = Math.round(cfg.padding + lvl * cfg.levelGap + offset * cfg.branchGap);
        n.y = Math.round(cfg.padding + idx * (cfg.nodeGap * 0.6));
      } else {
        n.x = Math.round(cfg.padding + idx * (cfg.nodeGap * 0.6));
        n.y = Math.round(cfg.padding + lvl * cfg.levelGap + offset * cfg.branchGap);
      }
      delete n._idxInCell;
    });
  }

  function collectRoleOptions() {
    const set = new Set();
    state.nodes.forEach(n => {
      const r = n.role || n.laneLabel || (n.lane !== undefined && n.lane !== '' ? `泳道${n.lane}` : '');
      if (r) set.add(String(r));
    });
    if (!set.size) set.add('默认');
    return [...set];
  }

  function refreshRoleSelect() {
    const sel = document.getElementById('layoutAnchorRole');
    if (!sel || typeof state === 'undefined') return;
    const cur = sel.value;
    const opts = collectRoleOptions();
    sel.innerHTML = opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    if (opts.includes(cur)) sel.value = cur;
  }

  // ===== 中文字体（PDF / SVG 导出）=====
  const fontState = { base64: null, loading: null, family: 'DiagramWeaveZh' };

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function loadChineseFont() {
    if (fontState.base64) return Promise.resolve(fontState.base64);
    if (fontState.loading) return fontState.loading;
    // file:// 下 fetch 字体被 CORS 拦截；界面用 CSS @font-face，PDF 导出用系统字体回退
    if (typeof DiagramWeaveBootstrap !== 'undefined' && DiagramWeaveBootstrap.isFileProtocol()) {
      fontState.loading = Promise.resolve(null);
      return fontState.loading;
    }
    const tryFetch = (path) => fetch(path).then(r => {
      if (!r.ok) throw new Error('missing');
      return r.arrayBuffer();
    });
    fontState.loading = tryFetch('vendor/fonts/NotoSansSC-Regular.otf')
      .catch(() => tryFetch('vendor/fonts/NotoSansSC-Regular.ttf'))
      .then(buf => {
        fontState.base64 = arrayBufferToBase64(buf);
        return fontState.base64;
      })
      .catch(() => {
        fontState.base64 = null;
        return null;
      });
    return fontState.loading;
  }

  function getPageById(pageId) {
    return doc.pages.find(p => p.id === pageId) || null;
  }

  function registerPackFont(font) {
    if (!font?.url || !font.family) return;
    fetch(font.url).then(r => {
      if (!r.ok) throw new Error('font');
      return r.arrayBuffer();
    }).then(buf => {
      fontState.packFonts = fontState.packFonts || {};
      fontState.packFonts[font.id] = { family: font.family, base64: arrayBufferToBase64(buf) };
    }).catch(() => { /* optional remote font */ });
  }

  function getSvgFontStyleBlock() {
    if (!fontState.base64) return 'text { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; }';
    return `@font-face { font-family: "${fontState.family}"; src: url(data:font/truetype;charset=utf-8;base64,${fontState.base64}) format("truetype"); }
text { font-family: "${fontState.family}", "Microsoft YaHei", sans-serif; }`;
  }

  function registerPdfChineseFont(pdf) {
    if (!fontState.base64 || !pdf) return false;
    try {
      pdf.addFileToVFS('NotoSansSC-Regular.otf', fontState.base64);
      pdf.addFont('NotoSansSC-Regular.otf', fontState.family, 'normal');
      return true;
    } catch {
      return false;
    }
  }

  function serializeDocument() {
    syncPageFromState();
    return {
      version: 2,
      pages: doc.pages,
      currentPageId: doc.currentPageId,
      nextPageId: doc.nextPageId,
      nextId: typeof state !== 'undefined' ? state.nextId : 1,
      connRouteMode: typeof state !== 'undefined' ? state.connRouteMode : 'bezier',
    };
  }

  function loadDocument(data) {
    if (!data || !data.pages) return false;
    const safe = typeof DiagramWeaveSanitize !== 'undefined'
      ? DiagramWeaveSanitize.sanitizeFlowDocument(data)
      : data;
    if (!safe || !safe.pages) return false;
    doc.pages = safe.pages;
    doc.currentPageId = safe.currentPageId || safe.pages[0].id;
    doc.nextPageId = safe.nextPageId || doc.pages.length + 1;
    doc.pages.forEach(p => {
      if (!p.layers) p.layers = [{ id: 0, name: dwT('layer.default', { n: 1 }), visible: true, locked: false }];
      if (!p.nextLayerId) p.nextLayerId = p.layers.length;
    });
    syncStateFromPage();
    if (typeof state !== 'undefined' && safe.nextId) state.nextId = safe.nextId;
    if (typeof applyConnRouteModeFromData === 'function') applyConnRouteModeFromData(safe.connRouteMode);
    renderPageTabs();
    renderLayerPanel();
    return true;
  }

  global.DiagramWeave = {
    doc,
    initDocument,
    switchPage,
    addPage,
    duplicatePage,
    renamePage,
    setPageName,
    deletePage,
    renderPageTabs,
    syncPageFromState,
    syncStateFromPage,
    getCurrentPage,
    getPageById,
    getVisibleNodes,
    assignNewNodeLayer,
    canEditNode,
    isLayerLocked,
    renderLayerPanel,
    setActiveLayer,
    toggleLayerVisible,
    toggleLayerLock,
    addLayer,
    deleteLayer,
    autoLayoutSpine,
    autoLayoutRoleCentric,
    findLongestPathIds,
    collectRoleOptions,
    refreshRoleSelect,
    loadChineseFont,
    registerPackFont,
    getSvgFontStyleBlock,
    registerPdfChineseFont,
    serializeDocument,
    loadDocument,
    mergeShapeRegistry,
  };
})(typeof window !== 'undefined' ? window : globalThis);