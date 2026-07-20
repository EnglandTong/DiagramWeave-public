import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function load(file, sandbox) { vm.runInContext(readFileSync(join(root, file), 'utf8'), sandbox); }
function setup() {
  const values = new Map();
  const sandbox = { localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) } };
  vm.createContext(sandbox); load('diagramweave-content-pack.js', sandbox); load('diagramweave-stencil-manager.js', sandbox);
  return { manager: sandbox.DiagramWeaveStencilManager, content: sandbox.DiagramWeaveContent, storage: sandbox.localStorage };
}
const valid = { id: 'ops_pack', name: 'Operations', version: '1.0', shapes: [{
  id: 'queue_box', label: 'Queue', section: 'Operations', sidebarSvg: '<svg viewBox="0 0 40 40"><rect x="4" y="8" width="32" height="24"/></svg>', renderAs: 'rectangle',
}] };

describe('Stencil Manager', () => {
  it('strictly validates every shape and rejects active content', () => {
    const { manager, content } = setup();
    expect(manager.validatePack(valid, content.validatePack).success).toBe(true);
    const unsafe = { ...valid, id: 'unsafe', shapes: [{ id: 'bad', label: 'Bad', sidebarSvg: '<svg onload="alert(1)"><rect/></svg>' }] };
    expect(manager.validatePack(unsafe, content.validatePack).success).toBe(false);
  });

  it('persists enable, rename, export, and duplicate rejection', () => {
    const { manager, content, storage } = setup(); const store = manager.createStore(storage, content.validatePack);
    expect(store.importPack(valid).success).toBe(true);
    expect(store.importPack(valid).success).toBe(false);
    expect(store.setEnabled('ops_pack', false)).toBe(true);
    expect(store.rename('ops_pack', 'Ops Symbols')).toBe(true);
    expect(JSON.parse(store.exportPack('ops_pack'))).toMatchObject({ name: 'Ops Symbols', enabled: false });
    expect(manager.createStore(storage, content.validatePack).list()[0].name).toBe('Ops Symbols');
  });
});
