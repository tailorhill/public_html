// Run against a local server with Playwright installed:
// NODE_PATH=/path/to/node_modules BROWSER_EXECUTABLE=/path/to/chrome node tools/test-hardware.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && /THREE|WebGL|shader/.test(m.text())) errors.push(m.text()); });
    const url = process.env.TEST_URL || 'http://127.0.0.1:8746/';
    await page.goto(url);
    await page.waitForFunction(() => window.viewer?._lastCfg);
    assert.equal(await page.evaluate(() => viewer.hardwareReady), 7);
    const results = await page.evaluate(async () => {
      const { HARDWARE_FINISHES } = await import('/js/data.js');
      const v = viewer, base = structuredClone(v._lastCfg), results = [];
      for (const family of ['cotton', 'biothane']) for (const modelKind of ['fast', 'stallbart', 'halvstryp']) {
        const cfg = { ...base, family, modelKind, width: family === 'cotton' ? 4 : 2.5, bandWidthCm: family === 'cotton' ? 3 : 2.5 };
        v.build(cfg); v.renderer.render(v.scene, v.camera);
        const assets = [];
        v.collarGroup.traverse(o => { if (o.userData.blenderAsset) assets.push(o.userData.blenderAsset); });
        results.push({ family, modelKind, assets });
      }
      for (const modelKind of ['halvstryp', 'halvstrypknappe', 'justerbart']) {
        for (const width of [2.5, 4, 5]) for (const circumference of [25, 45, 70]) {
          v.build({ ...base, family: 'cotton', modelKind, width, bandWidthCm: width - 1, circumference });
          const g = v.collarGroup, has = name => !!g.getObjectByName(name);
          if (g.children.filter(o => o.name === 'half-slip-guide-ring').length !== 2) throw Error('Guide rings');
          if (!has('half-slip-leash-ring')) throw Error('Leash ring');
          if (has('half-slip-release') !== (modelKind === 'halvstrypknappe')) throw Error('Release variant');
          if (has('half-slip-adjuster') !== (modelKind === 'justerbart')) throw Error('Adjuster variant');
          if (has('half-slip-lining-keeper') !== (modelKind === 'justerbart')) throw Error('Lining keeper');
          g.traverse(o => { if (o.isMesh) { for (const n of o.geometry.attributes.position.array) if (!Number.isFinite(n)) throw Error('Invalid geometry'); } });
          v.renderer.render(v.scene, v.camera);
        }
        v.build({ ...base, modelKind, showHardware: false });
        v.collarGroup.traverse(o => { if (o.userData.blenderAsset) throw Error('Hidden half-slip hardware'); });
      }
      for (const finish of HARDWARE_FINISHES) {
        v.build({ ...base, hardware: finish }); v.renderer.render(v.scene, v.camera);
        const ring = v.collarGroup.getObjectByName('blender-d-ring');
        if (!ring || ring.children[0].material.color.getHexString() !== finish.hex.slice(1).toLowerCase()) throw Error('Finish mismatch: ' + finish.id);
      }
      v.build({ ...base, showHardware: false });
      let hidden = true; v.collarGroup.traverse(o => { if (o.userData.blenderAsset) hidden = false; });
      if (!hidden) throw Error('Hardware visibility');
      if (!v.snapshot().startsWith('data:image/png')) throw Error('PNG export');
      return results;
    });
    for (const r of results) {
      if (r.modelKind === 'fast') assert.ok(r.assets.includes('side-release'), JSON.stringify(r));
      if (r.modelKind === 'stallbart') assert.ok(r.assets.includes(r.family === 'cotton' ? 'tri-glide' : 'roller-buckle'), JSON.stringify(r));
      if (r.modelKind === 'halvstryp' && r.family === 'cotton') assert.ok(r.assets.includes('d-ring'));
    }
    if (await page.locator('#infoDialog').isVisible()) await page.locator('#infoDialogOk').click();
    // Exercise the actual UI: these choices used to collapse to the same modelKind.
    for (const [label, kind] of [['Halvstryp', 'halvstryp'], ['Halvstryp med knäppe', 'halvstrypknappe'], ['Justerbart halvstryp', 'justerbart']]) {
      await page.locator('#modelSeg button').filter({ hasText: new RegExp('^' + label + '$') }).click();
      await page.waitForFunction(kind => viewer._lastCfg.modelKind === kind, kind);
    }
    await page.goto(url + '?lite'); await page.waitForFunction(() => window.viewer?._lastCfg);
    assert.equal(await page.evaluate(() => viewer.hardwareReady), 7);
    assert.equal(await page.evaluate(() => viewer.lite), true);
    // A missing GLB must leave the original procedural viewer usable.
    const fallback = await browser.newPage();
    fallback.on('pageerror', e => errors.push(e.message));
    await fallback.route('**/*.glb', route => route.abort());
    await fallback.goto(url); await fallback.waitForFunction(() => window.viewer?._lastCfg);
    assert.equal(await fallback.evaluate(() => viewer.hardwareReady), 0);
    assert.ok(await fallback.evaluate(() => {
      for (const modelKind of ['halvstryp', 'halvstrypknappe', 'justerbart']) {
        viewer.build({ ...viewer._lastCfg, modelKind });
        if (!viewer.snapshot().startsWith('data:image/png')) return false;
      }
      return true;
    }));
    assert.deepEqual(errors, []);
    console.log('PASS: 7 GLB assets, model selection, finishes, hidden hardware, PNG, lite mode and failed-load fallback.');
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
