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
// Gemensam placeringsberäkning för båda formaten.
// Returnerar { W, H, M, bandH, total, texts:[{...,cx,cy,size,font}], symbols:[{cx,cy}] }
async function computeLayout(cfg) {
  const bandH = cfg.bandHmm;
  const texts = (cfg.texts || []).filter(t => t.text && t.text.trim());
  const hasSymbol = cfg.symbol && cfg.symbol !== 'ingen';
  if (!texts.length && !hasSymbol) throw new Error('Ingen text eller symbol att exportera.');
  const layout = texts.length > 1 ? (cfg.layout || 'rad') : 'rad';

  const fonts = await Promise.all(texts.map(t => loadFont(t.font.ttf)));

  let sizes;
  if (layout === 'rader' && texts.length > 1) {
    const base = texts.length === 3 ? 0.29 : 0.4;
    sizes = texts.map(() => bandH * base);
  } else if (layout === 'dubbel' && texts.length > 1) {
    sizes = texts.map((t, i) => bandH * (i === 0 ? 0.62 : 0.46));
  } else {
    sizes = texts.map(() => bandH * (texts.length === 3 ? 0.46 : 0.54));
  }
  sizes = sizes.map((s, i) => Math.min(s * (texts[i].sizeK || 1), bandH * 0.82));

  const disp = t => (t.font.caps ? t.text.trim().toUpperCase() : t.text.trim());
  const widthOf = (i, size) => fonts[i].getAdvanceWidth(disp(texts[i]), size);

  let bw = 0;
  if (layout === 'rad' && texts.length > 1) {
    bw = texts.reduce((a, t, i) => a + widthOf(i, sizes[i]), 0) + sizes[0] * 0.5 * (texts.length - 1);
  } else {
    bw = Math.max(...texts.map((t, i) => widthOf(i, sizes[i])), 0);
  }

  const symSize = bandH * 0.5;
  const symW = hasSymbol ? symSize * symbolAspect(cfg.symbol) : 0;
  const gap = (texts.length && hasSymbol) ? bandH * 0.24 : 0;

  let items = [];
  if (hasSymbol && !texts.length) items = ['sym'];
  else if (hasSymbol && cfg.symbolPlacement === 'fore') items = ['sym', 'blk'];
  else if (hasSymbol && cfg.symbolPlacement === 'bada') items = ['sym', 'blk', 'sym'];
  else if (hasSymbol) items = ['blk', 'sym'];
  else items = ['blk'];

  let total = 0;
  for (const k of items) total += (k === 'blk' ? bw : symW);
  total += gap * (items.length - 1);

  const M = 5;
  const W = total + M * 2, H = bandH + M * 2;
  const cyMid = M + bandH / 2;

  const placedTexts = [];
  const placedSymbols = [];

  const placeBlock = (cx) => {
    if (layout === 'rader' && texts.length > 1) {
      const ys = texts.length === 3 ? [0.19, 0.5, 0.81] : [0.28, 0.73];
      texts.forEach((t, i) =>
        placedTexts.push({ t, font: fonts[i], size: sizes[i], cx, cy: M + bandH * ys[i], idx: i }));
    } else if (layout === 'dubbel' && texts.length > 1) {
      placedTexts.push({ t: texts[0], font: fonts[0], size: sizes[0], cx, cy: cyMid, idx: 0 });
      const pos = cfg.dubbelPos || 'mitten';
      const fy = pos === 'topp' ? cyMid - bandH * 0.19 : pos === 'botten' ? cyMid + bandH * 0.19 : cyMid;
      placedTexts.push({ t: texts[1], font: fonts[1], size: sizes[1], cx, cy: fy, idx: 1 });
    } else if (texts.length > 1) {
      const ws = texts.map((t, i) => widthOf(i, sizes[i]));
      const g2 = sizes[0] * 0.5;
      const totW = ws.reduce((a, b) => a + b, 0) + g2 * (texts.length - 1);
      let tx = cx - totW / 2;
      texts.forEach((t, i) => {
        placedTexts.push({ t, font: fonts[i], size: sizes[i], cx: tx + ws[i] / 2, cy: cyMid, idx: i });
        tx += ws[i] + g2;
      });
    } else if (texts.length) {
      placedTexts.push({ t: texts[0], font: fonts[0], size: sizes[0], cx, cy: cyMid, idx: 0 });
    }
  };

  let x = M;
  for (const k of items) {
    if (k === 'blk') {
      placeBlock(x + bw / 2);
      x += bw + gap;
    } else {
      placedSymbols.push({ cx: x + symW / 2, cy: cyMid });
      x += symW + gap;
    }
  }

  const widthOfPlaced = p => p.font.getAdvanceWidth(disp(p.t), p.size);
  return { W, H, M, bandH, total, symSize, placedTexts, placedSymbols, disp, widthOfPlaced };
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
  for (const s of L.placedSymbols) {
    const data = symbolExportData(cfg.symbol);
    if (!data) continue;
    if (data.flag) {
      polys.push(...flagRects(s.cx, s.cy, L.symSize, data.flag)
        .map(r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]));
    } else {
      const b = data.bounds;
      const k = L.symSize / b.h;
      const tx = s.cx - (b.w * k) / 2 - b.x * k;
      const ty = s.cy - L.symSize / 2 - b.y * k;
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
    const data = symbolExportData(cfg.symbol);
    if (!data) continue;
    if (data.flag) {
      parts.push(`<g id="symbol">${flagRects(s.cx, s.cy, L.symSize, data.flag)
        .map(r => `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.w.toFixed(2)}" height="${r.h.toFixed(2)}" fill="${r.fill}"/>`)
        .join('')}</g>`);
    } else {
      const b = data.bounds;
      const k = L.symSize / b.h;
      const tx = s.cx - (b.w * k) / 2 - b.x * k;
      const ty = s.cy - L.symSize / 2 - b.y * k;
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
    const data = symbolExportData(cfg.symbol);
    if (!data) continue;
    if (data.flag) {
      const polys = flagRects(s.cx, s.cy, L.symSize, data.flag)
        .map(r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h], [r.x, r.y]]);
      layers.push({ name: 'SYMBOL', polys });
    } else {
      const b = data.bounds;
      const k = L.symSize / b.h;
      const tx = s.cx - (b.w * k) / 2 - b.x * k;
      const ty = s.cy - L.symSize / 2 - b.y * k;
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
