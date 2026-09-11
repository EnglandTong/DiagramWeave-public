/**
 * DiagramWeave Connection Engine
 *
 * 從 flowchart-editor.js 抽取的連線路由與渲染引擎（Phase 1 拆分第 2 步）。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveConnectionEngine。
 *
 * 包含：
 * - 五種路由算法（bezier / orthogonal / avoidance / straight / visio）
 * - 交叉偵測與橋接（bridge jump）SVG 生成
 * - 連線渲染管線（keyed reconciliation、事件委託、端點手柄）
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state / presentState（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：computeConnPorts、escapeHtml、
 *   formatNodeOutgoingConnections、getNearestPortByPoint、getPortDirection、
 *   getPortPos、getThemeVar、refreshAllNodeBriefs、renderAll、selectConnection、
 *   showConnContextMenu、startConnectionLabelEdit、startReconnect
 */
/* global DiagramWeaveEditorCore, escapeHtml, formatNodeOutgoingConnections, getNearestPortByPoint, getPortPos, getThemeVar, refreshAllNodeBriefs, refreshConnRouteLabelsFromI18n, selectConnection, showConnContextMenu, startConnectionLabelEdit, startReconnect */
(function initDiagramWeaveConnectionEngine(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;
  const presentState = DiagramWeaveEditorCore.presentState;
  const CONN_ROUTE_ALGORITHMS = DiagramWeaveEditorCore.CONN_ROUTE_ALGORITHMS;
  const CONN_ROUTE_LABELS = DiagramWeaveEditorCore.CONN_ROUTE_LABELS;
  const connectionsLayer = typeof document !== 'undefined' ? document.getElementById('connectionsLayer') : null;
  const canvasTransform = typeof document !== 'undefined' ? document.getElementById('canvasTransform') : null;

function pointInNodeRect(px, py, node, pad) {
  return px > node.x - pad && px < node.x + node.w + pad &&
    py > node.y - pad && py < node.y + node.h + pad;
}

const ROUTING_NODE_PAD = 28;
const ROUTING_LINE_PAD = 12;

function sampleCubicBezier(p0, p1, p2, p3, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

function isPointNear(pt1, pt2, tolerance) {
  return Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y) <= tolerance;
}

function buildLineAvoidRect(seg, padding) {
  if (!seg?.from || !seg?.to || !Number.isFinite(padding) || padding <= 0) return null;
  return {
    x1: Math.min(seg.from.x, seg.to.x) - padding,
    y1: Math.min(seg.from.y, seg.to.y) - padding,
    x2: Math.max(seg.from.x, seg.to.x) + padding,
    y2: Math.max(seg.from.y, seg.to.y) + padding,
    sourceType: 'line',
  };
}

function getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts = {}, nodePad = ROUTING_NODE_PAD) {
  const avoidSegments = routeOpts?.avoidSegments || [];
  const rects = getRoutingObstacleRects(fromNodeId, toNodeId, nodePad);
  avoidSegments.forEach(seg => {
    const box = buildLineAvoidRect(seg, ROUTING_LINE_PAD);
    if (box) rects.push(box);
  });
  return rects;
}

function segmentIntersectsAvoidSegments(a, b, avoidSegments, start, end, tolerance = 10) {
  if (!avoidSegments || avoidSegments.length === 0) return false;
  for (const seg of avoidSegments) {
    const c = seg.from;
    const d = seg.to;
    const hit = getSegmentIntersection(a, b, c, d, { trim: 0.0001 });
    const overlap = hit ? null : getCollinearOverlapBridgePoint(a, b, c, d);
    if (!hit && !overlap) continue;
    const point = hit || overlap;
    if (isPointNear(point, start, tolerance) || isPointNear(point, end, tolerance)) continue;
    return true;
  }
  return false;
}

function countPathObstacleHits(points, fromNodeId, toNodeId, pad, routeOpts = {}) {
  const safePad = Number.isFinite(pad) ? pad : ROUTING_NODE_PAD;
  const rects = getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts, safePad);
  const avoidSegments = routeOpts?.avoidSegments || [];
  let hits = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (const rect of rects) {
      if (segmentIntersectsRect(a, b, rect)) hits++;
    }
    if (segmentIntersectsAvoidSegments(a, b, avoidSegments, points[0], points[points.length - 1])) hits++;
  }
  return hits;
}

function getRoutingObstacleRects(fromNodeId, toNodeId, pad = 18) {
  return state.nodes
    .filter(node => node.id !== fromNodeId && node.id !== toNodeId)
    .map(node => ({
      id: node.id,
      x1: node.x - pad,
      y1: node.y - pad,
      x2: node.x + node.w + pad,
      y2: node.y + node.h + pad,
    }));
}

function pointInRect(pt, rect) {
  return pt.x > rect.x1 && pt.x < rect.x2 && pt.y > rect.y1 && pt.y < rect.y2;
}

function segmentIntersectsRect(a, b, rect) {
  const inA = a.x > rect.x1 && a.x < rect.x2 && a.y > rect.y1 && a.y < rect.y2;
  const inB = b.x > rect.x1 && b.x < rect.x2 && b.y > rect.y1 && b.y < rect.y2;
  if (inA || inB) return true;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (maxX < rect.x1 || minX > rect.x2 || maxY < rect.y1 || minY > rect.y2) return false;

  if (Math.abs(a.x - b.x) < 0.001) {
    return a.x >= rect.x1 && a.x <= rect.x2 && maxY >= rect.y1 && minY <= rect.y2;
  }
  if (Math.abs(a.y - b.y) < 0.001) {
    return a.y >= rect.y1 && a.y <= rect.y2 && maxX >= rect.x1 && minX <= rect.x2;
  }

  const edges = [
    [{ x: rect.x1, y: rect.y1 }, { x: rect.x2, y: rect.y1 }],
    [{ x: rect.x2, y: rect.y1 }, { x: rect.x2, y: rect.y2 }],
    [{ x: rect.x2, y: rect.y2 }, { x: rect.x1, y: rect.y2 }],
    [{ x: rect.x1, y: rect.y2 }, { x: rect.x1, y: rect.y1 }],
  ];
  return edges.some(edge => getSegmentIntersection(a, b, edge[0], edge[1]));
}

function scorePolylineRoute(points, fromNodeId, toNodeId, routeOpts = {}) {
  const rects = getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts, ROUTING_NODE_PAD);
  const avoidSegments = routeOpts.avoidSegments || [];
  let hits = 0;
  let length = 0;
  let bends = Math.max(0, points.length - 2);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    length += Math.hypot(b.x - a.x, b.y - a.y);
    rects.forEach(rect => {
      if (segmentIntersectsRect(a, b, rect)) hits++;
    });
    if (segmentIntersectsAvoidSegments(a, b, avoidSegments, points[0], points[points.length - 1])) hits++;
  }
  return hits * 100000 + bends * 250 + length;
}

function simplifyPolyline(points) {
  const simplified = [];
  points.forEach(pt => {
    const prev = simplified[simplified.length - 1];
    if (!prev || Math.abs(prev.x - pt.x) > 0.001 || Math.abs(prev.y - pt.y) > 0.001) {
      simplified.push({ x: pt.x, y: pt.y });
    }
  });
  for (let i = simplified.length - 2; i > 0; i--) {
    const a = simplified[i - 1];
    const b = simplified[i];
    const c = simplified[i + 1];
    const sameX = Math.abs(a.x - b.x) < 0.001 && Math.abs(b.x - c.x) < 0.001;
    const sameY = Math.abs(a.y - b.y) < 0.001 && Math.abs(b.y - c.y) < 0.001;
    if (sameX || sameY) simplified.splice(i, 1);
  }
  return simplified;
}

function polylineToPath(points) {
  const simplified = simplifyPolyline(points);
  if (!simplified.length) return '';
  return simplified
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`)
    .join(' ');
}

function getConnectionPathCandidateRoute(from, to, fromPort, toPort, routeOpts) {
  const { fromNodeId, toNodeId } = routeOpts || {};
  const avoidSegments = routeOpts?.avoidSegments || [];
  const stub = 28;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  const xs = [p1.x, p2.x, (p1.x + p2.x) / 2];
  const ys = [p1.y, p2.y, (p1.y + p2.y) / 2];

  getRoutingAvoidRects(fromNodeId, toNodeId, { avoidSegments }).forEach(rect => {
    xs.push(rect.x1 - 18, rect.x2 + 18);
    ys.push(rect.y1 - 18, rect.y2 + 18);
  });

  const candidates = [];
  xs.forEach(x => candidates.push([from, p1, { x, y: p1.y }, { x, y: p2.y }, p2, to]));
  ys.forEach(y => candidates.push([from, p1, { x: p1.x, y }, { x: p2.x, y }, p2, to]));
  candidates.push([from, p1, { x: p1.x, y: p2.y }, p2, to]);
  candidates.push([from, p1, { x: p2.x, y: p1.y }, p2, to]);

  let best = candidates[0];
  let bestScore = Infinity;
  candidates.forEach(route => {
    const points = simplifyPolyline(route);
    const score = scorePolylineRoute(points, fromNodeId, toNodeId, { avoidSegments });
    if (score < bestScore) {
      best = points;
      bestScore = score;
    }
  });
  return polylineToPath(best);
}

function uniqueSortedValues(values) {
  return [...new Set(values
    .filter(v => Number.isFinite(v))
    .map(v => Math.round(v * 1000) / 1000))]
    .sort((a, b) => a - b);
}

function makeGridPointKey(x, y) {
  return `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`;
}

function getConnectionPathVisio(from, to, fromPort, toPort, routeOpts) {
  const { fromNodeId, toNodeId } = routeOpts || {};
  const avoidSegments = routeOpts?.avoidSegments || [];
  const stub = 28;
  const margin = 24;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  const obstacles = getRoutingAvoidRects(fromNodeId, toNodeId, routeOpts);
  const minX = Math.min(from.x, to.x, ...obstacles.map(r => r.x1)) - 80;
  const maxX = Math.max(from.x, to.x, ...obstacles.map(r => r.x2)) + 80;
  const minY = Math.min(from.y, to.y, ...obstacles.map(r => r.y1)) - 80;
  const maxY = Math.max(from.y, to.y, ...obstacles.map(r => r.y2)) + 80;

  const xValues = [minX, maxX, from.x, to.x, p1.x, p2.x, (p1.x + p2.x) / 2];
  const yValues = [minY, maxY, from.y, to.y, p1.y, p2.y, (p1.y + p2.y) / 2];
  obstacles.forEach(rect => {
    xValues.push(rect.x1 - margin, rect.x1, rect.x2, rect.x2 + margin, (rect.x1 + rect.x2) / 2);
    yValues.push(rect.y1 - margin, rect.y1, rect.y2, rect.y2 + margin, (rect.y1 + rect.y2) / 2);
  });

  const xs = uniqueSortedValues(xValues);
  const ys = uniqueSortedValues(yValues);
  const nodes = new Map();
  xs.forEach(x => {
    ys.forEach(y => {
      const pt = { x, y };
      if (obstacles.some(rect => pointInRect(pt, rect))) return;
      nodes.set(makeGridPointKey(x, y), pt);
    });
  });

  const startKey = makeGridPointKey(p1.x, p1.y);
  const goalKey = makeGridPointKey(p2.x, p2.y);
  nodes.set(startKey, p1);
  nodes.set(goalKey, p2);

  const neighbors = new Map();
  const addEdge = (a, b) => {
    if (!a || !b) return;
    if (obstacles.some(rect => segmentIntersectsRect(a, b, rect))) return;
    const ak = makeGridPointKey(a.x, a.y);
    const bk = makeGridPointKey(b.x, b.y);
    const cost = Math.hypot(b.x - a.x, b.y - a.y);
    if (!neighbors.has(ak)) neighbors.set(ak, []);
    if (!neighbors.has(bk)) neighbors.set(bk, []);
    neighbors.get(ak).push({ key: bk, cost });
    neighbors.get(bk).push({ key: ak, cost });
  };

  ys.forEach(y => {
    const row = xs.map(x => nodes.get(makeGridPointKey(x, y))).filter(Boolean);
    for (let i = 0; i < row.length - 1; i++) addEdge(row[i], row[i + 1]);
  });
  xs.forEach(x => {
    const col = ys.map(y => nodes.get(makeGridPointKey(x, y))).filter(Boolean);
    for (let i = 0; i < col.length - 1; i++) addEdge(col[i], col[i + 1]);
  });

  const open = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map([[startKey, Math.hypot(p2.x - p1.x, p2.y - p1.y)]]);
  let guard = 0;
  while (open.size && guard++ < 5000) {
    let current = null;
    let bestF = Infinity;
    open.forEach(key => {
      const f = fScore.get(key) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = key;
      }
    });
    if (current === goalKey) {
      const routed = [nodes.get(goalKey)];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        routed.push(nodes.get(current));
      }
      routed.reverse();
      return polylineToPath([from, p1, ...routed, p2, to]);
    }
    open.delete(current);
    for (const next of neighbors.get(current) || []) {
      const curPt = nodes.get(current);
      const nextPt = nodes.get(next.key);
      const prevKey = cameFrom.get(current);
      const prevPt = prevKey ? nodes.get(prevKey) : null;
      const bendPenalty = prevPt && curPt
        && Math.abs((curPt.x - prevPt.x) * (nextPt.y - curPt.y) - (curPt.y - prevPt.y) * (nextPt.x - curPt.x)) > 0.001
        ? 120
        : 0;
      const tentative = (gScore.get(current) ?? Infinity) + next.cost + bendPenalty;
      if (tentative >= (gScore.get(next.key) ?? Infinity)) continue;
      cameFrom.set(next.key, current);
      gScore.set(next.key, tentative);
      fScore.set(next.key, tentative + Math.hypot(p2.x - nextPt.x, p2.y - nextPt.y));
      open.add(next.key);
    }
  }

  return getConnectionPathCandidateRoute(from, to, fromPort, toPort, routeOpts);
}

function computeBezierControlPoints(from, to, fromPort, toPort, offsetScale, curvature) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const minOffset = 40;
  const maxOffset = 200;
  // Phase 2-2a：curvature 控制曲线弯曲程度（0.1-0.8，默认 0.4）；offsetScale 作为倍率叠加
  const curveFactor = Math.max(0.1, Math.min(0.8, curvature || 0.4));
  let baseOffset = Math.max(minOffset, Math.min(maxOffset, dist * curveFactor)) * (offsetScale || 1);

  const isReverse = (fromPort === toPort) ||
    (fromPort === 'bottom' && toPort === 'top' && dy < -10) ||
    (fromPort === 'top' && toPort === 'bottom' && dy > 10) ||
    (fromPort === 'left' && toPort === 'right' && dx > 10) ||
    (fromPort === 'right' && toPort === 'left' && dx < -10);

  const isOrthogonal =
    (fromPort === 'bottom' && toPort === 'top') ||
    (fromPort === 'top' && toPort === 'bottom') ||
    (fromPort === 'left' && toPort === 'right') ||
    (fromPort === 'right' && toPort === 'left');

  let cp1x;
  let cp1y;
  let cp2x;
  let cp2y;

  if (isReverse) {
    const offset = Math.max(minOffset, Math.min(maxOffset,
      Math.abs(fromPort === 'top' || fromPort === 'bottom' ? dy : dx) * 0.5 + 40) * (offsetScale || 1));
    cp1x = from.x + fd.x * offset;
    cp1y = from.y + fd.y * offset;
    cp2x = to.x + td.x * offset;
    cp2y = to.y + td.y * offset;
  } else {
    cp1x = from.x + fd.x * baseOffset;
    cp1y = from.y + fd.y * baseOffset;
    cp2x = to.x + td.x * baseOffset;
    cp2y = to.y + td.y * baseOffset;
  }

  if (!isReverse) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    for (const node of state.nodes) {
      if (node.x === from.x && node.y === from.y) continue;
      if (node.x === to.x && node.y === to.y) continue;
      if (pointInNodeRect(midX, midY, node, 20)) {
        baseOffset = Math.max(baseOffset, Math.max(node.w, node.h) + 60);
        cp1x = from.x + fd.x * baseOffset;
        cp1y = from.y + fd.y * baseOffset;
        cp2x = to.x + td.x * baseOffset;
        cp2y = to.y + td.y * baseOffset;
        break;
      }
    }
  }

  return { cp1x, cp1y, cp2x, cp2y, isReverse, isOrthogonal };
}

function bezierPathFromControls(from, to, cp1x, cp1y, cp2x, cp2y) {
  return `M${from.x},${from.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${to.x},${to.y}`;
}

function getConnectionPathBezier(from, to, fromPort, toPort, offsetScale, curvature) {
  const { cp1x, cp1y, cp2x, cp2y } = computeBezierControlPoints(from, to, fromPort, toPort, offsetScale, curvature);
  return bezierPathFromControls(from, to, cp1x, cp1y, cp2x, cp2y);
}

/**
 * Phase 2-2b：给 polyline（直角折线）加拐角圆角。
 * 输入 points = [{x,y}, ...]，radius 为圆角半径（0 退化为直角）。
 * 返还原点数组（首尾端点）+ 中间拐角替换为 Q 弧的 SVG path 字串。
 */
function roundedOrthogonalPath(points, radius) {
  if (!Array.isArray(points) || points.length < 2) return '';
  const r = Math.max(0, Math.min(radius || 0, 12));
  if (r === 0 || points.length <= 2) {
    return `M${points[0].x},${points[0].y} ` +
      points.slice(1).map(p => `L${p.x},${p.y}`).join(' ');
  }
  const parts = [`M${points[0].x},${points[0].y}`];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len1 = Math.hypot(dx1, dy1) || 1;
    const len2 = Math.hypot(dx2, dy2) || 1;
    // 截断半径：不能超过相邻段长度的一半
    const rEffective = Math.min(r, len1 / 2, len2 / 2);
    const u1x = dx1 / len1;
    const u1y = dy1 / len1;
    const u2x = dx2 / len2;
    const u2y = dy2 / len2;
    // 弧起点 / 终点
    const arcStart = { x: curr.x - u1x * rEffective, y: curr.y - u1y * rEffective };
    const arcEnd = { x: curr.x + u2x * rEffective, y: curr.y + u2y * rEffective };
    parts.push(`L${arcStart.x},${arcStart.y}`);
    parts.push(`Q${curr.x},${curr.y} ${arcEnd.x},${arcEnd.y}`);
  }
  const last = points[points.length - 1];
  parts.push(`L${last.x},${last.y}`);
  return parts.join(' ');
}

function getConnectionPathOrthogonal(from, to, fromPort, toPort, routeOpts) {
  const stub = 22;
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * stub, y: from.y + fd.y * stub };
  const p2 = { x: to.x + td.x * stub, y: to.y + td.y * stub };
  // Phase 3-1: 圆角半径（可从 routeOpts 或 state 读取，默认 0 = 直角）
  const radius = Math.max(0, Math.min(12,
    (routeOpts && routeOpts.radius != null) ? routeOpts.radius
    : (state && state.orthoCornerRadius != null) ? state.orthoCornerRadius
    : 0));

  let points = [];
  if (fromPort === toPort) {
    if (fromPort === 'bottom' || fromPort === 'top') {
      const yArc = fromPort === 'bottom'
        ? Math.max(p1.y, p2.y) + Math.max(40, Math.abs(p1.x - p2.x) * 0.2 + 30)
        : Math.min(p1.y, p2.y) - Math.max(40, Math.abs(p1.x - p2.x) * 0.2 + 30);
      points = [
        { x: from.x, y: from.y }, p1,
        { x: p1.x, y: yArc },
        { x: p2.x, y: yArc },
        p2, { x: to.x, y: to.y },
      ];
    } else {
      const xArc = fromPort === 'right'
        ? Math.max(p1.x, p2.x) + Math.max(40, Math.abs(p1.y - p2.y) * 0.2 + 30)
        : Math.min(p1.x, p2.x) - Math.max(40, Math.abs(p1.y - p2.y) * 0.2 + 30);
      points = [
        { x: from.x, y: from.y }, p1,
        { x: xArc, y: p1.y },
        { x: xArc, y: p2.y },
        p2, { x: to.x, y: to.y },
      ];
    }
  } else {
    points = [{ x: from.x, y: from.y }, p1];
    if (fd.x === 0 && td.x === 0) {
      const midY = (p1.y + p2.y) / 2;
      points.push({ x: p1.x, y: midY }, { x: p2.x, y: midY });
    } else if (fd.y === 0 && td.y === 0) {
      const midX = (p1.x + p2.x) / 2;
      points.push({ x: midX, y: p1.y }, { x: midX, y: p2.y });
    } else if (fd.x === 0) {
      points.push({ x: p1.x, y: p2.y });
    } else {
      points.push({ x: p2.x, y: p1.y });
    }
    points.push(p2, { x: to.x, y: to.y });
  }
  // 统一走 roundedOrthogonalPath：radius=0 时退化为原直角输出
  return roundedOrthogonalPath(points, radius);
}

function getConnectionPathAvoidance(from, to, fromPort, toPort, routeOpts) {
  const { fromNodeId, toNodeId } = routeOpts || {};
  const avoidSegments = routeOpts?.avoidSegments || [];
  let scale = 1;
  let bestPath = getConnectionPathBezier(from, to, fromPort, toPort, scale);
  let bestHits = Infinity;

  for (let i = 0; i < 8; i++) {
    const { cp1x, cp1y, cp2x, cp2y } = computeBezierControlPoints(from, to, fromPort, toPort, scale);
    const path = bezierPathFromControls(from, to, cp1x, cp1y, cp2x, cp2y);
    const samples = sampleCubicBezier(from, { x: cp1x, y: cp1y }, { x: cp2x, y: cp2y }, to, 12);
    const chordSamples = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      chordSamples.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
    const hits = countPathObstacleHits(
      [...samples, ...chordSamples],
      fromNodeId,
      toNodeId,
      state.routingRules?.obstaclePadding ?? 18,
      { avoidSegments },
    );
    if (hits < bestHits) {
      bestHits = hits;
      bestPath = path;
    }
    if (hits === 0) return path;
    scale += 0.35;
  }

  if (bestHits > 0) {
    return getConnectionPathOrthogonal(from, to, fromPort, toPort);
  }
  return bestPath;
}

function getConnectionPath(from, to, fromPort, toPort, routeOpts) {
  if (routeOpts?.fastRouting) {
    return getConnectionPathBezier(from, to, fromPort, toPort, 1);
  }
  const mode = state.connRouteMode || 'bezier';
  const fn = CONN_ROUTE_ALGORITHMS[mode] || CONN_ROUTE_ALGORITHMS.bezier;
  const path = fn(from, to, fromPort, toPort, routeOpts);
  if (mode === 'visio') return path;
  const samples = sampleSvgPath(path, 8);
  const hits = countPathObstacleHits(
    samples,
    routeOpts?.fromNodeId,
    routeOpts?.toNodeId,
    state.routingRules?.obstaclePadding ?? 12,
    { avoidSegments: routeOpts?.avoidSegments },
  );
  return hits > 0
    ? getConnectionPathVisio(from, to, fromPort, toPort, routeOpts)
    : path;
}

function sampleSvgPath(pathD, curveSteps = 10) {
  const tokens = String(pathD || '').match(/[MLC]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const points = [];
  let i = 0;
  let cmd = '';
  let cur = null;
  while (i < tokens.length) {
    if (/^[MLC]$/i.test(tokens[i])) {
      cmd = tokens[i++].toUpperCase();
    }
    if (cmd === 'M' || cmd === 'L') {
      const x = Number(tokens[i++]);
      const y = Number(tokens[i++]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) break;
      cur = { x, y };
      points.push(cur);
      cmd = 'L';
    } else if (cmd === 'C') {
      const p0 = cur;
      const p1 = { x: Number(tokens[i++]), y: Number(tokens[i++]) };
      const p2 = { x: Number(tokens[i++]), y: Number(tokens[i++]) };
      const p3 = { x: Number(tokens[i++]), y: Number(tokens[i++]) };
      if (!p0 || [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y].some(v => !Number.isFinite(v))) break;
      const sampled = sampleCubicBezier(p0, p1, p2, p3, curveSteps);
      points.push(...sampled.slice(1));
      cur = p3;
    } else {
      i++;
    }
  }
  return points;
}

function getSegmentIntersection(a, b, c, d, opts = {}) {
  const trim = opts.trim ?? 0.04;
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 0.001) return null;
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const t = (dx * s.y - dy * s.x) / denom;
  const u = (dx * r.y - dy * r.x) / denom;
  if (t <= trim || t >= 1 - trim || u <= trim || u >= 1 - trim) return null;
  return {
    x: a.x + t * r.x,
    y: a.y + t * r.y,
    ta: t,
    tb: u,
  };
}

function getCollinearOverlapBridgePoint(a, b, c, d) {
  const horizontal = Math.abs(a.y - b.y) < 0.001 && Math.abs(c.y - d.y) < 0.001 && Math.abs(a.y - c.y) < 0.001;
  const vertical = Math.abs(a.x - b.x) < 0.001 && Math.abs(c.x - d.x) < 0.001 && Math.abs(a.x - c.x) < 0.001;
  if (!horizontal && !vertical) return null;

  const axisA1 = horizontal ? a.x : a.y;
  const axisA2 = horizontal ? b.x : b.y;
  const axisB1 = horizontal ? c.x : c.y;
  const axisB2 = horizontal ? d.x : d.y;
  const aMin = Math.min(axisA1, axisA2);
  const aMax = Math.max(axisA1, axisA2);
  const bMin = Math.min(axisB1, axisB2);
  const bMax = Math.max(axisB1, axisB2);
  const start = Math.max(aMin, bMin);
  const end = Math.min(aMax, bMax);
  if (end - start < 8) return null;
  const mid = (start + end) / 2;
  return horizontal
    ? { x: mid, y: a.y }
    : { x: a.x, y: mid };
}

function getCrossingForSegments(a, b, c, d) {
  const hit = getSegmentIntersection(a, b, c, d);
  if (hit) return hit;
  return getCollinearOverlapBridgePoint(a, b, c, d);
}

function connectionsShareEndpoint(a, b) {
  return a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to;
}

function pointInsideAnyNode(pt, pad = 4) {
  return state.nodes.some(node => pointInNodeRect(pt.x, pt.y, node, pad));
}

function segmentLength(a, b) {
  return Math.hypot((b?.x || 0) - (a?.x || 0), (b?.y || 0) - (a?.y || 0));
}

function pickBridgeSegment(aConn, bConn, aFrom, aTo, bFrom, bTo, aOrder, bOrder) {
  const aLen = segmentLength(aFrom, aTo);
  const bLen = segmentLength(bFrom, bTo);
  if (Math.abs(aLen - bLen) > 0.001) {
    return aLen > bLen
      ? { connId: aConn.id, from: aFrom, to: aTo }
      : { connId: bConn.id, from: bFrom, to: bTo };
  }
  return aOrder > bOrder
    ? { connId: aConn.id, from: aFrom, to: aTo }
    : { connId: bConn.id, from: bFrom, to: bTo };
}

function findConnectionCrossings(dataList) {
  const crossings = new Map();
  dataList.forEach(data => crossings.set(data.conn.id, []));

  for (let i = 0; i < dataList.length; i++) {
    for (let j = i + 1; j < dataList.length; j++) {
      const a = dataList[i];
      const b = dataList[j];
      if (connectionsShareEndpoint(a.conn, b.conn)) continue;
      for (let ai = 0; ai < a.points.length - 1; ai++) {
        for (let bi = 0; bi < b.points.length - 1; bi++) {
          const hit = getCrossingForSegments(a.points[ai], a.points[ai + 1], b.points[bi], b.points[bi + 1]);
          if (!hit || pointInsideAnyNode(hit, 8)) continue;
          const jumpSeg = pickBridgeSegment(
            a.conn,
            b.conn,
            a.points[ai],
            a.points[ai + 1],
            b.points[bi],
            b.points[bi + 1],
            i,
            j,
          );
          crossings.get(jumpSeg.connId)?.push({ from: jumpSeg.from, to: jumpSeg.to, hit });
        }
      }
    }
  }
  return crossings;
}

function buildBridgeSvgFragments(dataList, bridgeBg) {
  const behavior = state.routingRules?.bridgeBehavior || 'jump';
  if (behavior === 'none') return '';
  const crossings = findConnectionCrossings(dataList);
  let svg = '';
  dataList.forEach(data => {
    const items = crossings.get(data.conn.id) || [];
    items.forEach(({ from, to, hit }) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const half = Math.min(12, Math.max(7, len * 0.22));
      const gapHalf = Math.max(3, half - 4);
      const height = state.routingRules?.bridgeSize || 8;
      const p1 = { x: hit.x - ux * half, y: hit.y - uy * half };
      const p2 = { x: hit.x + ux * half, y: hit.y + uy * half };
      const g1 = { x: hit.x - ux * gapHalf, y: hit.y - uy * gapHalf };
      const g2 = { x: hit.x + ux * gapHalf, y: hit.y + uy * gapHalf };
      const cp = { x: hit.x + nx * height, y: hit.y + ny * height };
      const bridgeD = `M${p1.x},${p1.y} Q${cp.x},${cp.y} ${p2.x},${p2.y}`;
      svg += `<path class="connection-bridge-gap" d="M${g1.x},${g1.y} L${g2.x},${g2.y}" fill="none" stroke="${bridgeBg}" stroke-width="${data.width + 4}" stroke-linecap="round" pointer-events="none"/>`;
      if (behavior === 'jump') svg += `<path class="connection-bridge" d="${bridgeD}" fill="none" stroke="${data.color}" stroke-width="${data.width}" stroke-linecap="round" pointer-events="none" data-conn-id="${data.conn.id}"/>`;
    });
  });
  return svg;
}

function getConnLabelLayout(from, to, labelPos, labelOffset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const gap = 12;
  const mode = labelPos || 'auto';
  if (mode === 'custom') return { x: mx + (labelOffset?.x || 0), y: my + (labelOffset?.y || 0), anchor: 'middle', baseline: 'middle' };
  const placeAbove = mode === 'above' || (mode === 'auto' && Math.abs(dx) > Math.abs(dy));
  if (placeAbove) {
    return { x: mx, y: my - gap, anchor: 'middle', baseline: 'auto' };
  }
  return { x: mx + gap, y: my - 2, anchor: 'start', baseline: 'middle' };
}

function getConnectionRenderData(conn, avoidSegments = [], options = {}) {
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return null;

  const effectivePorts = state.routingRules?.endpointLock === false ? computeConnPorts(fromNode, toNode) : conn;
  const fromPort = effectivePorts.fromPort || conn.fromPort;
  const toPort = effectivePorts.toPort || conn.toPort;
  const from = getPortPos(fromNode, fromPort);
  const to = getPortPos(toNode, toPort);
  const isSelected = state.selectedConnectionId === conn.id;
  const color = isSelected ? getThemeVar('--accent', '#6c8cff') : getThemeVar('--conn-color', '#6b6f85');
  const width = isSelected ? 2.5 : 1.8;
  const routeOpts = {
    fromNodeId: conn.from,
    toNodeId: conn.to,
    avoidSegments,
    fastRouting: options.fastRouting,
  };
  const waypoints = Array.isArray(conn.waypoints) ? conn.waypoints : [];
  const pathD = waypoints.length
    ? `M${from.x},${from.y} ${waypoints.map(point => `L${point.x},${point.y}`).join(' ')} L${to.x},${to.y}`
    : getConnectionPath(from, to, fromPort, toPort, routeOpts);
  const points = sampleSvgPath(pathD, 12);
  const layout = conn.label ? getConnLabelLayout(from, to, conn.labelPlacement || conn.labelPos, conn.labelOffset) : null;
  return { conn, color, width, pathD, points, layout };
}

function buildConnectionSvgFragment(data) {
  const { conn, color, width, pathD, layout } = data;
  const markerId = conn.id + '_arrow';
  let svg = `<defs><marker id="${markerId}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L10,4 L0,8 L2,4 Z" fill="${color}"/>
  </marker></defs>`;
  svg += `<path class="connection-hitarea" d="${pathD}" fill="none" stroke="transparent" stroke-width="16" data-conn-id="${conn.id}"/>`;
  svg += `<path class="connection-line" d="${pathD}" fill="none" stroke="${color}" stroke-width="${width}" marker-end="url(#${markerId})" data-conn-id="${conn.id}"/>`;
  if (Array.isArray(conn.waypoints) && conn.waypoints.length && state.selectedConnectionId === conn.id) {
    conn.waypoints.forEach((point, index) => { svg += `<circle class="connection-waypoint${point.locked ? ' locked' : ''}" cx="${point.x}" cy="${point.y}" r="5" data-conn-id="${conn.id}" data-waypoint-index="${index}"/>`; });
  }
  if (conn.label && layout) {
    svg += `<text class="connection-label" data-conn-id="${conn.id}" x="${layout.x}" y="${layout.y}" fill="${color}" font-size="11" text-anchor="${layout.anchor}" dominant-baseline="${layout.baseline}" font-family="DiagramWeaveZh, Microsoft YaHei, sans-serif">${escapeHtml(conn.label)}</text>`;
  }
  return svg;
}

let pendingConnectionRender = false;

function scheduleRenderConnections() {
  if (pendingConnectionRender) return;
  pendingConnectionRender = true;
  requestAnimationFrame(() => {
    pendingConnectionRender = false;
    renderConnections();
  });
}

/** 节点移动会影响避障和交叉桥，统一重绘连线以保持路径一致。 */
function updateConnectionsForNode(nodeId) {
  if (!connectionsLayer || !nodeId) return;
  scheduleRenderConnections();
}

// P2-04/P2-06: 连接层增量渲染 + 事件委托
const connSvgCache = new Map();
let connDelegationBound = false;

function initConnectionEventDelegation() {
  if (connDelegationBound || !connectionsLayer) return;
  connDelegationBound = true;
  connectionsLayer.addEventListener('click', (e) => {
    const el = e.target.closest('[data-conn-id]');
    if (!el) return;
    e.stopPropagation();
    selectConnection(el.dataset.connId);
  });
  connectionsLayer.addEventListener('dblclick', (e) => {
    const el = e.target.closest('[data-conn-id]');
    if (!el) return;
    e.stopPropagation();
    state.selectedConnectionId = el.dataset.connId;
    startConnectionLabelEdit(el.dataset.connId, e);
  });
  connectionsLayer.addEventListener('contextmenu', (e) => {
    const el = e.target.closest('.connection-hitarea, .connection-line');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    state.selectedNodeId = null;
    state.selectedConnectionId = el.dataset.connId;
    renderAll();
    showConnContextMenu(e.clientX, e.clientY, el.dataset.connId);
  });
}

function reconcileConnectionLayer(connFragments, tempSvg) {
  // connFragments: Map<connId, svgString>
  // 移除不再存在的连接组
  const existingGroups = connectionsLayer.querySelectorAll('g[data-conn-group]');
  for (const g of existingGroups) {
    if (!connFragments.has(g.dataset.connGroup)) {
      g.remove();
      connSvgCache.delete(g.dataset.connGroup);
    }
  }
  // 更新或新增连接组
  for (const [connId, frag] of connFragments) {
    if (connSvgCache.get(connId) === frag) continue; // 未变化，跳过 DOM 操作
    connSvgCache.set(connId, frag);
    let g = connectionsLayer.querySelector(`g[data-conn-group="${CSS.escape ? CSS.escape(connId) : connId}"]`);
    if (!g) {
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-conn-group', connId);
      // 插入到 temp 层之前
      const tempLayer = connectionsLayer.querySelector('.conn-temp-layer');
      if (tempLayer) connectionsLayer.insertBefore(g, tempLayer);
      else connectionsLayer.appendChild(g);
    }
    g.innerHTML = frag;
  }
  // 临时连线层（拖拽/重连）始终全量替换
  let tempLayer = connectionsLayer.querySelector('g.conn-temp-layer');
  if (!tempLayer) {
    tempLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tempLayer.setAttribute('class', 'conn-temp-layer');
    connectionsLayer.appendChild(tempLayer);
  }
  tempLayer.innerHTML = tempSvg;
}

function renderConnections() {
  initConnectionEventDelegation();
  const dataList = [];
  const avoidSegments = [];
  const fastRouting = state.nodes.length > 30 || state.connections.length > 30;
  for (const conn of state.connections) {
    const data = getConnectionRenderData(conn, avoidSegments, { fastRouting });
    if (!data) continue;
    dataList.push(data);
    for (let i = 0; i < data.points.length - 1; i++) {
      avoidSegments.push({
        from: data.points[i],
        to: data.points[i + 1],
        connId: data.conn.id,
        fromNodeId: data.conn.from,
        toNodeId: data.conn.to,
      });
    }
  }

  // 构建每条连接的 SVG 片段（keyed by conn.id）
  const connFragments = new Map();
  for (const data of dataList) {
    connFragments.set(data.conn.id, buildConnectionSvgFragment(data));
  }

  // 桥接片段追加到对应连接组
  const bridgeSvg = buildBridgeSvgFragments(dataList, getThemeVar('--canvas-bg', '#13151d'));
  if (bridgeSvg) {
    // 桥接按 data-conn-id 归属，追加到对应连接片段
    const bridgeRe = /data-conn-id="([^"]+)"/g;
    let bm;
    const bridgeParts = bridgeSvg.split(/(?=<path class="connection-bridge)/);
    for (const part of bridgeParts) {
      if (!part.trim()) continue;
      bm = bridgeRe.exec(part);
      bridgeRe.lastIndex = 0;
      if (bm && connFragments.has(bm[1])) {
        connFragments.set(bm[1], connFragments.get(bm[1]) + part);
      }
    }
  }

  // 临时连线（拖拽/重连）
  let tempSvg = '';
  if (state.isReconnecting && state.reconnectConnId && state.connectTempEnd) {
    const conn = state.connections.find(c => c.id === state.reconnectConnId);
    if (conn) {
      const fromNode = state.nodes.find(n => n.id === conn.from);
      const toNode = state.nodes.find(n => n.id === conn.to);
      if (fromNode && toNode) {
        let fixed;
        let tempPort;
        if (state.reconnectEnd === 'from') {
          fixed = getPortPos(toNode, conn.toPort);
          tempPort = getNearestPortByPoint(state.connectTempEnd.x, state.connectTempEnd.y, fromNode);
          const pathD = getConnectionPath(state.connectTempEnd, fixed, tempPort, conn.toPort, {
            fromNodeId: conn.from,
            toNodeId: conn.to,
            avoidSegments,
          });
          tempSvg += `<path class="connection-temp" d="${pathD}" fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
        } else {
          fixed = getPortPos(fromNode, conn.fromPort);
          tempPort = getNearestPortByPoint(state.connectTempEnd.x, state.connectTempEnd.y, toNode);
          const pathD = getConnectionPath(fixed, state.connectTempEnd, conn.fromPort, tempPort, {
            fromNodeId: conn.from,
            toNodeId: conn.to,
            avoidSegments,
          });
          tempSvg += `<path class="connection-temp" d="${pathD}" fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
        }
      }
    }
  }

  if (state.isConnecting && state.connectFrom && state.connectTempEnd) {
    const fromNode = state.nodes.find(n => n.id === state.connectFrom.nodeId);
    if (fromNode) {
      const from = getPortPos(fromNode, state.connectFrom.port);
      const to = state.connectTempEnd;
      const pathD = getConnectionPath(from, to, state.connectFrom.port, 'top', {
        fromNodeId: state.connectFrom.nodeId,
        toNodeId: null,
        avoidSegments,
      });
      tempSvg += `<path class="connection-temp" d="${pathD}"
        fill="none" stroke="#6c8cff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
    }
  }

  reconcileConnectionLayer(connFragments, tempSvg);
  syncConnectionsLayerOrder();

  renderConnEndpointHandles();
  refreshAllNodeBriefs();
  if (state.selectedNodeId && !state.selectedConnectionId) {
    const propNextConn = document.getElementById('propNextConn');
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (propNextConn && node) {
      propNextConn.textContent = formatNodeOutgoingConnections(node) || '（无出线）';
    }
  }
}

function syncConnectionsLayerOrder() {
  if (!connectionsLayer || !canvasTransform) return;
  const firstNode = canvasTransform.querySelector('.node');
  if (firstNode) canvasTransform.insertBefore(connectionsLayer, firstNode);
  else canvasTransform.appendChild(connectionsLayer);
}

function clearConnEndpointHandles() {
  canvasTransform?.querySelectorAll('.conn-handle-node').forEach(el => el.remove());
}

function renderConnEndpointHandles() {
  clearConnEndpointHandles();
  if (!state.selectedConnectionId || presentState.active || state.tool !== 'select') return;

  const conn = state.connections.find(c => c.id === state.selectedConnectionId);
  if (!conn) return;
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return;

  [
    { end: 'from', node: fromNode, port: conn.fromPort },
    { end: 'to', node: toNode, port: conn.toPort },
  ].forEach(({ end, node, port }) => {
    const pos = getPortPos(node, port);
    const el = document.createElement('div');
    el.className = 'conn-handle-node';
    el.dataset.connId = conn.id;
    el.dataset.end = end;
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.title = end === 'from' ? '拖动改起点' : '拖动改终点';
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startReconnect(conn.id, end, e);
    });
    canvasTransform.appendChild(el);
  });
}


  // ===== 命名空间挂载 =====

// ===== 连线端口计算（从 flowchart-editor.js 迁入，Phase 1 拆分第 13 步）=====
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
  const fromNode = state.nodes.find(n => n.id === conn.from);
  const toNode = state.nodes.find(n => n.id === conn.to);
  if (!fromNode || !toNode) return;
  const ports = computeConnPorts(fromNode, toNode);
  conn.fromPort = ports.fromPort;
  conn.toPort = ports.toPort;
}

function isDuplicateConnection(from, to, fromPort, toPort, excludeId = null) {
  return state.connections.some(c =>
    c.id !== excludeId &&
    c.from === from &&
    c.to === to &&
    c.fromPort === fromPort &&
    c.toPort === toPort
  );
}

function autoAdjustPorts() {
  state.connections.forEach(conn => adjustSingleConnPorts(conn));
}

// ===== 渲染连线 =====

const PORT_DIR = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function getPortDirection(port) {
  return PORT_DIR[port] || PORT_DIR.bottom;
}

function normalizePortName(port, fallback = 'bottom') {
  const val = String(port || '').trim().toLowerCase();
  return PORT_DIR[val] ? val : fallback;
}

function initConnRouteAlgorithms() {
  CONN_ROUTE_ALGORITHMS.bezier = (from, to, fromPort, toPort) =>
    getConnectionPathBezier(from, to, fromPort, toPort);
  CONN_ROUTE_ALGORITHMS.orthogonal = (from, to, fromPort, toPort) =>
    getConnectionPathOrthogonal(from, to, fromPort, toPort);
  CONN_ROUTE_ALGORITHMS.avoidance = (from, to, fromPort, toPort, routeOpts) =>
    getConnectionPathAvoidance(from, to, fromPort, toPort, routeOpts);
  CONN_ROUTE_ALGORITHMS.straight = (from, to) =>
    `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  CONN_ROUTE_ALGORITHMS.visio = (from, to, fromPort, toPort, routeOpts) =>
    getConnectionPathVisio(from, to, fromPort, toPort, routeOpts);
  if (typeof DiagramWeaveContent !== 'undefined') {
    DiagramWeaveContent.attachConnAlgorithms(CONN_ROUTE_ALGORITHMS);
  }
}

function registerConnRouteMode(id, label, algorithmId) {
  if (!id || !label) return;
  CONN_ROUTE_LABELS[id] = label;
  const algo = algorithmId || id;
  if (CONN_ROUTE_ALGORITHMS[algo] && !CONN_ROUTE_ALGORITHMS[id]) {
    CONN_ROUTE_ALGORITHMS[id] = CONN_ROUTE_ALGORITHMS[algo];
  }
  if (typeof DiagramWeaveSanitize !== 'undefined' && typeof DiagramWeaveSanitize.registerConnMode === 'function') {
    DiagramWeaveSanitize.registerConnMode(id);
  }
  rebuildConnRouteSelect();
}

function rebuildConnRouteSelect() {
  refreshConnRouteLabelsFromI18n();
  const sel = document.getElementById('connRouteMode');
  if (!sel) return;
  const cur = state.connRouteMode || 'bezier';
  sel.innerHTML = Object.entries(CONN_ROUTE_LABELS).map(([k, v]) =>
    `<option value="${escapeHtml(k)}">${escapeHtml(v)}</option>`).join('');
  if (CONN_ROUTE_LABELS[cur]) sel.value = cur;
}
  global.DiagramWeaveConnectionEngine = {
    pointInNodeRect,
    sampleCubicBezier,
    isPointNear,
    buildLineAvoidRect,
    getRoutingAvoidRects,
    segmentIntersectsAvoidSegments,
    countPathObstacleHits,
    getRoutingObstacleRects,
    pointInRect,
    segmentIntersectsRect,
    scorePolylineRoute,
    simplifyPolyline,
    polylineToPath,
    getConnectionPathCandidateRoute,
    uniqueSortedValues,
    makeGridPointKey,
    computeConnPorts,
    adjustSingleConnPorts,
    isDuplicateConnection,
    autoAdjustPorts,
    PORT_DIR,
    getPortDirection,
    normalizePortName,
    initConnRouteAlgorithms,
    registerConnRouteMode,
    rebuildConnRouteSelect,
    getConnectionPathVisio,
    computeBezierControlPoints,
    bezierPathFromControls,
    roundedOrthogonalPath,
    getConnectionPathBezier,
    getConnectionPathOrthogonal,
    getConnectionPathAvoidance,
    getConnectionPath,
    sampleSvgPath,
    getSegmentIntersection,
    getCollinearOverlapBridgePoint,
    getCrossingForSegments,
    connectionsShareEndpoint,
    pointInsideAnyNode,
    segmentLength,
    pickBridgeSegment,
    findConnectionCrossings,
    buildBridgeSvgFragments,
    getConnLabelLayout,
    getConnectionRenderData,
    buildConnectionSvgFragment,
    scheduleRenderConnections,
    updateConnectionsForNode,
    initConnectionEventDelegation,
    reconcileConnectionLayer,
    renderConnections,
    syncConnectionsLayerOrder,
    clearConnEndpointHandles,
    renderConnEndpointHandles,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
