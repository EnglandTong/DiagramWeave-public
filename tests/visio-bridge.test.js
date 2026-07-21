import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { zipSync, strToU8 } from 'fflate';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function bridge() {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.runInNewContext(readFileSync(join(root, 'vsdx-geometry.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'vsdx-connectors.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'vsdx-parser.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'vsdx-packager.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'diagramweave-visio-bridge.js'), 'utf8'), sandbox);
  return sandbox.DiagramWeaveVisioBridge;
}

const document = {
  pages: [{ name: 'Flowchart', nodes: [{ id: 'a', label: 'Start', x: 96, y: 96, w: 120, h: 64 }, { id: 'b', label: 'Finish', x: 320, y: 220, w: 120, h: 64 }], connections: [{ from: 'a', to: 'b', label: 'next' }] }],
};

describe('controlled VSDX bridge', () => {
  it('writes an OPC-shaped package and validates required parts', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    const result = api.validatePackage(entries);
    expect(result.valid).toBe(true);
    expect(result.pageCount).toBe(1);
    expect(result.hasCoreProps).toBe(true);
    expect(result.contentTypesOk).toBe(true);
    expect(entries['visio/pages/page1.xml']).toContain('Start');
    expect(entries['visio/pages/page1.xml']).toContain('BeginX');
  });

  it('includes Geometry sections with MoveTo/LineTo rectangle paths', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    const page1 = entries['visio/pages/page1.xml'];
    expect(page1).toContain('Section N="Geometry"');
    expect(page1).toContain('T="MoveTo"');
    expect(page1).toContain('T="LineTo"');
  });

  it('includes Connection sections for connector attachment', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    const page1 = entries['visio/pages/page1.xml'];
    expect(page1).toContain('Section N="Connection"');
    expect(page1).toContain('N="DirX"');
    expect(page1).toContain('N="DirY"');
  });

  it('uses Connect elements for connector-to-shape references', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    const page1 = entries['visio/pages/page1.xml'];
    expect(page1).toContain('<Connects>');
    expect(page1).toContain('FromSheet="1000"');
    expect(page1).toContain('ToSheet="1"');
    expect(page1).toContain('ToSheet="2"');
  });

  it('includes master shapes with actual geometry', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    expect(entries['visio/masters/master1.xml']).toContain('Section N="Geometry"');
    expect(entries['visio/masters/master1.xml']).toContain('T="MoveTo"');
    expect(entries['visio/masters/master2.xml']).toContain('Section N="Geometry"');
  });

  it('registers docProps/core.xml in Content_Types', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    expect(entries['[Content_Types].xml']).toContain('docProps/core.xml');
    expect(entries['[Content_Types].xml']).toContain('core-properties');
    expect(entries['_rels/.rels']).toContain('core-properties');
  });

  it('includes StyleSheets in document.xml', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    expect(entries['visio/document.xml']).toContain('StyleSheets');
    expect(entries['visio/document.xml']).toContain('StyleSheet');
  });

  it('round-trips controlled nodes and reports the controlled-subset warning', () => {
    const api = bridge();
    const parsed = api.parseEntries(api.packageEntries(document), 'sample.vsdx');
    expect(parsed.success).toBe(true);
    expect(parsed.data.pages[0].nodes.map((node) => node.label)).toEqual(['Start', 'Finish']);
    expect(parsed.data.pages[0].connections.length).toBeGreaterThanOrEqual(1);
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it('imports connectors via Connect elements', () => {
    const api = bridge();
    const entries = api.packageEntries(document);
    const parsed = api.parseEntries(entries, 'sample.vsdx');
    expect(parsed.success).toBe(true);
    const connections = parsed.data.pages[0].connections;
    expect(connections.length).toBe(1);
    expect(connections[0].from).toBe('visio_1');
    expect(connections[0].to).toBe('visio_2');
    expect(connections[0].label).toBe('next');
  });

  it('reports unsupported elements as warnings', () => {
    const api = bridge();
    const fakePage = `<?xml version="1.0"?><PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main"><Shapes><Shape ID="1" Type="Group"><Cell N="PinX" V="1"/><Cell N="PinY" V="1"/></Shape><Shape ID="2" Type="Shape"><ForeignData><Rel/></ForeignData></Shape></Shapes></PageContents>`;
    const entries = {
      '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
      '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/office/visio/2012/relationships/document" Target="visio/document.xml"/></Relationships>',
      'visio/document.xml': '<VisioDocument xmlns="http://schemas.microsoft.com/office/visio/2012/main"/>',
      'visio/pages/pages.xml': '<Pages xmlns="http://schemas.microsoft.com/office/visio/2012/main"><Page ID="1" Name="Test"/></Pages>',
      'visio/pages/_rels/pages.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page1.xml"/></Relationships>',
      'visio/pages/page1.xml': fakePage,
      'docProps/core.xml': '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"/>',
    };
    const parsed = api.parseEntries(entries, 'test.vsdx');
    expect(parsed.success).toBe(true);
    expect(parsed.warnings.some((w) => /Group/.test(w))).toBe(true);
    expect(parsed.warnings.some((w) => /OLE|Foreign/.test(w))).toBe(true);
  });

  it('rejects a ZIP with missing OPC parts', () => {
    const api = bridge();
    const zip = zipSync({ 'not-visio.txt': strToU8('x') });
    expect(api.validatePackage({ 'not-visio.txt': 'x' }).valid).toBe(false);
    expect(zip.length).toBeGreaterThan(0);
  });

  it('rejects unsafe paths and expanded archive limits before mapping', () => {
    const api = bridge();
    expect(api.validateArchiveSafety(new Uint8Array(1), { '../escape.xml': new Uint8Array(1) }).code).toBe('archive_unsafe_path');
    expect(api.validateArchiveSafety(new Uint8Array(1), { 'visio/page.xml': new Uint8Array(api.ZIP_LIMITS.maxExpandedBytes + 1) }).code).toBe('archive_expanded_too_large');
    expect(api.validateArchiveSafety(new Uint8Array(api.ZIP_LIMITS.maxInputBytes + 1), {}).code).toBe('archive_too_large');
  });

  it('detects connectors by Master attribute instead of ID threshold', () => {
    const api = bridge();
    const pageXml = `<?xml version="1.0"?><PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main"><Shapes><Shape ID="1" Type="Shape" Master="1"><Cell N="PinX" V="2"/><Cell N="PinY" V="5"/><Cell N="Width" V="1"/><Cell N="Height" V="0.67"/><Cell N="LocPinX" F="Width*0.5"/><Cell N="LocPinY" F="Height*0.5"/><Text>NodeA</Text></Shape><Shape ID="2" Type="Shape" Master="1"><Cell N="PinX" V="4"/><Cell N="PinY" V="5"/><Cell N="Width" V="1"/><Cell N="Height" V="0.67"/><Cell N="LocPinX" F="Width*0.5"/><Cell N="LocPinY" F="Height*0.5"/><Text>NodeB</Text></Shape><Shape ID="3" Type="Shape" Master="2"><Cell N="BeginX" F="Sheet.1!Connections.X0"/><Cell N="BeginY" F="Sheet.1!Connections.Y0"/><Cell N="EndX" F="Sheet.2!Connections.X2"/><Cell N="EndY" F="Sheet.2!Connections.Y2"/><Section N="Geometry" IX="0"><Row T="MoveTo" IX="1"><Cell N="X" F="BeginX"/><Cell N="Y" F="BeginY"/></Row><Row T="LineTo" IX="2"><Cell N="X" F="EndX"/><Cell N="Y" F="EndY"/></Row></Section><Text>link</Text></Shape></Shapes><Connects><Connect FromSheet="3" FromCell="BeginX" ToSheet="1" ToCell="Connections.X0"/><Connect FromSheet="3" FromCell="EndX" ToSheet="2" ToCell="Connections.X2"/></Connects></PageContents>`;
    const entries = {
      '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
      '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/office/visio/2012/relationships/document" Target="visio/document.xml"/></Relationships>',
      'visio/document.xml': '<VisioDocument xmlns="http://schemas.microsoft.com/office/visio/2012/main"/>',
      'visio/pages/pages.xml': '<Pages xmlns="http://schemas.microsoft.com/office/visio/2012/main"><Page ID="1" Name="Test"/></Pages>',
      'visio/pages/_rels/pages.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page1.xml"/></Relationships>',
      'visio/pages/page1.xml': pageXml,
      'docProps/core.xml': '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"/>',
    };
    const parsed = api.parseEntries(entries, 'low-id-connector.vsdx');
    expect(parsed.success).toBe(true);
    expect(parsed.data.pages[0].nodes.length).toBe(2);
    expect(parsed.data.pages[0].connections.length).toBe(1);
    expect(parsed.data.pages[0].connections[0].label).toBe('link');
  });

  it.each([
    ['basic-flowchart', document],
    ['swimlane', { pages: [{ name: 'Swimlane', nodes: [{ id: 'lane', label: 'Owner lane', shape: 'swimlane', x: 40, y: 40, w: 420, h: 140 }], connections: [] }] }],
    ['connector-heavy', { pages: [{ name: 'Dense', nodes: Array.from({ length: 6 }, (_, index) => ({ id: `n${index}`, label: `N${index}`, x: index * 150, y: index * 60, w: 100, h: 50 })), connections: Array.from({ length: 5 }, (_, index) => ({ from: `n${index}`, to: `n${index + 1}` })) }] }],
  ])('produces independently inspectable fixture: %s', (_name, sample) => {
    const api = bridge();
    const entries = api.packageEntries(sample);
    const required = ['[Content_Types].xml', '_rels/.rels', 'visio/document.xml', 'visio/pages/pages.xml'];
    expect(required.every((name) => typeof entries[name] === 'string')).toBe(true);
    expect(entries['visio/pages/_rels/pages.xml.rels']).toMatch(/<Relationship\b/);
    expect(Object.keys(entries).filter((name) => /visio\/pages\/page\d+\.xml$/.test(name)).length).toBe(sample.pages.length);
    const page1 = entries['visio/pages/page1.xml'];
    expect(page1).toContain('Section N="Geometry"');
    expect(page1).toContain('Section N="Connection"');
  });
});
