// SVG-export av text & symboler som banor, i verklig storlek (mm).
// Avsedd för skärning i Cricut/Silhouette: texterna konverteras till paths
// med opentype.js och fontfilerna i fonts/, symbolerna är Valley Dogs egna
// vektorer. Layouten speglar 3D-vyns (paintTextBlock i collar3d.js).
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

const fontCache = {};
async function loadFont(ttf) {
  if (fontCache[ttf]) return fontCache[ttf];
  const opentype = await loadOpentype();
  const buf = await (await fetch(`fonts/${ttf}`)).arrayBuffer();
  fontCache[ttf] = opentype.parse(buf);
  return fontCache[ttf];
}

// cfg: { texts: [{text, font, color, sizeK}], layout, dubbelPos,
//        symbol, symbolPlacement, symbolColor, bandHmm }
export async function buildCutSvg(cfg) {
  const bandH = cfg.bandHmm;
  const texts = (cfg.texts || []).filter(t => t.text && t.text.trim());
  const hasSymbol = cfg.symbol && cfg.symbol !== 'ingen';
  if (!texts.length && !hasSymbol) throw new Error('Ingen text eller symbol att exportera.');
  const layout = texts.length > 1 ? (cfg.layout || 'rad') : 'rad';

  // ladda fonter
  const fonts = await Promise.all(texts.map(t => loadFont(t.font.ttf)));

  // storlekar – samma formler som 3D-vyn
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

  // blockbredd
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

  const M = 5; // marginal i mm
  const W = total + M * 2, H = bandH + M * 2;
  const cyMid = M + bandH / 2;

  const parts = [];

  // text som path, centrerad kring (cx, cy) som canvas textBaseline 'middle'
  const textPath = (i, size, cx, cy) => {
    const t = texts[i], font = fonts[i];
    const w = widthOf(i, size);
    const upem = font.unitsPerEm;
    const baseline = cy + ((font.ascender + font.descender) / 2) * (size / upem);
    const p = font.getPath(disp(t), cx - w / 2, baseline, size);
    let g = `<path fill="${t.color.hex}" d="${p.toPathData(3)}"/>`;
    if (t.font.italic) {
      g = `<g transform="translate(${(cx * 0.14).toFixed(2)} 0) skewX(-8)">${g}</g>`;
    }
    return `<g id="text-${i + 1}">${g}</g>`;
  };

  const blockSvg = (cx) => {
    const out = [];
    if (layout === 'rader' && texts.length > 1) {
      const ys = texts.length === 3 ? [0.19, 0.5, 0.81] : [0.28, 0.73];
      texts.forEach((t, i) => out.push(textPath(i, sizes[i], cx, M + bandH * ys[i])));
    } else if (layout === 'dubbel' && texts.length > 1) {
      out.push(textPath(0, sizes[0], cx, cyMid));
      const pos = cfg.dubbelPos || 'mitten';
      const fy = pos === 'topp' ? cyMid - bandH * 0.19 : pos === 'botten' ? cyMid + bandH * 0.19 : cyMid;
      out.push(textPath(1, sizes[1], cx, fy));
    } else if (texts.length > 1) {
      const ws = texts.map((t, i) => widthOf(i, sizes[i]));
      const g2 = sizes[0] * 0.5;
      const totW = ws.reduce((a, b) => a + b, 0) + g2 * (texts.length - 1);
      let tx = cx - totW / 2;
      texts.forEach((t, i) => {
        out.push(textPath(i, sizes[i], tx + ws[i] / 2, cyMid));
        tx += ws[i] + g2;
      });
    } else if (texts.length) {
      out.push(textPath(0, sizes[0], cx, cyMid));
    }
    return out.join('');
  };

  const symbolSvg = (cx, cy) => {
    const data = symbolExportData(cfg.symbol);
    if (!data) return '';
    if (data.flag) {
      const s = symSize, w = s * 1.5, h = s * 0.94;
      const x = cx - w / 2, y = cy - h / 2;
      const cw = h * 0.2, cxoff = x + w * 0.36, f = data.flag;
      const r = [];
      r.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f.bg}"/>`);
      r.push(`<rect x="${x}" y="${y + h / 2 - cw / 2}" width="${w}" height="${cw}" fill="${f.cross}"/>`);
      r.push(`<rect x="${cxoff - cw / 2}" y="${y}" width="${cw}" height="${h}" fill="${f.cross}"/>`);
      if (f.inner) {
        const iw = cw * 0.5;
        r.push(`<rect x="${x}" y="${y + h / 2 - iw / 2}" width="${w}" height="${iw}" fill="${f.inner}"/>`);
        r.push(`<rect x="${cxoff - iw / 2}" y="${y}" width="${iw}" height="${h}" fill="${f.inner}"/>`);
      }
      return `<g id="symbol">${r.map(v => v.replace(/(\d+\.\d{3})\d+/g, '$1')).join('')}</g>`;
    }
    const b = data.bounds;
    const k = symSize / b.h;
    const tx = cx - (b.w * k) / 2 - b.x * k;
    const ty = cy - symSize / 2 - b.y * k;
    const col = cfg.symbolColor ? cfg.symbolColor.hex : (texts[0] ? texts[0].color.hex : '#000');
    return `<g id="symbol" transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})">` +
      `<path fill="${col}" fill-rule="evenodd" d="${data.d}"/></g>`;
  };

  // layout vänster→höger
  let x = M + 0; // items börjar vid W/2 - total/2 + M-justering; W = total+2M så start = M
  for (const k of items) {
    if (k === 'blk') {
      parts.push(blockSvg(x + bw / 2));
      x += bw + gap;
    } else {
      parts.push(symbolSvg(x + symW / 2, cyMid));
      x += symW + gap;
    }
  }

  // referensram: bandets höjd (ta bort före skärning)
  const ref = `<g id="REFERENS-bandhojd-${bandH}mm-ta-bort-fore-skarning">` +
    `<rect x="${M}" y="${M}" width="${total}" height="${bandH}" fill="none" ` +
    `stroke="#999999" stroke-width="0.3" stroke-dasharray="2 2"/></g>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" ` +
    `viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">\n` +
    `<!-- Text och symboler i verklig storlek (1 enhet = 1 mm). Bandhöjd ${bandH} mm. -->\n` +
    ref + '\n' + parts.join('\n') + '\n</svg>\n';

  return svg;
}
