const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const i18n = await import('../js/i18n.js');
  const { DICT, detectLang, t, tName, setLang, getLang } = i18n;

  // ---- språkdetektering: ?lang= → sparat val → webbläsarens språk → tidszon ----
  assert.equal(detectLang(), 'sv');                       // node: alltid svenska
  const env = ({ search = '', saved = null, langs = [], tz = 'UTC' }) => {
    globalThis.window = {};
    globalThis.location = { search };
    globalThis.localStorage = { getItem: () => saved, setItem() {} };
    Object.defineProperty(globalThis, 'navigator', { value: { languages: langs, language: langs[0] }, configurable: true });
    const real = Intl.DateTimeFormat;
    Intl.DateTimeFormat = () => ({ resolvedOptions: () => ({ timeZone: tz }) });
    try { return detectLang(); } finally { Intl.DateTimeFormat = real; delete globalThis.window; }
  };
  assert.equal(env({ search: '?lang=en', saved: 'sv', langs: ['sv-SE'] }), 'en');   // länk vinner
  assert.equal(env({ search: '?lang=xx', saved: 'en', langs: ['sv-SE'] }), 'en');   // okänt → sparat
  assert.equal(env({ saved: 'sv', langs: ['en-US'] }), 'sv');                       // sparat vinner över webbläsaren
  assert.equal(env({ langs: ['en-GB', 'sv'] }), 'en');                              // första kända språket
  assert.equal(env({ langs: ['de-DE', 'sv-SE', 'en'] }), 'sv');                     // tyska okänt → svenska
  assert.equal(env({ langs: ['nb-NO'] }), 'sv');                                    // nordiska → svenska
  assert.equal(env({ langs: ['da'] }), 'sv');
  assert.equal(env({ langs: ['de-DE'], tz: 'Europe/Stockholm' }), 'sv');            // okänt språk i Sverige
  assert.equal(env({ langs: ['de-DE'], tz: 'Europe/Berlin' }), 'en');               // okänt språk utomlands
  delete globalThis.location; delete globalThis.localStorage;

  // ---- samma nycklar på båda språken ----
  const sv = Object.keys(DICT.sv), en = Object.keys(DICT.en);
  assert.deepEqual(sv.filter(k => !DICT.en[k]), [], 'saknas på engelska');
  assert.deepEqual(en.filter(k => !DICT.sv[k]), [], 'saknas på svenska');
  for (const k of sv) {                                     // samma {platshållare}
    const vars = s => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(vars(DICT.sv[k]), vars(DICT.en[k]), `platshållare skiljer: ${k}`);
  }

  // ---- alla nycklar som används i HTML/JS finns ----
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) used.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach(p => used.add(p.split(':')[1].trim()));
  for (const f of ['app.js', 'design-rules.js', 'library-picker.js', 'font-library.js']) {
    const js = fs.readFileSync(path.join(root, 'js', f), 'utf8');
    for (const m of js.matchAll(/\bt\('([\w.]+)'/g)) used.add(m[1]);
  }
  assert.deepEqual([...used].filter(k => !DICT.sv[k]), [], 'nyckel saknas i ordlistan');

  // ---- katalognamn: svenska i sv, översatta i en ----
  assert.equal(getLang(), 'sv');
  assert.equal(tName('Svart'), 'Svart');
  setLang('en');
  assert.equal(getLang(), 'en');
  assert.equal(t('kr', { n: 399 }), '399 SEK');
  assert.equal(tName('Svart'), 'Black');
  assert.equal(tName('Guldglitter'), 'Gold glitter');
  assert.equal(tName('Silvermetallic'), 'Silver metallic');
  assert.equal(tName('Guld pläterad'), 'Gold plated');
  assert.equal(tName('Egen storlek (max 10 cm ställbar del)'), 'Custom size (max 10 cm adjustable part)');
  assert.equal(tName('2,5 cm'), '2.5 cm');
  assert.equal(tName('Okänt nytt material'), 'Okänt nytt material');   // okänt → svenska
  assert.equal(t('finns.inte'), 'finns.inte');                          // okänd nyckel → nyckeln
  setLang('sv');

  // ---- språkbyte skriver om ?lang= så att omladdning behåller valet ----
  const urls = [];
  globalThis.location = { href: 'http://x/?lang=en#d=abc' };
  globalThis.history = { state: null, replaceState: (st, _, u) => urls.push(String(u)) };
  setLang('en');
  assert.deepEqual(urls, ['http://x/?lang=en#d=abc']);
  globalThis.location = { href: 'http://x/?lang=en#d=abc' };
  setLang('sv');
  assert.equal(urls.at(-1), 'http://x/?lang=sv#d=abc');               // designen (#d=) behålls
  globalThis.location = { href: 'http://x/#d=abc' };
  setLang('en'); setLang('sv');
  assert.equal(urls.length, 2);                                        // utan ?lang= rörs adressen inte
  delete globalThis.location; delete globalThis.history;

  console.log(`PASS: i18n – språkdetektering, ${sv.length} nycklar på båda språken, ${used.size} använda nycklar, katalognamn.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
