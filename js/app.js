import {
  BIOTHANE_COLORS, WEBBING_COLORS, LINING_GROUPS, TEXT_COLORS, FONTS, SYMBOLS,
  HARDWARE_FINISHES, SYMBOL_PLACEMENTS, COTTON_MODELS, COTTON_WIDTHS, BIOTHANE,
  LEATHER_SURCHARGE, EXPRESS_SURCHARGE, SHIPPING, PRODUCT_URLS, TEXT_LAYOUTS,
  DUBBEL_POSITIONS, TEXT_SIZES, allLinings,
} from './data.js';
import { CollarViewer } from './collar3d.js';
import { drawSymbol } from './symbols.js';

const $ = sel => document.querySelector(sel);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

const state = {
  family: 'cotton',            // 'cotton' | 'biothane'
  cottonModel: 'fast',
  cottonWidth: '4',
  bioModel: 'fast',
  bioWidth: '25',
  circumference: 45,
  webbing: 'rod',
  biothane: 'sverigebla',
  lining: 'ss-svart',
  fullGlitter: false,
  glitterColor: 'guldglitter',
  texts: [
    { text: 'LUNA', font: 'built', color: 'vit', size: 'mellan' },
  ],
  activeText: 0,               // vilken textflik som visas
  textLayout: 'rad',           // 'rad' | 'rader' | 'dubbel'
  dubbelPos: 'mitten',         // 'topp' | 'mitten' | 'botten'
  symbol: 'tass',
  symbolPlacement: 'efter',
  symbolColor: '',             // '' = samma som texten
  shadow: false,
  shadowColor: 'svart',
  hardware: 'stal',
  showHardware: true,
  express: false,
  shipping: 'sverige',
  extraInfo: '',
};

const viewer = new CollarViewer($('#c3d'));
window.viewer = viewer;

// ---------------------------------------------------------------- helpers
const linings = allLinings();
const byId = (list, id) => list.find(x => x.id === id);

function currentWidthCm() {
  return state.family === 'cotton'
    ? byId(COTTON_WIDTHS, state.cottonWidth).cm
    : byId(BIOTHANE.widths, state.bioWidth).cm;
}

function currentModel() {
  return state.family === 'cotton'
    ? byId(COTTON_MODELS, state.cottonModel)
    : byId(BIOTHANE.models, state.bioModel);
}

function modelKind() {
  const id = state.family === 'cotton' ? state.cottonModel : state.bioModel;
  if (id.includes('halvstryp') || id === 'justerbart') return 'halvstryp';
  if (id === 'stallbart') return 'stallbart';
  return id === 'justerbart' ? 'justerbart' : 'fast';
}

function glitterAvailable() {
  if (state.family === 'biothane') return true;
  return !!byId(COTTON_MODELS, state.cottonModel).glitterPrices;
}

function textColorAllowed(c) {
  if (state.family === 'biothane' && c.special) return false; // specialfärger ej på biothane
  return true;
}

function shadowColorAllowed(c) {
  return !c.special; // special ej som skugga
}

const MAX_TEXTS = 3;
const NEW_TEXT_DEFAULTS = [
  null,
  { text: 'Sparky', font: 'magnolia', color: 'guldglitter', size: 'mellan' },
  { text: '070-123 45 67', font: 'avenir', color: 'vit', size: 'liten' },
];

function isDouble() {
  return state.texts.length === 2 && state.textLayout === 'dubbel';
}

// Butikens regel för dubbeltext: glitter på glitter, eller slät under och
// glitter över. Specialfärger går inte alls. Returnerar varningstext eller ''.
function doubleTextWarning() {
  if (!isDouble()) return '';
  const c1 = byId(TEXT_COLORS, state.texts[0].color);
  const c2 = byId(TEXT_COLORS, state.texts[1].color);
  if (c1.special || c2.special) {
    return 'Specialfärger (Regnbåge, Dimmig, metallic, Reflex) kan inte användas vid dubbeltext.';
  }
  const ok = (c1.glitter && c2.glitter) || (!c1.glitter && c2.glitter);
  return ok ? '' : 'Vid dubbeltext måste det vara glitter på glitter, eller slät färg under och glitter över (välj en glitterfärg på text 2).';
}

function computePrice() {
  const rows = [];
  let total = 0;
  if (state.family === 'cotton') {
    const model = byId(COTTON_MODELS, state.cottonModel);
    const w = state.cottonWidth;
    const useGlitter = state.fullGlitter && model.glitterPrices;
    const table = useGlitter ? model.glitterPrices : model.prices;
    const base = table[w];
    rows.push([`${useGlitter ? 'Helglittrigt ' : ''}${model.name} ${byId(COTTON_WIDTHS, w).name}`, base]);
    total += base;
    const lin = byId(linings, state.lining);
    if (lin && lin.leather) {
      const ls = LEATHER_SURCHARGE[w];
      rows.push(['Äkta läder på fodret', ls]);
      total += ls;
    }
    const hwf = byId(HARDWARE_FINISHES, state.hardware);
    if (hwf.surcharge) { rows.push([hwf.name, hwf.surcharge.cotton]); total += hwf.surcharge.cotton; }
  } else {
    const base = state.fullGlitter ? BIOTHANE.glitterBasePrice : BIOTHANE.basePrice;
    rows.push([`${state.fullGlitter ? 'Helglittrigt halsband' : 'Halsband'} i BioThane Beta®`, base]);
    total += base;
    const model = byId(BIOTHANE.models, state.bioModel);
    if (model.surcharge) { rows.push([model.name, model.surcharge]); total += model.surcharge; }
    const width = byId(BIOTHANE.widths, state.bioWidth);
    if (width.surcharge) { rows.push([`Bredd ${width.name}`, width.surcharge]); total += width.surcharge; }
    const hwf = byId(HARDWARE_FINISHES, state.hardware);
    if (hwf.surcharge) { rows.push([hwf.name, hwf.surcharge.biothane]); total += hwf.surcharge.biothane; }
  }
  if (state.express) {
    rows.push(['Expresshantering', EXPRESS_SURCHARGE]);
    total += EXPRESS_SURCHARGE;
  }
  const ship = byId(SHIPPING, state.shipping);
  rows.push([ship.rowLabel, ship.price]);
  total += ship.price;
  return { rows, total };
}

// ---------------------------------------------------------------- 3D sync
let rebuildQueued = false;
function rebuild3D() {
  if (rebuildQueued) return;
  rebuildQueued = true;
  requestAnimationFrame(() => {
    rebuildQueued = false;
    const isCotton = state.family === 'cotton';
    const widthCm = currentWidthCm();
    const lin = byId(linings, state.lining) || linings[0];
    const cfg = {
      family: state.family,
      width: widthCm,
      bandWidthCm: isCotton ? widthCm - 1 : widthCm,
      circumference: state.circumference,
      bandColor: isCotton ? byId(WEBBING_COLORS, state.webbing).hex : byId(BIOTHANE_COLORS, state.biothane).hex,
      lining: isCotton ? lin : null,
      fullGlitter: state.fullGlitter && glitterAvailable(),
      glitterColor: byId(TEXT_COLORS, state.glitterColor)?.hex,
      texts: state.texts.map(t => ({
        text: t.text,
        font: byId(FONTS, t.font),
        color: byId(TEXT_COLORS, t.color),
        sizeK: byId(TEXT_SIZES, t.size).k,
      })),
      textLayout: state.textLayout,
      dubbelPos: state.dubbelPos,
      symbol: state.symbol,
      symbolPlacement: state.symbolPlacement,
      symbolColor: state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null,
      shadowColor: (state.shadow && !isDouble()) ? byId(TEXT_COLORS, state.shadowColor) : null,
      hardware: byId(HARDWARE_FINISHES, state.hardware),
      showHardware: state.showHardware,
      modelKind: modelKind(),
    };
    viewer.build(cfg);
  });
}

// ---------------------------------------------------------------- UI bygge

// Liten glittertextur (transparent PNG) som läggs ovanpå glitterswatcharna.
const GLITTER_OVERLAY = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 56;
  const x = c.getContext('2d');
  for (let i = 0; i < 130; i++) {
    const bright = Math.random() < 0.6;
    x.fillStyle = bright
      ? `rgba(255,255,255,${0.35 + Math.random() * 0.5})`
      : `rgba(0,0,0,${0.15 + Math.random() * 0.25})`;
    const s = Math.random() < 0.14 ? 2 : 1;
    x.fillRect(Math.random() * 56, Math.random() * 56, s, s);
  }
  // några större glimtar
  x.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 6; i++) {
    const px = Math.random() * 56, py = Math.random() * 56;
    x.fillRect(px - 1.5, py, 4, 1);
    x.fillRect(px, py - 1.5, 1, 4);
  }
  return `url(${c.toDataURL()})`;
})();

function swatchBackground(c) {
  if (c.glitter) return `${GLITTER_OVERLAY}, linear-gradient(${c.hex}, ${c.hex})`;
  if (c.special === 'rainbow') return 'linear-gradient(135deg,#e4342c,#f09022,#ecd51b,#3fae49,#2e6db4,#8a3f9e)';
  if (c.special === 'pastelrainbow') return 'linear-gradient(135deg,#f2a1b4,#f5cf9c,#f7f0a8,#a8dcb2,#a5c8ec,#cbaede)';
  if (c.special === 'metal') {
    const l = '#ffffffcc';
    return `linear-gradient(125deg, ${c.hex} 20%, ${l} 42%, ${c.hex} 55%, ${l} 78%, ${c.hex} 95%)`;
  }
  if (c.hex2) return `linear-gradient(135deg, ${c.hex} 55%, ${c.hex2} 55%)`;
  return c.hex;
}

function swatchGrid(container, list, getSel, onPick, opts = {}) {
  container.innerHTML = '';
  for (const c of list) {
    const disabled = opts.isDisabled ? opts.isDisabled(c) : false;
    const b = el('button', 'swatch' + (getSel() === c.id ? ' sel' : '') + (disabled ? ' dis' : ''));
    b.type = 'button';
    b.title = c.name + (c.note ? ` – ${c.note}` : '');
    b.style.background = swatchBackground(c);
    if (c.special) b.classList.add('spec');
    b.disabled = disabled;
    b.addEventListener('click', () => { onPick(c.id); refresh(); });
    const lbl = el('span', 'sw-name', c.name);
    b.appendChild(lbl);
    container.appendChild(b);
  }
}

function segmented(container, list, getSel, onPick, nameFn = x => x.name) {
  container.innerHTML = '';
  for (const item of list) {
    const b = el('button', 'seg' + (getSel() === item.id ? ' sel' : ''), nameFn(item));
    b.type = 'button';
    b.addEventListener('click', () => { onPick(item.id); refresh(); });
    container.appendChild(b);
  }
}

function selectBox(container, list, getSel, onPick, nameFn = x => x.name) {
  container.innerHTML = '';
  const s = el('select');
  for (const item of list) {
    const o = el('option', null, nameFn(item));
    o.value = item.id;
    if (getSel() === item.id) o.selected = true;
    s.appendChild(o);
  }
  s.addEventListener('change', () => { onPick(s.value); refresh(); });
  container.appendChild(s);
  return s;
}

function refresh() {
  // familj
  document.querySelectorAll('[data-family]').forEach(b => {
    b.classList.toggle('sel', b.dataset.family === state.family);
  });
  $('#cottonOpts').style.display = state.family === 'cotton' ? '' : 'none';
  $('#bioOpts').style.display = state.family === 'biothane' ? '' : 'none';

  // modell + bredd
  if (state.family === 'cotton') {
    // se till att vald bandfärg finns i vald bredd
    const ensureWebbing = () => {
      const c = byId(WEBBING_COLORS, state.webbing);
      if (!c || !c.widths.includes(state.cottonWidth)) state.webbing = 'svart';
    };
    segmented($('#modelSeg'), COTTON_MODELS, () => state.cottonModel, id => {
      state.cottonModel = id;
      if (!byId(COTTON_MODELS, id).prices[state.cottonWidth]) {
        state.cottonWidth = Object.keys(byId(COTTON_MODELS, id).prices)[0];
      }
      if (!byId(COTTON_MODELS, id).glitterPrices) state.fullGlitter = false;
      ensureWebbing();
    });
    segmented($('#widthSeg'), COTTON_WIDTHS.filter(w => byId(COTTON_MODELS, state.cottonModel).prices[w.id]),
      () => state.cottonWidth, id => { state.cottonWidth = id; ensureWebbing(); });
    ensureWebbing();
    const available = WEBBING_COLORS.filter(c => c.widths.includes(state.cottonWidth));
    $('#bandWidthNote').textContent =
      `Bomullsbandet är ${byId(COTTON_WIDTHS, state.cottonWidth).bandWidth} brett – fodret utgör resten av bredden. ` +
      `${available.length} färger finns i denna bredd.`;
    swatchGrid($('#webbingSwatches'), available, () => state.webbing, id => { state.webbing = id; });

    // foder
    const linSel = $('#liningSelect');
    linSel.innerHTML = '';
    const s = el('select');
    for (const g of LINING_GROUPS) {
      const og = el('optgroup'); og.label = g.group;
      for (const item of g.items) {
        const o = el('option', null, item.name);
        o.value = item.id;
        if (state.lining === item.id) o.selected = true;
        og.appendChild(o);
      }
      s.appendChild(og);
    }
    s.addEventListener('change', () => { state.lining = s.value; refresh(); });
    linSel.appendChild(s);
    const lin = byId(linings, state.lining);
    $('#liningChip').style.background = lin.hex2
      ? `linear-gradient(135deg, ${lin.hex} 55%, ${lin.hex2} 55%)` : lin.hex;
    $('#leatherNote').style.display = lin.leather ? '' : 'none';
  } else {
    segmented($('#bioModelSeg'), BIOTHANE.models, () => state.bioModel, id => { state.bioModel = id; },
      m => m.name + (m.surcharge ? ` (+${m.surcharge} kr)` : ''));
    segmented($('#bioWidthSeg'), BIOTHANE.widths, () => state.bioWidth, id => {
      state.bioWidth = id;
      const c = byId(BIOTHANE_COLORS, state.biothane);
      if (isBioColorDisabled(c)) state.biothane = 'svart';
    }, w => w.name + (w.surcharge ? ` (+${w.surcharge} kr)` : ''));
    swatchGrid($('#bioSwatches'), BIOTHANE_COLORS, () => state.biothane,
      id => { state.biothane = id; },
      { isDisabled: isBioColorDisabled });
  }

  // helglitter
  const glitOk = glitterAvailable();
  $('#glitterRow').style.display = glitOk ? '' : 'none';
  $('#glitterToggle').checked = state.fullGlitter;
  $('#glitterColorRow').style.display = state.fullGlitter && glitOk ? '' : 'none';
  if (state.fullGlitter) {
    swatchGrid($('#glitterSwatches'), TEXT_COLORS.filter(c => c.glitter),
      () => state.glitterColor, id => { state.glitterColor = id; });
  }

  // -------- texter: flikar + panel för aktiv text --------
  if (state.activeText >= state.texts.length) state.activeText = state.texts.length - 1;
  const tabs = $('#textTabs');
  tabs.innerHTML = '';
  state.texts.forEach((t, i) => {
    const b = el('button', 'seg' + (state.activeText === i ? ' sel' : ''),
      `Text ${i + 1}`);
    b.type = 'button';
    b.title = t.text.trim() ? `"${t.text.trim()}"` : '(tom)';
    b.addEventListener('click', () => { state.activeText = i; refresh(); });
    tabs.appendChild(b);
  });
  if (state.texts.length < MAX_TEXTS) {
    const add = el('button', 'seg add', '+');
    add.type = 'button';
    add.title = 'Lägg till en text till';
    add.addEventListener('click', () => {
      state.texts.push({ ...NEW_TEXT_DEFAULTS[state.texts.length] });
      state.activeText = state.texts.length - 1;
      if (state.texts.length === 3 && state.textLayout === 'dubbel') state.textLayout = 'rad';
      refresh();
    });
    tabs.appendChild(add);
  }

  const at = state.texts[state.activeText];
  const inpT = $('#textInputT');
  if (inpT.value !== at.text) inpT.value = at.text;
  inpT.placeholder = state.activeText === 0 ? 'T.ex. hundens namn' : 'T.ex. smeknamn eller telefonnummer';

  const fontWrapT = $('#fontGridT');
  fontWrapT.innerHTML = '';
  for (const f of FONTS) {
    const b = el('button', 'fontopt' + (at.font === f.id ? ' sel' : ''));
    b.type = 'button';
    const prev = el('span', 'font-preview', f.caps ? f.name.toUpperCase() : f.name);
    prev.style.fontFamily = f.css;
    prev.style.fontWeight = f.weight;
    if (f.italic) prev.style.fontStyle = 'italic';
    b.appendChild(prev);
    b.title = f.name + (f.caps ? ' (endast versaler)' : '');
    b.addEventListener('click', () => { at.font = f.id; refresh(); });
    fontWrapT.appendChild(b);
  }
  $('#capsNoteT').style.display = byId(FONTS, at.font).caps ? '' : 'none';
  segmented($('#sizeSegT'), TEXT_SIZES, () => at.size, id => { at.size = id; });
  swatchGrid($('#colorSwT'), TEXT_COLORS, () => at.color,
    id => { at.color = id; },
    { isDisabled: c => !textColorAllowed(c) });

  const rmBtn = $('#removeTextBtn');
  rmBtn.style.display = state.activeText > 0 ? '' : 'none';
  rmBtn.textContent = `Ta bort text ${state.activeText + 1}`;

  // placering av texterna
  const many = state.texts.length > 1;
  $('#layoutBlock').style.display = many ? '' : 'none';
  if (many) {
    const layouts = TEXT_LAYOUTS.filter(l => l.id !== 'dubbel' || state.texts.length === 2);
    if (!layouts.some(l => l.id === state.textLayout)) state.textLayout = 'rad';
    segmented($('#layoutSeg'), layouts, () => state.textLayout,
      id => { state.textLayout = id; });
    $('#dubbelPosRow').style.display = isDouble() ? '' : 'none';
    if (isDouble()) {
      segmented($('#dubbelPosSeg'), DUBBEL_POSITIONS, () => state.dubbelPos,
        id => { state.dubbelPos = id; });
    }
    const warn = doubleTextWarning();
    $('#dubbelWarn').style.display = warn ? '' : 'none';
    $('#dubbelWarn').textContent = warn;
  }

  // symboler: rutnät med renderade förhandsvisningar
  const symWrap = $('#symbolGrid');
  symWrap.innerHTML = '';
  for (const s of SYMBOLS) {
    const b = el('button', 'symopt' + (state.symbol === s.id ? ' sel' : ''));
    b.type = 'button';
    b.title = s.name;
    if (s.id === 'ingen') {
      b.textContent = '∅';
    } else if (s.id === 'egen') {
      b.textContent = '?';
    } else {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      drawSymbol(c.getContext('2d'), s.id, 32, 32, s.flag ? 34 : 42, '#3a332b');
      b.appendChild(c);
    }
    b.addEventListener('click', () => { state.symbol = s.id; refresh(); });
    symWrap.appendChild(b);
  }
  const hasSym = state.symbol !== 'ingen';
  $('#symbolExtra').style.display = hasSym ? '' : 'none';
  if (hasSym) {
    segmented($('#placementSeg'), SYMBOL_PLACEMENTS, () => state.symbolPlacement,
      id => { state.symbolPlacement = id; });
    const symColorList = [{ id: '', name: 'Samma som texten', hex: '#888' },
      ...TEXT_COLORS.filter(c => textColorAllowed(c))];
    selectBox($('#symbolColorSelect'), symColorList, () => state.symbolColor,
      id => { state.symbolColor = id; });
    const isFlag = !!byId(SYMBOLS, state.symbol).flag;
    $('#flagNote').style.display = isFlag ? '' : 'none';
    $('#symbolColorRow').style.display = isFlag ? 'none' : '';
  }

  // skugga (går ej med dubbeltext)
  const dbl = isDouble();
  $('#shadowRow').style.display = dbl ? 'none' : '';
  $('#noShadowNote').style.display = dbl ? '' : 'none';
  $('#shadowToggle').checked = state.shadow;
  $('#shadowColorRow').style.display = state.shadow && !dbl ? '' : 'none';
  if (state.shadow && !dbl) {
    swatchGrid($('#shadowSwatches'), TEXT_COLORS.filter(shadowColorAllowed),
      () => state.shadowColor, id => { state.shadowColor = id; });
  }

  // beslag
  swatchGrid($('#hwSwatches'), HARDWARE_FINISHES.map(h => ({
    ...h,
    name: h.name + (h.surcharge ? ` (+${state.family === 'cotton' ? h.surcharge.cotton : h.surcharge.biothane} kr)` : ''),
  })), () => state.hardware, id => { state.hardware = id; });
  // frakt
  segmented($('#shippingSeg'), SHIPPING, () => state.shipping,
    id => { state.shipping = id; },
    s => `${s.name} (+${s.price} kr)`);

  $('#buckleNote').textContent = state.family === 'cotton'
    ? 'Klickspänne: svart plast. D-ring i valt utförande.'
    : 'Metallspänne, D-ringar och nitar i valt utförande.';

  // sammanfattning
  renderSummary();
  rebuild3D();
}

function renderSummary() {
  const { rows, total } = computePrice();
  const tbody = $('#priceRows');
  tbody.innerHTML = '';
  for (const [label, price] of rows) {
    const tr = el('tr');
    tr.appendChild(el('td', null, label));
    tr.appendChild(el('td', 'pr', price >= 0 ? `${price} kr` : `${price} kr`));
    tbody.appendChild(tr);
  }
  $('#priceTotal').textContent = `${total} kr`;

  const url = state.family === 'cotton'
    ? PRODUCT_URLS.cotton[state.cottonWidth]
    : PRODUCT_URLS.biothane;
  $('#productLink').href = url;
}

function orderText() {
  const { total } = computePrice();
  const L = [];
  const lin = byId(linings, state.lining);
  const sym = byId(SYMBOLS, state.symbol);
  const place = byId(SYMBOL_PLACEMENTS, state.symbolPlacement);
  const hwf = byId(HARDWARE_FINISHES, state.hardware);
  const sc = state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null;
  const activeTexts = state.texts.filter(t => t.text.trim());
  const t1 = state.texts[0], t2 = state.texts[1];
  const fname = t => byId(FONTS, t.font).name;
  const cname = t => byId(TEXT_COLORS, t.color).name;

  L.push('BESTÄLLNING – designad i 3D-verktyget');
  L.push('======================================');
  if (state.family === 'cotton') {
    const model = byId(COTTON_MODELS, state.cottonModel);
    const w = byId(COTTON_WIDTHS, state.cottonWidth);
    L.push(`Produkt: ${state.fullGlitter ? 'Helglittrigt ' : ''}${model.name} ${w.name}`);
    L.push(`Storlek i stängt läge: ${state.circumference} cm`);
    L.push(`Färg på bomullsband: ${byId(WEBBING_COLORS, state.webbing).name}`);
    L.push(`Äkta läder på fodret: ${lin.leather ? `Ja (+${LEATHER_SURCHARGE[state.cottonWidth]} kr)` : 'Nej'}`);
    L.push(`Foder: ${lin.group.replace(/ \(.*\)/, '')} – ${lin.name}`);
  } else {
    const model = byId(BIOTHANE.models, state.bioModel);
    const w = byId(BIOTHANE.widths, state.bioWidth);
    L.push(`Produkt: ${state.fullGlitter ? 'Helglittrigt ' : ''}Halsband i BioThane Beta®`);
    L.push(`Halsbandsmodell: ${model.name}`);
    L.push(`Bredd: ${w.name}`);
    L.push(`Storlek i stängt läge: ${state.circumference} cm`);
    L.push(`Färg på biothane: ${byId(BIOTHANE_COLORS, state.biothane).name}`);
  }
  if (state.fullGlitter) L.push(`Glitterfärg (helglitter): ${byId(TEXT_COLORS, state.glitterColor).name}`);
  const sname = t => byId(TEXT_SIZES, t.size).name.toLowerCase();
  if (!activeTexts.length) {
    L.push('Text på halsbandet: (ingen text)');
  } else if (activeTexts.length === 1) {
    const t = activeTexts[0];
    L.push(`Text på halsbandet: ${t.text.trim()}`);
    L.push(`Typsnitt: ${fname(t)}`);
    L.push(`Textstorlek: ${sname(t)}`);
    L.push(`Textfärg: ${cname(t)}`);
  } else if (isDouble()) {
    L.push(`Text på halsbandet: Dubbeltext – "${t1.text.trim()}" med "${t2.text.trim()}" ovanpå`);
    L.push(`Dubbeltext: bakre texten i typsnitt ${fname(t1)} i färgen ${cname(t1)} (${sname(t1)} storlek), ` +
      `främre texten i typsnitt ${fname(t2)} i färgen ${cname(t2)} (${sname(t2)} storlek)`);
    L.push(`Främre textens position: ${byId(DUBBEL_POSITIONS, state.dubbelPos).name}`);
  } else {
    const layoutName = state.textLayout === 'rader'
      ? `${activeTexts.length === 3 ? 'tre' : 'två'} rader`
      : 'efter varandra';
    L.push(`Text på halsbandet: ${activeTexts.map(t => `"${t.text.trim()}"`).join(' och ')} (${layoutName})`);
    activeTexts.forEach((t, i) => {
      L.push(`Text ${i + 1}: "${t.text.trim()}" i typsnitt ${fname(t)}, ${sname(t)} storlek, färg ${cname(t)}`);
    });
  }
  if (state.symbol !== 'ingen') {
    L.push(`Symbol: ${sym.name}`);
    L.push(`Symbolens placering: ${place.name}`);
    if (!sym.flag) L.push(`Färg på symbol: ${sc ? sc.name : 'Samma som texten'}`);
  } else {
    L.push('Symbol: Ingen symbol');
  }
  if (state.shadow && !isDouble()) L.push(`Skugga bakom text/symbol: Ja – ${byId(TEXT_COLORS, state.shadowColor).name}`);
  if (state.family === 'cotton') L.push('Klickspänne: Svart plast');
  L.push(`D-ring${state.family === 'biothane' ? 'ar och nitar' : ''}: ${hwf.name}`);
  const ship = byId(SHIPPING, state.shipping);
  L.push(`Frakt: ${ship.name}${ship.detail ? ` (${ship.detail})` : ''} – ${ship.price} kr`);
  L.push(`Expresshantering: ${state.express ? `Ja (+${EXPRESS_SURCHARGE} kr)` : 'Nej (ordinarie leveranstid ca 35 dagar)'}`);
  if (state.extraInfo.trim()) L.push(`Övrig info: ${state.extraInfo.trim()}`);
  L.push('--------------------------------------');
  L.push(`Beräknat pris: ${total} kr`);
  L.push('(Priset bekräftas i Valley Dogs kassa)');
  return L.join('\n');
}

// ---------------------------------------------------------------- wiring
document.querySelectorAll('[data-family]').forEach(b => {
  b.addEventListener('click', () => { state.family = b.dataset.family; refresh(); });
});

$('#circ').addEventListener('input', e => {
  state.circumference = +e.target.value;
  $('#circVal').textContent = `${state.circumference} cm`;
  renderSummary(); rebuild3D();
});

$('#textInputT').addEventListener('input', e => {
  state.texts[state.activeText].text = e.target.value.slice(0, 24);
  renderSummary(); rebuild3D();
});
// macOS ersätter dubbelt mellanslag med punkt (insertReplacementText) –
// stoppa det och infoga ett vanligt mellanslag i stället
$('#textInputT').addEventListener('beforeinput', e => {
  if (e.inputType !== 'insertReplacementText') return;
  e.preventDefault();
  const inp = e.target;
  const start = inp.selectionStart, end = inp.selectionEnd;
  inp.value = inp.value.slice(0, start) + ' ' + inp.value.slice(end);
  inp.setSelectionRange(start + 1, start + 1);
  inp.dispatchEvent(new Event('input'));
});
$('#removeTextBtn').addEventListener('click', () => {
  if (state.activeText === 0) return;
  state.texts.splice(state.activeText, 1);
  state.activeText = Math.max(0, state.activeText - 1);
  refresh();
});

$('#glitterToggle').addEventListener('change', e => { state.fullGlitter = e.target.checked; refresh(); });
$('#hwToggle').addEventListener('change', e => { state.showHardware = e.target.checked; rebuild3D(); });
$('#expressToggle').addEventListener('change', e => { state.express = e.target.checked; renderSummary(); });
$('#shadowToggle').addEventListener('change', e => { state.shadow = e.target.checked; refresh(); });
$('#extraInfo').addEventListener('input', e => { state.extraInfo = e.target.value; });

$('#copyBtn').addEventListener('click', async () => {
  const t = orderText();
  try {
    await navigator.clipboard.writeText(t);
    $('#copyBtn').textContent = '✓ Kopierad!';
  } catch {
    // fallback
    const ta = el('textarea'); ta.value = t; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
    $('#copyBtn').textContent = '✓ Kopierad!';
  }
  setTimeout(() => { $('#copyBtn').textContent = 'Kopiera beställningstext'; }, 2000);
});

$('#mailBtn').addEventListener('click', () => {
  const subject = encodeURIComponent('Beställning av designat halsband');
  const body = encodeURIComponent(orderText());
  window.location.href = `mailto:info@valleydogs.se?subject=${subject}&body=${body}`;
});

$('#snapshotBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = viewer.snapshot();
  a.download = 'halsband-design.png';
  a.click();
});

$('#svgBtn').addEventListener('click', async () => {
  const btn = $('#svgBtn');
  const prev = btn.textContent;
  btn.textContent = 'Genererar…';
  btn.disabled = true;
  try {
    const { buildCutSvg } = await import('./export.js');
    const isCotton = state.family === 'cotton';
    const widthCm = currentWidthCm();
    const svg = await buildCutSvg({
      texts: state.texts.map(t => ({
        text: t.text,
        font: byId(FONTS, t.font),
        color: byId(TEXT_COLORS, t.color),
        sizeK: byId(TEXT_SIZES, t.size).k,
      })),
      layout: state.textLayout,
      dubbelPos: state.dubbelPos,
      symbol: state.symbol,
      symbolPlacement: state.symbolPlacement,
      symbolColor: state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null,
      bandHmm: (isCotton ? widthCm - 1 : widthCm) * 10,
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'halsband-text-symboler.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch (err) {
    alert('SVG-exporten misslyckades: ' + err.message);
  }
  btn.textContent = prev;
  btn.disabled = false;
});

$('#showOrderBtn').addEventListener('click', () => {
  $('#orderPreview').textContent = orderText();
  $('#orderDialog').showModal();
});
$('#closeDialog').addEventListener('click', () => $('#orderDialog').close());

// init
$('#textInputT').value = state.texts[0].text;
$('#circ').value = state.circumference;
$('#circVal').textContent = `${state.circumference} cm`;

function isBioColorDisabled(c) {
  if (c.id === 'orange') return true; // finns ej i 25/38 mm
  if ((c.id === 'neonorange' || c.id === 'mango') && state.bioWidth === '38') return true;
  return false;
}

refresh();
// rendera om när typsnitten laddats
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => refresh());
  document.fonts.addEventListener('loadingdone', () => refresh());
  setTimeout(() => refresh(), 1500);
}
