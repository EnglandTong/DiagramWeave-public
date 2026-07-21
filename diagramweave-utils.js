(function initDiagramWeaveUtils(global) {
  'use strict';

  function normalize(str) {
    if (str == null) return '';
    return String(str).trim();
  }

  function clone(obj) {
    if (obj == null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  function parseVersionParts(v) {
    if (!v || typeof v !== 'string') return [0];
    return v.trim().replace(/^v/i, '').split(/[.-]/).map(part => {
      const n = parseInt(part, 10);
      return Number.isFinite(n) ? n : part;
    });
  }

  function compareVersions(v1, v2) {
    const pa = parseVersionParts(v1);
    const pb = parseVersionParts(v2);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const x = pa[i] ?? 0;
      const y = pb[i] ?? 0;
      if (typeof x === 'number' && typeof y === 'number') {
        if (x !== y) return x > y ? 1 : -1;
      } else {
        const xs = String(x);
        const ys = String(y);
        if (xs !== ys) return xs > ys ? 1 : -1;
      }
    }
    return 0;
  }

  function normalizeHex(color) {
    if (typeof color !== 'string') return null;
    const hex = color.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
    if (/^#[0-9a-f]{3}$/.test(hex)) {
      return '#' + hex.slice(1).split('').map(char => char + char).join('');
    }
    return null;
  }

  global.DiagramWeaveUtils = {
    normalize,
    clone,
    compareVersions,
    normalizeHex,
  };
})(typeof window !== 'undefined' ? window : globalThis);