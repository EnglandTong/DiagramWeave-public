/**
 * 首次 / 启动前环境同步：依赖、vendor、字体
 * 由 start-diagramweave.bat 调用；也可手动 node scripts/setup.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

function commandName(cmd) {
  return isWin && !cmd.endsWith('.cmd') && ['pnpm', 'npm', 'npx', 'corepack'].includes(cmd)
    ? `${cmd}.cmd`
    : cmd;
}

function run(label, cmd, args) {
  console.log(`> ${label}`);
  const r = spawnSync(commandName(cmd), args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (r.status !== 0) {
    console.error(`Setup failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status || 1);
  }
}

function commandOk(cmd, args = ['--version']) {
  const r = spawnSync(commandName(cmd), args, { cwd: root, stdio: 'ignore', shell: false });
  return r.status === 0;
}

function depsReady() {
  return existsSync(join(root, 'node_modules', 'jspdf', 'package.json'));
}

function resolveInstallCommand() {
  if (commandOk('pnpm')) return { cmd: 'pnpm', args: ['install'] };
  if (commandOk('corepack', ['pnpm', '--version'])) {
    run('启用 Corepack pnpm', 'corepack', ['enable']);
    run('准备 pnpm', 'corepack', ['prepare', 'pnpm@11.5.2', '--activate']);
    if (commandOk('pnpm')) return { cmd: 'pnpm', args: ['install'] };
    return { cmd: 'corepack', args: ['pnpm', 'install'] };
  }
  if (commandOk('npm')) return { cmd: 'npm', args: ['install'] };
  return null;
}

if (!depsReady()) {
  const install = resolveInstallCommand();
  if (!install) {
    console.error('未找到 pnpm / npm，无法安装依赖。请先安装 Node.js：https://nodejs.org/');
    process.exit(1);
  }
  run('安装依赖', install.cmd, install.args);
}

run('复制 vendor 运行时', 'node', [join(root, 'scripts/copy-vendor.mjs')]);
run('同步中文字体', 'node', [join(root, 'scripts/download-font.mjs')]);

console.log('DiagramWeave 环境就绪');
