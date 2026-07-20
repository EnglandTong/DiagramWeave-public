import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../diagramweave-commands.js', import.meta.url), 'utf8');
const context = { globalThis: {} };
context.globalThis = context;
vm.runInNewContext(source, context);
const commands = context.DiagramWeave.commands;

describe('command registry', () => {
  beforeEach(() => commands.clearCommands());

  it('registers and searches bilingual command metadata', () => {
    commands.registerCommand({
      id: 'project.export', labelKey: '导出 / Export', keywords: ['PNG'], shortcut: 'Ctrl+E', run: () => 'ok',
    });
    expect(commands.searchCommands('导出')).toHaveLength(1);
    expect(commands.searchCommands('png')[0].shortcut).toBe('Ctrl+E');
  });

  it('honors enable conditions and standardizes results', async () => {
    commands.registerCommand({ id: 'edit.undo', labelKey: 'Undo', when: ctx => ctx.enabled, run: () => 3 });
    expect((await commands.executeCommand('edit.undo', { enabled: false })).issues[0].code).toBe('COMMAND_DISABLED');
    expect(await commands.executeCommand('edit.undo', { enabled: true })).toEqual({
      success: true, data: 3, issues: [], warnings: [],
    });
  });

  it('rejects duplicate identifiers', () => {
    const command = { id: 'view.zoom', labelKey: 'Zoom', run: () => null };
    commands.registerCommand(command);
    expect(() => commands.registerCommand(command)).toThrow(/already registered/);
  });
});
