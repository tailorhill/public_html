// Riktiga symboler i stället för handritade:
// - Glyfer ur Noto Emoji (Googles monokroma emojifont, laddas via Google
//   Fonts i index.html) – professionellt designade och färgsättningsbara.
// - Flaggorna ritas exakt enligt flaggornas geometri.
// - Apportbocken är Material Icons "fitness_center" (Apache 2.0).

const EMOJI = {
  tass:            '🐾',
  hjarta:          '❤',
  smahjartan:      '💕',
  stjarna:         '⭐',
  stjarnor:        '✨',
  blinkandestjarna:'🌟',
  krona:           '👑',
  blixt:           '⚡',
  eld:             '🔥',
  fyrklover:       '🍀',
  diamant:         '💎',
  pokal:           '🏆',
  dodskalle:       '💀',
  bomb:            '💣',
  treudd:          '🔱',
  dalahast:        '🐎',
  vallhund:        '🐕',
  far:             '🐑',
  virvelvind:      '🌪',
  clown:           '🤡',
  monster:         '👾',
};

// Material Icons "fitness_center", 24x24 viewBox (Apache License 2.0).
const FITNESS_CENTER_PATH = new Path2D(
  'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 ' +
  '7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 ' +
  '3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 ' +
  '1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z'
);

export const EMOJI_FONT = '"Noto Emoji"';

// Alla glyfer som används – behövs för att tvinga fram rätt font-subset.
export const EMOJI_GLYPHS = Object.values(EMOJI).join('') + '🌿';

function drawEmoji(ctx, glyph, cx, cy, s, color) {
  ctx.save();
  ctx.font = `600 ${Math.round(s * 1.18)}px ${EMOJI_FONT}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  // Noto Emoji-glyferna ligger något högt i sin em-ruta
  ctx.fillText(glyph, cx, cy + s * 0.06);
  ctx.restore();
}

export function drawSymbol(ctx, id, cx, cy, s, color) {
  switch (id) {
    case 'svenskaflaggan': flagNordic(ctx, cx, cy, s, '#1c50a0', '#f8d015'); return;
    case 'norskaflaggan':  flagNordic(ctx, cx, cy, s, '#d5273b', '#ffffff', '#26356e'); return;
    case 'finskaflaggan':  flagNordic(ctx, cx, cy, s, '#f4f5f8', '#1c3f7c', null, true); return;
    case 'danskaflaggan':  flagNordic(ctx, cx, cy, s, '#e8112d', '#ffffff'); return;

    case 'apportbock': {
      ctx.save();
      ctx.translate(cx - s / 2, cy - s / 2);
      ctx.scale(s / 24, s / 24);
      ctx.fillStyle = color;
      ctx.fill(FITNESS_CENTER_PATH);
      ctx.restore();
      return;
    }
    case 'kvistar': {
      // två speglade kvistar
      ctx.save();
      ctx.translate(cx, cy);
      drawEmoji(ctx, '🌿', -s * 0.33, 0, s * 0.85, color);
      ctx.scale(-1, 1);
      drawEmoji(ctx, '🌿', -s * 0.33, 0, s * 0.85, color);
      ctx.restore();
      return;
    }
    default: {
      const glyph = EMOJI[id];
      if (glyph) drawEmoji(ctx, glyph, cx, cy, s, color);
    }
  }
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
    case 'kvistar': return 1.35;
    case 'smahjartan': case 'dalahast': return 1.1;
    default: return 1.0;
  }
}
