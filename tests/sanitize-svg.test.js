import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function extractSanitizeSvg() {
  const source = readFileSync(join(root, 'flowchart-editor.js'), 'utf8');
  const match = /function sanitizeSvg\(svgText\)\s*\{[\s\S]*?\n\}/.exec(source);
  if (!match) throw new Error('sanitizeSvg function not found');
  return match[0];
}

describe('sanitizeSvg XSS prevention', () => {
  const fn = extractSanitizeSvg();
  const sanitizeSvg = new Function(`${fn}\nreturn sanitizeSvg;`)();

  it('strips <script> elements from SVG', () => {
    const input = '<svg><script>alert(1)</script><rect width="10" height="10"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    // P1-01: fallback 模式（无 DiagramWeaveSvgSanitizer）采用宁严勿漏策略，
    // 含可疑标记的 SVG 整体拒绝；生产环境委托白名单 DOM 清洗器可保留安全部分。
  });

  it('strips event handler attributes (onclick)', () => {
    const input = '<svg><rect onclick="alert(1)" width="10" height="10"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('onclick');
    // P1-01: fallback 整体拒绝含 on* 属性的 SVG
  });

  it('strips event handler attributes (onload with single quotes)', () => {
    const input = "<svg><image onload='alert(1)' href='x.png'/></svg>";
    const result = sanitizeSvg(input);
    expect(result).not.toContain('onload');
  });

  it('strips foreignObject elements', () => {
    const input = '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('foreignObject');
  });

  it('blocks javascript: URIs', () => {
    const input = '<svg><a xlink:href="javascript:alert(1)"><text>click</text></a></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('javascript:');
    // P1-01: fallback 整体拒绝含 javascript: 的 SVG
    expect(result).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeSvg(null)).toBe('');
    expect(sanitizeSvg(undefined)).toBe('');
    expect(sanitizeSvg(123)).toBe('');
  });

  it('preserves safe SVG content', () => {
    const input = '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="blue"/><text x="50" y="55">Hello</text></svg>';
    const result = sanitizeSvg(input);
    expect(result).toBe(input);
  });
});
