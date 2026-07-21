import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs');

function findDiagramWeaveFiles() {
  const files = readdirSync(root, { withFileTypes: true });
  return files
    .filter(f => f.isFile() && f.name.startsWith('diagramweave-') && f.name.endsWith('.js'))
    .map(f => join(root, f.name))
    .sort();
}

function extractExports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const exports = new Set();
  const regex = /global\.(DiagramWeave[\w.]*)\s*=/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    exports.add(match[1]);
  }
  return [...exports].sort();
}

function extractDependencies(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const deps = new Set();
  const patterns = [
    /typeof\s+(?:global\.|window\.)?(DiagramWeave[\w.]+)\s*[!=]==?\s*['"]undefined['"]/g,
    /typeof\s+(?:global\.|window\.)?(DiagramWeave[\w.]+)\s*&&/g,
    /(?:global\.|window\.)?(DiagramWeave[A-Z]\w*)\s*&&\s*typeof\s+(?:global\.|window\.)?\1/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      deps.add(match[1]);
    }
  }
  const directRefs = content.match(/(?:global\.|window\.)(DiagramWeave[A-Z]\w*)/g);
  if (directRefs) {
    for (const ref of directRefs) {
      const name = ref.replace(/^(?:global\.|window\.)/, '');
      deps.add(name);
    }
  }
  return [...deps].sort();
}

function buildGraph() {
  const files = findDiagramWeaveFiles();
  const nodes = [];
  const edges = [];
  const exportToFile = new Map();

  for (const file of files) {
    const fileName = basename(file);
    const exports = extractExports(file);
    const dependencies = extractDependencies(file);

    const nodeId = fileName.replace(/^diagramweave-/, '').replace(/\.js$/, '');
    nodes.push({
      id: nodeId,
      file: fileName,
      path: file,
      exports,
      dependencies,
    });

    for (const exp of exports) {
      const baseName = exp.split('.')[0];
      exportToFile.set(baseName, nodeId);
    }
  }

  for (const node of nodes) {
    const depSet = new Set();
    for (const dep of node.dependencies) {
      const baseName = dep.split('.')[0];
      const targetNode = exportToFile.get(baseName);
      if (targetNode && targetNode !== node.id && !depSet.has(targetNode)) {
        depSet.add(targetNode);
        edges.push({
          from: node.id,
          to: targetNode,
          dependency: dep,
        });
      }
    }
  }

  edges.sort((a, b) => {
    if (a.from !== b.from) return a.from.localeCompare(b.from);
    return a.to.localeCompare(b.to);
  });

  return { nodes, edges, exportToFile: Object.fromEntries(exportToFile) };
}

function generateMermaid(graph) {
  const lines = [];
  lines.push('# DiagramWeave 模块依赖图');
  lines.push('');
  lines.push('> 自动生成 - 基于全局命名空间引用分析');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('');

  for (const node of graph.nodes) {
    const label = `${node.id}\\n[${node.exports.length} exports]`;
    lines.push(`    ${node.id}["${label}"]`);
  }

  lines.push('');

  for (const edge of graph.edges) {
    lines.push(`    ${edge.from} --> ${edge.to}`);
  }

  lines.push('```');
  lines.push('');
  lines.push('## 模块详情');
  lines.push('');

  for (const node of graph.nodes) {
    lines.push(`### ${node.id}`);
    lines.push('');
    lines.push(`- **文件**: \`${node.file}\``);
    lines.push(`- **导出命名空间**: ${node.exports.length > 0 ? node.exports.map(e => `\`${e}\``).join(', ') : '_无_'}`);
    lines.push(`- **依赖模块**: ${node.dependencies.length > 0 ? node.dependencies.map(d => `\`${d}\``).join(', ') : '_无_'}`);
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  console.log('Generating dependency graph...');

  const graph = buildGraph();

  console.log(`Found ${graph.nodes.length} modules`);
  console.log(`Found ${graph.edges.length} dependencies`);

  mkdirSync(docsDir, { recursive: true });

  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    moduleCount: graph.nodes.length,
    dependencyCount: graph.edges.length,
    modules: graph.nodes.map(n => ({
      id: n.id,
      file: n.file,
      exports: n.exports,
      dependencies: n.dependencies,
    })),
    dependencies: graph.edges.map(e => ({
      from: e.from,
      to: e.to,
      dependency: e.dependency,
    })),
    exportMap: graph.exportToFile,
  };

  const jsonPath = join(docsDir, 'dependency-graph.json');
  writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
  console.log(`Wrote ${jsonPath}`);

  const mermaidPath = join(docsDir, 'dependency-graph.md');
  const mermaidContent = generateMermaid(graph);
  writeFileSync(mermaidPath, mermaidContent, 'utf-8');
  console.log(`Wrote ${mermaidPath}`);

  console.log('\nDependency graph generated successfully!');
}

try {
  main();
} catch (err) {
  console.error('Failed to generate dependency graph:', err);
  process.exit(1);
}
