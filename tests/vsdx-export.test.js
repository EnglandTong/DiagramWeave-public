import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadModule(filename, sandbox) {
  vm.runInNewContext(readFileSync(join(root, filename), 'utf8'), sandbox);
}

let packager;
let bridge;

beforeAll(() => {
  const sandbox = { globalThis: null };
  sandbox.globalThis = sandbox;
  // 依賴鏈：result → geometry → connectors → packager
  sandbox.DiagramWeaveResult = {
    createError: issues => ({ success: false, data: null, issues, warnings: [] }),
    createSuccess: data => ({ success: true, data, issues: [], warnings: [] }),
  };
  loadModule('vsdx-geometry.js', sandbox);
  loadModule('vsdx-connectors.js', sandbox);
  loadModule('vsdx-packager.js', sandbox);
  loadModule('diagramweave-visio-bridge.js', sandbox);
  packager = sandbox.DiagramWeaveVsdxPackager;
  bridge = sandbox.DiagramWeaveVisioBridge;
});

describe('VSDX 導出 - packageEntries', () => {
  const testDoc = {
    pages: [
      {
        name: 'Test Page',
        nodes: [
          { id: 'n1', x: 100, y: 100, w: 120, h: 64, label: 'Start', shape: 'rectangle' },
          { id: 'n2', x: 300, y: 100, w: 120, h: 64, label: 'End', shape: 'rectangle' },
        ],
        connections: [
          { id: 'c1', from: 'n1', to: 'n2', label: 'go' },
        ],
      },
    ],
  };

  it('packager 與 bridge 均可用', () => {
    expect(packager).toBeDefined();
    expect(bridge).toBeDefined();
    expect(typeof packager.packageEntries).toBe('function');
    expect(typeof bridge.packageEntries).toBe('function');
  });

  it('生成完整 OPC 包條目（packager）', () => {
    const entries = packager.packageEntries(testDoc);
    expect(entries).toBeDefined();
    const required = ['[Content_Types].xml', '_rels/.rels', 'visio/document.xml', 'visio/pages/pages.xml', 'visio/masters/masters.xml'];
    required.forEach(name => {
      const has = Object.prototype.hasOwnProperty.call(entries, name);
      expect(has).toBe(true, `缺少 ${name}`);
    });
  });

  it('每個頁面生成獨立 page XML', () => {
    const entries = packager.packageEntries(testDoc);
    expect(entries).toHaveProperty('visio/pages/page1.xml');
    const pageXml = entries['visio/pages/page1.xml'];
    expect(pageXml).toContain('<PageContents');
    expect(pageXml).toContain('Start');
    expect(pageXml).toContain('End');
    expect(pageXml).toContain('go');
  });

  it('validatePackage 檢測必需部件', () => {
    const entries = packager.packageEntries(testDoc);
    const result = packager.validatePackage(entries);
    expect(result.valid).toBe(true);
    expect(result.pageCount).toBe(1);
  });

  it('validatePackage 檢測缺失部件', () => {
    const result = packager.validatePackage({ '[Content_Types].xml': '' });
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('多頁面文檔生成多個 page XML', () => {
    const multiDoc = {
      pages: [
        { name: 'Page 1', nodes: [{ id: 'a', x: 0, y: 0, w: 50, h: 50, label: 'A' }], connections: [] },
        { name: 'Page 2', nodes: [{ id: 'b', x: 0, y: 0, w: 50, h: 50, label: 'B' }], connections: [] },
      ],
    };
    const entries = packager.packageEntries(multiDoc);
    expect(entries).toHaveProperty('visio/pages/page1.xml');
    expect(entries).toHaveProperty('visio/pages/page2.xml');
    expect(entries['visio/pages/pages.xml']).toContain('Page 1');
    expect(entries['visio/pages/pages.xml']).toContain('Page 2');
  });

  it('ZIP 安全閾值檢測', () => {
    expect(packager.ZIP_LIMITS.maxInputBytes).toBe(32 * 1024 * 1024);
    const oversized = new Uint8Array(packager.ZIP_LIMITS.maxInputBytes + 1);
    const result = packager.validateArchiveSafety(oversized, {});
    expect(result).not.toBeNull();
    expect(result.code).toBe('archive_too_large');
  });
});
