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
      this.paintLining(ctx, W, H, cfg.lining);
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

  paintLining(ctx, w, h, lining) {
    ctx.fillStyle = lining.hex;
    ctx.fillRect(0, 0, w, h);
    if (lining.pattern && lining.hex2) {
      ctx.save();
      ctx.fillStyle = lining.hex2;
      if (lining.pattern === 'stripes') {
        for (let x = 0; x < w; x += 26) ctx.fillRect(x, 0, 10, h);
      } else if (lining.pattern === 'zigzag') {
        ctx.strokeStyle = lining.hex2; ctx.lineWidth = 6;
        for (let yy = -10; yy < h + 10; yy += 22) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 18) {
            const y = yy + ((x / 18) % 2 ? 8 : -8);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (lining.pattern === 'leopard') {
        for (let i = 0; i < (w * h) / 900; i++) {
          const x = Math.random() * w, y = Math.random() * h;
          ctx.beginPath();
          ctx.arc(x, y, 3 + Math.random() * 4, Math.random(), Math.random() + 4);
          ctx.lineWidth = 3; ctx.strokeStyle = lining.hex2; ctx.stroke();
        }
      } else { // floral / dots / fans → prickar
        for (let i = 0; i < (w * h) / 700; i++) {
          const x = Math.random() * w, y = Math.random() * h;
          ctx.beginPath(); ctx.arc(x, y, 2.5 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
    if (lining.metallic) {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      for (let i = 0; i <= 10; i++) {
        grad.addColorStop(i / 10, i % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
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

  paintTextBlock(ctx, W, H, bandTop, bandBottom, cfg) {
    const text = (cfg.text || '').trim();
    const hasSymbol = cfg.symbol && cfg.symbol !== 'ingen';
    if (!text && !hasSymbol) return;

    const bandH = bandBottom - bandTop;
    const size = bandH * 0.56;
    const cyMid = bandTop + bandH / 2;
    const font = cfg.font;
    const displayText = font.caps ? text.toUpperCase() : text;
    const fontStr = `${font.italic ? 'italic ' : ''}${font.weight} ${size}px ${font.css}`;

    // mät layout
    ctx.font = fontStr;
    const tw = displayText ? ctx.measureText(displayText).width : 0;
    const symSize = bandH * 0.5;
    const symW = hasSymbol ? symSize * symbolAspect(cfg.symbol) : 0;
    const gap = displayText && hasSymbol ? size * 0.45 : 0;

    let items = [];
    if (hasSymbol && cfg.symbolPlacement === 'fore') items = [['sym'], ['txt']];
    else if (hasSymbol && cfg.symbolPlacement === 'efter') items = [['txt'], ['sym']];
    else if (hasSymbol && cfg.symbolPlacement === 'bada') items = [['sym'], ['txt'], ['sym']];
    else if (hasSymbol && !displayText) items = [['sym']];
    else items = [['txt']];

    let total = 0;
    for (const [k] of items) total += (k === 'txt' ? tw : symW);
    total += gap * (items.length - 1);

    // rendera till offscreen för glitter-klippning
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const octx = off.getContext('2d');
    octx.font = fontStr;
    octx.textBaseline = 'middle';

    const drawItems = (targetCtx, colorObjTxt, colorObjSym, dx, dy) => {
      let x = W / 2 - total / 2 + dx;
      for (const [k] of items) {
        if (k === 'txt' && displayText) {
          targetCtx.fillStyle = this.fillStyleFor(targetCtx, colorObjTxt, x, bandTop + dy, tw, bandH);
          targetCtx.fillText(displayText, x, cyMid + dy);
          x += tw + gap;
        } else if (k === 'sym') {
          const colHex = colorObjSym.special ? colorObjSym.hex : colorObjSym.hex;
          drawSymbol(targetCtx, cfg.symbol, x + symW / 2 + dx * 0, cyMid + dy, symSize, colHex);
          x += symW + gap;
        }
      }
    };

    // skugga
    if (cfg.shadowColor) {
      ctx.save();
      ctx.font = fontStr;
      ctx.textBaseline = 'middle';
      const so = size * 0.07;
      drawItems(ctx, cfg.shadowColor, cfg.shadowColor, so, so);
      ctx.restore();
    }

    drawItems(octx, cfg.textColor, cfg.symbolColor || cfg.textColor, 0, 0);

    // glitter i text/symbol
    if (cfg.textColor.glitter || (cfg.symbolColor && cfg.symbolColor.glitter)) {
      octx.save();
      octx.globalCompositeOperation = 'source-atop';
      this.sprinkle(octx, W / 2 - total / 2 - 10, bandTop, total + 20, bandH, new THREE.Color(cfg.textColor.hex), 2.2);
      octx.restore();
    }
    if (cfg.textColor.special === 'reflex') {
      octx.save();
      octx.globalCompositeOperation = 'source-atop';
      octx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 400; i++) {
        octx.fillRect(W / 2 - total / 2 + Math.random() * total, bandTop + Math.random() * bandH, 1.5, 1.5);
      }
      octx.restore();
    }

    ctx.drawImage(off, 0, 0);
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
    const outerMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: isBio ? 0.35 : 0.85,
      metalness: 0.0,
      envMapIntensity: isBio ? 0.8 : 0.3,
      side: THREE.FrontSide,
    });

    const seg = 160;
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(R, R, width, seg, 1, true), outerMat);
    outer.rotation.y = Math.PI;
    outer.castShadow = true;
    this.collarGroup.add(outer);

    const innerHex = isBio ? cfg.bandColor : (cfg.lining ? cfg.lining.hex : '#555');
    const innerMat = new THREE.MeshStandardMaterial({
      color: innerHex,
      roughness: isBio ? 0.4 : 0.9,
      side: THREE.BackSide,
    });
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(R - thickness, R - thickness, width, seg, 1, true), innerMat);
    this.collarGroup.add(inner);

    // kantringar (tjocklek)
    const edgeMat = new THREE.MeshStandardMaterial({ color: innerHex, roughness: 0.85 });
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
