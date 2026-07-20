import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('theme token wiring', () => {
  it('loads canonical tokens before editor compatibility styles', () => {
    const html = readFileSync(join(root, 'flowchart-editor.html'), 'utf8');
    const tokens = html.indexOf('diagramweave-ui-redesign/colors_and_type.css');
    const editor = html.indexOf('flowchart-editor.css');
    expect(tokens).toBeGreaterThan(-1);
    expect(editor).toBeGreaterThan(tokens);
  });

  it('defines every P0 core token in the canonical stylesheet', () => {
    const css = readFileSync(join(root, 'diagramweave-ui-redesign', 'colors_and_type.css'), 'utf8');
    for (const token of ['--bg-base', '--text-primary', '--accent', '--radius-sm', '--shadow-md']) {
      expect(css).toMatch(new RegExp(`${token}\\s*:`));
    }
    expect(css).toContain("font-family: 'DiagramWeaveZh'");
  });

  it('keeps canonical token values out of the editor stylesheet', () => {
    const css = readFileSync(join(root, 'flowchart-editor.css'), 'utf8');
    expect(css).not.toMatch(/--bg-base\s*:/);
    expect(css).not.toMatch(/--accent\s*:\s*#/);
    expect(css).toContain('--bg-primary: var(--bg-base)');
  });
});
