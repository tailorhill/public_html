const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  try {
    const errors = [];
    for (const lite of [false, true]) {
      const page = await browser.newPage({viewport:{width:1440,height:1000}});
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if(m.type()==='error' && /shader|WebGL|THREE/.test(m.text())) errors.push(m.text()); });
      await page.goto((process.env.TEST_URL || 'http://localhost:8748/') + (lite ? '?lite' : ''));
      await page.waitForFunction(() => window.viewer?._lastCfg);
      await page.evaluate(() => viewer.hardwareReady);
      if(await page.locator('#infoDialog[open]').count()) await page.locator('#infoDialogOk').click();
      assert.equal(await page.locator('[data-view="foto"]').count(), 0);
      assert.equal(await page.locator('#snapshotBtn').isVisible(), true);
      const result = await page.evaluate(async () => {
        const base = viewer._lastCfg;
        const first = base.content.rows.flatMap(r => r.els).find(e => e.t === 'text');
        let count = 0;
        for (const family of ['cotton', 'biothane']) for (const modelKind of ['fast','halvstryp']) {
          const cfg = {...base, family, modelKind, content:{layout:'stack',rows:[{els:[{...first,text:'QUEEN',color:{hex:'#b99042',glitter:true}},{t:'sym',id:'tass'}]}]}};
          viewer.build(cfg); viewer.renderer.render(viewer.scene, viewer.camera);
          const foil=[];viewer.collarGroup.traverse(o=>{if(o.material?.userData.glitterMask)foil.push(o.material)});
          if(foil.length!==1) throw Error('Expected one outer foil surface');
          const c=foil[0].userData.glitterMask.image, data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          let white=0,black=0;for(let i=0;i<data.length;i+=4){if(data[i]===255)white++;if(data[i]===0)black++;}
          if(!white||!black)throw Error('Mask must isolate foil from strap');
          count++;
        }
        const bg=viewer.scene.background;
        const png=viewer.snapshot();
        if(viewer.scene.background!==bg)throw Error('Snapshot changed backdrop');
        return {count,png:png.startsWith('data:image/png')};
      });
      assert.equal(result.count,4); assert.equal(result.png,true);
      const download = page.waitForEvent('download'); await page.locator('#snapshotBtn').click();
      assert.equal((await download).suggestedFilename(),'halsband-design.png');
      await page.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: PNG download, isolated glitter on cotton/BioThane and half-slip, regular/lite shader compilation.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
