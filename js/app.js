import {
  BIOTHANE_COLORS, WEBBING_COLORS, LINING_GROUPS, TEXT_COLORS, FONTS, SYMBOLS,
  HARDWARE_FINISHES, SYMBOL_PLACEMENTS, COTTON_MODELS, COTTON_WIDTHS, BIOTHANE,
  LEATHER_SURCHARGE, PRODUCT_URLS, allLinings,
} from './data.js';
import { CollarViewer } from './collar3d.js';

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
  text: 'LUNA',
  font: 'built',
  textColor: 'vit',
  symbol: 'tass',
  symbolPlacement: 'efter',
  symbolColor: '',             // '' = samma som texten
  shadow: false,
  shadowColor: 'svart',
  hardware: 'stal',
  showHardware: true,
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
    if (lin && lin.leather) { rows.push(['Äkta läder på fodret', LEATHER_SURCHARGE]); total += LEATHER_SURCHARGE; }
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
      text: state.text,
      font: byId(FONTS, state.font),
      textColor: byId(TEXT_COLORS, state.textColor),
      symbol: state.symbol,
      symbolPlacement: state.symbolPlacement,
      symbolColor: state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null,
      shadowColor: state.shadow ? byId(TEXT_COLORS, state.shadowColor) : null,
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

  // typsnitt
  const fontWrap = $('#fontGrid');
  fontWrap.innerHTML = '';
  for (const f of FONTS) {
    const b = el('button', 'fontopt' + (state.font === f.id ? ' sel' : ''));
    b.type = 'button';
    const prev = el('span', 'font-preview', f.caps ? f.name.toUpperCase() : f.name);
    prev.style.fontFamily = f.css;
    prev.style.fontWeight = f.weight;
    if (f.italic) prev.style.fontStyle = 'italic';
    b.appendChild(prev);
    b.title = f.name + (f.caps ? ' (endast versaler)' : '');
    b.addEventListener('click', () => { state.font = f.id; refresh(); });
    fontWrap.appendChild(b);
  }
  const fnt = byId(FONTS, state.font);
  $('#capsNote').style.display = fnt.caps ? '' : 'none';

  // textfärg
  swatchGrid($('#textColorSwatches'), TEXT_COLORS, () => state.textColor,
    id => { state.textColor = id; },
    { isDisabled: c => !textColorAllowed(c) });

  // symboler
  selectBox($('#symbolSelect'), SYMBOLS, () => state.symbol, id => { state.symbol = id; });
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

  // skugga
  $('#shadowToggle').checked = state.shadow;
  $('#shadowColorRow').style.display = state.shadow ? '' : 'none';
  if (state.shadow) {
    swatchGrid($('#shadowSwatches'), TEXT_COLORS.filter(shadowColorAllowed),
      () => state.shadowColor, id => { state.shadowColor = id; });
  }

  // beslag
  swatchGrid($('#hwSwatches'), HARDWARE_FINISHES.map(h => ({
    ...h,
    name: h.name + (h.surcharge ? ` (+${state.family === 'cotton' ? h.surcharge.cotton : h.surcharge.biothane} kr)` : ''),
  })), () => state.hardware, id => { state.hardware = id; });
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
  const fnt = byId(FONTS, state.font);
  const sym = byId(SYMBOLS, state.symbol);
  const place = byId(SYMBOL_PLACEMENTS, state.symbolPlacement);
  const hwf = byId(HARDWARE_FINISHES, state.hardware);
  const tc = byId(TEXT_COLORS, state.textColor);
  const sc = state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null;

  L.push('BESTÄLLNING – designad i 3D-verktyget');
  L.push('======================================');
  if (state.family === 'cotton') {
    const model = byId(COTTON_MODELS, state.cottonModel);
    const w = byId(COTTON_WIDTHS, state.cottonWidth);
    L.push(`Produkt: ${state.fullGlitter ? 'Helglittrigt ' : ''}${model.name} ${w.name}`);
    L.push(`Storlek i stängt läge: ${state.circumference} cm`);
    L.push(`Färg på bomullsband: ${byId(WEBBING_COLORS, state.webbing).name}`);
    L.push(`Äkta läder på fodret: ${lin.leather ? 'Ja (+120 kr)' : 'Nej'}`);
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
  L.push(`Text på halsbandet: ${state.text.trim() || '(ingen text)'}`);
  if (state.text.trim()) {
    L.push(`Typsnitt: ${fnt.name}`);
    L.push(`Textfärg: ${tc.name}`);
  }
  if (state.symbol !== 'ingen') {
    L.push(`Symbol: ${sym.name}`);
    L.push(`Symbolens placering: ${place.name}`);
    if (!sym.flag) L.push(`Färg på symbol: ${sc ? sc.name : 'Samma som texten'}`);
  } else {
    L.push('Symbol: Ingen symbol');
  }
  if (state.shadow) L.push(`Skugga bakom text/symbol: Ja – ${byId(TEXT_COLORS, state.shadowColor).name}`);
  if (state.family === 'cotton') L.push('Klickspänne: Svart plast');
  L.push(`D-ring${state.family === 'biothane' ? 'ar och nitar' : ''}: ${hwf.name}`);
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

$('#textInput').addEventListener('input', e => {
  state.text = e.target.value.slice(0, 24);
  renderSummary(); rebuild3D();
});

$('#glitterToggle').addEventListener('change', e => { state.fullGlitter = e.target.checked; refresh(); });
$('#hwToggle').addEventListener('change', e => { state.showHardware = e.target.checked; rebuild3D(); });
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

$('#showOrderBtn').addEventListener('click', () => {
  $('#orderPreview').textContent = orderText();
  $('#orderDialog').showModal();
});
$('#closeDialog').addEventListener('click', () => $('#orderDialog').close());

// init
$('#textInput').value = state.text;
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
  document.fonts.ready.then(() => rebuild3D());
  setTimeout(() => rebuild3D(), 1500);
}
