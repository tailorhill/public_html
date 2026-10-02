const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{
 const errors=[];const root=process.env.TEST_URL||'http://localhost:8748/';
 for(const mode of ['normal','lite','missing-relief']){
  const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/.test(m.text()))errors.push(m.text())});
  if(mode==='missing-relief')await p.route('**/assets/materials/cotton/height.png',r=>r.abort());
  await p.goto(root+(mode==='lite'?'?lite':''));await p.waitForFunction(()=>window.viewer?._lastCfg);await p.evaluate(()=>viewer.hardwareReady);
  const result=await p.evaluate(async()=>{
   const{allLinings}=await import('/js/data.js');const{ensureTexturesFor}=await import('/js/foder-realism.js');
   const choices=[allLinings().find(l=>!l.pattern&&!l.leather&&!l.metallic),allLinings().find(l=>l.pattern),allLinings().find(l=>l.leather)].filter(Boolean);
   const base=viewer._lastCfg;let count=0;
   for(const lining of choices){const cfg={...base,family:'cotton',lining,modelKind:'justerbart'};await ensureTexturesFor(cfg);viewer.build(cfg);viewer.renderer.render(viewer.scene,viewer.camera);viewer.collarGroup.traverse(o=>{if(o.isMesh){for(const n of o.geometry.attributes.position.array)if(!Number.isFinite(n))throw Error('Invalid surface geometry')}});count++}
   for (const modelKind of ['fast','stallbart','halvstryp']) for (const width of [2.5,3.8]) {
     const cfg={...base,family:'biothane',modelKind,width,bandWidthCm:width};
     viewer.build(cfg); viewer.renderer.render(viewer.scene,viewer.camera);
     const body=viewer.collarGroup.children[0];
     if(!body.material.bumpMap || !body.material.roughnessMap) throw Error('Missing BioThane surface maps');
     if(Math.abs(body.material.bumpMap.repeat.x-body.material.roughnessMap.repeat.x)>0.0001) throw Error('Mismatched half-slip surface scale');
     viewer.collarGroup.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)if(!Number.isFinite(n))throw Error('Invalid BioThane geometry')});
   }
   return{count,png:viewer.snapshot().startsWith('data:image/png'),scale:viewer.collarGroup.scale.x};
  });assert.equal(result.count,3);assert.equal(result.png,true);assert.equal(result.scale,1.035);await p.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: cloth, patterned lining, leather and all BioThane models/widths, normal/lite modes, missing relief fallback, finite geometry and PNG.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
