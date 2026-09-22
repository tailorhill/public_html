// Lägg designen i Valley Dogs Abicart-varukorg.
//
// Butikens frontend är hårt bunden till sin cookie-session, som verktyget inte
// kan nå (annan origin). Lösning: verktyget skickar designen tillbaka till
// butiken, och en liten temasnutt DÄR (med cookie-sessionen) lägger halsbandet
// i den riktiga varukorgen. Verktyget behöver alltså ingen token – det bygger
// bara { artikel, fältvärden, beställningstext } och skickar till butiken.

const WEBSHOP = 119951;
const SHOP = 'https://www.valleydogs.se/';

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

export function articleUidFor(state, glitter) {
  if (state.family === 'cotton') {
    const g = glitter && ARTICLE_UIDS.cottonGlitter[state.cottonModel];
    const table = g ? ARTICLE_UIDS.cottonGlitter : ARTICLE_UIDS.cotton;
    return (table[state.cottonModel] && table[state.cottonModel][state.cottonWidth]) || null;
  }
  if (glitter) return ARTICLE_UIDS.biothaneGlitter;
  return ARTICLE_UIDS.biothane[state.bioModel] || null;
}

const b64url = s =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Bygg URL:en till butiken som lägger designen i varukorgen. Snutten där
// resolvar fältvärdena mot artikelns val och lägger den i cookie-korgen.
export function cartRedirectUrl(articleUid, fieldValues, comment) {
  const payload = b64url(JSON.stringify({ a: articleUid, f: fieldValues, c: comment }));
  return SHOP + '#vdadd=' + payload;
}
