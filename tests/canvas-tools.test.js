import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let tools;
const nodes = [
  { id: 'a', x: 0, y: 10, w: 100, h: 50, label: 'Draft', role: 'Writer', shape: 'rectangle' },
  { id: 'b', x: 250, y: 100, w: 120, h: 60, label: 'Review', role: 'QA', shape: 'diamond' },
  { id: 'c', x: 600, y: 300, w: 80, h: 40, label: 'Publish', role: 'Writer', shape: 'rectangle' },
];

beforeAll(() => {
  const sandbox = { globalThis: null };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(join(root, 'diagramweave-canvas-tools.js'), 'utf8'), sandbox);
  tools = sandbox.DiagramWeaveCanvasTools;
});

describe('canvas navigation calculations', () => {
  it('fits bounds inside a viewport', () => {
    const result = tools.fitTransform(nodes, { width: 1000, height: 600 }, 50);
    expect(result.zoom).toBeGreaterThan(0);
    expect(Number.isFinite(result.panX)).toBe(true);
  });

  it('aligns node edges and centers', () => {
    expect(tools.align(nodes, 'left').every(item => item.x === 0)).toBe(true);
    const centered = tools.align(nodes, 'middle');
    expect(new Set(centered.map((item, i) => item.y + nodes[i].h / 2)).size).toBe(1);
  });

  it('distributes three nodes by center spacing', () => {
    const result = tools.distribute(nodes, 'horizontal');
    const centers = result.map((item, i) => item.x + nodes.find(node => node.id === item.id).w / 2);
    expect(centers[1] - centers[0]).toBeCloseTo(centers[2] - centers[1]);
  });

  it('filters without mutating nodes', () => {
    const before = JSON.stringify(nodes);
    expect(tools.filterNodes(nodes, 'rEv', { role: 'QA' }).map(node => node.id)).toEqual(['b']);
    expect(tools.filterNodes(nodes, '', { shape: 'rectangle' })).toHaveLength(2);
    expect(JSON.stringify(nodes)).toBe(before);
  });
});
