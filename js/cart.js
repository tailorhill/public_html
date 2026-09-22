// Lägg designen i Valley Dogs Abicart-varukorg.
//
// Flöde: butiken (www.valleydogs.se) skickar en Session.getToken()-token till
// verktyget som #s=<token>. Med den som kontextparameter `session` kan vi
// lägga artikeln i KUNDENS egen varukorg och sedan skicka tillbaka hen till
// butikens kassa, där varan redan ligger. Detta är Abicarts avsedda mekanism
// (token bär köparens session portabelt).
//
// Mappningen är datadriven: vi hämtar artikelns val (ArticleChoice) med namn
// vid körning och matchar designens värden mot valens/optionernas NAMN. Hela
// beställningstexten + designlänken läggs alltid i "Övrig info" som säkerhet.

const WEBSHOP = 119951;
const API = `https://www.valleydogs.se/backend/jsonrpc/v1`;

// Artikel-uid per produkt (från Article.list, webshop 119951).
// Bomull: en artikel per modell+bredd. Helglittrigt är EGNA artiklar.
// BioThane: en artikel per modell (bredden 25/38 är ett val inuti artikeln);
// helglittrig biothane är EN artikel där modell+bredd är val.
export const ARTICLE_UIDS = {
  cotton: {
    fast:            { '2.5': 221787757, '3.5': 188200699, '4': 188162041, '5': 215037633 },
    halvstryp:       { '2.5': 221787747, '3.5': 188200679, '4': 188143237, '5': 215037437 },
    halvstrypknappe: { '2.5': 221809977, '3.5': 193277178, '4': 193277220, '5': 215735283 },
    stallbart:       { '2.5': 221809933, '3.5': 188200851, '4': 188162917 },
    agility:         { '2.5': 221809963, '3.5': 188200711, '4': 188200629, '5': 215909047 },
    justerbart:      { '2.5': 225137826, '3.5': 225138482, '4': 225138484 },
  },
  cottonGlitter: {
    fast:            { '2.5': 221958363, '3.5': 221958417, '4': 221958455, '5': 221959601 },
    halvstryp:       { '2.5': 221958375, '3.5': 221958419, '4': 221958463, '5': 221959609 },
    halvstrypknappe: { '2.5': 221958395, '3.5': 221958423, '4': 221959533, '5': 221959605 },
    agility:         { '2.5': 221946313, '3.5': 221958407, '4': 221958443, '5': 221959599 },
  },
  biothane:        { fast: 201852439, halvstryp: 213629143, stallbart: 216877697 },
  biothaneGlitter: 221959743,
};

let sessionToken = null;
export function setToken(t) { sessionToken = t; }
export function hasToken() { return !!sessionToken; }

// Läs token ur URL-fragmentet (#s=... eller kombinerat med #d=...)
export function readTokenFromHash() {
  const m = location.hash.match(/[#&]s=([a-f0-9]{16,64})/i);
  if (m) { sessionToken = m[1]; return true; }
  return false;
}

async function rpc(method, params) {
  const url = `${API}?webshop=${WEBSHOP}&language=sv&vat_country=SE` +
    (sessionToken ? `&session=${encodeURIComponent(sessionToken)}` : '');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'API-fel');
  return json.result;
}

// state.glitter = true endast när helglitter faktiskt är valt OCH tillgängligt
// (app.js skickar med det). Faller tillbaka på icke-glitter om variant saknas.
export function articleUidFor(state, glitter) {
  if (state.family === 'cotton') {
    const g = glitter && ARTICLE_UIDS.cottonGlitter[state.cottonModel];
    const table = g ? ARTICLE_UIDS.cottonGlitter : ARTICLE_UIDS.cotton;
    return (table[state.cottonModel] && table[state.cottonModel][state.cottonWidth]) || null;
  }
  if (glitter) return ARTICLE_UIDS.biothaneGlitter;
  return ARTICLE_UIDS.biothane[state.bioModel] || null;
}

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Bygg { valnamn(normaliserat) : önskat värde } från designen.
// Värdet är antingen ett options-NAMN (enum) eller fritext.
// choiceValues() tar en färdig "fält→värde"-karta från app.js (byggd av samma
// data som beställningstexten) så vi slipper duplicera katalogkännedomen här.

// Kör hela köpet: hämta val, matcha, lägg i korg. Returnerar {ok, orderUid}.
export async function addToCart(articleUid, fieldValues, fallbackComment) {
  if (!sessionToken) throw new Error('Ingen sessionstoken – öppna verktyget via butikens designknapp.');

  // 1. artikelns val med namn, typ, obligatorisk-flagga och options
  const article = await rpc('Article.get', [articleUid, { uid: true, choices: true }]);
  const choiceUids = article.choices || [];
  const choices = await Promise.all(choiceUids.map(uid =>
    rpc('ArticleChoice.get', [uid, { uid: true, name: true, type: true, mandatory: true, options: { uid: true, name: true } }])));

  // 2. bygg params. Butikens valnamn har ofta långa OBS-tillägg, så vi matchar
  // designens (korta) nyckel som PREFIX av valnamnet, med ordgräns så t.ex.
  // "Symbol" inte matchar "Symbolens placering".
  const wants = Object.entries(fieldValues).map(([k, v]) => [norm(k), v]);
  const matchValue = nm => {
    // längsta matchande nyckel vinner (mest specifik)
    let best = null;
    for (const [key, val] of wants) {
      if (nm === key || nm.startsWith(key + ' ') || nm.startsWith(key + '?')) {
        if (!best || key.length > best[0].length) best = [key, val];
      }
    }
    return best ? best[1] : undefined;
  };

  const params = { quantity: 1 };
  let commentChoiceUid = null;
  for (const ch of choices) {
    const nm = norm(ch.name && (ch.name.sv || ch.name));
    if (/övrig info|ovrig info/.test(nm)) { commentChoiceUid = ch.uid; continue; }
    const desired = matchValue(nm);
    if (ch.type === 'enum' && Array.isArray(ch.options)) {
      if (desired === undefined) continue;
      const d = norm(desired);
      const on = o => norm(o.name && (o.name.sv || o.name));
      // exakt, annars prefix (optionsnamn kan ha prispåslag "Ja  (+120 SEK)")
      const opt = ch.options.find(o => on(o) === d)
        || ch.options.find(o => on(o).startsWith(d + ' ') || d.startsWith(on(o) + ' '));
      if (opt) params[ch.uid] = String(opt.uid);
    } else {
      // textfält: använd designens värde, annars "-" om obligatoriskt (får ej vara tomt)
      if (desired !== undefined && String(desired).trim() !== '') params[ch.uid] = String(desired);
      else if (ch.mandatory) params[ch.uid] = '-';
    }
  }
  // hela beställningstexten + designlänk i Övrig info (säkerhetsnät)
  if (commentChoiceUid) params[commentChoiceUid] = fallbackComment;

  // 3. skapa/hämta korg och lägg i artikeln
  const order = await rpc('Order.set',
    [null, { language: 'sv', currency: 'SEK', customer: { address: { country: 'SE' } } }, { uid: true }]);
  await rpc('Order.addArticle', [order.uid, articleUid, params, { uid: true }, { fastVerify: true }]);
  return { ok: true, orderUid: order.uid };
}

export const SHOP_URL = 'https://www.valleydogs.se/';
