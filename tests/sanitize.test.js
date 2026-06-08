import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadSanitize() {
  const code = readFileSync(join(root, 'flowchart-sanitize.js'), 'utf8');
  const sandbox = { DiagramWeaveSanitize: null };
  vm.runInNewContext(code, sandbox);
  return sandbox.DiagramWeaveSanitize;
}

describe('DiagramWeaveSanitize', () => {
  /** @type {ReturnType<typeof loadSanitize>} */
  let S;

  beforeAll(() => {
    S = loadSanitize();
  });

  it('rejects null and non-object input', () => {
    expect(S.sanitizeFlowDocument(null)).toBeNull();
    expect(S.sanitizeFlowDocument(undefined)).toBeNull();
    expect(S.sanitizeFlowDocument('bad')).toBeNull();
  });

  it('sanitizes v1 document: invalid color and unknown shape', () => {
    const result = S.sanitizeFlowDocument({
      nodes: [{
        id: 'n1',
        shape: '<script>',
        label: '测试',
        fillColor: 'red;alert(1)',
        strokeColor: '#FF0000',
        x: 0,
        y: 0,
        w: 100,
        h: 60,
      }],
      connections: [],
      nextId: 2,
    });
    expect(result).not.toBeNull();
    expect(result.version).toBe(1);
    expect(result.nodes[0].shape).toBe('rectangle');
    expect(result.nodes[0].fillColor).toBe('#1e2029');
    expect(result.nodes[0].strokeColor).toBe('#ff0000');
  });

  it('drops connections referencing missing nodes', () => {
    const result = S.sanitizeFlowDocument({
      nodes: [{ id: 'a', shape: 'rectangle', label: 'A', x: 0, y: 0, w: 100, h: 60 }],
      connections: [{ id: 'c1', from: 'a', to: 'missing', fromPort: 'bottom', toPort: 'top' }],
    });
    expect(result.connections).toHaveLength(0);
  });

  it('sanitizes v2 multi-page document', () => {
    const result = S.sanitizeFlowDocument({
      version: 2,
      pages: [{
        id: 'p1',
        name: '页<script>1',
        nodes: [{ id: 'n1', shape: 'diamond', label: '判断', x: 10, y: 10, w: 80, h: 60 }],
        connections: [],
        layers: [{ id: 0, name: '图层<script>', visible: true, locked: false }],
      }],
      currentPageId: 'p1',
      nextPageId: 2,
      nextId: 5,
      connRouteMode: 'orthogonal',
    });
    expect(result.version).toBe(2);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].name).not.toContain('<');
    expect(result.pages[0].layers[0].name).not.toContain('<');
    expect(result.connRouteMode).toBe('orthogonal');
  });

  it('rejects invalid connRouteMode', () => {
    const result = S.sanitizeFlowDocument({
      nodes: [{ id: 'n1', shape: 'rectangle', label: 'A', x: 0, y: 0, w: 100, h: 60 }],
      connections: [],
      connRouteMode: 'invalid',
    });
    expect(result.connRouteMode).toBeUndefined();
  });

  it('accepts visio connRouteMode', () => {
    const result = S.sanitizeFlowDocument({
      nodes: [{ id: 'n1', shape: 'rectangle', label: 'A', x: 0, y: 0, w: 100, h: 60 }],
      connections: [],
      connRouteMode: 'visio',
    });
    expect(result.connRouteMode).toBe('visio');
  });

  it('sanitizeHexColor accepts 3 and 6 digit hex', () => {
    expect(S.sanitizeHexColor('#abc')).toBe('#aabbcc');
    expect(S.sanitizeHexColor('#AABBCC')).toBe('#aabbcc');
    expect(S.sanitizeHexColor('not-a-color', '#123456')).toBe('#123456');
  });
});
