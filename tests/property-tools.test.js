import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

let tools;
beforeAll(() => {
  const context = { globalThis: null }; context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(new URL('../diagramweave-property-tools.js', import.meta.url), 'utf8'), context);
  tools = context.DiagramWeavePropertyTools;
});

describe('property batch tools', () => {
  const nodes = [{ id: 'a', role: 'QA', fillColor: '#fff' }, { id: 'b', role: 'Dev', fillColor: '#fff', detail: 'keep' }];

  it('detects shared and mixed values without mutation', () => {
    expect(tools.mixedValue(nodes, 'fillColor')).toEqual({ mixed: false, value: '#fff' });
    expect(tools.mixedValue(nodes, 'role')).toEqual({ mixed: true, value: null });
  });

  it('creates scoped patches and preserves unrelated fields', () => {
    const result = tools.applyPatches(nodes, tools.createBatchPatches(nodes, 'role', 'Owner'));
    expect(result.map(node => node.role)).toEqual(['Owner', 'Owner']);
    expect(result[1].detail).toBe('keep');
    expect(nodes[0].role).toBe('QA');
  });

  it('normalizes supported colors and rejects invalid values', () => {
    expect(tools.normalizeColor('#AbC')).toBe('#aabbcc');
    expect(tools.normalizeColor('auto', true)).toBe('auto');
    expect(tools.normalizeColor('red')).toBeNull();
  });
});
