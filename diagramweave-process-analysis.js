(function (root) {
  'use strict';

  const number = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const byId = (a, b) => String(a.id).localeCompare(String(b.id));

  function stronglyConnected(nodeIds, outgoing) {
    let nextIndex = 0;
    const stack = [], onStack = new Set(), index = new Map(), low = new Map(), groups = [];
    function visit(id) {
      index.set(id, nextIndex); low.set(id, nextIndex++); stack.push(id); onStack.add(id);
      (outgoing.get(id) || []).forEach(to => {
        if (!index.has(to)) { visit(to); low.set(id, Math.min(low.get(id), low.get(to))); }
        else if (onStack.has(to)) low.set(id, Math.min(low.get(id), index.get(to)));
      });
      if (low.get(id) !== index.get(id)) return;
      const group = []; let item;
      do { item = stack.pop(); onStack.delete(item); group.push(item); } while (item !== id);
      groups.push(group.sort());
    }
    nodeIds.slice().sort().forEach(id => { if (!index.has(id)) visit(id); });
    return groups.sort((a, b) => a[0].localeCompare(b[0]));
  }

  function analyzePage(page, projectSla) {
    const nodes = (page.nodes || []).slice().sort(byId);
    const nodeMap = new Map(nodes.map(node => [String(node.id), node]));
    const outgoing = new Map(nodes.map(node => [String(node.id), []]));
    const incoming = new Map(nodes.map(node => [String(node.id), []]));
    (page.connections || []).forEach(connection => {
      const from = String(connection.from ?? connection.source ?? '');
      const to = String(connection.to ?? connection.target ?? '');
      if (!nodeMap.has(from) || !nodeMap.has(to)) return;
      outgoing.get(from).push(to); incoming.get(to).push(from);
    });
    outgoing.forEach(list => list.sort()); incoming.forEach(list => list.sort());

    const starts = nodes.map(node => String(node.id)).filter(id => incoming.get(id).length === 0);
    const reachable = new Set(), queue = starts.slice();
    while (queue.length) { const id = queue.shift(); if (reachable.has(id)) continue; reachable.add(id); queue.push(...outgoing.get(id)); }
    const unreachable = nodes.filter(node => !reachable.has(String(node.id))).map(node => String(node.id));

    const groups = stronglyConnected(nodes.map(node => String(node.id)), outgoing);
    const groupOf = new Map(); groups.forEach((group, i) => group.forEach(id => groupOf.set(id, i)));
    const cycles = groups.filter(group => group.length > 1 || outgoing.get(group[0]).includes(group[0]));
    const groupEdges = groups.map(() => new Set()), indegree = groups.map(() => 0);
    outgoing.forEach((targets, from) => targets.forEach(to => {
      const a = groupOf.get(from), b = groupOf.get(to); if (a === b || groupEdges[a].has(b)) return;
      groupEdges[a].add(b); indegree[b] += 1;
    }));
    const groupWeight = groups.map(group => group.reduce((sum, id) => sum + number(nodeMap.get(id).duration), 0));
    const distance = groupWeight.slice(), previous = groups.map(() => -1), ready = indegree.map((value, i) => value === 0 ? i : -1).filter(i => i >= 0);
    ready.sort((a, b) => groups[a][0].localeCompare(groups[b][0]));
    while (ready.length) {
      const current = ready.shift();
      [...groupEdges[current]].sort((a, b) => groups[a][0].localeCompare(groups[b][0])).forEach(next => {
        const candidate = distance[current] + groupWeight[next];
        if (candidate > distance[next]) { distance[next] = candidate; previous[next] = current; }
        indegree[next] -= 1; if (indegree[next] === 0) { ready.push(next); ready.sort((a, b) => groups[a][0].localeCompare(groups[b][0])); }
      });
    }
    let end = distance.reduce((best, value, i) => value > distance[best] ? i : best, 0);
    const criticalGroups = []; if (groups.length) { while (end >= 0) { criticalGroups.unshift(end); end = previous[end]; } }
    const criticalPath = criticalGroups.flatMap(i => groups[i]);

    const bottlenecks = nodes.filter(node => {
      const id = String(node.id); return incoming.get(id).length > 1 || outgoing.get(id).length > 1;
    }).map(node => ({ nodeId: String(node.id), incoming: incoming.get(String(node.id)).length, outgoing: outgoing.get(String(node.id)).length }));
    const roleMap = new Map();
    nodes.forEach(node => { const role = String(node.role || '').trim() || 'Unassigned'; const row = roleMap.get(role) || { role, nodeCount: 0, duration: 0 }; row.nodeCount += 1; row.duration += number(node.duration); roleMap.set(role, row); });
    const roleLoad = [...roleMap.values()].sort((a, b) => b.duration - a.duration || a.role.localeCompare(b.role));
    const waits = nodes.map(node => ({ nodeId: String(node.id), days: number(node.waitDuration ?? node.waitDays) })).filter(row => row.days > 0).sort((a, b) => b.days - a.days || a.nodeId.localeCompare(b.nodeId));
    const slaDays = number(page.slaDays ?? projectSla) || null;
    const criticalDuration = groups.length ? distance[Math.max(0, distance.indexOf(Math.max(...distance)))] : 0;
    return {
      pageId: String(page.id || ''), pageName: String(page.name || page.id || ''), nodeCount: nodes.length,
      criticalPath, criticalDuration, unreachable, bottlenecks, roleLoad, longestWait: waits[0] || null,
      cycles, sla: { configured: slaDays !== null, days: slaDays, risk: slaDays !== null && criticalDuration > slaDays, overBy: slaDays === null ? 0 : Math.max(0, criticalDuration - slaDays) },
    };
  }

  function analyzeProcess(document) {
    const pages = (document?.pages || []).map(page => analyzePage(page, document?.slaDays));
    return {
      pages,
      summary: {
        pageCount: pages.length,
        unreachableCount: pages.reduce((sum, page) => sum + page.unreachable.length, 0),
        bottleneckCount: pages.reduce((sum, page) => sum + page.bottlenecks.length, 0),
        cycleCount: pages.reduce((sum, page) => sum + page.cycles.length, 0),
        slaRiskCount: pages.filter(page => page.sla.risk).length,
        labels: { zh: '流程分析摘要', en: 'Process analysis summary' },
      },
    };
  }

  root.DiagramWeaveProcessAnalysis = Object.freeze({ analyzeProcess });
})(typeof globalThis !== 'undefined' ? globalThis : window);
