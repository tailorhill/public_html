// Designlänk: hela designen serialiseras till en kompakt base64url-sträng
// som läggs i URL:ens fragment (#d=...). Ingen databas behövs – länken ÄR
// designen. Versionsfält (v) gör att äldre länkar kan tolkas i framtiden.

const b64encode = s =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64decode = s =>
  new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

// state (app.js) -> kompakt sträng
export function encodeDesign(state) {
  const d = {
    v: 1,
    f: state.family,
    cm: state.cottonModel,
    cw: state.cottonWidth,
    bm: state.bioModel,
    bw: state.bioWidth,
    c: state.circumference,
    wb: state.webbing,
    bt: state.biothane,
    li: state.lining,
    fg: state.fullGlitter ? 1 : 0,
    gc: state.glitterColor,
    tx: state.texts.map(t => [t.text.slice(0, 24), t.font, t.color, t.size]),
    tl: state.textLayout,
    dp: state.dubbelPos,
    sy: state.symbol,
    sp: state.symbolPlacement,
    sc: state.symbolColor,
    sh: state.shadow ? 1 : 0,
    shc: state.shadowColor,
    hw: state.hardware,
    oi: (state.extraInfo || '').slice(0, 200),
  };
  return b64encode(JSON.stringify(d));
}

// kompakt sträng -> råobjekt (validering av id:n sker i app.js)
export function decodeDesign(str) {
  try {
    const d = JSON.parse(b64decode(str));
    if (!d || d.v !== 1) return null;
    return d;
  } catch {
    return null;
  }
}
