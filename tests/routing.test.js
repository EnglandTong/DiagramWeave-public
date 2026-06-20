import { describe, expect, it } from 'vitest';

function getSegmentIntersection(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 0.001) return null;
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const t = (dx * s.y - dy * s.x) / denom;
  const u = (dx * r.y - dy * r.x) / denom;
  if (t <= 0.04 || t >= 0.96 || u <= 0.04 || u >= 0.96) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

function pickBridgeConnection(orderA, orderB, connA, connB) {
  if (orderA === orderB) return null;
  return orderA > orderB ? connA : connB;
}

function getIgnoredRoutingNodeIds(fromNodeId, toNodeId) {
  return new Set([fromNodeId, toNodeId].filter(Boolean));
}

function nodeToObstacleRect(node, pad) {
  return {
    id: node.id,
    x1: node.x - pad,
    y1: node.y - pad,
    x2: node.x + node.w + pad,
    y2: node.y + node.h + pad,
  };
}

function buildRoutingNoGoZones(nodes, fromNodeId, toNodeId, pad) {
  const ignoredIds = getIgnoredRoutingNodeIds(fromNodeId, toNodeId);
  return nodes
    .filter(node => !ignoredIds.has(node.id))
    .map(node => nodeToObstacleRect(node, pad));
}

function nearestPortCandidate(mx, my, node) {
  const anchors = {
    top: { x: 0.5, y: 0 },
    bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 },
    right: { x: 1, y: 0.5 },
  };
  let port = 'top';
  let distance = Infinity;
  Object.entries(anchors).forEach(([name, anchor]) => {
    const px = node.x + node.w * anchor.x;
    const py = node.y + node.h * anchor.y;
    const dist = Math.hypot(px - mx, py - my);
    if (dist < distance) {
      port = name;
      distance = dist;
    }
  });
  return { port, distance };
}

function getPortPos(node, port) {
  const anchors = {
    top: { x: 0.5, y: 0 },
    bottom: { x: 0.5, y: 1 },
    left: { x: 0, y: 0.5 },
    right: { x: 1, y: 0.5 },
  };
  const anchor = anchors[port];
  return { x: node.x + node.w * anchor.x, y: node.y + node.h * anchor.y };
}

function getPortDirection(port) {
  if (port === 'top') return { x: 0, y: -1 };
  if (port === 'bottom') return { x: 0, y: 1 };
  if (port === 'left') return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function pointInRect(pt, rect) {
  return pt.x > rect.x1 && pt.x < rect.x2 && pt.y > rect.y1 && pt.y < rect.y2;
}

function segmentIntersectsRect(a, b, rect) {
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (maxX < rect.x1 || minX > rect.x2 || maxY < rect.y1 || minY > rect.y2) {
    return false;
  }
  const edges = [
    [{ x: rect.x1, y: rect.y1 }, { x: rect.x2, y: rect.y1 }],
    [{ x: rect.x2, y: rect.y1 }, { x: rect.x2, y: rect.y2 }],
    [{ x: rect.x2, y: rect.y2 }, { x: rect.x1, y: rect.y2 }],
    [{ x: rect.x1, y: rect.y2 }, { x: rect.x1, y: rect.y1 }],
  ];
  return edges.some(edge => getSegmentIntersection(a, b, edge[0], edge[1]));
}

function buildLineAvoidRect(seg, padding) {
  if (!seg?.from || !seg?.to || !Number.isFinite(padding) || padding <= 0) return null;
  return {
    x1: Math.min(seg.from.x, seg.to.x) - padding,
    y1: Math.min(seg.from.y, seg.to.y) - padding,
    x2: Math.max(seg.from.x, seg.to.x) + padding,
    y2: Math.max(seg.from.y, seg.to.y) + padding,
  };
}

function getRoutingAvoidRects(fromNodeId, toNodeId, nodes, avoidSegments, nodePad = 18, linePad = 12) {
  const rects = buildRoutingNoGoZones(nodes, fromNodeId, toNodeId, nodePad);
  avoidSegments.forEach(seg => {
    const box = buildLineAvoidRect(seg, linePad);
    if (box) rects.push(box);
  });
  return rects;
}

function isPointNear(pt1, pt2, tolerance) {
  return Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y) <= tolerance;
}

function segmentIntersectsLineSegment(a, b, c, d) {
  if (Math.hypot(a.x - c.x, a.y - c.y) <= 1e-9 || Math.hypot(a.x - d.x, a.y - d.y) <= 1e-9) return null;
  return getSegmentIntersection(a, b, c, d, { trim: 0.0001 });
}

function hasHardLineCollision(a, b, existingSegs, start, end) {
  for (const seg of existingSegs) {
    const hit = segmentIntersectsLineSegment(a, b, seg.from, seg.to);
    if (!hit) continue;
    if (isPointNear(hit, start, 10) || isPointNear(hit, end, 10)) continue;
    return true;
  }
  return false;
}

function countPathPenalty(points, rects, existingSegs, firstPoint, lastPoint) {
  let hits = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (const rect of rects) {
      if (segmentIntersectsRect(a, b, rect)) hits += 1;
    }
    if (hasHardLineCollision(a, b, existingSegs, firstPoint, lastPoint)) hits += 1;
  }
  return hits;
}

function pathLength(points) {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    length += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return length;
}

function routeOrthogonalPoints(fromNode, toNode, fromPort, toPort, opts) {
  const nodes = opts.nodes || [];
  const avoidSegments = opts.avoidSegments || [];
  const from = getPortPos(fromNode, fromPort);
  const to = getPortPos(toNode, toPort);
  const fd = getPortDirection(fromPort);
  const td = getPortDirection(toPort);
  const p1 = { x: from.x + fd.x * 28, y: from.y + fd.y * 28 };
  const p2 = { x: to.x + td.x * 28, y: to.y + td.y * 28 };
  const xs = [p1.x, p2.x, (p1.x + p2.x) / 2];
  const ys = [p1.y, p2.y, (p1.y + p2.y) / 2];

  getRoutingAvoidRects(fromNode.id, toNode.id, nodes, avoidSegments).forEach(rect => {
    xs.push(rect.x1 - 18, rect.x2 + 18);
    ys.push(rect.y1 - 18, rect.y2 + 18);
  });

  const uniq = arr => [...new Set(arr)];
  const xSorted = uniq(xs.filter(x => Number.isFinite(x))).sort((a, b) => a - b);
  const ySorted = uniq(ys.filter(y => Number.isFinite(y))).sort((a, b) => a - b);

  const candidates = [];
  xSorted.forEach(x => candidates.push([from, p1, { x, y: p1.y }, { x, y: p2.y }, to]));
  ySorted.forEach(y => candidates.push([from, p1, { x: p1.x, y }, { x: p2.x, y }, to]));
  candidates.push([from, p1, { x: p1.x, y: p2.y }, to]);
  candidates.push([from, p1, { x: p2.x, y: p1.y }, to]);

  const avoidRects = getRoutingAvoidRects(fromNode.id, toNode.id, nodes, avoidSegments, 18, 12);
  let best = null;
  let bestScore = Infinity;

  for (const route of candidates) {
    const points = route.filter((p, i) => i === 0 || p.x !== route[i - 1].x || p.y !== route[i - 1].y);
    const score = countPathPenalty(points, avoidRects, avoidSegments, from, to) * 100000
      + Math.max(0, points.length - 2) * 250
      + pathLength(points);
    if (score < bestScore) {
      bestScore = score;
      best = points;
    }
  }

  return { points: best, score: bestScore, collisions: countPathPenalty(best, avoidRects, avoidSegments, from, to) };
}

function toSegments(points) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    segs.push({ from: points[i], to: points[i + 1] });
  }
  return segs;
}

function countSegmentCrossings(newSegments, existingSegments) {
  let hits = 0;
  for (const s1 of newSegments) {
    for (const s2 of existingSegments) {
      const hit = getSegmentIntersection(s1.from, s1.to, s2.from, s2.to, { trim: 0.0001 });
      if (!hit) continue;
      if ((Math.abs(s1.from.x - hit.x) < 1e-6 && Math.abs(s1.from.y - hit.y) < 1e-6) ||
          (Math.abs(s1.to.x - hit.x) < 1e-6 && Math.abs(s1.to.y - hit.y) < 1e-6) ||
          (Math.abs(s2.from.x - hit.x) < 1e-6 && Math.abs(s2.from.y - hit.y) < 1e-6) ||
          (Math.abs(s2.to.x - hit.x) < 1e-6 && Math.abs(s2.to.y - hit.y) < 1e-6)) {
        continue;
      }
      hits += 1;
    }
  }
  return hits;
}

function countSegmentOverlaps(newSegments, existingSegments, minOverlap = 2) {
  let overlaps = 0;
  for (const aSeg of newSegments) {
    const aVertical = Math.abs(aSeg.from.x - aSeg.to.x) < 1e-9;
    const aHorizontal = Math.abs(aSeg.from.y - aSeg.to.y) < 1e-9;

    for (const bSeg of existingSegments) {
      const bVertical = Math.abs(bSeg.from.x - bSeg.to.x) < 1e-9;
      const bHorizontal = Math.abs(bSeg.from.y - bSeg.to.y) < 1e-9;
      if (!(aVertical || aHorizontal) || !(bVertical || bHorizontal) || aVertical !== bVertical) {
        continue;
      }

      if (aVertical) {
        if (Math.abs(aSeg.from.x - bSeg.from.x) > 1e-6) {
          continue;
        }
        const aMin = Math.min(aSeg.from.y, aSeg.to.y);
        const aMax = Math.max(aSeg.from.y, aSeg.to.y);
        const bMin = Math.min(bSeg.from.y, bSeg.to.y);
        const bMax = Math.max(bSeg.from.y, bSeg.to.y);
        const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);
        if (overlap > minOverlap) overlaps += 1;
      } else if (aHorizontal) {
        if (Math.abs(aSeg.from.y - bSeg.from.y) > 1e-6) {
          continue;
        }
        const aMin = Math.min(aSeg.from.x, aSeg.to.x);
        const aMax = Math.max(aSeg.from.x, aSeg.to.x);
        const bMin = Math.min(bSeg.from.x, bSeg.to.x);
        const bMax = Math.max(bSeg.from.x, bSeg.to.x);
        const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);
        if (overlap > minOverlap) overlaps += 1;
      }
    }
  }
  return overlaps;
}

describe('connection routing helpers', () => {
  it('detects orthogonal segment intersection', () => {
    const hit = getSegmentIntersection(
      { x: 0, y: 50 }, { x: 100, y: 50 },
      { x: 50, y: 0 }, { x: 50, y: 100 },
    );
    expect(hit).toEqual({ x: 50, y: 50 });
  });

  it('assigns bridge to higher-numbered connection', () => {
    expect(pickBridgeConnection(3, 1, 'conn_3', 'conn_1')).toBe('conn_3');
    expect(pickBridgeConnection(1, 4, 'conn_1', 'conn_4')).toBe('conn_4');
    expect(pickBridgeConnection(2, 2, 'conn_2', 'conn_x')).toBeNull();
  });

  it('keeps source and target out of intermediate no-go zones', () => {
    const nodes = [
      { id: 'from', x: 0, y: 0, w: 100, h: 60 },
      { id: 'middle', x: 140, y: 0, w: 100, h: 60 },
      { id: 'to', x: 280, y: 0, w: 100, h: 60 },
    ];
    const rects = buildRoutingNoGoZones(nodes, 'from', 'to', 20);
    expect(rects.map(rect => rect.id)).toEqual(['middle']);
    expect(rects[0]).toMatchObject({ x1: 120, y1: -20, x2: 260, y2: 80 });
  });

  it('requires connection release to be near a port before snapping to a node', () => {
    const node = { x: 100, y: 100, w: 140, h: 60 };
    expect(nearestPortCandidate(170, 100, node).distance).toBe(0);
    expect(nearestPortCandidate(170, 130, node).distance).toBeGreaterThan(28);
  });

  it('keeps rerouted connections from re-entering previous line corridors in dense crossings', () => {
    const nodes = [
      { id: 'leftTop', x: 40, y: 60, w: 60, h: 50 },
      { id: 'rightTop', x: 520, y: 60, w: 60, h: 50 },
      { id: 'leftMid', x: 40, y: 210, w: 60, h: 50 },
      { id: 'rightMid', x: 520, y: 210, w: 60, h: 50 },
      { id: 'leftBottom', x: 40, y: 360, w: 60, h: 50 },
      { id: 'rightBottom', x: 520, y: 360, w: 60, h: 50 },
      { id: 'centerTop', x: 280, y: 10, w: 60, h: 50 },
      { id: 'centerBottom', x: 280, y: 430, w: 60, h: 50 },
    ];

    const pairs = [
      ['leftTop', 'rightBottom'],
      ['rightTop', 'leftBottom'],
      ['leftMid', 'rightMid'],
      ['centerTop', 'centerBottom'],
      ['leftTop', 'rightTop'],
      ['leftBottom', 'rightBottom'],
    ];

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const existing = [];

    const routed = pairs.map(([fromId, toId], idx) => {
      const fromNode = nodeById.get(fromId);
      const toNode = nodeById.get(toId);
      const route = routeOrthogonalPoints(fromNode, toNode, 'right', 'left', {
        nodes,
        avoidSegments: existing,
      });
      expect(route).not.toBeNull();
      expect(route.collisions).toBeLessThanOrEqual(4);

      const newSegs = toSegments(route.points);
      const crossings = countSegmentCrossings(newSegs, existing);
      expect(crossings).toBeLessThanOrEqual(2);
      expect(countSegmentOverlaps(newSegs, existing, 2)).toBeLessThanOrEqual(1);
      existing.push(...newSegs);
      return { id: `${fromId}->${toId}`, idx, points: route.points };
    });

    const totalPoints = routed.map(item => item.points.length).reduce((acc, cur) => acc + cur, 0);
    expect(totalPoints).toBeGreaterThan(pairs.length * 3);
  });

  it('keeps a braid of alternating lanes with no segment stacking in overlap-pressure zone', () => {
    const nodes = [
      { id: 'srcTop', x: 20, y: 70, w: 60, h: 44 },
      { id: 'srcMidTop', x: 20, y: 170, w: 60, h: 44 },
      { id: 'srcMid', x: 20, y: 270, w: 60, h: 44 },
      { id: 'srcBottom', x: 20, y: 370, w: 60, h: 44 },
      { id: 'dstTop', x: 540, y: 70, w: 60, h: 44 },
      { id: 'dstMidTop', x: 540, y: 170, w: 60, h: 44 },
      { id: 'dstMid', x: 540, y: 270, w: 60, h: 44 },
      { id: 'dstBottom', x: 540, y: 370, w: 60, h: 44 },
      { id: 'obsA', x: 260, y: 30, w: 90, h: 70 },
      { id: 'obsB', x: 260, y: 170, w: 90, h: 70 },
      { id: 'obsC', x: 260, y: 310, w: 90, h: 70 },
    ];

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const existing = [];
    const paths = [];

    const pairs = [
      ['srcTop', 'dstBottom'],
      ['srcBottom', 'dstTop'],
      ['srcMidTop', 'dstMid'],
      ['srcMid', 'dstMidTop'],
      ['srcTop', 'dstTop'],
      ['srcMid', 'dstMid'],
      ['srcBottom', 'dstBottom'],
      ['srcMidTop', 'dstBottom'],
    ];

    pairs.forEach(([fromId, toId], order) => {
      const route = routeOrthogonalPoints(
        nodeById.get(fromId),
        nodeById.get(toId),
        'right',
        'left',
        { nodes, avoidSegments: existing },
      );
      expect(route).not.toBeNull();
      expect(route.collisions).toBeLessThanOrEqual(16);

      const segs = toSegments(route.points);
      expect(countSegmentCrossings(segs, existing)).toBeLessThanOrEqual(2);
      expect(countSegmentOverlaps(segs, existing, 1)).toBeLessThanOrEqual(3);

      if (order > 0) {
        expect(paths.some(path => JSON.stringify(path) === JSON.stringify(route.points))).toBe(false);
      }
      paths.push(route.points);
      existing.push(...segs);
    });

    expect(paths).toHaveLength(pairs.length);
  });

  it('replays the same flow repeatedly and keeps each attempt on a new lane', () => {
    const nodes = [
      { id: 'A', x: 110, y: 210, w: 70, h: 46 },
      { id: 'B', x: 560, y: 210, w: 70, h: 46 },
      { id: 'blockTop', x: 220, y: 100, w: 70, h: 50 },
      { id: 'blockMidTop', x: 320, y: 125, w: 70, h: 60 },
      { id: 'blockMid', x: 300, y: 210, w: 90, h: 50 },
      { id: 'blockMidBottom', x: 340, y: 285, w: 70, h: 60 },
      { id: 'blockBottom', x: 220, y: 360, w: 70, h: 50 },
    ];

    const existing = [];
    const source = nodes.find(node => node.id === 'A');
    const target = nodes.find(node => node.id === 'B');

    const first = routeOrthogonalPoints(source, target, 'right', 'left', { nodes, avoidSegments: existing });
    expect(first.collisions).toBeLessThanOrEqual(1);
    const firstSegs = toSegments(first.points);
    expect(countSegmentOverlaps(firstSegs, existing, 1)).toBe(0);
    expect(firstSegs.length).toBeGreaterThanOrEqual(2);
    existing.push(...firstSegs);

  for (let i = 0; i < 7; i += 1) {
      const route = routeOrthogonalPoints(source, target, 'right', 'left', { nodes, avoidSegments: existing });
      const segs = toSegments(route.points);

      expect(countSegmentCrossings(segs, existing)).toBeLessThanOrEqual(2);
      expect(route.points.length).toBeGreaterThanOrEqual(first.points.length);
      existing.push(...segs);
    }

  });

  it('builds pressure case where sequential same-endpoint routes will detour instead of overlapping', () => {
    const nodes = [
      { id: 'source', x: 160, y: 180, w: 70, h: 50 },
      { id: 'target', x: 520, y: 190, w: 70, h: 50 },
      { id: 'blockTop', x: 320, y: 120, w: 60, h: 50 },
      { id: 'blockBottom', x: 320, y: 290, w: 60, h: 50 },
    ];

    const source = nodes.find(n => n.id === 'source');
    const target = nodes.find(n => n.id === 'target');
    const existing = [];

    const first = routeOrthogonalPoints(source, target, 'right', 'left', {
      nodes,
      avoidSegments: existing,
    });
    expect(first.collisions).toBe(0);
    existing.push(...toSegments(first.points));

    const second = routeOrthogonalPoints(source, target, 'right', 'left', {
      nodes,
      avoidSegments: existing,
    });
    const secondSegs = toSegments(second.points);
    const secondCross = countSegmentCrossings(secondSegs, existing);
    expect(secondCross).toBe(0);
    expect(second.points.length).toBeGreaterThan(first.points.length);
  });
});
