(function (global) {
  'use strict';

  const Result = typeof global.DiagramWeaveResult !== 'undefined' && global.DiagramWeaveResult && typeof global.DiagramWeaveResult.createError === 'function'
    ? global.DiagramWeaveResult
    : { createError: issues => ({ success: false, data: null, issues, warnings: [] }), createSuccess: data => ({ success: true, data, issues: [], warnings: [] }) };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));

  const attr = (xml, name) => {
    const match = new RegExp(`\\b${name}="([^"]*)"`).exec(xml || '');
    return match ? match[1] : '';
  };

  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function textOf(shapeXml) {
    const match = /<Text[^>]*>([\s\S]*?)<\/Text>/i.exec(shapeXml);
    return match ? match[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : '';
  }

  function cell(shapeXml, name, fallback = 0) {
    const match = new RegExp(`<Cell[^>]*N="${name}"[^>]*V="([^"]*)"`, 'i').exec(shapeXml);
    return match ? num(match[1], fallback) : fallback;
  }

  function detectUnsupportedElements(pageText) {
    const warnings = [];
    if (/<Shape\b[^>]*Type="Group"/i.test(pageText)) warnings.push('Group shapes are not supported and will be flattened.');
    if (/<Shape\b[^>]*\bOLE\b/i.test(pageText) || /<ForeignData/i.test(pageText)) warnings.push('Embedded OLE objects are not supported.');
    if (/<Shape\b[^>]*Type="Foreign"/i.test(pageText)) warnings.push('Foreign shapes are not supported.');
    if (/<Section N="Annotation"/i.test(pageText)) warnings.push('Annotations/comments in VSDX are not imported.');
    if (/<Section N="Reviewer"/i.test(pageText)) warnings.push('Reviewer markup is not imported.');
    if (/<Act\b/i.test(pageText)) warnings.push('Shape actions are not imported.');
    if (/<Scratch\b/i.test(pageText)) warnings.push('Scratch rows are not imported.');
    return warnings;
  }

  function parseConnectElements(entries, pagesXml) {
    const pageConnections = {};
    const pageRe = /<Page\b([^>]*)>/gi;
    let pageMatch;
    while ((pageMatch = pageRe.exec(pagesXml))) {
      const pageId = attr(pageMatch[1], 'ID');
      const pageIndex = Number(pageId) || Object.keys(pageConnections).length + 1;
      const pageText = entries[`visio/pages/page${pageIndex}.xml`] || '';
      const connects = [];
      const connectRe = /<Connect\b([^>]*?)\/?>/gi;
      let connectMatch;
      while ((connectMatch = connectRe.exec(pageText))) {
        const attrs = connectMatch[1];
        const fromSheet = attr(attrs, 'FromSheet');
        const toSheet = attr(attrs, 'ToSheet');
        const fromCell = attr(attrs, 'FromCell') || '';
        const toCell = attr(attrs, 'ToCell') || '';
        if (fromSheet && toSheet) connects.push({ fromSheet, toSheet, fromCell, toCell });
      }
      pageConnections[pageIndex] = connects;
    }
    return pageConnections;
  }

  function parseEntries(entries, fileName = '') {
    const parser = typeof global.DiagramWeaveVsdxParser !== 'undefined' ? global.DiagramWeaveVsdxParser : null;
    const packager = typeof global.DiagramWeaveVsdxPackager !== 'undefined' ? global.DiagramWeaveVsdxPackager : null;
    const validatePackage = packager?.validatePackage || (() => ({ valid: false, missing: [], pageCount: 0 }));

    const validation = validatePackage(entries);
    if (!validation.valid) return Result.createError([{ code: 'invalid_vsdx_package', message: `Missing OPC parts: ${validation.missing.join(', ')}` }]);

    const pagesXml = entries['visio/pages/pages.xml'];
    const pages = [];
    const allConnects = (parser?.parseConnectElements || parseConnectElements)(entries, pagesXml);
    const pageRe = /<Page\b([^>]*)>/gi;
    let pageMatch;

    while ((pageMatch = pageRe.exec(pagesXml))) {
      const pageId = attr(pageMatch[1], 'ID');
      const pageIndex = Number(pageId) || pages.length + 1;
      const pageText = entries[`visio/pages/page${pageIndex}.xml`] || '';
      const nodes = [];
      const connections = [];
      const connectorShapes = new Set();
      const unsupportedWarnings = (parser?.detectUnsupportedElements || detectUnsupportedElements)(pageText);
      const shapeRe = /<Shape\b([\s\S]*?)<\/Shape>/gi;
      let shapeMatch;

      while ((shapeMatch = shapeRe.exec(pageText))) {
        const xml = shapeMatch[0];
        const id = attr(shapeMatch[1], 'ID');
        const type = attr(shapeMatch[1], 'Type') || 'Shape';
        if (type === 'Group' || type === 'Foreign') continue;

        const numId = Number(id);
        const masterId = attr(shapeMatch[1], 'Master');
        const isConnector = masterId === '2' ||
          /Dynamic Connector/i.test(xml) ||
          (/<Cell\b[^>]*N="BeginX"[^>]*F="/i.test(xml) && /<Cell\b[^>]*N="EndX"[^>]*F="/i.test(xml)) ||
          /<Connect\b[^>]*FromSheet="${numId}"/i.test(pageText);

        if (isConnector) {
          connectorShapes.add(String(numId));
          continue;
        }

        const width = cell(xml, 'Width', 1) * 96;
        const height = cell(xml, 'Height', 0.67) * 96;
        nodes.push({
          id: `visio_${id}`,
          label: textOf(xml),
          x: Math.max(0, (cell(xml, 'PinX', 1) - width / 192) * 96),
          y: Math.max(0, (11 - cell(xml, 'PinY', 1) - height / 192) * 96),
          w: width,
          h: height,
          shape: /LaneType/.test(xml) ? 'swimlane' : 'rectangle',
          textColor: 'auto'
        });
      }

      const pageConnects = allConnects[pageIndex] || [];
      const edgeMap = new Map();
      for (const connect of pageConnects) {
        if (!connectorShapes.has(connect.fromSheet)) continue;
        const key = connect.fromSheet;
        if (!edgeMap.has(key)) edgeMap.set(key, { connectorId: key, endpoints: [] });
        edgeMap.get(key).endpoints.push({ toSheet: connect.toSheet, fromCell: connect.fromCell });
      }

      for (const [connectorId, edge] of edgeMap) {
        const sorted = edge.endpoints.sort((a, b) => a.fromCell.localeCompare(b.fromCell));
        if (sorted.length >= 2) {
          const beginTarget = sorted.find((ep) => /Begin/i.test(ep.fromCell)) || sorted[0];
          const endTarget = sorted.find((ep) => /End/i.test(ep.fromCell)) || sorted[1];
          const connectorXml = entries[`visio/pages/page${pageIndex}.xml`] || '';
          const connectorShapeRe = new RegExp(`<Shape\\b[^>]*ID="${connectorId}"[^>]*>[\\s\\S]*?<\\/Shape>`, 'i');
          const connectorShapeMatch = connectorShapeRe.exec(connectorXml);
          const edgeLabel = connectorShapeMatch ? textOf(connectorShapeMatch[0]) : '';
          connections.push({ id: `visio_edge_${connectorId}`, from: `visio_${beginTarget.toSheet}`, to: `visio_${endTarget.toSheet}`, label: edgeLabel });
        }
      }

      if (connections.length === 0) {
        shapeRe.lastIndex = 0;
        while ((shapeMatch = shapeRe.exec(pageText))) {
          const xml = shapeMatch[0];
          const id = Number(attr(shapeMatch[1], 'ID'));
          const master = attr(shapeMatch[1], 'Master');
          if (master !== '2' && !/Dynamic Connector/i.test(xml)) continue;
          const begin = /BeginX[^>]*F="Sheet\.(\d+)!/i.exec(xml);
          const end = /EndX[^>]*F="Sheet\.(\d+)!/i.exec(xml);
          if (begin && end) connections.push({ id: `visio_edge_${id}`, from: `visio_${begin[1]}`, to: `visio_${end[1]}`, label: textOf(xml) });
        }
      }

      pages.push({
        id: `page_${pageIndex}`,
        name: attr(pageMatch[1], 'Name') || `Page ${pageIndex}`,
        nodes,
        connections,
        layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }],
        nextLayerId: 1,
        _unsupportedWarnings: unsupportedWarnings
      });
    }

    const allWarnings = [];
    for (const page of pages) {
      for (const warning of page._unsupportedWarnings || []) {
        if (!allWarnings.includes(warning)) allWarnings.push(warning);
      }
      delete page._unsupportedWarnings;
    }

    if (!allWarnings.length) allWarnings.push('Controlled subset: some Visio elements may not be fully editable on re-import.');

    const result = Result.createSuccess({
      version: 2,
      schemaVersion: 3,
      projectName: fileName.replace(/\.vsdx$/i, ''),
      currentPageId: pages[0]?.id || null,
      pages,
      sourceFormat: 'vsdx'
    });
    result.warnings = allWarnings;
    return result;
  }

  global.DiagramWeaveVsdxParser = { parseEntries, parseConnectElements, detectUnsupportedElements, textOf, cell, num, attr, esc };
})(typeof window !== 'undefined' ? window : globalThis);