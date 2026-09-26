const assert = require('node:assert/strict');
(async () => {
  const r = await import('../js/design-rules.js');
  const { TEXT_COLORS } = await import('../js/data.js');
  const { encodeDesign, decodeDesign } = await import('../js/share.js');
  const { pickSizeRange, resolveOrder } = await import('../js/cart.js');
  const col = id => TEXT_COLORS.find(c => c.id === id);
  const T = (text, color = 'vit', font = 'built') => ({ t: 'text', text, font, color });
  const S = id => ({ t: 'sym', id });
  const content = (rows, layout = 'stack', overlayPos = 'mitten') => ({ rows: rows.map(els => ({ els })), layout, overlayPos });
  const base = () => ({
    family: 'cotton', cottonModel: 'stallbart', cottonWidth: '4', sizeRange: '30-35', circumference: 45,
    content: content([[T('LUNA'), S('tass')]]),
    activeEl: { row: 0, i: 0 }, symbolColor: '', shadow: false, shadowColor: 'svart', shadowSymbols: true, extraInfo: '',
  });

  // ---- storlekstabeller + teckengränser (symbol räknas som tecken) ----
  for (const [model, widths] of Object.entries(r.SIZE_OPTIONS)) {
    assert.equal(widths['5'], undefined);
    for (const [width, options] of Object.entries(widths)) {
      assert.equal(options.at(-1).surcharge, 30);
      for (const o of options) {
        const s = { ...base(), cottonModel: model, cottonWidth: width, sizeRange: o.id, extraInfo: '30–38 cm',
          content: content([[T('LU')]]) };
        assert.equal(r.selectedSize(s), o);
        assert.equal(r.validationErrors(s).length, 0);
        if (o.id === 'custom') {
          assert.equal(o.limit, null);
          s.content = content([[T('A'.repeat(80))]]);
          assert.equal(r.validationErrors(s).length, 0);
          assert.equal(decodeDesign(encodeDesign(s)).content.rows[0].els[0].text, 'A'.repeat(80));
          continue;
        }
        // text på gränsen + en symbol = över gränsen
        s.content = content([[T('A'.repeat(o.limit)), S('tass')]]);
        assert.ok(r.validationErrors(s).some(e => e.includes('tecken')));
        // utan symbol = precis på gränsen
        s.content = content([[T('A'.repeat(o.limit))]]);
        assert.equal(r.validationErrors(s).length, 0);
      }
    }
  }

  // justerbart 40–50 = gräns 10
  const adj = { ...base(), cottonModel: 'justerbart', sizeRange: '40-50', content: content([[T('ABCDEFGHI'), S('tass')]]) };
  assert.equal(r.selectedSize(adj).limit, 10);
  assert.equal(r.validationErrors(adj).length, 0);           // 9 + 1 symbol = 10
  adj.content = content([[T('ABCDEFGHIJ'), S('tass')]]);      // 10 + 1 = 11
  assert.ok(r.validationErrors(adj).some(e => e.includes('tecken')));

  // egen storlek kräver Övrig info
  const cust = { ...base(), sizeRange: 'custom' };
  assert.ok(r.validationErrors(cust).some(e => e.includes('Övrig')));

  // symboler på var sida om texten räknas båda
  const both = { ...base(), content: content([[S('tass'), T('ABCDE'), S('tass')]]) };   // 5 + 2 = 7
  assert.equal(r.validationErrors(both).length, 0);
  both.content = content([[S('tass'), T('ABCDEF'), S('tass')]]);                          // 6 + 2 = 8
  assert.ok(r.validationErrors(both).length);

  // ---- overlay (dubbeltext): glitter fäster bara på glitter ----
  for (const family of ['cotton', 'biothane']) for (const first of ['vit', 'guldglitter']) {
    const d = { ...base(), family, content: content([[T('LUNA', first)], [T('LUNA', 'vit')]], 'overlay') };
    assert.equal(r.textColorAllowed(d, col('vit'), { row: 1 }), first === 'vit');
    assert.equal(r.textColorAllowed(d, col('guldglitter'), { row: 1 }), family === 'cotton' || first === 'guldglitter');
    for (const c of TEXT_COLORS.filter(c => c.special)) assert.equal(r.textColorAllowed(d, c, { row: 1 }), false);
    assert.equal(r.validationErrors(d).filter(e => e.includes('tecken')).length, 0);
  }
  // overlay: gränsen gäller per rad (bindande = bredaste raden)
  for (const [range, limit] of [['30-35', 7], ['45-55', 10]]) {
    const layered = { ...base(), sizeRange: range, content: content([[T('A'.repeat(limit))], [T('B'.repeat(limit))]], 'overlay') };
    assert.equal(r.validationErrors(layered).length, 0);       // båda på gränsen = ok
    layered.content.rows[1].els[0].text = 'B'.repeat(limit + 1);
    assert.ok(r.validationErrors(layered).some(e => e.includes('tecken')));
  }

  // ---- textInputLimit (plats kvar i det markerade textfältet) ----
  const inp = { ...base(), activeEl: { row: 0, i: 0 } };       // rad: LUNA + tass
  assert.equal(r.textInputLimit(inp), 6);                      // 7 - (5 - 4)
  inp.content = content([[S('tass'), T('LUNA'), S('tass')]]); inp.activeEl = { row: 0, i: 1 };
  assert.equal(r.textInputLimit(inp), 5);                      // 7 - (6 - 4)
  inp.content = content([[S('tass'), T('LUNA'), T('DOG'), S('tass')]]); inp.activeEl = { row: 0, i: 1 };
  assert.equal(r.textInputLimit(inp), 2);                      // 7 - (9 - 4)
  inp.sizeRange = 'custom';
  assert.equal(r.textInputLimit(inp), null);

  // canAddToRow: full rad kan inte utökas
  const full = { ...base(), content: content([[T('ABCDEFG')]]) };  // 7 = gräns
  assert.equal(r.canAddToRow(full), false);
  full.content = content([[T('ABC')]]);
  assert.equal(r.canAddToRow(full), true);
  full.sizeRange = 'custom';
  assert.equal(r.canAddToRow({ ...full, content: content([[T('ABCDEFG')]]) }), true);

  // separata rader (stack): färger oberoende
  const sep = { ...base(), content: content([[T('LUNA', 'guldglitter')], [T('DOG', 'vit')]], 'stack') };
  for (const c of TEXT_COLORS) assert.equal(r.textColorAllowed(sep, c, { row: 1 }), true);

  // skugga: glittrig skugga kräver glittrig text
  const shadow = { ...base(), shadow: true, shadowColor: 'guldglitter' };
  assert.equal(r.textColorAllowed(shadow, col('vit')), false);
  assert.equal(r.textColorAllowed(shadow, col('guldglitter')), true);
  shadow.shadowColor = 'svart';
  assert.equal(r.textColorAllowed(shadow, col('vit')), true);

  // biothane: Dimmig ensam ok, andra special ej; normalize stänger av skugga
  const bio = { ...base(), family: 'biothane', shadow: true };
  assert.equal(r.textColorAllowed(bio, col('dimmig')), true);
  assert.equal(r.textColorAllowed(bio, col('regnbage')), false);
  r.normalizeDesign(bio);
  assert.equal(bio.shadow, false);
  const oldWidth = { ...base(), cottonWidth: '5' };
  r.normalizeDesign(oldWidth);
  assert.notEqual(oldWidth.cottonWidth, '5');

  // ---- delningslänk v2 + migrering av v1 ----
  const shared = decodeDesign(encodeDesign({ ...base(), sizeRange: '45-55', shadowSymbols: false }));
  assert.equal(shared.sr, '45-55');
  assert.equal(shared.shs, 0);
  assert.equal(shared.content.rows[0].els[1].id, 'tass');
  // gammal v1-länk migreras till innehållsmodellen
  const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const mig = decodeDesign(b64url({ v: 1, f: 'cotton', tx: [['LUNA', 'built', 'vit']], tl: 'rad', sy: 'tass', sp: 'bada' }));
  assert.equal(mig.content.rows[0].els[0].id, 'tass');       // symbol före
  assert.equal(mig.content.rows[0].els[1].text, 'LUNA');
  assert.equal(mig.content.rows[0].els[2].id, 'tass');       // symbol efter (bada)

  // ---- varukorg: exakta storleksintervall (oförändrat) ----
  const opts = [{ uid: 1, name: '25-30 cm' }, { uid: 2, name: '30–35 cm' }, { uid: 3, name: '25–35 cm +10 kr' }, { uid: 4, name: 'Egen storlek +30 kr' }];
  assert.equal(pickSizeRange(30, opts, '25-35').uid, 3);
  assert.equal(pickSizeRange(30, opts, 'custom').uid, 4);
  assert.equal(pickSizeRange(30, opts, '30-40'), null);
  const fetchBefore = global.fetch;
  try {
    global.fetch = async () => ({ json: async () => ({ result: { choices: [{ uid: 99, name: 'Storlek', type: 'enum', mandatory: true, options: opts }] } }) });
    assert.equal((await resolveOrder(1, { sizeCm: 30, sizeRange: '25-35' })).params[99], '3');
    assert.ok((await resolveOrder(1, { sizeCm: 30, sizeRange: '30-40' })).problems.length);
  } finally { global.fetch = fetchBefore; }

  console.log('PASS: innehållsmodell – storlekar, teckengränser per rad, symboler som tecken, overlay-färger, skugga, v1-migrering och cart-intervall.');
})().catch(e => { console.error(e); process.exitCode = 1; });
