// Lägg designen i Valley Dogs Abicart-varukorg.
//
// Butikens frontend är hårt bunden till sin cookie-session, som verktyget inte
// kan nå (annan origin). Lösning: verktyget resolvar designen mot artikelns
// RIKTIGA val (API:t är öppet för läsning via CORS) och skickar färdiga
// val-uid:n till butiken, där en liten temasnutt lägger halsbandet i
// cookie-korgen. All mappnings- och valideringslogik ligger alltså här – en
// enda källa – och snutten blir dum och stabil.

const WEBSHOP = 119951;
const SHOP = 'https://www.valleydogs.se/';
const API = SHOP + 'backend/jsonrpc/v1?webshop=' + WEBSHOP + '&language=sv&vat_country=SE';

// Artikel-uid per produkt (från Article.list, webshop 119951).
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

export function articleUidFor(state, glitter) {
  if (state.family === 'cotton') {
    const g = glitter && ARTICLE_UIDS.cottonGlitter[state.cottonModel];
    const table = g ? ARTICLE_UIDS.cottonGlitter : ARTICLE_UIDS.cotton;
    return (table[state.cottonModel] && table[state.cottonModel][state.cottonWidth]) || null;
  }
  if (glitter) return ARTICLE_UIDS.biothaneGlitter;
  return ARTICLE_UIDS.biothane[state.bioModel] || null;
}

// ------------------------------------------------------------------ helpers
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const nm = o => (o && (o.sv || o)) || '';

async function rpc(method, params) {
  const r = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || 'API-fel');
  return j.result;
}

const b64url = s =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Klassa ett valnamn på nyckelord → semantisk kategori. Robust mot butikens
// spretiga namn (typos "bomusllsband", singular/plural "D-ring(ar)",
// suffix "bomullsband(et)", omformuleringar "Vart ska symbolen placeras?").
function classify(name, type, options) {
  const n = norm(name);
  const opts = (options || []).map(o => norm(nm(o.name)));
  const onlyJaNej = type === 'enum' && opts.length > 0 && opts.every(o => o === 'ja' || o === 'nej');
  if (/övrig info|ovrig info/.test(n)) return 'comment';
  if (onlyJaNej || /äkta läder|akta lader|läder på|lader pa/.test(n)) return 'leather';
  if (/foder/.test(n)) return 'foder';
  if (/klickspänne|klickspanne/.test(n)) return 'buckle';
  if (/typsnitt/.test(n)) return 'font';
  // BioThane slår ihop text+symbolfärg i ett fält → fyll med textfärgen
  if (/text/.test(n) && /symbol/.test(n) && /(färg|farg)/.test(n)) return 'textColor';
  if (/symbol/.test(n)) {
    if (/placer|vart ska/.test(n)) return 'placement';
    if (/(färg|farg)/.test(n)) return 'symbolColor';
    return 'symbol';
  }
  if (/skugga/.test(n)) return 'shadow';
  if (/beslag|d-ring|dring/.test(n)) return 'hardware';
  if (/strypdel/.test(n)) return /längd|langd/.test(n) ? 'strypLength' : 'strypType';
  // storlek FÖRE bredd/modell: storleksval kan nämna "modellen"/"bredd" i sin
  // text, men bredd-/modellval nämner aldrig "storlek"
  if (/storlek/.test(n)) return /(åtdraget|atdraget)/.test(n) ? 'sizeTight' : 'sizeClosed';
  if (/bredd/.test(n)) return 'bioWidth';
  if (/modell/.test(n)) return 'bioModel';
  if (/glitt/.test(n) && /(färg|farg)/.test(n)) return 'glitterColor';
  if (/(färg|farg)/.test(n) && /biothane/.test(n)) return 'biothaneColor';
  if (/(färg|farg)/.test(n) && /(bomull|bomusll)/.test(n)) return 'webbingColor';
  if (/(färg|farg)/.test(n) && /text/.test(n)) return 'textColor';
  if (/vad ska/.test(n) && /(stå|sta)/.test(n)) return 'text';
  return null;
}

// Matcha ett önskat namn mot en options-lista (exakt → prefix åt endera håll →
// början-av-sträng). Fångar "Antik mässing" vs "Antik mässing pläterad" och
// "Svart plast" vs "Svart plastspänne".
function pickOption(desired, options) {
  if (desired == null) return null;
  const d = norm(desired);
  let o = options.find(x => norm(nm(x.name)) === d);
  if (o) return o;
  o = options.find(x => { const on = norm(nm(x.name)); return on.indexOf(d + ' ') === 0 || d.indexOf(on + ' ') === 0; });
  if (o) return o;
  o = options.find(x => { const on = norm(nm(x.name)); return on.indexOf(d) === 0 || d.indexOf(on) === 0; });
  return o || null;
}

// Storleksdropdown på ställbara: matcha halsmåttet mot ett intervall "30-45 cm".
function pickSizeRange(cm, options) {
  for (const o of options) {
    const m = nm(o.name).match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m && cm >= +m[1] && cm <= +m[2]) return o;
  }
  return options.find(o => /egen/i.test(nm(o.name))) || null; // annars "Egen storlek" (exakt mått står i övrig info)
}

// ------------------------------------------------------------- huvudresolver
// Hämtar artikelns riktiga val och bygger { valUid: värde }. Rapporterar
// problem = obligatoriska val där kundens design inte går att välja för just
// den artikeln (t.ex. en färg/symbol modellen saknar) → verktyget kan då säga
// åt kunden att ändra INNAN vi skickar iväg till butiken.
export async function resolveOrder(articleUid, design) {
  const art = await rpc('Article.get', [articleUid,
    { choices: { uid: true, name: true, type: true, mandatory: true, options: { uid: true, name: true } } }]);
  const params = {};
  const problems = [];
  let commentUid = null;

  const setEnum = (ch, desired, label, opts = {}) => {
    const options = ch.options || [];
    let o = pickOption(desired, options);
    if (!o && options.length === 1) o = options[0];              // bara ett val → ta det
    if (!o && opts.defaultMatch) o = options.find(x => opts.defaultMatch.test(norm(nm(x.name)))) || null;
    if (!o && desired != null && ch.mandatory) {
      problems.push(`${label}: "${desired}" går inte att välja för den här modellen.`);
      return;
    }
    if (!o && ch.mandatory && opts.fallbackFirst && options.length) o = options[0];
    if (o) params[ch.uid] = String(o.uid);
    else if (ch.mandatory) problems.push(`${label} kunde inte fyllas i automatiskt.`);
  };
  const setStr = (ch, value) => {
    const v = (value == null || String(value).trim() === '') ? '-' : String(value);
    params[ch.uid] = v;
  };

  for (const ch of (art.choices || [])) {
    const cat = classify(nm(ch.name), ch.type, ch.options);
    const isEnum = ch.type === 'enum';
    switch (cat) {
      case 'comment': commentUid = ch.uid; break;
      case 'webbingColor': isEnum ? setEnum(ch, design.webbingColor, 'Färg på bandet') : setStr(ch, design.webbingColor); break;
      case 'biothaneColor': isEnum ? setEnum(ch, design.biothaneColor, 'Färg på BioThane') : setStr(ch, design.biothaneColor); break;
      case 'bioWidth': isEnum ? setEnum(ch, design.bioWidth, 'Bredd') : setStr(ch, design.bioWidth); break;
      case 'bioModel': isEnum ? setEnum(ch, design.bioModel, 'Halsbandsmodell') : setStr(ch, design.bioModel); break;
      case 'leather': isEnum ? setEnum(ch, design.leather, 'Äkta läder på fodret') : setStr(ch, design.leather); break;
      case 'foder': setStr(ch, design.foder); break;
      case 'buckle': isEnum ? setEnum(ch, 'Svart plast', 'Klickspänne', { fallbackFirst: true }) : setStr(ch, 'Svart plast'); break;
      case 'font': isEnum ? setEnum(ch, design.font, 'Typsnitt') : setStr(ch, design.font); break;
      case 'symbol': isEnum ? setEnum(ch, design.symbol, 'Symbol', { fallbackFirst: true }) : setStr(ch, design.symbol); break;
      case 'placement': isEnum ? setEnum(ch, design.placement, 'Symbolens placering', { fallbackFirst: true }) : setStr(ch, design.placement); break;
      case 'symbolColor': setStr(ch, design.symbolColor); break;
      case 'textColor': setStr(ch, design.textColor); break;
      case 'text': setStr(ch, design.text); break;
      case 'shadow': setStr(ch, design.shadow); break;
      case 'hardware': isEnum ? setEnum(ch, design.hardware, 'Beslag', { fallbackFirst: true }) : setStr(ch, design.hardware); break;
      case 'strypType': isEnum ? setEnum(ch, 'Vanligt i bomull', 'Strypdel', { defaultMatch: /vanlig|bomull/, fallbackFirst: true }) : setStr(ch, 'Vanligt i bomull'); break;
      case 'strypLength': isEnum ? setEnum(ch, '8 cm', 'Längd på strypdel', { defaultMatch: /8\s*cm/, fallbackFirst: true }) : setStr(ch, '8 cm'); break;
      case 'sizeClosed':
        if (isEnum) { const o = pickSizeRange(design.sizeCm, ch.options || []); if (o) params[ch.uid] = String(o.uid); else if (ch.mandatory) problems.push('Storlek kunde inte matchas mot ett intervall.'); }
        else setStr(ch, `${design.sizeCm} cm`);
        break;
      case 'sizeTight':
        // åtdraget mått finns inte i verktyget – hänvisa till övrig info
        if (isEnum) setEnum(ch, null, 'Storlek (åtdraget)', { fallbackFirst: true });
        else setStr(ch, `Se stängt mått (${design.sizeCm} cm) / övrig info`);
        break;
      case 'glitterColor': setStr(ch, design.glitterColor); break;
      default:
        // okänt obligatoriskt val: ta enda alternativet, annars flagga/streck
        if (ch.mandatory) {
          if (isEnum) { if ((ch.options || []).length === 1) params[ch.uid] = String(ch.options[0].uid); else problems.push(`Valet "${nm(ch.name).trim()}" känns inte igen automatiskt.`); }
          else setStr(ch, '-');
        }
    }
  }

  if (commentUid) params[commentUid] = design.comment || '';
  return { params, problems };
}

// Bygg URL:en till butiken med färdiga val-uid:n. Snutten där gör bara
// Order.addArticle med dessa – ingen egen mappning.
export function cartUrl(articleUid, params, comment) {
  const payload = b64url(JSON.stringify({ a: articleUid, p: params, c: comment }));
  return SHOP + '#vdadd=' + payload;
}
