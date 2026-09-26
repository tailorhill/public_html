import { TEXT_COLORS, COTTON_MODELS } from './data.js';

const option = (id, surcharge = 0, limit = 7) => ({
  id, name: id === 'custom' ? 'Egen storlek' : `${id.replace('-', '–')} cm`, surcharge, limit,
  previewCm: id === 'custom' ? null : id.split('-').map(Number).reduce((a, b) => a + b) / 2,
});
const standard = () => [option('30-35'), option('35-45', 10), option('45-55', 20, 10), option('custom', 30, null)];
// Custom sizes have no character limit; the requested measurements are entered in Övrig info.
export const SIZE_OPTIONS = {
  stallbart: {
    '2.5': [option('25-30'), option('30-35'), option('35-40'), option('custom', 30, null)],
    '3.5': standard(), '4': standard(),
  },
  justerbart: {
    '2.5': [option('25-30'), option('30-35'), option('25-35', 10), option('30-40', 10), option('custom', 30, null)],
    '3.5': standard(),
    '4': [option('35-45'), option('40-50', 10, 10), option('45-55', 20, 10), option('custom', 30, null)],
  },
};
export const sizeOptions = s => s.family === 'cotton' ? SIZE_OPTIONS[s.cottonModel]?.[s.cottonWidth] || [] : [];
export const selectedSize = s => sizeOptions(s).find(o => o.id === s.sizeRange) || null;
const color = id => TEXT_COLORS.find(c => c.id === id);

// -------------------------------------------------- innehållsmodell
// state.content = { rows: [ { els: [ {t:'text',text,font,color} | {t:'sym',id} ] } ],
//                   layout: 'stack'|'overlay', overlayPos }
// En rad = en ordnad sekvens av element (textbitar + symboler). Flera rader
// staplas (stack) eller läggs över varandra (overlay = gammal dubbeltext).
export const rows = s => (s.content && s.content.rows) || [];
export const textEls = row => row.els.filter(e => e.t === 'text');
export const symEls = row => row.els.filter(e => e.t === 'sym');
const strLen = t => Array.from((t || '').trim().normalize('NFC')).length;
export const rowTextChars = row => textEls(row).reduce((n, e) => n + strLen(e.text), 0);
export const rowSymbolCount = row => symEls(row).length;
export const rowUsed = row => rowTextChars(row) + rowSymbolCount(row);
export const hasContent = s => rows(s).some(r => r.els.some(e => e.t === 'sym' || strLen(e.text)));
// overlay (dubbeltext) = två rader ovanpå varandra
export const doubleText = s => s.content?.layout === 'overlay' && rows(s).length === 2;

export const shadowEnabled = s => s.family === 'cotton' && s.shadow && !doubleText(s);
export const shadowColorAllowed = c => !c.special;

// c = färgobjekt, el = { row, i } för elementet (row-index avgör overlay-regeln)
export function textColorAllowed(s, c, el = { row: 0 }) {
  if (!c) return false;
  if (s.family === 'biothane' && c.special && c.id !== 'dimmig') return false;
  if (doubleText(s) && c.special) return false;
  const nText = rows(s).reduce((n, r) => n + textEls(r).length, 0);
  if (s.family === 'biothane' && nText > 1 && c.id === 'dimmig') return false;
  // overlay: främre raden (row 1) ligger ovanpå bakre (row 0) – glitter fäster
  // bara på glitter
  if (doubleText(s) && el.row > 0) {
    const first = color(textEls(rows(s)[0])[0]?.color);
    if (first?.glitter && !c.glitter) return false;
    if (s.family === 'biothane' && !!first?.glitter !== !!c.glitter) return false;
  }
  if (shadowEnabled(s) && color(s.shadowColor)?.glitter && !c.glitter) return false;
  return true;
}
export function symbolColorAllowed(s, c) {
  if (doubleText(s) && c.special) return false;
  if (s.family === 'biothane') {
    if (c.special && c.id !== 'dimmig') return false;
    const first = color(textEls(rows(s)[0] || { els: [] })[0]?.color);
    if (first?.id === 'dimmig') return c.id === 'dimmig';
    if (c.id === 'dimmig') return false;
  }
  if (shadowEnabled(s) && s.shadowSymbols !== false && color(s.shadowColor)?.glitter && !c.glitter) return false;
  return true;
}

// Normalisera importerade designer och beroende val; trunkera aldrig text tyst.
export function normalizeDesign(s) {
  const changes = [];
  const model = COTTON_MODELS.find(m => m.id === s.cottonModel);
  if (model && !model.prices[s.cottonWidth]) s.cottonWidth = Object.keys(model.prices)[0];
  const options = sizeOptions(s);
  if (options.length && !selectedSize(s)) s.sizeRange = options[0].id;
  if (s.family === 'biothane' || doubleText(s)) s.shadow = false;
  if (!shadowColorAllowed(color(s.shadowColor) || {})) s.shadowColor = 'svart';
  rows(s).forEach((row, ri) => textEls(row).forEach(e => {
    if (!textColorAllowed(s, color(e.color), { row: ri })) {
      e.color = TEXT_COLORS.find(c => textColorAllowed(s, c, { row: ri })).id;
      changes.push('En text fick en tillåten färg för den valda kombinationen.');
    }
  }));
  if (s.symbolColor && !symbolColorAllowed(s, color(s.symbolColor) || {})) {
    s.symbolColor = '';
    changes.push('Symbolfärgen följer nu textfärgen.');
  }
  return changes;
}

// -------------------------------------------------- teckengränser
// Gränsen (size.limit) gäller PER RAD: radens texttecken + symboler.
export const symbolCount = s => rows(s).reduce((n, r) => n + rowSymbolCount(r), 0);
export const characterCounts = s => rows(s).map(rowTextChars);

// Hur många tecken till som får skrivas i ett givet textelement.
export function textInputLimit(s, el = s.activeEl || { row: 0, i: 0 }) {
  const size = selectedSize(s);
  if (!size) return 24;
  if (size.limit === null) return null;
  const row = rows(s)[el.row];
  if (!row) return size.limit;
  const target = row.els[el.i];
  const thisChars = target && target.t === 'text' ? strLen(target.text) : 0;
  return Math.max(0, size.limit - (rowUsed(row) - thisChars));
}

// Får man lägga till ett element (symbol eller text) i en rad?
export function canAddToRow(s, rowIndex = (s.activeEl?.row ?? 0)) {
  const size = selectedSize(s);
  if (!size || size.limit === null) return true;
  const row = rows(s)[rowIndex];
  if (!row) return true;
  return rowUsed(row) < size.limit;
}

export function validationErrors(s) {
  const errors = [], size = selectedSize(s);
  if (size && size.limit !== null) {
    rows(s).forEach((row, i) => {
      const used = rowUsed(row);
      if (used > size.limit) {
        const label = rows(s).length > 1 ? `Rad ${i + 1}: ` : '';
        errors.push(`${label}Vald storlek tillåter max ${size.limit} tecken inklusive symboler (${used} valda). Korta texten eller ta bort symboler.`);
      }
    });
  }
  if (size?.id === 'custom' && !s.extraInfo.trim()) errors.push('Skriv önskat storleksintervall i Övrig info för egen storlek.');
  rows(s).forEach((row, ri) => textEls(row).forEach(e => {
    if (!textColorAllowed(s, color(e.color), { row: ri })) errors.push('Otillåten färg på en text.');
  }));
  return errors;
}
export const previewCircumference = s => selectedSize(s)?.previewCm ?? s.circumference;
export const sizeDescription = s => selectedSize(s)?.name || `${s.circumference} cm`;
