import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeAll } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadI18n() {
  const storage = new Map();
  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const sandbox = {
    localStorage,
    navigator: { language: 'en-US' },
    document: {
      documentElement: { lang: 'en' },
      title: '',
      querySelectorAll: () => [],
    },
    DiagramWeaveI18n: null,
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(root, 'diagramweave-i18n.js'), 'utf8'), sandbox);
  return sandbox;
}

describe('DiagramWeaveI18n', () => {
  /** @type {ReturnType<typeof loadI18n>} */
  let ctx;

  beforeAll(async () => {
    ctx = loadI18n();
    await ctx.DiagramWeaveI18n.init();
  });

  it('defaults to English for en-US navigator', () => {
    expect(ctx.DiagramWeaveI18n.getLocale()).toBe('en');
    expect(ctx.DiagramWeaveI18n.t('toolbar.select')).toBe('Select (V)');
  });

  it('switches to Chinese', async () => {
    await ctx.DiagramWeaveI18n.setLocale('zh-CN');
    expect(ctx.DiagramWeaveI18n.t('shape.rectangle')).toBe('流程');
    expect(ctx.DiagramWeaveI18n.t('conn.bezier')).toBe('曲线');
  });

  it('interpolates variables', () => {
    expect(ctx.DiagramWeaveI18n.t('page.default', { n: 2 })).toBe('页面 2');
  });
});
