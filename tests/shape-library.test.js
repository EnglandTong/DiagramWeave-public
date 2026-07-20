import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

let library;
beforeAll(() => {
  const context = { globalThis: null };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(new URL('../diagramweave-shape-library.js', import.meta.url), 'utf8'), context);
  library = context.DiagramWeaveShapeLibrary;
});

describe('shape library registry', () => {
  it('searches bilingual metadata, category, and pack', () => {
    const registry = library.createRegistry([
      { id: 'decision', label: '判断', category: 'Flowchart', packId: 'builtin', keywords: ['diamond', '决策'] },
      { id: 'server', label: 'Server', category: 'Infrastructure', packId: 'cloud-pack' },
    ]);
    expect(registry.search('diamond').map(item => item.id)).toEqual(['decision']);
    expect(registry.search('Infrastructure').map(item => item.id)).toEqual(['server']);
    expect(Object.keys(registry.groupByCategory())).toEqual(['Flowchart', 'Infrastructure']);
  });

  it('merges registrations by stable id', () => {
    const registry = library.createRegistry([{ id: 'task', label: 'Task' }]);
    registry.register({ id: 'task', label: 'Updated', packId: 'remote' });
    expect(registry.list()).toHaveLength(1);
    expect(registry.get('task').label).toBe('Updated');
  });

  it('persists favorites and latest-first recent shapes', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
    const prefs = library.createPreferences(storage, 'test');
    expect(prefs.toggleFavorite('a')).toEqual(['a']);
    expect(prefs.toggleFavorite('a')).toEqual([]);
    prefs.recordRecent('a'); prefs.recordRecent('b'); prefs.recordRecent('a');
    expect(prefs.recent()).toEqual(['a', 'b']);
  });
});
