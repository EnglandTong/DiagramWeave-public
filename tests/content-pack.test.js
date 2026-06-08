import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadContent() {
  const sandbox = { DiagramWeaveContent: null, showToast: () => {}, DiagramWeaveBootstrap: null };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(root, 'diagramweave-content-pack.js'), 'utf8'), sandbox);
  return sandbox.DiagramWeaveContent;
}

describe('DiagramWeaveContent', () => {
  /** @type {ReturnType<typeof loadContent>} */
  let C;

  beforeAll(() => {
    C = loadContent();
  });

  it('validates connModes fonts and shapes', () => {
    const pack = C.validatePack({
      packVersion: '1.0.0',
      connModes: [
        { id: 'straight', label: 'Straight', algorithm: 'straight' },
        { id: 'visio', label: 'Visio', algorithm: 'visio' },
      ],
      fonts: [{
        id: 'f1',
        label: 'Test Font',
        family: 'TestFont',
        url: 'https://example.com/font.otf',
      }],
      shapes: [{
        id: 'webhook',
        label: 'Webhook',
        sidebarSvg: '<svg viewBox="0 0 40 40"><rect x="1" y="1" width="38" height="38"/></svg>',
        renderAs: 'rectangle',
      }],
    });
    expect(pack?.connModes).toHaveLength(2);
    expect(pack?.fonts).toHaveLength(1);
    expect(pack?.shapes).toHaveLength(1);
  });

  it('filters out unsupported conn algorithms', () => {
    const pack = C.validatePack({
      connModes: [{ id: 'custom', label: 'Custom', algorithm: 'eval-js' }],
    });
    expect(pack?.connModes).toHaveLength(0);
  });

  it('rejects unsafe svg tags and attributes', () => {
    const pack = C.validatePack({
      shapes: [{
        id: 'a',
        label: 'A',
        sidebarSvg: '<svg><g><foreignObject><text>bad</text></foreignObject></g></svg>',
      }, {
        id: 'b',
        label: 'B',
        sidebarSvg: '<svg><text onmouseover="alert(1)">x</text></svg>',
      }],
    });
    expect(pack?.shapes).toHaveLength(0);
  });

  it('rejects unsafe shape svg', () => {
    const pack = C.validatePack({
      shapes: [{ id: 'bad', label: 'x', sidebarSvg: '<script>alert(1)</script>' }],
    });
    expect(pack?.shapes).toHaveLength(0);
  });
});
