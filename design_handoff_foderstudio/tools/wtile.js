(async () => {
const have = new Set((await ls('wtex').catch(() => [])).map(f => f.replace('.png', '')));
const ids = (await ls('wsrc')).filter(f => f.endsWith('.png')).map(f => f.replace('.png', '')).filter(i => !have.has(i));
const t0 = Date.now(), meta = {};
for (const id of ids) {
  const img = await readImage('wsrc/' + id + '.png');
  const y0 = Math.round(img.height * 0.05), hc = img.height - 2 * y0;
  const TH = 192, Ls = Math.min(img.width * 0.7, hc * 5), TW = Math.round(Ls / hc * TH);
  const x0 = Math.round((img.width - Ls) / 2);
  const a = createCanvas(TW, TH), ax = a.getContext('2d'); ax.imageSmoothingQuality = 'high';
  ax.drawImage(img, x0, y0, Ls, hc, 0, 0, TW, TH);
  // jämna ut ljusvariation längs bandet (kolumnvis lågfrekvens)
  const A = ax.getImageData(0, 0, TW, TH), d = A.data, col = new Float32Array(TW);
  for (let x = 0; x < TW; x++) { let s = 0; for (let y = 0; y < TH; y++) { const i = (y * TW + x) * 4; s += d[i] + d[i + 1] + d[i + 2]; } col[x] = s / TH / 3 + 1; }
  const R = Math.round(TH * 0.6), sm = new Float32Array(TW);
  for (let x = 0; x < TW; x++) { let s = 0, n = 0; for (let k = -R; k <= R; k++) { const xx = x + k; if (xx < 0 || xx >= TW) continue; s += col[xx]; n++; } sm[x] = s / n; }
  let mean = 0; for (let x = 0; x < TW; x++) mean += sm[x]; mean /= TW;
  for (let x = 0; x < TW; x++) { const k = mean / sm[x]; for (let y = 0; y < TH; y++) { const i = (y * TW + x) * 4; d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k); } }
  ax.putImageData(A, 0, 0);
  // sömlös i x: förskjut halva och lägg en min-kostnadssöm i mitten
  const b = createCanvas(TW, TH), bx = b.getContext('2d'), h = Math.floor(TW / 2);
  bx.drawImage(a, h, 0); bx.drawImage(a, h - TW, 0);
  const Ad = ax.getImageData(0, 0, TW, TH).data, Bi = bx.getImageData(0, 0, TW, TH), B = Bi.data;
  const seam = (c0, W) => {
    const cost = new Float32Array(TH * W), from = new Int8Array(TH * W);
    const e = (y, j) => { const i = (y * TW + c0 + j) * 4; const r = Ad[i] - B[i], g = Ad[i + 1] - B[i + 1], bb = Ad[i + 2] - B[i + 2]; return r * r + g * g + bb * bb; };
    for (let j = 0; j < W; j++) cost[j] = e(0, j);
    for (let y = 1; y < TH; y++) for (let j = 0; j < W; j++) {
      let best = cost[(y - 1) * W + j], bf = 0;
      if (j > 0 && cost[(y - 1) * W + j - 1] < best) { best = cost[(y - 1) * W + j - 1]; bf = -1; }
      if (j < W - 1 && cost[(y - 1) * W + j + 1] < best) { best = cost[(y - 1) * W + j + 1]; bf = 1; }
      cost[y * W + j] = best + e(y, j); from[y * W + j] = bf;
    }
    let j = 0; for (let k = 1; k < W; k++) if (cost[(TH - 1) * W + k] < cost[(TH - 1) * W + j]) j = k;
    const p = new Int32Array(TH);
    for (let y = TH - 1; y >= 0; y--) { p[y] = c0 + j; j += from[y * W + j]; }
    return p;
  };
  const w = Math.round(TW * 0.18), ov = Math.round(TW * 0.12);
  const L = seam(h - w, ov), Rr = seam(h + w - ov, ov);
  for (let y = 0; y < TH; y++) for (let x = h - w; x < h + w; x++) {
    const i = (y * TW + x) * 4;
    const m = Math.min(Math.max(0, Math.min(1, (x - L[y] + 1.5) / 3)), Math.max(0, Math.min(1, (Rr[y] - x + 1.5) / 3)));
    for (let k = 0; k < 3; k++) B[i + k] = B[i + k] * (1 - m) + Ad[i + k] * m;
  }
  bx.putImageData(Bi, 0, 0);
  await saveFile('wtex/' + id + '.png', b);
  meta[id] = TW / TH;
  if (Date.now() - t0 > 22000) break;
}
log(JSON.stringify(meta));
})()
