const assert = require('node:assert/strict');
(async () => {
  const r = await import('../js/design-rules.js');
  const { TEXT_COLORS } = await import('../js/data.js');
  const { encodeDesign, decodeDesign } = await import('../js/share.js');
  const { pickSizeRange, resolveOrder } = await import('../js/cart.js');
  const col = id => TEXT_COLORS.find(c => c.id === id);
  const base = () => ({ family: 'cotton', cottonModel: 'stallbart', cottonWidth: '4',
    sizeRange: '30-35', circumference: 45, texts: [{text:'LUNA',color:'vit',size:'liten'}],
    textLayout:'rad', symbol:'tass',symbolPlacement:'efter',symbolColor:'',
    shadow:false,shadowColor:'svart',shadowSymbols:true,extraInfo:'' });
  for (const [model, widths] of Object.entries(r.SIZE_OPTIONS)) {
    assert.equal(widths['5'], undefined);
    for (const [width, options] of Object.entries(widths)) {
      assert.equal(options.at(-1).surcharge, 30);
      for (const o of options) {
        const s = {...base(),cottonModel:model,cottonWidth:width,sizeRange:o.id,extraInfo:'30–38 cm'};
        assert.equal(r.selectedSize(s),o);
        assert.equal(r.validationErrors(s).length,0);
        if (o.id === 'custom') {
          assert.equal(o.limit,null);
          s.texts[0].text='A'.repeat(80);
          assert.equal(r.validationErrors(s).length,0);
          assert.equal(decodeDesign(encodeDesign(s)).tx[0][0],s.texts[0].text);
          continue;
        }
        s.texts[0].text='A'.repeat(o.limit);
        assert.ok(r.validationErrors(s).some(e=>e.includes('tecken')));
        s.symbol='ingen';assert.equal(r.validationErrors(s).length,0);
      }
    }
  }
  const adjustable={...base(),cottonModel:'justerbart',sizeRange:'40-50'};
  assert.equal(r.selectedSize(adjustable).limit,10);
  adjustable.texts[0].text='ABCDEFGHI';
  assert.equal(r.validationErrors(adjustable).length,0);
  adjustable.texts[0].text+='J';
  assert.ok(r.validationErrors(adjustable).some(e=>e.includes('tecken')));
  const s=base();s.sizeRange='custom';assert.ok(r.validationErrors(s).some(e=>e.includes('Övrig')));
  s.sizeRange='30-35';s.symbolPlacement='bada';s.texts[0].text='ABCDE';assert.equal(r.validationErrors(s).length,0);
  s.texts[0].text='ABCDEF';assert.ok(r.validationErrors(s).length);
  for (const family of ['cotton','biothane']) for (const first of ['vit','guldglitter']) {
    const d={...base(),family,textLayout:'dubbel',texts:[{text:'LUNA',color:first},{text:'LUNA',color:'vit'}]};
    assert.equal(r.textColorAllowed(d,col('vit'),1),first==='vit');
    assert.equal(r.textColorAllowed(d,col('guldglitter'),1),family==='cotton'||first==='guldglitter');
    for(const c of TEXT_COLORS.filter(c=>c.special)) assert.equal(r.textColorAllowed(d,c,1),false);
    assert.equal(r.validationErrors(d).filter(e=>e.includes('tecken')).length,0);
  }
  for (const [range,limit] of [['30-35',7],['45-55',10]]) {
    const layered={...base(),sizeRange:range,textLayout:'dubbel',texts:[{text:'A'.repeat(limit-1),color:'vit'},{text:'B'.repeat(limit-1),color:'vit'}]};
    assert.equal(r.validationErrors(layered).length,0);
    layered.texts[1].text+='B';
    assert.ok(r.validationErrors(layered).some(e=>e.includes('tecken')));
  }
  const input={...base(),activeText:0};
  assert.equal(r.textInputLimit(input),6);
  input.symbolPlacement='bada';assert.equal(r.textInputLimit(input),5);
  input.texts.push({text:'DOG',color:'vit'});assert.equal(r.textInputLimit(input),2);
  input.textLayout='dubbel';assert.equal(r.textInputLimit(input),5);
  input.sizeRange='custom';assert.equal(r.textInputLimit(input),null);
  const shadow={...base(),shadow:true,shadowColor:'guldglitter'};
  assert.equal(r.textColorAllowed(shadow,col('vit')),false);
  assert.equal(r.textColorAllowed(shadow,col('guldglitter')),true);
  shadow.shadowColor='svart';assert.equal(r.textColorAllowed(shadow,col('vit')),true);
  const bio={...base(),family:'biothane',shadow:true};
  assert.equal(r.textColorAllowed(bio,col('dimmig')),true);
  assert.equal(r.textColorAllowed(bio,col('regnbage')),false);
  r.normalizeDesign(bio);assert.equal(bio.shadow,false);assert.equal(bio.texts[0].size,'stor');
  bio.texts.push({text:'DOG',color:'vit'});assert.equal(r.textColorAllowed(bio,col('dimmig')),false);
  const old={...base(),cottonWidth:'5'};r.normalizeDesign(old);assert.notEqual(old.cottonWidth,'5');
  const shared=decodeDesign(encodeDesign({...base(),sizeRange:'45-55',shadowSymbols:false}));
  assert.equal(shared.sr,'45-55');assert.equal(shared.shs,0);
  const opts=[{uid:1,name:'25-30 cm'},{uid:2,name:'30–35 cm'},{uid:3,name:'25–35 cm +10 kr'},{uid:4,name:'Egen storlek +30 kr'}];
  assert.equal(pickSizeRange(30,opts,'25-35').uid,3);
  assert.equal(pickSizeRange(30,opts,'custom').uid,4);
  assert.equal(pickSizeRange(30,opts,'30-40'),null);
  const fetchBefore = global.fetch;
  try {
    global.fetch = async () => ({ json: async () => ({ result: { choices: [{uid:99,name:'Storlek',type:'enum',mandatory:true,options:opts}] } }) });
    assert.equal((await resolveOrder(1,{sizeCm:30,sizeRange:'25-35'})).params[99],'3');
    assert.ok((await resolveOrder(1,{sizeCm:30,sizeRange:'30-40'})).problems.length);
    global.fetch = async () => ({ json: async () => ({ result: { choices: [] } }) });
    assert.ok((await resolveOrder(1,{sizeCm:30,sizeRange:'25-35'})).problems.length);
  } finally { global.fetch = fetchBefore; }
  console.log('PASS: size tables, surcharges, text/symbol limits, color combinations, shadow rules, old designs and exact cart ranges.');
})().catch(e=>{console.error(e);process.exitCode=1});
