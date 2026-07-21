(function (global) {
  'use strict';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));

  const attr = (xml, name) => {
    const match = new RegExp(`\\b${name}="([^"]*)"`).exec(xml || '');
    return match ? match[1] : '';
  };

  function connectorXml(edge, connectorId, page) {
    const from = (page.nodes || []).find((node) => String(node.id) === String(edge.from));
    const to = (page.nodes || []).find((node) => String(node.id) === String(edge.to));
    if (!from || !to) return { xml: '', connects: '' };
    const fromId = (page.nodes || []).indexOf(from) + 1;
    const toId = (page.nodes || []).indexOf(to) + 1;
    const xml = `<Shape ID="${connectorId}" Type="Shape" Master="2"><Cell N="BeginX" F="Sheet.${fromId}!Connections.X0"/><Cell N="BeginY" F="Sheet.${fromId}!Connections.Y0"/><Cell N="EndX" F="Sheet.${toId}!Connections.X2"/><Cell N="EndY" F="Sheet.${toId}!Connections.Y2"/><Cell N="LineColor" V="0x44546a"/><Cell N="LineWeight" V="0.01"/><Cell N="LinePattern" V="1"/><Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" F="BeginX"/><Cell N="Y" F="BeginY"/></Row><Row T="LineTo" IX="2"><Cell N="X" F="EndX"/><Cell N="Y" F="EndY"/></Row></Section><Text>${esc(edge.label || '')}</Text></Shape>`;
    const connects = `<Connect FromSheet="${connectorId}" FromCell="BeginX" ToSheet="${fromId}" ToCell="Connections.X0"/><Connect FromSheet="${connectorId}" FromCell="EndX" ToSheet="${toId}" ToCell="Connections.X2"/>`;
    return { xml, connects };
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

  global.DiagramWeaveVsdxConnectors = { connectorXml, parseConnectElements };
})(typeof window !== 'undefined' ? window : globalThis);