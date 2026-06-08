/**
 * DiagramWeave 导出用图形 SVG 生成（与画布 clip-path / SHAPE_STROKE_SPECS 对齐）
 */
(function (global) {
  'use strict';

  /** viewBox 0–100 归一化轮廓，与 flowchart-editor 中 SHAPE_STROKE_SPECS 一致 */
  const SHAPE_EXPORT_SPECS = {
    diamond:  { type: 'polygon', points: '50,0 100,50 50,100 0,50' },
    hexagon:  { type: 'polygon', points: '50,0 100,25 100,75 50,100 0,75 0,25' },
    triangle: { type: 'polygon', points: '50,0 100,100 0,100' },
    display:  { type: 'polygon', points: '0,0 100,0 100,75 50,100 0,75' },
    manual:   { type: 'polygon', points: '0,0 85,0 100,100 15,100' },
    sort:     { type: 'polygon', points: '50,0 100,40 80,40 80,100 20,100 20,40 0,40' },
    storage:  { type: 'polygon', points: '50,0 100,25 100,100 0,100 0,25' },
    offpage:  { type: 'polygon', points: '0,0 85,0 100,50 85,100 0,100' },
    or:       { type: 'ellipse', cx: 50, cy: 50, rx: 50, ry: 40 },
    parallelogram: { type: 'polygon', points: '10.7,0 100,0 89.3,100 0,100' },
  };

  function exportHexColor(c, fallback) {
    const fb = fallback || '#3a3e55';
    if (typeof c !== 'string') return fb;
    const t = c.trim();
    if (/^#[0-9a-f]{6}$/i.test(t)) return t.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(t)) {
      const h = t.slice(1);
      return ('#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toLowerCase();
    }
    return fb;
  }

  function scalePoints100(pointsStr, x, y, w, h) {
    return pointsStr.split(/\s+/).map(pair => {
      const [px, py] = pair.split(',').map(Number);
      return `${x + (px / 100) * w},${y + (py / 100) * h}`;
    }).join(' ');
  }

  function svgAttrs(fill, stroke, extra) {
    return `fill="${fill}" stroke="${stroke}" stroke-width="2"${extra ? ' ' + extra : ''}`;
  }

  /**
   * @param {object} node - { x, y, w, h, shape, fillColor, strokeColor }
   * @returns {string} SVG 元素字符串（不含标签文字）
   */
  function buildExportNodeShapeSvg(node) {
    const x = node.x;
    const y = node.y;
    const w = node.w;
    const h = node.h;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const fill = exportHexColor(node.fillColor, '#1e2029');
    const stroke = exportHexColor(node.strokeColor, '#3a3e55');
    const shape = node.shape || 'rectangle';
    const a = svgAttrs(fill, stroke);

    const spec = SHAPE_EXPORT_SPECS[shape];
    if (spec?.type === 'polygon') {
      const pts = scalePoints100(spec.points, x, y, w, h);
      return `<polygon points="${pts}" ${a}/>`;
    }
    if (spec?.type === 'ellipse') {
      const ecx = x + (spec.cx / 100) * w;
      const ecy = y + (spec.cy / 100) * h;
      const rx = (spec.rx / 100) * w;
      const ry = (spec.ry / 100) * h;
      return `<ellipse cx="${ecx}" cy="${ecy}" rx="${rx}" ry="${ry}" ${a}/>`;
    }

    switch (shape) {
      case 'rounded':
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" ${a}/>`;
      case 'terminator':
      case 'start':
      case 'end':
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ${a}/>`;
      case 'circle':
        return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" ${a}/>`;
      case 'database': {
        const r = 6;
        const bodyH = h - 10;
        return `<path d="M ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + bodyH} Q ${cx} ${y + h + 8} ${x} ${y + bodyH} Z" ${a}/>`;
      }
      case 'document': {
        const wave = 8;
        return `<path d="M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - wave} Q ${cx} ${y + h + wave} ${x} ${y + h - wave} Z" ${a}/>`;
      }
      case 'delay':
        return `<path d="M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x + w - w / 2} ${y + h} L ${x} ${y + h} Z" ${a}/>`;
      case 'rectangle':
      case 'card':
      case 'tape':
      case 'subprocess':
      case 'predefprocess':
      case 'looplimit':
      case 'annotation':
      case 'note':
      default:
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ${a}/>`;
    }
  }

  global.DiagramWeaveExport = {
    buildExportNodeShapeSvg,
    exportHexColor,
    SHAPE_EXPORT_SPECS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
