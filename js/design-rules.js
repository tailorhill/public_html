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
export const doubleText = s => s.texts.length === 2 && s.textLayout === 'dubbel';
const color = id => TEXT_COLORS.find(c => c.id === id);
export const shadowEnabled = s => s.family === 'cotton' && s.shadow && !doubleText(s);
export const shadowColorAllowed = c => !c.special;

export function textColorAllowed(s, c, index = 0) {
  if (!c) return false;
  if (s.family === 'biothane' && c.special && c.id !== 'dimmig') return false;
  if (doubleText(s) && c.special) return false;
  if (s.family === 'biothane' && s.texts.length > 1 && c.id === 'dimmig') return false;
  if (index > 0) {
    const first = color(s.texts[0].color);
    if (first?.glitter && !c.glitter) return false;
    if (s.family === 'biothane' && doubleText(s) && !!first?.glitter !== !!c.glitter) return false;
  }
  if (shadowEnabled(s) && color(s.shadowColor)?.glitter && !c.glitter) return false;
  return true;
}
export function symbolColorAllowed(s, c) {
  if (doubleText(s) && c.special) return false;
  if (s.family === 'biothane') {
    if (c.special && c.id !== 'dimmig') return false;
    const first = color(s.texts[0].color);
    if (first?.id === 'dimmig') return c.id === 'dimmig';
    if (c.id === 'dimmig') return false;
  }
  if (shadowEnabled(s) && s.shadowSymbols !== false && color(s.shadowColor)?.glitter && !c.glitter) return false;
  return true;
}

// Normalize imported designs and dependent choices, never silently truncate text.
export function normalizeDesign(s) {
  const changes = [];
  const model = COTTON_MODELS.find(m => m.id === s.cottonModel);
  if (model && !model.prices[s.cottonWidth]) s.cottonWidth = Object.keys(model.prices)[0];
  const options = sizeOptions(s);
  if (options.length && !selectedSize(s)) s.sizeRange = options[0].id;
  if (s.family === 'biothane' || doubleText(s)) s.shadow = false;
  if (!shadowColorAllowed(color(s.shadowColor) || {})) s.shadowColor = 'svart';
  s.texts.forEach((t, i) => {
    t.size = 'stor';
    if (!textColorAllowed(s, color(t.color), i)) {
      t.color = TEXT_COLORS.find(c => textColorAllowed(s, c, i)).id;
      changes.push(`Text ${i + 1} fick en tillåten färg för den valda kombinationen.`);
    }
  });
  if (s.symbolColor && !symbolColorAllowed(s, color(s.symbolColor) || {})) {
    s.symbolColor = '';
    changes.push('Symbolfärgen följer nu textfärgen.');
  }
  return changes;
}

export function symbolCount(s) {
  if (!s.symbol || s.symbol === 'ingen') return 0;
  return s.symbolPlacement === 'bada' && s.texts.some(t => t.text.trim()) ? 2 : 1;
}
export function characterCounts(s) {
  return s.texts.map(t => Array.from(t.text.trim().normalize('NFC')).length);
}
// Reserve the space occupied by symbols and by other sequential text blocks.
export function textInputLimit(s, index = s.activeText || 0) {
  const size = selectedSize(s);
  if (!size) return 24;
  if (size.limit === null) return null;
  const symbols = !s.symbol || s.symbol === 'ingen' ? 0 : s.symbolPlacement === 'bada' ? 2 : 1;
  const others = s.textLayout === 'rad'
    ? characterCounts(s).reduce((sum, count, i) => sum + (i === index ? 0 : count), 0) : 0;
  return Math.max(0, size.limit - symbols - others);
}

export function symbolChoiceAllowed(s, symbol, placement = s.symbolPlacement) {
  const size = selectedSize(s);
  if (!size || size.limit === null) return true;
  const next = { ...s, symbol, symbolPlacement: placement };
  if (symbolCount(next) <= symbolCount(s)) return true;
  const counts = characterCounts(s);
  const text = s.textLayout === 'rad' ? counts.reduce((a, b) => a + b, 0) : Math.max(0, ...counts);
  return text + symbolCount(next) <= size.limit;
}

export function validationErrors(s) {
  const errors = [], size = selectedSize(s), counts = characterCounts(s);
  if (size) {
    // Layered/stacked names each share the available width; sequential texts share it.
    const used = (s.textLayout === 'rad' ? counts.reduce((a, b) => a + b, 0) : Math.max(0, ...counts)) + symbolCount(s);
    if (size.limit !== null && used > size.limit) errors.push(`Vald storlek tillåter max ${size.limit} tecken inklusive symboler (${used} valda). Korta texten eller ändra symbolerna.`);
    if (size.id === 'custom' && !s.extraInfo.trim()) errors.push('Skriv önskat storleksintervall i Övrig info för egen storlek.');
  }
  s.texts.forEach((t, i) => { if (!textColorAllowed(s, color(t.color), i)) errors.push(`Otillåten färg på text ${i + 1}.`); });
  return errors;
}
export const previewCircumference = s => selectedSize(s)?.previewCm ?? s.circumference;
export const sizeDescription = s => selectedSize(s)?.name || `${s.circumference} cm`;
