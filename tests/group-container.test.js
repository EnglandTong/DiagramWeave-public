import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, beforeEach } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 在 vm 沙箱中依次加载 editor-state.js 与 group-container.js，
 * 并以最小桩替代 DOM / 编辑器全局函数。
 */
function loadModules() {
  const calls = { toast: [], rendered: [], saved: 0, connUpdates: [] };
  const sandbox = {
    console,
    calls,
    showToast: msg => calls.toast.push(msg),
    renderAll: () => calls.rendered.push('all'),
    renderNode: node => calls.rendered.push(node.id),
    updateConnectionsForNode: id => calls.connUpdates.push(id),
    syncFlowTableHighlight: () => {},
    saveState: () => { calls.saved += 1; },
    selectNode: id => { sandbox.__selectedViaSelectNode = id; },
    createNode: (shape, x, y, label) => {
      const state = sandbox.DiagramWeaveEditorCore.state;
      return {
        id: 'node_' + state.nextId++,
        shape, x, y, w: 140, h: 60, label: label || shape,
      };
    },
    getSelectedNodeIds: () => sandbox.DiagramWeaveEditorCore.state.selectedNodeIds,
  };
  vm.runInNewContext(readFileSync(join(root, 'editor', 'editor-state.js'), 'utf8'), sandbox);
  vm.runInNewContext(readFileSync(join(root, 'editor', 'group-container.js'), 'utf8'), sandbox);
  return { sandbox, state: sandbox.DiagramWeaveEditorCore.state, G: sandbox.DiagramWeaveGroupContainer, calls };
}

function mkNode(state, id, extra = {}) {
  const node = { id, shape: 'rectangle', x: 0, y: 0, w: 100, h: 60, label: id, ...extra };
  state.nodes.push(node);
  return node;
}

describe('DiagramWeaveGroupContainer', () => {
  let ctx;
  let state;
  let G;

  beforeEach(() => {
    ctx = loadModules();
    state = ctx.state;
    G = ctx.G;
  });

  // ===== 组合 =====
  describe('组合（Group）', () => {
    it('组合选中节点：创建组并回写 groupId', () => {
      mkNode(state, 'a'); mkNode(state, 'b');
      state.selectedNodeIds = ['a', 'b'];
      expect(G.groupSelectedNodes()).toBe(true);
      expect(state.nodes[0].groupId).toBe('group_1');
      expect(state.nodes[1].groupId).toBe('group_1');
      expect(state.groups).toEqual([{ id: 'group_1', name: '' }]);
      expect(ctx.calls.saved).toBe(1);
    });

    it('少于 2 个节点时拒绝组合', () => {
      mkNode(state, 'a');
      state.selectedNodeIds = ['a'];
      expect(G.groupSelectedNodes()).toBe(false);
      expect(state.groups).toEqual([]);
    });

    it('已全部同组时提示且不重复建组', () => {
      mkNode(state, 'a', { groupId: 'g1' }); mkNode(state, 'b', { groupId: 'g1' });
      state.groups = [{ id: 'g1', name: '' }];
      state.selectedNodeIds = ['a', 'b'];
      expect(G.groupSelectedNodes()).toBe(false);
      expect(state.groups).toHaveLength(1);
    });

    it('扩展既有组：无组节点加入后复用组 id', () => {
      mkNode(state, 'a', { groupId: 'g1' }); mkNode(state, 'b', { groupId: 'g1' }); mkNode(state, 'c');
      state.groups = [{ id: 'g1', name: '' }];
      state.selectedNodeIds = ['a', 'c'];
      expect(G.groupSelectedNodes()).toBe(true);
      expect(state.nodes.find(n => n.id === 'c').groupId).toBe('g1');
      expect(state.groups).toEqual([{ id: 'g1', name: '' }]);
    });

    it('合并多个组：复用第一个组 id，移除被合并组', () => {
      mkNode(state, 'a', { groupId: 'g1' }); mkNode(state, 'b', { groupId: 'g2' });
      state.groups = [{ id: 'g1', name: '' }, { id: 'g2', name: '' }];
      state.selectedNodeIds = ['a', 'b'];
      expect(G.groupSelectedNodes()).toBe(true);
      expect(state.nodes[0].groupId).toBe('g1');
      expect(state.nodes[1].groupId).toBe('g1');
      expect(state.groups).toEqual([{ id: 'g1', name: '' }]);
    });

    it('取消组合：解散选中成员所属的全部组（含未选中成员）', () => {
      mkNode(state, 'a', { groupId: 'g1' }); mkNode(state, 'b', { groupId: 'g1' }); mkNode(state, 'c');
      state.groups = [{ id: 'g1', name: '' }];
      state.selectedNodeIds = ['a'];
      expect(G.ungroupSelectedNodes()).toBe(true);
      expect(state.nodes.every(n => !n.groupId)).toBe(true);
      expect(state.groups).toEqual([]);
    });

    it('取消组合：选中无组节点时返回 false', () => {
      mkNode(state, 'a');
      state.selectedNodeIds = ['a'];
      expect(G.ungroupSelectedNodes()).toBe(false);
    });

    it('getGroupMemberIds 返回全组成员', () => {
      mkNode(state, 'a', { groupId: 'g1' }); mkNode(state, 'b', { groupId: 'g1' }); mkNode(state, 'c');
      expect(G.getGroupMemberIds('a').sort()).toEqual(['a', 'b']);
      expect(G.getGroupMemberIds('c')).toEqual(['c']);
      expect(G.getGroupMemberIds('missing')).toEqual([]);
    });

    it('selectNodeIds 写入选中并触发渲染', () => {
      mkNode(state, 'a'); mkNode(state, 'b');
      G.selectNodeIds(['a', 'b']);
      expect(state.selectedNodeIds).toEqual(['a', 'b']);
      expect(state.selectedNodeId).toBe('b');
      expect(ctx.calls.rendered).toContain('all');
    });
  });

  // ===== 容器 =====
  describe('容器（Container）', () => {
    it('getContainerDescendants 递归收集嵌套后代', () => {
      mkNode(state, 'c1', { isContainer: true });
      mkNode(state, 'c2', { isContainer: true, containerId: 'c1' });
      mkNode(state, 'n1', { containerId: 'c2' });
      mkNode(state, 'n2', { containerId: 'c1' });
      mkNode(state, 'out');
      const ids = G.getContainerDescendants('c1').map(n => n.id).sort();
      expect(ids).toEqual(['c2', 'n1', 'n2']);
    });

    it('getContainerDescendants 对脏数据环不死循环', () => {
      mkNode(state, 'a', { isContainer: true, containerId: 'b' });
      mkNode(state, 'b', { isContainer: true, containerId: 'a' });
      const ids = G.getContainerDescendants('a').map(n => n.id);
      expect(ids).toContain('b');
      expect(ids.length).toBeLessThanOrEqual(2);
    });

    it('getContainerDepth 计算嵌套深度并防御环', () => {
      const c1 = mkNode(state, 'c1', { isContainer: true });
      const c2 = mkNode(state, 'c2', { isContainer: true, containerId: 'c1' });
      const n1 = mkNode(state, 'n1', { containerId: 'c2' });
      expect(G.getContainerDepth(c1)).toBe(0);
      expect(G.getContainerDepth(c2)).toBe(1);
      expect(G.getContainerDepth(n1)).toBe(2);
      c1.containerId = 'n1'; // 人为制造环
      expect(G.getContainerDepth(n1)).toBe(0);
    });

    it('getNodeZIndex：容器统一为 1，普通节点为 null', () => {
      const c1 = mkNode(state, 'c1', { isContainer: true });
      const c2 = mkNode(state, 'c2', { isContainer: true, containerId: 'c1' });
      const n = mkNode(state, 'n');
      expect(G.getNodeZIndex(c1)).toBe(1);
      expect(G.getNodeZIndex(c2)).toBe(1);
      expect(G.getNodeZIndex(n)).toBeNull();
    });

    it('getRelativePos 返回相对容器坐标', () => {
      mkNode(state, 'c1', { isContainer: true, x: 100, y: 50 });
      const n = mkNode(state, 'n', { containerId: 'c1', x: 120, y: 80 });
      expect(G.getRelativePos(n)).toEqual({ x: 20, y: 30 });
      const free = mkNode(state, 'f', { x: 10, y: 20 });
      expect(G.getRelativePos(free)).toEqual({ x: 10, y: 20 });
    });

    it('moveNodesBy 移动容器时同步全部后代', () => {
      mkNode(state, 'c1', { isContainer: true, x: 0, y: 0 });
      mkNode(state, 'n1', { containerId: 'c1', x: 10, y: 10 });
      mkNode(state, 'out', { x: 500, y: 500 });
      G.moveNodesBy(['c1'], 30, 40);
      expect(state.nodes.find(n => n.id === 'c1').x).toBe(30);
      expect(state.nodes.find(n => n.id === 'n1').x).toBe(40);
      expect(state.nodes.find(n => n.id === 'n1').y).toBe(50);
      expect(state.nodes.find(n => n.id === 'out').x).toBe(500);
      expect(ctx.calls.connUpdates).toContain('n1');
    });

    it('getMoveSet：组成员 + 容器后代一起移动', () => {
      mkNode(state, 'a', { groupId: 'g1' });
      mkNode(state, 'b', { groupId: 'g1', isContainer: true });
      mkNode(state, 'child', { containerId: 'b' });
      mkNode(state, 'solo');
      expect(G.getMoveSet('a').sort()).toEqual(['a', 'b', 'child']);
      expect(G.getMoveSet('solo')).toEqual(['solo']);
    });

    it('containerAtPoint 返回最上层容器且排除自身链', () => {
      mkNode(state, 'c1', { isContainer: true, x: 0, y: 0, w: 400, h: 400 });
      mkNode(state, 'c2', { isContainer: true, x: 50, y: 50, w: 100, h: 100 });
      expect(G.containerAtPoint(60, 60, []).id).toBe('c2');
      expect(G.containerAtPoint(300, 300, []).id).toBe('c1');
      expect(G.containerAtPoint(60, 60, ['c2']).id).toBe('c1');
      expect(G.containerAtPoint(900, 900, [])).toBeNull();
    });

    it('reparentDraggedNode：拖入容器 / 拖出容器 / 容器不落入自身后代', () => {
      const c1 = mkNode(state, 'c1', { isContainer: true, x: 0, y: 0, w: 300, h: 300 });
      const n = mkNode(state, 'n', { x: 500, y: 500, w: 50, h: 50 });
      // 拖入
      n.x = 100; n.y = 100;
      expect(G.reparentDraggedNode(n)).toBe(true);
      expect(n.containerId).toBe('c1');
      // 原地不动 → 无变更
      expect(G.reparentDraggedNode(n)).toBe(false);
      // 拖出
      n.x = 800; n.y = 800;
      expect(G.reparentDraggedNode(n)).toBe(true);
      expect(n.containerId).toBeNull();
      // 容器拖到自身后代上方不重parent
      const inner = mkNode(state, 'inner', { isContainer: true, containerId: 'c1', x: 20, y: 20, w: 200, h: 200 });
      c1.x = 40; c1.y = 40; // c1 中心落入 inner 范围
      expect(G.reparentDraggedNode(c1)).toBe(false);
      expect(c1.containerId).toBeUndefined();
    });

    it('toggleContainerMode：开启/关闭并孤儿化子节点', () => {
      const n = mkNode(state, 'n');
      mkNode(state, 'child', { containerId: 'n' });
      state.selectedNodeIds = ['n'];
      expect(G.toggleContainerMode()).toBe(true);
      expect(n.isContainer).toBe(true);
      expect(G.toggleContainerMode()).toBe(true);
      expect(n.isContainer).toBe(false);
      expect(state.nodes.find(x => x.id === 'child').containerId).toBeNull();
      // 多选时拒绝
      state.selectedNodeIds = ['n', 'child'];
      expect(G.toggleContainerMode()).toBe(false);
    });

    it('wrapSelectionInContainer：包围盒 + 收纳子节点', () => {
      mkNode(state, 'a', { x: 100, y: 100, w: 100, h: 60 });
      mkNode(state, 'b', { x: 300, y: 200, w: 100, h: 60 });
      state.selectedNodeIds = ['a', 'b'];
      const containerId = G.wrapSelectionInContainer();
      expect(containerId).toBeTruthy();
      const container = state.nodes.find(n => n.id === containerId);
      expect(container.isContainer).toBe(true);
      // 包围盒：minX=100-24=76, minY=100-24-28=48, maxX=400+24=424, maxY=260+24=284
      expect(container.x).toBe(76);
      expect(container.y).toBe(48);
      expect(container.w).toBe(424 - 76);
      expect(container.h).toBe(284 - 48);
      expect(state.nodes.find(n => n.id === 'a').containerId).toBe(containerId);
      expect(state.nodes.find(n => n.id === 'b').containerId).toBe(containerId);
    });

    it('unwrapContainer：移除容器，直接子节点上移一级', () => {
      mkNode(state, 'outer', { isContainer: true, x: 0, y: 0 });
      mkNode(state, 'inner', { isContainer: true, containerId: 'outer' });
      mkNode(state, 'leaf', { containerId: 'inner' });
      mkNode(state, 'direct', { containerId: 'outer' });
      state.selectedNodeIds = ['outer'];
      expect(G.unwrapContainer()).toBe(true);
      expect(state.nodes.find(n => n.id === 'outer')).toBeUndefined();
      expect(state.nodes.find(n => n.id === 'inner').containerId).toBeNull();
      expect(state.nodes.find(n => n.id === 'direct').containerId).toBeNull();
      expect(state.nodes.find(n => n.id === 'leaf').containerId).toBe('inner');
    });

    it('handleNodesDeleted：被删容器的子节点孤儿化，空组合被剪除', () => {
      mkNode(state, 'c1', { isContainer: true });
      mkNode(state, 'n1', { containerId: 'c1' });
      mkNode(state, 'g', { groupId: 'g1' });
      state.groups = [{ id: 'g1', name: '' }];
      G.handleNodesDeleted(['c1', 'g']);
      expect(state.nodes.find(n => n.id === 'n1').containerId).toBeNull();
      expect(state.groups).toEqual([]);
    });
  });

  // ===== 泳道集 =====
  describe('泳道集（Swimlane Set）', () => {
    it('resolveLaneNames：泳道集命名优先，缺失回退合成名', () => {
      state.swimlaneSets = [{ id: 'ls1', name: 'S', lanes: ['研发', '测试'] }];
      const nodes = [{ lane: 0, swimlaneSetId: 'ls1' }, { lane: 2 }];
      expect(G.resolveLaneNames(nodes, [0, 1, 2])).toEqual(['研发', '测试', '泳道3']);
    });

    it('resolveLaneNames：无泳道集时全部合成', () => {
      expect(G.resolveLaneNames([{ lane: 0 }], [0, 1])).toEqual(['泳道1', '泳道2']);
    });

    it('createSwimlaneSetFromCurrentLanes：建集并回写 swimlaneSetId', () => {
      mkNode(state, 'a', { lane: 0 }); mkNode(state, 'b', { lane: 1 }); mkNode(state, 'c');
      const id = G.createSwimlaneSetFromCurrentLanes();
      expect(id).toBe('laneSet_1');
      expect(state.swimlaneSets).toEqual([{ id: 'laneSet_1', name: '泳道集 1', lanes: ['泳道1', '泳道2'] }]);
      expect(state.nodes.find(n => n.id === 'a').swimlaneSetId).toBe(id);
      expect(state.nodes.find(n => n.id === 'c').swimlaneSetId).toBeUndefined();
    });

    it('createSwimlaneSetFromCurrentLanes：无泳道节点返回 null', () => {
      mkNode(state, 'a');
      expect(G.createSwimlaneSetFromCurrentLanes()).toBeNull();
    });
  });
});
