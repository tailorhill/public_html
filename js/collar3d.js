import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { drawSymbol, symbolAspect } from './symbols.js';

// Skala: 1 enhet = 1 cm.

export class CollarViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();

    // miljökarta så att metallbeslagen får reflektioner
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);
    this.camera.position.set(0, 9, 34);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 14;
    this.controls.maxDistance = 70;
    this.controls.maxPolarAngle = Math.PI * 0.72;
    this.controls.target.set(0, 0, 0);

    // Ljus
    const hemi = new THREE.HemisphereLight(0xf4f2ee, 0x8c857c, 1.1);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(12, 22, 18);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -20; key.shadow.camera.right = 20;
    key.shadow.camera.top = 20; key.shadow.camera.bottom = -20;
    key.shadow.radius = 6;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7);
    fill.position.set(-16, 8, -10);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff4e0, 0.5);
    rim.position.set(0, 6, -22);
    this.scene.add(rim);

    // Golvskugga
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(60, 48),
      new THREE.ShadowMaterial({ opacity: 0.16 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.collarGroup = new THREE.Group();
    this.scene.add(this.collarGroup);

    this.texCanvas = document.createElement('canvas');

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth, h = parent.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._animate);
  }

  // ---------------------------------------------------------------- textur
  makeBandTexture(cfg) {
    const circumference = cfg.circumference;
    const W = 4096;
    const pxPerCm = W / circumference;
    const H = Math.max(256, Math.round(cfg.width * pxPerCm));
    const c = this.texCanvas;
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    ctx.save();

    const isCotton = cfg.family === 'cotton';
    let bandTop = 0, bandBottom = H;

    if (isCotton) {
      // Fodret sticker ut ovan/under bomullsbandet.
      const edgeFrac = Math.max(0.09, (cfg.width - cfg.bandWidthCm) / 2 / cfg.width);
      const e = Math.round(H * edgeFrac);
      bandTop = e; bandBottom = H - e;
      this.paintLiningInto(ctx, 0, 0, W, H, cfg.lining, pxPerCm);
      this.paintWebbing(ctx, 0, bandTop, W, bandBottom - bandTop, cfg.bandColor);
      // söm: två streckade stygnrader längs bandets kanter
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = Math.max(1.5, H * 0.008);
      for (const y of [bandTop + H * 0.03, bandBottom - H * 0.03]) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (cfg.fullGlitter && cfg.glitterColor) {
        this.paintGlitterBand(ctx, 0, bandTop, W, bandBottom - bandTop, cfg.glitterColor);
      }
    } else {
      // BioThane: slät gummerad yta
      this.paintBiothane(ctx, W, H, cfg.bandColor);
      if (cfg.fullGlitter && cfg.glitterColor) {
        const e = Math.round(H * 0.12);
        bandTop = e; bandBottom = H - e;
        this.paintGlitterBand(ctx, 0, bandTop, W, bandBottom - bandTop, cfg.glitterColor, true);
      }
    }

    // Text + symboler på framsidan (u=0.5 => canvasmitt)
    this.paintTextBlock(ctx, W, H, bandTop, bandBottom, cfg);

    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  paintWebbing(ctx, x, y, w, h, hex) {
    ctx.fillStyle = hex;
    ctx.fillRect(x, y, w, h);
    // vävmönster: diagonala "korn"
    const col = new THREE.Color(hex);
    const light = col.clone().lerp(new THREE.Color('#ffffff'), 0.16).getStyle();
    const dark = col.clone().lerp(new THREE.Color('#000000'), 0.22).getStyle();
    const step = Math.max(6, h / 14);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    for (let row = 0; row * step < h; row++) {
      const yy = y + row * step;
      const offset = (row % 2) * step * 0.9;
      for (let xx = x - step; xx < x + w + step; xx += step * 1.8) {
        ctx.fillStyle = row % 2 ? light : dark;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(xx + offset, yy + step / 2, step * 0.72, step * 0.30, row % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  paintBiothane(ctx, w, h, hex) {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, w, h);
    // svag lädernoise + horisontell glans
    const col = new THREE.Color(hex);
    const light = col.clone().lerp(new THREE.Color('#ffffff'), 0.25);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0.18)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.8, 'rgba(0,0,0,0.10)');
    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = light.getStyle();
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Materialtyp för ett foder – styr både målning och materialparametrar.
  liningKind(lining) {
    if (!lining) return 'softshell';
    if (lining.leather) return 'leather';
    if (lining.metallic) return 'metallic';
    return lining.pattern ? 'patterned' : 'softshell';
  }

  // Ritar valt fodermaterial realistiskt i regionen (x,y,w,h).
  // scale = pixlar per cm, så mönster/narv får samma fysiska storlek överallt.
  paintLiningInto(ctx, x, y, w, h, lining, scale = 90) {
    const col = new THREE.Color(lining.hex);
    const light = a => col.clone().lerp(new THREE.Color('#ffffff'), a).getStyle();
    const dark = a => col.clone().lerp(new THREE.Color('#000000'), a).getStyle();
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = lining.hex;
    ctx.fillRect(x, y, w, h);
    const kind = this.liningKind(lining);

    if (kind === 'leather') {
      // flammighet: mjuka fläckar (starkare för "brun flammig")
      const blotch = lining.id === 'lader-brunflammig' ? 0.3 : 0.09;
      for (let i = 0; i < 24; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        const r = scale * (0.5 + Math.random() * 1.3);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, Math.random() < 0.5 ? light(0.18) : dark(0.3));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = blotch * (0.4 + Math.random() * 0.6);
        ctx.fillStyle = g;
        ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }
      // narv: fina korn
      ctx.globalAlpha = 0.13;
      const grains = Math.min(16000, (w * h) / 40);
      for (let i = 0; i < grains; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? light(0.12) : dark(0.16);
        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1.4, 1.4);
      }
      // veck: slingrande mörka linjer med ljus kant
      ctx.lineCap = 'round';
      const creases = Math.max(8, Math.round((w * h) / (scale * scale) * 0.9));
      for (let i = 0; i < creases; i++) {
        let px = x + Math.random() * w, py = y + Math.random() * h;
        let a = Math.random() * Math.PI * 2;
        const path = [[px, py]];
        for (let s = 0; s < 3 + Math.random() * 4; s++) {
          a += (Math.random() - 0.5) * 1.3;
          px += Math.cos(a) * scale * 0.35;
          py += Math.sin(a) * scale * 0.35;
          path.push([px, py]);
        }
        const draw = () => {
          ctx.beginPath();
          path.forEach(([qx, qy], j) => j ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy));
          ctx.stroke();
        };
        ctx.strokeStyle = dark(0.32); ctx.globalAlpha = 0.25; ctx.lineWidth = scale * 0.02; draw();
        ctx.save(); ctx.translate(scale * 0.012, scale * 0.012);
        ctx.strokeStyle = light(0.28); ctx.globalAlpha = 0.12; ctx.lineWidth = scale * 0.012; draw();
        ctx.restore();
      }
    } else if (kind === 'metallic') {
      // skimmer: breda diagonala ljusband
      const g = ctx.createLinearGradient(x, y, x + w * 0.9, y + h);
      const stops = [[0, 0.05], [0.14, 0.3], [0.25, 0.0], [0.4, 0.22], [0.52, -0.14],
        [0.66, 0.28], [0.78, 0.0], [0.9, 0.2], [1, -0.08]];
      for (const [p, v] of stops) {
        g.addColorStop(p, v >= 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`);
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      // skrynkelstråk: tunna ljusa streck
      ctx.lineCap = 'round';
      const streaks = Math.max(14, Math.round((w * h) / (scale * scale) * 2));
      for (let i = 0; i < streaks; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        const a = -0.5 + (Math.random() - 0.5) * 1.4, len = scale * (0.3 + Math.random() * 0.9);
        ctx.strokeStyle = Math.random() < 0.6 ? light(0.5) : dark(0.3);
        ctx.globalAlpha = 0.10 + Math.random() * 0.14;
        ctx.lineWidth = scale * (0.01 + Math.random() * 0.02);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + Math.cos(a + 0.3) * len / 2, py + Math.sin(a + 0.3) * len / 2,
          px + Math.cos(a) * len, py + Math.sin(a) * len);
        ctx.stroke();
      }
    } else if (kind === 'patterned') {
      this.paintPattern(ctx, x, y, w, h, lining, scale);
    } else {
      // softshell: matt fintrådig textil
      ctx.globalAlpha = 0.06;
      const step = Math.max(2, scale * 0.03);
      for (let yy = y; yy < y + h; yy += step) {
        ctx.fillStyle = (yy / step) % 2 < 1 ? light(0.1) : dark(0.12);
        ctx.fillRect(x, yy, w, 1);
      }
      ctx.globalAlpha = 0.05;
      const fibers = Math.min(9000, (w * h) / 70);
      for (let i = 0; i < fibers; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? light(0.16) : dark(0.16);
        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1, 2 + Math.random() * 3);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  paintPattern(ctx, x, y, w, h, lining, scale) {
    const c2 = lining.hex2 || '#ffffff';
    const col2 = new THREE.Color(c2);
    const light2 = col2.clone().lerp(new THREE.Color('#ffffff'), 0.3).getStyle();
    ctx.fillStyle = c2;
    if (lining.pattern === 'stripes') {
      const sw = scale * 0.14;
      const extra = [c2, light2, new THREE.Color(lining.hex).lerp(new THREE.Color('#000'), 0.3).getStyle()];
      let i = 0;
      for (let xx = x; xx < x + w; xx += sw * 2) {
        ctx.fillStyle = extra[i++ % extra.length];
        ctx.fillRect(xx, y, sw, h);
      }
    } else if (lining.pattern === 'zigzag') {
      ctx.strokeStyle = c2;
      ctx.lineWidth = scale * 0.09;
      ctx.lineJoin = 'round';
      const step = scale * 0.22, amp = scale * 0.11;
      for (let yy = y - amp; yy < y + h + amp; yy += scale * 0.3) {
        ctx.beginPath();
        for (let xx = x, i = 0; xx <= x + w + step; xx += step, i++) {
          const py = yy + (i % 2 ? amp : -amp);
          i === 0 ? ctx.moveTo(xx, py) : ctx.lineTo(xx, py);
        }
        ctx.stroke();
      }
    } else if (lining.pattern === 'leopard') {
      // rosetter: brutna bågar kring en mörk kärna
      const n = Math.max(10, (w * h) / (scale * scale) * 6);
      for (let i = 0; i < n; i++) {
        const px = x + Math.random() * w, py = y + Math.random() * h;
        const r = scale * (0.08 + Math.random() * 0.09);
        ctx.strokeStyle = c2;
        ctx.lineWidth = r * 0.75;
        for (let s = 0; s < 2 + Math.random() * 2; s++) {
          const a0 = Math.random() * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(px, py, r, a0, a0 + 1.2 + Math.random() * 1.4);
          ctx.stroke();
        }
        if (Math.random() < 0.5) {
          ctx.fillStyle = new THREE.Color(lining.hex).lerp(col2, 0.35).getStyle();
          ctx.beginPath(); ctx.arc(px, py, r * 0.45, 0, 7); ctx.fill();
        }
      }
    } else if (lining.pattern === 'fans') {
      // solfjädrar i förskjutna rader
      const fr = scale * 0.18;
      let row = 0;
      for (let yy = y; yy < y + h + fr; yy += fr * 0.95, row++) {
        for (let xx = x - fr + (row % 2 ? fr : 0); xx < x + w + fr; xx += fr * 2) {
          ctx.fillStyle = c2;
          ctx.beginPath();
          ctx.moveTo(xx, yy);
          ctx.arc(xx, yy, fr * 0.85, Math.PI, Math.PI * 2);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = lining.hex;
          ctx.lineWidth = 1;
          for (const a of [-0.6, -0.3, 0, 0.3, 0.6]) {
            ctx.beginPath();
            ctx.moveTo(xx, yy);
            ctx.lineTo(xx + Math.sin(a) * fr * 0.85, yy - Math.cos(a) * fr * 0.85);
            ctx.stroke();
          }
        }
      }
    } else {
      // floral/dots: små blommor + prickar
      const spacing = scale * 0.28;
      let row = 0;
      for (let yy = y + spacing / 2; yy < y + h; yy += spacing * 0.9, row++) {
        for (let xx = x + spacing / 2 + (row % 2 ? spacing / 2 : 0); xx < x + w; xx += spacing) {
          const r = spacing * 0.14;
          if ((row + Math.round(xx / spacing)) % 3 === 0) {
            ctx.fillStyle = light2;
            ctx.beginPath(); ctx.arc(xx, yy, r * 0.5, 0, 7); ctx.fill();
            continue;
          }
          ctx.fillStyle = c2;
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(xx + Math.cos(a) * r, yy + Math.sin(a) * r, r * 0.75, 0, 7);
            ctx.fill();
          }
          ctx.fillStyle = light2;
          ctx.beginPath(); ctx.arc(xx, yy, r * 0.55, 0, 7); ctx.fill();
        }
      }
    }
  }

  // Sömlös fodertextur för halsbandets insida. Kvadraten motsvarar 5x5 cm.
  makeLiningTexture(lining) {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    this.paintLiningInto(ctx, 0, 0, size, size, lining, size / 5);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Materialparametrar per fodertyp.
  liningMaterialProps(lining) {
    switch (this.liningKind(lining)) {
      case 'leather':   return { roughness: 0.52, metalness: 0.0, bumpScale: 2.2, envMapIntensity: 0.6 };
      case 'metallic':  return { roughness: 0.3, metalness: 0.55, bumpScale: 1.2, envMapIntensity: 1.0 };
      case 'patterned': return { roughness: 0.88, metalness: 0.0, bumpScale: 0.8, envMapIntensity: 0.25 };
      default:          return { roughness: 0.95, metalness: 0.0, bumpScale: 1.0, envMapIntensity: 0.2 };
    }
  }

  paintGlitterBand(ctx, x, y, w, h, hex, insetEdges = false) {
    const col = new THREE.Color(hex);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = hex;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    this.sprinkle(ctx, x, y, w, h, col, 2.6);
    if (insetEdges) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
    ctx.restore();
  }

  sprinkle(ctx, x, y, w, h, baseCol, density = 1.6) {
    const light = baseCol.clone().lerp(new THREE.Color('#ffffff'), 0.75).getStyle();
    const mid = baseCol.clone().lerp(new THREE.Color('#ffffff'), 0.35).getStyle();
    const dark = baseCol.clone().lerp(new THREE.Color('#000000'), 0.45).getStyle();
    const n = Math.round((w * h) / 620 * density);
    for (let i = 0; i < n; i++) {
      const px = x + Math.random() * w, py = y + Math.random() * h;
      const r = 0.6 + Math.random() * 1.7;
      ctx.fillStyle = Math.random() < 0.35 ? light : Math.random() < 0.6 ? mid : dark;
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    // några stjärnglimtar
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < n / 26; i++) {
      const px = x + Math.random() * w, py = y + Math.random() * h;
      const r = 1.6 + Math.random() * 2.4;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(px - r, py); ctx.lineTo(px, py - r * 0.35); ctx.lineTo(px + r, py);
      ctx.lineTo(px, py + r * 0.35);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  fillStyleFor(ctx, colorObj, x, y, w, h) {
    if (!colorObj.special) return colorObj.hex;
    if (colorObj.special === 'rainbow' || colorObj.special === 'pastelrainbow') {
      const g = ctx.createLinearGradient(x, y, x + w, y);
      const cols = colorObj.special === 'rainbow'
        ? ['#e4342c', '#f09022', '#ecd51b', '#3fae49', '#2e6db4', '#8a3f9e']
        : ['#f2a1b4', '#f5cf9c', '#f7f0a8', '#a8dcb2', '#a5c8ec', '#cbaede'];
      cols.forEach((cc, i) => g.addColorStop(i / (cols.length - 1), cc));
      return g;
    }
    if (colorObj.special === 'metal') {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, new THREE.Color(colorObj.hex).lerp(new THREE.Color('#ffffff'), 0.5).getStyle());
      g.addColorStop(0.45, colorObj.hex);
      g.addColorStop(0.55, new THREE.Color(colorObj.hex).lerp(new THREE.Color('#000000'), 0.25).getStyle());
      g.addColorStop(1, new THREE.Color(colorObj.hex).lerp(new THREE.Color('#ffffff'), 0.35).getStyle());
      return g;
    }
    return colorObj.hex; // reflex m.m.
  }

  // Ritar 1–2 texter + symbol. cfg.texts = [{text, font, color}], cfg.textLayout:
  //   'rad'    – texterna efter varandra på samma rad
  //   'rader'  – två rader ovanför varandra
  //   'dubbel' – dubbeltext: text 2 läggs ovanpå text 1
  paintTextBlock(ctx, W, H, bandTop, bandBottom, cfg) {
    const texts = (cfg.texts || []).filter(t => t.text && t.text.trim());
    const hasSymbol = cfg.symbol && cfg.symbol !== 'ingen';
    if (!texts.length && !hasSymbol) return;

    const bandH = bandBottom - bandTop;
    const cyMid = bandTop + bandH / 2;
    const layout = texts.length > 1 ? (cfg.textLayout || 'rad') : 'rad';

    const scratch = document.createElement('canvas');
    scratch.width = W; scratch.height = H;
    const sctx = scratch.getContext('2d');

    const fontStr = (f, size) => `${f.italic ? 'italic ' : ''}${f.weight} ${size}px ${f.css}`;
    const disp = t => (t.font.caps ? t.text.trim().toUpperCase() : t.text.trim());
    const measure = (t, size) => {
      sctx.font = fontStr(t.font, size);
      return sctx.measureText(disp(t)).width;
    };

    // grundstorlekar per layout, skalade med vald textstorlek (max = bandhöjden)
    let sizes;
    if (layout === 'rader' && texts.length > 1) sizes = [bandH * 0.4, bandH * 0.4];
    else if (layout === 'dubbel' && texts.length > 1) sizes = [bandH * 0.62, bandH * 0.46];
    else sizes = texts.map(() => bandH * 0.54);
    sizes = sizes.map((s, i) => Math.min(s * (texts[i].sizeK || 1), bandH * 0.82));

    // blockbredd (utan symbol)
    const blockWidth = () => {
      const ws = texts.map((t, i) => measure(t, sizes[i]));
      if (layout === 'rad' && texts.length > 1) return ws[0] + sizes[0] * 0.5 + ws[1];
      return Math.max(...ws, 0);
    };

    // krymp om texten blir för bred för framsidan
    const maxW = W * 0.42;
    let bw = blockWidth();
    if (bw > maxW) {
      const k = maxW / bw;
      sizes = sizes.map(s => s * k);
      bw = blockWidth();
    }

    const symSize = bandH * 0.5;
    const symW = hasSymbol ? symSize * symbolAspect(cfg.symbol) : 0;
    const gap = (texts.length && hasSymbol) ? bandH * 0.24 : 0;

    let items = []; // [kind]
    if (hasSymbol && !texts.length) items = [['sym']];
    else if (hasSymbol && cfg.symbolPlacement === 'fore') items = [['sym'], ['blk']];
    else if (hasSymbol && cfg.symbolPlacement === 'bada') items = [['sym'], ['blk'], ['sym']];
    else if (hasSymbol) items = [['blk'], ['sym']];
    else items = [['blk']];

    let total = 0;
    for (const [k] of items) total += (k === 'blk' ? bw : symW);
    total += gap * (items.length - 1);

    // en text med ev. glitter/reflex begränsat till tecknen
    const drawUnit = (t, size, cx, cy, colorOverride, targetOverride) => {
      const w = measure(t, size);
      const x = cx - w / 2;
      const wantsFx = !colorOverride && (t.color.glitter || t.color.special === 'reflex');
      const target = targetOverride || (wantsFx ? sctx : ctx);
      if (target === sctx && !targetOverride) sctx.clearRect(0, 0, W, H);
      target.font = fontStr(t.font, size);
      target.textBaseline = 'middle';
      const col = colorOverride || t.color;
      target.fillStyle = this.fillStyleFor(target, col, x, cy - size / 2, w, size);
      target.fillText(disp(t), x, cy);
      if (target === sctx && !targetOverride) {
        sctx.save();
        sctx.globalCompositeOperation = 'source-atop';
        if (t.color.glitter) {
          this.sprinkle(sctx, x - 8, cy - size * 0.75, w + 16, size * 1.5, new THREE.Color(t.color.hex), 2.2);
        } else { // reflex
          sctx.fillStyle = 'rgba(255,255,255,0.5)';
          for (let i = 0; i < 300; i++) {
            sctx.fillRect(x + Math.random() * w, cy - size * 0.6 + Math.random() * size * 1.2, 1.5, 1.5);
          }
        }
        sctx.restore();
        ctx.drawImage(scratch, 0, 0);
      }
    };

    // ritar textblocket centrerat kring (cx, cyMid)
    const drawBlock = (cx, colorOverride, targetOverride) => {
      if (!texts.length) return;
      if (layout === 'rader' && texts.length > 1) {
        drawUnit(texts[0], sizes[0], cx, bandTop + bandH * 0.28, colorOverride, targetOverride);
        drawUnit(texts[1], sizes[1], cx, bandTop + bandH * 0.73, colorOverride, targetOverride);
      } else if (layout === 'dubbel' && texts.length > 1) {
        drawUnit(texts[0], sizes[0], cx, cyMid, colorOverride, targetOverride);
        const pos = cfg.dubbelPos || 'mitten';
        const frontY = pos === 'topp' ? cyMid - bandH * 0.19
          : pos === 'botten' ? cyMid + bandH * 0.19
          : cyMid;
        drawUnit(texts[1], sizes[1], cx, frontY, colorOverride, targetOverride);
      } else if (texts.length > 1) {
        const w0 = measure(texts[0], sizes[0]), w1 = measure(texts[1], sizes[1]);
        const g2 = sizes[0] * 0.5;
        drawUnit(texts[0], sizes[0], cx - (w0 + g2 + w1) / 2 + w0 / 2, cyMid, colorOverride, targetOverride);
        drawUnit(texts[1], sizes[1], cx + (w0 + g2 + w1) / 2 - w1 / 2, cyMid, colorOverride, targetOverride);
      } else {
        drawUnit(texts[0], sizes[0], cx, cyMid, colorOverride, targetOverride);
      }
    };

    const drawAll = (colorOverride, targetOverride) => {
      let x = W / 2 - total / 2;
      for (const [k] of items) {
        if (k === 'blk') {
          drawBlock(x + bw / 2, colorOverride, targetOverride);
          x += bw + gap;
        } else {
          const symCol = colorOverride || cfg.symbolColor || (texts[0] ? texts[0].color : { hex: '#111' });
          drawSymbol(targetOverride || ctx, cfg.symbol, x + symW / 2, cyMid, symSize, symCol.hex);
          x += symW + gap;
        }
      }
    };

    // skugga: jämn kontur runt text och symbol (rendera i skuggfärg,
    // stämpla sedan i en ring av riktningar)
    if (cfg.shadowColor) {
      const sc = document.createElement('canvas');
      sc.width = W; sc.height = H;
      const scx = sc.getContext('2d');
      drawAll(cfg.shadowColor, scx);
      const r = Math.max(2, bandH * 0.045);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.drawImage(sc, Math.cos(a) * r, Math.sin(a) * r);
      }
    }
    drawAll(null, null);
  }

  // ------------------------------------------------------------- geometri
  metalMaterial(finish) {
    return new THREE.MeshStandardMaterial({
      color: finish.hex,
      metalness: finish.metalness,
      roughness: finish.roughness,
      envMapIntensity: 1.15,
    });
  }

  build(cfg) {
    // städa
    this.collarGroup.clear();
    this.collarGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });

    const R = cfg.circumference / (2 * Math.PI);
    const width = cfg.width;
    const thickness = cfg.family === 'biothane' ? 0.22 : 0.4;

    const tex = this.makeBandTexture(cfg);
    const isBio = cfg.family === 'biothane';
    const outerMat = isBio
      ? new THREE.MeshPhysicalMaterial({
          map: tex,
          roughness: 0.38,
          metalness: 0.0,
          clearcoat: 0.55,
          clearcoatRoughness: 0.3,
          envMapIntensity: 0.7,
          side: THREE.FrontSide,
        })
      : new THREE.MeshStandardMaterial({
          map: tex,
          bumpMap: tex,
          bumpScale: 1.6,
          roughness: 0.85,
          metalness: 0.0,
          envMapIntensity: 0.3,
          side: THREE.FrontSide,
        });

    const seg = 160;
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(R, R, width, seg, 1, true), outerMat);
    outer.rotation.y = Math.PI;
    outer.castShadow = true;
    this.collarGroup.add(outer);

    // insida: fodrets material (bomull) eller biothanefärgen
    const innerHex = isBio ? cfg.bandColor : (cfg.lining ? cfg.lining.hex : '#555');
    let innerMat;
    if (isBio) {
      innerMat = new THREE.MeshStandardMaterial({
        color: innerHex, roughness: 0.4, side: THREE.BackSide,
      });
    } else {
      const linTex = this.makeLiningTexture(cfg.lining);
      linTex.repeat.set(Math.max(1, Math.round(cfg.circumference / 5)), Math.max(1, width / 5));
      const props = this.liningMaterialProps(cfg.lining);
      innerMat = new THREE.MeshStandardMaterial({
        map: linTex,
        bumpMap: linTex,
        bumpScale: props.bumpScale,
        roughness: props.roughness,
        metalness: props.metalness,
        envMapIntensity: props.envMapIntensity,
        side: THREE.BackSide,
      });
    }
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(R - thickness, R - thickness, width, seg, 1, true), innerMat);
    this.collarGroup.add(inner);

    // kantringar (tjocklek)
    const edgeProps = isBio ? { roughness: 0.4 } : this.liningMaterialProps(cfg.lining);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: innerHex,
      roughness: edgeProps.roughness,
      metalness: edgeProps.metalness || 0,
      envMapIntensity: edgeProps.envMapIntensity || 0.7,
    });
    for (const sgn of [1, -1]) {
      const ringGeo = new THREE.TorusGeometry(R - thickness / 2, thickness / 2, 10, seg);
      const ring = new THREE.Mesh(ringGeo, edgeMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = sgn * width / 2;
      ring.castShadow = true;
      this.collarGroup.add(ring);
    }

    // Beslag
    if (cfg.showHardware === false) {
      this.collarGroup.position.y = width / 2 + 2.2;
      return;
    }
    const metal = this.metalMaterial(cfg.hardware);
    const backAngle = Math.PI; // baksidan (bort från kameran)
    const hw = new THREE.Group();

    // hjälpare: placera ett objekt (byggt i XY-planet, +Z utåt) flush mot bandet
    const mount = (obj, angle, dist) => {
      obj.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);
      obj.lookAt(new THREE.Vector3(Math.sin(angle) * (dist + 10), 0, Math.cos(angle) * (dist + 10)));
      hw.add(obj);
    };

    if (cfg.modelKind !== 'halvstryp') {
      // D-ring under en bandhälla, strax intill spännet
      const dring = this.makeDRing(width, metal, cfg.bandColor, isBio);
      mount(dring, backAngle - 0.85, R + 0.05);
    }

    if (cfg.modelKind === 'halvstryp') {
      hw.add(this.makeMartingale(R, width, metal, cfg));
    } else if (isBio) {
      const buckle = this.makeMetalBuckle(width, metal);
      mount(buckle, backAngle, R + 0.22);
      // nitar
      for (const off of [-0.28, 0.28]) {
        const rv = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 20), metal);
        rv.geometry.rotateX(Math.PI / 2);
        mount(rv, backAngle + off, R + 0.06);
      }
    } else {
      const buckle = this.makeSideRelease(width); // klickspänne: alltid svart plast
      mount(buckle, backAngle, R + 0.1);
      if (cfg.modelKind === 'stallbart' || cfg.modelKind === 'justerbart') {
        const tri = this.makeTriGlide(width, metal);
        mount(tri, backAngle + 0.65, R + 0.1);
      }
    }

    hw.traverse(o => { o.castShadow = true; });
    this.collarGroup.add(hw);

    // placera kragen svävande något över marken
    this.collarGroup.position.y = width / 2 + 2.2;
  }

  // Alla beslag byggs i XY-planet med +Z utåt (monteras med mount() i build).

  _roundedRect(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  _extrude(shape, depth, bevel = 0.07) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5,
      curveSegments: 20,
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }

  // rundad rektangel som smalnar av: h1 vid vänster kant, h2 vid höger
  _taperedRect(w, h1, h2, r) {
    const s = new THREE.Shape();
    const x0 = -w / 2, x1 = w / 2;
    s.moveTo(x0 + r, -h1 / 2);
    s.lineTo(x1 - r, -h2 / 2);
    s.quadraticCurveTo(x1, -h2 / 2, x1, -h2 / 2 + r);
    s.lineTo(x1, h2 / 2 - r);
    s.quadraticCurveTo(x1, h2 / 2, x1 - r, h2 / 2);
    s.lineTo(x0 + r, h1 / 2);
    s.quadraticCurveTo(x0, h1 / 2, x0, h1 / 2 - r);
    s.lineTo(x0, -h1 / 2 + r);
    s.quadraticCurveTo(x0, -h1 / 2, x0 + r, -h1 / 2);
    return s;
  }

  makeDRing(width, metal, bandHex, riveted = false) {
    // Platt D-ring som ligger an mot bandet, fasthållen av en vikt bandhälla.
    // Raka sidan under hällan, bågen pekar bort från spännet (lokal -X).
    const g = new THREE.Group();
    const rr = Math.max(width * 0.42, 0.8);
    const tube = 0.16;
    const zRing = 0.16;

    // båge: halv torus som buktar mot -X
    const arc = new THREE.Mesh(new THREE.TorusGeometry(rr, tube, 14, 40, Math.PI), metal);
    arc.rotation.z = Math.PI / 2; // öppningen mot +X
    arc.position.set(0, 0, zRing);
    g.add(arc);
    // rak sida (chord)
    const bar = new THREE.Mesh(new THREE.CapsuleGeometry(tube, rr * 2, 6, 14), metal);
    bar.position.set(0, 0, zRing);
    g.add(bar);

    // vikt bandhälla över raka sidan
    const tabMat = new THREE.MeshStandardMaterial({ color: bandHex, roughness: 0.85 });
    const tabL = width * 0.62;
    const tab = new THREE.Mesh(
      this._extrude(this._roundedRect(tabL, width * 0.9, 0.14), 0.24, 0.05), tabMat);
    tab.position.set(tabL / 2 - 0.08, 0, 0.26);
    g.add(tab);

    if (riveted) {
      for (const sgn of [-1, 1]) {
        const rv = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 20), metal);
        rv.rotation.x = Math.PI / 2;
        rv.position.set(tabL * 0.42, sgn * width * 0.22, 0.42);
        g.add(rv);
      }
    }
    return g;
  }

  makeSideRelease(width) {
    // Klickspänne i svart plast: handel med två synliga böjda armar
    // som knäpper in i hondelen (jfr klassiskt YKK-spänne).
    const g = new THREE.Group();
    const plastic = new THREE.MeshStandardMaterial({ color: '#212225', roughness: 0.5, metalness: 0.02, envMapIntensity: 0.35 });
    const plasticDark = new THREE.MeshStandardMaterial({ color: '#101114', roughness: 0.6, metalness: 0.02, envMapIntensity: 0.25 });

    const H = width * 0.84;          // höjd tvärs bandet
    const D = 0.45;                  // tjocklek utåt
    const gap = width * 0.55;        // synlig armlängd mellan delarna
    const Lm = width * 0.5;          // handelens bas
    const Lf = width * 0.62;         // hondelens hus
    const rc = H * 0.18;
    const soft = 0.06;               // mjuk gjuten kant

    // handelens bas (vänster) – smalnar mot bandänden
    const maleX = -(gap / 2 + Lm / 2);
    const male = new THREE.Mesh(this._extrude(this._taperedRect(Lm, H * 0.9, H, rc), D, soft), plastic);
    male.position.x = maleX;
    g.add(male);

    // hondelens hus (höger) – bred mun som smalnar mot bandänden
    const femX = gap / 2 + Lf / 2;
    const female = new THREE.Mesh(this._extrude(this._taperedRect(Lf, H, H * 0.88, rc), D, soft), plastic);
    female.position.x = femX;
    g.add(female);
    // fläns runt hondelens mun – något högre och djupare än huset
    const flange = new THREE.Mesh(
      this._extrude(this._roundedRect(width * 0.13, H * 1.14, rc * 0.5), D * 1.12, soft), plastic);
    flange.position.x = gap / 2 + width * 0.05;
    g.add(flange);

    // två böjda armar från handelen in i hondelens mun
    const armT = H * 0.22;
    for (const sgn of [-1, 1]) {
      const s = new THREE.Shape();
      const xs = maleX + Lm * 0.3;          // start inne i handelen
      const xe = gap / 2 + width * 0.2;     // slut inne i hondelen
      const ys = sgn * H * 0.24;
      const yc = sgn * H * 0.44;            // bukta utåt på mitten
      const ye = sgn * H * 0.24;
      s.moveTo(xs, ys - armT / 2);
      s.quadraticCurveTo((xs + xe) / 2, yc - sgn * armT / 2, xe, ye - armT / 2);
      s.lineTo(xe, ye + armT / 2);
      s.quadraticCurveTo((xs + xe) / 2, yc + sgn * armT / 2, xs, ys + armT / 2);
      s.closePath();
      const arm = new THREE.Mesh(this._extrude(s, D * 0.75, 0.08), plastic);
      g.add(arm);
    }

    // mittungan mellan armarna
    const tongue = new THREE.Mesh(
      this._extrude(this._roundedRect(gap + width * 0.3, H * 0.18, 0.07), D * 0.62, 0.04), plastic);
    tongue.position.set(width * 0.02, 0, -D * 0.08);
    g.add(tongue);

    // bandslitsar (mörka försänkta spår vid ändarna)
    for (const [bx, bl] of [[maleX - Lm * 0.28, H * 0.62], [femX + Lf * 0.3, H * 0.62]]) {
      const slot = new THREE.Mesh(this._extrude(this._roundedRect(width * 0.08, bl, 0.04), 0.08, 0.02), plasticDark);
      slot.position.set(bx, 0, D / 2 + 0.05);
      g.add(slot);
    }
    return g;
  }

  makeMetalBuckle(width, metal) {
    // klassiskt spänne med torne: ram + rulle
    const g = new THREE.Group();
    const h = width * 1.12, w = width * 0.68, tube = 0.15;
    const mk = (len, x, y, vertical) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(tube, len, 6, 16), metal);
      m.position.set(x, y, 0);
      m.rotation.z = vertical ? 0 : Math.PI / 2;
      g.add(m);
    };
    mk(w, 0, h / 2, false);   // topp
    mk(w, 0, -h / 2, false);  // botten
    mk(h, -w / 2, 0, true);   // vänster (bandsida)
    mk(h, w / 2, 0, true);    // höger
    // torne: ligger längs bandet, vilar på högra ramstången
    const prong = new THREE.Mesh(new THREE.CapsuleGeometry(tube * 0.75, w * 0.95, 6, 14), metal);
    prong.rotation.z = Math.PI / 2;
    prong.position.set(0.06, 0, tube * 0.9);
    g.add(prong);
    return g;
  }

  makeTriGlide(width, metal) {
    // trebomsspänne: tre vertikala bommar tvärs bandet
    const g = new THREE.Group();
    const h = width * 1.1, w = width * 0.8, tube = 0.13;
    const mk = (len, x, y, vertical) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(tube, len, 6, 16), metal);
      m.position.set(x, y, 0);
      m.rotation.z = vertical ? 0 : Math.PI / 2;
      g.add(m);
    };
    mk(h, -w / 2, 0, true);
    mk(h, 0, 0, true);
    mk(h, w / 2, 0, true);
    mk(w, 0, h / 2, false);
    mk(w, 0, -h / 2, false);
    return g;
  }

  makeMartingale(R, width, metal, cfg) {
    const g = new THREE.Group();
    const off = 0.3;                // ringarnas vinkel från baksidan
    const half = R * Math.sin(off);
    const zr = R * Math.cos(off);
    const lr = half * 1.05;         // öglans radie
    const c = zr + Math.sqrt(Math.max(lr * lr - half * half, 0.01));
    const O = new THREE.Vector3(0, 0, -c); // öglans centrum

    // öglan: en liten bandcylinder i samma färg som halsbandet
    const loopMat = new THREE.MeshStandardMaterial({
      color: cfg.bandColor, roughness: 0.8, side: THREE.DoubleSide,
    });
    const loopH = width * 0.72;
    const loop = new THREE.Mesh(new THREE.CylinderGeometry(lr, lr, loopH, 64, 1, true), loopMat);
    loop.position.copy(O);
    g.add(loop);
    const edgeMat = new THREE.MeshStandardMaterial({ color: cfg.bandColor, roughness: 0.8 });
    for (const sgn of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.TorusGeometry(lr - 0.05, 0.09, 8, 48), edgeMat);
      edge.rotation.x = Math.PI / 2;
      edge.position.set(0, sgn * loopH / 2, -c);
      g.add(edge);
    }

    // O-ringar i skarvarna – banden löper genom dem
    const ringR = Math.max(width * 0.46, 0.8);
    for (const sgn of [-1, 1]) {
      const a = Math.PI + sgn * off;
      const p = new THREE.Vector3(Math.sin(a) * R, 0, Math.cos(a) * R);
      // normal = medelriktning av halsbandets och öglans tangenter
      const tCollar = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
      const ro = p.clone().sub(O).normalize();
      const tLoop = new THREE.Vector3(ro.z, 0, -ro.x);
      if (tLoop.dot(tCollar) < 0) tLoop.negate();
      const n = tCollar.add(tLoop).normalize();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.13, 14, 40), metal);
      ring.position.copy(p);
      ring.lookAt(p.clone().add(n));
      g.add(ring);
    }

    // D-ring ytterst på öglan där kopplet fästs
    const drR = Math.max(width * 0.4, 0.8);
    const dr = new THREE.Mesh(new THREE.TorusGeometry(drR, 0.14, 16, 44), metal);
    dr.scale.set(1.1, 0.88, 1);
    dr.position.set(0, 0, -(c + lr + drR * 0.5));
    g.add(dr);
    return g;
  }
}
