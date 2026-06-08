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

function executableCandidates(cmd) {
  const normalized = commandName(cmd);
  if (!isWin || !['npm.cmd', 'npx.cmd', 'corepack.cmd'].includes(normalized)) return [normalized];

  const candidates = [
    normalized,
    join(dirname(process.execPath), normalized),
  ];
  if (process.env.ProgramFiles) candidates.push(join(process.env.ProgramFiles, 'nodejs', normalized));
  if (process.env['ProgramFiles(x86)']) candidates.push(join(process.env['ProgramFiles(x86)'], 'nodejs', normalized));
  return [...new Set(candidates)];
}

function run(label, cmd, args) {
  console.log(`> ${label}`);
  let lastResult = null;
  for (const candidate of executableCandidates(cmd)) {
    if (candidate !== commandName(cmd) && !existsSync(candidate)) continue;
    const result = spawnSync(candidate, args, {
      cwd: root,
      stdio: 'inherit',
      shell: false,
    });
    lastResult = result;
    if (!result.error && result.status === 0) return;
    if (result.error?.code === 'ENOENT') continue;
    break;
  }
  if (lastResult?.error) console.error(lastResult.error.message);
  if (lastResult?.status !== 0) {
    console.error(`Setup failed: ${cmd} ${args.join(' ')}`);
    process.exit(lastResult?.status || 1);
  }
}

function commandOk(cmd, args = ['--version']) {
  for (const candidate of executableCandidates(cmd)) {
    if (candidate !== commandName(cmd) && !existsSync(candidate)) continue;
    const result = spawnSync(candidate, args, { cwd: root, stdio: 'ignore', shell: false });
    if (!result.error && result.status === 0) return true;
  }
  return false;
}

function npmCliCandidates() {
  const nodeDir = dirname(process.execPath);
  const candidates = [
    join(nodeDir, 'node_modules/npm/bin/npm-cli.js'),
  ];
  if (process.env.ProgramFiles) candidates.push(join(process.env.ProgramFiles, 'nodejs/node_modules/npm/bin/npm-cli.js'));
  if (process.env['ProgramFiles(x86)']) candidates.push(join(process.env['ProgramFiles(x86)'], 'nodejs/node_modules/npm/bin/npm-cli.js'));
  return [...new Set(candidates)];
}

function resolveNpmCli() {
  for (const cli of npmCliCandidates()) {
    if (!existsSync(cli)) continue;
    const result = spawnSync(process.execPath, [cli, '--version'], { cwd: root, stdio: 'ignore', shell: false });
    if (!result.error && result.status === 0) return cli;
  }
  return null;
}

function resolveCommand(cmd) {
  for (const candidate of executableCandidates(cmd)) {
    if (candidate !== commandName(cmd) && !existsSync(candidate)) continue;
    const result = spawnSync(candidate, ['--version'], { cwd: root, stdio: 'ignore', shell: false });
    if (!result.error && result.status === 0) return candidate;
  }
  return null;
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
  const npmCli = resolveNpmCli();
  if (npmCli) return { cmd: process.execPath, args: [npmCli, 'install'] };
  const npmCmd = resolveCommand('npm');
  if (npmCmd) return { cmd: npmCmd, args: ['install'] };
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
