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
  virvelvind:      '🌪',
  clown:           '🤡',
  monster:         '👾',
};

// Riktiga siluetter som SVG-paths.
// - dalahast: egen siluett (viewBox 2048)
// - vallhund: "Sitting dog" av Delapouite, game-icons.net (CC BY 3.0, viewBox 512)
// - far: "Sheep" av Delapouite, game-icons.net (CC BY 3.0, viewBox 512)
const VALLHUND_D = 'M231.6 16.18l16.7 120.02 73.8 20.5c37.3-11.2 78.5-18.2 102.3-43.6 9.7-10.3 17.2-24.78 9.1-37.92l-75.3 2.22-14.6-31.79h-74.7c-7.7-11.71-22.8-20.46-37.3-29.43zm5.7 145.22c-46.9 19.8-110.1 146.3-111.8 276.5-34.02-58.1-24.9-122.6-2.9-202.6C55.31 287 4.732 448.4 133.1 486.9H346s-6.3-21.5-14.1-28.9c-12.7-12-48.2-20.2-48.2-20.2 27.8-39.2 33.5-71.7 38.6-103.9 4.5 59.8 40.7 126.8 57.4 153h76.5s4.6-15.9.2-21.5c-10.9-13.8-51.3-11.9-51.3-11.9-31.1-107.2-46.3-260.2-90-273.2-21.7-6.5-54.3-14.1-77.8-18.9z';
const FAR_D = 'M392.8 107.5c9.3 5.3 25.8 9.3 40 9.2 7.7-.1 14.6-1.2 19.5-3.2 5-1.8 6.9-4.9 8.9-8.8-9.2-6.08-22.1-12.27-31.8-12.87-14.9.53-28.8 8.13-36.6 15.67zm-253 20.2c-1.7 5.5-7.9 8.1-13 5.4-26.5-14.5-50.46-6.9-67.71 8.7-35.93 32.6-45.13 87.3-32.47 145.7 7.31 33.6 18.99 53 41.29 62.8 0 .1.1.1.15.1 2.22 1 4.21 1.9 6.09 2.8l4.61-22c1.02-4.9 5.8-8 10.66-7s7.98 5.8 6.96 10.7l-23.5 112c4.79 7.2 16.4 1.2 21.3-1.2l38.12-106.5c10.8-9.4 21.2-19 28.7-29.2 6.6-9.1 10.4-18.4 10.6-23.5.2-5 4.4-8.9 9.4-8.7 5 .2 9 4.6 8.6 9.6-.6 11.2-6.2 22.4-14 33.2-7.3 10-16.7 19.6-27.2 27.2l-3.3 8.9c6.9 8.7 13.4 13.8 19.6 16.8 8.8 4.1 17.7 4.6 28.5 3.3 16.4-1.9 34.6-12.9 43.5-37.2 2.8-7.7 13.6-8 16.8-.5 7.7 21.2 36.1 32.6 55.1 24l-3.9-23.3c-.8-4.9 2.5-9.6 7.4-10.4 4.9-.9 9.6 2.5 10.4 7.4l17.6 105.9c9.2 6.3 14.5 2.4 19.9-4.4l-13.8-114.4c-.7-5.3 3.3-10 8.6-10.2 4.8-.2 8.8 3.3 9.3 8l4.3 35.7c5.1-1.2 9.1-2.5 12.4-5 4.3-3.2 8.5-8.7 12.1-21.5 1.7-6 9-8.5 14.1-4.7 13.6 8.3 27.4-1.8 35.6-12.2 12.9-16.5 14.7-42.4 13.2-69.2-2.1.3-4.2.5-6.3.6-8.8.5-17.9-.9-25.7-4.4-12.4-7-22-18.4-28.2-28.9-3.9-6.8-7.3-13.7-10.5-20-5.4 9.9-11 23.1-19.2 25-12.5 2.1-23.9-3.7-29.8-12.7-5.9-8.9-7.4-20.2-4.8-31.1 2.7-11.7 9.8-38.3 22.6-56.1 2.2-2.9 4.5-5.3 6.8-7.4-7.5-3.1-16.2-3.8-22.9-3.8-5.8 0-13.5 1.8-19.7 5-6.2 3.3-10.7 7.8-12.2 11.8-3.2 8.5-15.5 7.5-17.3-1.3-3.8-22.78-53.9-17.8-65.6 2-3.8 7-14.1 5.9-16.5-1.7-8.1-22.61-62.7-21.3-66.7 5.9zm345-1.5c1.7 16.4 3.5 32.2 4.2 45.6 1.8 6.5 6 18.9 8.7 7.3.9-4.1.8-11-.4-18.6-.1-7.1-14.5-47.3-12.5-34.3zm-112.7-2.5c-11.9 15-19.2 37.4-23.3 53.7-.6 5.8-.6 12.6 2.3 17.1 2.3 3.4 4.8 5.2 9.4 5 5.8-9.4 12.1-19.8 15.6-28.2-1.2-7.9-2.8-19.9-3.6-31.4-.4-5.8-.6-11.2-.4-16.2zm94.4 2.4c-2.4 1.6-4.8 3.1-7.5 4.1-7.8 3.2-16.8 4.4-26 4.5-14.8.1-30.2-2.7-42.9-8.4 0 3.6.1 7.7.4 12.3.9 12.6 3 27.2 4 33.5 10.5 16.6 19.9 44.4 36.8 52.5 5.8 2 11.9 3.1 17.2 2.9 6-.4 10.6-2.6 11.5-3.7 3.5-8 5.9-15.2 7.3-22.3 2.1-10.9 3.4-23.3 3.6-31.6.3-6.4-.6-13.3-1.1-18.7-1.4 4.1-5.7 6.6-10 5.9-4.3-.7-7.5-4.4-7.5-8.8 0-5.1 4.2-9.2 9.3-9 3 0 5.8 1.7 7.4 4.3-.9-6.1-1.4-12-2.5-17.5zm-58.3 16.5c4.9.2 8.7 4.2 8.7 9 0 5-4 9-9 9-4.9 0-9-4-9-9s4.2-9.1 9.3-9zm47.5 48.3c3.7-.1 6.5 1.9 6.5 6.2 0 7.8-5.8 15-12.7 19l-1-23.1c2.5-1.4 5-2.1 7.2-2.1zm-24.1 2c1.8-.1 3.9.4 5.8 1.3l3.8 22.5c-6-3.7-15.4-3.6-16.5-16.1-.5-5.2 2.8-7.7 6.9-7.7zm-30.9 164.2c-3.7 5.1-7.6 9.1-12.6 12.1l16.6 62c7.6 1.5 15.9 1 19.2-5.1zm-241.2 33.7l1.5 46.8c7.9 7.9 12.9 4.8 19.7-3l-3.7-39.5c-6.3-.9-12.6-2.2-17.5-4.3z';

// dalahästens path (viewBox 0 0 2048 2048)
const DALA_PATH = new Path2D(
  'M434.324 292.439c-12.927 4.043-21.867 15.425-25.965 33.061-2.339 10.064-2.328 36.386.03 79.297 2.041 37.123 2.072 52.313.121 58.771-.82 2.713-3.425 7.497-5.79 10.631-4.521 5.993-5.371 6.946-26.176 29.345A52231 52231 0 0 0 341 541.874c-54.366 58.684-68.653 73.937-88.942 94.96-11.854 12.284-23.99 25.559-26.969 29.5-11.619 15.377-18.811 35.86-19.792 56.375-1.311 27.399 3.592 40.298 33.563 88.291 19.424 31.103 27.358 41.265 38.895 49.818 15.065 11.169 28.888 16.049 47.862 16.899 19.562.876 28.545-1.76 71.383-20.947a24829 24829 0 0 1 42-18.764c9.625-4.284 20.989-9.413 25.254-11.398S472.18 823 472.391 823c.21 0 4.661-2.013 9.89-4.473 14.504-6.823 19.52-8.585 26.143-9.183 11.542-1.042 21.213 4.322 38.147 21.156 14.077 13.995 22.411 25.861 31.299 44.566 18.547 39.033 30.264 98.447 34.103 172.934 1.507 29.255 4.174 171.392 8.517 454 4.132 268.813 4.251 272.659 9.06 291.739 6.232 24.724 21.931 40.342 45.073 44.84 11.377 2.211 68.79 2.234 79.022.031 15.245-3.282 23.887-8.067 33.687-18.651 10.906-11.78 15.078-22.225 18.158-45.459 1.944-14.661 15.706-95.073 22.592-132 2.769-14.85 7.038-38.025 9.486-51.5 5.427-29.872 18.962-97.95 24.354-122.5 13.307-60.588 21.738-92.525 26.794-101.5 8.004-14.205 27.334-26.196 42.175-26.161 3.996.009 13.727 1.599 24.609 4.02 56.392 12.545 113.442 20.524 172.5 24.125 21.217 1.294 77.277 1.289 96-.009 61.588-4.269 102.377-11.329 183-31.675 58.596-14.787 63.471-15.179 80.5-6.48 9.117 4.658 23.167 18.484 30.96 30.467 15.275 23.489 31.412 66.28 48.954 129.821 6.206 22.479 27.292 108.104 33.464 135.892 30.318 136.499 39.733 172.9 48.047 185.762 3.976 6.153 11.498 12.908 18.006 16.172 16.349 8.199 46.908 12.749 78.569 11.7 38.308-1.271 52.476-6.246 62.662-22.006 10.791-16.696 12.947-39.113 15.937-165.74 1.345-56.93.642-317.356-.998-369.888-2.9-92.92-4.521-129.415-7.637-172-6.08-83.084-18.448-136.491-43.421-187.5-24.87-50.801-61.601-90.151-106.364-113.952-11.257-5.986-33.684-14.752-48.679-19.028-16.424-4.683-28.278-7.059-47.064-9.432-31.077-3.926-45.035-4.588-96.436-4.577-53.28.011-64.727.56-135.5 6.498-70.248 5.895-87.899 7.085-113.5 7.654-37.333.829-59.521-1.551-82.5-8.848-24.862-7.896-53.346-26.75-71.333-47.218-13.668-15.555-16.396-19.77-52.159-80.597-32.53-55.33-50.879-83.123-77.574-117.5-22.068-28.418-41.296-48.668-67.434-71.016-30.411-26.001-66.976-46.57-103.605-58.28-38.435-12.287-106.36-22.139-152.985-22.189-17.705-.018-25.408-1.723-40.224-8.9-14.867-7.203-32.676-19.603-62.686-43.647-18.287-14.651-41.811-31.191-50.5-35.507-11.561-5.742-20.728-7.163-29.176-4.522'
);
// Registret över path-siluetter. Bounding box mäts automatiskt (en gång).
const SVG_SYMBOLS = {
  dalahast: { path: DALA_PATH, viewBox: 2048, bounds: null },
  vallhund: { path: new Path2D(VALLHUND_D), viewBox: 512, bounds: null },
  far:      { path: new Path2D(FAR_D), viewBox: 512, bounds: null },
};

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

    case 'dalahast':
    case 'vallhund':
    case 'far': {
      const entry = SVG_SYMBOLS[id];
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
    case 'smahjartan': return 1.1;
    case 'dalahast': case 'vallhund': case 'far': {
      const b = getBounds(SVG_SYMBOLS[id]);
      return b.w / b.h;
    }
    default: return 1.0;
  }
}
