import { expect, test } from '@playwright/test';

async function prepare(page) {
  await page.addInitScript(() => {
    window.__dwSkipRemoteBootstrap = true;
    sessionStorage.setItem('dw-initial-save-prompted', '1');
  });
  await page.goto('/flowchart-editor.html');
  await page.waitForFunction(() => window.__dwEditorReady === true);
}

async function downloadBytes(page, action) {
  const pending = page.waitForEvent('download');
  await action();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { name: download.suggestedFilename(), bytes: Buffer.concat(chunks) };
}

test('all built-in templates remain readable and editable', async ({ page }) => {
  await prepare(page);
  const count = await page.evaluate(() => allTemplates.length);
  expect(count).toBeGreaterThanOrEqual(7);
  for (let index = 0; index < count; index += 1) {
    await page.evaluate(templateIndex => applyTemplate(templateIndex), index);
    const nodes = page.locator('.node');
    expect(await nodes.count()).toBeGreaterThan(0);
    await nodes.first().click();
    await page.locator('#propLabel').fill(`QA template ${index + 1}`);
    await page.locator('#propLabel').dispatchEvent('change');
    await expect(nodes.first().locator('.node-label')).toHaveText(`QA template ${index + 1}`);
    const minimumContrast = await nodes.evaluateAll(items => Math.min(...items.map(node => {
      const shape = node.querySelector('.node-shape');
      const label = node.querySelector('.node-label');
      const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = values => values.map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const a = luminance(rgb(getComputedStyle(shape).backgroundColor));
      const b = luminance(rgb(getComputedStyle(label).color));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    })));
    expect(minimumContrast).toBeGreaterThanOrEqual(4.5);
  }
});

test('SVG, PNG, and PDF exports produce files and resolve node text color', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => {
    applyTemplate(0);
    state.nodes[0].fillColor = '#111111';
    state.nodes[0].textColor = '#34d399';
    renderAll();
  });
  const svgMarkup = await page.evaluate(() => buildExportSVG());
  expect(svgMarkup).toContain('fill="#34d399"');

  const svg = await downloadBytes(page, () => page.evaluate(() => exportSVG()));
  expect(svg.name).toMatch(/\.svg$/);
  expect(svg.bytes.length).toBeGreaterThan(500);
  expect(svg.bytes.toString('utf8')).toContain('fill="#34d399"');

  const png = await downloadBytes(page, () => page.evaluate(() => exportPNG()));
  expect(png.name).toMatch(/\.png$/);
  expect(png.bytes.subarray(1, 4).toString('ascii')).toBe('PNG');

  const pdf = await downloadBytes(page, () => page.evaluate(() => exportPDF()));
  expect(pdf.name).toMatch(/\.pdf$/);
  expect(pdf.bytes.subarray(0, 4).toString('ascii')).toBe('%PDF');
});

test('JSON, VSO, and Excel round-trip schema and textColor', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => {
    applyTemplate(0);
    state.nodes[0].textColor = '#34d399';
    renderAll();
  });

  const json = await downloadBytes(page, () => page.evaluate(() => downloadProjectJson()));
  const jsonDocument = JSON.parse(json.bytes.toString('utf8'));
  expect(jsonDocument.schemaVersion).toBe(3);
  expect(jsonDocument.pages[0].nodes[0].textColor).toBe('#34d399');

  const vso = await downloadBytes(page, () => page.evaluate(() => downloadProjectVso()));
  expect(vso.name).toMatch(/\.vso$/);
  const vsoDocument = JSON.parse(vso.bytes.toString('utf8'));
  expect(vsoDocument.pages[0].nodes[0].textColor).toBe('#34d399');

  const excelResult = await page.evaluate(() => {
    const buffer = getProjectExcelArrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const exported = JSON.stringify(workbook.SheetNames.map(name =>
      XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' })));
    const loaded = loadEditableProjectExcelWorkbook(workbook);
    return { exported, loaded, textColor: state.nodes[0]?.textColor };
  });
  expect(excelResult.exported).toContain('#34d399');
  expect(excelResult.loaded).toBe(true);
  expect(excelResult.textColor).toBe('#34d399');
});
