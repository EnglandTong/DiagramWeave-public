import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadExport() {
  const code = readFileSync(join(root, 'flowchart-export-shapes.js'), 'utf8');
  const sandbox = { DiagramWeaveExport: null };
  vm.runInNewContext(code, sandbox);
  return sandbox.DiagramWeaveExport;
}

describe('DiagramWeaveExport', () => {
  /** @type {ReturnType<typeof loadExport>} */
  let E;

  beforeAll(() => {
    E = loadExport();
  });

  it('exports hexagon as polygon not rect', () => {
    const svg = E.buildExportNodeShapeSvg({
      x: 10, y: 20, w: 100, h: 80,
      shape: 'hexagon',
      fillColor: '#112233',
      strokeColor: '#445566',
    });
    expect(svg).toContain('<polygon');
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('fill="#112233"');
  });

  it('exports offpage and sort shapes', () => {
    const off = E.buildExportNodeShapeSvg({ x: 0, y: 0, w: 100, h: 70, shape: 'offpage', fillColor: '#111111', strokeColor: '#222222' });
    expect(off).toContain('<polygon');
    const sort = E.buildExportNodeShapeSvg({ x: 0, y: 0, w: 120, h: 80, shape: 'sort', fillColor: '#111111', strokeColor: '#222222' });
    expect(sort).toContain('<polygon');
  });

  it('sanitizes invalid export colors', () => {
    const svg = E.buildExportNodeShapeSvg({
      x: 0, y: 0, w: 50, h: 50,
      shape: 'rectangle',
      fillColor: 'bad',
      strokeColor: '#aabbcc',
    });
    expect(svg).toContain('fill="#1e2029"');
    expect(svg).toContain('stroke="#aabbcc"');
  });

  it('covers all clip-path shapes as polygon or ellipse', () => {
    const clipShapes = ['diamond', 'hexagon', 'triangle', 'display', 'manual', 'sort', 'storage', 'offpage', 'or'];
    for (const shape of clipShapes) {
      const svg = E.buildExportNodeShapeSvg({
        x: 0, y: 0, w: 100, h: 80,
        shape,
        fillColor: '#111111',
        strokeColor: '#222222',
      });
      expect(svg).not.toMatch(/<rect x="0"/);
      if (shape === 'or') expect(svg).toContain('<ellipse');
      else expect(svg).toContain('<polygon');
    }
  });

  it('exportHexColor expands short hex', () => {
    expect(E.exportHexColor('#abc', '#000000')).toBe('#aabbcc');
  });
});
