import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadStateUtils() {
  const code = readFileSync(join(root, 'editor', 'state-utils.js'), 'utf8');
  const sandbox = { DiagramWeaveEditorState: null };
  vm.runInNewContext(code, sandbox);
  return sandbox.DiagramWeaveEditorState;
}

describe('DiagramWeaveEditorState.resetSelection', () => {
  it('clears nodes, connections and selection when called with a populated state', () => {
    const api = loadStateUtils();
    const state = {
      nodes: [{ id: 'a' }, { id: 'b' }],
      connections: [{ id: 'c1' }],
      selectedNodeId: 'a',
      selectedConnectionId: 'c1',
    };
    api.resetSelection(state);
    expect(state.nodes).toEqual([]);
    expect(state.connections).toEqual([]);
    expect(state.selectedNodeId).toBeNull();
    expect(state.selectedConnectionId).toBeNull();
  });

  it('is a no-op (does not throw) for non-object input', () => {
    const api = loadStateUtils();
    expect(() => api.resetSelection(null)).not.toThrow();
    expect(() => api.resetSelection(undefined)).not.toThrow();
    const numeric = 42;
    expect(() => api.resetSelection(numeric)).not.toThrow();
  });

  it('exposes the global DiagramWeaveEditorState namespace with resetSelection', () => {
    const api = loadStateUtils();
    expect(api).toBeTruthy();
    expect(typeof api.resetSelection).toBe('function');
  });
});
