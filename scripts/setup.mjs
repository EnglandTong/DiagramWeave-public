/**
 * Startup environment sync for start-diagramweave.bat.
 *
 * A GitHub source ZIP can include the checked-in vendor runtime files but not
 * node_modules. In that case the app can still start because scripts/serve.mjs
 * only needs Node built-ins. Package manager installation is required only when
 * the runtime files are missing.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

const vendorFiles = [
  'vendor/jspdf.umd.min.js',
  'vendor/svg2pdf.umd.min.js',
  'vendor/dagre.min.js',
  'vendor/xlsx.full.min.js',
];

function commandName(cmd) {
  return isWin && !cmd.endsWith('.cmd') && ['pnpm', 'npm', 'npx', 'corepack'].includes(cmd)
    ? `${cmd}.cmd`
    : cmd;
}

function run(label, cmd, args) {
  console.log(`> ${label}`);
  const result = spawnSync(commandName(cmd), args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`Setup failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

function commandOk(cmd, args = ['--version']) {
  const result = spawnSync(commandName(cmd), args, { cwd: root, stdio: 'ignore', shell: false });
  return result.status === 0;
}

function depsReady() {
  return existsSync(join(root, 'node_modules', 'jspdf', 'package.json'));
}

function vendorReady() {
  return vendorFiles.every((file) => existsSync(join(root, file)));
}

function resolveInstallCommand() {
  if (commandOk('pnpm')) return { cmd: 'pnpm', args: ['install'] };
  if (commandOk('corepack', ['pnpm', '--version'])) {
    run('Enable Corepack pnpm', 'corepack', ['enable']);
    run('Prepare pnpm', 'corepack', ['prepare', 'pnpm@11.5.2', '--activate']);
    if (commandOk('pnpm')) return { cmd: 'pnpm', args: ['install'] };
    return { cmd: 'corepack', args: ['pnpm', 'install'] };
  }
  if (commandOk('npm')) return { cmd: 'npm', args: ['install'] };
  return null;
}

const hasDeps = depsReady();
const hasVendor = vendorReady();

if (!hasDeps && !hasVendor) {
  const install = resolveInstallCommand();
  if (!install) {
    console.error('[ERROR] Runtime files are missing, and pnpm/npm was not found.');
    console.error('Install the official Node.js LTS from https://nodejs.org/ and run this BAT again.');
    console.error('The official Node.js LTS installer includes npm. If node exists but npm is missing, reinstall Node.js LTS and reopen this window.');
    console.error('If this is a release ZIP, download the full release package instead of the source ZIP.');
    process.exit(1);
  }
  run('Install dependencies', install.cmd, install.args);
}

if (depsReady()) {
  run('Copy vendor runtime files', 'node', [join(root, 'scripts/copy-vendor.mjs')]);
} else if (vendorReady()) {
  console.log('Vendor runtime files already present. Skipping dependency install.');
} else {
  console.error('[ERROR] Vendor runtime files are still missing after setup.');
  process.exit(1);
}

run('Sync Chinese font', 'node', [join(root, 'scripts/download-font.mjs')]);

console.log('DiagramWeave environment is ready.');
