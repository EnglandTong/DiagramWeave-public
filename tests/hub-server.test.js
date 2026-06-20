import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createHubServer } from '../core-server/src/server.mjs';

describe('DiagramWeave hub server', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = createHubServer({ host: '127.0.0.1', port: 0 });
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('reports hub health', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.architecture).toBe('miniapp-hub-child');
  });

  it('lists registered subsystems', async () => {
    const response = await fetch(`${baseUrl}/api/subsystems`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].id).toBe('diagramweave-editor');
  });

  it('serves the hub shell and legacy editor', async () => {
    const shell = await fetch(`${baseUrl}/`);
    const editor = await fetch(`${baseUrl}/flowchart-editor.html`);

    expect(shell.status).toBe(200);
    expect(await shell.text()).toContain('DiagramWeave-Public');
    expect(editor.status).toBe(200);
    expect(await editor.text()).toContain('DiagramWeave');
  });
});
