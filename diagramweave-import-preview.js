(function initDiagramWeaveImportPreview(global) {
  'use strict';

  const Result = typeof global.DiagramWeaveResult !== 'undefined' && global.DiagramWeaveResult && typeof global.DiagramWeaveResult.createError === 'function'
    ? global.DiagramWeaveResult
    : { 
        createError: issues => ({ success: false, data: null, issues, warnings: [] }), 
        createSuccess: data => ({ success: true, data, issues: [], warnings: [] }),
        addIssue: (result, issue) => { if (result && Array.isArray(result.issues)) result.issues.push(issue); return result; },
        addWarning: (result, warning) => { if (result && Array.isArray(result.warnings)) result.warnings.push(warning); return result; }
      };

  function issue(code, row, field, reason, severity = 'error') {
    return { code, severity, row, field, reason };
  }

  function documentPages(raw) {
    if (raw?.version === 2 && Array.isArray(raw.pages)) return raw.pages;
    if (Array.isArray(raw?.nodes) || Array.isArray(raw?.connections)) {
      return [{ id: 'page_1', nodes: raw.nodes || [], connections: raw.connections || [] }];
    }
    return [];
  }

  function inspectRawDocument(raw) {
    const issues = [];
    const warnings = [];
    documentPages(raw).forEach((page, pageIndex) => {
      const ids = new Set();
      (page.nodes || []).forEach((node, index) => {
        const row = index + 2;
        if (!node || typeof node !== 'object') {
          issues.push(issue('INVALID_NODE', row, 'node', `Page ${pageIndex + 1}: node row is not an object`));
          return;
        }
        const id = String(node.id || '').trim();
        if (!id) issues.push(issue('MISSING_NODE_ID', row, 'id', `Page ${pageIndex + 1}: node ID is required`));
        else if (ids.has(id)) issues.push(issue('DUPLICATE_NODE_ID', row, 'id', `Page ${pageIndex + 1}: duplicate node ID "${id}"`));
        else ids.add(id);
        if (!String(node.label || '').trim()) warnings.push(issue('MISSING_NODE_LABEL', row, 'label', `Page ${pageIndex + 1}: node label is blank`, 'warning'));
      });
      (page.connections || []).forEach((connection, index) => {
        const row = index + 2;
        if (!connection || typeof connection !== 'object') {
          issues.push(issue('INVALID_CONNECTION', row, 'connection', `Page ${pageIndex + 1}: connection row is not an object`));
          return;
        }
        if (!ids.has(String(connection.from || ''))) issues.push(issue('MISSING_FROM_REFERENCE', row, 'from', `Page ${pageIndex + 1}: start node "${connection.from || ''}" was not found`));
        if (!ids.has(String(connection.to || ''))) issues.push(issue('MISSING_TO_REFERENCE', row, 'to', `Page ${pageIndex + 1}: end node "${connection.to || ''}" was not found`));
      });
    });
    return { issues, warnings };
  }

  function countDocument(document) {
    const pages = document?.pages || [{ nodes: document?.nodes || [], connections: document?.connections || [] }];
    return pages.reduce((summary, page) => ({
      pages: summary.pages + 1,
      nodes: summary.nodes + (page.nodes?.length || 0),
      connections: summary.connections + (page.connections?.length || 0),
    }), { pages: 0, nodes: 0, connections: 0 });
  }

  function countCycles(document) {
    let cycles = 0;
    const pages = document?.pages || [{ nodes: document?.nodes || [], connections: document?.connections || [] }];
    for (const page of pages) {
      const adjacency = new Map((page.nodes || []).map(node => [node.id, []]));
      for (const connection of page.connections || []) adjacency.get(connection.from)?.push(connection.to);
      const visiting = new Set();
      const visited = new Set();
      const visit = id => {
        if (visiting.has(id)) { cycles += 1; return; }
        if (visited.has(id)) return;
        visiting.add(id);
        for (const next of adjacency.get(id) || []) visit(next);
        visiting.delete(id);
        visited.add(id);
      };
      for (const id of adjacency.keys()) visit(id);
    }
    return cycles;
  }

  function createDocumentPreview(raw, options = {}) {
    const diagnostics = inspectRawDocument(raw);
    const sanitizer = options.sanitizer || global.DiagramWeaveSanitize;
    const document = sanitizer?.sanitizeFlowDocument
      ? sanitizer.sanitizeFlowDocument(raw, options.sanitizeOptions)
      : raw;
    if (!document) {
      const result = Result.createError([...diagnostics.issues, issue('INVALID_DOCUMENT', 0, 'document', 'Document could not be parsed')]);
      result.warnings = diagnostics.warnings;
      return result;
    }
    const summary = countDocument(document);
    summary.cycles = countCycles(document);
    const result = Result.createSuccess({ document, summary, sourceType: options.sourceType || 'json' });
    result.issues = diagnostics.issues;
    result.warnings = diagnostics.warnings;
    return result;
  }

  function createTabularPreview(nodeRows, connectionRows, options = {}) {
    const issues = [];
    const warnings = [];
    const pages = new Map();
    const refToId = new Map();
    const refLocations = new Map();
    const pageKey = value => String(value || 'Page 1').trim() || 'Page 1';
    const ensurePage = name => {
      const key = pageKey(name);
      if (!pages.has(key)) {
        const slug = key.replace(/[^a-z0-9_-]/gi, '_') || String(pages.size + 1);
        pages.set(key, {
          id: `page_${slug}`, name: key, nodes: [], connections: [],
          layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }], nextLayerId: 1,
        });
      }
      return pages.get(key);
    };
    (nodeRows || []).forEach((row, index) => {
      const sourceRow = Number(row.sourceRow) || index + 2;
      const ref = String(row.refId ?? row.id ?? '').trim();
      const pageName = pageKey(row.page);
      const refKey = `${pageName}::${ref}`;
      if (!ref) {
        issues.push(issue('MISSING_NODE_ID', sourceRow, 'id', 'Node ID is required'));
        return;
      }
      if (refToId.has(refKey)) {
        issues.push(issue('DUPLICATE_NODE_ID', sourceRow, 'id', `Duplicate node ID "${ref}"`));
        return;
      }
      const page = ensurePage(pageName);
      const id = `${page.id}_node_${ref.replace(/[^a-z0-9_-]/gi, '_')}`;
      refToId.set(refKey, id);
      if (!refLocations.has(ref)) refLocations.set(ref, []);
      refLocations.get(ref).push({ pageName, id });
      const layer = Number(row.layer) || 0;
      if (layer > 0 && !page.layers.some(item => item.id === layer)) {
        page.layers.push({ id: layer, name: `Layer ${layer}`, visible: true, locked: false });
        page.nextLayerId = Math.max(page.nextLayerId, layer + 1);
      }
      page.nodes.push({
        id, refId: Number.isFinite(Number(ref)) ? Number(ref) : index + 1,
        shape: row.shape || 'rectangle', label: row.label || `Node ${ref}`,
        x: Number.isFinite(Number(row.x)) ? Number(row.x) : 100 + index * 40,
        y: Number.isFinite(Number(row.y)) ? Number(row.y) : 100 + index * 40,
        w: Number(row.w) || 140, h: Number(row.h) || 60,
        fillColor: row.fillColor, strokeColor: row.strokeColor, textColor: row.textColor || 'auto',
        detail: row.detail || '', duration: Number(row.duration) || 0, role: row.role || '', layer,
      });
    });
    (connectionRows || []).forEach((row, index) => {
      const sourceRow = Number(row.sourceRow) || index + 2;
      const fromRef = String(row.from ?? '').trim();
      const toRef = String(row.to ?? '').trim();
      let pageName = pageKey(row.page);
      let from = refToId.get(`${pageName}::${fromRef}`);
      let to = refToId.get(`${pageName}::${toRef}`);
      if ((!from || !to) && !row.page) {
        const fromMatches = refLocations.get(fromRef) || [];
        const toMatches = refLocations.get(toRef) || [];
        const shared = fromMatches.find(start => toMatches.some(end => end.pageName === start.pageName));
        if (shared) {
          pageName = shared.pageName;
          from = refToId.get(`${pageName}::${fromRef}`);
          to = refToId.get(`${pageName}::${toRef}`);
        }
      }
      if (!from) issues.push(issue('MISSING_FROM_REFERENCE', sourceRow, 'from', `Start node "${fromRef}" was not found`));
      if (!to) issues.push(issue('MISSING_TO_REFERENCE', sourceRow, 'to', `End node "${toRef}" was not found`));
      if (!from || !to) return;
      ensurePage(pageName).connections.push({
        id: `${ensurePage(pageName).id}_conn_${index + 1}`, from, to,
        fromPort: row.fromPort || 'bottom', toPort: row.toPort || 'top',
        label: row.label || '', ...(row.labelPos == null ? {} : { labelPos: row.labelPos }),
      });
    });
    if (!pages.size) ensurePage('Page 1');
    const pageList = [...pages.values()];
    const raw = {
      version: 2, pages: pageList, currentPageId: pageList[0].id,
      nextPageId: pageList.length + 1,
      nextId: pageList.reduce((total, page) => total + page.nodes.length + page.connections.length, 1),
    };
    const preview = createDocumentPreview(raw, { ...options, sourceType: options.sourceType || 'excel' });
    preview.issues = [...issues, ...preview.issues];
    preview.warnings = [...warnings, ...preview.warnings];
    return preview;
  }

  global.DiagramWeaveImportPreview = {
    createDocumentPreview, createTabularPreview, inspectRawDocument, countCycles,
  };
})(typeof window !== 'undefined' ? window : globalThis);
