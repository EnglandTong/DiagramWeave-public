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
    expect(result.nodes[0].textColor).toBe('auto');
  });

  it('preserves valid node text colors and rejects unsafe values', () => {
    const result = S.sanitizeFlowDocument({
      nodes: [
        { id: 'n1', label: 'A', textColor: '#34D399' },
        { id: 'n2', label: 'B', textColor: 'red;alert(1)' },
      ],
      connections: [],
    });
    expect(result.nodes[0].textColor).toBe('#34d399');
    expect(result.nodes[1].textColor).toBe('auto');
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

  it('preserves bounded wait and SLA analysis fields', () => {
    const result = S.sanitizeFlowDocument({ version: 2, slaDays: 8, pages: [{
      id: 'p1', slaDays: 5, nodes: [{ id: 'n1', label: 'Wait', waitDays: 2.5 }], connections: [],
    }] });
    expect(result.slaDays).toBe(8);
    expect(result.pages[0].slaDays).toBe(5);
    expect(result.pages[0].nodes[0].waitDays).toBe(2.5);
  });

  it('preserves bounded node tags for viewers and search', () => {
    const result = S.sanitizeFlowDocument({ nodes: [{ id: 'n1', label: 'Tagged', tags: ['SLA', '<unsafe>'] }], connections: [] });
    expect(result.nodes[0].tags).toEqual(['SLA', 'unsafe']);
  });

  it('preserves sanitized review threads in v2 projects', () => {
    const result = S.sanitizeFlowDocument({ version: 2, pages: [{ id: 'p1', nodes: [{ id: 'n1' }], connections: [] }], reviewThreads: [{ id: 'r1', targetId: 'n1', status: 'approved', comments: [{ id: 'c1', author: '<QA>', body: '<script>note</script>' }] }] });
    expect(result.reviewThreads[0]).toMatchObject({ id: 'r1', targetId: 'n1', status: 'approved' });
    expect(result.reviewThreads[0].comments[0]).toMatchObject({ author: 'QA', body: 'scriptnote/script' });
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

  // ===== Phase 2：组合 / 容器 / 泳道集持久化白名单 =====
  it('preserves valid group/container/swimlane references on nodes', () => {
    const result = S.sanitizeFlowDocument({
      version: 2,
      pages: [{
        id: 'p1',
        nodes: [
          { id: 'c1', shape: 'rectangle', label: 'Container', isContainer: true },
          { id: 'n1', shape: 'rectangle', label: 'A', groupId: 'g1', containerId: 'c1', swimlaneSetId: 'ls1' },
          { id: 'n2', shape: 'rectangle', label: 'B', groupId: 'g1' },
        ],
        connections: [],
        groups: [{ id: 'g1', name: '分组 1' }],
        swimlaneSets: [{ id: 'ls1', name: '主泳道', lanes: ['研发', '测试'] }],
      }],
    });
    const page = result.pages[0];
    const n1 = page.nodes.find(n => n.id === 'n1');
    expect(n1.groupId).toBe('g1');
    expect(n1.containerId).toBe('c1');
    expect(n1.swimlaneSetId).toBe('ls1');
    expect(page.nodes.find(n => n.id === 'c1').isContainer).toBe(true);
    expect(page.groups).toEqual([{ id: 'g1', name: '分组 1' }]);
    expect(page.swimlaneSets).toEqual([{ id: 'ls1', name: '主泳道', lanes: ['研发', '测试'] }]);
  });

  it('drops dangling groupId/containerId/swimlaneSetId references', () => {
    const result = S.sanitizeFlowDocument({
      version: 2,
      pages: [{
        id: 'p1',
        nodes: [
          { id: 'n1', shape: 'rectangle', label: 'A', groupId: 'ghost', containerId: 'ghost', swimlaneSetId: 'ghost' },
          { id: 'n2', shape: 'rectangle', label: 'B', containerId: 'n1' },
          { id: 'n3', shape: 'rectangle', label: 'C', containerId: 'n3' },
        ],
        connections: [],
      }],
    });
    const page = result.pages[0];
    const n1 = page.nodes.find(n => n.id === 'n1');
    expect(n1.groupId).toBeUndefined();
    expect(n1.containerId).toBeUndefined();
    expect(n1.swimlaneSetId).toBeUndefined();
    // n2 指向非容器节点 → 清除；n3 自引用 → 清除
    expect(page.nodes.find(n => n.id === 'n2').containerId).toBeUndefined();
    expect(page.nodes.find(n => n.id === 'n3').containerId).toBeUndefined();
    expect(page.groups).toEqual([]);
    expect(page.swimlaneSets).toEqual([]);
  });

  it('breaks container reference cycles', () => {
    const result = S.sanitizeFlowDocument({
      version: 2,
      pages: [{
        id: 'p1',
        nodes: [
          { id: 'a', shape: 'rectangle', label: 'A', isContainer: true, containerId: 'b' },
          { id: 'b', shape: 'rectangle', label: 'B', isContainer: true, containerId: 'a' },
          { id: 'c', shape: 'rectangle', label: 'C', containerId: 'a' },
        ],
        connections: [],
      }],
    });
    const page = result.pages[0];
    const withContainer = page.nodes.filter(n => n.containerId);
    // 环上至少一处被切断，且剩余引用不构成环
    expect(page.nodes.find(n => n.id === 'a').containerId === 'b'
      && page.nodes.find(n => n.id === 'b').containerId === 'a').toBe(false);
    withContainer.forEach(n => {
      const seen = new Set([n.id]);
      let cur = page.nodes.find(x => x.id === n.containerId);
      while (cur && cur.containerId) {
        expect(seen.has(cur.id)).toBe(false);
        seen.add(cur.id);
        cur = page.nodes.find(x => x.id === cur.containerId);
      }
    });
  });

  it('dedupes page-level groups and swimlaneSets by id', () => {
    const result = S.sanitizeFlowDocument({
      version: 2,
      pages: [{
        id: 'p1',
        nodes: [{ id: 'n1', shape: 'rectangle', label: 'A' }],
        connections: [],
        groups: [{ id: 'g1', name: '一' }, { id: 'g1', name: '重复' }, '<bad>'],
        swimlaneSets: [{ id: 'ls1', name: 'S', lanes: ['a', 'b'] }, { id: 'ls1', name: 'dup' }],
      }],
    });
    const page = result.pages[0];
    expect(page.groups).toEqual([{ id: 'g1', name: '一' }]);
    expect(page.swimlaneSets).toEqual([{ id: 'ls1', name: 'S', lanes: ['a', 'b'] }]);
  });

  it('round-trips groups and swimlaneSets through v1 documents', () => {
    const result = S.sanitizeFlowDocument({
      nodes: [{ id: 'n1', shape: 'rectangle', label: 'A', groupId: 'g1' }],
      connections: [],
      groups: [{ id: 'g1', name: 'G' }],
      swimlaneSets: [{ id: 'ls1', name: 'L', lanes: [] }],
    });
    expect(result.version).toBe(1);
    expect(result.groups).toEqual([{ id: 'g1', name: 'G' }]);
    expect(result.swimlaneSets).toEqual([{ id: 'ls1', name: 'L', lanes: [] }]);
    expect(result.nodes[0].groupId).toBe('g1');
  });
});
