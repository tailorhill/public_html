(async () => {
const have = new Set((await ls('textures')).map(f => f.replace('.png', '')));
const ids = (await ls('src')).filter(f => f.endsWith('.png')).map(f => f.replace('.png', '')).filter(i => !have.has(i));
const patterns = new Set(['bb-blommig','bb-citron','bb-gultaggig','bb-korsbarsblom','bb-randig','bb-rose','bb-solfjaderbla','bb-taggigbla']);
function seam(E, N, len, c0, c1, vertical) {
  const W = c1 - c0, cost = new Float32Array(len*W), from = new Int8Array(len*W);
  const e = (i, j) => vertical ? E[i*N + c0 + j] : E[(c0 + j)*N + i];
  for (let j = 0; j < W; j++) cost[j] = e(0, j);
  for (let i = 1; i < len; i++) for (let j = 0; j < W; j++) {
    let best = cost[(i-1)*W + j], bf = 0;
    if (j > 0 && cost[(i-1)*W + j-1] < best) { best = cost[(i-1)*W + j-1]; bf = -1; }
    if (j < W-1 && cost[(i-1)*W + j+1] < best) { best = cost[(i-1)*W + j+1]; bf = 1; }
    cost[i*W + j] = best + e(i, j); from[i*W + j] = bf;
  }
  let j = 0; for (let k = 1; k < W; k++) if (cost[(len-1)*W + k] < cost[(len-1)*W + j]) j = k;
  const path = new Int32Array(len);
  for (let i = len-1; i >= 0; i--) { path[i] = c0 + j; j += from[i*W + j]; }
  return path;
}
const t0 = Date.now(); const done = [];
for (const id of ids) {
  const pat = patterns.has(id), N = pat ? 768 : 512, hN = N / 2;
  const img = await readImage('src/' + id + '.png');
  const s = Math.min(img.width, img.height), ins = Math.round(s * 0.02);
  const a = createCanvas(N, N), ax = a.getContext('2d'); ax.imageSmoothingQuality = 'high';
  ax.drawImage(img, ins, ins, s - 2*ins, s - 2*ins, 0, 0, N, N);
  if (!pat) {
    const sm = createCanvas(12, 12), sx = sm.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(a, 0, 0, 12, 12);
    const bl = createCanvas(N, N), bx = bl.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(sm, 0, 0, N, N);
    const A = ax.getImageData(0, 0, N, N), B = bx.getImageData(0, 0, N, N).data, d = A.data;
    let mr = 0, mg = 0, mb = 0; for (let i = 0; i < N*N; i++) { mr += d[i*4]; mg += d[i*4+1]; mb += d[i*4+2]; }
    mr /= N*N; mg /= N*N; mb /= N*N; const ml = (mr + mg + mb) / 3 + 1;
    for (let i = 0; i < N*N; i++) {
      const bl2 = (B[i*4] + B[i*4+1] + B[i*4+2]) / 3 + 1, k = 0.85 * (ml / bl2) + 0.15;
      d[i*4] = Math.min(255, d[i*4] * k); d[i*4+1] = Math.min(255, d[i*4+1] * k); d[i*4+2] = Math.min(255, d[i*4+2] * k);
    }
    ax.putImageData(A, 0, 0);
  }
  const b = createCanvas(N, N), bx = b.getContext('2d');
  for (const [dx, dy] of [[0,0],[-N,0],[0,-N],[-N,-N]]) bx.drawImage(a, hN + dx, hN + dy);
  const A = ax.getImageData(0,0,N,N).data, Bi = bx.getImageData(0,0,N,N), B = Bi.data;
  const E = new Float32Array(N*N);
  for (let i = 0; i < N*N; i++) { const dr=A[i*4]-B[i*4], dg=A[i*4+1]-B[i*4+1], db=A[i*4+2]-B[i*4+2]; E[i] = dr*dr+dg*dg+db*db; }
  const w = Math.round(N*0.16), ov = Math.round(N*0.1);
  const vl = seam(E, N, N, hN - w, hN - w + ov, true), vr = seam(E, N, N, hN + w - ov, hN + w, true);
  const ht = seam(E, N, N, hN - w, hN - w + ov, false), hb = seam(E, N, N, hN + w - ov, hN + w, false);
  const useA = new Uint8Array(N*N);
  for (let y = 0; y < N; y++) for (let x = vl[y]; x <= vr[y]; x++) useA[y*N+x] = 1;
  for (let x = 0; x < N; x++) for (let y = ht[x]; y <= hb[x]; y++) useA[y*N+x] = 1;
  const fe = pat ? 1 : 6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s2 = 0, n = 0;
    for (let dy = -fe; dy <= fe; dy += fe) for (let dx = -fe; dx <= fe; dx += fe) { const xx = x+dx, yy = y+dy; if (xx<0||yy<0||xx>=N||yy>=N) continue; s2 += useA[yy*N+xx]; n++; }
    const m = s2 / n, i = y*N+x;
    if (m > 0) for (let k = 0; k < 3; k++) B[i*4+k] = B[i*4+k]*(1-m) + A[i*4+k]*m;
  }
  bx.putImageData(Bi, 0, 0);
  await saveFile('textures/' + id + '.png', b);
  done.push(id);
  if (Date.now() - t0 > 22000) break;
}
log('done', done.length, 'left', ids.length - done.length);
})()
