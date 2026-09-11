import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeEach } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 在 vm 沙箱中依次加载 editor-state.js 与 align-guides.js */
function loadModules({ withDom = false } = {}) {
  const children = [];
  const sandbox = { console, children };
  if (withDom) {
    const host = { appendChild: el => children.push(el) };
    sandbox.document = {
      getElementById: id => (id === 'canvasTransform' ? host : null),
      createElement: () => ({ style: {}, isConnected: true }),
    };
  }
  vm.runInNewContext(readFileSync(join(root, 'editor', 'editor-state.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'editor', 'align-guides.js'), 'utf8'), sandbox);
  return { sandbox, state: sandbox.DiagramWeaveEditorCore.state, A: sandbox.DiagramWeaveAlignGuides, children };
}

function mkNode(state, id, x, y, w = 140, h = 60) {
  const node = { id, shape: 'rectangle', x, y, w, h, label: id };
  state.nodes.push(node);
  return node;
}

describe('DiagramWeaveAlignGuides 智能对齐线（Phase 3）', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadModules();
  });

  // ===== 包围盒 =====
  describe('bboxOf', () => {
    it('空数组返回 null', () => {
      expect(ctx.A.bboxOf([])).toBeNull();
      expect(ctx.A.bboxOf(null)).toBeNull();
    });

    it('多节点取联合包围盒', () => {
      const box = ctx.A.bboxOf([
        { x: 100, y: 100, w: 140, h: 60 },
        { x: 300, y: 200, w: 100, h: 80 },
      ]);
      expect(box).toEqual({ minX: 100, minY: 100, maxX: 400, maxY: 280, cx: 250, cy: 190 });
    });
  });

  // ===== 纯函数吸附计算 =====
  describe('computeSnapForBounds', () => {
    const moving = { minX: 100, minY: 100, maxX: 240, maxY: 160, cx: 170, cy: 130 };
    const TH = 6;

    it('左边缘吸附（垂直辅助线）', () => {
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 104, cx: 174, maxX: 244, minY: 500, cy: 530, maxY: 560 }], 0, 0, TH);
      expect(r.dx).toBe(4);
      expect(r.guides.v).toBe(104);
    });

    it('中心吸附', () => {
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 300, cx: 173, maxX: 440, minY: 500, cy: 530, maxY: 560 }], 0, 0, TH);
      expect(r.dx).toBe(3);
      expect(r.guides.v).toBe(173);
    });

    it('右边缘吸附', () => {
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 0, cx: 120, maxX: 245, minY: 500, cy: 530, maxY: 560 }], 0, 0, TH);
      expect(r.dx).toBe(5);
      expect(r.guides.v).toBe(245);
    });

    it('上/水平中线/下边缘吸附（水平辅助线）', () => {
      const top = ctx.A.computeSnapForBounds(moving, [{ minX: 500, cx: 570, maxX: 640, minY: 103, cy: 400, maxY: 460 }], 0, 0, TH);
      expect(top.dy).toBe(3);
      expect(top.guides.h).toBe(103);
      const mid = ctx.A.computeSnapForBounds(moving, [{ minX: 500, cx: 570, maxX: 640, minY: 0, cy: 128, maxY: 460 }], 0, 0, TH);
      expect(mid.dy).toBe(-2);
      expect(mid.guides.h).toBe(128);
      const bottom = ctx.A.computeSnapForBounds(moving, [{ minX: 500, cx: 570, maxX: 640, minY: 0, cy: 400, maxY: 165 }], 0, 0, TH);
      expect(bottom.dy).toBe(5);
      expect(bottom.guides.h).toBe(165);
    });

    it('超出阈值不吸附', () => {
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 107, cx: 500, maxX: 600, minY: 500, cy: 530, maxY: 560 }], 0, 0, TH);
      expect(r.dx).toBe(0);
      expect(r.guides.v).toBeNull();
    });

    it('恰好等于阈值时吸附（含等号）', () => {
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 106, cx: 500, maxX: 600, minY: 500, cy: 530, maxY: 560 }], 0, 0, TH);
      expect(r.dx).toBe(6);
      expect(r.guides.v).toBe(106);
    });

    it('多候选取距离最小者', () => {
      const r = ctx.A.computeSnapForBounds(moving, [
        { minX: 104, cx: 900, maxX: 950, minY: 800, cy: 830, maxY: 860 },
        { minX: 102, cx: 900, maxX: 950, minY: 800, cy: 830, maxY: 860 },
      ], 0, 0, TH);
      expect(r.dx).toBe(2);
      expect(r.guides.v).toBe(102);
    });

    it('tentative 增量下吸附：最终位置恰好落在参考线上', () => {
      // dx=10 → 左缘 tentative 110；静态左缘 113（距离 3）→ dx'=13，最终 100+13=113
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 113, cx: 900, maxX: 950, minY: 800, cy: 830, maxY: 860 }], 10, 0, TH);
      expect(r.dx).toBe(13);
      expect(moving.minX + r.dx).toBe(113);
    });

    it('双轴同时吸附', () => {
      const r = ctx.A.computeSnapForBounds(moving, [{ minX: 104, cx: 900, maxX: 950, minY: 103, cy: 830, maxY: 860 }], 0, 0, TH);
      expect(r.dx).toBe(4);
      expect(r.dy).toBe(3);
      expect(r.guides).toEqual({ v: 104, h: 103 });
    });

    it('无静态包围盒时原样返回', () => {
      const r = ctx.A.computeSnapForBounds(moving, [], 7, 8, TH);
      expect(r).toEqual({ dx: 7, dy: 8, guides: { v: null, h: null } });
    });
  });

  // ===== 基于 state 的吸附 =====
  describe('computeSnap', () => {
    it('拖拽集合以联合包围盒参与吸附，其余节点为目标', () => {
      mkNode(ctx.state, 'a', 100, 100); // moving
      mkNode(ctx.state, 'b', 150, 300); // moving
      mkNode(ctx.state, 'c', 404, 500); // static：左缘 404 vs 联合 maxX 290 → 超阈值
      ctx.state.zoom = 1;
      const r = ctx.A.computeSnap(['a', 'b'], 108, 0); // 联合 maxX 290+108=398，距 404 为 6 → 吸附
      expect(r.dx).toBe(114);
      expect(r.guides.v).toBe(404);
    });

    it('阈值按 zoom 换算（屏幕像素恒定 6）', () => {
      mkNode(ctx.state, 'a', 100, 100);
      mkNode(ctx.state, 'c', 105, 500); // 世界距离 5
      ctx.state.zoom = 1;
      expect(ctx.A.computeSnap(['a'], 0, 0).guides.v).toBe(105); // 5 ≤ 6 → 吸附
      ctx.state.zoom = 2; // 世界阈值 3 → 5 > 3 不吸附
      const r2 = ctx.A.computeSnap(['a'], 0, 0);
      expect(r2.guides.v).toBeNull();
      ctx.state.zoom = 0.5; // 世界阈值 12 → 吸附
      expect(ctx.A.computeSnap(['a'], 0, 0).guides.v).toBe(105);
    });

    it('移动节点自身不作为吸附目标', () => {
      mkNode(ctx.state, 'a', 100, 100);
      ctx.state.zoom = 1;
      const r = ctx.A.computeSnap(['a'], 3, 3);
      expect(r).toEqual({ dx: 3, dy: 3, guides: { v: null, h: null } });
    });

    it('movingIds 为空时原样返回', () => {
      mkNode(ctx.state, 'a', 100, 100);
      const r = ctx.A.computeSnap([], 5, 5);
      expect(r).toEqual({ dx: 5, dy: 5, guides: { v: null, h: null } });
    });

    it('SNAP_THRESHOLD 常量为 6', () => {
      expect(ctx.A.SNAP_THRESHOLD).toBe(6);
    });
  });

  // ===== 辅助线渲染 =====
  describe('showGuides / hideGuides', () => {
    it('无 DOM 环境调用不抛错', () => {
      expect(() => ctx.A.showGuides(100, 200)).not.toThrow();
      expect(() => ctx.A.hideGuides()).not.toThrow();
    });

    it('有 DOM 时惰性创建两条辅助线并定位', () => {
      const dom = loadModules({ withDom: true });
      dom.A.showGuides(120, null);
      expect(dom.children).toHaveLength(2); // V 与 H 一并创建
      const [v, h] = dom.children;
      expect(v.id).toBe('alignGuideV');
      expect(v.className).toBe('align-guide align-guide-v');
      expect(v.style.display).toBe('block');
      expect(v.style.left).toBe('120px');
      expect(v.style.height).toBe('100000px');
      expect(h.style.display).toBe('none');

      dom.A.showGuides(null, 80);
      expect(v.style.display).toBe('none');
      expect(h.style.display).toBe('block');
      expect(h.style.top).toBe('80px');
      expect(h.style.width).toBe('100000px');

      dom.A.hideGuides();
      expect(v.style.display).toBe('none');
      expect(h.style.display).toBe('none');
    });
  });
});
