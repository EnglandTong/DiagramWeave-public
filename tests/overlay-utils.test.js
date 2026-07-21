/**
 * 測試：editor/overlay-utils.js
 * vm 模式加載 IIFE 模塊，提供 mock overlay 物件（含 classList / setAttribute / inert）。
 * 重點：closeOverlay 在可見/不可見場景下行為正確；callback 僅在成功關閉時觸發；
 * bodyChildren 內除自身外的元素 inert 被重置。
 */
import { describe, it, expect, vi } from 'vitest';
import vm from 'node:vm';

function loadOverlayUtils() {
  const src = require('node:fs').readFileSync('editor/overlay-utils.js', 'utf8');
  const sandbox = { window: {}, globalThis: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.DiagramWeaveEditorOverlay;
}

function makeMockOverlay(visible) {
  const classes = new Set(visible ? ['visible'] : []);
  return {
    classList: {
      contains: (c) => classes.has(c),
      remove: (c) => classes.delete(c),
    },
    setAttribute: vi.fn(),
    inert: true,
  };
}

describe('editor/overlay-utils.js', () => {
  const utils = loadOverlayUtils();

  it('挂载到 DiagramWeaveEditorOverlay 全局', () => {
    expect(utils).toBeTruthy();
    expect(typeof utils.closeOverlay).toBe('function');
  });

  it('visible overlay: 移除 visible 类、设置 aria-hidden=true、触发 callback、返回 true', () => {
    const overlay = makeMockOverlay(true);
    const cb = vi.fn();
    const bodyChildren = [overlay, { inert: true, name: 'sibling' }];
    const result = utils.closeOverlay(overlay, { bodyChildren, onClosed: cb });

    expect(result).toBe(true);
    expect(overlay.classList.contains('visible')).toBe(false);
    expect(overlay.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('不可见 overlay: 早退、不调用 callback、返回 false', () => {
    const overlay = makeMockOverlay(false);
    const cb = vi.fn();
    const result = utils.closeOverlay(overlay, { bodyChildren: [overlay], onClosed: cb });

    expect(result).toBe(false);
    expect(overlay.setAttribute).not.toHaveBeenCalled();
    expect(cb).not.toHaveBeenCalled();
  });

  it('bodyChildren 中非 overlay 元素的 inert 被重置为 false', () => {
    const overlay = makeMockOverlay(true);
    const sibling = { inert: true };
    const another = { inert: true };
    utils.closeOverlay(overlay, { bodyChildren: [overlay, sibling, another] });
    expect(sibling.inert).toBe(false);
    expect(another.inert).toBe(false);
  });

  it('bodyChildren 省略时跳过 inert 重置（不抛错）', () => {
    const overlay = makeMockOverlay(true);
    expect(() => utils.closeOverlay(overlay, { onClosed: vi.fn() })).not.toThrow();
  });

  it('overlay 为 null/undefined 时早退', () => {
    expect(utils.closeOverlay(null)).toBe(false);
    expect(utils.closeOverlay(undefined)).toBe(false);
  });

  it('overlay 缺少 classList 时早退（防御）', () => {
    const malformed = { setAttribute: vi.fn() };
    expect(utils.closeOverlay(malformed)).toBe(false);
    expect(malformed.setAttribute).not.toHaveBeenCalled();
  });

  it('onClosed 省略时仍正常关闭', () => {
    const overlay = makeMockOverlay(true);
    const result = utils.closeOverlay(overlay, { bodyChildren: [overlay] });
    expect(result).toBe(true);
    expect(overlay.classList.contains('visible')).toBe(false);
  });
});
