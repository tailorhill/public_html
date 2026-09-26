// Export av text & symboler i verklig storlek (mm) för skärning:
// - SVG (banor) för Cricut / Silhouette Studio (betalversionen)
// - DXF (R12-polylines) för gratisversionen av Silhouette Studio
// Texterna konverteras med opentype.js + fontfilerna i fonts/, symbolerna
// är Valley Dogs egna vektorer. Layouten speglar 3D-vyn (paintTextBlock).
import { symbolExportData, symbolAspect } from './symbols.js';

let opentypeReady = null;
function loadOpentype() {
  if (opentypeReady) return opentypeReady;
  opentypeReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/opentype.min.js';
    s.onload = () => resolve(window.opentype);
    s.onerror = () => reject(new Error('Kunde inte ladda opentype.js'));
    document.head.appendChild(s);
  });
  return opentypeReady;
}

let clipperReady = null;
function loadClipper() {
  if (clipperReady) return clipperReady;
  clipperReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/clipper.js';
    s.onload = () => resolve(window.ClipperLib);
    s.onerror = () => reject(new Error('Kunde inte ladda clipper.js'));
    document.head.appendChild(s);
  });
  return clipperReady;
}

const fontCache = {};
async function loadFont(ttf) {
  if (fontCache[ttf]) return fontCache[ttf];
  const opentype = await loadOpentype();
  const buf = await (await fetch(`fonts/${ttf}`)).arrayBuffer();
  fontCache[ttf] = opentype.parse(buf);
  return fontCache[ttf];
}

// ------------------------------------------------------------- layout
// Gemensam placeringsberäkning för båda formaten (speglar paintTextBlock).
// Returnerar { W, H, M, bandH, total, placedTexts:[{t,font,size,cx,cy,idx}],
//              placedSymbols:[{cx,cy,id,size}] }
async function computeLayout(cfg) {
  const bandH = cfg.bandHmm;
  const content = cfg.content;
  const rows = (content && content.rows || []).filter(r => r.els.some(e => e.t === 'sym' || (e.text && e.text.trim())));
  if (!rows.length) throw new Error('Ingen text eller symbol att exportera.');
  const nRows = rows.length;
  const overlay = content.layout === 'overlay' && nRows === 2;
  const M = 5;

  // ladda alla unika typsnitt
  const textElsFlat = rows.flatMap(r => r.els.filter(e => e.t === 'text' && e.text.trim()));
  const fontCache = {};
  await Promise.all([...new Set(textElsFlat.map(e => e.font.ttf))].map(async ttf => { fontCache[ttf] = await loadFont(ttf); }));
  const otFont = e => fontCache[e.font.ttf];

  const rowBase = ri => overlay ? bandH * (ri === 0 ? 0.62 : 0.23)
    : nRows === 3 ? bandH * 0.29 : nRows === 2 ? bandH * 0.4 : bandH * 0.54;
  const rowSizes = rows.map((r, ri) => Math.min(rowBase(ri), bandH * 0.82));
  const symSizeFor = size => size * 0.94;
  const gapFor = size => size * 0.22;
  const disp = e => (e.font.caps ? e.text.trim().toUpperCase() : e.text.trim());
  const textW = (e, size) => otFont(e).getAdvanceWidth(disp(e), size);

  const buildRow = (row, size) => {
    const items = row.els.filter(e => e.t === 'sym' || e.text.trim()).map(e => e.t === 'sym'
      ? { kind: 'sym', id: e.id, sz: symSizeFor(size), w: symSizeFor(size) * symbolAspect(e.id) }
      : { kind: 'text', el: e, w: textW(e, size) });
    const gap = gapFor(size);
    const totW = items.reduce((a, it) => a + it.w, 0) + gap * Math.max(0, items.length - 1);
    return { items, gap, totW };
  };
  const layouts = rows.map((r, ri) => buildRow(r, rowSizes[ri]));

  const total = Math.max(...layouts.map(L => L.totW), 0);
  const W = total + M * 2, H = bandH + M * 2;
  const cyMid = M + bandH / 2;
  const rowY = ri => {
    if (overlay) {
      if (ri === 0) return cyMid;
      const p = content.overlayPos || 'mitten';
      return p === 'topp' ? cyMid - bandH * 0.19 : p === 'botten' ? cyMid + bandH * 0.19 : cyMid;
    }
    if (nRows === 3) return M + bandH * [0.19, 0.5, 0.81][ri];
    if (nRows === 2) return M + bandH * [0.29, 0.72][ri];
    return cyMid;
  };

  const placedTexts = [], placedSymbols = [];
  let textIdx = 0;
  rows.forEach((row, ri) => {
    const L = layouts[ri], size = rowSizes[ri], cy = rowY(ri);
    let x = M + (total - L.totW) / 2;
    for (const it of L.items) {
      if (it.kind === 'text') {
        placedTexts.push({ t: { text: it.el.text, font: it.el.font, color: it.el.color }, font: otFont(it.el), size, cx: x + it.w / 2, cy, idx: textIdx++ });
      } else {
        placedSymbols.push({ cx: x + it.w / 2, cy, id: it.id, size: it.sz });
      }
      x += it.w + L.gap;
    }
  });

  const widthOfPlaced = p => p.font.getAdvanceWidth(disp(p.t), p.size);
  return { W, H, M, bandH, total, placedTexts, placedSymbols, disp, widthOfPlaced };
}

// text → opentype-path, centrerad som canvas textBaseline 'middle'
function textOtPath(p, L) {
  const w = L.widthOfPlaced(p);
  const upem = p.font.unitsPerEm;
  const baseline = p.cy + ((p.font.ascender + p.font.descender) / 2) * (p.size / upem);
  return { path: p.font.getPath(L.disp(p.t), p.cx - w / 2, baseline, p.size), w };
}

// ------------------------------------------------------------- skugga
// Allt "bläck" (text + symbol) som plattade polygoner i mm-rymden.
function collectInkPolys(L, cfg) {
  const polys = [];
  for (const p of L.placedTexts) {
    const { path } = textOtPath(p, L);
    let tp = otPathToPolys(path);
    if (p.t.font.italic) {
      const k = Math.tan((8 * Math.PI) / 180);
      const xOff = p.cx * 0.14;
      tp = tp.map(poly => poly.map(([px, py]) => [px + xOff - k * py, py]));
    }
    polys.push(...tp);
  }
  for (const s of (cfg.shadowSymbols === false ? [] : L.placedSymbols)) {
    const data = symbolExportData(s.id);
    if (!data) continue;
    if (data.flag) {
      polys.push(...flagRects(s.cx, s.cy, s.size, data.flag)
        .map(r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]));
    } else {
      const b = data.bounds;
      const k = s.size / b.h;
      const tx = s.cx - (b.w * k) / 2 - b.x * k;
      const ty = s.cy - s.size / 2 - b.y * k;
      const subs = data.d.split(/(?=M)/).filter(v => v.trim());
      polys.push(...subs.map(sd =>
        sampleSubpath(sd, k).map(([px, py]) => [px * k + tx, py * k + ty])));
    }
  }
  return polys;
}

// Skugglagret: unionen av allt bläck, utvidgat med skuggradien (samma
// radie som konturen i 3D-vyn). Returnerar polygoner i mm, eller null.
async function buildShadowPolys(L, cfg) {
  if (!cfg.shadowColor) return null;
  const CL = await loadClipper();
  const SC = 1000; // µm-precision
  const subj = collectInkPolys(L, cfg)
    .filter(p => p.length > 2)
    .map(poly => poly.map(([x, y]) => ({ X: Math.round(x * SC), Y: Math.round(y * SC) })));
  if (!subj.length) return null;
  const clip = new CL.Clipper();
  clip.AddPaths(subj, CL.PolyType.ptSubject, true);
  const united = new CL.Paths();
  clip.Execute(CL.ClipType.ctUnion, united, CL.PolyFillType.pftEvenOdd, CL.PolyFillType.pftEvenOdd);
  const off = new CL.ClipperOffset(2, 0.1 * SC);
  off.AddPaths(united, CL.JoinType.jtRound, CL.EndType.etClosedPolygon);
  const out = new CL.Paths();
  off.Execute(out, L.bandH * 0.045 * SC);
  return out.map(p => p.map(q => [q.X / SC, q.Y / SC]));
}

const polysToSvgD = polys => polys
  .map(p => 'M' + p.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z')
  .join('');

// ------------------------------------------------------------- SVG
export async function buildCutSvg(cfg) {
  const L = await computeLayout(cfg);
  const parts = [];

  const shadow = await buildShadowPolys(L, cfg);
  if (shadow) {
    parts.push(`<g id="skugga"><path fill="${cfg.shadowColor.hex}" fill-rule="evenodd" ` +
      `d="${polysToSvgD(shadow)}"/></g>`);
  }

  for (const p of L.placedTexts) {
    const { path } = textOtPath(p, L);
    let g = `<path fill="${p.t.color.hex}" d="${path.toPathData(3)}"/>`;
    if (p.t.font.italic) {
      g = `<g transform="translate(${(p.cx * 0.14).toFixed(2)} 0) skewX(-8)">${g}</g>`;
    }
    parts.push(`<g id="text-${p.idx + 1}">${g}</g>`);
  }

  for (const s of L.placedSymbols) {
    const data = symbolExportData(s.id);
    if (!data) continue;
    if (data.flag) {
      parts.push(`<g id="symbol">${flagRects(s.cx, s.cy, s.size, data.flag)
        .map(r => `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.w.toFixed(2)}" height="${r.h.toFixed(2)}" fill="${r.fill}"/>`)
        .join('')}</g>`);
    } else {
      const b = data.bounds;
      const k = s.size / b.h;
      const tx = s.cx - (b.w * k) / 2 - b.x * k;
      const ty = s.cy - s.size / 2 - b.y * k;
      const col = cfg.symbolColor ? cfg.symbolColor.hex
        : (L.placedTexts[0] ? L.placedTexts[0].t.color.hex : '#000');
      parts.push(`<g id="symbol" transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})">` +
        `<path fill="${col}" fill-rule="evenodd" d="${data.d}"/></g>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W.toFixed(1)}mm" height="${L.H.toFixed(1)}mm" ` +
    `viewBox="0 0 ${L.W.toFixed(1)} ${L.H.toFixed(1)}">\n` +
    `<!-- Text och symboler i verklig storlek (1 enhet = 1 mm). Bandhöjd ${L.bandH} mm. -->\n` +
    parts.join('\n') + '\n</svg>\n';
}

function flagRects(cx, cy, s, f) {
  const w = s * 1.5, h = s * 0.94;
  const x = cx - w / 2, y = cy - h / 2;
  const cw = h * 0.2, cxoff = x + w * 0.36;
  const r = [
    { x, y, w, h, fill: f.bg },
    { x, y: cy - cw / 2, w, h: cw, fill: f.cross },
    { x: cxoff - cw / 2, y, w: cw, h, fill: f.cross },
  ];
  if (f.inner) {
    const iw = cw * 0.5;
    r.push({ x, y: cy - iw / 2, w, h: iw, fill: f.inner });
    r.push({ x: cxoff - iw / 2, y, w: iw, h, fill: f.inner });
  }
  return r;
}

// ------------------------------------------------------------- DXF
// Allt plattas till slutna polylines (steg ~0,25 mm) i DXF R12-format,
// som gratisversionen av Silhouette Studio kan öppna.

const SVG_NS = 'http://www.w3.org/2000/svg';
let sampleSvg = null;
function samplerPathEl() {
  if (!sampleSvg) {
    sampleSvg = document.createElementNS(SVG_NS, 'svg');
    sampleSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(sampleSvg);
  }
  const p = document.createElementNS(SVG_NS, 'path');
  sampleSvg.appendChild(p);
  return p;
}

// samplar en subpath-d till punkter; scale = mm per d-enhet
function sampleSubpath(d, scale) {
  const p = samplerPathEl();
  p.setAttribute('d', d);
  const len = p.getTotalLength();
  const n = Math.max(24, Math.min(900, Math.ceil((len * scale) / 0.25)));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const q = p.getPointAtLength((len * i) / n);
    pts.push([q.x, q.y]);
  }
  p.remove();
  return pts;
}

// opentype-kommandon → polylines (flatta bezierkurvor)
function otPathToPolys(path) {
  const polys = [];
  let cur = null;
  let x = 0, y = 0, sx0 = 0, sy0 = 0;
  const STEPS = 14;
  for (const c of path.commands) {
    if (c.type === 'M') {
      if (cur && cur.length > 1) polys.push(cur);
      cur = [[c.x, c.y]];
      x = c.x; y = c.y; sx0 = c.x; sy0 = c.y;
    } else if (c.type === 'L') {
      cur.push([c.x, c.y]); x = c.x; y = c.y;
    } else if (c.type === 'C') {
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS, u = 1 - t;
        cur.push([
          u*u*u*x + 3*u*u*t*c.x1 + 3*u*t*t*c.x2 + t*t*t*c.x,
          u*u*u*y + 3*u*u*t*c.y1 + 3*u*t*t*c.y2 + t*t*t*c.y,
        ]);
      }
      x = c.x; y = c.y;
    } else if (c.type === 'Q') {
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS, u = 1 - t;
        cur.push([
          u*u*x + 2*u*t*c.x1 + t*t*c.x,
          u*u*y + 2*u*t*c.y1 + t*t*c.y,
        ]);
      }
      x = c.x; y = c.y;
    } else if (c.type === 'Z') {
      cur.push([sx0, sy0]);
      polys.push(cur); cur = null;
      x = sx0; y = sy0;
    }
  }
  if (cur && cur.length > 1) polys.push(cur);
  return polys;
}

export async function buildCutDxf(cfg) {
  const L = await computeLayout(cfg);
  const layers = []; // {name, polys: [[x,y]...]}

  const shadow = await buildShadowPolys(L, cfg);
  if (shadow) {
    layers.push({ name: 'SKUGGA', polys: shadow.map(p => [...p, p[0]]) });
  }

  for (const p of L.placedTexts) {
    const { path } = textOtPath(p, L);
    let polys = otPathToPolys(path);
    if (p.t.font.italic) {
      const k = Math.tan((8 * Math.PI) / 180);
      const xOff = p.cx * 0.14;
      polys = polys.map(poly => poly.map(([px, py]) => [px + xOff - k * py, py]));
    }
    layers.push({ name: `TEXT${p.idx + 1}`, polys });
  }

  for (const s of L.placedSymbols) {
    const data = symbolExportData(s.id);
    if (!data) continue;
    if (data.flag) {
      const polys = flagRects(s.cx, s.cy, s.size, data.flag)
        .map(r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h], [r.x, r.y]]);
      layers.push({ name: 'SYMBOL', polys });
    } else {
      const b = data.bounds;
      const k = s.size / b.h;
      const tx = s.cx - (b.w * k) / 2 - b.x * k;
      const ty = s.cy - s.size / 2 - b.y * k;
      // dela d-strängen i subpaths (alla börjar med absolut M)
      const subs = data.d.split(/(?=M)/).filter(v => v.trim());
      const polys = subs.map(sd =>
        sampleSubpath(sd, k).map(([px, py]) => [px * k + tx, py * k + ty]));
      layers.push({ name: 'SYMBOL', polys });
    }
  }

  // DXF R12 – y-axeln pekar uppåt, så flippa
  const H = L.H;
  const rows = ['0', 'SECTION', '2', 'ENTITIES'];
  for (const layer of layers) {
    for (const poly of layer.polys) {
      if (poly.length < 2) continue;
      const closed = Math.hypot(poly[0][0] - poly[poly.length - 1][0], poly[0][1] - poly[poly.length - 1][1]) < 1e-6;
      rows.push('0', 'POLYLINE', '8', layer.name, '66', '1', '70', closed ? '1' : '0');
      const pts = closed ? poly.slice(0, -1) : poly;
      for (const [px, py] of pts) {
        rows.push('0', 'VERTEX', '8', layer.name,
          '10', px.toFixed(3), '20', (H - py).toFixed(3), '30', '0');
      }
      rows.push('0', 'SEQEND');
    }
  }
  rows.push('0', 'ENDSEC', '0', 'EOF');
  return rows.join('\r\n') + '\r\n';
}
