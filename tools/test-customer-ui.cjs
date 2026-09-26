// Kör mot en lokal server med Playwright installerat:
//   NODE_PATH=/path/to/node_modules BROWSER_EXECUTABLE=/path/to/chrome node tools/test-customer-ui.cjs
// (Uppdaterad för innehållsmodellen: fri inline-editor med text- och symbol-element.)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  try {
    const p = await b.newPage({ viewport: { width: 1400, height: 1050 } });
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto((process.env.TEST_URL || 'http://127.0.0.1:8748/') + '?supplier=1');
    await p.waitForFunction(() => window.viewer?._lastCfg);
    await p.locator('#infoDialogOk').click();
    const button = (selector, label) => p.locator(selector + ' button').filter({ hasText: new RegExp('^' + label + '$') });
    const inp = p.locator('#elTextInput');

    // Storleksval + pris + teckengräns
    await button('#modelSeg', 'Ställbart halsband').click();
    assert.match(await p.locator('#sizeTextNote').textContent(), /max 7 tecken/);
    assert.equal(await p.locator('#rangeSizeSelect option').count(), 4);
    await p.locator('#rangeSizeSelect select').selectOption('45-55');
    assert.match(await p.locator('#priceRows').textContent(), /20 kr/);
    await p.waitForFunction(() => viewer._lastCfg.circumference === 50);
    assert.match(await p.locator('#sizeTextNote').textContent(), /max 10 tecken/);

    // Default-raden har ett textelement (markerat) + en symbol → gräns 10, 1 symbol = 9 texttecken
    await inp.fill('ABCDEFGHIJ');
    assert.equal(await inp.inputValue(), 'ABCDEFGHI');
    assert.equal(await inp.getAttribute('maxlength'), '9');
    assert.ok(await p.locator('#cartBtn').isEnabled());
    // Mindre storlek → gränsen minskar, texten trunkeras inte tyst (valideringsfel + inaktiv knapp)
    await p.locator('#rangeSizeSelect select').selectOption('30-35');
    assert.ok(await p.locator('#cartBtn').isDisabled());
    await inp.fill('ABCDEF');
    assert.equal(await inp.getAttribute('maxlength'), '6');
    assert.ok(await p.locator('#cartBtn').isEnabled());

    // Egen storlek = ingen gräns, men kräver Övrig info
    await inp.fill('LUNA');
    await p.locator('#rangeSizeSelect select').selectOption('custom');
    assert.ok(await p.locator('#cartBtn').isDisabled());
    await p.locator('#extraInfo').fill('Önskar 32–38 cm');
    assert.ok(await p.locator('#cartBtn').isEnabled());
    const longText = 'EN EGEN TEXT MED FLER ÄN TJUGOFYRA TECKEN';
    await inp.fill(longText);
    assert.equal(await inp.getAttribute('maxlength'), null);
    assert.ok(await p.locator('#cartBtn').isEnabled());

    // Skugga (bara text) + delningslänk-roundtrip
    await p.locator('#shadowToggle').check();
    await button('#shadowScope', 'Bara text').click();
    await p.waitForFunction(() => viewer._lastCfg.shadowColor && viewer._lastCfg.shadowSymbols === false);
    const shared = p.url();
    await p.goto(shared);
    await p.waitForFunction(() => viewer?._lastCfg?.shadowSymbols === false);
    assert.equal(await p.locator('#elTextInput').inputValue(), longText);
    assert.equal(await p.locator('#rangeSizeSelect select').inputValue(), 'custom');
    assert.equal(await p.locator('#extraInfo').inputValue(), 'Önskar 32–38 cm');

    // Lägg till en symbol i raden → chip-remsan får ett symbol-element till
    const chipsBefore = await p.locator('#rowList .el-chip').count();
    await p.locator('#addSymbolBtn').click();
    assert.equal(await p.locator('#rowList .el-chip').count(), chipsBefore + 1);

    assert.deepEqual(errors, []);
    console.log('PASS: storleksval, pris, teckengräns per fält, egen storlek, skugga och delningslänk-roundtrip i inline-editorn.');

    // Export (SVG/DXF) speglar innehållsmodellen
    const exportCheck = await p.evaluate(async () => {
      const { buildCutSvg, buildCutDxf } = await import('/js/export.js');
      const { FONTS, TEXT_COLORS } = await import('/js/data.js');
      const T = (text, color) => ({ t: 'text', text, font: FONTS[0], color });
      const cfg = {
        bandHmm: 30, shadowColor: TEXT_COLORS[0], symbolColor: TEXT_COLORS[0],
        content: { rows: [{ els: [{ t: 'sym', id: 'kvistar-vanster' }, T('LUNA', TEXT_COLORS[0]), { t: 'sym', id: 'kvistar-hoger' }] }], layout: 'stack', overlayPos: 'mitten' },
      };
      const all = await buildCutSvg({ ...cfg, shadowSymbols: true });
      const text = await buildCutSvg({ ...cfg, shadowSymbols: false });
      const dxf = await buildCutDxf({ ...cfg, shadowSymbols: false });
      const symbolOnly = await buildCutSvg({ ...cfg, content: { rows: [{ els: [{ t: 'sym', id: 'tass' }] }], layout: 'stack' }, shadowSymbols: false });
      return { different: all !== text, shadow: text.includes('id="skugga"'), symbols: text.includes('id="symbol"'), dxf: dxf.includes('SKUGGA'), noTextShadow: !symbolOnly.includes('id="skugga"') };
    });
    assert.deepEqual(exportCheck, { different: true, shadow: true, symbols: true, dxf: true, noTextShadow: true });
    assert.deepEqual(errors, []);
    console.log('PASS: bara-text-skugga gäller även SVG/DXF; symboler finns kvar i exporten.');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
