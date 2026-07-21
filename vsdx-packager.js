(function (global) {
  'use strict';

  const NS = 'http://schemas.microsoft.com/office/visio/2012/main';
  const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
  const ZIP_LIMITS = { maxInputBytes: 32 * 1024 * 1024, maxEntries: 512, maxExpandedBytes: 128 * 1024 * 1024 };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function validatePackage(entries) {
    const required = ['[Content_Types].xml', '_rels/.rels', 'visio/document.xml', 'visio/pages/pages.xml'];
    const missing = required.filter((name) => !entries[name]);
    const pageNames = Object.keys(entries).filter((name) => /^visio\/pages\/page\d+\.xml$/.test(name));
    const hasCoreProps = Boolean(entries['docProps/core.xml']);
    const contentTypesOk = entries['[Content_Types].xml']?.includes('docProps/core.xml');
    return { valid: missing.length === 0 && pageNames.length > 0, missing, pageCount: pageNames.length, hasRelationships: Boolean(entries['visio/pages/_rels/pages.xml.rels']), hasCoreProps, contentTypesOk };
  }

  function validateArchiveSafety(buffer, files) {
    const bytes = buffer && Number.isFinite(buffer.byteLength) ? buffer.byteLength : 0;
    if (bytes > ZIP_LIMITS.maxInputBytes) return { code: 'archive_too_large', message: 'VSDX archive exceeds the 32 MiB input limit' };
    const names = Object.keys(files || {});
    if (names.length > ZIP_LIMITS.maxEntries) return { code: 'archive_too_many_entries', message: 'VSDX archive exceeds the 512 entry limit' };
    let expanded = 0;
    for (const name of names) {
      if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) return { code: 'archive_unsafe_path', message: `Unsafe archive path: ${name}` };
      expanded += files[name]?.byteLength || 0;
      if (expanded > ZIP_LIMITS.maxExpandedBytes) return { code: 'archive_expanded_too_large', message: 'VSDX archive exceeds the 128 MiB expanded limit' };
    }
    return null;
  }

  function shapeXml(node, id, pageHeight) {
    const geometry = typeof global.DiagramWeaveVsdxGeometry !== 'undefined' ? global.DiagramWeaveVsdxGeometry : null;
    const geometryRect = geometry?.geometryRect || ((pinX, pinY, w, h) => {
      const left = pinX - w / 2;
      const bottom = pinY - h / 2;
      const right = pinX + w / 2;
      const top = pinY + h / 2;
      return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" V="${left}"/><Cell N="Y" V="${bottom}"/></Row><Row T="LineTo" IX="2"><Cell N="X" V="${right}"/><Cell N="Y" V="${bottom}"/></Row><Row T="LineTo" IX="3"><Cell N="X" V="${right}"/><Cell N="Y" V="${top}"/></Row><Row T="LineTo" IX="4"><Cell N="X" V="${left}"/><Cell N="Y" V="${top}"/></Row><Row T="LineTo" IX="5"><Cell N="X" V="${left}"/><Cell N="Y" V="${bottom}"/></Row></Section>`;
    });
    const connectionPoints = geometry?.connectionPoints || ((pinX, pinY, w, h) => {
      const left = pinX - w / 2;
      const bottom = pinY - h / 2;
      const right = pinX + w / 2;
      const top = pinY + h / 2;
      const midX = pinX;
      const midY = pinY;
      return `<Section N="Connection" IX="0"><Cell N="X" V="${left}"/><Cell N="Y" V="${midY}"/><Cell N="DirX" V="-1"/><Cell N="DirY" V="0"/></Section><Section N="Connection" IX="1"><Cell N="X" V="${midX}"/><Cell N="Y" V="${top}"/><Cell N="DirX" V="0"/><Cell N="DirY" V="1"/></Section><Section N="Connection" IX="2"><Cell N="X" V="${right}"/><Cell N="Y" V="${midY}"/><Cell N="DirX" V="1"/><Cell N="DirY" V="0"/></Section><Section N="Connection" IX="3"><Cell N="X" V="${midX}"/><Cell N="Y" V="${bottom}"/><Cell N="DirX" V="0"/><Cell N="DirY" V="-1"/></Section>`;
    });

    const x = num(node.x, 0) / 96 + num(node.w, 120) / 192;
    const y = pageHeight - (num(node.y, 0) / 96 + num(node.h, 64) / 192);
    const w = num(node.w, 120) / 96;
    const h = num(node.h, 64) / 96;
    const lane = node.shape === 'swimlane' ? '<Section N="User-defined"><Row N="LaneType"><Cell N="Value" V="lane"/></Row></Section>' : '';
    const geom = geometryRect(x, y, w, h);
    const connPts = connectionPoints(x, y, w, h);
    return `<Shape ID="${id}" Type="Shape" Master="1"><Cell N="PinX" V="${x}"/><Cell N="PinY" V="${y}"/><Cell N="Width" V="${w}"/><Cell N="Height" V="${h}"/><Cell N="LocPinX" F="Width*0.5"/><Cell N="LocPinY" F="Height*0.5"/><Cell N="FillForegnd" V="0xffffff"/><Cell N="LineWeight" V="0.01"/><Cell N="Rounding" V="0"/><Cell N="LinePattern" V="1"/><Cell N="FillPattern" V="1"/>${lane}${geom}${connPts}<Text>${esc(node.label || '')}</Text></Shape>`;
  }

  function connectorXml(edge, connectorId, page) {
    const connectors = typeof global.DiagramWeaveVsdxConnectors !== 'undefined' ? global.DiagramWeaveVsdxConnectors : null;
    const connectorXmlFn = connectors?.connectorXml || ((edge, connectorId, page) => {
      const from = (page.nodes || []).find((node) => String(node.id) === String(edge.from));
      const to = (page.nodes || []).find((node) => String(node.id) === String(edge.to));
      if (!from || !to) return { xml: '', connects: '' };
      const fromId = (page.nodes || []).indexOf(from) + 1;
      const toId = (page.nodes || []).indexOf(to) + 1;
      const xml = `<Shape ID="${connectorId}" Type="Shape" Master="2"><Cell N="BeginX" F="Sheet.${fromId}!Connections.X0"/><Cell N="BeginY" F="Sheet.${fromId}!Connections.Y0"/><Cell N="EndX" F="Sheet.${toId}!Connections.X2"/><Cell N="EndY" F="Sheet.${toId}!Connections.Y2"/><Cell N="LineColor" V="0x44546a"/><Cell N="LineWeight" V="0.01"/><Cell N="LinePattern" V="1"/><Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" F="BeginX"/><Cell N="Y" F="BeginY"/></Row><Row T="LineTo" IX="2"><Cell N="X" F="EndX"/><Cell N="Y" F="EndY"/></Row></Section><Text>${esc(edge.label || '')}</Text></Shape>`;
      const connects = `<Connect FromSheet="${connectorId}" FromCell="BeginX" ToSheet="${fromId}" ToCell="Connections.X0"/><Connect FromSheet="${connectorId}" FromCell="EndX" ToSheet="${toId}" ToCell="Connections.X2"/>`;
      return { xml, connects };
    });
    return connectorXmlFn(edge, connectorId, page);
  }

  function pageXml(page) {
    const height = 11;
    const shapes = (page.nodes || []).map((node, index) => shapeXml(node, index + 1, height)).join('');
    let connectors = '';
    let connectElements = '';
    (page.connections || []).forEach((edge, index) => {
      const result = connectorXml(edge, 1000 + index, page);
      connectors += result.xml;
      connectElements += result.connects;
    });
    return `<?xml version="1.0" encoding="UTF-8"?><PageContents xmlns="${NS}"><Shapes>${shapes}${connectors}</Shapes>${connectElements ? `<Connects>${connectElements}</Connects>` : ''}</PageContents>`;
  }

  function packageEntries(document) {
    const geometry = typeof global.DiagramWeaveVsdxGeometry !== 'undefined' ? global.DiagramWeaveVsdxGeometry : null;
    const masterGeometryRect = geometry?.masterGeometryRect || ((w, h) => {
      const left = w / 2 - w / 2;
      const bottom = h / 2 - h / 2;
      const right = w / 2 + w / 2;
      const top = h / 2 + h / 2;
      return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" V="${left}"/><Cell N="Y" V="${bottom}"/></Row><Row T="LineTo" IX="2"><Cell N="X" V="${right}"/><Cell N="Y" V="${bottom}"/></Row><Row T="LineTo" IX="3"><Cell N="X" V="${right}"/><Cell N="Y" V="${top}"/></Row><Row T="LineTo" IX="4"><Cell N="X" V="${left}"/><Cell N="Y" V="${top}"/></Row><Row T="LineTo" IX="5"><Cell N="X" V="${left}"/><Cell N="Y" V="${bottom}"/></Row></Section>`;
    });
    const masterLineGeometry = geometry?.masterLineGeometry || ((w, h) => {
      return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" V="0"/><Cell N="Y" V="${h / 2}"/></Row><Row T="LineTo" IX="2"><Cell N="X" V="${w}"/><Cell N="Y" V="${h / 2}"/></Row></Section>`;
    });

    const pages = document.pages || [];
    const pageRels = pages.map((page, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page${index + 1}.xml"/>`).join('');
    const overrides = pages.map((page, index) => `<Override PartName="/visio/pages/page${index + 1}.xml" ContentType="application/vnd.ms-visio.page+xml"/>`).join('');
    const entries = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="${CT_NS}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/visio/document.xml" ContentType="application/vnd.ms-visio.document.main+xml"/><Override PartName="/visio/pages/pages.xml" ContentType="application/vnd.ms-visio.pages+xml"/><Override PartName="/visio/masters/masters.xml" ContentType="application/vnd.ms-visio.masters+xml"/><Override PartName="/visio/masters/master1.xml" ContentType="application/vnd.ms-visio.master+xml"/><Override PartName="/visio/masters/master2.xml" ContentType="application/vnd.ms-visio.master+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${overrides}</Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="http://schemas.microsoft.com/office/visio/2012/relationships/document" Target="visio/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
      'visio/document.xml': `<?xml version="1.0" encoding="UTF-8"?><VisioDocument xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><DocumentProperties><Creator>DiagramWeave</Creator></DocumentProperties><StyleSheets><StyleSheet ID="0" Name="Normal"><Cell N="CharFont" V="0"/><Cell N="CharSize" V="0.1667in"/><Cell N="LineWeight" V="0.01"/><Cell N="LineColor" V="0"/><Cell N="FillForegnd" V="0xffffff"/><Cell N="FillPattern" V="1"/><Cell N="LinePattern" V="1"/></StyleSheet></StyleSheets></VisioDocument>`,
      'visio/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}"><Relationship Id="rIdPages" Type="http://schemas.microsoft.com/visio/2010/relationships/pages" Target="pages/pages.xml"/><Relationship Id="rIdMasters" Type="http://schemas.microsoft.com/visio/2010/relationships/masters" Target="masters/masters.xml"/></Relationships>`,
      'visio/pages/pages.xml': `<?xml version="1.0" encoding="UTF-8"?><Pages xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${pages.map((page, index) => `<Page ID="${index + 1}" Name="${esc(page.name || `Page ${index + 1}`)}"><Rel r:id="rId${index + 1}"/><PageSheet><Cell N="PageWidth" V="11"/><Cell N="PageHeight" V="11"/></PageSheet></Page>`).join('')}</Pages>`,
      'visio/pages/_rels/pages.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}">${pageRels}</Relationships>`,
      'docProps/core.xml': '<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>DiagramWeave</dc:title><dc:creator>DiagramWeave</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2026-07-20</dcterms:created></cp:coreProperties>',
    };
    entries['visio/masters/masters.xml'] = `<?xml version="1.0" encoding="UTF-8"?><Masters xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><Master ID="1" Name="Rectangle" UniqueID="{B96C27D0-E7E1-43CE-B87A-4A5B3D9D5C10}"><Rel r:id="rId1"/></Master><Master ID="2" Name="Dynamic Connector" UniqueID="{B2B3D97A-2C53-43F6-9C71-B4E8E3D94B7F}"><Rel r:id="rId2"/></Master></Masters>`;
    entries['visio/masters/_rels/masters.xml.rels'] = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/master" Target="master1.xml"/><Relationship Id="rId2" Type="http://schemas.microsoft.com/visio/2010/relationships/master" Target="master2.xml"/></Relationships>`;
    entries['visio/masters/master1.xml'] = `<?xml version="1.0" encoding="UTF-8"?><MasterContents xmlns="${NS}"><Shapes><Shape ID="1" Type="Shape"><Cell N="Width" V="1"/><Cell N="Height" V="0.67"/><Cell N="LocPinX" F="Width*0.5"/><Cell N="LocPinY" F="Height*0.5"/><Cell N="FillForegnd" V="0xffffff"/><Cell N="LineWeight" V="0.01"/><Cell N="LinePattern" V="1"/><Cell N="FillPattern" V="1"/>${masterGeometryRect(1, 0.67)}<Text>Rectangle</Text></Shape></Shapes></MasterContents>`;
    entries['visio/masters/master2.xml'] = `<?xml version="1.0" encoding="UTF-8"?><MasterContents xmlns="${NS}"><Shapes><Shape ID="1" Type="Shape"><Cell N="Width" V="1"/><Cell N="Height" V="0.5"/><Cell N="LocPinX" F="Width*0.5"/><Cell N="LocPinY" F="Height*0.5"/><Cell N="LineColor" V="0x44546a"/><Cell N="LineWeight" V="0.01"/><Cell N="LinePattern" V="1"/>${masterLineGeometry(1, 0.5)}<Text>Connector</Text></Shape></Shapes></MasterContents>`;
    pages.forEach((page, index) => { entries[`visio/pages/page${index + 1}.xml`] = pageXml(page, index + 1); });
    return entries;
  }

  global.DiagramWeaveVsdxPackager = { packageEntries, validatePackage, validateArchiveSafety, pageXml, shapeXml, connectorXml, ZIP_LIMITS };
})(typeof window !== 'undefined' ? window : globalThis);