/**
 * 測試：editor/overlay-utils.js → trapFocus
 * 注入 mock document（含 getElementById）進 vm 沙箱，覆蓋：
 *  - 非 Tab 鍵早退
 *  - overlay 不可見早退
 *  - overlay 不存在早退
 *  - 無 focusable 元素早退
 *  - shift+tab 在第一個 focusable 上 → 跳到最後一個 + preventDefault
 *  - tab 在最後一個 focusable 上 → 回到第一個 + preventDefault
 *  - tab 在中間 focusable 上 → 不攔截
 *  - activeElement 為 null 時不崩潰
 */
import { describe, it, expect, vi } from 'vitest';
import vm from 'node:vm';

function loadOverlayUtils(sandboxExtras) {
  const src = require('node:fs').readFileSync('editor/overlay-utils.js', 'utf8');
  const extras = sandboxExtras || {};
  const sandbox = Object.assign(
    { window: {}, globalThis: {} },
    extras
  );
  if (extras.document) {
    sandbox.window.document = extras.document;
  }
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.DiagramWeaveEditorOverlay;
}

function makeMockElement(opts) {
  opts = opts || {};
  const classes = new Set(opts.visible ? ['visible'] : []);
  return {
    classList: {
      contains: (c) => classes.has(c),
      remove: (c) => classes.delete(c),
    },
    querySelectorAll: vi.fn((selector) => opts.focusable || []),
    hidden: false,
    getClientRects: vi.fn(() => ({ length: opts.rendered === false ? 0 : 1 })),
    focus: vi.fn(),
  };
}

describe('editor/overlay-utils.js → trapFocus', () => {
  it('挂载 trapFocus 到 DiagramWeaveEditorOverlay', () => {
    const utils = loadOverlayUtils();
    expect(typeof utils.trapFocus).toBe('function');
  });

  it('非 Tab 鍵：早退且不攔截', () => {
    const overlay = makeMockElement({ visible: true });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: null,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Enter', preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('overlay 不可見：早退且不攔截', () => {
    const overlay = makeMockElement({ visible: false });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: null,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('overlay 不存在（getElementById 返回 null）：早退', () => {
    const doc = {
      getElementById: vi.fn(() => null),
      activeElement: null,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('overlay 缺少 classList：早退（防御）', () => {
    const malformed = { querySelectorAll: vi.fn(() => []) };
    const doc = {
      getElementById: vi.fn(() => malformed),
      activeElement: null,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
  });

  it('無 focusable 元素：早退且不攔截', () => {
    const overlay = makeMockElement({ visible: true, focusable: [] });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: null,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('shift+tab 在第一個 focusable：跳到最後 + preventDefault + 返回 true', () => {
    const first = makeMockElement();
    const middle = makeMockElement();
    const last = makeMockElement();
    const overlay = makeMockElement({ visible: true, focusable: [first, middle, last] });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: first,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(true);
    expect(e.preventDefault).toHaveBeenCalledTimes(1);
    expect(last.focus).toHaveBeenCalledTimes(1);
    expect(first.focus).not.toHaveBeenCalled();
  });

  it('tab 在最後一個 focusable：回到第一 + preventDefault + 返回 true', () => {
    const first = makeMockElement();
    const middle = makeMockElement();
    const last = makeMockElement();
    const overlay = makeMockElement({ visible: true, focusable: [first, middle, last] });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: last,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(true);
    expect(e.preventDefault).toHaveBeenCalledTimes(1);
    expect(first.focus).toHaveBeenCalledTimes(1);
    expect(last.focus).not.toHaveBeenCalled();
  });

  it('tab 在中間 focusable：不攔截', () => {
    const first = makeMockElement();
    const middle = makeMockElement();
    const last = makeMockElement();
    const overlay = makeMockElement({ visible: true, focusable: [first, middle, last] });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: middle,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(first.focus).not.toHaveBeenCalled();
    expect(last.focus).not.toHaveBeenCalled();
  });

  it('document.activeElement 為 null：tab 不會崩潰', () => {
    const first = makeMockElement();
    const last = makeMockElement();
    const overlay = makeMockElement({ visible: true, focusable: [first, last] });
    const doc = {
      getElementById: vi.fn(() => overlay),
      activeElement: null,
    };
    const utils = loadOverlayUtils({ document: doc });
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    expect(() => utils.trapFocus(e, 'cmdPalette')).not.toThrow();
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
  });

  it('document 缺失：早退（防御）', () => {
    const utils = loadOverlayUtils();
    const e = { key: 'Tab', preventDefault: vi.fn() };
    expect(utils.trapFocus(e, 'cmdPalette')).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });
});
