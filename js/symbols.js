// Symboler för halsbanden.
// - De flesta är Valley Dogs EGNA symboler (js/vd-symbols.js, genererade ur
//   leverantörens symbolark) – exakt samma former som sys på halsbanden.
// - Flaggorna ritas exakt enligt sina geometrier, i riktiga färger.
// - Tass och clown saknas i arket och renderas med Noto Emoji tills vidare.
import { VD_SYMBOL_PATHS } from './vd-symbols.js';

const EMOJI = {
  tass:  '🐾',
  clown: '🤡',
};

export const EMOJI_FONT = '"Noto Emoji"';

// Alla emoji-glyfer som används – behövs för att tvinga fram rätt font-subset.
export const EMOJI_GLYPHS = Object.values(EMOJI).join('');

// Registret över path-siluetter (Valley Dogs ark har viewBox 2048).
const SVG_SYMBOLS = {};
for (const [id, d] of Object.entries(VD_SYMBOL_PATHS)) {
  SVG_SYMBOLS[id] = { path: new Path2D(d), viewBox: 2048, bounds: null };
}

function getBounds(entry) {
  if (entry.bounds) return entry.bounds;
  const n = 256;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  x.scale(n / entry.viewBox, n / entry.viewBox);
  x.fill(entry.path, 'evenodd');
  const d = x.getImageData(0, 0, n, n).data;
  let minX = n, minY = n, maxX = 0, maxY = 0;
  for (let py = 0; py < n; py++) {
    for (let px = 0; px < n; px++) {
      if (d[(py * n + px) * 4 + 3] > 10) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }
  const k = entry.viewBox / n;
  entry.bounds = {
    x: minX * k, y: minY * k,
    w: (maxX - minX + 1) * k, h: (maxY - minY + 1) * k,
  };
  return entry.bounds;
}

function drawEmoji(ctx, glyph, cx, cy, s, color) {
  ctx.save();
  ctx.font = `600 ${Math.round(s * 1.18)}px ${EMOJI_FONT}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  // centrera glyfen exakt via dess faktiska bounding box
  const m = ctx.measureText(glyph);
  const yOff = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  ctx.fillText(glyph, cx, cy + yOff);
  ctx.restore();
}

export function drawSymbol(ctx, id, cx, cy, s, color) {
  switch (id) {
    case 'svenskaflaggan': flagNordic(ctx, cx, cy, s, '#1c50a0', '#f8d015'); return;
    case 'norskaflaggan':  flagNordic(ctx, cx, cy, s, '#d5273b', '#ffffff', '#26356e'); return;
    case 'finskaflaggan':  flagNordic(ctx, cx, cy, s, '#f4f5f8', '#1c3f7c', null, true); return;
    case 'danskaflaggan':  flagNordic(ctx, cx, cy, s, '#e8112d', '#ffffff'); return;
    default: break;
  }

  const entry = SVG_SYMBOLS[id];
  if (entry) {
    const b = getBounds(entry);
    const k = s / b.h; // skala efter höjd
    ctx.save();
    ctx.translate(cx - (b.w * k) / 2, cy - s / 2);
    ctx.scale(k, k);
    ctx.translate(-b.x, -b.y);
    ctx.fillStyle = color;
    ctx.fill(entry.path, 'evenodd');
    ctx.restore();
    return;
  }

  const glyph = EMOJI[id];
  if (glyph) drawEmoji(ctx, glyph, cx, cy, s, color);
}

function flagNordic(ctx, cx, cy, s, bg, cross, innerCross = null, outline = false) {
  const w = s * 1.5, h = s * 0.94;
  const x = cx - w / 2, y = cy - h / 2;
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  if (outline) { ctx.strokeStyle = '#00000022'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
  const cw = h * 0.2, cxoff = x + w * 0.36;
  ctx.fillStyle = cross;
  ctx.fillRect(x, y + h / 2 - cw / 2, w, cw);
  ctx.fillRect(cxoff - cw / 2, y, cw, h);
  if (innerCross) {
    const iw = cw * 0.5;
    ctx.fillStyle = innerCross;
    ctx.fillRect(x, y + h / 2 - iw / 2, w, iw);
    ctx.fillRect(cxoff - iw / 2, y, iw, h);
  }
  ctx.restore();
}

// Symbolens naturliga bredd i förhållande till höjden (för layout).
export function symbolAspect(id) {
  switch (id) {
    case 'svenskaflaggan': case 'norskaflaggan': case 'finskaflaggan': case 'danskaflaggan': return 1.5;
    default: {
      const entry = SVG_SYMBOLS[id];
      if (entry) {
        const b = getBounds(entry);
        return b.w / b.h;
      }
      return 1.0;
    }
  }
}
