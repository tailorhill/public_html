// Förenklade vektorversioner av Valley Dogs symboler, ritade med canvas 2D.
// drawSymbol(ctx, id, cx, cy, s, color) – s är symbolens höjd i pixlar.

function star(ctx, cx, cy, r, points = 5, inner = 0.42) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function heart(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.38);
  ctx.bezierCurveTo(cx - s * 0.62, cy - s * 0.02, cx - s * 0.42, cy - s * 0.48, cx, cy - s * 0.2);
  ctx.bezierCurveTo(cx + s * 0.42, cy - s * 0.48, cx + s * 0.62, cy - s * 0.02, cx, cy + s * 0.38);
  ctx.closePath();
}

function leaf(ctx, cx, cy, len, wid, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(wid, -len / 2, 0, -len);
  ctx.quadraticCurveTo(-wid, -len / 2, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSymbol(ctx, id, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const h = s / 2;
  switch (id) {
    case 'stjarna':
      star(ctx, cx, cy, h); ctx.fill(); break;

    case 'stjarnor': {
      star(ctx, cx - h * 0.55, cy - h * 0.45, h * 0.42); ctx.fill();
      star(ctx, cx + h * 0.45, cy - h * 0.15, h * 0.55); ctx.fill();
      star(ctx, cx - h * 0.35, cy + h * 0.55, h * 0.34); ctx.fill();
      star(ctx, cx + h * 0.35, cy + h * 0.6, h * 0.26); ctx.fill();
      break;
    }
    case 'blinkandestjarna': {
      star(ctx, cx, cy, h * 0.72); ctx.fill();
      ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
      for (const a of [-0.9, -0.35, 0.5, 1.1, 2.2, 2.9, 3.8]) {
        const r1 = h * 0.82, r2 = h * 1.0;
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
        ctx.stroke();
      }
      break;
    }
    case 'hjarta':
      heart(ctx, cx, cy, s); ctx.fill(); break;

    case 'smahjartan': {
      heart(ctx, cx - h * 0.5, cy - h * 0.4, s * 0.38); ctx.fill();
      heart(ctx, cx + h * 0.5, cy - h * 0.5, s * 0.5); ctx.fill();
      heart(ctx, cx - h * 0.45, cy + h * 0.45, s * 0.3); ctx.fill();
      heart(ctx, cx + h * 0.3, cy + h * 0.45, s * 0.42); ctx.fill();
      heart(ctx, cx, cy - h * 0.05, s * 0.26); ctx.fill();
      break;
    }
    case 'krona': {
      const w = s * 1.05, base = cy + h * 0.55, top = cy - h * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, base);
      ctx.lineTo(cx - w / 2, top + s * 0.28);
      ctx.lineTo(cx - w * 0.2, cy + h * 0.05);
      ctx.lineTo(cx, top);
      ctx.lineTo(cx + w * 0.2, cy + h * 0.05);
      ctx.lineTo(cx + w / 2, top + s * 0.28);
      ctx.lineTo(cx + w / 2, base);
      ctx.closePath(); ctx.fill();
      for (const dx of [-w / 2, 0, w / 2]) {
        ctx.beginPath(); ctx.arc(cx + dx, (dx === 0 ? top : top + s * 0.28) - s * 0.06, s * 0.09, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'blixt': {
      ctx.beginPath();
      ctx.moveTo(cx + h * 0.35, cy - h);
      ctx.lineTo(cx - h * 0.45, cy + h * 0.15);
      ctx.lineTo(cx - h * 0.02, cy + h * 0.15);
      ctx.lineTo(cx - h * 0.35, cy + h);
      ctx.lineTo(cx + h * 0.45, cy - h * 0.12);
      ctx.lineTo(cx + h * 0.02, cy - h * 0.12);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'eld': {
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.bezierCurveTo(cx + h * 0.15, cy - h * 0.45, cx + h * 0.65, cy - h * 0.35, cx + h * 0.55, cy + h * 0.15);
      ctx.bezierCurveTo(cx + h * 0.5, cy + h * 0.7, cx + h * 0.1, cy + h, cx, cy + h);
      ctx.bezierCurveTo(cx - h * 0.1, cy + h, cx - h * 0.5, cy + h * 0.7, cx - h * 0.55, cy + h * 0.15);
      ctx.bezierCurveTo(cx - h * 0.62, cy - h * 0.4, cx - h * 0.1, cy - h * 0.5, cx, cy - h);
      ctx.closePath();
      ctx.fill();
      // inre låga i bandfärg klipps inte här – behåll solid silhuett
      break;
    }
    case 'fyrklover': {
      const r = s * 0.27;
      for (const [dx, dy] of [[0, -r], [r, 0], [0, r], [-r, 0]]) {
        heart(ctx, cx + dx, cy + dy, r * 1.9);
      }
      for (const [dx, dy, rot] of [[0, -r, Math.PI], [r, 0, -Math.PI / 2], [0, r, 0], [-r, 0, Math.PI / 2]]) {
        ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.rotate(rot);
        heart(ctx, 0, 0, r * 2.0); ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'diamant': {
      ctx.lineWidth = s * 0.07; ctx.lineJoin = 'round';
      const w = s * 1.0, top = cy - h * 0.55;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, top + s * 0.28);
      ctx.lineTo(cx - w * 0.25, top);
      ctx.lineTo(cx + w * 0.25, top);
      ctx.lineTo(cx + w / 2, top + s * 0.28);
      ctx.lineTo(cx, cy + h * 0.75);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, top + s * 0.28); ctx.lineTo(cx + w / 2, top + s * 0.28);
      ctx.moveTo(cx - w * 0.25, top); ctx.lineTo(cx - w * 0.12, top + s * 0.28); ctx.lineTo(cx, cy + h * 0.75);
      ctx.moveTo(cx + w * 0.25, top); ctx.lineTo(cx + w * 0.12, top + s * 0.28); ctx.lineTo(cx, cy + h * 0.75);
      ctx.stroke();
      break;
    }
    case 'pokal': {
      ctx.beginPath(); // kupa
      ctx.moveTo(cx - s * 0.32, cy - h);
      ctx.lineTo(cx + s * 0.32, cy - h);
      ctx.bezierCurveTo(cx + s * 0.32, cy - h * 0.1, cx + s * 0.14, cy + h * 0.1, cx, cy + h * 0.1);
      ctx.bezierCurveTo(cx - s * 0.14, cy + h * 0.1, cx - s * 0.32, cy - h * 0.1, cx - s * 0.32, cy - h);
      ctx.closePath(); ctx.fill();
      ctx.lineWidth = s * 0.07;
      for (const sgn of [-1, 1]) { // öron
        ctx.beginPath();
        ctx.arc(cx + sgn * s * 0.4, cy - h * 0.55, s * 0.16, Math.PI * 0.5, Math.PI * 2.5);
        ctx.stroke();
      }
      ctx.fillRect(cx - s * 0.05, cy + h * 0.1, s * 0.1, s * 0.18); // fot
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.22, cy + h);
      ctx.lineTo(cx + s * 0.22, cy + h);
      ctx.lineTo(cx + s * 0.14, cy + h * 0.55);
      ctx.lineTo(cx - s * 0.14, cy + h * 0.55);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'tass': {
      ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.16, s * 0.30, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      const toes = [[-0.34, -0.1], [-0.13, -0.28], [0.13, -0.28], [0.34, -0.1]];
      for (const [dx, dy] of toes) {
        ctx.beginPath(); ctx.ellipse(cx + dx * s, cy + dy * s, s * 0.11, s * 0.14, dx * 0.9, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'dodskalle': {
      ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
      // korsben
      for (const a of [-0.6, 0.6]) {
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * s * 0.52, cy + s * 0.18 - Math.sin(a) * s * 0.42);
        ctx.lineTo(cx + Math.cos(a) * s * 0.52, cy + s * 0.18 + Math.sin(a) * s * 0.42);
        ctx.stroke();
      }
      // kranium
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.12, s * 0.30, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx - s * 0.18, cy - s * 0.05, s * 0.36, s * 0.26);
      // ögon (urklippta)
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(cx - s * 0.12, cy - s * 0.14, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + s * 0.12, cy - s * 0.14, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.02); ctx.lineTo(cx - s * 0.05, cy + s * 0.08); ctx.lineTo(cx + s * 0.05, cy + s * 0.08); ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    }
    case 'bomb': {
      ctx.beginPath(); ctx.arc(cx - s * 0.06, cy + s * 0.1, s * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx + s * 0.1, cy - s * 0.3, s * 0.14, s * 0.14);
      ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.18, cy - s * 0.28);
      ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.5, cx + s * 0.42, cy - s * 0.38);
      ctx.stroke();
      star(ctx, cx + s * 0.46, cy - s * 0.36, s * 0.1, 4, 0.35); ctx.fill();
      break;
    }
    case 'treudd': {
      ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.7); ctx.lineTo(cx, cy + h); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.28, cy - h * 0.45);
      ctx.quadraticCurveTo(cx - s * 0.28, cy + s * 0.05, cx, cy + s * 0.02);
      ctx.quadraticCurveTo(cx + s * 0.28, cy + s * 0.05, cx + s * 0.28, cy - h * 0.45);
      ctx.stroke();
      // spetsar
      for (const dx of [-s * 0.28, 0, s * 0.28]) {
        const tipY = dx === 0 ? cy - h : cy - h * 0.62;
        ctx.beginPath();
        ctx.moveTo(cx + dx - s * 0.07, tipY + s * 0.16);
        ctx.lineTo(cx + dx, tipY);
        ctx.lineTo(cx + dx + s * 0.07, tipY + s * 0.16);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'kvistar': {
      ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + sgn * s * 0.1, cy + h * 0.5);
        ctx.quadraticCurveTo(cx + sgn * s * 0.55, cy + h * 0.1, cx + sgn * s * 0.62, cy - h * 0.5);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const t = 0.25 + i * 0.2;
          const bx = cx + sgn * (s * 0.1 + t * s * 0.5);
          const by = cy + h * 0.5 - t * s * 0.95;
          leaf(ctx, bx, by, s * 0.24, s * 0.08, sgn * (0.8 - t * 0.4));
          leaf(ctx, bx, by, s * 0.24, s * 0.08, sgn * (2.2 - t * 0.4));
        }
      }
      break;
    }
    case 'dalahast': {
      ctx.save(); ctx.translate(cx - s * 0.5, cy - s * 0.42); ctx.scale(s / 100, s / 100);
      ctx.beginPath();
      ctx.moveTo(38, 22);
      ctx.quadraticCurveTo(44, 4, 58, 6);   // nacke/man
      ctx.quadraticCurveTo(66, 7, 68, 14);  // huvud topp
      ctx.quadraticCurveTo(78, 18, 76, 26); // nos
      ctx.quadraticCurveTo(70, 30, 62, 28); // haka
      ctx.quadraticCurveTo(58, 38, 62, 48); // hals fram
      ctx.lineTo(80, 50);                   // rygg mot bak
      ctx.quadraticCurveTo(92, 52, 88, 66);
      ctx.lineTo(84, 92); ctx.lineTo(74, 92); ctx.lineTo(72, 68); // bakben
      ctx.lineTo(52, 66); ctx.lineTo(50, 92); ctx.lineTo(40, 92); // framben
      ctx.lineTo(36, 60);
      ctx.quadraticCurveTo(28, 52, 30, 38); // bringa
      ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    }
    case 'vallhund': {
      ctx.save(); ctx.translate(cx - s * 0.55, cy - s * 0.4); ctx.scale(s / 100, s / 100);
      ctx.beginPath();
      ctx.moveTo(6, 40);                       // nos
      ctx.quadraticCurveTo(14, 30, 24, 30);    // huvud
      ctx.lineTo(28, 20); ctx.lineTo(36, 30);  // öra
      ctx.quadraticCurveTo(55, 26, 74, 34);    // rygg
      ctx.quadraticCurveTo(88, 30, 96, 20);    // svans upp
      ctx.quadraticCurveTo(94, 38, 84, 46);
      ctx.lineTo(86, 70); ctx.lineTo(78, 70); ctx.lineTo(74, 52);
      ctx.lineTo(56, 54); ctx.lineTo(58, 70); ctx.lineTo(50, 70); ctx.lineTo(44, 52);
      ctx.quadraticCurveTo(24, 52, 18, 46);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    }
    case 'far': {
      // moln-kropp
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.arc(cx + Math.cos(a) * s * 0.26, cy - s * 0.02 + Math.sin(a) * s * 0.17, s * 0.14, 0, Math.PI * 2);
      }
      ctx.arc(cx, cy - s * 0.02, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      // huvud
      ctx.beginPath(); ctx.ellipse(cx + s * 0.36, cy - s * 0.14, s * 0.11, s * 0.14, -0.4, 0, Math.PI * 2); ctx.fill();
      // ben
      ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
      for (const dx of [-0.2, -0.07, 0.1, 0.24]) {
        ctx.beginPath(); ctx.moveTo(cx + dx * s, cy + s * 0.14); ctx.lineTo(cx + dx * s, cy + s * 0.36); ctx.stroke();
      }
      break;
    }
    case 'apportbock': {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5);
      ctx.fillRect(-s * 0.32, -s * 0.05, s * 0.64, s * 0.1);
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(sgn * s * 0.36, 0, s * 0.1, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'virvelvind': {
      ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      const rows = [[0.42, -0.38], [0.34, -0.16], [0.26, 0.04], [0.18, 0.22], [0.1, 0.38]];
      for (const [r, dy] of rows) {
        ctx.beginPath();
        ctx.ellipse(cx + (dy > 0 ? s * 0.08 : 0), cy + dy * s, r * s, r * s * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'clown': {
      // narrhatt
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, cy + s * 0.3);
      ctx.quadraticCurveTo(cx - s * 0.45, cy - s * 0.1, cx - s * 0.55, cy - s * 0.35);
      ctx.quadraticCurveTo(cx - s * 0.2, cy - s * 0.15, cx, cy - s * 0.5);
      ctx.quadraticCurveTo(cx + s * 0.2, cy - s * 0.15, cx + s * 0.55, cy - s * 0.35);
      ctx.quadraticCurveTo(cx + s * 0.45, cy - s * 0.1, cx + s * 0.5, cy + s * 0.3);
      ctx.closePath(); ctx.fill();
      for (const [dx, dy] of [[-0.55, -0.35], [0, -0.5], [0.55, -0.35]]) {
        ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, s * 0.07, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'monster': {
      // fladdermus-öron ansikte
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.45, cy - s * 0.45);
      ctx.lineTo(cx - s * 0.18, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.18, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.45, cy - s * 0.45);
      ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.05, cx + s * 0.25, cy + s * 0.3);
      ctx.quadraticCurveTo(cx, cy + s * 0.45, cx - s * 0.25, cy + s * 0.3);
      ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.05, cx - s * 0.45, cy - s * 0.45);
      ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.arc(cx + sgn * s * 0.15, cy + s * 0.02, s * 0.08, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'svenskaflaggan': flagNordic(ctx, cx, cy, s, '#1c50a0', '#f8d015'); break;
    case 'norskaflaggan':  flagNordic(ctx, cx, cy, s, '#d5273b', '#ffffff', '#26356e'); break;
    case 'finskaflaggan':  flagNordic(ctx, cx, cy, s, '#f4f5f8', '#1c3f7c', null, true); break;
    case 'danskaflaggan':  flagNordic(ctx, cx, cy, s, '#e8112d', '#ffffff'); break;
    default: break;
  }
  ctx.restore();
}

function flagNordic(ctx, cx, cy, s, bg, cross, innerCross = null, outline = false) {
  const w = s * 1.5, h = s * 0.94;
  const x = cx - w / 2, y = cy - h / 2;
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
}

// Symbolens naturliga bredd i förhållande till höjden (för layout).
export function symbolAspect(id) {
  switch (id) {
    case 'svenskaflaggan': case 'norskaflaggan': case 'finskaflaggan': case 'danskaflaggan': return 1.5;
    case 'apportbock': case 'dalahast': case 'vallhund': case 'far': return 1.15;
    case 'krona': return 1.05;
    default: return 1.0;
  }
}
