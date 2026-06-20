import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

import { assertExtensionInvokeResult } from './extension-contract.test.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadVisioPreview() {
  const sandbox = {
    window: {},
    DiagramWeaveExtensionKernel: {
      registerHandler() {},
    },
    DiagramWeaveVisioPreview: null,
  };
  sandbox.window = sandbox;
  const code = readFileSync(join(root, 'diagramweave-visio-preview.js'), 'utf8');
  vm.runInNewContext(code, sandbox);
  return sandbox.DiagramWeaveVisioPreview;
}

describe('DiagramWeave Visio preview', () => {
  let visio;

  beforeAll(() => {
    visio = loadVisioPreview();
  });

  it('rejects non-zip buffer', () => {
    const result = visio.previewVisioArchive({ buffer: Buffer.from('notzip'), fileName: 'x.vsdx' });
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(false);
    expect(result.issues[0]?.code).toBe('invalid_archive');
  });

  it('detects visio pages in minimal zip', () => {
    const zip = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from('visio/pages/page1.xml visio/pages/page2.xml visio/masters/master1.xml', 'utf8'),
    ]);
    const result = visio.previewVisioArchive({ buffer: zip, fileName: 'sample.vsdx' });
    assertExtensionInvokeResult(result);
    expect(result.success).toBe(true);
    expect(result.data.pageCount).toBe(2);
    expect(result.data.mappingStatus).toBe('stub');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('rejects missing buffer', () => {
    const result = visio.previewVisioArchive({ fileName: 'a.vsdx' });
    expect(result.success).toBe(false);
    expect(result.issues[0]?.code).toBe('invalid_input');
  });
});
