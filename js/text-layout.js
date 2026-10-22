// Gemensam placering av text och symboler på bandet – används av både 3D-vyn
// (collar3d.js, mätt med canvas) och skärfilerna (export.js, mätt med
// fontfilerna), så förhandsvisning och skärfil alltid matchar.
//
// Storleken utgår från BLÄCKET (tecknens faktiska höjd), inte teckenstorleken:
// texten fyller bandet lika mycket oavsett typsnitt och centreras på det man
// faktiskt ser. Symbolerna får radens bläckhöjd och centreras på samma linje.
//
//   measure(el, size) -> { width, ascent, descent }
//       ascent/descent räknas från punkten texten ritas vid, dvs bläcket
//       spänner [y - ascent, y + descent] om texten ritas vid y.
//   aspect(symbolId)  -> symbolens bredd / höjd
//
// Returnerar null om det inte finns något att rita, annars en lista rader:
//   { size, cy, symCy, inkH, gap, totW, items: [{ kind, el, id, color, w, sz, cx }] }
// där cx är relativt bandets mitt (vänsterkant = -totW/2).

export const FILL = 0.86;          // bläckhöjd för en ensam rad, andel av bandet
export const ROW_GAP = 0.10;       // luft mellan staplade rader, andel av bandet
export const ITEM_GAP = 0.25;      // luft mellan element i en rad, andel av radens bläckhöjd
export const OVERLAY_FRONT = 0.8;  // dubbeltext: främre radens storlek, andel av bakre
export const OVERLAY_SHIFT = 0.19; // dubbeltext: förskjutning för topp/botten, andel av bandet
export const FRONT_FRAC = 0.42;    // största radbredd, andel av omkretsen (synlig framsida)

const REF = 100;

const visible = e => e.t === 'sym' || (e.text && e.text.trim());

export function layoutContent(content, bandTop, bandBottom, maxW, measure, aspect) {
  const rows = ((content && content.rows) || []).filter(r => r.els.some(visible));
  if (!rows.length) return null;
  const bandH = bandBottom - bandTop;
  const cyMid = bandTop + bandH / 2;
  const n = rows.length;
  const overlay = content.layout === 'overlay' && n === 2;

  // önskad bläckhöjd per rad
  const target = ri => overlay
    ? FILL * bandH * (ri === 0 ? 1 : OVERLAY_FRONT)
    : (FILL * bandH - (n - 1) * ROW_GAP * bandH) / n;

  // bygg en rad så att dess bläck blir inkH högt
  const buildRow = (row, inkH) => {
    const els = row.els.filter(visible);
    let a = 0, d = 0;
    for (const e of els) {
      if (e.t !== 'text') continue;
      const m = measure(e, REF);
      a = Math.max(a, m.ascent); d = Math.max(d, m.descent);
    }
    const hasText = a + d > 0;
    const size = hasText ? REF * inkH / (a + d) : inkH;
    const k = size / REF;
    const asc = hasText ? a * k : inkH / 2;
    const desc = hasText ? d * k : inkH / 2;
    const symH = asc + desc;
    const gap = ITEM_GAP * symH;
    const items = els.map(e => e.t === 'sym'
      ? { kind: 'sym', el: e, id: e.id, color: e.color || null, sz: symH, w: symH * aspect(e.id) }
      : { kind: 'text', el: e, w: measure(e, size).width });
    const totW = items.reduce((s, it) => s + it.w, 0) + gap * Math.max(0, items.length - 1);
    return { size, asc, desc, inkH: asc + desc, gap, totW, items };
  };

  // för breda rader (längre än framsidan) krymps, bläckhöjden skalas med
  const layouts = rows.map((row, ri) => {
    const L = buildRow(row, target(ri));
    return L.totW > maxW && L.totW > 0 ? buildRow(row, L.inkH * maxW / L.totW) : L;
  });

  // bläckets vertikala mitt per rad
  let centers;
  if (overlay) {
    const p = content.overlayPos || 'mitten';
    const shift = p === 'topp' ? -OVERLAY_SHIFT : p === 'botten' ? OVERLAY_SHIFT : 0;
    centers = [cyMid, cyMid + shift * bandH];
  } else {
    const gapH = ROW_GAP * bandH;
    const blockH = layouts.reduce((s, L) => s + L.inkH, 0) + gapH * (n - 1);
    let y = cyMid - blockH / 2;
    centers = layouts.map(L => { const c = y + L.inkH / 2; y += L.inkH + gapH; return c; });
  }

  return layouts.map((L, ri) => {
    let x = -L.totW / 2;
    const items = L.items.map(it => { const cx = x + it.w / 2; x += it.w + L.gap; return { ...it, cx }; });
    return {
      size: L.size, inkH: L.inkH, gap: L.gap, totW: L.totW, items, row: rows[ri],
      // textens ritpunkt så att bläcket hamnar på centers[ri]
      cy: centers[ri] - (L.desc - L.asc) / 2,
      symCy: centers[ri],
    };
  });
}
