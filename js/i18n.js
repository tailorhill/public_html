// Språk för designverktyget: svenska och engelska.
//
// Bara GRÄNSSNITTET översätts. Allt som går till butiken eller Valley Dogs –
// Abicart-fälten, övrig info, beställningstexten, skärfilerna och
// leverantörsvyns knappar – är alltid på svenska: varukorgen matchar butikens
// svenska alternativnamn, och sömmerskan läser svenska. Katalogens `name` är
// därför alltid svenskt; tName() översätter bara vid visning.
//
// Språkval, i den här ordningen:
//   1. ?lang=sv / ?lang=en i länken (t.ex. från en engelsk butikssida)
//   2. kundens tidigare val (sparas i webbläsaren)
//   3. webbläsarens önskade språk, i kundens prioritetsordning
//      (sv → svenska, en → engelska; norska/danska → svenska)
//   4. inget av dem: svensk tidszon → svenska, annars engelska

export const LANGS = ['sv', 'en'];
const STORE = 'vd_lang';
const NORDIC = ['sv', 'nb', 'nn', 'no', 'da'];

export function detectLang() {
  if (typeof window === 'undefined') return 'sv';   // node/tester
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
  } catch { /* ok */ }
  try {
    const saved = localStorage.getItem(STORE);
    if (LANGS.includes(saved)) return saved;
  } catch { /* ok */ }
  try {
    for (const l of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])) {
      const base = String(l || '').toLowerCase().split('-')[0];
      if (NORDIC.includes(base)) return 'sv';
      if (base === 'en') return 'en';
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Stockholm' ? 'sv' : 'en';
  } catch {
    return 'sv';
  }
}

let lang = detectLang();
const listeners = [];
export const getLang = () => lang;
export function onLangChange(fn) { listeners.push(fn); }
export function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  lang = l;
  try { localStorage.setItem(STORE, l); } catch { /* ok */ }
  // ?lang= vinner vid omladdning – håll den i takt med valet
  try {
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(history.state, '', u); }
  } catch { /* ok */ }
  applyStatic();
  listeners.forEach(fn => fn(l));
}

// ------------------------------------------------------------- gränssnitt
export const DICT = {
  sv: {
    'doc.title': 'Designa ditt halsband – 3D-verktyg',
    'lang.aria': 'Språk',
    'top.h1': 'Designa ditt halsband',
    'top.sub': '3D-designverktyg för måttbeställda halsband från <a href="https://www.valleydogs.se" target="_blank" rel="noopener">Valley Dogs</a>',
    's1.h': '1 · Material',
    'fam.cotton': 'Bomullshalsband<small>med foder</small>',
    'fam.bio': 'BioThane Beta®<small>vattentåligt</small>',
    's2.h': '2 · Modell & bredd',
    'lbl.model': 'Halsbandsmodell',
    'lbl.finishedWidth': 'Färdig bredd',
    'lbl.width': 'Bredd',
    's3.cotton': '3 · Färg på bomullsband',
    's3.bio': '3 · Färg på BioThane',
    's4.h': '4 · Foder',
    'note.leather': 'Äkta läder: +120 kr',
    'note.lining': 'Fodret syns som kanten över och under bomullsbandet samt på insidan.',
    'note.bioTemp': 'Neonorange och Mango är tillfälliga partier och finns endast i 25 mm.',
    'glit.h': 'Helglittrigt <span class="tag">tillval</span>',
    'glit.toggle': 'Glitter över hela bandet',
    'lbl.glitterColor': 'Glitterfärg',
    's5.h': '5 · Storlek',
    'lbl.sizeRange': 'Storleksintervall',
    'size.circLabel': 'Halsmått i stängt läge:',
    'note.measure': 'Mät en gång extra – halsbanden går inte att sy om! Se <a href="https://www.valleydogs.se/storleksguide" target="_blank" rel="noopener">storleksguiden</a>.',
    's6.h': '6 · Text & symboler',
    'note.build': 'Bygg raden fritt: lägg till text och symboler i valfri ordning (t.ex. kvist – namn – kvist). Klicka på ett element för att ändra det.',
    'btn.addText': '+ Text',
    'btn.addSymbol': '+ Symbol',
    'btn.addRow': '+ Rad',
    'title.moveLeft': 'Flytta åt vänster',
    'title.moveRight': 'Flytta åt höger',
    'btn.remove': 'Ta bort',
    'ph.text': 'T.ex. hundens namn',
    'lbl.font': 'Typsnitt',
    'btn.moreFonts': 'Fler typsnitt · Google Fonts',
    'note.caps': 'Detta typsnitt finns endast med versaler.',
    'lbl.textColor': 'Textfärg',
    'lbl.symbol': 'Symbol',
    'btn.moreSymbols': 'Sök fler symboler · Iconify',
    'lbl.symbolColor': 'Symbolfärg',
    'note.flag': 'Flaggor sys alltid i sina riktiga färger.',
    'lbl.multiRows': 'Flera rader',
    'lbl.frontPos': 'Position på främre raden',
    'note.special': 'Specialfärger kan inte användas som skugga eller vid dubbeltext. På BioThane kan Dimmig användas ensam; övriga specialfärger är inte tillgängliga.',
    'lbl.shadow': 'Skugga',
    'lbl.shadowOn': 'Skugga på',
    'lbl.shadowColor': 'Skuggfärg',
    'note.customSymbol': 'Egen symbol? Mejla den till <a href="mailto:info@valleydogs.se">info@valleydogs.se</a> och skriv det i övrig info.',
    's7.h': '7 · Beslag',
    'note.preview3d': 'Alla modeller visas som ett helt halsband utan beslag i 3D. Förhandsvisningen visar material, färger, text och symboler. Vald modell och beslag gäller för beställningen.',
    's8.h': '8 · Övrig info',
    'ph.extra': 'T.ex. dubbeltext: bakre texten i typsnitt … färg …, främre texten i typsnitt … färg …',
    'sum.h': 'Ditt halsband',
    'sum.total': 'Totalt',
    'btn.cart': '🛒 Lägg i varukorgen',
    'btn.share': '💾 Spara designen',
    'btn.product': 'Öppna produktsidan hos Valley Dogs ↗',
    'note.cart': 'Lägg halsbandet i varukorgen och slutför köpet hos Valley Dogs. "Spara designen" kopierar en länk till just den här designen – spara den om du vill fortsätta senare eller dela den.',
    'btn.snapshot': 'Ladda ner bild (PNG)',
    'aria.stage': 'Förhandsvisning av halsbandet',
    'view.overview': 'Översikt',
    'view.edge': 'Närbild kant',
    'view.inside': 'Insida',
    'zoom.in': 'Zooma in',
    'zoom.out': 'Zooma ut',
    'hint.stage': 'Dra för att rotera · scrolla eller +/− för att zooma',
    'legend.title': 'Dina val',
    'info.h': 'Bra att veta innan du börjar',
    'info.p1': 'Här designar du ditt halsband och ser det ta form i 3D – material, färger, texter och symboler.',
    'info.p2': 'Tänk på att 3D-visningen är en <strong>förhandsbild</strong>. Varje halsband sys för hand, och det färdiga resultatet kan skilja sig något från visningen: färger kan upplevas olika beroende på skärm, och textens exakta storlek och placering anpassas i hantverket för bästa resultat.',
    'info.p3': 'Är du osäker på något? Mejla oss på <a href="mailto:info@valleydogs.se">info@valleydogs.se</a> – vi hjälper gärna till innan du beställer.',
    'info.ok': 'Jag förstår – börja designa',

    'kr': '{n} kr',
    'plus': ' (+{n} kr)',
    'price.glitterPrefix': 'Helglittrigt ',
    'price.size': 'Storlek: {name}',
    'price.leather': 'Äkta läder på fodret',
    'price.bio': 'Halsband i BioThane Beta®',
    'price.bioGlitter': 'Helglittrigt halsband i BioThane Beta®',
    'price.width': 'Bredd {name}',
    'chip.empty': 'text…',
    'row.full': 'Raden är full (max {n} tecken inkl. symboler). Ta bort något för att lägga till mer.',
    'font.capsOnly': ' (endast versaler)',
    'tc.overlayGlitter': 'Främre raden ligger ovanpå den bakre. Eftersom bakre raden är glitter måste den främre också vara glitter – slätt material fäster inte på glitter.',
    'tc.overlay': 'Vid dubbeltext (ovanpå) fäster inte slätt material på glitter. Håll raderna slätt-på-slätt eller glitter-på-glitter.',
    'tc.fullGlitter': 'Hela bandet är i glittermaterial, så texten måste också väljas i en glittrig färg.',
    'tc.glitterShadow': 'Texten ligger ovanpå en glittrig skugga och måste därför också vara i glitter.',
    'tc.default': 'Materialets vanliga färgval gäller.',
    'sym.sameAsText': 'Samma som texten',
    'sc.fullGlitter': 'Hela bandet är i glittermaterial, så symbolen måste också vara i en glittrig färg.',
    'sc.glitterShadow': 'Symbolen ligger ovanpå en glittrig skugga och måste därför också vara i glitter.',
    'sc.default': 'Välj "Samma som texten" eller en egen färg för just den här symbolen.',
    'layout.stack': 'Staplade rader',
    'layout.overlay': 'Ovanpå (dubbeltext)',
    'customSize.bio': 'Skriv önskat storleksintervall under Övrig info. Den ställbara delen kan vara max 10 cm. Egen storlek kostar 30 kr extra.',
    'customSize.cotton': 'Skriv önskat storleksintervall under Övrig info. Egen storlek kostar 30 kr extra.',
    'bandWidthNote': 'Bomullsbandet är {w} brett – fodret utgör resten av bredden. {n} färger finns i denna bredd.',
    'noShadow.bio': 'Skugga finns inte på BioThane.',
    'noShadow.double': 'Skugga går inte att kombinera med dubbeltext.',
    'shadow.textOnly': 'Bara text',
    'shadow.all': 'Text och symboler',
    'buckle.halvstryp': 'Halvstryp med två D-ringar och genomgående band. Ringar i valt utförande.',
    'buckle.justerbart': 'Justerbart halvstryp med martingale-ögla. Beslag i valt utförande.',
    'buckle.cotton': 'Klickspänne: svart plast. D-ring i valt utförande.',
    'buckle.bio': 'Metallspänne, D-ringar och nitar i valt utförande.',
    'err.fontLoad': 'Ett valt typsnitt kunde inte laddas. Ladda om sidan för att försöka igen, eller välj ett annat typsnitt.',
    'perRow': ' per rad',
    'size.customNoLimit': 'Egen storlek har ingen teckengräns. Skriv önskat storleksintervall under Övrig info.',
    'size.limit': '{name}: max {n} tecken{perRow}, inklusive symboler. Varje symbol räknas som ett tecken. Mellanslag räknas också.',
    'size.noLimit': 'För denna modell finns ingen storleksberoende teckengräns. Text och symboler anpassas till bandet i förhandsvisningen.',
    'tl.customNoLimit': 'Egen storlek har ingen teckengräns. Ange önskat storleksintervall under Övrig info.',
    'tl.limit': 'Max {n} tecken inklusive symboler{perRow}. Rader (tecken+symboler): {rows}. Detta fält får innehålla högst {max} tecken.',
    'tl.noLimit': 'Texten görs alltid i stor storlek, anpassad till bandet.',
    'lg.title': 'Dina val · {family} · {w} cm · {band}',
    'lg.cotton': 'Bomull',
    'lg.bio': 'BioThane',
    'lg.lining': 'Foder: {m} · {name}',
    'lg.model': 'Modell',
    'lg.size': 'Storlek',
    'lg.band': 'Band',
    'lg.liningMaterial': 'Fodermaterial',
    'lg.liningColor': 'Foderfärg / mönster',
    'lg.fullGlitter': 'Helglitter',
    'lg.row': 'Rad {n}',
    'lg.emptyText': '(tom text)',
    'lg.symbolColor': 'Symbolfärg',
    'lg.shadow': 'Skugga',
    'lg.shadowAll': 'text och symboler',
    'lg.shadowText': 'bara text',
    'lg.hardware': 'Beslag',
    'lg.searchedSymbol': 'sökt symbol',
    'cart.notLinked': 'Den här produktvarianten är inte kopplad till varukorgen än. Använd "Kopiera beställningstext" så länge, eller välj en annan modell/bredd.',
    'cart.preparing': 'Förbereder…',
    'cart.problems': 'Några val går inte att beställa för just den här modellen/bredden:\n\n{list}\n\nÄndra dem i designen så lägger vi halsbandet i varukorgen.',
    'cart.going': 'Går till butiken…',
    'cart.failed': 'Kunde inte nå butiken just nu ({msg}). Försök igen, eller använd "Kopiera beställningstext".',
    'share.copied': '✓ Länk kopierad!',

    'rules.textColorFixed': 'En text fick en tillåten färg för den valda kombinationen.',
    'rules.symbolFollows': 'En symbol följer nu textens färg, eftersom den valda symbolfärgen inte går ihop med kombinationen.',
    'rules.rowLabel': 'Rad {n}: ',
    'rules.tooMany': '{label}Vald storlek tillåter max {limit} tecken inklusive symboler ({used} valda). Korta texten eller ta bort symboler.',
    'rules.customNeedsInfo': 'Skriv önskat storleksintervall i Övrig info för egen storlek.',
    'rules.badTextColor': 'Otillåten färg på en text.',
    'rules.badSymbolColor': 'Otillåten färg på en symbol.',

    'lib.close': 'Stäng',
    'lib.searchAria': 'Sök i biblioteket',
    'lib.search': 'Sök',
    'lib.more': 'Visa fler',
    'lib.choose': 'Välj',
    'lib.unreachable': 'Tjänsten kunde inte nås. Kontrollera anslutningen och försök igen.',
    'lib.error': 'Något gick fel. Försök igen.',
    'lib.fetching': 'Hämtar…',
    'lib.searching': 'Söker…',
    'lib.loadingFont': 'Laddar typsnitt…',
    'lib.noPreview': 'Förhandsvisning saknas',
    'lib.fontsFound': '{n} typsnitt. Proverna visar automatiskt rätt stil när de har laddats. Svenska bokstäver kontrolleras samtidigt.',
    'lib.noFonts': 'Inga typsnitt hittades. Prova ett annat namn.',
    'lib.noSymbols': 'Inga symboler hittades. Prova ett annat ord, gärna på engelska.',
    'lib.symbolsFound': '{n} symboler. Prova även engelska sökord.',
    'lib.noSilhouettes': 'Inga enfärgade siluetter hittades. Prova ett annat sökord.',
    'lib.titleFont': 'Hitta typsnitt – Google Fonts',
    'lib.titleSymbol': 'Hitta symboler – Iconify',
    'lib.phFont': 'Sök typsnittets namn',
    'lib.phSymbol': 'Sök t.ex. hund, tass eller heart',
    'lib.srcFont': 'Google Fonts – källor och licenser',
    'lib.noSwedish': 'Detta typsnitt saknar svenska bokstäver. Välj ett annat.',
    'lib.unreachableLib': 'Biblioteket kunde inte nås. Försök igen.',
    'lib.retry': 'Försök igen',
    'lib.fontFetchFailed': 'Kunde inte hämta typsnittet. Försök igen.',
    'font.catalogFailed': 'Typsnittskatalogen kunde inte laddas.',
    'font.missing': 'Typsnittet saknas i biblioteket.',
    'font.unknown': 'Okänt typsnitt.',
    'font.fetchFailed': 'Typsnittet kunde inte hämtas. Kontrollera anslutningen och försök igen.',
  },
  en: {
    'doc.title': 'Design your collar – 3D tool',
    'lang.aria': 'Language',
    'top.h1': 'Design your collar',
    'top.sub': '3D design tool for made-to-measure collars from <a href="https://www.valleydogs.se" target="_blank" rel="noopener">Valley Dogs</a>',
    's1.h': '1 · Material',
    'fam.cotton': 'Cotton collar<small>with lining</small>',
    'fam.bio': 'BioThane Beta®<small>waterproof</small>',
    's2.h': '2 · Model & width',
    'lbl.model': 'Collar model',
    'lbl.finishedWidth': 'Finished width',
    'lbl.width': 'Width',
    's3.cotton': '3 · Webbing colour',
    's3.bio': '3 · BioThane colour',
    's4.h': '4 · Lining',
    'note.leather': 'Genuine leather: +120 SEK',
    'note.lining': 'The lining shows as the edge above and below the webbing and on the inside.',
    'note.bioTemp': 'Neon orange and Mango are limited batches and only available in 25 mm.',
    'glit.h': 'All-over glitter <span class="tag">option</span>',
    'glit.toggle': 'Glitter over the whole collar',
    'lbl.glitterColor': 'Glitter colour',
    's5.h': '5 · Size',
    'lbl.sizeRange': 'Size range',
    'size.circLabel': 'Neck size (closed):',
    'note.measure': 'Measure twice – collars cannot be re-sewn! See the <a href="https://www.valleydogs.se/storleksguide" target="_blank" rel="noopener">size guide</a> (in Swedish).',
    's6.h': '6 · Text & symbols',
    'note.build': 'Build the row freely: add text and symbols in any order (e.g. branch – name – branch). Click an element to change it.',
    'btn.addText': '+ Text',
    'btn.addSymbol': '+ Symbol',
    'btn.addRow': '+ Row',
    'title.moveLeft': 'Move left',
    'title.moveRight': 'Move right',
    'btn.remove': 'Remove',
    'ph.text': "E.g. your dog's name",
    'lbl.font': 'Font',
    'btn.moreFonts': 'More fonts · Google Fonts',
    'note.caps': 'This font is capital letters only.',
    'lbl.textColor': 'Text colour',
    'lbl.symbol': 'Symbol',
    'btn.moreSymbols': 'Search more symbols · Iconify',
    'lbl.symbolColor': 'Symbol colour',
    'note.flag': 'Flags are always made in their real colours.',
    'lbl.multiRows': 'Multiple rows',
    'lbl.frontPos': 'Position of the front row',
    'note.special': 'Special colours cannot be used as a shadow or with layered text. On BioThane, Misty can be used on its own; other special colours are not available.',
    'lbl.shadow': 'Shadow',
    'lbl.shadowOn': 'Shadow behind',
    'lbl.shadowColor': 'Shadow colour',
    'note.customSymbol': 'Your own symbol? Email it to <a href="mailto:info@valleydogs.se">info@valleydogs.se</a> and mention it under Other info.',
    's7.h': '7 · Hardware',
    'note.preview3d': 'All models are shown in 3D as a closed collar without hardware. The preview shows materials, colours, text and symbols. The chosen model and hardware apply to your order.',
    's8.h': '8 · Other info',
    'ph.extra': 'E.g. layered text: back text in font … colour …, front text in font … colour …',
    'sum.h': 'Your collar',
    'sum.total': 'Total',
    'btn.cart': '🛒 Add to cart',
    'btn.share': '💾 Save design',
    'btn.product': 'Open the product page at Valley Dogs ↗',
    'note.cart': 'Add the collar to the cart and complete your purchase at Valley Dogs (the shop is in Swedish). "Save design" copies a link to this design – keep it to continue later or to share it.',
    'btn.snapshot': 'Download image (PNG)',
    'aria.stage': 'Collar preview',
    'view.overview': 'Overview',
    'view.edge': 'Edge close-up',
    'view.inside': 'Inside',
    'zoom.in': 'Zoom in',
    'zoom.out': 'Zoom out',
    'hint.stage': 'Drag to rotate · scroll or +/− to zoom',
    'legend.title': 'Your choices',
    'info.h': 'Good to know before you start',
    'info.p1': 'Here you design your collar and watch it take shape in 3D – materials, colours, text and symbols.',
    'info.p2': 'Please note that the 3D view is a <strong>preview</strong>. Every collar is sewn by hand, and the finished result may differ slightly from the preview: colours can look different depending on your screen, and the exact size and placement of the text are adjusted by hand for the best result.',
    'info.p3': 'Unsure about anything? Email us at <a href="mailto:info@valleydogs.se">info@valleydogs.se</a> – we are happy to help before you order.',
    'info.ok': 'Got it – start designing',

    'kr': '{n} SEK',
    'plus': ' (+{n} SEK)',
    'price.glitterPrefix': 'All-over glitter ',
    'price.size': 'Size: {name}',
    'price.leather': 'Genuine leather lining',
    'price.bio': 'BioThane Beta® collar',
    'price.bioGlitter': 'All-over glitter BioThane Beta® collar',
    'price.width': 'Width {name}',
    'chip.empty': 'text…',
    'row.full': 'The row is full (max {n} characters incl. symbols). Remove something to add more.',
    'font.capsOnly': ' (capitals only)',
    'tc.overlayGlitter': 'The front row lies on top of the back row. Since the back row is glitter, the front row must be glitter too – smooth material does not stick to glitter.',
    'tc.overlay': 'With layered text, smooth material does not stick to glitter. Keep the rows smooth-on-smooth or glitter-on-glitter.',
    'tc.fullGlitter': 'The whole collar is glitter material, so the text must also be a glitter colour.',
    'tc.glitterShadow': 'The text lies on top of a glitter shadow and must therefore also be glitter.',
    'tc.default': "The material's standard colour options apply.",
    'sym.sameAsText': 'Same as text',
    'sc.fullGlitter': 'The whole collar is glitter material, so the symbol must also be a glitter colour.',
    'sc.glitterShadow': 'The symbol lies on top of a glitter shadow and must therefore also be glitter.',
    'sc.default': 'Choose "Same as text" or a colour of its own for this symbol.',
    'layout.stack': 'Stacked rows',
    'layout.overlay': 'On top (layered text)',
    'customSize.bio': 'Enter the size range you want under Other info. The adjustable part can be at most 10 cm. Custom size costs 30 SEK extra.',
    'customSize.cotton': 'Enter the size range you want under Other info. Custom size costs 30 SEK extra.',
    'bandWidthNote': 'The webbing is {w} wide – the lining makes up the rest of the width. {n} colours are available in this width.',
    'noShadow.bio': 'Shadow is not available on BioThane.',
    'noShadow.double': 'Shadow cannot be combined with layered text.',
    'shadow.textOnly': 'Text only',
    'shadow.all': 'Text and symbols',
    'buckle.halvstryp': 'Half-check collar with two D-rings and a running strap. Rings in the chosen finish.',
    'buckle.justerbart': 'Adjustable half-check collar with a martingale loop. Hardware in the chosen finish.',
    'buckle.cotton': 'Clip buckle: black plastic. D-ring in the chosen finish.',
    'buckle.bio': 'Metal buckle, D-rings and rivets in the chosen finish.',
    'err.fontLoad': 'A chosen font could not be loaded. Reload the page to try again, or choose another font.',
    'perRow': ' per row',
    'size.customNoLimit': 'Custom size has no character limit. Enter the size range you want under Other info.',
    'size.limit': '{name}: max {n} characters{perRow}, including symbols. Each symbol counts as one character. Spaces count too.',
    'size.noLimit': 'This model has no size-dependent character limit. Text and symbols are fitted to the collar in the preview.',
    'tl.customNoLimit': 'Custom size has no character limit. Enter the size range you want under Other info.',
    'tl.limit': 'Max {n} characters including symbols{perRow}. Rows (characters+symbols): {rows}. This field can hold at most {max} characters.',
    'tl.noLimit': 'The text is always made large, fitted to the collar.',
    'lg.title': 'Your choices · {family} · {w} cm · {band}',
    'lg.cotton': 'Cotton',
    'lg.bio': 'BioThane',
    'lg.lining': 'Lining: {m} · {name}',
    'lg.model': 'Model',
    'lg.size': 'Size',
    'lg.band': 'Colour',
    'lg.liningMaterial': 'Lining material',
    'lg.liningColor': 'Lining colour / pattern',
    'lg.fullGlitter': 'All-over glitter',
    'lg.row': 'Row {n}',
    'lg.emptyText': '(empty text)',
    'lg.symbolColor': 'Symbol colour',
    'lg.shadow': 'Shadow',
    'lg.shadowAll': 'text and symbols',
    'lg.shadowText': 'text only',
    'lg.hardware': 'Hardware',
    'lg.searchedSymbol': 'searched symbol',
    'cart.notLinked': 'This product variant is not connected to the cart yet. Please choose another model/width, or contact info@valleydogs.se.',
    'cart.preparing': 'Preparing…',
    'cart.problems': 'Some choices cannot be ordered for this model/width:\n\n{list}\n\nChange them in the design and we will add the collar to the cart.\n(The details above come from the Swedish shop.)',
    'cart.going': 'Going to the shop…',
    'cart.failed': 'Could not reach the shop right now ({msg}). Please try again.',
    'share.copied': '✓ Link copied!',

    'rules.textColorFixed': 'A text was given a colour that works with the chosen combination.',
    'rules.symbolFollows': 'A symbol now follows the text colour, because the chosen symbol colour does not work with the combination.',
    'rules.rowLabel': 'Row {n}: ',
    'rules.tooMany': '{label}The chosen size allows max {limit} characters including symbols ({used} chosen). Shorten the text or remove symbols.',
    'rules.customNeedsInfo': 'Enter the size range you want under Other info for a custom size.',
    'rules.badTextColor': 'A text has a colour that is not allowed.',
    'rules.badSymbolColor': 'A symbol has a colour that is not allowed.',

    'lib.close': 'Close',
    'lib.searchAria': 'Search the library',
    'lib.search': 'Search',
    'lib.more': 'Show more',
    'lib.choose': 'Choose',
    'lib.unreachable': 'The service could not be reached. Check your connection and try again.',
    'lib.error': 'Something went wrong. Please try again.',
    'lib.fetching': 'Fetching…',
    'lib.searching': 'Searching…',
    'lib.loadingFont': 'Loading font…',
    'lib.noPreview': 'No preview available',
    'lib.fontsFound': '{n} fonts. The samples switch to the right style automatically once loaded. Swedish letters (å, ä, ö) are checked at the same time.',
    'lib.noFonts': 'No fonts found. Try another name.',
    'lib.noSymbols': 'No symbols found. Try another word.',
    'lib.symbolsFound': '{n} symbols.',
    'lib.noSilhouettes': 'No single-colour silhouettes found. Try another search word.',
    'lib.titleFont': 'Find fonts – Google Fonts',
    'lib.titleSymbol': 'Find symbols – Iconify',
    'lib.phFont': 'Search for a font name',
    'lib.phSymbol': 'Search e.g. dog, paw or heart',
    'lib.srcFont': 'Google Fonts – sources and licences',
    'lib.noSwedish': 'This font lacks Swedish letters (å, ä, ö). Please choose another.',
    'lib.unreachableLib': 'The library could not be reached. Please try again.',
    'lib.retry': 'Try again',
    'lib.fontFetchFailed': 'Could not fetch the font. Please try again.',
    'font.catalogFailed': 'The font catalogue could not be loaded.',
    'font.missing': 'The font is not in the library.',
    'font.unknown': 'Unknown font.',
    'font.fetchFailed': 'The font could not be fetched. Check your connection and try again.',
  },
};

export function t(key, vars) {
  let s = (DICT[lang] && DICT[lang][key]) ?? DICT.sv[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

// ---------------------------------------------------- katalognamn (visning)
// Svenska katalognamn → engelska. Mönster (…glitter, …metallic, … pläterad,
// "(…)") översätts med regler, så att även nya material från admin får en
// rimlig engelsk text. Okända namn visas på svenska.
const NAMES = {
  'Svart': 'Black', 'Vit': 'White', 'Sverigeblå': 'Swedish blue', 'Röd': 'Red', 'Vinröd': 'Wine red',
  'Cerise': 'Cerise', 'Ljusrosa': 'Light pink', 'Solgul': 'Sun yellow', 'Gul': 'Yellow', 'Orange': 'Orange',
  'Gräsgrön': 'Grass green', 'Grön': 'Green', 'Bensin': 'Petrol', 'Ljusblå': 'Light blue',
  'Tiffany blå': 'Tiffany blue', 'Lila': 'Purple', 'Guld': 'Gold', 'Silver': 'Silver', 'Koppar': 'Copper',
  'Rosé': 'Rosé', 'Roséguld': 'Rose gold', 'Nougat': 'Nougat', 'Champagne': 'Champagne', 'Aqua': 'Aqua',
  'Petrol': 'Petrol', 'Konfetti': 'Confetti', 'Oliv': 'Olive', 'Lavendel': 'Lavender',
  'Regnbåge': 'Rainbow', 'Dimmig': 'Misty', 'Reflex': 'Reflective', 'Marinblå': 'Navy blue',
  'Turkos': 'Turquoise', 'Skogsgrön': 'Forest green', 'Neongrön': 'Neon green', 'Brun': 'Brown',
  'Khaki': 'Khaki', 'Grå': 'Grey', 'Off-white': 'Off-white', 'Pastellrosa': 'Pastel pink',
  'Puderrosa': 'Powder pink', 'Jeans': 'Denim', 'Pastellblå': 'Pastel blue', 'Pastellgrön': 'Pastel green',
  'Äppelgrön': 'Apple green', 'Pastellgul': 'Pastel yellow', 'Neonorange': 'Neon orange', 'Mango': 'Mango',
  'Krämvit': 'Cream white', 'Old red': 'Old red', 'Brun flammig': 'Mottled brown', 'Babyrosa': 'Baby pink',
  'Rosa': 'Pink', 'Blå': 'Blue', 'Körsbärsblom': 'Cherry blossom', 'Citron': 'Lemon', 'Randig': 'Striped',
  'Blommig': 'Floral', 'Taggig blå': 'Zigzag blue', 'Gul taggig': 'Zigzag yellow', 'Solfjäder blå': 'Blue fans',
  'Ljus lavendel': 'Light lavender', 'Marinblå blommor': 'Navy flowers', 'Stora blommor': 'Large flowers',
  'Rosa leopard': 'Pink leopard', 'Leopard': 'Leopard', 'Löv': 'Leaves',
  'limited': 'limited',
  // foder
  'Äkta läder': 'Genuine leather', 'Metallic konstskinn': 'Metallic faux leather',
  'Behandlad bomull': 'Coated cotton', 'mönstrad': 'patterned', 'Softshell': 'Softshell',
  // beslag
  'Vanliga i stål': 'Standard steel', 'Antik mässing': 'Antique brass', 'Solid mässing': 'Solid brass',
  // modeller
  'Fast halsband': 'Standard collar', 'Halvstryp': 'Half-check collar',
  'Halvstryp med knäppe': 'Half-check collar with clip buckle', 'Ställbart halsband': 'Adjustable collar',
  'Agilityhalsband': 'Agility collar', 'Justerbart halvstryp': 'Adjustable half-check collar',
  // storlek
  'Egen storlek': 'Custom size', 'max 10 cm ställbar del': 'max 10 cm adjustable part',
  // symboler
  'Ingen symbol': 'No symbol', 'Tass': 'Paw', 'Hjärta': 'Heart', 'Små hjärtan': 'Small hearts',
  'Stjärna': 'Star', 'Stjärnor': 'Stars', 'Blinkande stjärna': 'Twinkling star', 'Krona': 'Crown',
  'Blixt': 'Lightning', 'Eld': 'Fire', 'Fyrklöver': 'Four-leaf clover', 'Diamant': 'Diamond',
  'Pokal': 'Trophy', 'Dödskalle': 'Skull', 'Bomb': 'Bomb', 'Treudd': 'Trident',
  'Kvist vänster': 'Branch left', 'Kvist höger': 'Branch right', 'Dalahäst': 'Dala horse',
  'Vallhund': 'Herding dog', 'Får': 'Sheep', 'Apportbock': 'Retrieving dumbbell', 'Virvelvind': 'Whirlwind',
  'Clown': 'Clown', 'Monster': 'Monster', 'Svenska flaggan': 'Swedish flag', 'Norska flaggan': 'Norwegian flag',
  'Finska flaggan': 'Finnish flag', 'Danska flaggan': 'Danish flag',
  // dubbeltext-position
  'Topp': 'Top', 'Mitten': 'Middle', 'Botten': 'Bottom',
  // noter på färger
  'Finns INTE i 25/38 mm': 'NOT available in 25/38 mm',
  'Tillfälligt parti, endast 25 mm': 'Limited batch, 25 mm only',
};

export function tName(sv) {
  if (lang === 'sv' || sv == null) return sv;
  const s = String(sv);
  if (NAMES[s]) return NAMES[s];
  let m;
  if ((m = s.match(/^(.*\S)\s*\((.+)\)$/))) return `${tName(m[1])} (${tName(m[2])})`;
  if ((m = s.match(/^(.+?)glitter$/i))) return `${tName(m[1])} glitter`;
  if ((m = s.match(/^(.+?)metallic$/i)) && m[1] !== 'Metallic') return `${tName(m[1])} metallic`;
  if ((m = s.match(/^(.+) pläterad$/))) return `${tName(m[1])} plated`;
  if (/^\d+,\d+\s*(cm|mm)$/.test(s)) return s.replace(',', '.');   // 2,5 cm → 2.5 cm
  return s;
}

// ------------------------------------------------------- statisk HTML
// data-i18n="nyckel"        → textContent
// data-i18n-html="nyckel"   → innerHTML (för text med länkar/fetstil)
// data-i18n-attr="title:nyckel;placeholder:nyckel"
export function applyStatic(root) {
  if (typeof document === 'undefined') return;
  root = root || document;
  document.documentElement.lang = lang;
  document.title = t('doc.title');
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach(el => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map(x => x.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
  root.querySelectorAll('[data-lang]').forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('sel', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
