(function initDiagramWeaveCommands(global) {
  'use strict';

  const registry = new Map();

  function registerCommand(command) {
    if (!command || typeof command !== 'object') throw new TypeError('command must be an object');
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(command.id || '')) throw new Error('command.id is invalid');
    if (typeof command.labelKey !== 'string' || !command.labelKey) throw new Error('command.labelKey is required');
    if (typeof command.run !== 'function') throw new Error('command.run must be a function');
    if (registry.has(command.id)) throw new Error(`command already registered: ${command.id}`);
    const normalized = {
      id: command.id,
      labelKey: command.labelKey,
      label: command.label || command.labelKey,
      keywords: Array.isArray(command.keywords) ? command.keywords.map(String) : [],
      shortcut: command.shortcut || '',
      when: typeof command.when === 'function' ? command.when : () => true,
      run: command.run,
    };
    registry.set(normalized.id, normalized);
    return normalized;
  }

  function listCommands(context) {
    return [...registry.values()].filter(command => {
      try { return command.when(context) !== false; } catch { return false; }
    });
  }

  function searchCommands(query, context) {
    const needle = String(query || '').trim().toLocaleLowerCase();
    const commands = listCommands(context);
    if (!needle) return commands;
    return commands.filter(command => [command.id, command.label, command.labelKey, ...command.keywords]
      .join(' ')
      .toLocaleLowerCase()
      .includes(needle));
  }

  async function executeCommand(id, context) {
    const command = registry.get(id);
    if (!command) return { success: false, data: null, issues: [{ code: 'COMMAND_NOT_FOUND', id }], warnings: [] };
    if (!command.when(context)) return { success: false, data: null, issues: [{ code: 'COMMAND_DISABLED', id }], warnings: [] };
    try {
      const data = await command.run(context);
      return { success: true, data: data ?? null, issues: [], warnings: [] };
    } catch (error) {
      return {
        success: false,
        data: null,
        issues: [{ code: 'COMMAND_FAILED', id, message: error?.message || String(error) }],
        warnings: [],
      };
    }
  }

  function clearCommands() {
    registry.clear();
  }

  global.DiagramWeave = global.DiagramWeave || {};
  global.DiagramWeave.commands = {
    registerCommand,
    listCommands,
    searchCommands,
    executeCommand,
    clearCommands,
  };
})(typeof window !== 'undefined' ? window : globalThis);
