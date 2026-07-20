(function initRoutingRules(global) {
  'use strict';
  const LABEL_MODES = new Set(['auto', 'above', 'right', 'custom']);
  const BRIDGE_MODES = new Set(['jump', 'gap', 'none']);
  const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;

  function normalizeRules(raw = {}) {
    return {
      endpointLock: raw.endpointLock !== false,
      obstaclePadding: clamp(raw.obstaclePadding, 0, 80, 18),
      bridgeBehavior: BRIDGE_MODES.has(raw.bridgeBehavior) ? raw.bridgeBehavior : 'jump',
      bridgeSize: clamp(raw.bridgeSize, 4, 24, 8),
      defaultLabelPlacement: LABEL_MODES.has(raw.defaultLabelPlacement) ? raw.defaultLabelPlacement : 'auto',
    };
  }

  function normalizeWaypoint(raw) {
    if (!raw || !Number.isFinite(Number(raw.x)) || !Number.isFinite(Number(raw.y))) return null;
    return { x: clamp(raw.x, -100000, 100000, 0), y: clamp(raw.y, -100000, 100000, 0), locked: raw.locked === true };
  }

  function normalizeConnectionRouting(raw = {}, defaultLabelPlacement = 'auto') {
    const mode = LABEL_MODES.has(raw.labelPlacement) ? raw.labelPlacement
      : LABEL_MODES.has(raw.labelPos) ? raw.labelPos : defaultLabelPlacement;
    const result = {
      waypoints: Array.isArray(raw.waypoints) ? raw.waypoints.slice(0, 32).map(normalizeWaypoint).filter(Boolean) : [],
      labelPlacement: mode,
    };
    if (mode === 'custom') {
      result.labelOffset = { x: clamp(raw.labelOffset?.x, -2000, 2000, 0), y: clamp(raw.labelOffset?.y, -2000, 2000, -12) };
    }
    return result;
  }

  global.DiagramWeaveRoutingRules = { normalizeRules, normalizeWaypoint, normalizeConnectionRouting, LABEL_MODES, BRIDGE_MODES };
})(typeof window !== 'undefined' ? window : globalThis);
