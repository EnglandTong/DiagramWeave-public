import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let preview;

beforeAll(() => {
  const sandbox = { globalThis: null };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(join(root, 'flowchart-sanitize.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'diagramweave-import-preview.js'), 'utf8'), sandbox);
  preview = sandbox.DiagramWeaveImportPreview;
});

describe('import preview pipeline', () => {
  it('creates a candidate without mutating the source', () => {
    const raw = { nodes: [{ id: 'a', label: 'A' }], connections: [] };
    const before = JSON.stringify(raw);
    const result = preview.createDocumentPreview(raw);
    expect(result.success).toBe(true);
    expect(result.data.summary).toMatchObject({ pages: 1, nodes: 1, connections: 0 });
    expect(JSON.stringify(raw)).toBe(before);
    expect(result.data.document).not.toBe(raw);
  });

  it('reports invalid references with row, field, and reason', () => {
    const result = preview.createDocumentPreview({
      nodes: [{ id: 'a', label: 'A' }],
      connections: [{ id: 'c1', from: 'a', to: 'missing' }],
    });
    expect(result.success).toBe(true);
    expect(result.data.summary.connections).toBe(0);
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'MISSING_TO_REFERENCE', row: 2, field: 'to', reason: expect.any(String),
    }));
  });

  it('preserves a valid cycle', () => {
    const result = preview.createDocumentPreview({
      nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      connections: [{ id: 'c1', from: 'a', to: 'b' }, { id: 'c2', from: 'b', to: 'a' }],
    });
    expect(result.data.summary.connections).toBe(2);
    expect(result.data.summary.cycles).toBeGreaterThan(0);
  });

  it('previews tabular rows and skips invalid rows', () => {
    const result = preview.createTabularPreview(
      [{ sourceRow: 2, refId: 1, label: 'A' }, { sourceRow: 3, refId: 2, label: 'B' }],
      [{ sourceRow: 2, from: 1, to: 2 }, { sourceRow: 3, from: 2, to: 99 }],
    );
    expect(result.data.summary).toMatchObject({ nodes: 2, connections: 1 });
    expect(result.issues).toContainEqual(expect.objectContaining({ row: 3, field: 'to' }));
  });
});
