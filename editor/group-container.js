/**
 * DiagramWeave Group & Container
 *
 * Phase 2 新增：組合（Group）、容器（Container）、泳道集（Swimlane Set）邏輯。
 * 以 IIFE 掛載到全局命名空間 DiagramWeaveGroupContainer，與現有 editor/*.js 模式一致。
 *
 * 包含：
 * - 組合：groupSelectedNodes / ungroupSelectedNodes / getGroupMemberIds / pruneGroups / selectNodeIds
 * - 容器：toggleContainerMode / wrapSelectionInContainer / unwrapContainer /
 *   getContainerChildren / getContainerDescendants / getContainerDepth / getNodeZIndex /
 *   getMoveSet / moveNodesBy / containerAtPoint / reparentDraggedNode / getRelativePos /
 *   handleNodesDeleted
 * - 泳道集：getSwimlaneSet / resolveLaneNames / createSwimlaneSetFromCurrentLanes
 *
 * 坐標策略：節點一律存儲絕對坐標（所有幾何讀取端零改動）；容器/組合成員通過
 * moveNodesBy 的增量同步維持相對位置不變式；getRelativePos 在需要時暴露相對坐標。
 *
 * 外部依賴（調用時通過全局作用域解析，均為 window 屬性）：
 * - DiagramWeaveEditorCore.state（editor/editor-state.js，加載在前）
 * - flowchart-editor.js 頂層函數：renderAll、renderNode、saveState、showToast、
 *   syncFlowTableHighlight、updateConnectionsForNode
 * - 已提取模塊函數：createNode、getSelectedNodeIds、selectNode
 */
/* global DiagramWeaveEditorCore, createNode, getSelectedNodeIds, renderNode, selectNode, syncFlowTableHighlight, updateConnectionsForNode */
(function initDiagramWeaveGroupContainer(global) {
  'use strict';

  const state = DiagramWeaveEditorCore.state;

  // ===== 辅助 =====
  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function findNode(id) {
    return state.nodes.find(n => n.id === id) || null;
  }

  function selectedIds() {
    return typeof getSelectedNodeIds === 'function' ? getSelectedNodeIds() : [];
  }

  function rerender() {
    if (typeof renderAll === 'function') renderAll();
  }

  // ===== 组合 =====
  function pruneGroups() {
    state.groups = state.groups.filter(g => state.nodes.some(n => n.groupId === g.id));
  }

  function getGroupMemberIds(nodeId) {
    const node = findNode(nodeId);
    if (!node) return [];
    if (!node.groupId) return [node.id];
    return state.nodes.filter(n => n.groupId === node.groupId).map(n => n.id);
  }

  /** 多選一組節點（不依賴 addive toggle），供組選中/容器操作使用 */
  function selectNodeIds(ids) {
    state.selectedNodeIds = [...ids];
    state.selectedNodeId = ids.length ? ids[ids.length - 1] : null;
    state.selectedConnectionId = null;
    rerender();
    if (typeof syncFlowTableHighlight === 'function') syncFlowTableHighlight();
  }

  function groupSelectedNodes() {
    const ids = selectedIds();
    if (ids.length < 2) {
      toast('请至少选择 2 个节点再组合');
      return false;
    }
    const members = ids.map(findNode).filter(Boolean);
    const existingGroupIds = [...new Set(members.map(n => n.groupId).filter(Boolean))];
    if (existingGroupIds.length === 1 && members.every(n => n.groupId)) {
      toast('这些节点已在同一组合中');
      return false;
    }
    if (typeof saveState === 'function') saveState();
    let groupId;
    if (existingGroupIds.length >= 1) {
      // 扩展/合并既有组合：复用第一个组 id，移除被合并的其余组
      groupId = existingGroupIds[0];
      const merged = existingGroupIds.slice(1);
      if (merged.length) state.groups = state.groups.filter(g => !merged.includes(g.id));
    } else {
      groupId = 'group_' + state.nextId++;
    }
    if (!state.groups.some(g => g.id === groupId)) state.groups.push({ id: groupId, name: '' });
    members.forEach(n => { n.groupId = groupId; });
    pruneGroups();
    rerender();
    toast(`已组合 ${members.length} 个节点`);
    return true;
  }

  function ungroupSelectedNodes() {
    const ids = selectedIds();
    const members = ids.map(findNode).filter(Boolean);
    const groupIds = [...new Set(members.map(n => n.groupId).filter(Boolean))];
    if (!groupIds.length) {
      toast('选中的节点不属于任何组合');
      return false;
    }
    if (typeof saveState === 'function') saveState();
    state.nodes.forEach(n => {
      if (n.groupId && groupIds.includes(n.groupId)) delete n.groupId;
    });
    state.groups = state.groups.filter(g => !groupIds.includes(g.id));
    rerender();
    toast('已取消组合');
    return true;
  }

  // ===== 容器 =====
  function getContainerChildren(containerId) {
    return state.nodes.filter(n => n.containerId === containerId);
  }

  /** 递归收集后代（含嵌套容器的子孫），带环保护 */
  function getContainerDescendants(containerId) {
    const out = [];
    const guard = new Set([containerId]);
    const queue = [containerId];
    while (queue.length) {
      const pid = queue.shift();
      for (const child of state.nodes) {
        if (child.containerId !== pid || guard.has(child.id)) continue;
        guard.add(child.id);
        out.push(child);
        if (child.isContainer) queue.push(child.id);
      }
    }
    return out;
  }

  /** 容器链深度：顶层节点/容器为 0，每嵌套一层 +1；环或断链返回 0 */
  function getContainerDepth(node) {
    let depth = 0;
    const seen = new Set([node.id]);
    let cur = node.containerId ? findNode(node.containerId) : null;
    while (cur && depth < 64) {
      if (seen.has(cur.id)) return 0;
      seen.add(cur.id);
      depth += 1;
      cur = cur.containerId ? findNode(cur.containerId) : null;
    }
    return depth;
  }

  /**
   * 堆叠层级：现有 CSS 中 .node 基础 z-index 为 2（selected 3）、泳道背景 0 / 标签 1，
   * 容器统一取 1 —— 沉在普通节点之下、泳道背景之上；嵌套容器之间按 DOM（创建）顺序排序。
   */
  function getNodeZIndex(node) {
    if (node.isContainer) return 1;
    return null;
  }

  /** 相对容器的坐标；无容器时即绝对坐标 */
  function getRelativePos(node) {
    const parent = node.containerId ? findNode(node.containerId) : null;
    return parent ? { x: node.x - parent.x, y: node.y - parent.y } : { x: node.x, y: node.y };
  }

  /**
   * 拖拽/微调时应一起移动的节点 id 集合：
   * 自身（若属于组合则为全组成员）+ 其中每个容器节点的全部后代。
   */
  function getMoveSet(nodeId) {
    const node = findNode(nodeId);
    if (!node) return [];
    const seeds = node.groupId ? getGroupMemberIds(nodeId) : [nodeId];
    const ids = new Set(seeds);
    seeds.forEach(id => {
      const n = findNode(id);
      if (n && n.isContainer) getContainerDescendants(n.id).forEach(d => ids.add(d.id));
    });
    return [...ids];
  }

  /** 按增量移动一批节点（自动展开容器后代），并刷新渲染与连线 */
  function moveNodesBy(ids, dx, dy) {
    if ((!dx && !dy) || !Array.isArray(ids) || !ids.length) return;
    const expanded = new Set();
    ids.forEach(id => {
      const n = findNode(id);
      if (!n) return;
      expanded.add(n.id);
      if (n.isContainer) getContainerDescendants(n.id).forEach(d => expanded.add(d.id));
    });
    expanded.forEach(id => {
      const n = findNode(id);
      n.x += dx;
      n.y += dy;
      if (typeof renderNode === 'function') renderNode(n);
      if (typeof updateConnectionsForNode === 'function') updateConnectionsForNode(n.id);
    });
  }

  /** 命中测试：返回包含 (x,y) 的最上层容器；excludeIds 内的节点（含拖拽节点及其后代）不参与 */
  function containerAtPoint(x, y, excludeIds) {
    const excluded = new Set(excludeIds || []);
    for (let i = state.nodes.length - 1; i >= 0; i--) {
      const n = state.nodes[i];
      if (!n.isContainer || excluded.has(n.id)) continue;
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return n;
    }
    return null;
  }

  /**
   * 拖拽结束后按节点中心点重parent：
   * 落入新容器 → 设置 containerId；拖离所有容器 → 清除；保持原位则不动。
   * 返回是否发生变更（调用方负责 saveState 时机，拖拽场景在 mousedown 已存档）。
   */
  function reparentDraggedNode(node) {
    if (!node) return false;
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    const exclude = [node.id, ...getContainerDescendants(node.id).map(d => d.id)];
    const target = containerAtPoint(cx, cy, exclude);
    const targetId = target ? target.id : null;
    if ((node.containerId || null) === targetId) return false;
    node.containerId = targetId;
    if (typeof renderNode === 'function') renderNode(node);
    return true;
  }

  function toggleContainerMode() {
    const ids = selectedIds();
    if (ids.length !== 1) {
      toast('请选中单个节点切换容器模式');
      return false;
    }
    const node = findNode(ids[0]);
    if (!node) return false;
    if (typeof saveState === 'function') saveState();
    node.isContainer = !node.isContainer;
    if (!node.isContainer) {
      state.nodes.forEach(n => {
        if (n.containerId === node.id) n.containerId = null;
      });
    }
    rerender();
    toast(node.isContainer ? '已转换为容器' : '已解除容器');
    return true;
  }

  /** 以选区外包围盒创建一个容器节点，并将选中节点收纳为子节点 */
  function wrapSelectionInContainer() {
    const ids = selectedIds();
    if (ids.length < 2) {
      toast('请至少选择 2 个节点再包装为容器');
      return false;
    }
    const members = ids.map(findNode).filter(Boolean);
    const PAD = 24;
    const HEADER = 28;
    const minX = Math.min(...members.map(n => n.x)) - PAD;
    const minY = Math.min(...members.map(n => n.y)) - PAD - HEADER;
    const maxX = Math.max(...members.map(n => n.x + n.w)) + PAD;
    const maxY = Math.max(...members.map(n => n.y + n.h)) + PAD;
    if (typeof saveState === 'function') saveState();
    const container = createNode('rectangle', minX, minY, '容器');
    container.w = maxX - minX;
    container.h = maxY - minY;
    container.isContainer = true;
    state.nodes.push(container);
    members.forEach(n => { n.containerId = container.id; });
    if (typeof selectNode === 'function') selectNode(container.id);
    else rerender();
    toast('已包装为容器');
    return container.id;
  }

  /** 移除容器节点本身，直接子节点上移到容器的父级（绝对坐标不变，相对位置自然保持） */
  function unwrapContainer() {
    const ids = selectedIds();
    if (ids.length !== 1) {
      toast('请选中要解除的容器节点');
      return false;
    }
    const node = findNode(ids[0]);
    if (!node || !node.isContainer) {
      toast('选中的节点不是容器');
      return false;
    }
    if (typeof saveState === 'function') saveState();
    const parentRef = node.containerId || null;
    state.nodes.forEach(n => {
      if (n.containerId === node.id) n.containerId = parentRef;
    });
    state.nodes = state.nodes.filter(n => n.id !== node.id);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(node.id);
      if (el) el.remove();
    }
    state.selectedNodeId = null;
    state.selectedNodeIds = [];
    rerender();
    toast('已解除容器');
    return true;
  }

  /** 节点删除后的引用清理：孤儿化被删容器的子节点 + 剪除空组合 */
  function handleNodesDeleted(deletedIds) {
    const deleted = new Set(deletedIds);
    state.nodes.forEach(n => {
      if (n.containerId && deleted.has(n.containerId)) n.containerId = null;
    });
    state.groups = state.groups.filter(g =>
      state.nodes.some(n => n.groupId === g.id && !deleted.has(n.id)));
  }

  // ===== 泳道集 =====
  function getSwimlaneSet(id) {
    return state.swimlaneSets.find(s => s.id === id) || null;
  }

  /**
   * 解析泳道名称：laneIndexes 为排序后的实际 lane 索引数组；
   * 节点引用的泳道集优先提供该索引的名称，缺失回退为「泳道N」合成名。
   */
  function resolveLaneNames(nodes, laneIndexes) {
    const source = nodes || state.nodes;
    const withSet = source.find(n => n.swimlaneSetId && getSwimlaneSet(n.swimlaneSetId));
    const set = withSet ? getSwimlaneSet(withSet.swimlaneSetId) : null;
    return laneIndexes.map(idx => (set && set.lanes[idx] ? set.lanes[idx] : `泳道${idx + 1}`));
  }

  /** 以当前带 lane 的节点为准建立泳道集，并回写 swimlaneSetId */
  function createSwimlaneSetFromCurrentLanes() {
    const laneNodes = state.nodes.filter(n => n.lane !== undefined);
    if (!laneNodes.length) {
      toast('画布上没有泳道节点');
      return null;
    }
    if (typeof saveState === 'function') saveState();
    const laneIndexes = [...new Set(laneNodes.map(n => n.lane || 0))].sort((a, b) => a - b);
    const id = 'laneSet_' + state.nextId++;
    const set = {
      id,
      name: '泳道集 ' + (state.swimlaneSets.length + 1),
      lanes: laneIndexes.map(i => `泳道${i + 1}`),
    };
    state.swimlaneSets.push(set);
    laneNodes.forEach(n => { n.swimlaneSetId = id; });
    rerender();
    toast('已创建泳道集');
    return id;
  }

  // ===== 泳道集 CRUD =====

  /** 重命名泳道集 */
  function renameSwimlaneSet(setId, newName) {
    const set = getSwimlaneSet(setId);
    if (!set || typeof newName !== 'string' || !newName.trim()) return false;
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.beginTransaction === 'function') DiagramWeaveEditorCore.beginTransaction('swimlane');
    if (typeof saveState === 'function') saveState();
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.endTransaction === 'function') DiagramWeaveEditorCore.endTransaction();
    set.name = newName.trim();
    rerender();
    return true;
  }

  /** 向泳道集追加一个泳道，可选插入到指定索引 */
  function addLaneToSet(setId, laneName, insertAt) {
    const set = getSwimlaneSet(setId);
    if (!set) return -1;
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.beginTransaction === 'function') DiagramWeaveEditorCore.beginTransaction('swimlane');
    if (typeof saveState === 'function') saveState();
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.endTransaction === 'function') DiagramWeaveEditorCore.endTransaction();
    const idx = typeof insertAt === 'number' && insertAt >= 0 && insertAt <= set.lanes.length
      ? insertAt
      : set.lanes.length;
    const name = (typeof laneName === 'string' && laneName.trim()) ? laneName.trim() : `泳道${idx + 1}`;
    set.lanes.splice(idx, 0, name);
    // 插入位置之后的所有节点 lane 索引 +1
    state.nodes.forEach(n => {
      if (n.swimlaneSetId === setId && typeof n.lane === 'number' && n.lane >= idx) {
        n.lane += 1;
      }
    });
    rerender();
    return idx;
  }

  /** 重命名泳道 */
  function renameLane(setId, laneIndex, newName) {
    const set = getSwimlaneSet(setId);
    if (!set || laneIndex < 0 || laneIndex >= set.lanes.length) return false;
    if (typeof newName !== 'string' || !newName.trim()) return false;
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.beginTransaction === 'function') DiagramWeaveEditorCore.beginTransaction('swimlane');
    if (typeof saveState === 'function') saveState();
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.endTransaction === 'function') DiagramWeaveEditorCore.endTransaction();
    set.lanes[laneIndex] = newName.trim();
    rerender();
    return true;
  }

  /**
   * 删除泳道。默认把该泳道内的节点移到上一个泳道（若不存在则移到下一个）；
   * 传 reassignTo = -1 则直接清除这些节点的 lane/swimlaneSetId。
   */
  function removeLaneFromSet(setId, laneIndex, reassignTo) {
    const set = getSwimlaneSet(setId);
    if (!set || laneIndex < 0 || laneIndex >= set.lanes.length) return false;
    if (set.lanes.length <= 1) {
      toast('至少保留一条泳道');
      return false;
    }
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.beginTransaction === 'function') DiagramWeaveEditorCore.beginTransaction('swimlane');
    if (typeof saveState === 'function') saveState();
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.endTransaction === 'function') DiagramWeaveEditorCore.endTransaction();

    // 计算节点重映射
    let targetLane = typeof reassignTo === 'number' ? reassignTo : null;
    if (targetLane === null) {
      targetLane = laneIndex > 0 ? laneIndex - 1 : laneIndex + 1;
      if (targetLane >= set.lanes.length - 1) targetLane = set.lanes.length - 2;
    }

    if (targetLane < 0) {
      // -1 模式：解除泳道绑定
      state.nodes.forEach(n => {
        if (n.swimlaneSetId === setId && n.lane === laneIndex) {
          n.lane = undefined;
          n.swimlaneSetId = undefined;
        }
      });
    } else {
      // 重映射 + 压缩索引
      state.nodes.forEach(n => {
        if (n.swimlaneSetId === setId && typeof n.lane === 'number') {
          if (n.lane === laneIndex) {
            n.lane = targetLane;
          } else if (n.lane > laneIndex) {
            n.lane -= 1;
          }
        }
      });
    }

    set.lanes.splice(laneIndex, 1);
    rerender();
    return true;
  }

  /** 删除整个泳道集（同时解除所有节点的绑定） */
  function deleteSwimlaneSet(setId) {
    const idx = state.swimlaneSets.findIndex(s => s.id === setId);
    if (idx === -1) return false;
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.beginTransaction === 'function') DiagramWeaveEditorCore.beginTransaction('swimlane');
    if (typeof saveState === 'function') saveState();
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.endTransaction === 'function') DiagramWeaveEditorCore.endTransaction();
    state.nodes.forEach(n => {
      if (n.swimlaneSetId === setId) {
        n.swimlaneSetId = undefined;
        n.lane = undefined;
      }
    });
    state.swimlaneSets.splice(idx, 1);
    rerender();
    return true;
  }

  /** 把选中节点绑定到某个泳道集的指定泳道 */
  function assignNodesToLane(nodeIds, setId, laneIndex) {
    const set = getSwimlaneSet(setId);
    if (!set || !Array.isArray(nodeIds) || nodeIds.length === 0) return false;
    if (laneIndex < 0 || laneIndex >= set.lanes.length) return false;
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.beginTransaction === 'function') DiagramWeaveEditorCore.beginTransaction('swimlane');
    if (typeof saveState === 'function') saveState();
    if (typeof DiagramWeaveEditorCore !== 'undefined' && typeof DiagramWeaveEditorCore.endTransaction === 'function') DiagramWeaveEditorCore.endTransaction();
    nodeIds.forEach(id => {
      const n = state.nodes.find(x => x.id === id);
      if (n) {
        n.swimlaneSetId = setId;
        n.lane = laneIndex;
      }
    });
    rerender();
    return true;
  }

  // ===== 命名空间挂载 =====
  global.DiagramWeaveGroupContainer = {
    // 组合
    groupSelectedNodes,
    ungroupSelectedNodes,
    getGroupMemberIds,
    pruneGroups,
    selectNodeIds,
    // 容器
    getContainerChildren,
    getContainerDescendants,
    getContainerDepth,
    getNodeZIndex,
    getRelativePos,
    getMoveSet,
    moveNodesBy,
    containerAtPoint,
    reparentDraggedNode,
    toggleContainerMode,
    wrapSelectionInContainer,
    unwrapContainer,
    handleNodesDeleted,
    // 泳道集
    getSwimlaneSet,
    resolveLaneNames,
    createSwimlaneSetFromCurrentLanes,
    renameSwimlaneSet,
    addLaneToSet,
    renameLane,
    removeLaneFromSet,
    deleteSwimlaneSet,
    assignNodesToLane,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
