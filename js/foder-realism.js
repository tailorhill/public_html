// Fotorealistiska foder för Valley Dogs-verktyget.
// Bygger PBR-kartor (färg, normal, grovhet/metall) per fodermaterial och
// ersätter bomullshalsbandets foder med riktiga lager: fodret i full bredd,
// bomullsbandet som eget upphöjt band ovanpå, sömmar och vinyltext i relief.
import * as THREE from 'three';
import { CollarViewer } from './collar3d.js';
import { loadHardwareAssets, hardwareAsset } from './hardware-assets.js';

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
export const WEAVE_SCALE = 0.34; // maskstorlek relativt bandbredd

// Lazy-laddning: texturerna är WebP och hämtas EN i taget när ett foder/en
// bandfärg faktiskt väljs (i stället för alla ~80 upp­front). Varje textur
// cachas, och samma id återanvänder ett pågående löfte.
function _loadImg(url) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = url;
  });
}
const _webbingPromises = {}, _liningPromises = {};

// Ladda (om ej redan laddad) bandfärgens textur. Löftet resolvar när bilden
// finns i cachen, så anroparen kan bygga om 3D-vyn direkt efter.
export function ensureWebbing(id, base = document.baseURI) {
  if (!id || WEBBING_PHOTOS.indexOf(id) === -1) return Promise.resolve(null);
  if (webbingImgs[id]) return Promise.resolve(webbingImgs[id]);
  if (!_webbingPromises[id]) {
    _webbingPromises[id] = _loadImg(new URL('wtex/' + id + '.webp', base).href)
      .then(im => { if (im) webbingImgs[id] = im; return im; });
  }
  return _webbingPromises[id];
}

// Ladda (om ej redan laddad) foderets textur.
export function ensureLining(id, base = document.baseURI) {
  if (!id || !PHOTO_LININGS[id]) return Promise.resolve(null);
  if (photoImgs[id]) return Promise.resolve(photoImgs[id]);
  if (!_liningPromises[id]) {
    _liningPromises[id] = _loadImg(new URL('textures/' + id + '.webp', base).href)
      .then(im => { if (im) photoImgs[id] = im; return im; });
  }
  return _liningPromises[id];
}

// Säkerställ att just den här designens foder + bandfärg är laddade innan bygge.
export function ensureTexturesFor(cfg, base = document.baseURI) {
  return Promise.all([
    ensureLining(cfg && cfg.lining && cfg.lining.id, base),
    ensureWebbing(cfg && cfg.webbingId, base),
  ]);
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
    case 'leather':  return { normal: 0.45, env: 0.65, clearcoat: 0.10, ccRough: 0.45, sheen: 0.15, sheenRough: 0.6, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.4) };
    case 'metallic': return { normal: 0.45, env: 1.0, clearcoat: 0.22, ccRough: 0.25 };
    case 'coated':   return { normal: 0.3, env: 0.6, clearcoat: 0.2, ccRough: 0.3 };
    default:         return { normal: 0.38, env: 0.45, sheen: 0.28, sheenRough: 0.85, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.08) };
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
      // Relief från originalfotot, före utjämning av ljuset i färgkartan.
      for (let i = 0; i < N * N; i++) {
        const l = a[i * 4] * 0.3 + a[i * 4 + 1] * 0.59 + a[i * 4 + 2] * 0.11;
        const lb = bd[i * 4] * 0.3 + bd[i * 4 + 1] * 0.59 + bd[i * 4 + 2] * 0.11 + 1;
        pl[i] = Math.max(-1, Math.min(1, (l - lb) / lb * 1.2));
      }
      // dämpa fläckighet: dra färgen mot medelvärdet men behåll fin narv
      if (!flam) {
        let mr = 0, mg = 0, mb = 0; for (let i = 0; i < N * N; i++) { mr += a[i * 4]; mg += a[i * 4 + 1]; mb += a[i * 4 + 2]; }
        mr /= N * N; mg /= N * N; mb /= N * N;
        for (let i = 0; i < N * N; i++) {
          const fr = a[i * 4] - bd[i * 4], fg = a[i * 4 + 1] - bd[i * 4 + 1], fb = a[i * 4 + 2] - bd[i * 4 + 2];
          a[i * 4] = mr + (bd[i * 4] - mr) * 0.08 + fr * 0.45;
          a[i * 4 + 1] = mg + (bd[i * 4 + 1] - mg) * 0.08 + fg * 0.45;
          a[i * 4 + 2] = mb + (bd[i * 4 + 2] - mb) * 0.08 + fb * 0.45;
        }
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
        Rg[i] = 0.58 + 0.10 * (1 - peb) - 0.04 * pl[i];
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
      if (o.isDirectionalLight && o.castShadow) { o.shadow.bias = -0.00015; o.shadow.normalBias = 0.018; }
    });
    this.controls.minDistance = 7;
    this.hardwareReady = loadHardwareAssets().then(count => {
      if (count && this._lastCfg) this.build(this._lastCfg);
      return count;
    });
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
    this._isBio = cfg.family === 'biothane';
    this._bandW = cfg.bandWidthCm; this._bandColor = cfg.bandColor; this._webId = cfg.webbingId;
    this._bendR = cfg.circumference / (2 * Math.PI) + 0.1;
    const cotton = this.realistic && cfg.family === 'cotton' && cfg.lining;
    const halfSlip = this.realistic && ['halvstryp', 'halvstrypknappe', 'justerbart'].includes(cfg.modelKind);
    const halv = cotton && halfSlip;
    super.build(halfSlip ? { ...cfg, showHardware: false } : cfg);
    this._lastCfg = cfg;
    if (!cotton) {
      if (this.realistic && cfg.family === 'biothane') {
        this._finishBiothane(cfg);
        if (halfSlip) this._buildBioHalfSlip(cfg);
      }
      return;
    }

    const G = this.collarGroup;
    const R = cfg.circumference / (2 * Math.PI), width = cfg.width, th = cfg.lining.leather ? 0.24 : 0.30, seg = this.lite ? 128 : 200;
    const [outer, inner, ringA, ringB] = G.children;
    const bandTex = outer.material.map;
    for (const o of [outer, inner, ringA, ringB]) {
      G.remove(o); o.geometry.dispose();
      if (o.material.map && o.material.map !== bandTex) o.material.map.dispose();
      o.material.dispose();
    }

    // vinkelkonvention som grundklassen: punkt = (sin a·r, y, cos a·r), a=0 framsida, a=π baksida
    const bw = cfg.bandWidthCm;
    const halfSpan = halv ? this._halfSlipLayout(cfg).halfSpan : Math.PI;
    const arc = 2 * halfSpan, arcFrac = arc / (2 * Math.PI);

    const cyl = (r, h) => new THREE.CylinderGeometry(r, r, h, seg, 12, true, -halfSpan, arc);
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
    for (const s of [1, -1]) { const m = add(new THREE.Mesh(torusArc(R - th / 2, th / 2), edgeMat)); m.position.y = s * width / 2; m.scale.y = 0.55; }
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
      normalScale: new THREE.Vector2(0.5, 0.5),
      sheen: 0.25, sheenRoughness: 0.85, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.08),
      envMapIntensity: 0.35,
    });
    add(new THREE.Mesh(cyl(R + 0.075, webH), webMat));
    const selvMat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.94, sheen: 0.2, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3) });
    for (const s of [1, -1]) { const m = add(new THREE.Mesh(torusArc(R + 0.038, 0.04), selvMat)); m.position.y = s * webH / 2; }

    // Små, sammanhängande ojämnheter i sydda lager bryter den perfekta
    // cylindersilhuetten utan att ändra textens placering eller beslagens fästen.
    for (const mesh of G.children) {
      if (!mesh.isMesh) continue;
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
        if (r < 1) continue;
        const a = Math.atan2(x, z), y = p.getY(i) + mesh.position.y;
        const ripple = 0.018 * Math.sin(7 * a + y * 0.8) + 0.009 * Math.cos(13 * a - y);
        p.setXYZ(i, x * (1 + ripple / r), p.getY(i) + 0.018 * Math.sin(5 * a), z * (1 + ripple / r));
      }
      p.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }

    // vävd Valley Dogs-etikett vid fodrets ände
    this._addLabel(G, 0.68, R + 0.02, width); // framsidan, bredvid texten

    if (halv) this._addHalfSlip(cfg);
  }

  _halfSlipLayout(cfg) {
    const R = cfg.circumference / (2 * Math.PI), bw = cfg.bandWidthCm;
    // Keep the opening physically sized, also on small/large collars.
    const off = Math.min(1.05, (bw * 0.62 + 1.8) / R);
    const halfSpan = Math.PI - off - 0.95 / R;
    return { R, bw, off, halfSpan, ringAngle: Math.PI - off };
  }

  _buildBioHalfSlip(cfg) {
    const { R, halfSpan } = this._halfSlipLayout(cfg), arc = 2 * halfSpan;
    const [outer, inner, top, bottom] = this.collarGroup.children;
    [outer, inner].forEach((mesh, i) => {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.CylinderGeometry(R - i * 0.22, R - i * 0.22,
        cfg.width, this.lite ? 96 : 160, 1, true, -halfSpan, arc);
      mesh.rotation.y = 0;
      if (mesh.material.map) {
        mesh.material.map.repeat.x = arc / (2 * Math.PI);
        mesh.material.map.offset.x = (1 - arc / (2 * Math.PI)) / 2;
      }
      if (mesh.material.bumpMap) mesh.material.bumpMap.repeat.x *= arc / (2 * Math.PI);
    });
    for (const mesh of [top, bottom]) {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TorusGeometry(R - 0.11, 0.11, 8, 128, arc);
      mesh.geometry.rotateX(Math.PI / 2);
      mesh.geometry.rotateY(arc / 2 - Math.PI / 2);
      mesh.rotation.set(0, 0, 0);
    }
    // Close the two cut ends of the coated strap.
    for (const sign of [-1, 1]) {
      const a = sign * halfSpan;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, cfg.width, 0.025), top.material);
      cap.position.set(Math.sin(a) * (R - 0.11), 0, Math.cos(a) * (R - 0.11));
      cap.rotation.y = a + Math.PI / 2;
      this.collarGroup.add(cap);
    }
    this._addHalfSlip(cfg);
  }

  _addHalfSlip(cfg) {
    const { R, bw, halfSpan, ringAngle } = this._halfSlipLayout(cfg);
    const G = this.collarGroup, bio = cfg.family === 'biothane';
    const knappe = cfg.modelKind === 'halvstrypknappe', adjustable = cfg.modelKind === 'justerbart';
    const visible = cfg.showHardware !== false, thickness = bio ? 0.20 : 0.11;
    const metal = visible ? this.metalMaterial(cfg.hardware) : null;
    const tape = bio ? new THREE.MeshPhysicalMaterial({ color: cfg.bandColor, roughness: 0.62, clearcoat: 0.08, side: THREE.DoubleSide }) : this._webTapeMat(cfg.bandColor, bw);
    const P = (a, r = R + 0.04) => new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r);
    const arc = (a, b, r, n = 32) => Array.from({ length: n + 1 }, (_, i) => P(a + (b - a) * i / n, r));
    const add = (o, name) => {
      o.name = name || o.name;
      o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      G.add(o); return o;
    };
    const ribbon = (pts, name, mat = tape, th = thickness) => add(this._ribbon(pts, bw, th, mat), name);
    const mount = (o, a, r = R + 0.1, name) => { o.position.copy(P(a, r)); o.lookAt(P(a, r + 10)); return add(o, name); };
    const fold = (pos, tangent, mat = tape) => {
      const points = [];
      const out = new THREE.Vector3(tangent.z, 0, -tangent.x);
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * i / 16;
        points.push(pos.clone().addScaledVector(tangent, Math.sin(a) * 0.19).addScaledVector(out, Math.cos(a) * 0.19));
      }
      return ribbon(points, 'half-slip-fold', mat);
    };
    const fastening = (a, r, name) => {
      if (bio) {
        if (!visible) return;
        for (const y of [-bw * 0.25, bw * 0.25]) {
          const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8), metal);
          rivet.scale.z = 0.35; mount(rivet, a, r + 0.06, name); rivet.position.y = y;
        }
      } else {
        const len = Math.min(1.6, bw * 0.55);
        ribbon(arc(a - len / (2 * R), a + len / (2 * R), r), name,
          this._stitchMat(cfg.bandColor, bw, len), 0.005);
      }
    };
    // The hardware is optional in the preview; keep the same open body and control band.
    const guideOffset = 0.54;
    for (const sign of [-1, 1]) {
      const aMain = sign * (ringAngle - guideOffset / R);
      ribbon(arc(sign * (halfSpan - 0.15 / R), aMain, R + 0.04), 'half-slip-end-tab');
      ribbon(arc(aMain, aMain - sign * 1.5 / R, R - 0.15), 'half-slip-return-tab');
      fold(P(aMain, R - 0.05), new THREE.Vector3(Math.cos(aMain), 0, -Math.sin(aMain)).multiplyScalar(sign));
      fastening(aMain - sign * 0.75 / R, R + 0.105, bio ? 'half-slip-rivet' : 'half-slip-stitch');
      if (visible) {
        const ring = hardwareAsset('half-slip-ring', bw, metal) || new THREE.Mesh(new THREE.TorusGeometry(bw / 2 + 0.28, 0.13, 12, 48), metal);
        mount(ring, sign * ringAngle, R - 0.05, 'half-slip-guide-ring');
      }
    }
    const aControl = ringAngle + guideOffset / R;
    ribbon(arc(aControl, 2 * Math.PI - aControl, R - 0.12), 'half-slip-inner-bridge');
    // A relaxed compact loop; no long, pointed triangle extending behind the collar.
    const depth = knappe ? Math.max(4.4, bw * 1.5) : 2.0 + bw * 0.45;
    const tipZ = -R - depth, gap = 0.22;
    for (const sign of [-1, 1]) {
      const a = sign * aControl;
      const curve = new THREE.CatmullRomCurve3([
        P(a, R + 0.10), P(a + sign * 0.5 / R, R + 0.17),
        new THREE.Vector3(sign * (bw * 0.48 + 0.55), -0.08, -R - depth * 0.58),
        new THREE.Vector3(sign * gap, -0.05, tipZ),
      ], false, 'centripetal');
      if (knappe && sign > 0 && visible) {
        const buckle = hardwareAsset('side-release', bw, this._plasticMat()) || super.makeSideRelease(bw);
        const length = curve.getLength(), halfLength = 2.10 * bw / 3;
        const mid = 0.53, start = Math.max(0.05, mid - halfLength / length), end = Math.min(0.95, mid + halfLength / length);
        const segment = (a, b) => Array.from({ length: 25 }, (_, i) => curve.getPointAt(a + (b - a) * i / 24));
        ribbon(segment(0, start), 'half-slip-buckle-feed'); ribbon(segment(end, 1), 'half-slip-buckle-return');
        const p = curve.getPointAt(mid), t = curve.getTangentAt(mid);
        buckle.position.copy(p);
        buckle.lookAt(p.clone().add(new THREE.Vector3(t.z, 0, -t.x)));
        add(buckle, 'half-slip-release');
      } else ribbon(curve.getSpacedPoints(56), 'half-slip-control-band');
      // Reinforced end around the leash ring.
      const end = curve.getPointAt(1), near = curve.getPointAt(0.79);
      const folded = offset => Array.from({ length: 17 }, (_, i) => curve.getPointAt(0.79 + 0.21 * i / 16).add(new THREE.Vector3(sign * offset, 0, 0)));
      ribbon(folded(0.12), 'half-slip-leash-fold');
      if (!bio) ribbon(folded(0.18),
        'half-slip-leash-stitch', this._stitchMat(cfg.bandColor, bw, near.distanceTo(end)), 0.005);
      else if (visible) {
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8), metal);
        rivet.scale.x = 0.4; rivet.position.copy(curve.getPointAt(0.86)); rivet.position.x += sign * 0.16;
        add(rivet, 'half-slip-rivet');
      }
    }
    fold(new THREE.Vector3(0, -0.05, tipZ), new THREE.Vector3(0, 0, -1));
    if (visible) {
      const d = hardwareAsset('d-ring', bw, metal) || new THREE.Mesh(new THREE.TorusGeometry(bw / 2 + 0.2, 0.13, 12, 48), metal);
      d.rotation.y = -Math.PI / 2;
      d.position.set(-0.34 * bw / 3, -0.05, tipZ);
      add(d, 'half-slip-leash-ring');
    }
    if (adjustable) {
      // Adjustment belongs on the main strap, as in the Queen reference photo.
      const a = -halfSpan + (bw * 0.65 + 1.15) / R;
      ribbon(arc(a - bw * 0.45 / R, a + bw * 0.9 / R, R + 0.17), 'half-slip-adjustment-overlap');
      if (visible) {
        mount(this.makeTriGlide(cfg.width, metal), a, R + 0.18, 'half-slip-adjuster');
        const keeper = hardwareAsset('split-keeper', bw, metal) || hardwareAsset('keeper', bw, metal);
        if (keeper) mount(keeper, halfSpan - 0.35 / R, R + 0.08, 'half-slip-lining-keeper');
      }
    }
    G.userData.halfSlipVariant = cfg.modelKind;
  }

  _finishBiothane(cfg) {
    if (!this._coatingGrain) {
      const N = 256, c = document.createElement('canvas');
      c.width = c.height = N;
      const ctx = c.getContext('2d'), pixels = ctx.createImageData(N, N);
      const noise = fbm(rng(43), 40, 3);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        const v = 128 + (noise(x / N, y / N) - 0.5) * 100;
        pixels.data.set([v, v, v, 255], i);
      }
      ctx.putImageData(pixels, 0, 0);
      this._coatingGrain = c;
    }
    for (const mesh of this.collarGroup.children.slice(0, 2)) {
      const grain = new THREE.CanvasTexture(this._coatingGrain);
      grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
      grain.repeat.set(Math.max(1, Math.round(cfg.circumference / 2)), cfg.width / 2);
      grain.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      mesh.material.bumpMap = grain;
      mesh.material.bumpScale = 0.009;
      mesh.receiveShadow = true;
    }
    if (cfg.modelKind === 'stallbart') {
      const W = 2048, H = Math.max(128, Math.round(W * cfg.width / cfg.circumference));
      const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
      const ctx = mask.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      // Holes run along the free strap beyond the roller buckle (back of collar).
      for (const cm of [1.2, 2.5, 3.8, 5.1]) {
        ctx.beginPath(); ctx.ellipse(cm / cfg.circumference * W, H / 2,
          0.115 / cfg.circumference * W, 0.115 / cfg.width * H, 0, 0, Math.PI * 2); ctx.fill();
      }
      this.collarGroup.children.slice(0, 2).forEach((mesh, i) => {
        const tex = new THREE.CanvasTexture(mask); tex.wrapS = THREE.RepeatWrapping;
        if (i === 1) tex.offset.x = 0.5;
        mesh.material.alphaMap = tex; mesh.material.alphaTest = 0.5;
      });
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
    const thread = lum > 0.5 ? col.clone().lerp(new THREE.Color('#000'), 0.14) : col.clone().lerp(new THREE.Color('#fff'), 0.10);
    const W = c.width, H = c.height, m = Math.min(W, H) * 0.14;
    ctx.strokeStyle = thread.getStyle(); ctx.lineWidth = Math.max(2, H * 0.008); ctx.lineCap = 'round';
    ctx.setLineDash([H * 0.035, H * 0.018]);
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
      const source = o.geometry.clone();
      const geo = ['ExtrudeGeometry', 'BoxGeometry'].includes(source.type) ? this._subdivideHardware(source) : source;
      geo.applyMatrix4(m);
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
        color: '#202124', roughness: 0.62, metalness: 0, bumpMap: t, bumpScale: 0.012,
        clearcoat: 0.08, clearcoatRoughness: 0.6, envMapIntensity: 0.75,
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
      color: finish.hex, metalness: finish.metalness, roughness: Math.min(1, finish.roughness * 1.6),
      roughnessMap: this._brush, envMapIntensity: 1.0,
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

  // Förtäta långa trianglar före välvning. Annars blir plana lock
  // diagonala facetter när ett helt spänne böjs runt halsbandet.
  _subdivideHardware(geo, maxEdge = this.lite ? 0.85 : 0.55) {
    const source = geo.index ? geo.toNonIndexed() : geo;
    const attrs = Object.entries(source.attributes);
    const output = Object.fromEntries(attrs.map(([name]) => [name, []]));
    const vertex = i => Object.fromEntries(attrs.map(([name, attr]) =>
      [name, Array.from(attr.array.slice(i * attr.itemSize, (i + 1) * attr.itemSize))]));
    const midpoint = (a, b) => Object.fromEntries(attrs.map(([name]) =>
      [name, a[name].map((v, k) => (v + b[name][k]) / 2)]));
    const distance = (a, b) => a.position.reduce((sum, v, k) => sum + (v - b.position[k]) ** 2, 0);
    const split = (a, b, c, depth) => {
      const edges = [distance(a, b), distance(b, c), distance(c, a)];
      const longest = Math.max(...edges);
      if (longest > maxEdge * maxEdge && depth < 10) {
        if (edges.indexOf(longest) === 1) return split(b, c, a, depth);
        if (edges.indexOf(longest) === 2) return split(c, a, b, depth);
        const m = midpoint(a, b);
        split(a, m, c, depth + 1); split(m, b, c, depth + 1);
      } else for (const v of [a, b, c]) for (const [name] of attrs) output[name].push(...v[name]);
    };
    for (let i = 0; i < source.attributes.position.count; i += 3) split(vertex(i), vertex(i + 1), vertex(i + 2), 0);
    const result = new THREE.BufferGeometry();
    for (const [name, attr] of attrs) result.setAttribute(name, new THREE.Float32BufferAttribute(output[name], attr.itemSize));
    if (source !== geo) source.dispose();
    geo.dispose();
    return result;
  }

  // Profilera en plastdel: tunnare mot bandänden, lätt välvd ovansida.
  _shapeZ(geo, x0, x1, T, thinEnd, taper, dome, H) {
    geo = this._subdivideHardware(geo);
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
    const key = this._bandColor + (this._isBio ? ":coated" : ":woven");
    if (this._strapKey !== key) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d'), col = new THREE.Color(this._bandColor);
      ctx.fillStyle = this._bandColor; ctx.fillRect(0, 0, 256, 256);
      if (!this._isBio) {
      this.paintWebbing(ctx, 0, 0, 256, 256, this._bandColor);
      ctx.strokeStyle = col.clone().lerp(new THREE.Color('#000'), 0.28).getStyle();
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.setLineDash([7, 5]);
      ctx.strokeRect(36, 24, 184, 208);
      ctx.beginPath(); ctx.moveTo(36, 24); ctx.lineTo(220, 232); ctx.moveTo(220, 24); ctx.lineTo(36, 232); ctx.stroke();
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      this._strapM = new THREE.MeshPhysicalMaterial({ map: t, roughness: this._isBio ? 0.62 : 0.9, sheen: this._isBio ? 0 : 0.25, sheenRoughness: 0.55, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3), envMapIntensity: 0.35 });
      this._strapPlain = new THREE.MeshPhysicalMaterial({ color: this._bandColor, roughness: this._isBio ? 0.62 : 0.9, sheen: this._isBio ? 0 : 0.25, sheenRoughness: 0.75, sheenColor: col.clone().lerp(new THREE.Color('#fff'), 0.3), envMapIntensity: 0.35, side: THREE.DoubleSide });
      this._strapKey = key;
    }
    return [this._strapM, this._strapPlain];
  }
  // band som viks runt en stång längs Y vid (x,z) och fortsätter mot +dir i x
  _strapWrap(g, x, z, rBar, len, h, dir, stitched = true) {
    const [mStitch, mPlain] = this._strapMat();
    const th = 0.065, rw = rBar + th / 2 + 0.01;
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
    const assetWidth = this._bandW || width;
    const asset = hardwareAsset('side-release', assetWidth, this._plasticMat());
    if (asset) {
      const straps = new THREE.Group(), scale = assetWidth / 3;
      for (const sign of [-1, 1]) this._strapWrap(straps, sign * 2.43 * scale,
        0.24 * scale, 0.12 * scale, assetWidth * 0.42, assetWidth, sign, !this._isBio);
      if (this._bendR) this._bendGroup(straps, this._bendR);
      asset.add(straps);
      return asset;
    }
    const g = new THREE.Group(), mat = this._plasticMat();
    // Måtten utgår från bandet som träs genom spännet, inte fodrets bredd.
    const bw = this._bandW || width;
    const H = bw + 0.64, T = Math.min(0.85, bw * 0.16 + 0.23);
    const L = bw * 1.85, seam = -bw * 0.18, gap = 0.035;
    const x0 = -L / 2, x1 = L / 2, slotW = 0.34;
    const slotH = bw + 0.06, bar = 0.22, bevel = 0.045;
    const leftSlot = x0 + bar, rightSlot = x1 - bar - slotW;
    const body = (start, end, slot, male) => {
      const shape = this._rr(start, -H / 2, end - start, H, 0.22);
      shape.holes.push(this._hole(slot, -slotH / 2, slotW, slotH, 0.08));
      // Genomgående fönster för de två sidospärrarna i hondelen.
      if (!male) for (const sign of [-1, 1]) {
        shape.holes.push(this._hole(seam + bw * 0.12,
          sign > 0 ? H / 2 - 0.35 : -H / 2 + 0.12,
          bw * 0.42, 0.23, 0.07));
      }
      const geo = this._shapeZ(this._extr(shape, T, bevel), start, end,
        T, male ? -1 : 1, 0.20, 0.06, H);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = 0.12;
      g.add(mesh);
    };
    body(x0, seam - gap, leftSlot, true);
    body(seam + gap, x1, rightSlot, false);
    // Låst läge: armarna ligger inne i huset, med endast tryckytorna synliga.
    for (const sign of [-1, 1]) {
      const button = new THREE.Mesh(this._extr(this._rr(seam + bw * 0.13,
        sign > 0 ? H / 2 - 0.32 : -H / 2 + 0.15,
        bw * 0.39, 0.17, 0.06), 0.12, 0.025), mat);
      button.position.z = T + 0.03;
      g.add(button);
      for (let i = 0; i < 4; i++) {
        const rib = new THREE.Mesh(this._extr(this._rr(
          seam + bw * (0.18 + i * 0.085), -0.065, 0.035, 0.13, 0.014),
          0.035, 0.012, 8), mat);
        rib.position.set(0, sign * (H / 2 - 0.235), T + 0.145);
        g.add(rib);
      }
    }
    // Bandet går runt ändstängerna och viks tillbaka med sydda ändar.
    const barZ = 0.20;
    this._strapWrap(g, x0 + bar / 2, barZ, bar / 2, bw * 0.48, bw, -1);
    this._strapWrap(g, x1 - bar / 2, barZ, bar / 2, bw * 0.48, bw, 1);
    if (this._bendR) this._bendGroup(g, this._bendR);
    g.name = 'closed-side-release-buckle';
    return g;
  }

  makeDRing(width, metal, bandHex, riveted = false) {
    if (!this.realistic) return super.makeDRing(width, metal, bandHex, riveted);
    const assetWidth = this._bandW || width;
    const asset = hardwareAsset('d-ring', assetWidth, metal);
    if (asset) {
      this._bandColor = bandHex;
      const straps = new THREE.Group(), scale = assetWidth / 3;
      this._strapWrap(straps, 0, 0.34 * scale, 0.145 * scale, assetWidth * 0.58, assetWidth, 1, !riveted);
      if (riveted) for (const sign of [-1, 1]) {
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8), metal);
        rivet.scale.z = 0.4;
        rivet.position.set(assetWidth * 0.42, sign * assetWidth * 0.28, 0.51 * scale + 0.09);
        straps.add(rivet);
      }
      if (this._bendR) this._bendGroup(straps, this._bendR);
      asset.add(straps);
      return asset;
    }
    const g = new THREE.Group();
    width = this._bandW || width;
    const a = width / 2 + 0.12, b = a * 1.2, tube = Math.max(0.12, width * 0.045);
    const path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(new THREE.Vector3(0, -a, 0), new THREE.Vector3(0, a, 0)));
    path.add(new THREE.CubicBezierCurve3(new THREE.Vector3(0, a, 0),
      new THREE.Vector3(-b * 1.32, a, 0), new THREE.Vector3(-b * 1.32, -a, 0), new THREE.Vector3(0, -a, 0)));
    const curve = path;
    const zBar = 0.08 + 0.12 + tube;
    const ring = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, tube, 18, true), metal);
    ring.position.z = zBar;
    // Rak sida under bandhällan; bågen är en sammanhängande metallstång.
    g.add(ring);
    this._bandColor = bandHex;
    this._strapWrap(g, 0, zBar, tube, width * 0.6, width, 1, !riveted);
    if (riveted) {
      for (const sgn of [-1, 1]) {
        const rv = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal);
        rv.rotation.x = Math.PI / 2; rv.position.set(width * 0.42, sgn * a * 0.35, zBar + tube + 0.14);
        g.add(rv);
      }
    }
    if (this._bendR) this._bendGroup(g, this._bendR);
    return g;
  }

  makeTriGlide(width, metal) {
    if (!this.realistic) return super.makeTriGlide(width, metal);
    const assetWidth = this._bandW || width;
    const asset = hardwareAsset('tri-glide', assetWidth, metal);
    if (asset) {
      const straps = new THREE.Group();
      this._strapWrap(straps, 0, 0.23 * assetWidth / 3, 0.14 * assetWidth / 3,
        assetWidth * 0.40, assetWidth, 1, false);
      if (this._bendR) this._bendGroup(straps, this._bendR);
      asset.add(straps);
      return asset;
    }
    width = this._bandW || width;
    const bar = Math.max(0.15, width * 0.055), H = width + 2 * bar + 0.12;
    const W = width * 0.82, slot = (W - 3 * bar) / 2;
    const s = this._rr(-W / 2, -H / 2, W, H, bar * 1.2);
    const hh = H - 2 * bar;
    s.holes.push(this._hole(-W / 2 + bar, -hh / 2, slot, hh, slot * 0.45));
    s.holes.push(this._hole(-W / 2 + 2 * bar + slot, -hh / 2, slot, hh, slot * 0.45));
    const m = new THREE.Mesh(this._extr(s, bar * 1.4, bar * 0.45, 32), metal);
    m.position.z = 0.08;
    const g = new THREE.Group(); g.add(m);
    this._strapWrap(g, 0, 0.08 + bar * 0.7, bar * 0.65, width * 0.52, width, 1, false);
    if (this._bendR) this._bendGroup(g, this._bendR);
    return g;
  }

  makeMetalBuckle(width, metal) {
    if (!this.realistic) return super.makeMetalBuckle(width, metal);
    const assetWidth = this._bandW || width;
    const asset = hardwareAsset('roller-buckle', assetWidth, metal);
    if (asset) {
      const scale = assetWidth / 3, straps = new THREE.Group();
      this._strapWrap(straps, -1.16 * scale, 0.32 * scale, 0.145 * scale,
        assetWidth * 0.5, assetWidth, -1, false);
      if (this._bendR) this._bendGroup(straps, this._bendR);
      asset.add(straps);
      const keeper = hardwareAsset('keeper', assetWidth, metal);
      if (keeper) {
        const x = 2.4 * scale, radius = this._bendR || 7;
        keeper.position.set(x, 0, -x * x / (2 * radius) - 0.12);
        keeper.rotation.y = x / radius;
        asset.add(keeper);
      }
      return asset;
    }
    width = this._bandW || width;
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
    // Separata ändkragar på rullen och en led runt tornens infästning.
    for (const sign of [-1, 1]) {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(tube * 1.35, tube * 0.22, 8, 24), metal);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(w / 2, sign * h * 0.31, tube + 0.02);
      g.add(collar);
    }
    const hinge = new THREE.Mesh(new THREE.TorusGeometry(tube * 1.18, tube * 0.35, 10, 28), metal);
    hinge.rotation.x = Math.PI / 2;
    hinge.position.set(-w * 0.1, 0, tube + 0.02);
    g.add(hinge);
    this._strapWrap(g, -w / 2, tube + 0.02, tube, width * 0.55, width, -1, false);
    return g;
  }

  // kamerapresets med mjuk övergång
  setView(name) {
    const cfg = this._lastCfg; if (!cfg) return;
    const R = cfg.circumference / (2 * Math.PI), y = this.collarGroup.position.y;
    const views = {
      oversikt: [[0, 12, 34], [0, 2, 0]],
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
