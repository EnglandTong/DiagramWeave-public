import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let mapping;
let storage;

beforeEach(() => {
  const values = new Map();
  storage = {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const sandbox = { globalThis: null, localStorage: storage };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(join(root, 'diagramweave-field-mapping.js'), 'utf8'), sandbox);
  mapping = sandbox.DiagramWeaveFieldMapping;
});

describe('field mapping', () => {
  it('suggests aliases and maps nonstandard rows explicitly', () => {
    const rows = [{ StepCode: 7, StepTitle: 'Review', PosLeft: 120, PosTop: 240 }];
    const selected = { id: 'StepCode', label: 'StepTitle', x: 'PosLeft', y: 'PosTop' };
    const result = mapping.mapRows(rows, selected, 'node');
    expect(result.success).toBe(true);
    expect(result.rows[0]).toMatchObject({ refId: 7, label: 'Review', x: 120, y: 240, sourceRow: 2 });
    expect(mapping.hasCoordinateMapping(selected)).toBe(true);
  });

  it('requires node and connection identifiers', () => {
    expect(mapping.validateMapping({}, 'node')[0].field).toBe('id');
    expect(mapping.validateMapping({ from: 'a' }, 'connection')[0].field).toBe('to');
  });

  it('maps ports, dimensions, roles, layers, and pages', () => {
    const node = mapping.mapRows([{ code: 1, width: 180, height: 70, owner: 'QA', band: 2, sheet: 'P2' }], {
      id: 'code', w: 'width', h: 'height', role: 'owner', layer: 'band', page: 'sheet',
    }, 'node').rows[0];
    const connection = mapping.mapRows([{ start: 1, end: 2, startPort: 'right', endPort: 'left' }], {
      from: 'start', to: 'end', fromPort: 'startPort', toPort: 'endPort',
    }, 'connection').rows[0];
    expect(node).toMatchObject({ w: 180, h: 70, role: 'QA', layer: 2, page: 'P2' });
    expect(connection).toMatchObject({ fromPort: 'right', toPort: 'left' });
  });

  it('saves and reuses browser-local presets', () => {
    mapping.savePreset('ERP export', { node: { id: 'StepCode' }, connection: { from: 'Source', to: 'Target' } }, storage);
    expect(mapping.loadPreset('ERP export', storage)).toMatchObject({ name: 'ERP export', node: { id: 'StepCode' } });
    expect(mapping.listPresets(storage)).toHaveLength(1);
  });
});
