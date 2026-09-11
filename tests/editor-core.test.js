import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEditorCore() {
  const code = readFileSync(join(root, 'editor', 'editor-state.js'), 'utf8');
  const sandbox = {
    DiagramWeaveEditorCore: null,
    JSON,
    Date,
    Math,
    Set,
    setTimeout: () => {},
  };
  vm.runInNewContext(code, sandbox);
  return sandbox.DiagramWeaveEditorCore;
}

describe('DiagramWeaveEditorCore 命名空间', () => {
  it('暴露全部预期 API', () => {
    const core = loadEditorCore();
    expect(core).toBeTruthy();
    const fns = [
      'setTool', 'zoomIn', 'zoomOut', 'zoomReset', 'setZoom', 'updateTransform',
      'clearCanvasNodes', 'captureUndoSnapshot', 'applyUndoSnapshot',
      'saveState', 'undo', 'redo',
    ];
    for (const fn of fns) {
      expect(typeof core[fn], `${fn} should be a function`).toBe('function');
    }
    expect(typeof core.state).toBe('object');
    expect(typeof core.presentState).toBe('object');
    expect(typeof core.projectSession).toBe('object');
    expect(typeof core.CONN_ROUTE_LABELS).toBe('object');
    expect(core.DEFAULT_PROJECT_NAME).toBe('Untitled Project');
    expect(core.DEFAULT_AUTOSAVE_SECONDS).toBe(30);
  });

  it('state 初始字段完整', () => {
    const { state } = loadEditorCore();
    expect(state.nodes).toEqual([]);
    expect(state.connections).toEqual([]);
    expect(state.tool).toBe('select');
    expect(state.zoom).toBe(1);
    expect(state.connRouteMode).toBe('visio');
    expect(state.routingRules.endpointLock).toBe(true);
    expect(state.undoStack).toEqual([]);
    expect(state.redoStack).toEqual([]);
  });
});

describe('undo/redo 闭环（无 DOM 环境）', () => {
  it('saveState 推入快照，undo 恢复先前状态，redo 前移', () => {
    const core = loadEditorCore();
    const { state } = core;

    // 初始状态：1 个节点
    state.nodes = [{ id: 'node_1', x: 10, y: 20 }];
    state.nextId = 2;
    core.saveState();

    // 修改状态
    state.nodes = [{ id: 'node_1', x: 100, y: 200 }, { id: 'node_2', x: 50, y: 50 }];
    state.nextId = 3;
    core.saveState();

    // 再修改
    state.nodes = [];
    state.nextId = 4;

    // undo → 回到 saveState 时的快照（第二次 saveState 推入的是修改后的状态）
    core.undo();
    expect(state.nodes).toHaveLength(2);
    expect(state.nextId).toBe(3);

    // undo → 回到第一次快照
    core.undo();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].x).toBe(10);
    expect(state.nextId).toBe(2);

    // redo → 前移
    core.redo();
    expect(state.nodes).toHaveLength(2);
    expect(state.nextId).toBe(3);
  });

  it('空栈 undo/redo 不抛异常', () => {
    const core = loadEditorCore();
    expect(() => core.undo()).not.toThrow();
    expect(() => core.redo()).not.toThrow();
  });

  it('saveState 后 redoStack 清空', () => {
    const core = loadEditorCore();
    const { state } = core;
    state.nodes = [{ id: 'a' }];
    core.saveState();
    state.nodes = [];
    core.undo();
    expect(state.nodes).toHaveLength(1);
    state.nodes = [{ id: 'b' }];
    core.saveState();
    expect(state.redoStack).toEqual([]);
  });

  it('undoStack 上限 50 条', () => {
    const core = loadEditorCore();
    for (let i = 0; i < 60; i++) core.saveState();
    expect(core.state.undoStack.length).toBeLessThanOrEqual(50);
  });
});

describe('zoom 边界', () => {
  it('setZoom 限制在 0.2–3 之间', () => {
    const core = loadEditorCore();
    core.setZoom(10);
    expect(core.state.zoom).toBe(3);
    core.setZoom(0.01);
    expect(core.state.zoom).toBe(0.2);
    core.setZoom(1.5);
    expect(core.state.zoom).toBe(1.5);
  });

  it('zoomReset 恢复 zoom=1 且 pan 归零', () => {
    const core = loadEditorCore();
    core.state.panX = 100;
    core.state.panY = -50;
    core.setZoom(2);
    core.zoomReset();
    expect(core.state.zoom).toBe(1);
    expect(core.state.panX).toBe(0);
    expect(core.state.panY).toBe(0);
  });
});

describe('setTool 无 DOM 安全', () => {
  it('无 document 时仅更新 state.tool 不抛异常', () => {
    const core = loadEditorCore();
    expect(() => core.setTool('connect')).not.toThrow();
    expect(core.state.tool).toBe('connect');
    expect(() => core.setTool('pan')).not.toThrow();
    expect(core.state.tool).toBe('pan');
  });
});

describe('captureUndoSnapshot 降级路径', () => {
  it('无 DiagramWeave 时返回 version:1 纯状态快照', () => {
    const core = loadEditorCore();
    core.state.nodes = [{ id: 'x' }];
    core.state.connections = [{ id: 'c1' }];
    const snap = core.captureUndoSnapshot();
    expect(snap.version).toBe(1);
    expect(snap.nodes).toEqual([{ id: 'x' }]);
    expect(snap.connections).toEqual([{ id: 'c1' }]);
    expect(snap.connRouteMode).toBe('visio');
  });
});
