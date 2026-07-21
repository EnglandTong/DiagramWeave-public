(function initDiagramWeaveNodeColors(global) {
  'use strict';

  const AUTO = 'auto';
  const DARK_TEXT = '#111320';
  const LIGHT_TEXT = '#ffffff';

  const normalizeHex = typeof global.DiagramWeaveUtils !== 'undefined' && global.DiagramWeaveUtils && typeof global.DiagramWeaveUtils.normalizeHex === 'function'
    ? global.DiagramWeaveUtils.normalizeHex
    : (value => {
        if (typeof value !== 'string') return null;
        const hex = value.trim().toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
        if (/^#[0-9a-f]{3}$/.test(hex)) {
          return '#' + hex.slice(1).split('').map(char => char + char).join('');
        }
        return null;
      });

  function relativeLuminance(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;
    const channels = [1, 3, 5].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255);
    const linear = channels.map(value => value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4));
    return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
  }

  function contrastRatio(first, second) {
    const a = relativeLuminance(first);
    const b = relativeLuminance(second);
    if (a == null || b == null) return 1;
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function resolveTextColor(fillColor, textColor = AUTO) {
    const explicit = normalizeHex(textColor);
    if (explicit) return explicit;
    const fill = normalizeHex(fillColor);
    if (!fill) return LIGHT_TEXT;
    return contrastRatio(fill, DARK_TEXT) >= contrastRatio(fill, LIGHT_TEXT)
      ? DARK_TEXT
      : LIGHT_TEXT;
  }

  global.DiagramWeaveNodeColors = {
    AUTO,
    DARK_TEXT,
    LIGHT_TEXT,
    normalizeHex,
    relativeLuminance,
    contrastRatio,
    resolveTextColor,
  };
})(typeof window !== 'undefined' ? window : globalThis);
