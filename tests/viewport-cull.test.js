import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeEach } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 在 vm 沙箱中依次加载 editor-state.js 与 viewport-nav.js。
 * options:
 * - withDom: 提供 fake document（canvasWrapper 1000x800）
 * - withRaf: 提供可控的 requestAnimationFrame 桩
 */
function loadModules({ withDom = true, withRaf = true } = {}) {
  const calls = { renderAllNodes: 0 };
  const rafQueue = [];
  const canvasWrapper = { clientWidth: 1000, clientHeight: 800 };
  const sandbox = {
    console,
    calls,
    rafQueue,
    renderAllNodes: () => { calls.renderAllNodes += 1; },
  };
  if (withDom) {
    sandbox.document = {
      getElementById: id => (id === 'canvasWrapper' ? canvasWrapper : null),
    };
  }
  if (withRaf) {
    sandbox.requestAnimationFrame = cb => { rafQueue.push(cb); return rafQueue.length; };
  }
  vm.runInNewContext(readFileSync(join(root, 'editor', 'editor-state.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'editor', 'viewport-nav.js'), 'utf8'), sandbox);
  return {
    sandbox,
    state: sandbox.DiagramWeaveEditorCore.state,
    V: sandbox.DiagramWeaveViewportNav,
    calls,
    rafQueue,
    canvasWrapper,
  };
}

describe('DiagramWeaveViewportNav 视口裁剪（Phase 3）', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadModules();
  });

  // ===== 纯函数 AABB 测试 =====
  describe('nodeInViewport', () => {
    const bounds = { x: 0, y: 0, w: 1000, h: 800 };

    it('完全在视口内的节点可见', () => {
      expect(ctx.V.nodeInViewport({ x: 100, y: 100, w: 140, h: 60 }, bounds)).toBe(true);
    });

    it('远离视口的节点不可见', () => {
      expect(ctx.V.nodeInViewport({ x: 5000, y: 5000, w: 140, h: 60 }, bounds)).toBe(false);
      expect(ctx.V.nodeInViewport({ x: -5000, y: -5000, w: 140, h: 60 }, bounds)).toBe(false);
    });

    it('视口外但在 CULL_MARGIN(200) 内仍可见', () => {
      // 右缘外 150px：node.x=1150 <= 1000+200
      expect(ctx.V.nodeInViewport({ x: 1150, y: 100, w: 140, h: 60 }, bounds)).toBe(true);
      // 左缘外：node.x+w=-150 >= 0-200
      expect(ctx.V.nodeInViewport({ x: -290, y: 100, w: 140, h: 60 }, bounds)).toBe(true);
      // 下缘外：node.y=950 <= 800+200
      expect(ctx.V.nodeInViewport({ x: 100, y: 950, w: 140, h: 60 }, bounds)).toBe(true);
    });

    it('超出 CULL_MARGIN 的节点不可见', () => {
      // node.x=1300 > 1200
      expect(ctx.V.nodeInViewport({ x: 1300, y: 100, w: 140, h: 60 }, bounds)).toBe(false);
      // node.x+w=-250 < -200
      expect(ctx.V.nodeInViewport({ x: -390, y: 100, w: 140, h: 60 }, bounds)).toBe(false);
    });

    it('边界恰好相切时可见（含等号）', () => {
      expect(ctx.V.nodeInViewport({ x: 1200, y: 0, w: 10, h: 10 }, bounds)).toBe(true);
      expect(ctx.V.nodeInViewport({ x: 1201, y: 0, w: 10, h: 10 }, bounds)).toBe(false);
    });

    it('支持自定义 margin', () => {
      const node = { x: 1050, y: 0, w: 10, h: 10 };
      expect(ctx.V.nodeInViewport(node, bounds, 0)).toBe(false);
      expect(ctx.V.nodeInViewport(node, bounds, 100)).toBe(true);
    });

    it('node 或 bounds 为空时视为可见', () => {
      expect(ctx.V.nodeInViewport(null, bounds)).toBe(true);
      expect(ctx.V.nodeInViewport({ x: 0, y: 0, w: 10, h: 10 }, null)).toBe(true);
    });

    it('CULL_MARGIN 常量为 200', () => {
      expect(ctx.V.CULL_MARGIN).toBe(200);
    });
  });

  // ===== 视口矩形计算 =====
  describe('getViewportBounds', () => {
    it('根据 pan/zoom 换算世界坐标矩形', () => {
      ctx.state.panX = -100;
      ctx.state.panY = -50;
      ctx.state.zoom = 2;
      expect(ctx.V.getViewportBounds()).toEqual({ x: 50, y: 25, w: 500, h: 400 });
    });

    it('默认 pan=0 zoom=1 时等于容器尺寸', () => {
      const b = ctx.V.getViewportBounds();
      expect(b.x).toBeCloseTo(0); // -0（0 取反）与 0 数值相等
      expect(b.y).toBeCloseTo(0);
      expect(b.w).toBe(1000);
      expect(b.h).toBe(800);
    });

    it('无 DOM 环境返回 null（跳过裁剪）', () => {
      const noDom = loadModules({ withDom: false });
      expect(noDom.V.getViewportBounds()).toBeNull();
      expect(noDom.V.nodeInViewport({ x: 99999, y: 99999, w: 10, h: 10 }, noDom.V.getViewportBounds())).toBe(true);
    });
  });

  // ===== rAF 节流调度 =====
  describe('scheduleViewportCull', () => {
    it('同一帧内多次调度只触发一次 renderAllNodes', () => {
      ctx.V.scheduleViewportCull();
      ctx.V.scheduleViewportCull();
      ctx.V.scheduleViewportCull();
      expect(ctx.rafQueue).toHaveLength(1);
      expect(ctx.calls.renderAllNodes).toBe(0);
      ctx.rafQueue.shift()();
      expect(ctx.calls.renderAllNodes).toBe(1);
    });

    it('帧回调执行后可再次调度', () => {
      ctx.V.scheduleViewportCull();
      ctx.rafQueue.shift()();
      ctx.V.scheduleViewportCull();
      expect(ctx.rafQueue).toHaveLength(1);
      ctx.rafQueue.shift()();
      expect(ctx.calls.renderAllNodes).toBe(2);
    });

    it('无 requestAnimationFrame 时同步渲染', () => {
      const noRaf = loadModules({ withRaf: false });
      noRaf.V.scheduleViewportCull();
      expect(noRaf.calls.renderAllNodes).toBe(1);
    });
  });

  // ===== updateTransform 钩子集成 =====
  describe('updateTransform → scheduleViewportCull', () => {
    it('updateTransform 调用全局 scheduleViewportCull 别名', () => {
      // 模拟 monolith 的 var scheduleViewportCull = DiagramWeaveViewportNav.scheduleViewportCull
      ctx.sandbox.scheduleViewportCull = ctx.V.scheduleViewportCull;
      ctx.state.zoom = 1.5;
      ctx.sandbox.DiagramWeaveEditorCore.updateTransform();
      expect(ctx.rafQueue).toHaveLength(1);
      ctx.rafQueue.shift()();
      expect(ctx.calls.renderAllNodes).toBe(1);
    });

    it('未注册别名时 updateTransform 不报错', () => {
      ctx.state.zoom = 1.5;
      expect(() => ctx.sandbox.DiagramWeaveEditorCore.updateTransform()).not.toThrow();
      expect(ctx.calls.renderAllNodes).toBe(0);
    });
  });
});
