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

// Artikel-uid per produkt. Fylls från Abicarts API-konsol (Article.list) –
// en läsning per produkt, inga köp. Känt sedan tidigare: Fast halsband 4 cm.
// Nycklar: cotton "<model>_<width>" och biothane "<model>_<width>".
export const ARTICLE_UIDS = {
  'cotton_fast_4': 188162041,
  // TODO fyll på övriga varianter (uid från Article.list i API-konsolen):
  // 'cotton_fast_2.5': ..., 'cotton_halvstryp_4': ..., 'biothane_fast_25': ... osv.
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

export function articleUidFor(state) {
  const key = state.family === 'cotton'
    ? `cotton_${state.cottonModel}_${state.cottonWidth}`
    : `biothane_${state.bioModel}_${state.bioWidth}`;
  return ARTICLE_UIDS[key] || null;
}

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Bygg { valnamn(normaliserat) : önskat värde } från designen.
// Värdet är antingen ett options-NAMN (enum) eller fritext.
// choiceValues() tar en färdig "fält→värde"-karta från app.js (byggd av samma
// data som beställningstexten) så vi slipper duplicera katalogkännedomen här.

// Kör hela köpet: hämta val, matcha, lägg i korg. Returnerar {ok, orderUid}.
export async function addToCart(articleUid, fieldValues, fallbackComment) {
  if (!sessionToken) throw new Error('Ingen sessionstoken – öppna verktyget via butikens designknapp.');

  // 1. artikelns val med namn, typ och options
  const article = await rpc('Article.get', [articleUid, { uid: true, choices: true }]);
  const choiceUids = article.choices || [];
  const choices = await Promise.all(choiceUids.map(uid =>
    rpc('ArticleChoice.get', [uid, { uid: true, name: true, type: true, options: { uid: true, name: true } }])));

  // 2. bygg params: matcha varje val mot designens fält (på namn)
  const want = {};
  for (const [k, v] of Object.entries(fieldValues)) want[norm(k)] = v;

  const params = { quantity: 1 };
  let commentChoiceUid = null;
  for (const ch of choices) {
    const nm = norm(ch.name && (ch.name.sv || ch.name));
    // "Övrig info" – spara uid, fylls sist med hela specen
    if (/övrig info|ovrig info/.test(nm)) { commentChoiceUid = ch.uid; continue; }
    if (!(nm in want)) continue;
    const desired = want[nm];
    if (ch.type === 'enum' && Array.isArray(ch.options)) {
      const d = norm(desired);
      // exakt match först, annars "börjar med" (optionsnamn kan ha prispåslag,
      // t.ex. "Ja  (+120 SEK)" mot vårt "Ja")
      const on = o => norm(o.name && (o.name.sv || o.name));
      const opt = ch.options.find(o => on(o) === d)
        || ch.options.find(o => on(o).startsWith(d + ' ') || d.startsWith(on(o) + ' '));
      if (opt) params[ch.uid] = String(opt.uid);
    } else {
      params[ch.uid] = String(desired);
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
