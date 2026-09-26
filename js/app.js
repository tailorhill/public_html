import {
  BIOTHANE_COLORS, WEBBING_COLORS, LINING_GROUPS, TEXT_COLORS, FONTS, SYMBOLS,
  HARDWARE_FINISHES, COTTON_MODELS, COTTON_WIDTHS, BIOTHANE,
  LEATHER_SURCHARGE, PRODUCT_URLS, DUBBEL_POSITIONS, allLinings,
} from './data.js';
import { RealisticCollarViewer, ensureTexturesFor } from './foder-realism.js';
import { drawSymbol } from './symbols.js';
import { encodeDesign, decodeDesign } from './share.js';
import * as cart from './cart.js';
import {
  sizeOptions, selectedSize, sizeDescription, previewCircumference, normalizeDesign,
  validationErrors, shadowEnabled, textColorAllowed as allowedTextColor,
  symbolColorAllowed, shadowColorAllowed, characterCounts, symbolCount, textInputLimit,
  canAddToRow, doubleText, rows as contentRows, textEls, symEls, rowUsed, rowLimit,
} from './design-rules.js';

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
  sizeRange: null,
  webbing: 'rod',
  biothane: 'sverigebla',
  lining: 'ss-svart',
  liningGroup: null,   // vald materialgrupp-flik (index); härleds ur lining
  fullGlitter: false,
  glitterColor: 'guldglitter',
  // Innehåll = rader av element (textbitar + symboler) i valfri ordning.
  content: {
    rows: [{ els: [{ t: 'text', text: 'LUNA', font: 'built', color: 'vit' }, { t: 'sym', id: 'tass' }] }],
    layout: 'stack',           // 'stack' (staplade rader) | 'overlay' (dubbeltext)
    overlayPos: 'mitten',      // 'topp' | 'mitten' | 'botten' (overlay)
  },
  activeEl: { row: 0, i: 0 },  // markerat element (rad-index + element-index)
  symbolColor: '',             // '' = samma som texten
  shadow: false,
  shadowColor: 'svart',
  shadowSymbols: true,
  hardware: 'stal',
  showHardware: true,
  extraInfo: '',
};

// Leverantörs-/adminläge: ?supplier=1 i URL:en visar nedladdnings-/export- och
// beställningsverktygen. Vanliga kunder ser dem inte. Flaggan följer med i
// designlänken som läggs i varukorgen, så sömmerskan som öppnar länken får dem.
const SUPPLIER = new URLSearchParams(location.search).has('supplier');
if (SUPPLIER) document.body.classList.add('supplier');

const viewer = new RealisticCollarViewer($('#c3d'));
window.viewer = viewer;

// Felsökningsläge: öppna sidan med ?debug=1 för att se fel och GPU-info
// direkt på skärmen (praktiskt på mobil där konsolen inte syns).
if (new URLSearchParams(location.search).has('debug')) {
  const box = el('pre');
  box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:40vh;overflow:auto;' +
    'background:rgba(0,0,0,0.85);color:#7CFC7C;font:11px monospace;z-index:9999;margin:0;' +
    'padding:8px;white-space:pre-wrap';
  document.body.appendChild(box);
  const log = m => { box.textContent += m + '\n'; box.scrollTop = box.scrollHeight; };
  window.addEventListener('error', e =>
    log(`FEL: ${e.message} (${(e.filename || '').split('/').pop()}:${e.lineno})`));
  window.addEventListener('unhandledrejection', e =>
    log('PROMISE-FEL: ' + ((e.reason && e.reason.message) || e.reason)));
  const gl = viewer.renderer.getContext();
  let gpu = 'okänd';
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) gpu = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
  } catch { /* ok */ }
  log('GPU: ' + gpu);
  log(`maxTex: ${viewer.renderer.capabilities.maxTextureSize} · dpr: ${devicePixelRatio}` +
    ` · minne: ${navigator.deviceMemory || '?'} GB · lite-läge: ${viewer.lite}`);
  viewer.renderer.domElement.addEventListener('webglcontextlost',
    () => log('WEBGL-KONTEXT FÖRLORAD ' + new Date().toLocaleTimeString()));
  viewer.renderer.domElement.addEventListener('webglcontextrestored',
    () => log('kontext återställd'));
}

// ---------------------------------------------------------------- helpers
const linings = allLinings();
// vilken materialgrupp (index i LINING_GROUPS) ett foder-id tillhör
function liningGroupIndex(id) {
  const i = LINING_GROUPS.findIndex(g => g.items.some(it => it.id === id));
  return i < 0 ? 0 : i;
}
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
  if (id.includes('halvstryp') || id === 'justerbart') return id;
  if (id === 'stallbart') return 'stallbart';
  return id === 'justerbart' ? 'justerbart' : 'fast';
}

function glitterAvailable() {
  if (state.family === 'biothane') return true;
  return !!byId(COTTON_MODELS, state.cottonModel).glitterPrices;
}

function textColorAllowed(c) { return allowedTextColor(state, c, { row: state.activeEl.row }); }

const MAX_ROWS = 3;
const isDouble = () => doubleText(state);

// -------- innehåll: rader av element (text/symbol) --------
const rowsOf = () => state.content.rows;
function clampActive() {
  const rs = rowsOf();
  if (!rs.length) { rs.push({ els: [] }); }
  if (state.activeEl.row >= rs.length) state.activeEl.row = rs.length - 1;
  if (state.activeEl.row < 0) state.activeEl.row = 0;
  const r = rs[state.activeEl.row];
  if (state.activeEl.i >= r.els.length) state.activeEl.i = r.els.length - 1;
  if (state.activeEl.i < 0) state.activeEl.i = 0;
}
const activeRow = () => rowsOf()[state.activeEl.row] || rowsOf()[0];
const activeElement = () => { clampActive(); return activeRow().els[state.activeEl.i] || null; };
const firstAllowedTextColor = row => (TEXT_COLORS.find(c => allowedTextColor(state, c, { row })) || TEXT_COLORS[0]).id;
const newTextEl = row => ({ t: 'text', text: '', font: 'avenir', color: firstAllowedTextColor(row) });

// ------------------------------------------------ designlänk (#d=...)
function designUrl(forSupplier) {
  const q = forSupplier ? '?supplier=1' : '';
  return location.origin + location.pathname + q + '#d=' + encodeDesign(state);
}

// Kort leverantörslänk via serverdelen d.php (sparar designen, ger en kort kod).
// Faller ALLTID tillbaka på den fullständiga #d=-länken om servern inte svarar,
// så att köpet aldrig blockeras av kortlänken.
async function supplierDesignLink() {
  const payload = encodeDesign(state);
  try {
    const r = await fetch('d.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'd=' + encodeURIComponent(payload),
    });
    if (r.ok) {
      const j = await r.json();
      if (j && j.code) return location.origin + '/d.php?c=' + j.code;
    }
  } catch { /* nätfel → använd full länk nedan */ }
  return designUrl(true);
}

let lastHash = '';
function updateHash() {
  try {
    const h = '#d=' + encodeDesign(state);
    if (h !== lastHash) {
      lastHash = h;
      history.replaceState(null, '', h);
    }
  } catch { /* ok – t.ex. miljöer utan history-API */ }
}

// Återställ en design från en länk. Alla id:n valideras mot katalogen –
// okända värden (t.ex. utgångna färger) faller tillbaka på standard.
function applyDesign(d) {
  const valid = (list, id, fallback) => (id && byId(list, id) ? id : fallback);
  if (d.f === 'cotton' || d.f === 'biothane') state.family = d.f;
  state.cottonModel = valid(COTTON_MODELS, d.cm, state.cottonModel);
  if (COTTON_WIDTHS.some(w => w.id === d.cw)) state.cottonWidth = d.cw;
  state.bioModel = valid(BIOTHANE.models, d.bm, state.bioModel);
  if (BIOTHANE.widths.some(w => w.id === d.bw)) state.bioWidth = d.bw;
  state.sizeRange = typeof d.sr === 'string' ? d.sr : null;
  state.shadowSymbols = d.shs !== 0;
  const c = Number(d.c);
  if (c >= 25 && c <= 70) state.circumference = c;
  state.webbing = valid(WEBBING_COLORS, d.wb, state.webbing);
  state.biothane = valid(BIOTHANE_COLORS, d.bt, state.biothane);
  state.lining = valid(linings, d.li, state.lining);
  state.liningGroup = liningGroupIndex(state.lining);
  state.fullGlitter = d.fg === 1;
  state.glitterColor = valid(TEXT_COLORS, d.gc, state.glitterColor);
  if (d.content && Array.isArray(d.content.rows)) {
    const rows = d.content.rows.map(r => ({
      els: (r.els || []).map(e => e.t === 'sym'
        ? (byId(SYMBOLS, e.id) ? { t: 'sym', id: e.id } : null)
        : { t: 'text', text: String(e.text || ''), font: valid(FONTS, e.font, 'avenir'), color: valid(TEXT_COLORS, e.color, 'svart') })
        .filter(Boolean),
    })).filter(r => r.els.length);
    state.content = {
      rows: rows.length ? rows.slice(0, MAX_ROWS) : [{ els: [{ t: 'text', text: '', font: 'avenir', color: 'svart' }] }],
      layout: d.content.layout === 'overlay' ? 'overlay' : 'stack',
      overlayPos: DUBBEL_POSITIONS.some(p => p.id === d.content.overlayPos) ? d.content.overlayPos : 'mitten',
    };
    state.activeEl = { row: 0, i: 0 };
  }
  state.symbolColor = d.symbolColor ? valid(TEXT_COLORS, d.symbolColor, '') : '';
  state.shadow = d.sh === 1;
  state.shadowColor = valid(TEXT_COLORS, d.shc, state.shadowColor);
  state.hardware = valid(HARDWARE_FINISHES, d.hw, state.hardware);
  if (typeof d.oi === 'string') state.extraInfo = d.oi.slice(0, 200);
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
    const size = selectedSize(state);
    if (size?.surcharge) { rows.push([`Storlek: ${size.name}`, size.surcharge]); total += size.surcharge; }
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
      circumference: previewCircumference(state),
      bandColor: isCotton ? byId(WEBBING_COLORS, state.webbing).hex : byId(BIOTHANE_COLORS, state.biothane).hex,
      webbingId: isCotton ? state.webbing : null,
      lining: isCotton ? lin : null,
      fullGlitter: state.fullGlitter && glitterAvailable(),
      glitterColor: byId(TEXT_COLORS, state.glitterColor)?.hex,
      content: {
        rows: state.content.rows.map(r => ({
          els: r.els.map(e => e.t === 'sym'
            ? { t: 'sym', id: e.id }
            : { t: 'text', text: e.text, font: byId(FONTS, e.font), color: byId(TEXT_COLORS, e.color) }),
        })),
        layout: state.content.layout,
        overlayPos: state.content.overlayPos,
      },
      symbolColor: state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null,
      shadowColor: shadowEnabled(state) ? byId(TEXT_COLORS, state.shadowColor) : null,
      shadowSymbols: state.shadowSymbols,
      hardware: byId(HARDWARE_FINISHES, state.hardware),
      showHardware: state.showHardware,
      modelKind: modelKind(),
    };
    // Lazy-ladda valt foder + bandfärg (WebP), bygg först när de finns i cachen.
    // pendingCfg gör att bara den senaste designen ritas om vid snabba byten.
    pendingCfg = cfg;
    ensureTexturesFor(cfg).then(() => { if (pendingCfg === cfg) viewer.build(cfg); });
  });
}
let pendingCfg = null;

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
    if (opts.image) {
      // bildruta: fototextur som miniatyr, hex som fallback bakom
      const url = opts.image(c);
      b.style.backgroundColor = c.hex || '#cccccc';
      if (url) {
        b.style.backgroundImage = `url('${url}')`;
        b.style.backgroundSize = 'cover';
        b.style.backgroundPosition = 'center';
      }
    } else {
      b.style.background = swatchBackground(c);
    }
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

// Chip-remsan (rader av element) – lätt att rendera om utan att röra textfältet.
function renderContentChips() {
  const size = selectedSize(state);
  const rlist = $('#rowList');
  rlist.innerHTML = '';
  rowsOf().forEach((row, ri) => {
    const strip = el('div', 'chip-strip');
    row.els.forEach((e, i) => {
      const isSel = state.activeEl.row === ri && state.activeEl.i === i;
      const chip = el('button', 'el-chip ' + (e.t === 'sym' ? 'sym' : 'text') + (isSel ? ' sel' : ''));
      chip.type = 'button';
      if (e.t === 'sym') {
        const cv = document.createElement('canvas'); cv.width = cv.height = 40;
        const sy = byId(SYMBOLS, e.id);
        drawSymbol(cv.getContext('2d'), e.id, 20, 20, sy && sy.flag ? 22 : 30, '#3a332b');
        chip.appendChild(cv);
        chip.title = sy ? sy.name : e.id;
      } else {
        chip.textContent = e.text.trim() || 'text…';
      }
      chip.addEventListener('click', () => { state.activeEl = { row: ri, i }; refresh(); });
      strip.appendChild(chip);
    });
    if (size && size.limit !== null) {
      const cc = el('span', 'chip-count' + (rowUsed(row) > size.limit ? ' over' : ''), `${rowUsed(row)}/${size.limit}`);
      strip.appendChild(cc);
    }
    rlist.appendChild(strip);
  });
}

// -------- innehållseditor: rader av element (text + symboler) --------
function renderContentEditor() {
  clampActive();
  const size = selectedSize(state);
  renderContentChips();

  const canAdd = canAddToRow(state);
  $('#addTextBtn').disabled = !canAdd;
  $('#addSymbolBtn').disabled = !canAdd;
  $('#addRowBtn').style.display = rowsOf().length < MAX_ROWS ? '' : 'none';
  const activeRowLimit = rowLimit(state, state.activeEl?.row ?? 0);
  $('#rowLimitNote').textContent = (!canAdd && activeRowLimit !== null)
    ? `Raden är full (max ${activeRowLimit} tecken inkl. symboler). Ta bort något för att lägga till mer.` : '';

  const active = activeElement();
  const ed = $('#elEditor');
  if (!active) { ed.style.display = 'none'; return; }
  ed.style.display = '';
  const isText = active.t === 'text';
  $('#elTextControls').style.display = isText ? '' : 'none';
  $('#elSymbolControls').style.display = isText ? 'none' : '';
  const row = activeRow();
  $('#elMoveLeft').disabled = state.activeEl.i === 0;
  $('#elMoveRight').disabled = state.activeEl.i >= row.els.length - 1;
  $('#elRemove').disabled = rowsOf().length === 1 && row.els.length === 1;

  if (isText) {
    const inpT = $('#elTextInput');
    const lim = textInputLimit(state);
    if (lim === null) inpT.removeAttribute('maxlength'); else inpT.maxLength = lim;
    if (inpT.value !== active.text) inpT.value = active.text;

    const fg = $('#fontGridT');
    fg.innerHTML = '';
    for (const f of FONTS) {
      const b = el('button', 'fontopt' + (active.font === f.id ? ' sel' : ''));
      b.type = 'button';
      const prev = el('span', 'font-preview', f.caps ? f.name.toUpperCase() : f.name);
      prev.style.fontFamily = f.css; prev.style.fontWeight = f.weight;
      if (f.italic) prev.style.fontStyle = 'italic';
      b.appendChild(prev);
      b.title = f.name + (f.caps ? ' (endast versaler)' : '');
      b.addEventListener('click', () => { active.font = f.id; refresh(); });
      fg.appendChild(b);
    }
    $('#capsNoteT').style.display = byId(FONTS, active.font).caps ? '' : 'none';
    swatchGrid($('#colorSwT'), TEXT_COLORS, () => active.color,
      id => { active.color = id; }, { isDisabled: c => !textColorAllowed(c) });
    const first = byId(TEXT_COLORS, textEls(rowsOf()[0])[0]?.color || 'svart');
    $('#textColorNote').textContent = doubleText(state)
      ? (first.glitter
        ? 'Främre raden ligger ovanpå den bakre. Eftersom bakre raden är glitter måste den främre också vara glitter – slätt material fäster inte på glitter.'
        : 'Vid dubbeltext (ovanpå) fäster inte slätt material på glitter. Håll raderna slätt-på-slätt eller glitter-på-glitter.')
      : (state.fullGlitter && glitterAvailable()
        ? 'Hela bandet är i glittermaterial, så texten måste också väljas i en glittrig färg.'
        : shadowEnabled(state) && byId(TEXT_COLORS, state.shadowColor).glitter
        ? 'Texten ligger ovanpå en glittrig skugga och måste därför också vara i glitter.'
        : 'Materialets vanliga färgval gäller.');
  } else {
    const symWrap = $('#symbolGrid');
    symWrap.innerHTML = '';
    for (const s of SYMBOLS) {
      const b = el('button', 'symopt' + (active.id === s.id ? ' sel' : ''));
      b.type = 'button'; b.title = s.name;
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      drawSymbol(cv.getContext('2d'), s.id, 32, 32, s.flag ? 34 : 42, '#3a332b');
      b.appendChild(cv);
      b.addEventListener('click', () => { active.id = s.id; refresh(); });
      symWrap.appendChild(b);
    }
    const symColorList = [{ id: '', name: 'Samma som texten', hex: '#888' },
      ...TEXT_COLORS.filter(c => symbolColorAllowed(state, c))];
    selectBox($('#symbolColorSelect'), symColorList, () => state.symbolColor, id => { state.symbolColor = id; });
    const isFlag = !!byId(SYMBOLS, active.id).flag;
    $('#flagNote').style.display = isFlag ? '' : 'none';
  }

  const many = rowsOf().length > 1;
  $('#layoutBlock').style.display = many ? '' : 'none';
  if (many) {
    const layouts = [{ id: 'stack', name: 'Staplade rader' }]
      .concat(rowsOf().length === 2 ? [{ id: 'overlay', name: 'Ovanpå (dubbeltext)' }] : []);
    if (!layouts.some(l => l.id === state.content.layout)) state.content.layout = 'stack';
    segmented($('#layoutSeg'), layouts, () => state.content.layout, id => { state.content.layout = id; });
    $('#dubbelPosRow').style.display = doubleText(state) ? '' : 'none';
    if (doubleText(state)) segmented($('#dubbelPosSeg'), DUBBEL_POSITIONS, () => state.content.overlayPos, id => { state.content.overlayPos = id; });
  }
}

function refresh() {
  const changes = normalizeDesign(state);
  $('#ruleChanges').textContent = changes.join(' ');
  const sizes = sizeOptions(state);
  $('#rangeSizeRow').hidden = !sizes.length;
  $('#exactSizeRow').hidden = !!sizes.length;
  if (sizes.length) {
    selectBox($('#rangeSizeSelect'), sizes, () => state.sizeRange, id => { state.sizeRange = id; },
      o => o.name + (o.surcharge ? ` (+${o.surcharge} kr)` : ''));
  }
  $('#customSizeNote').hidden = selectedSize(state)?.id !== 'custom';
  $('#extraInfo').required = selectedSize(state)?.id === 'custom';

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
    swatchGrid($('#webbingSwatches'), available, () => state.webbing, id => { state.webbing = id; },
      { image: c => `band-thumb/${c.id}.webp` });

    // foder
    // materialgrupp-flikar + bildrutor (fototexturen som miniatyr)
    if (state.liningGroup == null || state.liningGroup < 0) state.liningGroup = liningGroupIndex(state.lining);
    const groupTabs = LINING_GROUPS.map((g, i) => ({ id: i, name: g.group.replace(/ \(.*\)/, '') }));
    segmented($('#liningGroupSeg'), groupTabs, () => state.liningGroup, i => { state.liningGroup = i; });
    swatchGrid($('#liningSwatches'), LINING_GROUPS[state.liningGroup].items, () => state.lining,
      id => { state.lining = id; }, { image: c => `foder-thumb/${c.id}.webp` });
    const lin = byId(linings, state.lining);
    const linGroup = LINING_GROUPS[liningGroupIndex(state.lining)].group.replace(/ \(.*\)/, '');
    const chip = $('#liningChip');
    chip.style.backgroundColor = lin.hex;
    chip.style.backgroundImage = `url('foder-thumb/${lin.id}.webp')`;
    chip.style.backgroundSize = 'cover'; chip.style.backgroundPosition = 'center';
    $('#liningName').textContent = `${lin.name} · ${linGroup}`;
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

  renderContentEditor();

  // Skugga finns bara på bomull och kan inte kombineras med dubbeltext.
  const shadowAvailable = state.family === 'cotton' && !isDouble();
  $('#shadowRow').style.display = shadowAvailable ? '' : 'none';
  $('#noShadowNote').style.display = shadowAvailable ? 'none' : '';
  $('#noShadowNote').textContent = state.family === 'biothane'
    ? 'Skugga finns inte på BioThane.' : 'Skugga går inte att kombinera med dubbeltext.';
  $('#shadowToggle').checked = state.shadow;
  $('#shadowColorRow').style.display = shadowEnabled(state) ? '' : 'none';
  if (shadowEnabled(state)) {
    swatchGrid($('#shadowSwatches'), TEXT_COLORS.filter(shadowColorAllowed),
      () => state.shadowColor, id => { state.shadowColor = id; });
    segmented($('#shadowScope'), [{ id: 'text', name: 'Bara text' }, { id: 'all', name: 'Text och symboler' }],
      () => state.shadowSymbols ? 'all' : 'text', id => { state.shadowSymbols = id === 'all'; });
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

function renderValidation() {
  const errors = validationErrors(state), size = selectedSize(state);
  const perRow = rowsOf().length > 1 ? ' per rad' : '';
  $('#sizeTextNote').textContent = size?.id === 'custom'
    ? 'Egen storlek har ingen teckengräns. Skriv önskat storleksintervall under Övrig info.'
    : size
      ? `${size.name}: max ${size.limit} tecken${perRow}, inklusive symboler. Varje symbol räknas som ett tecken. Mellanslag räknas också.`
      : 'För denna modell finns ingen storleksberoende teckengräns. Text och symboler anpassas till bandet i förhandsvisningen.';
  $('#designErrors').textContent = errors.join(' ');
  $('#designErrors').hidden = !errors.length;
  const lim = textInputLimit(state);
  $('#textLimitNote').textContent = size?.id === 'custom'
    ? 'Egen storlek har ingen teckengräns. Ange önskat storleksintervall under Övrig info.'
    : size
    ? `Max ${size.limit} tecken inklusive symboler${perRow}. Rader (tecken+symboler): ${rowsOf().map(rowUsed).join(' / ')}. Du kan skriva högst ${lim} tecken till i detta fält.`
    : 'Texten görs alltid i stor storlek, anpassad till bandet.';
  const inp = $('#elTextInput');
  if (inp) inp.setAttribute('aria-invalid', String(errors.some(e => e.includes('tecken'))));
  for (const id of ['cartBtn', 'copyBtn', 'mailBtn', 'svgBtn', 'dxfBtn']) { const b = $('#' + id); if (b) b.disabled = !!errors.length; }
}

function renderSummary() {
  renderValidation();
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

  updateHash();
}

// -------- innehållsbeskrivning (för beställningstext/varukorg) --------
const allTextEls = () => rowsOf().flatMap(r => textEls(r));
const allSymEls = () => rowsOf().flatMap(r => symEls(r));
const symName = id => (byId(SYMBOLS, id)?.name || id);
const fontName = id => byId(FONTS, id).name;
const colorName = id => byId(TEXT_COLORS, id).name;
const contentPlainText = () => allTextEls().map(e => e.text.trim()).filter(Boolean).join(' ');
// "[Kvist vänster] BELLA [Hjärta]" per rad, i ordning
function contentSequence() {
  return rowsOf().map(r => r.els
    .map(e => e.t === 'sym' ? `[${symName(e.id)}]` : (e.text.trim() || '(tom)')).join(' '));
}
const symbolColorText = () => state.symbolColor ? colorName(state.symbolColor) : 'Samma som texten';

function orderText() {
  const { total } = computePrice();
  const L = [];
  const lin = byId(linings, state.lining);
  const hwf = byId(HARDWARE_FINISHES, state.hardware);

  L.push('BESTÄLLNING – designad i 3D-verktyget');
  L.push('======================================');
  if (state.family === 'cotton') {
    const model = byId(COTTON_MODELS, state.cottonModel);
    const w = byId(COTTON_WIDTHS, state.cottonWidth);
    L.push(`Produkt: ${state.fullGlitter ? 'Helglittrigt ' : ''}${model.name} ${w.name}`);
    L.push(`Storlek: ${sizeDescription(state)}`);
    L.push(`Färg på bomullsband: ${byId(WEBBING_COLORS, state.webbing).name}`);
    L.push(`Äkta läder på fodret: ${lin.leather ? `Ja (+${LEATHER_SURCHARGE[state.cottonWidth]} kr)` : 'Nej'}`);
    L.push(`Foder: ${lin.group.replace(/ \(.*\)/, '')} – ${lin.name}`);
  } else {
    const model = byId(BIOTHANE.models, state.bioModel);
    const w = byId(BIOTHANE.widths, state.bioWidth);
    L.push(`Produkt: ${state.fullGlitter ? 'Helglittrigt ' : ''}Halsband i BioThane Beta®`);
    L.push(`Halsbandsmodell: ${model.name}`);
    L.push(`Bredd: ${w.name}`);
    L.push(`Storlek: ${sizeDescription(state)}`);
    L.push(`Färg på biothane: ${byId(BIOTHANE_COLORS, state.biothane).name}`);
  }
  if (state.fullGlitter) L.push(`Glitterfärg (helglitter): ${byId(TEXT_COLORS, state.glitterColor).name}`);
  const rws = rowsOf();
  const layoutNote = rws.length > 1 ? (doubleText(state) ? ' (dubbeltext – rader ovanpå varandra)' : ' (staplade rader)') : '';
  const seqs = contentSequence();
  L.push(`Innehåll (i ordning)${layoutNote}:`);
  rws.forEach((row, ri) => {
    L.push(`  ${rws.length > 1 ? `Rad ${ri + 1}: ` : ''}${seqs[ri]}`);
    textEls(row).forEach(e => { if (e.text.trim()) L.push(`     text "${e.text.trim()}" – typsnitt ${fontName(e.font)}, färg ${colorName(e.color)}`); });
  });
  if (doubleText(state)) L.push(`  Främre radens position: ${byId(DUBBEL_POSITIONS, state.content.overlayPos).name}`);
  if (allSymEls().length) L.push(`  Färg på symboler: ${symbolColorText()} (flaggor sys i sina riktiga färger)`);
  if (shadowEnabled(state)) L.push(`Skugga bakom ${state.shadowSymbols ? 'text och symboler' : 'enbart text'}: ${byId(TEXT_COLORS, state.shadowColor).name}`);
  if (state.family === 'cotton') L.push('Klickspänne: Svart plast');
  L.push(`D-ring${state.family === 'biothane' ? 'ar och nitar' : ''}: ${hwf.name}`);
  L.push('Frakt: väljs i kassan hos Valley Dogs');
  if (state.extraInfo.trim()) L.push(`Övrig info: ${state.extraInfo.trim()}`);
  L.push(`Designlänk (öppnar designen i leverantörsvyn): ${designUrl(true)}`);
  L.push('--------------------------------------');
  L.push(`Beräknat pris: ${total} kr`);
  L.push('(Priset bekräftas i Valley Dogs kassa)');
  return L.join('\n');
}

// -------------------------------------------------- Abicart-varukorg
// Kommentar till "Övrig info"-fältet i varukorgen. Håll den KORT: alla vanliga
// val ligger redan som strukturerade val i ordern, så här tar vi bara med det
// som inte ryms där (textstorlek, flera texter/dubbeltext, kundens egen info)
// plus designlänken för leverantörsvyn. (Full beställningstext = orderText()
// används bara i leverantörsknapparna Kopiera/Mejla/Visa beställning.)
function cartComment(supplierLink) {
  const L = [];
  const rws = rowsOf();
  const seqs = contentSequence();
  const layoutNote = rws.length > 1 ? (doubleText(state) ? ' – dubbeltext' : ' – staplade rader') : '';
  // Hela sekvensen (symboler + text i ordning) så sömmerskan ser upplägget
  L.push(`Innehåll (v→h)${layoutNote}: ${seqs.join('  //  ')}`);
  allTextEls().forEach(e => { if (e.text.trim()) L.push(`  "${e.text.trim()}" – ${fontName(e.font)}/${colorName(e.color)}`); });
  if (allSymEls().length) L.push(`  Symbolfärg: ${symbolColorText()}`);
  if (doubleText(state)) L.push(`  Främre radens position: ${byId(DUBBEL_POSITIONS, state.content.overlayPos).name}`);
  if (selectedSize(state)) L.push(`Storlek: ${sizeDescription(state)}`);
  if (shadowEnabled(state)) L.push(`Skugga: ${state.shadowSymbols ? 'text och symboler' : 'enbart text'}`);
  if (state.extraInfo.trim()) L.push(`Kundens övriga info: ${state.extraInfo.trim()}`);
  L.push(`Design (öppnas i leverantörsvyn): ${supplierLink || designUrl(true)}`);
  return L.join('\n');
}

// Semantisk beskrivning av designen (namn ur katalogen). cart.resolveOrder
// matchar den mot artikelns RIKTIGA val och options, så namn behöver inte
// stämma exakt med butikens (spretiga) valnamn.
// Härled butikens enkla "Symbolens placering" ur sekvensen (best-effort).
function derivePlacement() {
  const syms = allSymEls();
  if (!syms.length) return 'Ingen symbol';
  const row = rowsOf().find(r => r.els.some(e => e.t === 'text' && e.text.trim())) || rowsOf().find(r => r.els.length) || rowsOf()[0];
  const els = row.els;
  let firstText = -1, lastText = -1;
  els.forEach((e, i) => { if (e.t === 'text' && e.text.trim()) { if (firstText < 0) firstText = i; lastText = i; } });
  const before = els.some((e, i) => e.t === 'sym' && (firstText < 0 || i < firstText));
  const after = els.some((e, i) => e.t === 'sym' && (lastText < 0 || i > lastText));
  if (before && after) return 'På vardera sida om texten';
  if (before) return 'Före texten';
  if (after) return 'Efter texten';
  return 'På vardera sida om texten';
}
function cartDesign(supplierLink) {
  const lin = byId(linings, state.lining);
  const t1 = allTextEls().find(e => e.text.trim()) || allTextEls()[0];
  const isCotton = state.family === 'cotton';
  const syms = allSymEls();
  // Butiken har bara ETT symbolval: en symbol → den; flera/olika → "Egen symbol"
  const symbolChoice = syms.length === 0 ? 'Ingen symbol'
    : syms.length === 1 ? symName(syms[0].id) : 'Egen symbol';
  return {
    webbingColor: isCotton ? byId(WEBBING_COLORS, state.webbing).name : null,
    biothaneColor: isCotton ? null : byId(BIOTHANE_COLORS, state.biothane).name,
    bioWidth: isCotton ? null : byId(BIOTHANE.widths, state.bioWidth).name,
    bioModel: isCotton ? null : byId(BIOTHANE.models, state.bioModel).name,
    leather: lin.leather ? 'Ja' : 'Nej',
    glitterColor: (state.fullGlitter && glitterAvailable()) ? byId(TEXT_COLORS, state.glitterColor).name : null,
    foder: `${lin.group.replace(/ \(.*\)/, '')} – ${lin.name}`,
    sizeCm: state.circumference,
    sizeRange: selectedSize(state)?.id || null,
    text: contentPlainText(),
    font: t1 ? fontName(t1.font) : null,
    textColor: colorName(t1 ? t1.color : 'svart'),
    symbol: symbolChoice,
    placement: derivePlacement(),
    symbolColor: syms.length ? colorName(state.symbolColor || (t1 ? t1.color : 'svart')) : '-',
    shadow: shadowEnabled(state) ? byId(TEXT_COLORS, state.shadowColor).name : 'Nej',
    hardware: byId(HARDWARE_FINISHES, state.hardware).name,
    comment: cartComment(supplierLink),
  };
}

async function handleAddToCart() {
  const errors = validationErrors(state);
  if (errors.length) { renderValidation(); return; }
  const glitter = state.fullGlitter && glitterAvailable();
  const uid = cart.articleUidFor(state, glitter);
  if (!uid) {
    alert('Den här produktvarianten är inte kopplad till varukorgen än. ' +
      'Använd "Kopiera beställningstext" så länge, eller välj en annan modell/bredd.');
    return;
  }
  const btn = $('#cartBtn');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Förbereder…';
  try {
    // Kort designlänk (faller tillbaka på full länk om servern inte svarar),
    // sen resolva designen mot artikelns riktiga val och validera INNAN redirect.
    const supplierLink = await supplierDesignLink();
    const design = cartDesign(supplierLink);
    const { params, problems } = await cart.resolveOrder(uid, design);
    if (problems.length) {
      btn.disabled = false;
      btn.textContent = label;
      alert('Några val går inte att beställa för just den här modellen/bredden:\n\n' +
        problems.map(p => '• ' + p).join('\n') +
        '\n\nÄndra dem i designen så lägger vi halsbandet i varukorgen.');
      return;
    }
    btn.textContent = 'Går till butiken…';
    location.href = cart.cartUrl(uid, params, design.comment);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = label;
    alert('Kunde inte nå butiken just nu (' + (err && err.message) + '). ' +
      'Försök igen, eller använd "Kopiera beställningstext".');
  }
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

// Skriv i det markerade textelementet utan att bygga om fältet (behåller fokus).
$('#elTextInput').addEventListener('input', e => {
  const active = activeElement();
  if (!active || active.t !== 'text') return;
  const limit = textInputLimit(state);
  const value = limit === null ? e.target.value : Array.from(e.target.value.normalize('NFC')).slice(0, limit).join('');
  if (e.target.value !== value) e.target.value = value;
  active.text = value;
  // uppdatera chip-texten + räknare utan full refresh
  renderContentChips();
  renderSummary(); rebuild3D();
});
// macOS ersätter dubbelt mellanslag med punkt (insertReplacementText) –
// stoppa det och infoga ett vanligt mellanslag i stället
$('#elTextInput').addEventListener('beforeinput', e => {
  if (e.inputType !== 'insertReplacementText') return;
  e.preventDefault();
  const inp = e.target;
  const start = inp.selectionStart, end = inp.selectionEnd;
  inp.value = inp.value.slice(0, start) + ' ' + inp.value.slice(end);
  inp.setSelectionRange(start + 1, start + 1);
  inp.dispatchEvent(new Event('input'));
});

// Lägg till / ta bort / flytta element
function insertEl(newEl) {
  clampActive();
  const row = activeRow();
  row.els.splice(state.activeEl.i + 1, 0, newEl);
  state.activeEl = { row: state.activeEl.row, i: state.activeEl.i + 1 };
  refresh();
}
$('#addTextBtn').addEventListener('click', () => { if (canAddToRow(state)) insertEl(newTextEl(state.activeEl.row)); });
$('#addSymbolBtn').addEventListener('click', () => { if (canAddToRow(state)) insertEl({ t: 'sym', id: 'tass' }); });
$('#addRowBtn').addEventListener('click', () => {
  if (rowsOf().length >= MAX_ROWS) return;
  rowsOf().push({ els: [newTextEl(rowsOf().length)] });
  if (rowsOf().length > 2 && state.content.layout === 'overlay') state.content.layout = 'stack';
  state.activeEl = { row: rowsOf().length - 1, i: 0 };
  refresh();
});
$('#elMoveLeft').addEventListener('click', () => {
  const row = activeRow(), i = state.activeEl.i;
  if (i === 0) return;
  [row.els[i - 1], row.els[i]] = [row.els[i], row.els[i - 1]];
  state.activeEl.i = i - 1; refresh();
});
$('#elMoveRight').addEventListener('click', () => {
  const row = activeRow(), i = state.activeEl.i;
  if (i >= row.els.length - 1) return;
  [row.els[i + 1], row.els[i]] = [row.els[i], row.els[i + 1]];
  state.activeEl.i = i + 1; refresh();
});
$('#elRemove').addEventListener('click', () => {
  const rs = rowsOf(), row = activeRow();
  if (rs.length === 1 && row.els.length === 1) return;
  row.els.splice(state.activeEl.i, 1);
  if (!row.els.length && rs.length > 1) {
    rs.splice(state.activeEl.row, 1);
    if (rs.length < 2) state.content.layout = 'stack';
  }
  state.activeEl = { row: Math.min(state.activeEl.row, rs.length - 1), i: 0 };
  refresh();
});

$('#glitterToggle').addEventListener('change', e => { state.fullGlitter = e.target.checked; refresh(); });
$('#shadowToggle').addEventListener('change', e => { state.shadow = e.target.checked; refresh(); });

// vy-knappar (Översikt / Närbild kant / Insida) styr kameran
document.querySelectorAll('#viewBtns .view-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#viewBtns .view-btn').forEach(x => x.classList.toggle('sel', x === b));
    viewer.setView(b.dataset.view);
  });
});
$('#zoomIn').addEventListener('click', () => viewer.zoom(0.82));
$('#zoomOut').addEventListener('click', () => viewer.zoom(1.22));
$('#extraInfo').addEventListener('input', e => { state.extraInfo = e.target.value; renderSummary(); });

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

// Mejla: mailto kan inte bifoga filer, så vi paketerar bild + skärfiler +
// beställningstext i en zip som laddas ner, och ber användaren bifoga den.
$('#mailBtn').addEventListener('click', async () => {
  const btn = $('#mailBtn');
  const prev = btn.textContent;
  btn.textContent = 'Packar bilagor…';
  btn.disabled = true;
  let hasZip = false;
  try {
    const files = [{ name: 'bestallning.txt', data: orderText() }];

    // PNG-bild av 3D-vyn
    const png = viewer.snapshot();
    const bin = atob(png.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    files.push({ name: 'halsband-design.png', data: bytes });

    // skärfiler (hoppas över om det inte finns text/symbol)
    try {
      const mod = await import('./export.js');
      files.push({ name: 'halsband-text-symboler.svg', data: await mod.buildCutSvg(exportCfg()) });
      files.push({ name: 'halsband-text-symboler.dxf', data: await mod.buildCutDxf(exportCfg()) });
    } catch { /* ingen text/symbol att exportera */ }

    const { makeZip } = await import('./zip.js');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(makeZip(files));
    a.download = 'halsband-bilagor.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    hasZip = true;
  } catch { /* zip-paketeringen är ett tillägg – mejlet ska öppnas ändå */ }

  const subject = encodeURIComponent('Beställning av designat halsband');
  const note = hasZip
    ? 'OBS: Bifoga filen "halsband-bilagor.zip" som just laddades ner – den innehåller bild på designen och skärfiler (SVG + DXF).\n\n'
    : '';
  const body = encodeURIComponent(note + orderText());
  window.location.href = `mailto:info@valleydogs.se?subject=${subject}&body=${body}`;
  btn.textContent = prev;
  btn.disabled = false;
});

$('#snapshotBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = viewer.snapshot();
  a.download = 'halsband-design.png';
  a.click();
});

function exportCfg() {
  const isCotton = state.family === 'cotton';
  const widthCm = currentWidthCm();
  return {
    content: {
      rows: state.content.rows.map(r => ({
        els: r.els.map(e => e.t === 'sym'
          ? { t: 'sym', id: e.id }
          : { t: 'text', text: e.text, font: byId(FONTS, e.font), color: byId(TEXT_COLORS, e.color) }),
      })),
      layout: state.content.layout,
      overlayPos: state.content.overlayPos,
    },
    symbolColor: state.symbolColor ? byId(TEXT_COLORS, state.symbolColor) : null,
    shadowColor: shadowEnabled(state) ? byId(TEXT_COLORS, state.shadowColor) : null,
    shadowSymbols: state.shadowSymbols,
    bandHmm: (isCotton ? widthCm - 1 : widthCm) * 10,
  };
}

async function runExport(btnId, builderName, filename, mime) {
  const btn = $(btnId);
  const prev = btn.textContent;
  btn.textContent = 'Genererar…';
  btn.disabled = true;
  try {
    const mod = await import('./export.js');
    const content = await mod[builderName](exportCfg());
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch (err) {
    alert('Exporten misslyckades: ' + err.message);
  }
  btn.textContent = prev;
  btn.disabled = false;
}

$('#svgBtn').addEventListener('click', () =>
  runExport('#svgBtn', 'buildCutSvg', 'halsband-text-symboler.svg', 'image/svg+xml'));
$('#dxfBtn').addEventListener('click', () =>
  runExport('#dxfBtn', 'buildCutDxf', 'halsband-text-symboler.dxf', 'application/dxf'));

// Välkomstdialog: förhandsbild-informationen visas en gång per besök
// (sessionStorage), inte vid varje sidbyte inom samma flik.
try {
  if (!sessionStorage.getItem('vd_info_visad')) {
    $('#infoDialog').showModal();
  }
} catch {
  $('#infoDialog').showModal(); // t.ex. privat läge utan sessionStorage
}
$('#infoDialogOk').addEventListener('click', () => {
  $('#infoDialog').close();
  try { sessionStorage.setItem('vd_info_visad', '1'); } catch { /* ok */ }
});

$('#showOrderBtn').addEventListener('click', () => {
  $('#orderPreview').textContent = orderText();
  $('#orderDialog').showModal();
});
$('#closeDialog').addEventListener('click', () => $('#orderDialog').close());

$('#shareBtn').addEventListener('click', async () => {
  const url = designUrl();
  try {
    await navigator.clipboard.writeText(url);
    $('#shareBtn').textContent = '✓ Länk kopierad!';
  } catch {
    const ta = el('textarea'); ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
    $('#shareBtn').textContent = '✓ Länk kopierad!';
  }
  setTimeout(() => { $('#shareBtn').textContent = '💾 Spara designen'; }, 2000);
});

// init: återställ ev. design från länken (#d=...) och aktivera varukorgsknappen.
{
  const dm = (location.hash || '').match(/[#&]d=([A-Za-z0-9\-_]+)/);
  if (dm) { const d = decodeDesign(dm[1]); if (d) applyDesign(d); }
  $('#cartBtn').style.display = '';
  $('#cartBtn').addEventListener('click', handleAddToCart);
}
$('#circ').value = state.circumference;
$('#circVal').textContent = `${state.circumference} cm`;
$('#extraInfo').value = state.extraInfo;

function isBioColorDisabled(c) {
  if (c.id === 'orange') return true; // finns ej i 25/38 mm
  if ((c.id === 'neonorange' || c.id === 'mango') && state.bioWidth === '38') return true;
  return false;
}

refresh();
// rendera om när typsnitten laddats (debouncat – loadingdone kan avfyras
// många gånger i följd och varje refresh bygger om GPU-texturer)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => refresh());
  let fontTimer;
  document.fonts.addEventListener('loadingdone', () => {
    clearTimeout(fontTimer);
    fontTimer = setTimeout(() => refresh(), 400);
  });
  setTimeout(() => refresh(), 1500);
}
