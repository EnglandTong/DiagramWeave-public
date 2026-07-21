(function (global) {
  'use strict';

  const MAX_SHAPE_SVG_LENGTH = 4000;
  const ALLOWED_SVG_TAGS = new Set([
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text',
    'title', 'desc', 'defs', 'style', 'lineargradient', 'radialgradient', 'stop',
  ]);
  const ALLOWED_SVG_ATTRS = new Set([
    'id', 'class', 'style', 'viewbox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
    'd', 'x1', 'y1', 'x2', 'y2', 'points', 'fill', 'fill-opacity', 'stroke', 'stroke-width',
    'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'opacity',
    'preserveaspectratio', 'vector-effect', 'xmlns',
  ]);

  function isForbiddenScriptValue(value) {
    return /javascript:\s*|data:\s*text\/html|expression\s*\(/i.test(String(value));
  }

  function sanitizeSvgAttribute(name, value) {
    const key = String(name || '').trim().toLowerCase();
    if (!key || key.startsWith('on')) return null;
    if (!ALLOWED_SVG_ATTRS.has(key)) return null;
    const v = String(value ?? '');
    if (isForbiddenScriptValue(v)) return null;
    if (key === 'style' && /url\s*\(|expression\s*\(/i.test(v)) return null;
    return { key, value: v };
  }

  function sanitizeSvgNode(node) {
    if (!node || !node.tagName) return null;
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_SVG_TAGS.has(tag)) return null;
    const clean = node.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const attr of Array.from(node.attributes || [])) {
      const sanitized = sanitizeSvgAttribute(attr.name, attr.value);
      if (!sanitized) continue;
      clean.setAttribute(sanitized.key, sanitized.value);
    }
    for (const child of Array.from(node.childNodes || [])) {
      if (child.nodeType === 1) {
        const c = sanitizeSvgNode(child);
        if (c) clean.appendChild(c);
        continue;
      }
      if (child.nodeType === 3) {
        const text = String(child.textContent || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
        if (text) clean.appendChild(node.ownerDocument.createTextNode(text));
      }
    }
    return clean;
  }

  function sanitizeSvgFallback(svg) {
    const t = String(svg || '').trim();
    if (!t.startsWith('<svg')) return '';
    if (/<\s*script\b/i.test(t)) return '';
    if (/\son\w+\s*=|<\s*foreignobject\b/i.test(t)) return '';
    return t.slice(0, MAX_SHAPE_SVG_LENGTH);
  }

  function sanitizeSvgSnippet(svg) {
    if (typeof svg !== 'string') return '';
    const t = svg.trim();
    if (!t.startsWith('<svg')) return '';
    if (/<\s*script\b/i.test(t) || /\son\w+\s*=/i.test(t) || /<\s*foreignObject\b/i.test(t)) return '';
    if (typeof DOMParser === 'undefined') return sanitizeSvgFallback(t);
    try {
      const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
      const err = doc.querySelector('parsererror');
      if (err) return '';
      const source = doc.documentElement;
      if (!source || source.tagName.toLowerCase() !== 'svg') return '';
      const clean = sanitizeSvgNode(source);
      return clean ? clean.outerHTML.slice(0, MAX_SHAPE_SVG_LENGTH) : '';
    } catch {
      return sanitizeSvgFallback(t);
    }
  }

  global.DiagramWeaveSvgSanitizer = {
    MAX_SHAPE_SVG_LENGTH,
    ALLOWED_SVG_TAGS,
    ALLOWED_SVG_ATTRS,
    isForbiddenScriptValue,
    sanitizeSvgAttribute,
    sanitizeSvgNode,
    sanitizeSvgFallback,
    sanitizeSvgSnippet,
  };
})(typeof window !== 'undefined' ? window : globalThis);