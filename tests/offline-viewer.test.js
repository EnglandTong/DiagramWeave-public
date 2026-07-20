import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs'; import vm from 'node:vm';
const source = fs.readFileSync(new URL('../diagramweave-offline-viewer.js', import.meta.url), 'utf8'); let api;
beforeEach(() => { const context = { globalThis: {} }; context.globalThis = context; vm.runInNewContext(source, context); api = context.DiagramWeaveOfflineViewer; });
describe('offline viewer export', () => {
  it('embeds one self-contained read-only document', () => { const html = api.buildViewerHtml({ projectName: 'Ops', pages: [] }); expect(html).toContain('<!doctype html>'); expect(html).not.toMatch(/<script[^>]+src=/); expect(html).not.toMatch(/<link[^>]+href=/); expect(html).toContain('Read only'); });
  it('escapes script-closing project content', () => { const html = api.buildViewerHtml({ projectName: '</script><script>alert(1)</script>', pages: [] }); expect(html).not.toContain('</script><script>alert(1)'); expect(html).toContain('\\u003c/script\\u003e'); });
});
