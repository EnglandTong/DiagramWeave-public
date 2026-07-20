import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('DiagramWeaveNodeColors', () => {
  let colors;

  beforeAll(() => {
    const sandbox = { DiagramWeaveNodeColors: null };
    vm.runInNewContext(readFileSync(join(root, 'diagramweave-node-colors.js'), 'utf8'), sandbox);
    colors = sandbox.DiagramWeaveNodeColors;
  });

  it('normalizes short and long hex colors', () => {
    expect(colors.normalizeHex('#ABC')).toBe('#aabbcc');
    expect(colors.normalizeHex('#123456')).toBe('#123456');
    expect(colors.normalizeHex('red')).toBeNull();
  });

  it('chooses the higher contrast automatic text color', () => {
    expect(colors.resolveTextColor('#111320', 'auto')).toBe('#ffffff');
    expect(colors.resolveTextColor('#ffffff', 'auto')).toBe('#111320');
    expect(colors.contrastRatio('#111320', '#ffffff')).toBeGreaterThan(10);
  });

  it('preserves a valid explicit text color', () => {
    expect(colors.resolveTextColor('#111320', '#34d399')).toBe('#34d399');
  });
});

