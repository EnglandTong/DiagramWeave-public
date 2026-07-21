/**
 * DiagramWeave Canvas Renderer Utilities
 *
 * 從 flowchart-editor.js 抽取的畫布渲染純工具函數與常量數據。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveCanvasRenderer。
 * 保持原函數簽名不變，通過 typeof 委託或參數注入訪問外部依賴。
 */
(function initDiagramWeaveCanvasRenderer(global) {
  'use strict';

  /** clip-path 图形无法用 border 描边，用 SVG 矢量描边（viewBox 0–100） */
  const SHAPE_STROKE_SPECS = {
    diamond:  { type: 'polygon', points: '50,0 100,50 50,100 0,50' },
    hexagon:  { type: 'polygon', points: '50,0 100,25 100,75 50,100 0,75 0,25' },
    triangle: { type: 'polygon', points: '50,0 100,100 0,100' },
    display:  { type: 'polygon', points: '0,0 100,0 100,75 50,100 0,75' },
    manual:   { type: 'polygon', points: '0,0 85,0 100,100 15,100' },
    sort:     { type: 'polygon', points: '50,0 100,40 80,40 80,100 20,100 20,40 0,40' },
    storage:  { type: 'polygon', points: '50,0 100,25 100,100 0,100 0,25' },
    offpage:  { type: 'polygon', points: '0,0 85,0 100,50 85,100 0,100' },
    or:       { type: 'ellipse', cx: 50, cy: 50, rx: 50, ry: 40 },
  };

  /** 各图形四向连线锚点（相对宽高的 0–1 比例，贴合 clip-path 轮廓） */
  const SHAPE_PORT_ANCHORS = {
    default: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
    },
    diamond: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
    },
    triangle: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0.25, y: 0.5 }, right: { x: 0.75, y: 0.5 },
    },
    hexagon: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
    },
    storage: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.625 }, right: { x: 1, y: 0.625 },
    },
    display: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0, y: 0.375 }, right: { x: 1, y: 0.375 },
    },
    manual: {
      top: { x: 0.425, y: 0 }, bottom: { x: 0.575, y: 1 },
      left: { x: 0.075, y: 0.5 }, right: { x: 0.925, y: 0.5 },
    },
    sort: {
      top: { x: 0.5, y: 0 }, bottom: { x: 0.5, y: 1 },
      left: { x: 0.2, y: 0.7 }, right: { x: 0.8, y: 0.7 },
    },
    offpage: {
      top: { x: 0.425, y: 0 }, bottom: { x: 0.425, y: 1 },
      left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
    },
    or: {
      top: { x: 0.5, y: 0.1 }, bottom: { x: 0.5, y: 0.9 },
      left: { x: 0, y: 0.5 }, right: { x: 1, y: 0.5 },
    },
  };

  function resolveGetNodeVisualShape() {
    if (typeof global.getNodeVisualShape === 'function') return global.getNodeVisualShape;
    return function defaultGetNodeVisualShape(shape) {
      return shape;
    };
  }

  function resolveGetDefaultNodeStroke() {
    if (typeof global.getDefaultNodeStroke === 'function') return global.getDefaultNodeStroke;
    return function defaultGetDefaultNodeStroke() {
      return '#3a3e55';
    };
  }

  function resolveState() {
    if (global.state && typeof global.state === 'object') return global.state;
    return { nodes: [], connections: [] };
  }

  function getShapePortAnchors(shape) {
    return SHAPE_PORT_ANCHORS[shape] || SHAPE_PORT_ANCHORS.default;
  }

  function getPortPos(node, port) {
    const getNodeVisualShape = resolveGetNodeVisualShape();
    const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
    const a = anchors[port] || anchors.top;
    return { x: node.x + node.w * a.x, y: node.y + node.h * a.y };
  }

  function syncNodeOutlineSvg(shapeEl, node) {
    if (!shapeEl || !node) return;
    const getNodeVisualShape = resolveGetNodeVisualShape();
    const getDefaultNodeStroke = resolveGetDefaultNodeStroke();
    const visualShape = getNodeVisualShape(node.shape);
    const spec = SHAPE_STROKE_SPECS[visualShape];
    let svg = shapeEl.querySelector('.node-outline-svg');

    if (!spec) {
      if (svg) svg.remove();
      return;
    }

    const stroke = node.strokeColor || getDefaultNodeStroke();
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'node-outline-svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      shapeEl.insertBefore(svg, shapeEl.firstChild);
    }

    svg.innerHTML = '';
    let pathEl;
    if (spec.type === 'polygon') {
      pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      pathEl.setAttribute('points', spec.points);
    } else if (spec.type === 'ellipse') {
      pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      pathEl.setAttribute('cx', String(spec.cx));
      pathEl.setAttribute('cy', String(spec.cy));
      pathEl.setAttribute('rx', String(spec.rx));
      pathEl.setAttribute('ry', String(spec.ry));
    }
    if (pathEl) {
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', stroke);
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(pathEl);
    }
  }

  function syncPortElements(el, node) {
    if (!el || !node) return;
    const getNodeVisualShape = resolveGetNodeVisualShape();
    const anchors = getShapePortAnchors(getNodeVisualShape(node.shape));
    ['top', 'bottom', 'left', 'right'].forEach(port => {
      const portEl = el.querySelector(`.port-${port}`);
      const a = anchors[port];
      if (!portEl || !a) return;
      portEl.style.left = `${a.x * 100}%`;
      portEl.style.top = `${a.y * 100}%`;
      portEl.style.right = 'auto';
      portEl.style.bottom = 'auto';
    });
  }

  function computeConnPorts(fromNode, toNode) {
    const dx = (toNode.x + toNode.w / 2) - (fromNode.x + fromNode.w / 2);
    const dy = (toNode.y + toNode.h / 2) - (fromNode.y + fromNode.h / 2);
    const isLoopBack = (toNode.y + toNode.h / 2) < (fromNode.y + fromNode.h / 2) - 10 ||
      (toNode.x + toNode.w / 2) < (fromNode.x + fromNode.w / 2) - 10;

    if (isLoopBack) {
      if (Math.abs(dx) > Math.abs(dy)) {
        return { fromPort: dx > 0 ? 'right' : 'left', toPort: dx > 0 ? 'left' : 'right' };
      }
      return { fromPort: dy > 0 ? 'bottom' : 'top', toPort: dy > 0 ? 'top' : 'bottom' };
    }
    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
      return { fromPort: dx > 0 ? 'right' : 'left', toPort: dx > 0 ? 'left' : 'right' };
    }
    return { fromPort: dy > 0 ? 'bottom' : 'top', toPort: dy > 0 ? 'top' : 'bottom' };
  }

  function adjustSingleConnPorts(conn) {
    const state = resolveState();
    const fromNode = state.nodes.find(n => n.id === conn.from);
    const toNode = state.nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;
    const ports = computeConnPorts(fromNode, toNode);
    conn.fromPort = ports.fromPort;
    conn.toPort = ports.toPort;
  }

  function isDuplicateConnection(from, to, fromPort, toPort, excludeId = null) {
    const state = resolveState();
    return state.connections.some(c =>
      c.id !== excludeId &&
      c.from === from &&
      c.to === to &&
      c.fromPort === fromPort &&
      c.toPort === toPort
    );
  }

  function autoAdjustPorts() {
    const state = resolveState();
    state.connections.forEach(conn => adjustSingleConnPorts(conn));
  }

  global.DiagramWeaveCanvasRenderer = {
    SHAPE_STROKE_SPECS,
    SHAPE_PORT_ANCHORS,
    getShapePortAnchors,
    getPortPos,
    syncNodeOutlineSvg,
    syncPortElements,
    computeConnPorts,
    adjustSingleConnPorts,
    isDuplicateConnection,
    autoAdjustPorts,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
