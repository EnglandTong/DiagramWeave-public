import { describe, expect, it } from 'vitest';

/**
 * DW-P0-01 extension invoke contract shape (documented kernel boundary).
 * Runtime modules may return this shape from extension handlers.
 */
export function assertExtensionInvokeResult(value) {
  expect(typeof value.success).toBe('boolean');
  expect(value).toHaveProperty('data');
  expect(Array.isArray(value.issues)).toBe(true);
  expect(Array.isArray(value.warnings)).toBe(true);
}

describe('DW-P0-01 extension invoke contract', () => {
  it('accepts the documented success result shape', () => {
    assertExtensionInvokeResult({
      success: true,
      data: { nodes: [] },
      issues: [],
      warnings: [],
    });
  });

  it('accepts the documented failure result shape with issues', () => {
    assertExtensionInvokeResult({
      success: false,
      data: null,
      issues: [{ code: 'invalid', message: 'bad input' }],
      warnings: ['deprecated field'],
    });
  });
});

describe('DiagramWeave hub API contract', () => {
  it('subsystems list uses parent-style { success, data } envelope', async () => {
    const { createHubServer } = await import('../core-server/src/server.mjs');
    const server = createHubServer({ host: '127.0.0.1', port: 0 });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/subsystems`);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    } finally {
      await new Promise((resolve) => server.close(() => resolve()));
    }
  });
});
