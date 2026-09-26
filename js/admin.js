// Katalog-admin för Valley Dogs designverktyg.
// Läser den live-publicerade /data.json (faller tillbaka till fabriksvärden),
// låter dig redigera katalogen och skriver tillbaka den via admin.php.
// Ingen ombyggnad av verktyget – appen läser samma data.json.

import { factoryCatalog } from './data.js';

const $ = s => document.querySelector(s);
const el = (t, cls, txt) => { const e = document.createElement(t); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const WIDTHS = ['2.5', '3.5', '4', '5'];

let cat = null;          // arbetskopian
let dirty = false;
let current = null;      // vald kategori-nyckel

// ---------------------------------------------------------------- kolumntyper
// Varje kolumn: { label, get(row), set(row,val), render(row) }
const col = {
  id: () => ({ label: 'id', get: r => r.id ?? '', set: (r, v) => { r.id = v.trim(); }, cls: 'id' }),
  text: (f, label) => ({ label: label || f, get: r => r[f] ?? '', set: (r, v) => { if (v === '') delete r[f]; else r[f] = v; } }),
  num: (f, label, opts = {}) => ({ label: label || f, type: 'num', opts, get: r => r[f] ?? '', set: (r, v) => { if (v === '' || v == null) delete r[f]; else r[f] = Number(v); } }),
  bool: (f, label) => ({ label: label || f, type: 'bool', get: r => !!r[f], set: (r, v) => { if (v) r[f] = true; else delete r[f]; } }),
  color: (f = 'hex', label = 'färg') => ({ label, type: 'color', get: r => r[f] ?? '', set: (r, v) => { if (v === '') delete r[f]; else r[f] = v; } }),
  select: (f, label, options) => ({ label, type: 'select', options, get: r => r[f] ?? '', set: (r, v) => { if (v === '') delete r[f]; else r[f] = v; } }),
  hexlist: (f, label) => ({ label, get: r => (r[f] || []).join(', '), set: (r, v) => { const a = v.split(/[\s,]+/).filter(x => /^#[0-9a-fA-F]{3,8}$/.test(x)); if (a.length) r[f] = a; else delete r[f]; } }),
  widths: (f, label) => ({ label, type: 'widths', get: r => r[f] || [], set: (r, v) => { r[f] = v; } }),
  price: (mapField, width) => ({ label: width, type: 'num', get: r => r[mapField]?.[width] ?? '', set: (r, v) => { if (!r[mapField]) r[mapField] = {}; if (v === '' || v == null) delete r[mapField][width]; else r[mapField][width] = Number(v); if (r[mapField] && !Object.keys(r[mapField]).length) delete r[mapField]; } }),
  image: kind => ({ label: 'Bild', type: 'image', kind, get: r => r.id, set: () => {} }),
};

const THUMB_DIR = { lining: 'foder-thumb', webbing: 'band-thumb' };

const SPECIALS = [{ v: '', l: '(ingen)' }, { v: 'rainbow', l: 'rainbow' }, { v: 'pastelrainbow', l: 'pastelrainbow' }, { v: 'metal', l: 'metal' }, { v: 'reflex', l: 'reflex' }];

// ---------------------------------------------------------------- kategorier
const CATS = [
  { key: 'textColors', label: 'Textfärger', hint: 'Färger för text och symboler. glitter = glittermaterial, special = effekt (rainbow/metal/reflex).',
    cols: () => [col.id(), col.text('name', 'Namn'), col.color(), col.bool('glitter', 'Glitter'), col.select('special', 'Special', SPECIALS)],
    blank: () => ({ id: '', name: '', hex: '#cccccc' }) },
  { key: 'biothaneColors', label: 'BioThane-färger', hint: 'Färger på BioThane-bandet.',
    cols: () => [col.id(), col.text('name', 'Namn'), col.color(), col.text('note', 'Notering')],
    blank: () => ({ id: '', name: '', hex: '#cccccc' }) },
  { key: 'webbingColors', label: 'Bomullsband', hint: 'Bandfärger och vilka färdiga bredder de finns i. Foto = använd uppladdad tygtextur i 3D (annars vävs den procedurellt ur färgen).',
    cols: () => [col.id(), col.text('name', 'Namn'), col.color(), col.widths('widths', 'Bredder'), col.bool('foto', 'Foto'), col.image('webbing')],
    blank: () => ({ id: '', name: '', hex: '#cccccc', widths: [] }) },
  { key: 'textColorsSpacer' }, // (platshållare, tas bort nedan)
  { key: 'liningGroups', label: 'Foder', hint: 'Fodergrupper (läder, metallic, mönstrad bomull, softshell) och deras färger.', custom: renderLining },
  { key: 'hardwareFinishes', label: 'Beslag', hint: 'Metallytor. metalness/roughness styr 3D-glansen. Tillägg anges per material.',
    cols: () => [col.id(), col.text('name', 'Namn'), col.color(), col.num('metalness', 'Metalness', { step: 0.05, min: 0, max: 1 }), col.num('roughness', 'Roughness', { step: 0.05, min: 0, max: 1 }),
      { label: 'Tillägg bomull', type: 'num', get: r => r.surcharge?.cotton ?? '', set: (r, v) => setSur(r, 'cotton', v) },
      { label: 'Tillägg biothane', type: 'num', get: r => r.surcharge?.biothane ?? '', set: (r, v) => setSur(r, 'biothane', v) }],
    blank: () => ({ id: '', name: '', hex: '#b8bcc2', metalness: 0.9, roughness: 0.3 }) },
  { key: 'fonts', label: 'Typsnitt', hint: 'css = förhandsvisningens webbfont, ttf = fontfil i fonts/ för skärfilerna. Nya typsnitt kräver att .ttf-filen laddas upp separat.',
    cols: () => [col.id(), col.text('name', 'Namn'), col.text('css', 'CSS-font'), col.num('weight', 'Vikt'), col.bool('caps', 'Versaler'), col.bool('italic', 'Kursiv'), col.text('ttf', 'TTF-fil')],
    blank: () => ({ id: '', name: '', css: '"Nunito Sans", sans-serif', weight: 700, ttf: '' }) },
  { key: 'symbols', label: 'Symboler', hint: 'Symbolernas namn och ordning. Flaggfärger = kommaseparerade hex. Nya symbol-FORMER kräver SVG-path i vd-symbols.js.',
    cols: () => [col.id(), col.text('name', 'Namn'), col.hexlist('flag', 'Flaggfärger')],
    blank: () => ({ id: '', name: '' }) },
  { key: 'cottonModels', label: 'Bomullsmodeller', hint: 'Modeller och pris per färdig bredd. Glitterpris lämnas tomt för modeller utan helglitter.',
    cols: () => [col.id(), col.text('name', 'Namn'), ...WIDTHS.map(w => ({ ...col.price('prices', w), label: `Pris ${w}` })), ...WIDTHS.map(w => ({ ...col.price('glitterPrices', w), label: `Glitter ${w}` }))],
    blank: () => ({ id: '', name: '', prices: {} }) },
  { key: 'cottonWidths', label: 'Bomullsbredder', hint: 'Färdiga bredder och bandbredd.',
    cols: () => [col.id(), col.text('name', 'Namn'), col.text('bandWidth', 'Bandbredd'), col.num('cm', 'cm')],
    blank: () => ({ id: '', name: '', bandWidth: '', cm: 0 }) },
  { key: 'biothane', label: 'BioThane-priser', hint: 'Grundpris, helglitterpris och modeller/bredder för BioThane.', custom: renderBiothane },
  { key: 'leatherSurcharge', label: 'Läder-tillägg', hint: 'Pristillägg för äkta läderfoder per färdig bredd.', custom: renderLeather },
  { key: 'productUrls', label: 'Produkt-URL:er', hint: 'Länkar till produktsidorna hos Valley Dogs.', custom: renderUrls },
  { key: 'textSizes', label: 'Textstorlekar', hint: 'k = skalfaktor.', cols: () => [col.id(), col.text('name', 'Namn'), col.num('k', 'k', { step: 0.01 })], blank: () => ({ id: '', name: '', k: 1 }) },
  { key: 'textLayouts', label: 'Textlayouter', cols: () => [col.id(), col.text('name', 'Namn')], blank: () => ({ id: '', name: '' }) },
  { key: 'dubbelPositions', label: 'Dubbeltext-lägen', cols: () => [col.id(), col.text('name', 'Namn')], blank: () => ({ id: '', name: '' }) },
  { key: 'symbolPlacements', label: 'Symbolplaceringar', cols: () => [col.id(), col.text('name', 'Namn')], blank: () => ({ id: '', name: '' }) },
].filter(c => c.key !== 'textColorsSpacer');

function setSur(r, kind, v) {
  if (!r.surcharge) r.surcharge = {};
  if (v === '' || v == null) delete r.surcharge[kind]; else r.surcharge[kind] = Number(v);
  if (!Object.keys(r.surcharge).length) delete r.surcharge;
}

// ---------------------------------------------------------------- generisk tabell
function tableEditor(rows, columns, blank) {
  const wrap = el('div');
  const scroller = el('div', 'tbl-scroll');
  const table = el('table', 'adm');
  const thead = el('thead'); const htr = el('tr');
  columns.forEach(c => htr.appendChild(el('th', null, c.label)));
  htr.appendChild(el('th', null, ''));
  thead.appendChild(htr); table.appendChild(thead);
  const tbody = el('tbody');
  rows.forEach((row, i) => tbody.appendChild(buildRow(rows, row, i, columns)));
  table.appendChild(tbody);
  scroller.appendChild(table);
  wrap.appendChild(scroller);
  if (blank) {
    const add = el('button', 'adm-btn adm-add', '+ Lägg till rad');
    add.addEventListener('click', () => { rows.push(blank()); touch(); renderMain(); });
    wrap.appendChild(add);
  }
  return wrap;
}

function buildRow(rows, row, i, columns) {
  const tr = el('tr');
  columns.forEach(c => {
    const td = el('td');
    td.appendChild(buildCell(c, row));
    tr.appendChild(td);
  });
  const td = el('td');
  const btns = el('div', 'rowbtns');
  const mk = (txt, title, fn, cls) => { const b = el('button', cls, txt); b.title = title; b.type = 'button'; b.addEventListener('click', fn); return b; };
  btns.appendChild(mk('↑', 'Flytta upp', () => { if (i > 0) { [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; touch(); renderMain(); } }));
  btns.appendChild(mk('↓', 'Flytta ned', () => { if (i < rows.length - 1) { [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; touch(); renderMain(); } }));
  btns.appendChild(mk('⧉', 'Duplicera', () => { const c = JSON.parse(JSON.stringify(row)); c.id = (c.id || '') + '-kopia'; rows.splice(i + 1, 0, c); touch(); renderMain(); }));
  btns.appendChild(mk('✕', 'Ta bort', () => { rows.splice(i, 1); touch(); renderMain(); }, 'del'));
  td.appendChild(btns); tr.appendChild(td);
  return tr;
}

function buildCell(c, row) {
  if (c.type === 'bool') {
    const inp = el('input'); inp.type = 'checkbox'; inp.checked = c.get(row);
    inp.addEventListener('change', () => { c.set(row, inp.checked); touch(); refreshValidation(); });
    return inp;
  }
  if (c.type === 'select') {
    const s = el('select');
    c.options.forEach(o => { const opt = el('option', null, o.l); opt.value = o.v; if (o.v === c.get(row)) opt.selected = true; s.appendChild(opt); });
    s.addEventListener('change', () => { c.set(row, s.value); touch(); refreshValidation(); });
    return s;
  }
  if (c.type === 'color') {
    const w = el('div', 'cell-color');
    const cp = el('input'); cp.type = 'color'; const hexVal = /^#[0-9a-fA-F]{6}$/.test(c.get(row)) ? c.get(row) : '#cccccc'; cp.value = hexVal;
    const tx = el('input'); tx.type = 'text'; tx.value = c.get(row);
    cp.addEventListener('input', () => { tx.value = cp.value; c.set(row, cp.value); touch(); });
    cp.addEventListener('change', () => refreshValidation());
    tx.addEventListener('input', () => { c.set(row, tx.value.trim()); if (/^#[0-9a-fA-F]{6}$/.test(tx.value.trim())) cp.value = tx.value.trim(); touch(); });
    tx.addEventListener('blur', refreshValidation);
    w.appendChild(cp); w.appendChild(tx); return w;
  }
  if (c.type === 'widths') {
    const w = el('div', 'rowbtns'); const cur = new Set(c.get(row));
    WIDTHS.forEach(width => {
      const lab = el('label', 'cb'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = cur.has(width);
      cb.addEventListener('change', () => { if (cb.checked) cur.add(width); else cur.delete(width); c.set(row, WIDTHS.filter(x => cur.has(x))); touch(); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(width)); w.appendChild(lab);
    });
    return w;
  }
  if (c.type === 'image') {
    const w = el('div', 'cell-img');
    const img = el('img', 'thumb');
    const bust = () => { img.src = `${THUMB_DIR[c.kind]}/${row.id}.webp?t=${Date.now()}`; };
    img.onerror = () => { img.style.visibility = 'hidden'; };
    img.onload = () => { img.style.visibility = 'visible'; };
    if (row.id) bust(); else img.style.visibility = 'hidden';
    const btn = el('button', 'adm-btn', 'Ladda upp'); btn.type = 'button';
    btn.addEventListener('click', () => uploadImage(c.kind, row, bust));
    w.appendChild(img); w.appendChild(btn); return w;
  }
  const inp = el('input'); inp.type = c.type === 'num' ? 'number' : 'text';
  if (c.cls) inp.className = c.cls;
  if (c.opts) { if (c.opts.step != null) inp.step = c.opts.step; if (c.opts.min != null) inp.min = c.opts.min; if (c.opts.max != null) inp.max = c.opts.max; }
  inp.value = c.get(row);
  inp.addEventListener('input', () => { c.set(row, inp.value); touch(); });
  inp.addEventListener('blur', refreshValidation);
  return inp;
}

// ---------------------------------------------------------------- custom-renderare
function renderLeather(container) {
  const card = el('div', 'subcard'); card.appendChild(el('h3', null, 'Pristillägg äkta läder (kr per bredd)'));
  const kv = el('div', 'kv');
  WIDTHS.forEach(w => {
    kv.appendChild(el('label', null, `${w} cm`));
    const inp = el('input'); inp.type = 'number'; inp.value = cat.leatherSurcharge[w] ?? '';
    inp.addEventListener('input', () => { if (inp.value === '') delete cat.leatherSurcharge[w]; else cat.leatherSurcharge[w] = Number(inp.value); touch(); });
    kv.appendChild(inp);
  });
  card.appendChild(kv); container.appendChild(card);
}

function renderUrls(container) {
  const card = el('div', 'subcard'); card.appendChild(el('h3', null, 'Produktsidor'));
  const kv = el('div', 'kv');
  const u = cat.productUrls; if (!u.cotton) u.cotton = {};
  WIDTHS.forEach(w => {
    kv.appendChild(el('label', null, `Bomull ${w} cm`));
    const inp = el('input'); inp.type = 'text'; inp.value = u.cotton[w] ?? '';
    inp.addEventListener('input', () => { if (inp.value === '') delete u.cotton[w]; else u.cotton[w] = inp.value.trim(); touch(); });
    kv.appendChild(inp);
  });
  kv.appendChild(el('label', null, 'BioThane'));
  const bi = el('input'); bi.type = 'text'; bi.value = u.biothane ?? '';
  bi.addEventListener('input', () => { u.biothane = bi.value.trim(); touch(); });
  kv.appendChild(bi);
  card.appendChild(kv); container.appendChild(card);
}

function renderBiothane(container) {
  const b = cat.biothane;
  const card = el('div', 'subcard'); card.appendChild(el('h3', null, 'Grundpriser'));
  const kv = el('div', 'kv');
  [['basePrice', 'Grundpris (fast)'], ['glitterBasePrice', 'Helglitterpris']].forEach(([f, label]) => {
    kv.appendChild(el('label', null, label));
    const inp = el('input'); inp.type = 'number'; inp.value = b[f] ?? '';
    inp.addEventListener('input', () => { b[f] = Number(inp.value); touch(); });
    kv.appendChild(inp);
  });
  card.appendChild(kv); container.appendChild(card);

  const mCard = el('div', 'subcard'); mCard.appendChild(el('h3', null, 'Modeller'));
  if (!b.models) b.models = [];
  mCard.appendChild(tableEditor(b.models, [col.id(), col.text('name', 'Namn'), col.num('surcharge', 'Tillägg')], () => ({ id: '', name: '', surcharge: 0 })));
  container.appendChild(mCard);

  const wCard = el('div', 'subcard'); wCard.appendChild(el('h3', null, 'Bredder'));
  if (!b.widths) b.widths = [];
  wCard.appendChild(tableEditor(b.widths, [col.id(), col.text('name', 'Namn'), col.num('surcharge', 'Tillägg'), col.num('cm', 'cm', { step: 0.1 })], () => ({ id: '', name: '', surcharge: 0, cm: 2.5 })));
  container.appendChild(wCard);
}

function renderLining(container) {
  cat.liningGroups.forEach((g, gi) => {
    const card = el('div', 'subcard');
    const head = el('div', 'kv');
    head.appendChild(el('label', null, 'Gruppnamn'));
    const gn = el('input'); gn.type = 'text'; gn.value = g.group ?? ''; gn.addEventListener('input', () => { g.group = gn.value; touch(); }); head.appendChild(gn);
    head.appendChild(el('label', null, 'Äkta läder'));
    const lw = el('label', 'cb'); const lb = el('input'); lb.type = 'checkbox'; lb.checked = !!g.leather; lb.addEventListener('change', () => { if (lb.checked) g.leather = true; else delete g.leather; touch(); }); lw.appendChild(lb); head.appendChild(lw);
    card.appendChild(head);
    if (!g.items) g.items = [];
    card.appendChild(tableEditor(g.items,
      [col.id(), col.text('name', 'Namn'), col.color('hex', 'Färg'), col.color('hex2', 'Färg 2'), col.text('pattern', 'Mönster'), col.bool('metallic', 'Metallic'), col.bool('foto', 'Foto'), col.num('texCm', 'cm-skala'), col.image('lining')],
      () => ({ id: '', name: '', hex: '#cccccc' })));
    const rm = el('button', 'adm-btn ghost', '✕ Ta bort hela gruppen'); rm.style.marginTop = '10px';
    rm.addEventListener('click', () => { if (confirm(`Ta bort gruppen "${g.group}"?`)) { cat.liningGroups.splice(gi, 1); touch(); renderMain(); } });
    card.appendChild(rm);
    container.appendChild(card);
  });
  const add = el('button', 'adm-btn', '+ Lägg till fodergrupp');
  add.addEventListener('click', () => { cat.liningGroups.push({ group: 'Ny grupp', items: [] }); touch(); renderMain(); });
  container.appendChild(add);
}

// ---------------------------------------------------------------- validering
function validate() {
  const errs = [];
  for (const c of CATS) {
    if (c.custom || !c.cols) continue;
    const rows = cat[c.key] || [];
    const seen = new Set();
    rows.forEach((r, i) => {
      const where = `${c.label} rad ${i + 1}`;
      if (!r.id || !String(r.id).trim()) errs.push(`${where}: saknar id.`);
      else if (seen.has(r.id)) errs.push(`${c.label}: id "${r.id}" används flera gånger.`);
      else seen.add(r.id);
      if (r.hex != null && !/^#[0-9a-fA-F]{3,8}$/.test(r.hex)) errs.push(`${where}: ogiltig hex "${r.hex}".`);
    });
  }
  return errs;
}

function refreshValidation() {
  const errs = validate();
  const box = $('#errbox');
  if (box) box.remove();
  if (errs.length) {
    const b = el('div', 'adm-errors'); b.id = 'errbox';
    b.appendChild(el('strong', null, `${errs.length} problem måste rättas innan du kan spara:`));
    const ul = el('ul'); errs.slice(0, 15).forEach(e => ul.appendChild(el('li', null, e))); b.appendChild(ul);
    $('#main').prepend(b);
  }
  $('#btnSave').disabled = errs.length > 0;
  return errs;
}

// ---------------------------------------------------------------- rendering
function renderNav() {
  const nav = $('#nav'); nav.innerHTML = '';
  CATS.forEach(c => {
    const b = el('button', c.key === current ? 'sel' : null);
    b.appendChild(document.createTextNode(c.label));
    const n = Array.isArray(cat[c.key]) ? cat[c.key].length : (c.key === 'liningGroups' ? cat.liningGroups.length : '');
    if (n !== '') { const s = el('span', 'cnt', n); b.appendChild(s); }
    b.addEventListener('click', () => { current = c.key; renderNav(); renderMain(); });
    nav.appendChild(b);
  });
}

function renderMain() {
  const main = $('#main'); main.innerHTML = '';
  const c = CATS.find(x => x.key === current); if (!c) return;
  main.appendChild(el('h2', null, c.label));
  if (c.hint) main.appendChild(el('p', 'hint', c.hint));
  if (c.custom) c.custom(main);
  else main.appendChild(tableEditor(cat[c.key], c.cols(), c.blank));
  refreshValidation();
}

// ---------------------------------------------------------------- dirty + toast
function touch() { dirty = true; updateDirty(); }
function markClean() { dirty = false; updateDirty(); }
function updateDirty() {
  const d = $('#dirty');
  d.textContent = dirty ? '● Osparade ändringar' : 'Allt sparat';
  d.className = 'adm-dirty' + (dirty ? ' on' : '');
}
let toastT;
function toast(msg, kind) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (kind === 'err' ? ' err' : '');
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = 'toast'; }, kind === 'err' ? 6000 : 3500);
}

// ---------------------------------------------------------------- åtgärder
async function save() {
  if (refreshValidation().length) { toast('Rätta felen först.', 'err'); return; }
  let pw = sessionStorage.getItem('vd_admin_pw');
  if (!pw) { pw = prompt('Admin-lösenord:'); if (!pw) return; }
  $('#btnSave').disabled = true;
  try {
    const res = await fetch('admin.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw, catalog: cat }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.ok) { sessionStorage.setItem('vd_admin_pw', pw); markClean(); toast('Sparat och publicerat' + (j.backup ? ` · backup ${j.backup}` : '')); }
    else {
      if (res.status === 401) sessionStorage.removeItem('vd_admin_pw');
      toast((j.error || `Fel (${res.status})`) + (j.details ? ': ' + j.details.join('; ') : ''), 'err');
    }
  } catch (e) { toast('Kunde inte nå servern: ' + e.message, 'err'); }
  finally { $('#btnSave').disabled = validate().length > 0; }
}

function pickFile() {
  return new Promise(resolve => {
    const inp = el('input'); inp.type = 'file'; inp.accept = 'image/webp,image/png,image/jpeg';
    inp.addEventListener('change', () => resolve(inp.files[0] || null), { once: true });
    inp.click();
  });
}

async function uploadImage(kind, row, onDone) {
  if (!row.id || !/^[a-z0-9-]+$/.test(row.id)) { toast('Sätt ett giltigt id (a–z, 0–9, bindestreck) först.', 'err'); return; }
  const file = await pickFile();
  if (!file) return;
  let pw = sessionStorage.getItem('vd_admin_pw');
  if (!pw) { pw = prompt('Admin-lösenord:'); if (!pw) return; }
  const fd = new FormData();
  fd.append('password', pw); fd.append('kind', kind); fd.append('id', row.id); fd.append('image', file);
  toast('Laddar upp bild…');
  try {
    const res = await fetch('admin-upload.php', { method: 'POST', body: fd });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.ok) {
      sessionStorage.setItem('vd_admin_pw', pw);
      row.foto = true; touch();
      toast('Bild uppladdad. Kom ihåg att spara för att publicera foto-kopplingen.');
      renderMain();
    } else {
      if (res.status === 401) sessionStorage.removeItem('vd_admin_pw');
      toast(j.error || `Fel (${res.status})`, 'err');
    }
  } catch (e) { toast('Kunde inte ladda upp: ' + e.message, 'err'); }
}

function preview() {
  try { localStorage.setItem('vd_preview_catalog', JSON.stringify(cat)); }
  catch (e) { toast('Kunde inte spara förhandsvisning: ' + e.message, 'err'); return; }
  window.open('/?preview=1', '_blank');
  toast('Öppnade förhandsvisning i ny flik (ej publicerat).');
}

function download() {
  const blob = new Blob([JSON.stringify(cat, null, 2)], { type: 'application/json' });
  const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'data.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function reset() {
  if (!confirm('Återställ HELA katalogen till inbyggda standardvärden? Osparade ändringar försvinner (publiceras inte förrän du sparar).')) return;
  cat = factoryCatalog(); touch(); renderNav(); renderMain();
  toast('Återställt till standard. Granska och spara för att publicera.');
}

// ---------------------------------------------------------------- init
async function init() {
  try {
    const res = await fetch('/data.json', { cache: 'no-cache' });
    cat = res.ok ? await res.json() : factoryCatalog();
  } catch { cat = factoryCatalog(); }
  // säkerställ att alla kategorinycklar finns
  const f = factoryCatalog();
  for (const k of Object.keys(f)) if (cat[k] == null) cat[k] = f[k];
  current = CATS[0].key;
  markClean();
  renderNav(); renderMain();
  $('#btnSave').addEventListener('click', save);
  $('#btnPreview').addEventListener('click', preview);
  $('#btnDownload').addEventListener('click', download);
  $('#btnReset').addEventListener('click', reset);
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
}

init();
