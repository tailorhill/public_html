// Fotorealistiska foder för Valley Dogs-verktyget.
// Bygger PBR-kartor (färg, normal, grovhet/metall) per fodermaterial och
// ersätter bomullshalsbandets foder med riktiga lager: fodret i full bredd,
// bomullsbandet som eget upphöjt band ovanpå, sömmar och vinyltext i relief.
import * as THREE from '../vendor/three.module.js';
import { CollarViewer } from './collar3d.js';

export const TILE_CM = 4;

// Riktiga tygfoton från Valley Dogs (sömlöst beskurna). cm = fysisk bredd på en ruta.
export const PHOTO_LININGS = {
  'bb-blommig': { src: 'textures/bb-blommig.png', cm: 8 },
  'bb-citron': { src: 'textures/bb-citron.png', cm: 8 },
  'bb-gultaggig': { src: 'textures/bb-gultaggig.png', cm: 7 },
  'bb-korsbarsblom': { src: 'textures/bb-korsbarsblom.png', cm: 8 },
  'bb-randig': { src: 'textures/bb-randig.png', cm: 8 },
  'bb-rose': { src: 'textures/bb-rose.png', cm: 10 },
  'bb-solfjaderbla': { src: 'textures/bb-solfjaderbla.png', cm: 5 },
  'bb-taggigbla': { src: 'textures/bb-taggigbla.png', cm: 7 },
  'lader-babyrosa': { src: 'textures/lader-babyrosa.png', cm: 5 },
  'lader-brun': { src: 'textures/lader-brun.png', cm: 5 },
  'lader-brunflammig': { src: 'textures/lader-brunflammig.png', cm: 5 },
  'lader-cerise': { src: 'textures/lader-cerise.png', cm: 5 },
  'lader-kramvit': { src: 'textures/lader-kramvit.png', cm: 5 },
  'lader-lila': { src: 'textures/lader-lila.png', cm: 5 },
  'lader-ljusrosa': { src: 'textures/lader-ljusrosa.png', cm: 5 },
  'lader-oldred': { src: 'textures/lader-oldred.png', cm: 5 },
  'lader-svart': { src: 'textures/lader-svart.png', cm: 5 },
  'lader-sverigebla': { src: 'textures/lader-sverigebla.png', cm: 5 },
  'lader-turkos': { src: 'textures/lader-turkos.png', cm: 5 },
  'lader-vit': { src: 'textures/lader-vit.png', cm: 5 },
  'met-bla': { src: 'textures/met-bla.png', cm: 5 },
  'met-gron': { src: 'textures/met-gron.png', cm: 5 },
  'met-guld': { src: 'textures/met-guld.png', cm: 5 },
  'met-rosa': { src: 'textures/met-rosa.png', cm: 5 },
  'met-silver': { src: 'textures/met-silver.png', cm: 5 },
  'ss-appelgron': { src: 'textures/ss-appelgron.png', cm: 4 },
  'ss-aqua': { src: 'textures/ss-aqua.png', cm: 4 },
  'ss-brun': { src: 'textures/ss-brun.png', cm: 4 },
  'ss-cerise': { src: 'textures/ss-cerise.png', cm: 4 },
  'ss-gra': { src: 'textures/ss-gra.png', cm: 4 },
  'ss-gul': { src: 'textures/ss-gul.png', cm: 4 },
  'ss-jeans': { src: 'textures/ss-jeans.png', cm: 4 },
  'ss-khaki': { src: 'textures/ss-khaki.png', cm: 4 },
  'ss-leopard': { src: 'textures/ss-leopard.png', cm: 7 },
  'ss-lila': { src: 'textures/ss-lila.png', cm: 4 },
  'ss-ljuslavendel': { src: 'textures/ss-ljuslavendel.png', cm: 4 },
  'ss-ljusrosa': { src: 'textures/ss-ljusrosa.png', cm: 4 },
  'ss-lov': { src: 'textures/ss-lov.png', cm: 8 },
  'ss-marinbla': { src: 'textures/ss-marinbla.png', cm: 4 },
  'ss-marinblablommor': { src: 'textures/ss-marinblablommor.png', cm: 6 },
  'ss-neongron': { src: 'textures/ss-neongron.png', cm: 4 },
  'ss-neonorange': { src: 'textures/ss-neonorange.png', cm: 4 },
  'ss-oliv': { src: 'textures/ss-oliv.png', cm: 4 },
  'ss-pastellgron': { src: 'textures/ss-pastellgron.png', cm: 4 },
  'ss-petrol': { src: 'textures/ss-petrol.png', cm: 4 },
  'ss-rod': { src: 'textures/ss-rod.png', cm: 4 },
  'ss-rosaleopard': { src: 'textures/ss-rosaleopard.png', cm: 7 },
  'ss-skogsgron': { src: 'textures/ss-skogsgron.png', cm: 4 },
  'ss-storablommor': { src: 'textures/ss-storablommor.png', cm: 9 },
  'ss-svart': { src: 'textures/ss-svart.png', cm: 4 },
  'ss-sverigebla': { src: 'textures/ss-sverigebla.png', cm: 4 },
  'ss-turkos': { src: 'textures/ss-turkos.png', cm: 4 },
  'ss-vinrod': { src: 'textures/ss-vinrod.png', cm: 4 },
};
const photoImgs = {};
// Bomullsbandsfoton (3 cm-band, sömlösa längs bandet; en ruta = 5 × bandbredden)
export const WEBBING_PHOTOS = ['aqua','brun','cerise','gra','grasgron','gron','gul','khaki','korall','lavendel','lila','ljusbla','ljusrosa','marinbla','neongron','offwhite','oliv','orange','rod','skogsgron','svart','sverigebla','turkos','vinrod','vit'];
export const webbingImgs = {};
export const WEAVE_SCALE = 0.55; // maskstorlek relativt bandbredd
function loadWebbingPhotos(base) {
  return Promise.all(WEBBING_PHOTOS.map(id => new Promise(res => {
    const im = new Image();
    im.onload = () => { webbingImgs[id] = im; res(); };
    im.onerror = () => res();
    im.src = new URL('wtex/' + id + '.png', base).href;
  })));
}
export function loadPhotoLinings(base = document.baseURI) {
  loadWebbingPhotos(base);
  return Promise.all([loadWebbingPhotos(base), ...Object.entries(PHOTO_LININGS).map(([id, p]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { photoImgs[id] = im; res(); };
    im.onerror = () => { console.warn('Kunde inte ladda', p.src); res(); };
    im.src = new URL(p.src, base).href;
  }))]);
}
export const photoTileCm = l => (l && photoImgs[l.id]) ? PHOTO_LININGS[l.id].cm : TILE_CM;

// ------------------------------------------------------------ brus
function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

function valueNoise(p, rand) {
  const g = new Float32Array(p * p); for (let i = 0; i < g.length; i++) g[i] = rand();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y); let fx = x - xi, fy = y - yi;
    const x0 = ((xi % p) + p) % p, y0 = ((yi % p) + p) % p, x1 = (x0 + 1) % p, y1 = (y0 + 1) % p;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = g[y0 * p + x0], b = g[y0 * p + x1], c = g[y1 * p + x0], d = g[y1 * p + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
// sömlös fbm över enhetskvadraten (u,v i [0,1))
function fbm(rand, cells, oct = 4) {
  const ns = []; for (let o = 0; o < oct; o++) ns.push(valueNoise(Math.max(1, cells << o), rand));
  return (u, v) => {
    let s = 0, a = 0.5, t = 0;
    for (let o = 0; o < oct; o++) { const c = Math.max(1, cells << o); s += a * ns[o](u * c, v * c); t += a; a *= 0.5; }
    return s / t;
  };
}
// sömlös worley: out[0]=F1, out[1]=F2 (i cellenheter)
function worley(cells, rand, jitter = 0.9) {
  const pts = new Float32Array(cells * cells * 2);
  for (let i = 0; i < cells * cells; i++) { pts[i * 2] = 0.5 + (rand() - 0.5) * jitter; pts[i * 2 + 1] = 0.5 + (rand() - 0.5) * jitter; }
  return (u, v, out) => {
    const x = u * cells, y = v * cells, xi = Math.floor(x), yi = Math.floor(y);
    let f1 = 9, f2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j;
      const k = ((((cy % cells) + cells) % cells) * cells + (((cx % cells) + cells) % cells)) * 2;
      const dx = cx + pts[k] - x, dy = cy + pts[k + 1] - y, d = dx * dx + dy * dy;
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    out[0] = Math.sqrt(f1); out[1] = Math.sqrt(f2);
  };
}

export function liningKind(l) {
  if (!l) return 'softshell';
  if (l.leather) return 'leather';
  if (l.metallic) return 'metallic';
  if (l.id.startsWith('bb-')) return 'coated';
  return 'softshell';
}

// Materialparametrar (fysikaliskt baserade) per fodertyp.
function kindProps(kind, lining) {
  const c = new THREE.Color(lining.hex);
  switch (kind) {
    case 'leather':  return { normal: 1.0, env: 0.8, clearcoat: 0.18, ccRough: 0.45, sheen: 0.15, sheenRough: 0.6, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.4) };
    case 'metallic': return { normal: 0.9, env: 1.25, clearcoat: 0.35, ccRough: 0.25 };
    case 'coated':   return { normal: 0.45, env: 0.7, clearcoat: 0.55, ccRough: 0.3 };
    default:         return { normal: 0.8, env: 0.35, sheen: 0.9, sheenRough: 0.45, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.35) };
  }
}

// ------------------------------------------------------ tryckta mönster
// Ritar sömlöst (varje element ritas även förskjutet ±N) på en N×N-ruta.
function paintPrint(ctx, lining, N, pxcm, rand) {
  const hex = lining.hex, c2 = lining.hex2 || '#ffffff';
  const C = h => new THREE.Color(h);
  const mix = (a, b, t) => C(a).lerp(C(b), t).getStyle();
  const wrap = fn => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { ctx.save(); ctx.translate(dx, dy); fn(); ctx.restore(); } };
  const jitterGrid = (cellCm, fn) => {
    const n = Math.max(1, Math.round(N / (cellCm * pxcm))), s = N / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i + 0.5 + (rand() - 0.5) * 0.8 + (j % 2) * 0.5) * s, y = (j + 0.5 + (rand() - 0.5) * 0.8) * s;
      fn(x, y, s);
    }
  };
  ctx.fillStyle = hex; ctx.fillRect(0, 0, N, N);
  const p = lining.pattern;

  if (p === 'stripes') {
    let n = Math.round(N / (0.32 * pxcm)); n = Math.max(4, n - (n % 4));
    const sw = N / n, cols = [c2, hex, mix(c2, '#fff', 0.45), mix(hex, '#000', 0.3)];
    for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % 4]; ctx.fillRect(i * sw, 0, sw + 0.5, N); }
    // tunna mellanlinjer
    ctx.fillStyle = mix(hex, '#fff', 0.6); ctx.globalAlpha = 0.5;
    for (let i = 0; i < n; i += 2) ctx.fillRect(i * sw - sw * 0.06, 0, sw * 0.12, N);
    ctx.globalAlpha = 1;
  } else if (p === 'zigzag') {
    const rows = Math.max(2, Math.round(N / (0.42 * pxcm))), sp = N / rows;
    const steps = Math.max(4, Math.round(N / (0.24 * pxcm))) & ~1, st = N / steps;
    ctx.strokeStyle = c2; ctx.lineWidth = sp * 0.26; ctx.lineJoin = 'miter';
    for (let r = -1; r <= rows; r++) {
      ctx.beginPath();
      for (let i = -1; i <= steps + 1; i++) {
        const y = r * sp + (i % 2 ? sp * 0.28 : -sp * 0.28);
        i === -1 ? ctx.moveTo(i * st, y) : ctx.lineTo(i * st, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = mix(c2, '#fff', 0.55); ctx.lineWidth = sp * 0.05;
    for (let r = -1; r <= rows; r++) {
      ctx.beginPath();
      for (let i = -1; i <= steps + 1; i++) {
        const y = r * sp + sp * 0.5 + (i % 2 ? sp * 0.2 : -sp * 0.2);
        i === -1 ? ctx.moveTo(i * st, y) : ctx.lineTo(i * st, y);
      }
      ctx.stroke();
    }
  } else if (p === 'fans') {
    const cols = Math.max(2, Math.round(N / (0.5 * pxcm))), fw = N / cols, rows = cols * 2, fh = N / rows;
    for (let r = rows; r >= -1; r--) for (let i = -1; i <= cols; i++) {
      const cx = (i + (r % 2 ? 0.5 : 0)) * fw, cy = r * fh, rad = fw * 0.5;
      ctx.fillStyle = r % 2 ? c2 : mix(c2, '#fff', 0.3);
      ctx.beginPath(); ctx.moveTo(cx - rad, cy); ctx.arc(cx, cy, rad, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = hex; ctx.lineWidth = Math.max(1, fw * 0.035);
      ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, 0); ctx.stroke();
      for (let k = 1; k < 7; k++) {
        const a = Math.PI + (k / 7) * Math.PI;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rad * 0.94, cy + Math.sin(a) * rad * 0.94); ctx.stroke();
      }
    }
  } else if (p === 'leopard') {
    const core = mix(hex, c2, 0.28);
    jitterGrid(1.05, (x, y, s) => {
      const r = s * (0.26 + rand() * 0.12), blobs = 4 + Math.floor(rand() * 3), a0 = rand() * 6.28;
      const shapes = [];
      for (let b = 0; b < blobs; b++) {
        if (rand() < 0.15) continue;
        const a = a0 + (b / blobs) * 6.28 + (rand() - 0.5) * 0.4;
        shapes.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85, r * (0.28 + rand() * 0.2), r * (0.16 + rand() * 0.1), a + 1.57]);
      }
      wrap(() => {
        ctx.fillStyle = core; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.65, a0, 0, 7); ctx.fill();
        ctx.fillStyle = c2;
        for (const [bx, by, rx, ry, ang] of shapes) { ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, ang, 0, 7); ctx.fill(); }
      });
    });
    jitterGrid(0.5, (x, y, s) => {
      if (rand() < 0.5) return;
      const r = s * (0.08 + rand() * 0.08);
      wrap(() => { ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, rand() * 3, 0, 7); ctx.fill(); });
    });
  } else if (p === 'dots') {
    // citroner med blad
    const leaf = '#4f8a3a';
    jitterGrid(0.7, (x, y, s) => {
      const a = rand() * 6.28, rx = s * 0.26, ry = s * 0.19;
      wrap(() => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = leaf;
        ctx.beginPath(); ctx.moveTo(rx * 0.6, -ry * 0.4); ctx.quadraticCurveTo(rx * 1.4, -ry * 1.8, rx * 2.0, -ry * 0.9); ctx.quadraticCurveTo(rx * 1.3, -ry * 0.1, rx * 0.6, -ry * 0.4); ctx.fill();
        ctx.fillStyle = c2;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(rx * 0.95, 0, rx * 0.16, ry * 0.2, 0, 0, 7); ctx.fill();
        ctx.fillStyle = mix(c2, '#fff', 0.55); ctx.beginPath(); ctx.ellipse(-rx * 0.3, -ry * 0.35, rx * 0.35, ry * 0.18, -0.3, 0, 7); ctx.fill();
        ctx.fillStyle = mix(c2, '#8a5a00', 0.25); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(rx * 0.2, ry * 0.45, rx * 0.6, ry * 0.2, 0.1, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore();
      });
    });
  } else if (lining.id === 'ss-lov') {
    const tones = [c2, mix(c2, '#f2c14e', 0.45), mix(c2, '#8a2a1a', 0.35), mix(c2, '#fff', 0.25)];
    jitterGrid(0.55, (x, y, s) => {
      const a = rand() * 6.28, L = s * (0.45 + rand() * 0.25), Wd = L * 0.42, col = tones[Math.floor(rand() * tones.length)];
      wrap(() => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -Wd, L / 2, 0); ctx.quadraticCurveTo(0, Wd, -L / 2, 0); ctx.fill();
        ctx.strokeStyle = mix(col, '#000', 0.35); ctx.lineWidth = Math.max(1, L * 0.035);
        ctx.beginPath(); ctx.moveTo(-L * 0.62, 0); ctx.lineTo(L * 0.45, 0); ctx.stroke();
        for (const t of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.moveTo(L * t, 0); ctx.lineTo(L * (t + 0.12), -Wd * 0.45); ctx.moveTo(L * t, 0); ctx.lineTo(L * (t + 0.12), Wd * 0.45); ctx.stroke(); }
        ctx.restore();
      });
    });
  } else {
    // blommor (körsbärsblom, blommig, rosé, marinblå/stora blommor)
    const big = lining.id === 'ss-storablommor' ? 2.1 : lining.id === 'bb-blommig' ? 0.8 : 1;
    const leafCol = lining.id === 'bb-korsbarsblom' ? mix(hex, '#2f5a1c', 0.45) : mix(hex, c2, 0.35);
    jitterGrid(0.62 * big, (x, y, s) => {
      const r = s * (0.28 + rand() * 0.1), a0 = rand() * 6.28, petals = 5;
      const tint = mix(c2, '#ffffff', rand() * 0.3), centre = mix(c2, '#f6e27a', 0.6), la = a0 + rand() * 3;
      wrap(() => {
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = leafCol;
        for (const d of [0, 2.4]) {
          ctx.save(); ctx.rotate(la + d);
          ctx.beginPath(); ctx.moveTo(r * 0.6, 0); ctx.quadraticCurveTo(r * 1.3, -r * 0.45, r * 1.9, 0); ctx.quadraticCurveTo(r * 1.3, r * 0.45, r * 0.6, 0); ctx.fill();
          ctx.restore();
        }
        for (let k = 0; k < petals; k++) {
          ctx.save(); ctx.rotate(a0 + (k / petals) * 6.283);
          ctx.fillStyle = tint;
          ctx.beginPath(); ctx.ellipse(r * 0.52, 0, r * 0.52, r * 0.36, 0, 0, 7); ctx.fill();
          ctx.fillStyle = mix(c2, '#000', 0.18); ctx.globalAlpha = 0.35;
          ctx.fillRect(r * 0.12, -r * 0.02, r * 0.6, r * 0.04); ctx.globalAlpha = 1;
          ctx.restore();
        }
        ctx.fillStyle = centre; ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, 7); ctx.fill();
        ctx.restore();
      });
    });
    jitterGrid(0.3 * big, (x, y, s) => {
      if (rand() < 0.55) return;
      const r = s * 0.07;
      wrap(() => { ctx.fillStyle = mix(c2, '#fff', 0.4); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    });
  }
}

// ------------------------------------------------------ PBR-kartor
// Returnerar { albedo, normal, orm, props } som canvasar (N×N, sömlösa).
export function buildLiningMaps(lining, N = 1024, tileCm = TILE_CM) {
  const kind = liningKind(lining);
  const rand = rng(hashStr(lining.id));
  const pxcm = N / tileCm;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const albedo = mk(), normal = mk(), orm = mk();
  const actx = albedo.getContext('2d');
  const photo = photoImgs[lining.id];
  if (photo) {
    const s = PHOTO_LININGS[lining.id].cm * pxcm;
    for (let yy = 0; yy < N; yy += s) for (let xx = 0; xx < N; xx += s) actx.drawImage(photo, xx, yy, s, s);
  } else if (lining.pattern) paintPrint(actx, lining, N, pxcm, rand);
  else { actx.fillStyle = lining.hex; actx.fillRect(0, 0, N, N); }

  const A = actx.getImageData(0, 0, N, N), a = A.data;
  const H = new Float32Array(N * N);
  const Rg = new Float32Array(N * N);
  const cnt = mm => Math.max(2, Math.round(tileCm * 10 / mm));
  const low = fbm(rand, 3, 4), mid = fbm(rand, cnt(2.2), 3), hi = fbm(rand, cnt(0.35), 2);
  const W2 = [0, 0], W3 = [0, 0];
  let metal = 0;

  if (kind === 'leather') {
    const flam = lining.id === 'lader-brunflammig';
    const grain = worley(cnt(0.9), rand, 0.95), fine = worley(cnt(0.32), rand, 0.9);
    const mott = fbm(rand, flam ? 2 : 4, 5);
    // fotots egen narv som höjd (högpass på luminans)
    let pl = null;
    if (photo) {
      const sw = Math.max(8, Math.round(N / 20));
      const sc = document.createElement('canvas'); sc.width = sc.height = sw;
      const sctx = sc.getContext('2d'); sctx.imageSmoothingQuality = 'high'; sctx.drawImage(albedo, 0, 0, sw, sw);
      const bc = mk(), bctx = bc.getContext('2d'); bctx.imageSmoothingQuality = 'high'; bctx.drawImage(sc, 0, 0, N, N);
      const bd = bctx.getImageData(0, 0, N, N).data;
      pl = new Float32Array(N * N);
      // dämpa fläckighet: dra färgen mot medelvärdet men behåll fin narv
      if (!flam) {
        let mr = 0, mg = 0, mb = 0; for (let i = 0; i < N * N; i++) { mr += a[i * 4]; mg += a[i * 4 + 1]; mb += a[i * 4 + 2]; }
        mr /= N * N; mg /= N * N; mb /= N * N;
        for (let i = 0; i < N * N; i++) {
          const fr = a[i * 4] - bd[i * 4], fg = a[i * 4 + 1] - bd[i * 4 + 1], fb = a[i * 4 + 2] - bd[i * 4 + 2];
          a[i * 4] = mr + (bd[i * 4] - mr) * 0.35 + fr * 0.9;
          a[i * 4 + 1] = mg + (bd[i * 4 + 1] - mg) * 0.35 + fg * 0.9;
          a[i * 4 + 2] = mb + (bd[i * 4 + 2] - mb) * 0.35 + fb * 0.9;
        }
      }
      for (let i = 0; i < N * N; i++) {
        const l = a[i * 4] * 0.3 + a[i * 4 + 1] * 0.59 + a[i * 4 + 2] * 0.11;
        const lb = bd[i * 4] * 0.3 + bd[i * 4 + 1] * 0.59 + bd[i * 4 + 2] * 0.11 + 10;
        pl[i] = Math.max(-1, Math.min(1, (l - lb) / lb * 3));
      }
    }
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++) {
      const u = x / N, v = y / N;
      grain(u, v, W2); fine(u, v, W3);
      const peb = smooth(0.0, 0.32, W2[1] - W2[0]);
      const fp = smooth(0.0, 0.3, W3[1] - W3[0]);
      const lo = low(u, v), mo = mott(u, v);
      if (pl) {
        H[i] = 0.32 * (0.5 + 0.5 * pl[i]) + 0.12 * peb + 0.06 * fp + 0.25 * lo;
        Rg[i] = 0.46 + 0.12 * (1 - peb) - 0.08 * pl[i];
      } else {
        H[i] = 0.45 * peb + 0.14 * fp + 0.9 * lo + 0.04 * hi(u, v);
        Rg[i] = 0.4 + 0.22 * (1 - peb) + 0.1 * (0.5 - lo);
      }
      const m = pl ? (flam ? 1 : 0.97 + 0.03 * peb) : (0.88 + 0.12 * peb) * (1 + (mo - 0.5) * (flam ? 0.9 : 0.16));
      const warm = flam ? (mo - 0.5) * 0.25 : 0;
      a[i * 4] = Math.min(255, a[i * 4] * m * (1 + warm));
      a[i * 4 + 1] = Math.min(255, a[i * 4 + 1] * m);
      a[i * 4 + 2] = Math.min(255, a[i * 4 + 2] * m * (1 - warm));
    }
  } else if (kind === 'metallic') {
    metal = 0.85;
    const crin = fbm(rand, 5, 5), crin2 = fbm(rand, 11, 3), grain = worley(cnt(0.45), rand, 0.9);
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++) {
      const u = x / N, v = y / N;
      const r1 = 1 - Math.abs(2 * crin(u, v) - 1), r2 = 1 - Math.abs(2 * crin2(u, v) - 1);
      grain(u, v, W2);
      const g = smooth(0, 0.3, W2[1] - W2[0]);
      const r = r1 * r1 * 0.7 + r2 * 0.3;
      H[i] = 0.55 * r + 0.12 * g;
      Rg[i] = 0.16 + 0.2 * (1 - r) + 0.06 * (1 - g);
      const m = 1.02 + 0.18 * r + 0.04 * g;
      a[i * 4] = Math.min(255, a[i * 4] * m); a[i * 4 + 1] = Math.min(255, a[i * 4 + 1] * m); a[i * 4 + 2] = Math.min(255, a[i * 4 + 2] * m);
    }
  } else {
    // textil: tät tvåskaftsväv (softshell) eller grövre, belagd bomull
    const coated = kind === 'coated';
    const n = cnt(coated ? 0.5 : 0.32);
    const heather = fbm(rand, cnt(1.2), 3);
    for (let y = 0, i = 0; y < N; y++) for (let x = 0; x < N; x++, i++) {
      const u = x / N, v = y / N;
      const fu = u * n, fv = v * n, cu = Math.floor(fu), cv = Math.floor(fv);
      const pu = Math.sin(Math.PI * (fu - cu)), pv = Math.sin(Math.PI * (fv - cv));
      const over = (cu + cv) & 1;
      const w = over ? 0.55 + 0.45 * pv * (0.7 + 0.3 * pu) : 0.55 + 0.45 * pu * (0.7 + 0.3 * pv);
      const fz = hi(u, v);
      if (coated) {
        H[i] = 0.35 * w + 0.35 * mid(u, v) + 0.6 * low(u, v);
        Rg[i] = 0.3 + 0.12 * (1 - w) + 0.08 * fz;
      } else {
        H[i] = 0.75 * w + 0.35 * fz + 0.3 * low(u, v);
        Rg[i] = 0.78 + 0.12 * fz;
      }
      const m = 1 + (heather(u, v) - 0.5) * (coated ? 0.05 : 0.09) + (w - 0.75) * (coated ? 0.05 : 0.12);
      a[i * 4] = Math.min(255, a[i * 4] * m); a[i * 4 + 1] = Math.min(255, a[i * 4 + 1] * m); a[i * 4 + 2] = Math.min(255, a[i * 4 + 2] * m);
    }
  }
  actx.putImageData(A, 0, 0);

  // höjd -> normal (OpenGL-konvention), grovhet i G, metall i B
  const strength = { leather: 2.6, metallic: 4, coated: 2.5, softshell: 3 }[kind] * (N / 1024) ** -0.2;
  const nctx = normal.getContext('2d'), octx = orm.getContext('2d');
  const NI = nctx.createImageData(N, N), OI = octx.createImageData(N, N);
  const nd = NI.data, od = OI.data;
  for (let y = 0, i = 0; y < N; y++) {
    const yu = ((y - 1 + N) % N) * N, yd = ((y + 1) % N) * N;
    for (let x = 0; x < N; x++, i++) {
      const xl = (x - 1 + N) % N, xr = (x + 1) % N;
      const dx = (H[y * N + xr] - H[y * N + xl]) * strength;
      const dy = (H[yd + x] - H[yu + x]) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      nd[i * 4] = (-dx * inv * 0.5 + 0.5) * 255;
      nd[i * 4 + 1] = (dy * inv * 0.5 + 0.5) * 255;
      nd[i * 4 + 2] = (inv * 0.5 + 0.5) * 255;
      nd[i * 4 + 3] = 255;
      od[i * 4] = 255; od[i * 4 + 1] = clamp01(Rg[i]) * 255; od[i * 4 + 2] = metal * 255; od[i * 4 + 3] = 255;
    }
  }
  nctx.putImageData(NI, 0, 0); octx.putImageData(OI, 0, 0);
  return { albedo, normal, orm, kind, props: kindProps(kind, lining), metal };
}

// Liten, belyst provbit (dataURL) för väljaren.
export function liningSwatch(lining, size = 96, tileCm = 1.6) {
  const m = buildLiningMaps(lining, size, tileCm);
  const g = (c) => c.getContext('2d').getImageData(0, 0, size, size).data;
  const A = g(m.albedo), Nn = g(m.normal), O = g(m.orm);
  const out = document.createElement('canvas'); out.width = out.height = size;
  const octx = out.getContext('2d'), I = octx.createImageData(size, size), d = I.data;
  const L = [-0.45, 0.55, 0.7], ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
  const Hh = [L[0], L[1], L[2] + 1], hl = Math.hypot(...Hh); Hh[0] /= hl; Hh[1] /= hl; Hh[2] /= hl;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const nx = Nn[i] / 127.5 - 1, ny = Nn[i + 1] / 127.5 - 1, nz = Nn[i + 2] / 127.5 - 1;
    const r = O[i + 1] / 255, met = O[i + 2] / 255;
    const vign = 1 - 0.18 * ((x / size - 0.35) ** 2 + (y / size - 0.3) ** 2);
    const diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const spec = Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 4 + (1 - r) * 60) * (1 - r) * 0.9;
    for (let k = 0; k < 3; k++) {
      const alb = A[i + k] / 255;
      const base = alb * (0.35 + 0.8 * diff) * (1 - met * 0.5) + met * alb * 0.35;
      const s = spec * (met ? alb * 1.4 : 0.6);
      d[i + k] = clamp01((base + s) * vign) * 255;
    }
    d[i + 3] = 255;
  }
  octx.putImageData(I, 0, 0);
  return out.toDataURL('image/png');
}

// ------------------------------------------------------ viewer
export class RealisticCollarViewer extends CollarViewer {
  constructor(canvas) {
    super(canvas);
    this.realistic = true;
    this._mapCache = new Map();
    this.renderer.toneMappingExposure = 1.0;
    this.scene.traverse(o => {
      if (o.isDirectionalLight && o.castShadow) { o.shadow.bias = -0.0004; o.shadow.normalBias = 0.03; }
    });
    this.controls.minDistance = 7;
  }

  liningMaps(lining) {
    if (!this._mapCache.has(lining.id)) {
      const m = buildLiningMaps(lining, this.lite ? 512 : 1024, photoTileCm(lining));
      m.tileCm = photoTileCm(lining);
      const tex = (c, srgb) => {
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };
      m.tex = { albedo: tex(m.albedo, true), normal: tex(m.normal), orm: tex(m.orm) };
      this._mapCache.set(lining.id, m);
    }
    return this._mapCache.get(lining.id);
  }

  liningMaterial(lining, uCm, vCm, side = THREE.FrontSide, edge = false) {
    const m = this.liningMaps(lining), p = m.props;
    const repU = Math.max(1, Math.round(uCm / m.tileCm)), repV = vCm / m.tileCm;
    const cl = t => { const c = t.clone(); c.repeat.set(repU, repV); c.needsUpdate = true; return c; };
    const mat = new THREE.MeshPhysicalMaterial({
      map: cl(m.tex.albedo), normalMap: cl(m.tex.normal), roughnessMap: cl(m.tex.orm), metalnessMap: cl(m.tex.orm),
      normalScale: new THREE.Vector2(p.normal, p.normal),
      roughness: 1, metalness: m.metal ? 1 : 0,
      clearcoat: p.clearcoat || 0, clearcoatRoughness: p.ccRough || 0.3,
      sheen: p.sheen || 0, sheenRoughness: p.sheenRough || 0.5, sheenColor: p.sheenColor || new THREE.Color('#fff'),
      envMapIntensity: p.env, side,
    });
    // läderkanter är skurna/infärgade – något mörkare än narvsidan
    if (edge && m.kind === 'leather') mat.color.setScalar(0.72);
    return mat;
  }

  _drawWebPhoto(ctx, im, x, y, w, h) {
    const th = h * WEAVE_SCALE, n = Math.max(1, Math.round(w / (th * im.width / im.height))), tw = w / n;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    for (let r = 0; y + r * th < y + h; r++) {
      const off = (r % 2) * tw * 0.37;
      for (let k = -1; k < n; k++) ctx.drawImage(im, x + k * tw + off, y + r * th, tw + 0.5, th + 0.5);
    }
    ctx.restore();
  }

  paintWebbing(ctx, x, y, w, h, hex) {
    if (!this.realistic) return super.paintWebbing(ctx, x, y, w, h, hex);
    const im = webbingImgs[this._webId];
    if (im) { this._drawWebPhoto(ctx, im, x, y, w, h); return; }
    ctx.fillStyle = hex; ctx.fillRect(x, y, w, h);
    // garnfärgsvariation längs bandet (varp) + fin fibrering
    const col = new THREE.Color(hex);
    const rand = rng(hashStr(hex));
    const pitch = Math.max(2, h / 34);
    for (let yy = y; yy < y + h; yy += pitch) {
      const v = (rand() - 0.5) * 0.035;
      ctx.fillStyle = (v > 0 ? col.clone().lerp(new THREE.Color('#fff'), v) : col.clone().lerp(new THREE.Color('#000'), -v)).getStyle();
      ctx.fillRect(x, yy, w, pitch * 0.9);
    }
  }

  // Höjd/grovhet för bomullsbandet i bandtexturens upplösning (endast bandytan).
  webbingMaps(cfg, W, H, e) {
    const Hb = H - 2 * e, pxcm = W / cfg.circumference;
    const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
    const mctx = mask.getContext('2d');
    this.paintTextBlock(mctx, W, H, e, H - e, cfg);
    const md = mctx.getImageData(0, e, W, Hb).data;
    const hgt = new Float32Array(W * Hb);
    const im = webbingImgs[this._webId];
    let lum = null;
    if (im) {
      // höjd ur fotot: ljusare garn = högre (högpassat så att bara väven blir relief)
      const pc = document.createElement('canvas'); pc.width = W; pc.height = Hb;
      const pctx = pc.getContext('2d'); this._drawWebPhoto(pctx, im, 0, 0, W, Hb);
      const pd = pctx.getImageData(0, 0, W, Hb).data;
      const sc = document.createElement('canvas'), sw = Math.max(8, Math.round(W / 24)), sh = Math.max(2, Math.round(Hb / 24));
      sc.width = sw; sc.height = sh; const sctx = sc.getContext('2d'); sctx.imageSmoothingQuality = 'high'; sctx.drawImage(pc, 0, 0, sw, sh);
      const bc = document.createElement('canvas'); bc.width = W; bc.height = Hb; const bctx = bc.getContext('2d'); bctx.imageSmoothingQuality = 'high'; bctx.drawImage(sc, 0, 0, W, Hb);
      const bd = bctx.getImageData(0, 0, W, Hb).data;
      lum = new Float32Array(W * Hb);
      for (let i = 0; i < W * Hb; i++) {
        const l = pd[i * 4] * 0.3 + pd[i * 4 + 1] * 0.59 + pd[i * 4 + 2] * 0.11, lb = bd[i * 4] * 0.3 + bd[i * 4 + 1] * 0.59 + bd[i * 4 + 2] * 0.11 + 8;
        lum[i] = Math.max(-1, Math.min(1, (l - lb) / lb * 1.4));
      }
    }
    const rand = rng(7), fz = fbm(rand, 64, 2);
    const pitchY = pxcm * 0.085, pitchX = pxcm * 0.17;          // ~12 varptrådar/cm, kypert
    const stitchY = [H * 0.03, Hb - H * 0.03], lw = Math.max(1.5, H * 0.008) * 1.3;
    for (let y = 0; y < Hb; y++) {
      const rib = Math.pow(Math.abs(Math.sin(Math.PI * y / pitchY)), 0.7);
      const edgeT = Math.min(y, Hb - 1 - y) / (pxcm * 0.12);
      const selv = edgeT < 1 ? Math.sqrt(Math.max(0, 1 - (1 - edgeT) ** 2)) : 1;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const tw = 0.5 + 0.5 * Math.sin(2 * Math.PI * (x / pitchX + y / (pitchY * 2)));
        let h = (lum ? 0.5 + 0.5 * lum[i] : 0.4 * rib + 0.3 * tw * rib + 0.3 * fz(x / W, y / Hb)) * selv;
        for (const sy of stitchY) {
          const dy = Math.abs(y - sy);
          if (dy < lw) {
            const on = (x % 11) < 6; // samma streckning som färgtexturen [6,5]
            const prof = Math.sqrt(1 - (dy / lw) ** 2);
            h = on ? Math.max(h, 0.6 + 0.5 * prof) : h * 0.4;
          }
        }
        const t = md[i * 4 + 3] / 255;
        hgt[i] = h * (1 - t) + 1.5 * t;
      }
    }
    const nC = document.createElement('canvas'), rC = document.createElement('canvas');
    nC.width = rC.width = W; nC.height = rC.height = Hb;
    const nctx = nC.getContext('2d'), rctx = rC.getContext('2d');
    const NI = nctx.createImageData(W, Hb), RI = rctx.createImageData(W, Hb);
    const baseR = cfg.fullGlitter ? 0.5 : 0.9, s = 0.85;
    for (let y = 0, i = 0; y < Hb; y++) for (let x = 0; x < W; x++, i++) {
      const xl = y * W + (x - 1 + W) % W, xr = y * W + (x + 1) % W;
      const yu = Math.max(0, y - 1) * W + x, yd = Math.min(Hb - 1, y + 1) * W + x;
      const dx = (hgt[xr] - hgt[xl]) * s, dy = (hgt[yd] - hgt[yu]) * s;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      NI.data[i * 4] = (-dx * inv * 0.5 + 0.5) * 255;
      NI.data[i * 4 + 1] = (dy * inv * 0.5 + 0.5) * 255;
      NI.data[i * 4 + 2] = (inv * 0.5 + 0.5) * 255;
      NI.data[i * 4 + 3] = 255;
      const t = md[i * 4 + 3] / 255;
      RI.data[i * 4] = 255; RI.data[i * 4 + 1] = (baseR * (1 - t) + 0.32 * t) * 255; RI.data[i * 4 + 2] = 0; RI.data[i * 4 + 3] = 255;
    }
    nctx.putImageData(NI, 0, 0); rctx.putImageData(RI, 0, 0);
    const tex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); return t; };
    return { normal: tex(nC), rough: tex(rC) };
  }

  build(cfg) {
    // frigör även kartor som grundklassen inte känner till
    this.collarGroup.traverse(o => {
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        for (const k of ['normalMap', 'roughnessMap', 'metalnessMap']) if (m[k] && m[k] !== this._brush && !(m[k].userData && m[k].userData.keep)) m[k].dispose();
      }
    });
    this._bandW = cfg.bandWidthCm; this._bandColor = cfg.bandColor; this._webId = cfg.webbingId;
    this._bendR = cfg.circumference / (2 * Math.PI) + 0.1;
    const cotton = this.realistic && cfg.family === 'cotton' && cfg.lining;
    const halv = cotton && cfg.modelKind === 'halvstryp';
    super.build(halv ? { ...cfg, showHardware: false } : cfg);
    this._lastCfg = cfg;
    if (!cotton) return;

    const G = this.collarGroup;
    const R = cfg.circumference / (2 * Math.PI), width = cfg.width, th = 0.4, seg = 200;
    const [outer, inner, ringA, ringB] = G.children;
    const bandTex = outer.material.map;
    for (const o of [outer, inner, ringA, ringB]) {
      G.remove(o); o.geometry.dispose();
      if (o.material.map && o.material.map !== bandTex) o.material.map.dispose();
      o.material.dispose();
    }

    // vinkelkonvention som grundklassen: punkt = (sin a·r, y, cos a·r), a=0 framsida, a=π baksida
    const knappe = false; // alla halvstryp visas lika
    const justerbart = false;
    const offR = 0.62;                                            // O-ringarnas vinkel från baksidan
    const bw = cfg.bandWidthCm, ringR = bw / 2 + 0.45;
    const dRod = Math.sqrt(Math.max(0.1, ringR * ringR - (bw / 2 + 0.08) ** 2)); // stängernas avstånd från ringens mitt
    const buckleLen = width * 1.9;
    const buckleArc = knappe ? (buckleLen + 1.2) / R : 0;
    const halfSpan = halv ? Math.PI - offR - dRod / R - 0.5 / R - buckleArc : Math.PI;
    const arc = 2 * halfSpan, arcFrac = arc / (2 * Math.PI);

    const cyl = (r, h) => new THREE.CylinderGeometry(r, r, h, seg, 1, true, -halfSpan, arc);
    const torusArc = (r, tube) => {
      const g = new THREE.TorusGeometry(r, tube, 10, seg, arc);
      g.rotateX(Math.PI / 2); g.rotateY(arc / 2 - Math.PI / 2);
      return g;
    };
    const add = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; G.add(m); return m; };

    // fodret: utsida, insida, kanter
    add(new THREE.Mesh(cyl(R, width), this.liningMaterial(cfg.lining, R * arc, width, THREE.FrontSide)));
    add(new THREE.Mesh(cyl(R - th, width), this.liningMaterial(cfg.lining, (R - th) * arc, width, THREE.BackSide)));
    const edgeMat = this.liningMaterial(cfg.lining, R * arc, Math.PI * th, THREE.FrontSide, true);
    for (const s of [1, -1]) { const m = add(new THREE.Mesh(torusArc(R - th / 2, th / 2), edgeMat)); m.position.y = s * width / 2; }
    if (halv) {
      for (const s of [1, -1]) {
        const a = s * halfSpan;
        const cap = add(new THREE.Mesh(new THREE.CapsuleGeometry(th / 2, width, 6, 14), edgeMat));
        cap.position.set(Math.sin(a) * (R - th / 2), 0, Math.cos(a) * (R - th / 2));
      }
    }

    // bomullsbandet som eget lager ovanpå fodret
    const edgeFrac = Math.max(0.09, (cfg.width - cfg.bandWidthCm) / 2 / cfg.width);
    const W = this.texCanvas.width, H = this.texCanvas.height, e = Math.round(H * edgeFrac);
    const vFrac = (H - 2 * e) / H, webH = width * vFrac;
    bandTex.repeat.set(arcFrac, vFrac); bandTex.offset.set((1 - arcFrac) / 2, e / H);
    bandTex.wrapT = THREE.ClampToEdgeWrapping; bandTex.needsUpdate = true;
    const wm = this.webbingMaps(cfg, W, H, e);
    for (const t of [wm.normal, wm.rough]) { t.repeat.set(arcFrac, 1); t.offset.set((1 - arcFrac) / 2, 0); }
    const col = new THREE.Color(cfg.bandColor);
    const webMat = new THREE.MeshPhysicalMaterial({
      map: bandTex, normalMap: wm.normal, roughnessMap: wm.rough, roughness: 1, metalness: 0,
      sheen: 0.7, sheenRoughness: 0.55, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3),
      envMapIntensity: 0.35,
    });
    add(new THREE.Mesh(cyl(R + 0.12, webH), webMat));
    const selvMat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.9, sheen: 0.6, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3) });
    for (const s of [1, -1]) { const m = add(new THREE.Mesh(torusArc(R + 0.06, 0.065), selvMat)); m.position.y = s * webH / 2; }

    // vävd Valley Dogs-etikett vid fodrets ände
    this._addLabel(G, 0.68, R + 0.02, width); // framsidan, bredvid texten

    if (!halv) return;
    const P = (a, r) => new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r);
    const arcPts = (a0, a1, r, n = 24) => Array.from({ length: n + 1 }, (_, k) => P(a0 + (a1 - a0) * k / n, r));
    const tape = this._webTapeMat(cfg.bandColor, bw);
    const aRing = Math.PI - offR, rb = R + 0.02, rIn = R - 0.13, rRod = R - 0.055;
    const tabL = Math.min(2.2, bw * 0.7 + 0.6), sm = this._stitchMat(cfg.bandColor, bw, tabL);
    const hwOn = cfg.showHardware !== false;
    const metal = this.metalMaterial(cfg.hardware);
    const tube = Math.max(0.12, width * 0.035);
    // bandet viks runt en lodrät ringstång: halvrör mot riktningen dirSign (längs tangenten)
    const halfPipe = (pos, dir, h, r = 0.2) => {
      const th0 = Math.atan2(dir.x, dir.z);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true, th0 - Math.PI / 2, Math.PI), tape);
      m.position.copy(pos); return add(m);
    };
    const tangent = (a, sgn) => new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)).multiplyScalar(sgn);
    if (!hwOn) {
      // utan beslag: ofodrat band sluter cirkeln på baksidan (strypdelen)
      const a0 = halfSpan - 0.3 / R;
      add(this._ribbon(arcPts(a0, 2 * Math.PI - a0, rb, 60), bw, 0.13, tape));
      return;
    }

    for (const s of [1, -1]) {
      const aMain = s * (aRing - dRod / R), aCtl = s * (aRing + dRod / R);
      const a0 = s * (halfSpan - 0.3 / R);
      // huvudbandet: ofodrat från fodrets ände till ringen (spänne på ena sidan vid knäppe)
      if (knappe && s > 0) {
        const aB = halfSpan + 0.6 / R + buckleLen / 2 / R, hb = (buckleLen / 2 - 0.7) / R;
        add(this._ribbon(arcPts(a0, aB - hb, rb, 8), bw, 0.13, tape));
        add(this._ribbon(arcPts(aB + hb, aMain, rb, 8), bw, 0.13, tape));
        if (hwOn) {
          const T = Math.min(1.15, 0.24 * width + 0.25);
          this._bendR = R - T * 0.4;
          const bk = this.makeSideRelease(width);
          bk.position.copy(P(aB, R - T * 0.4));
          bk.lookAt(P(aB, R + 10));
          bk.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
          G.add(bk);
        }
      } else {
        add(this._ribbon(arcPts(a0, aMain, rb, 24), bw, 0.13, tape));
      }
      // vikt flik runt ringstången med box-X-söm
      const aTab = aMain - s * tabL / R;
      add(this._ribbon(arcPts(aMain, aTab, rIn, 10), bw, 0.12, tape));
      halfPipe(P(aMain, rRod), tangent(aMain, s), bw);
      add(this._ribbon(arcPts(aTab, aMain, rb + 0.072, 10), bw, 0.004, sm));
      if (hwOn) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, tube, 18, 72), metal);
        ring.position.copy(P(s * aRing, rRod)); ring.lookAt(P(s * aRing, rRod + 10));
        add(ring);
      }
      // strypbandet viks runt ringens bakre stång
      halfPipe(P(aCtl, rRod), tangent(aCtl, -s), bw);
    }
    // strypbandets inre del: mellan ringarna, mot halsen
    const aC = aRing + dRod / R;
    add(this._ribbon(arcPts(aC, 2 * Math.PI - aC, rIn, 30), bw, 0.12, tape));

    // strypbandets yttre delar dras ihop bakåt till D-ringen
    const gapL = 0.2, lr = 4.6 + bw * 0.5, tipZ = -R - lr;
    const outerCurves = [];
    for (const s of [1, -1]) {
      const a = s * aC;
      const pts = [
        P(a, rb), P(a + s * 0.7 / R, rb + 0.06),
        new THREE.Vector3(s * (gapL + 1.0), 0, -R - 0.9),
        new THREE.Vector3(s * gapL, 0, tipZ + tabL + 0.9),
        new THREE.Vector3(s * gapL, 0, tipZ),
      ];
      const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      outerCurves.push(c);
      add(this._ribbon(c.getSpacedPoints(60), bw, 0.13, tape));
      // sydd flik vid D-ringen
      const z0 = tipZ + 0.35, z1 = z0 + tabL;
      add(this._ribbon([new THREE.Vector3(s * (gapL + 0.072), 0, z1), new THREE.Vector3(s * (gapL + 0.072), 0, z0)], bw, 0.004, sm));
    }
    halfPipe(new THREE.Vector3(0, 0, tipZ), new THREE.Vector3(0, 0, -1), bw, gapL);
    if (!hwOn) return;
    const da = bw / 2 + 0.2, db = da * 1.3, pts = [];
    for (let k = 0; k <= 6; k++) pts.push(new THREE.Vector3(0, -0.8 * da + (k / 6) * 1.6 * da, 0));
    for (let k = 1; k < 18; k++) { const ang = Math.PI / 2 + (k / 18) * Math.PI; pts.push(new THREE.Vector3(-0.2 * db + 0.8 * db * Math.cos(ang), da * Math.sin(ang), 0)); }
    const dr = add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 180, tube * 1.1, 16, true), metal));
    dr.rotation.set(0, -Math.PI / 2, 0);
    dr.position.set(0, 0, tipZ);
    if (justerbart) {
      const c = outerCurves[0], t = 0.45, p = c.getPointAt(t), tan = c.getTangentAt(t);
      const out = new THREE.Vector3(tan.z, 0, -tan.x);
      if (out.x < 0) out.negate();
      const tg = this.makeTriGlide(width, metal);
      tg.position.copy(p.clone().addScaledVector(out, -0.1));
      tg.lookAt(p.clone().add(out));
      tg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      G.add(tg);
    }
  }

  // Genomskinlig sömtextur (box + kryss) för sydda flikar. uv.x i cm.
  _stitchMat(hex, bw, L) {
    const key = hex + bw + L;
    this._stitchCache = this._stitchCache || new Map();
    if (this._stitchCache.has(key)) return this._stitchCache.get(key);
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * bw / L);
    const ctx = c.getContext('2d'), col = new THREE.Color(hex);
    const lum = col.r * 0.3 + col.g * 0.59 + col.b * 0.11;
    const thread = lum > 0.5 ? col.clone().lerp(new THREE.Color('#000'), 0.22) : col.clone().lerp(new THREE.Color('#fff'), 0.3);
    const W = c.width, H = c.height, m = Math.min(W, H) * 0.14;
    ctx.strokeStyle = thread.getStyle(); ctx.lineWidth = Math.max(4, H * 0.022); ctx.lineCap = 'round';
    ctx.setLineDash([H * 0.05, H * 0.03]);
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.beginPath(); ctx.moveTo(m, m); ctx.lineTo(W - m, H - m); ctx.moveTo(W - m, m); ctx.lineTo(m, H - m); ctx.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / L, 1);
    t.userData = { keep: true };
    const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.35, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
    mat.userData.keep = true;
    this._stitchCache.set(key, mat);
    return mat;
  }

  // Böj en grupp (byggd i XY, +Z utåt) runt en lodrät axel på avstånd Rb bakom, så beslaget följer halsbandet.
  _bendGroup(g, Rb) {
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
    g.traverse(o => {
      if (!o.isMesh) return;
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      const geo = o.geometry.clone(); geo.applyMatrix4(m);
      const p = geo.attributes.position, n = geo.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), th = x / Rb, r = Rb + z;
        p.setX(i, r * Math.sin(th)); p.setZ(i, r * Math.cos(th) - Rb);
        if (n) { const nx = n.getX(i), nz = n.getZ(i); n.setX(i, nx * Math.cos(th) + nz * Math.sin(th)); n.setZ(i, -nx * Math.sin(th) + nz * Math.cos(th)); }
      }
      o.geometry.dispose(); o.geometry = geo;
      o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    });
    return g;
  }

  // Platt band (webbing) längs en kurva i XZ-planet, bredd längs Y.
  _ribbon(pts, w, th, mat) {
    const n = pts.length, pos = [], uv = [], idx = [];
    const tan = i => pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
    let len = 0; const L = [0];
    for (let i = 1; i < n; i++) { len += pts[i].distanceTo(pts[i - 1]); L.push(len); }
    // fyra sidor: utsida, insida, topp, botten
    const faces = [[1, 1, 1, -1, 1], [-1, -1, 1, -1, 0], [1, -1, 1, 1, 0], [1, -1, -1, -1, 1]];
    for (const [s0, s1, h0, h1, flip] of faces) {
      const base = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const t = tan(i), side = new THREE.Vector3(t.z, 0, -t.x); // utåtnormal i XZ
        for (const [s, h] of [[s0, h0], [s1, h1]]) {
          const p = pts[i].clone().addScaledVector(side, s * th / 2); p.y += h * w / 2;
          pos.push(p.x, p.y, p.z);
        }
        uv.push(L[i], h0 > 0 ? 1 : 0, L[i], h1 > 0 ? 1 : 0);
      }
      for (let i = 0; i < n - 1; i++) {
        const a = base + i * 2, b = a + 1, c = a + 2, d = a + 3;
        if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    return m;
  }

  // Sömlös webbingtextur (1 cm lång ruta, full bandbredd) för ofodrade band.
  _webTapeMat(hex, bw) {
    const key = hex + bw;
    if (this._tapeKey === key) return this._tapeMat;
    const Nu = 128, Nv = 256, col = new THREE.Color(hex), r = rng(3), fz = fbm(r, 8, 2);
    const a = document.createElement('canvas'), n = document.createElement('canvas');
    a.width = n.width = Nu; a.height = n.height = Nv;
    const rows = Math.round(bw * 12), h = new Float32Array(Nu * Nv);
    for (let y = 0; y < Nv; y++) for (let x = 0; x < Nu; x++) {
      const v = y / Nv, u = x / Nu;
      const rib = Math.pow(Math.abs(Math.sin(Math.PI * v * rows)), 0.7);
      const tw = 0.5 + 0.5 * Math.sin(2 * Math.PI * (u * 6 + v * rows / 2));
      const edge = Math.min(v, 1 - v) * bw / 0.12, selv = edge < 1 ? Math.sqrt(1 - (1 - edge) ** 2) : 1;
      h[y * Nu + x] = (0.4 * rib + 0.3 * tw * rib + 0.3 * fz(u, v)) * selv;
    }
    const actx = a.getContext('2d'), nctx = n.getContext('2d');
    const AI = actx.createImageData(Nu, Nv), NI = nctx.createImageData(Nu, Nv);
    const c255 = [col.r, col.g, col.b].map(v => Math.pow(v, 1 / 2.2) * 255);
    for (let y = 0, i = 0; y < Nv; y++) {
      const rowVar = 1 + (r() - 0.5) * 0.035;
      for (let x = 0; x < Nu; x++, i++) {
        const m = rowVar * (0.94 + 0.08 * h[i]);
        AI.data[i * 4] = Math.min(255, c255[0] * m); AI.data[i * 4 + 1] = Math.min(255, c255[1] * m); AI.data[i * 4 + 2] = Math.min(255, c255[2] * m); AI.data[i * 4 + 3] = 255;
        const xl = y * Nu + (x - 1 + Nu) % Nu, xr = y * Nu + (x + 1) % Nu, yu = Math.max(0, y - 1) * Nu + x, yd = Math.min(Nv - 1, y + 1) * Nu + x;
        const dx = (h[xr] - h[xl]) * 1.2, dy = (h[yd] - h[yu]) * 1.2, inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
        NI.data[i * 4] = (-dx * inv * 0.5 + 0.5) * 255; NI.data[i * 4 + 1] = (dy * inv * 0.5 + 0.5) * 255; NI.data[i * 4 + 2] = (inv * 0.5 + 0.5) * 255; NI.data[i * 4 + 3] = 255;
      }
    }
    actx.putImageData(AI, 0, 0); nctx.putImageData(NI, 0, 0);
    const ta = new THREE.CanvasTexture(a), tn = new THREE.CanvasTexture(n);
    for (const t of [ta, tn]) { t.wrapS = THREE.RepeatWrapping; t.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); t.userData = { keep: true }; }
    ta.colorSpace = THREE.SRGBColorSpace;
    // uv.x är i cm → 1 upprepning per cm
    this._tapeMat = new THREE.MeshPhysicalMaterial({
      map: ta, normalMap: tn, roughness: 0.9, sheen: 0.7, sheenRoughness: 0.55,
      sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3), envMapIntensity: 0.35, side: THREE.DoubleSide,
    });
    this._tapeMat.userData.keep = true;
    this._tapeKey = key;
    return this._tapeMat;
  }

  // Liten vävd etikett som sticker ut under bandets nederkant.
  _addLabel(G, a, r, width) {
    if (!this._labelMat) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f7f5f0'; ctx.fillRect(0, 0, 512, 256);
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
      for (let y = 0; y < 256; y += 3) ctx.fillRect(0, y, 512, 1);
      for (let x = 0; x < 512; x += 3) ctx.fillRect(x, 0, 1, 256);
      ctx.globalAlpha = 1; ctx.fillStyle = '#b4502c';
      ctx.font = '600 104px "Dancing Script", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Valley Dogs', 256, 150);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = { keep: true };
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      this._labelMat = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.85, sheen: 0.5, sheenRoughness: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.3 });
      this._labelMat.userData.keep = true;
    }
    const lw = 2.3, lh = 1.15;
    const geo = new THREE.PlaneGeometry(lw, lh, 12, 1);
    // böj etiketten längs halsbandets radie
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, -(x * x) / (2 * r)); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this._labelMat);
    m.position.set(Math.sin(a) * r, -width / 2 - lh * 0.5 + 0.55, Math.cos(a) * r);
    m.lookAt(Math.sin(a) * (r + 10), m.position.y, Math.cos(a) * (r + 10));
    m.castShadow = true; m.receiveShadow = true;
    G.add(m);
  }

  // ------------------------------------------------------ beslag
  // Delade material/texturer för beslagen (skapas en gång).
  _plasticMat() {
    if (!this._plastic) {
      const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
      const ctx = c.getContext('2d'), I = ctx.createImageData(N, N), r = rng(99), n = fbm(r, 16, 3);
      for (let i = 0; i < N * N; i++) { const v = 128 + (n((i % N) / N, Math.floor(i / N) / N) - 0.5) * 120 + (r() - 0.5) * 50; I.data[i * 4] = I.data[i * 4 + 1] = I.data[i * 4 + 2] = v; I.data[i * 4 + 3] = 255; }
      ctx.putImageData(I, 0, 0);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.5, 1.5);
      this._plastic = new THREE.MeshPhysicalMaterial({
        color: '#27282c', roughness: 0.46, metalness: 0, bumpMap: t, bumpScale: 0.3,
        clearcoat: 0.45, clearcoatRoughness: 0.38, envMapIntensity: 1.0,
      });
      this._plastic.userData.keep = true; t.userData = { keep: true };
    }
    return this._plastic;
  }

  metalMaterial(finish) {
    if (!this.realistic) return super.metalMaterial(finish);
    if (!this._brush) {
      const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
      const ctx = c.getContext('2d'), I = ctx.createImageData(N, N), r = rng(5), n = fbm(r, 8, 3);
      for (let y = 0; y < N; y++) { let line = r(); for (let x = 0; x < N; x++) { const i = y * N + x; if (r() < 0.02) line = r();
        const v = 150 + (n(x / N, y / N) - 0.5) * 70 + (line - 0.5) * 40; I.data[i * 4] = 255; I.data[i * 4 + 1] = v; I.data[i * 4 + 2] = 255; I.data[i * 4 + 3] = 255; } }
      ctx.putImageData(I, 0, 0);
      this._brush = new THREE.CanvasTexture(c); this._brush.wrapS = this._brush.wrapT = THREE.RepeatWrapping;
    }
    const plated = finish.id !== 'stal' && finish.id !== 'massing';
    const m = new THREE.MeshPhysicalMaterial({
      color: finish.hex, metalness: finish.metalness, roughness: Math.min(1, finish.roughness * 1.1),
      roughnessMap: this._brush, envMapIntensity: 1.9,
      clearcoat: plated ? 0.35 : 0.1, clearcoatRoughness: 0.2,
    });
    return m;
  }

  _extr(shape, T, b = 0.07, curve = 24) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, T - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 6, curveSegments: curve });
    g.translate(0, 0, b);
    return g;
  }
  _rr(x0, y0, w, h, r, path = new THREE.Shape()) {
    r = Math.min(r, w / 2, h / 2);
    path.moveTo(x0 + r, y0); path.lineTo(x0 + w - r, y0); path.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    path.lineTo(x0 + w, y0 + h - r); path.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    path.lineTo(x0 + r, y0 + h); path.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    path.lineTo(x0, y0 + r); path.quadraticCurveTo(x0, y0, x0 + r, y0);
    return path;
  }
  _hole(x0, y0, w, h, r) { return this._rr(x0, y0, w, h, r, new THREE.Path()); }

  // Profilera en plastdel: tunnare mot bandänden, lätt välvd ovansida.
  _shapeZ(geo, x0, x1, T, thinEnd, taper, dome, H) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const t = clamp01((x - x0) / (x1 - x0)), tt = thinEnd > 0 ? t : 1 - t;
      const k = 1 - taper * tt * tt;
      const up = z / T;
      p.setZ(i, z * k + up * dome * Math.max(0, 1 - (2 * y / H) ** 2));
    }
    geo.computeVertexNormals();
    // mjuka normaler över trianguleringen, men behåll skarpa kanter (> ~50°)
    const n = geo.attributes.normal, map = new Map(), key = i => `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    for (let i = 0; i < p.count; i++) { const k2 = key(i); if (!map.has(k2)) map.set(k2, []); map.get(k2).push(i); }
    const out = new Float32Array(n.count * 3), cos = Math.cos(50 * Math.PI / 180);
    for (const ids of map.values()) for (const i of ids) {
      let sx = 0, sy = 0, sz = 0;
      for (const j of ids) { const d = n.getX(i) * n.getX(j) + n.getY(i) * n.getY(j) + n.getZ(i) * n.getZ(j); if (d > cos) { sx += n.getX(j); sy += n.getY(j); sz += n.getZ(j); } }
      const l = Math.hypot(sx, sy, sz) || 1; out[i * 3] = sx / l; out[i * 3 + 1] = sy / l; out[i * 3 + 2] = sz / l;
    }
    geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
    return geo;
  }

  // Webbingbit (bandets vikta ände) med box-X-söm, för hällor och spännen.
  _strapMat() {
    const key = this._bandColor;
    if (this._strapKey !== key) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d'), col = new THREE.Color(key);
      ctx.fillStyle = key; ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 4) { ctx.fillStyle = col.clone().lerp(new THREE.Color(y % 8 ? '#fff' : '#000'), 0.06).getStyle(); ctx.fillRect(0, y, 256, 2); }
      ctx.strokeStyle = col.clone().lerp(new THREE.Color('#fff'), 0.22).getStyle(); ctx.lineWidth = 5; ctx.setLineDash([12, 8]);
      ctx.strokeRect(40, 40, 176, 176);
      ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(216, 216); ctx.moveTo(216, 40); ctx.lineTo(40, 216); ctx.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      this._strapM = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.9, sheen: 0.6, sheenRoughness: 0.55, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3), envMapIntensity: 0.35 });
      this._strapPlain = new THREE.MeshPhysicalMaterial({ color: key, roughness: 0.9, sheen: 0.6, sheenRoughness: 0.55, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3), envMapIntensity: 0.35, side: THREE.DoubleSide });
      this._strapKey = key;
    }
    return [this._strapM, this._strapPlain];
  }
  // band som viks runt en stång längs Y vid (x,z) och fortsätter mot +dir i x
  _strapWrap(g, x, z, rBar, len, h, dir, stitched = true) {
    const [mStitch, mPlain] = this._strapMat();
    const th = 0.11, rw = rBar + th / 2 + 0.01;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(rw, rw, h, 28, 1, true, dir > 0 ? Math.PI : 0, Math.PI), mPlain);
    pipe.position.set(x, 0, z);
    g.add(pipe);
    for (const s of [1, -1]) {
      const layer = new THREE.Mesh(new THREE.BoxGeometry(len, h, th), s > 0 && stitched ? mStitch : mPlain);
      layer.position.set(x + dir * len / 2, 0, z + s * rw);
      g.add(layer);
    }
  }

  makeSideRelease(width) {
    if (!this.realistic) return super.makeSideRelease(width);
    const g = new THREE.Group(), mat = this._plasticMat();
    const H = width * 1.04, T = Math.min(1.15, 0.24 * width + 0.25), bw = (this._bandW || width) * 1.02;
    const Lf = width * 1.0, gap = width * 0.36, Lm = width * 0.5, z0 = 0.06;
    // hondel (x från 0 till Lf): mun vid x=0, bandslits vid änden, sidofönster för spärrhakarna
    const fem = new THREE.Shape(), r1 = 0.14, r2 = H * 0.34;
    fem.moveTo(r1, -H / 2); fem.lineTo(Lf - r2, -H / 2); fem.quadraticCurveTo(Lf, -H / 2, Lf, -H / 2 + r2);
    fem.lineTo(Lf, H / 2 - r2); fem.quadraticCurveTo(Lf, H / 2, Lf - r2, H / 2); fem.lineTo(r1, H / 2);
    fem.quadraticCurveTo(0, H / 2, 0, H / 2 - r1); fem.lineTo(0, -H / 2 + r1); fem.quadraticCurveTo(0, -H / 2, r1, -H / 2);
    fem.holes.push(this._hole(Lf - 0.42, -bw / 2, 0.2, bw, 0.08));
    for (const s of [1, -1]) fem.holes.push(this._hole(Lf * 0.22, s > 0 ? H / 2 - 0.34 : -H / 2 + 0.12, Lf * 0.34, 0.22, 0.1));
    const femG = this._shapeZ(this._extr(fem, T, 0.12), 0, Lf, T, 1, 0.45, 0.07, H);
    const femM = new THREE.Mesh(femG, mat); femM.position.z = z0; g.add(femM);
    // präglad platta på ovansidan
    const plate = new THREE.Mesh(this._extr(this._rr(Lf * 0.14, -H * 0.16, Lf * 0.4, H * 0.32, H * 0.14), 0.06, 0.025), mat);
    plate.position.z = z0 + T * 1.0; plate.rotation.y = 0.1; g.add(plate);
    // hane (x från -gap-Lm till -gap) med bandslits
    const mx0 = -gap - Lm;
    const male = this._rr(mx0, -H * 0.47, Lm, H * 0.94, H * 0.16);
    male.holes.push(this._hole(mx0 + 0.22, -bw / 2, 0.2, bw, 0.08));
    const maleG = this._shapeZ(this._extr(male, T * 0.86, 0.09), mx0, -gap, T * 0.86, -1, 0.3, 0.05, H);
    const maleM = new THREE.Mesh(maleG, mat); maleM.position.z = z0; g.add(maleM);
    // mittstyrning
    const tongue = new THREE.Mesh(this._extr(this._rr(-gap - 0.1, -H * 0.1, gap + Lf * 0.3, H * 0.2, H * 0.08), T * 0.5, 0.05), mat);
    tongue.position.z = z0 + T * 0.12; g.add(tongue);
    // två fjädrande spärrhakar med greppräfflor
    for (const s of [1, -1]) {
      const a = new THREE.Shape(), yOut = s * H * 0.5, yIn = s * H * 0.3, xs = -gap - 0.05, xe = Lf * 0.5;
      a.moveTo(xs, s * H * 0.44);
      a.quadraticCurveTo(xs + gap * 0.5, yOut + s * H * 0.02, 0.02, yOut - s * 0.02);
      a.lineTo(xe, s * (H / 2 - 0.12));
      a.lineTo(xe, s * (H / 2 - 0.3));
      a.lineTo(0.02, yIn);
      a.quadraticCurveTo(xs + gap * 0.5, yIn, xs, s * H * 0.24);
      a.closePath();
      const arm = new THREE.Mesh(this._extr(a, T * 0.62, 0.06), mat); arm.position.z = z0 + T * 0.16; g.add(arm);
      for (let k = 0; k < 4; k++) {
        const rib = new THREE.Mesh(this._extr(this._rr(-gap * (0.82 - k * 0.2) - 0.04, -0.035, 0.07, 0.07, 0.03), T * 0.1, 0.02), mat);
        rib.scale.y = 1; rib.position.set(0, s * H * 0.455, z0 + T * 0.72); rib.rotation.z = 0; g.add(rib);
      }
    }
    // bandet viks runt ändstängerna
    const shift = -(Lf - (Lm + gap)) / 2;
    g.children.forEach(o => { o.position.x += shift; });
    if (this._bendR) this._bendGroup(g, this._bendR);
    return g;
  }

  makeDRing(width, metal, bandHex, riveted = false) {
    if (!this.realistic) return super.makeDRing(width, metal, bandHex, riveted);
    const g = new THREE.Group();
    const a = Math.max(width * 0.42, 0.8), b = a * 1.25, tube = Math.max(0.13, width * 0.04);
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector3(0, -0.78 * a + (i / 6) * 1.56 * a, 0));
    const cx = -0.22 * b, rx = b - 0.22 * b;
    for (let i = 1; i < 16; i++) { const ang = Math.PI / 2 + (i / 16) * Math.PI; pts.push(new THREE.Vector3(cx + rx * Math.cos(ang) + (Math.abs(Math.sin(ang)) > 0.9 ? 0 : 0), a * Math.sin(ang), 0)); }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const zBar = 0.08 + 0.12 + tube;
    const ring = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, tube, 18, true), metal);
    ring.position.z = zBar;
    ring.rotation.y = -0.1; // vilar mot bandet
    g.add(ring);
    this._bandColor = bandHex;
    this._strapWrap(g, 0, zBar, tube, width * 0.6, a * 1.3, 1, true);
    if (riveted) {
      for (const sgn of [-1, 1]) {
        const rv = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal);
        rv.rotation.x = Math.PI / 2; rv.position.set(width * 0.42, sgn * a * 0.35, zBar + 0.2);
        g.add(rv);
      }
    }
    return g;
  }

  makeTriGlide(width, metal) {
    if (!this.realistic) return super.makeTriGlide(width, metal);
    const H = width * 1.08, W = width * 0.62, bar = Math.max(0.16, width * 0.06), slot = (W - 3 * bar) / 2;
    const s = this._rr(-W / 2, -H / 2, W, H, bar * 1.2);
    const hh = H - 2 * bar;
    s.holes.push(this._hole(-W / 2 + bar, -hh / 2, slot, hh, slot * 0.45));
    s.holes.push(this._hole(-W / 2 + 2 * bar + slot, -hh / 2, slot, hh, slot * 0.45));
    const m = new THREE.Mesh(this._extr(s, bar * 1.4, bar * 0.45, 32), metal);
    m.position.z = 0.08;
    const g = new THREE.Group(); g.add(m);
    return g;
  }

  makeMetalBuckle(width, metal) {
    if (!this.realistic) return super.makeMetalBuckle(width, metal);
    const g = new THREE.Group();
    const h = width * 1.12, w = width * 0.72, tube = Math.max(0.13, width * 0.045);
    const outline = this._rr(-w / 2, -h / 2, w, h, h * 0.18).getSpacedPoints(90).map(p => new THREE.Vector3(p.x, p.y, 0));
    outline.pop();
    const frame = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline, true, 'centripetal'), 200, tube, 16, true), metal);
    frame.position.z = tube + 0.02; g.add(frame);
    // mittstång där tornen sitter
    const mid = new THREE.Mesh(new THREE.CapsuleGeometry(tube * 0.9, h - tube * 2, 6, 16), metal);
    mid.position.set(-w * 0.1, 0, tube + 0.02); g.add(mid);
    // rulle på främre stången
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(tube * 1.55, tube * 1.55, h * 0.62, 28), metal);
    roller.position.set(w / 2, 0, tube + 0.02); g.add(roller);
    // torne: böjd tråd från mittstången över rullen
    const tc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-w * 0.1, 0, tube + 0.02), new THREE.Vector3(w * 0.1, 0, tube * 2.4),
      new THREE.Vector3(w * 0.45, 0, tube * 3.3), new THREE.Vector3(w / 2 + tube * 2.4, 0, tube * 2.2),
    ]);
    const prong = new THREE.Mesh(new THREE.TubeGeometry(tc, 40, tube * 0.8, 12, false), metal); g.add(prong);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(tube * 0.8, 12, 8), metal); tip.position.copy(tc.getPoint(1)); g.add(tip);
    return g;
  }

  // kamerapresets med mjuk övergång
  setView(name) {
    const cfg = this._lastCfg; if (!cfg) return;
    const R = cfg.circumference / (2 * Math.PI), y = this.collarGroup.position.y;
    const views = {
      oversikt: [[0, 9, 34], [0, 0, 0]],
      beslag:   [[3, y + 5, -R - 13], [0, y, -R * 0.7]],
      kant:     [[R * 0.55 + 3, y + 3.2, R + 7.5], [R * 0.3, y, R * 0.8]],
      insida:   [[0, y + R * 1.25 + 4, R * 0.9 + 2], [0, y - 0.5, -R * 0.6]],
    };
    const [p, t] = views[name] || views.oversikt;
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    const p1 = new THREE.Vector3(...p), t1 = new THREE.Vector3(...t);
    const start = performance.now(), dur = 700;
    const step = now => {
      const k = Math.min(1, (now - start) / dur), s = k * k * (3 - 2 * k);
      this.camera.position.lerpVectors(p0, p1, s);
      this.controls.target.lerpVectors(t0, t1, s);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
