import { FONTS } from './data.js';
import { registerLibrarySymbol } from './symbols.js';
import { fontCatalog, libraryFont, fontBuffer } from './font-library.js';
import { loadFont } from './export.js';
const loaded = new Set();
export const unavailableFonts = new Set();
export async function useLibraryFont(id, register = true) {
  const f = await libraryFont(id);
  if (!loaded.has(id)) {
    const parsed = await loadFont(f.ttf);
    if (![...'ÅÄÖåäö'].every(c => parsed.charToGlyphIndex(c))) throw Error('Detta typsnitt saknar svenska bokstäver. Välj ett annat.');
    const face = await new FontFace(id, await fontBuffer(f.ttf)).load();
    document.fonts.add(face); loaded.add(id);
  }
  if (register) {
    const existing = FONTS.find(item => item.id === id);
    if (existing) Object.assign(existing, f); else FONTS.push(f);
  }
  unavailableFonts.delete(id);
  return f;
}
const node = (tag, text, cls) => { const e=document.createElement(tag); if(text)e.textContent=text; if(cls)e.className=cls; return e; };
async function json(url) {
  const r=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Biblioteket kunde inte nås. Försök igen.'); return r.json();
}
const translations={hund:'dog',katt:'cat',tass:'paw',hjärta:'heart',stjärna:'star',häst:'horse',blomma:'flower',fjäril:'butterfly',krona:'crown',ben:'bone',fågel:'bird',träd:'tree'};
export function createLibraryPicker(onPick) {
  const dialog=node('dialog',null,'library-dialog');
  const title=node('h2'); title.id='library-title'; dialog.setAttribute('aria-labelledby',title.id);
  const close=node('button','Stäng','btn ghost');close.type='button';close.onclick=()=>dialog.close();
  const form=node('form');const input=node('input');input.type='search';input.maxLength=80;input.setAttribute('aria-label','Sök i biblioteket');
  const search=node('button','Sök','btn');search.type='submit';form.append(input,search);
  const status=node('p',null,'note');status.setAttribute('role','status');
  const results=node('div',null,'library-results');const more=node('button','Visa fler','btn ghost');more.type='button';
  const source=node('a');source.target='_blank';source.rel='noopener';
  dialog.append(title,close,form,status,results,more,source);document.body.append(dialog);
  let mode, generation=0, offset=0, fontMatches=[];
  const error=e=>{status.textContent=['TypeError','TimeoutError','AbortError'].includes(e.name) ? 'Tjänsten kunde inte nås. Kontrollera anslutningen och försök igen.' : e.message || 'Något gick fel. Försök igen.';};
  const pick=async(b,action)=>{const token=generation,kind=mode;b.disabled=true;status.textContent='Hämtar…';try{const item=await action();if(token!==generation||!dialog.open)return;await onPick(kind,item);dialog.close();}catch(e){if(token===generation)error(e);}finally{b.disabled=false;}};
  const fontPage=()=>{
    for(const f of fontMatches.slice(offset,offset+24)) {
      const card=node('div',null,'library-card'), label=node('strong',f.name), sample=node('div','Luna Åäö','library-font-sample');
      const preview=node('button','Förhandsvisa','btn ghost'), choose=node('button','Välj','btn');
      preview.type=choose.type='button';
      preview.onclick=async()=>{preview.disabled=true;try{await useLibraryFont(f.id, false);sample.style.fontFamily=`"${f.id}"`;status.textContent=f.name;}catch(e){error(e);}finally{preview.disabled=false;}};
      choose.onclick=()=>pick(choose,()=>useLibraryFont(f.id));
      card.append(label,sample,preview,choose);results.append(card);
    }
    offset+=24;more.hidden=offset>=fontMatches.length;
  };
  async function run() {
    const token=++generation;results.replaceChildren();more.hidden=true;status.textContent='Söker…';
    try {
      const query=input.value.trim().toLowerCase();
      if(mode==='font') {
        const catalog=await fontCatalog();if(token!==generation)return;
        fontMatches=catalog.fonts.filter(f=>f.name.toLowerCase().includes(query)||f.id.includes(query));offset=0;fontPage();
        status.textContent=`${fontMatches.length} typsnitt. Förhandsvisa för att se stilen. Svenska bokstäver kontrolleras när typsnittet hämtas.`;
      } else {
        const q=translations[query]||query||'dog';
        const found=await json(`https://api.iconify.design/search?query=${encodeURIComponent(q)}&prefix=mdi&limit=48`);
        if(token!==generation)return;
        const names=(found.icons||[]).filter(id=>/^mdi:[a-z0-9-]+$/.test(id)).map(id=>id.slice(4));
        if(!names.length){status.textContent='Inga symboler hittades. Prova ett annat ord, gärna på engelska.';return;}
        const data=await json(`https://api.iconify.design/mdi.json?icons=${names.join(',')}`);if(token!==generation)return;
        let count=0;
        for(const name of names){
          const icon=data.icons?.[name];if(!icon)continue;
          const doc=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${icon.body}</svg>`,'image/svg+xml');
          const children=[...doc.documentElement.children];
          if(!children.length||children.some(e=>e.localName!=='path'||e.children.length||[...e.attributes].some(a=>!['d','fill','fill-rule','clip-rule'].includes(a.name))))continue;
          if(children.some(e=>e.hasAttribute('fill')&&e.getAttribute('fill')!=='currentColor'))continue;
          // Only one filled path: no strokes, layered colours or transforms.
          if(children.length!==1)continue;
          const path=children[0].getAttribute('d'), size=Math.max(icon.width||data.width||24,icon.height||data.height||24);
          if(!path||path.length>12000)continue;
          const b=node('button',null,'symopt');b.type='button';const cv=node('canvas');cv.width=cv.height=64;
          const ctx=cv.getContext('2d');ctx.translate(7,7);ctx.scale(50/size,50/size);ctx.fillStyle='#3a332b';ctx.fill(new Path2D(path),'evenodd');
          b.append(cv,node('span',name.replaceAll('-',' '),'option-name'));
          b.onclick=()=>pick(b,async()=>registerLibrarySymbol({id:'mdi-'+name,path,viewBox:size}));results.append(b);count++;
        }
        status.textContent=count ? `${count} symboler. Prova även engelska sökord.` : 'Inga enfärgade siluetter hittades. Prova ett annat sökord.';
      }
    }catch(e){if(token===generation)error(e);}
  }
  form.onsubmit=e=>{e.preventDefault();run();};more.onclick=fontPage;
  dialog.addEventListener('close',()=>{generation++;});
  return kind=>{mode=kind;title.textContent=kind==='font'?'Hitta typsnitt – Google Fonts':'Hitta symboler – Iconify';
    input.value='';input.placeholder=kind==='font'?'Sök typsnittets namn':'Sök t.ex. hund, tass eller heart';
    source.textContent=kind==='font'?'Google Fonts – källor och licenser':'Material Design Icons · Pictogrammers · Apache 2.0';
    source.href=kind==='font'?'https://github.com/google/fonts':'https://github.com/Templarian/MaterialDesign/blob/master/LICENSE';
    dialog.showModal();input.focus();run();};
}
