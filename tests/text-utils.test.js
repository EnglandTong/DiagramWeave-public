/**
 * 測試：editor/text-utils.js
 * 採用與 tests/editor-state.test.js 一致的 vm 模式（純函數 IIFE 模塊）。
 * 重點：驗證 escapeHtml 與 flowchart-editor 原版語義等價（5 字符替換，含單引號 '）。
 */
import { describe, it, expect } from 'vitest';
import vm from 'node:vm';

function loadTextUtils() {
  const src = require('node:fs').readFileSync('editor/text-utils.js', 'utf8');
  const sandbox = { window: {}, globalThis: {} };
  sandbox.window.DiagramWeaveEditorText = undefined;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.DiagramWeaveEditorText;
}

describe('editor/text-utils.js', () => {
  const utils = loadTextUtils();

  it('挂载到 DiagramWeaveEditorText 全局', () => {
    expect(utils).toBeTruthy();
    expect(typeof utils.escapeHtml).toBe('function');
  });

  it('替换 & < > " 五字符（与原 editor 语义一致）', () => {
    expect(utils.escapeHtml('A & B < C > D "E"')).toBe('A &amp; B &lt; C &gt; D &quot;E&quot;');
  });

  it('替换单引号 \' 为 &#39;（严格语义，覆盖 extensions.js 原版差异）', () => {
    expect(utils.escapeHtml("it's")).toBe('it&#39;s');
  });

  it('空字符串返回空字符串', () => {
    expect(utils.escapeHtml('')).toBe('');
  });

  it('null / undefined 返回空字符串（防 XSS 注入点）', () => {
    expect(utils.escapeHtml(null)).toBe('');
    expect(utils.escapeHtml(undefined)).toBe('');
  });

  it('非字符串输入转为字符串后再转义', () => {
    expect(utils.escapeHtml(42)).toBe('42');
    expect(utils.escapeHtml(true)).toBe('true');
  });

  it('无特殊字符原样返回', () => {
    expect(utils.escapeHtml('Hello World')).toBe('Hello World');
  });
});
