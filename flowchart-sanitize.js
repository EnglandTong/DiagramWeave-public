/**
 * DiagramWeave 导入数据校验与清洗（JSON / 多页文档 v2）
 */
(function (global) {
  'use strict';

  const KNOWN_SHAPES = new Set([
    'rectangle', 'rounded', 'diamond', 'terminator', 'circle', 'database',
    'parallelogram', 'document', 'hexagon', 'triangle', 'cross', 'delay',
    'display', 'manual', 'card', 'tape', 'sort', 'or', 'summing', 'collate',
    'storage', 'multidoc', 'internalstorage', 'offlinestorage', 'annotation',
    'cloud', 'actor', 'note', 'offpage', 'subprocess', 'datastore',
    'predefprocess', 'looplimit', 'start', 'end',
  ]);

  const VALID_PORTS = new Set(['top', 'bottom', 'left', 'right']);
  const VALID_CONN_MODES = new Set(['bezier', 'orthogonal', 'avoidance', 'straight', 'visio']);

  const MAX_NODES = 5000;
  const MAX_CONNECTIONS = 10000;
  const MAX_TEXT_LEN = 500;
  const MAX_PAGES = 100;

  const DEFAULT_FILL = '#1e2029';
  const DEFAULT_STROKE = '#3a3e55';

  function sanitizeTextField(val, maxLen = MAX_TEXT_LEN) {
    if (val == null) return '';
    return String(val)
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
      .replace(/[<>]/g, '')
      .slice(0, maxLen);
  }

  function sanitizeHexColor(c, fallback) {
    const fb = fallback || DEFAULT_STROKE;
    if (typeof c !== 'string') return fb;
    const t = c.trim();
    if (/^#[0-9a-f]{6}$/i.test(t)) return t.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(t)) {
      const h = t.slice(1);
      return ('#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toLowerCase();
    }
    return fb;
  }

  function sanitizeShape(shape, knownShapes) {
    const s = sanitizeTextField(shape, 64);
    const registry = knownShapes || KNOWN_SHAPES;
    return registry.has(s) ? s : 'rectangle';
  }

  function registerShape(shapeId) {
    if (typeof shapeId === 'string' && shapeId) KNOWN_SHAPES.add(shapeId.slice(0, 64));
  }

  function registerConnMode(modeId) {
    if (typeof modeId === 'string' && modeId) VALID_CONN_MODES.add(modeId.slice(0, 32));
  }

  function sanitizeNum(n, min, max, fallback) {
    const v = Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(min, v));
  }

  function sanitizeTextColor(value) {
    if (value == null || value === '' || value === 'auto') return 'auto';
    return sanitizeHexColor(value, 'auto');
  }

  function sanitizeNode(raw, index, idMap) {
    if (!raw || typeof raw !== 'object') return null;

    let id = sanitizeTextField(raw.id, 80);
    if (!id || idMap.has(id)) {
      id = 'node_import_' + index;
      while (idMap.has(id)) {
        id = 'node_import_' + index + '_' + Math.random().toString(36).slice(2, 6);
      }
    }
    idMap.set(id, true);

    const node = {
      id,
      refId: sanitizeNum(raw.refId, 1, 99999, index + 1),
      shape: sanitizeShape(raw.shape),
      x: sanitizeNum(raw.x, -50000, 50000, 100),
      y: sanitizeNum(raw.y, -50000, 50000, 100),
      w: sanitizeNum(raw.w, 20, 2000, 140),
      h: sanitizeNum(raw.h, 20, 2000, 60),
      label: sanitizeTextField(raw.label) || '未命名',
      fillColor: sanitizeHexColor(raw.fillColor, DEFAULT_FILL),
      strokeColor: sanitizeHexColor(raw.strokeColor, DEFAULT_STROKE),
      textColor: sanitizeTextColor(raw.textColor),
      detail: sanitizeTextField(raw.detail, 2000),
      duration: sanitizeNum(raw.duration, 0, 999999, 0),
      waitDays: sanitizeNum(raw.waitDays ?? raw.waitDuration, 0, 999999, 0),
      role: sanitizeTextField(raw.role, 200),
      layer: sanitizeNum(raw.layer, 0, 999, 0),
      targetPageId: raw.targetPageId ? sanitizeTextField(raw.targetPageId, 80) : null,
    };

    if (raw.lane !== undefined) node.lane = sanitizeNum(raw.lane, 0, 999, 0);
    if (raw.laneLabel) node.laneLabel = sanitizeTextField(raw.laneLabel, 200);
    if (Array.isArray(raw.tags)) node.tags = raw.tags.slice(0, 20).map(tag => sanitizeTextField(tag, 80)).filter(Boolean);
    else if (typeof raw.tags === 'string') node.tags = raw.tags.split(',').slice(0, 20).map(tag => sanitizeTextField(tag.trim(), 80)).filter(Boolean);

    // Phase 2：组合 / 容器 / 泳道集引用（完整性在 sanitizePage 内二次校验）
    if (raw.groupId) node.groupId = sanitizeTextField(raw.groupId, 80);
    if (raw.containerId) node.containerId = sanitizeTextField(raw.containerId, 80);
    if (raw.isContainer === true) node.isContainer = true;
    if (raw.swimlaneSetId) node.swimlaneSetId = sanitizeTextField(raw.swimlaneSetId, 80);

    return node;
  }

  function sanitizeConnection(raw, index, nodeIds, connIdMap) {
    if (!raw || typeof raw !== 'object') return null;

    const from = sanitizeTextField(raw.from, 80);
    const to = sanitizeTextField(raw.to, 80);
    if (!nodeIds.has(from) || !nodeIds.has(to)) return null;

    let id = sanitizeTextField(raw.id, 80);
    if (!id || connIdMap.has(id)) id = 'conn_import_' + index;
    connIdMap.set(id, true);

    const conn = {
      id,
      from,
      fromPort: VALID_PORTS.has(raw.fromPort) ? raw.fromPort : 'bottom',
      to,
      toPort: VALID_PORTS.has(raw.toPort) ? raw.toPort : 'top',
      label: sanitizeTextField(raw.label, 200),
    };

    if (raw.labelPos != null) {
      conn.labelPos = typeof raw.labelPos === 'string'
        ? (['auto', 'above', 'right', 'custom'].includes(raw.labelPos) ? raw.labelPos : 'auto')
        : sanitizeNum(raw.labelPos, 0, 1, 0.5);
    }
    if (typeof DiagramWeaveRoutingRules !== 'undefined') Object.assign(conn, DiagramWeaveRoutingRules.normalizeConnectionRouting(raw));

    return conn;
  }

  function sanitizeLayer(raw, index) {
    return {
      id: sanitizeNum(raw?.id, 0, 9999, index),
      name: sanitizeTextField(raw?.name) || ('图层 ' + (index + 1)),
      visible: raw?.visible !== false,
      locked: !!raw?.locked,
    };
  }

  function sanitizeGroupEntry(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const id = sanitizeTextField(raw.id, 80) || ('group_import_' + index);
    return { id, name: sanitizeTextField(raw.name, 200) };
  }

  function sanitizeSwimlaneSetEntry(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const id = sanitizeTextField(raw.id, 80) || ('laneSet_import_' + index);
    const lanes = Array.isArray(raw.lanes)
      ? raw.lanes.slice(0, 50).map(lane => sanitizeTextField(lane, 200))
      : [];
    return { id, name: sanitizeTextField(raw.name, 200), lanes };
  }

  function sanitizePage(raw, pageIndex) {
    if (!raw || typeof raw !== 'object') return null;

    const idMap = new Map();
    const rawNodes = Array.isArray(raw.nodes) ? raw.nodes.slice(0, MAX_NODES) : [];
    const nodes = rawNodes
      .map((n, i) => sanitizeNode(n, pageIndex * 10000 + i, idMap))
      .filter(Boolean);
    const nodeIds = new Set(nodes.map(n => n.id));

    const connIdMap = new Map();
    const rawConns = Array.isArray(raw.connections) ? raw.connections.slice(0, MAX_CONNECTIONS) : [];
    const connections = rawConns
      .map((c, i) => sanitizeConnection(c, i, nodeIds, connIdMap))
      .filter(Boolean);

    const rawLayers = Array.isArray(raw.layers) ? raw.layers : [];
    const layers = rawLayers.length
      ? rawLayers.slice(0, 50).map((l, i) => sanitizeLayer(l, i))
      : [{ id: 0, name: '图层 1', visible: true, locked: false }];

    // Phase 2：组合 / 泳道集注册表（按 id 去重）
    const groups = [];
    const groupIdSet = new Set();
    (Array.isArray(raw.groups) ? raw.groups.slice(0, 500) : []).forEach((g, i) => {
      const entry = sanitizeGroupEntry(g, i);
      if (entry && !groupIdSet.has(entry.id)) { groupIdSet.add(entry.id); groups.push(entry); }
    });
    const swimlaneSets = [];
    const laneSetIdSet = new Set();
    (Array.isArray(raw.swimlaneSets) ? raw.swimlaneSets.slice(0, 100) : []).forEach((s, i) => {
      const entry = sanitizeSwimlaneSetEntry(s, i);
      if (entry && !laneSetIdSet.has(entry.id)) { laneSetIdSet.add(entry.id); swimlaneSets.push(entry); }
    });

    // Phase 2 引用完整性：清除悬空引用 / 自引用 / 容器环
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    nodes.forEach(n => {
      if (n.groupId && !groupIdSet.has(n.groupId)) delete n.groupId;
      if (n.swimlaneSetId && !laneSetIdSet.has(n.swimlaneSetId)) delete n.swimlaneSetId;
      if (n.containerId) {
        const target = nodeById.get(n.containerId);
        if (!target || target === n || target.isContainer !== true) delete n.containerId;
      }
    });
    nodes.forEach(n => {
      if (!n.containerId) return;
      const visited = new Set([n.id]);
      let cur = nodeById.get(n.containerId);
      let depth = 0;
      while (cur && cur.containerId && depth < 64) {
        if (visited.has(cur.id)) { delete n.containerId; return; }
        visited.add(cur.id);
        cur = nodeById.get(cur.containerId);
        depth += 1;
      }
      if (depth >= 64) delete n.containerId;
    });

    const page = {
      id: sanitizeTextField(raw.id, 80) || ('page_' + (pageIndex + 1)),
      name: sanitizeTextField(raw.name) || ('页面 ' + (pageIndex + 1)),
      nodes,
      connections,
      layers,
      nextLayerId: sanitizeNum(raw.nextLayerId, 1, 9999, layers.length),
      groups,
      swimlaneSets,
    };
    if (raw.slaDays != null && Number(raw.slaDays) > 0) page.slaDays = sanitizeNum(raw.slaDays, 0.01, 999999, 1);
    return page;
  }

  /**
   * @param {object} data - 解析后的 JSON
   * @param {{ knownShapes?: object, maxNodes?: number, maxConnections?: number }} options
   * @returns {object|null} v2 文档或 v1 单页对象；无效时 null
   */
  function sanitizeFlowDocument(data, options = {}) {
    if (!data || typeof data !== 'object') return null;

    if (options.knownShapes && typeof options.knownShapes === 'object') {
      for (const k of Object.keys(options.knownShapes)) KNOWN_SHAPES.add(k);
    }

    const connRouteMode = VALID_CONN_MODES.has(data.connRouteMode) ? data.connRouteMode : undefined;
    const routingRules = typeof DiagramWeaveRoutingRules !== 'undefined'
      ? DiagramWeaveRoutingRules.normalizeRules(data.routingRules)
      : undefined;

    if (data.version === 2 && Array.isArray(data.pages)) {
      const pages = data.pages.slice(0, MAX_PAGES).map((p, i) => sanitizePage(p, i)).filter(Boolean);
      if (!pages.length) return null;

      const pageIds = new Set(pages.map(p => p.id));
      let currentPageId = sanitizeTextField(data.currentPageId, 80);
      if (!pageIds.has(currentPageId)) currentPageId = pages[0].id;

      const document = {
        version: 2,
        projectName: sanitizeTextField(data.projectName, 80),
        historyId: sanitizeTextField(data.historyId, 120),
        autosaveSeconds: sanitizeNum(data.autosaveSeconds, 5, 3600, 30),
        pages,
        currentPageId,
        nextPageId: sanitizeNum(data.nextPageId, 1, 99999, pages.length + 1),
        nextId: sanitizeNum(data.nextId, 1, 999999, 1),
        connRouteMode,
        routingRules,
        reviewThreads: Array.isArray(data.reviewThreads) ? data.reviewThreads.slice(0, 1000).filter(Boolean).map((thread, index) => ({
          id: sanitizeTextField(thread.id, 120) || ('review_' + (index + 1)),
          targetType: thread.targetType === 'connection' ? 'connection' : 'node',
          targetId: sanitizeTextField(thread.targetId, 120),
          status: ['pending', 'approved', 'changes_requested', 'resolved'].includes(thread.status) ? thread.status : 'pending',
          comments: Array.isArray(thread.comments) ? thread.comments.slice(0, 500).filter(Boolean).map((comment, commentIndex) => ({
            id: sanitizeTextField(comment.id, 120) || ('comment_' + (commentIndex + 1)),
            author: sanitizeTextField(comment.author, 120), body: sanitizeTextField(comment.body, 5000), createdAt: sanitizeTextField(comment.createdAt, 80),
          })) : [],
        })) : [],
      };
      if (data.slaDays != null && Number(data.slaDays) > 0) document.slaDays = sanitizeNum(data.slaDays, 0.01, 999999, 1);
      return document;
    }

    if (Array.isArray(data.nodes) && Array.isArray(data.connections)) {
      const page = sanitizePage({
        nodes: data.nodes,
        connections: data.connections,
        id: 'page_1',
        name: '页面 1',
        groups: data.groups,
        swimlaneSets: data.swimlaneSets,
      }, 0);
      if (!page) return null;

      return {
        version: 1,
        projectName: sanitizeTextField(data.projectName, 80),
        historyId: sanitizeTextField(data.historyId, 120),
        autosaveSeconds: sanitizeNum(data.autosaveSeconds, 5, 3600, 30),
        nodes: page.nodes,
        connections: page.connections,
        groups: page.groups,
        swimlaneSets: page.swimlaneSets,
        nextId: sanitizeNum(data.nextId, 1, 999999, page.nodes.length + 1),
        connRouteMode,
        routingRules,
      };
    }

    return null;
  }

  global.DiagramWeaveSanitize = {
    sanitizeFlowDocument,
    sanitizeTextField,
    sanitizeHexColor,
    sanitizeTextColor,
    sanitizeShape,
    registerShape,
    registerConnMode,
    KNOWN_SHAPES,
  };
})(typeof window !== 'undefined' ? window : globalThis);
