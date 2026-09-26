// Designlänk: hela designen serialiseras till en kompakt base64url-sträng
// som läggs i URL:ens fragment (#d=...). Ingen databas behövs – länken ÄR
// designen. Versionsfält (v) gör att äldre länkar kan tolkas.
//
// v2 införde innehållsmodellen: rader av element (text + symboler) i valfri
// ordning. v1 (texter + en symbol + placering) migreras vid avkodning.

const b64encode = s =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64decode = s =>
  new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

// element -> kompakt array: text ['t',text,font,color] | symbol ['s',id]
const encEl = e => e.t === 'sym' ? ['s', e.id] : ['t', (e.text || '').slice(0, 40), e.font, e.color];
const decEl = a => a[0] === 's' ? { t: 'sym', id: a[1] } : { t: 'text', text: a[1] || '', font: a[2], color: a[3] };

// state (app.js) -> kompakt sträng
export function encodeDesign(state) {
  const c = state.content || { rows: [{ els: [] }], layout: 'stack', overlayPos: 'mitten' };
  const d = {
    v: 2,
    f: state.family,
    cm: state.cottonModel,
    cw: state.cottonWidth,
    bm: state.bioModel,
    bw: state.bioWidth,
    c: state.circumference,
    sr: state.sizeRange,
    wb: state.webbing,
    bt: state.biothane,
    li: state.lining,
    fg: state.fullGlitter ? 1 : 0,
    gc: state.glitterColor,
    rw: c.rows.map(row => row.els.map(encEl)),
    ly: c.layout,
    op: c.overlayPos,
    sc: state.symbolColor,
    sh: state.shadow ? 1 : 0,
    shc: state.shadowColor,
    shs: state.shadowSymbols === false ? 0 : 1,
    hw: state.hardware,
    oi: (state.extraInfo || '').slice(0, 200),
  };
  return b64encode(JSON.stringify(d));
}

// v1 (texter + symbol + placering) -> content-modellen
function migrateV1(d) {
  const texts = (d.tx || []).map(([text, font, colr]) => ({ t: 'text', text: text || '', font, color: colr }));
  const symId = d.sy && d.sy !== 'ingen' ? d.sy : null;
  const place = d.sp || 'efter';
  const sym = () => ({ t: 'sym', id: symId });
  const around = els => {
    if (!symId) return els;
    const out = els.slice();
    if (place === 'fore' || place === 'bada') out.unshift(sym());
    if (place === 'efter' || place === 'bada') out.push(sym());
    return out;
  };
  let rows, layout = 'stack';
  if (d.tl === 'rader' && texts.length > 1) {
    rows = texts.map((t, i) => ({ els: i === 0 ? around([t]) : [t] }));
  } else if (d.tl === 'dubbel' && texts.length > 1) {
    rows = [{ els: around([texts[0]]) }, { els: [texts[1]] }];
    layout = 'overlay';
  } else {
    const els = around(texts);
    rows = [{ els: els.length ? els : [{ t: 'text', text: '', font: d.tx?.[0]?.[1] || 'avenir', color: d.tx?.[0]?.[2] || 'svart' }] }];
  }
  return { rows, layout, overlayPos: d.dp || 'mitten', symbolColor: d.sc || '' };
}

// kompakt sträng -> råobjekt med normaliserad `content` (validering i app.js)
export function decodeDesign(str) {
  try {
    const d = JSON.parse(b64decode(str));
    if (!d) return null;
    if (d.v === 2) {
      d.content = {
        rows: (d.rw || []).map(row => ({ els: row.map(decEl) })),
        layout: d.ly === 'overlay' ? 'overlay' : 'stack',
        overlayPos: d.op || 'mitten',
      };
      if (!d.content.rows.length) d.content.rows = [{ els: [] }];
      d.symbolColor = d.sc || '';
      return d;
    }
    if (d.v === 1) {
      const m = migrateV1(d);
      d.content = { rows: m.rows, layout: m.layout, overlayPos: m.overlayPos };
      d.symbolColor = m.symbolColor;
      return d;
    }
    return null;
  } catch {
    return null;
  }
}
