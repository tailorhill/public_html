// Pinned Google Fonts catalogue. Use the same static TTF for canvas and cutting.
let catalogPromise;
const buffers = new Map();
export async function fontCatalog() {
  if (!catalogPromise) catalogPromise = fetch('assets/libraries/google-fonts.json').then(r => {
    if (!r.ok) throw Error('Typsnittskatalogen kunde inte laddas.'); return r.json();
  }).catch(e => { catalogPromise = null; throw e; });
  return catalogPromise;
}
export async function libraryFont(id) {
  const catalog = await fontCatalog();
  const entry = catalog.fonts.find(f => f.id === id);
  if (!entry) throw Error('Typsnittet saknas i biblioteket.');
  return { ...entry, css: `"${id}"`, weight: 400, caps: false, ttf: '@' + id,
    source: `https://github.com/google/fonts/tree/${entry.revision || catalog.revision}/${entry.path.split('/').slice(0,2).join('/')}` };
}
export async function fontBuffer(ttf) {
  if (!buffers.has(ttf)) buffers.set(ttf, (async () => {
    let url = `fonts/${ttf}`;
    if (ttf.startsWith('@gf-')) {
      const catalog = await fontCatalog(), entry = catalog.fonts.find(f => '@' + f.id === ttf);
      if (!entry) throw Error('Okänt typsnitt.');
      url = `https://raw.githubusercontent.com/google/fonts/${entry.revision || catalog.revision}/${entry.path}`;
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('Typsnittet kunde inte hämtas. Kontrollera anslutningen och försök igen.');
    return response.arrayBuffer();
  })().catch(e => { buffers.delete(ttf); throw e; }));
  return buffers.get(ttf);
}
