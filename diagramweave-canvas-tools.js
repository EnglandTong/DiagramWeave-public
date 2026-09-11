(function initDiagramWeaveCanvasTools(global) {
  'use strict';

  function bounds(nodes) {
    if (!nodes?.length) return null;
    const minX = Math.min(...nodes.map(node => Number(node.x) || 0));
    const minY = Math.min(...nodes.map(node => Number(node.y) || 0));
    const maxX = Math.max(...nodes.map(node => (Number(node.x) || 0) + (Number(node.w) || 0)));
    const maxY = Math.max(...nodes.map(node => (Number(node.y) || 0) + (Number(node.h) || 0)));
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  function fitTransform(nodes, viewport, padding = 64) {
    const box = bounds(nodes);
    if (!box) return { zoom: 1, panX: 0, panY: 0 };
    const availableW = Math.max(1, viewport.width - padding * 2);
    const availableH = Math.max(1, viewport.height - padding * 2);
    const zoom = Math.max(0.2, Math.min(3, Math.min(availableW / Math.max(1, box.width), availableH / Math.max(1, box.height))));
    return {
      zoom,
      panX: viewport.width / 2 - (box.minX + box.width / 2) * zoom,
      panY: viewport.height / 2 - (box.minY + box.height / 2) * zoom,
    };
  }

  function align(nodes, mode) {
    const box = bounds(nodes);
    if (!box || nodes.length < 2) return [];
    // 别名：hcenter → center, vcenter → middle
    const m = mode === 'hcenter' ? 'center' : mode === 'vcenter' ? 'middle' : mode;
    return nodes.map(node => {
      let x = node.x;
      let y = node.y;
      if (m === 'left') x = box.minX;
      if (m === 'center') x = box.minX + box.width / 2 - node.w / 2;
      if (m === 'right') x = box.maxX - node.w;
      if (m === 'top') y = box.minY;
      if (m === 'middle') y = box.minY + box.height / 2 - node.h / 2;
      if (m === 'bottom') y = box.maxY - node.h;
      return { id: node.id, x, y };
    });
  }

  function distribute(nodes, axis) {
    if (!nodes || nodes.length < 3) return [];
    const horizontal = axis === 'horizontal';
    const sorted = [...nodes].sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstCenter = horizontal ? first.x + first.w / 2 : first.y + first.h / 2;
    const lastCenter = horizontal ? last.x + last.w / 2 : last.y + last.h / 2;
    const step = (lastCenter - firstCenter) / (sorted.length - 1);
    return sorted.map((node, index) => horizontal
      ? { id: node.id, x: firstCenter + step * index - node.w / 2, y: node.y }
      : { id: node.id, x: node.x, y: firstCenter + step * index - node.h / 2 });
  }

  function filterNodes(nodes, query = '', filters = {}) {
    const needle = String(query).trim().toLocaleLowerCase();
    return (nodes || []).filter(node => {
      const textMatches = !needle || `${node.label || ''} ${node.id || ''} ${node.role || ''}`.toLocaleLowerCase().includes(needle);
      const roleMatches = !filters.role || node.role === filters.role;
      const shapeMatches = !filters.shape || node.shape === filters.shape;
      return textMatches && roleMatches && shapeMatches;
    });
  }

  global.DiagramWeaveCanvasTools = { bounds, fitTransform, align, distribute, filterNodes };
})(typeof window !== 'undefined' ? window : globalThis);
