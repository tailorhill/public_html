// Katalogdata hämtad från valleydogs.se (produkter + material till halsband).
// Hex-koder är approximationer av foto-swatcharna på materialsidorna.

export const BIOTHANE_COLORS = [
  { id: 'svart',        name: 'Svart',        hex: '#1b1c1e' },
  { id: 'marinbla',     name: 'Marinblå',     hex: '#1d2b45' },
  { id: 'sverigebla',   name: 'Sverigeblå',   hex: '#1747a8' },
  { id: 'turkos',       name: 'Turkos',       hex: '#1793b8' },
  { id: 'aqua',         name: 'Aqua',         hex: '#14a89c' },
  { id: 'skogsgron',    name: 'Skogsgrön',    hex: '#10554c' },
  { id: 'oliv',         name: 'Oliv',         hex: '#5c6054' },
  { id: 'brun',         name: 'Brun',         hex: '#413441' },
  { id: 'vinrod',       name: 'Vinröd',       hex: '#6b3352' },
  { id: 'rod',          name: 'Röd',          hex: '#b62633' },
  { id: 'gul',          name: 'Gul',          hex: '#e3b70e' },
  { id: 'vit',          name: 'Vit',          hex: '#edf1f4' },
  { id: 'cerise',       name: 'Cerise',       hex: '#ec1e7f' },
  { id: 'ljusrosa',     name: 'Ljusrosa',     hex: '#e795c2' },
  { id: 'pastellrosa',  name: 'Pastellrosa',  hex: '#d8a3ab' },
  { id: 'puderrosa',    name: 'Puderrosa',    hex: '#efb99f' },
  { id: 'lila',         name: 'Lila',         hex: '#2c2f78' },
  { id: 'lavendel',     name: 'Lavendel',     hex: '#a9a5d4' },
  { id: 'jeans',        name: 'Jeans',        hex: '#4a7c9b' },
  { id: 'pastellbla',   name: 'Pastellblå',   hex: '#a8cbe4' },
  { id: 'pastellgron',  name: 'Pastellgrön',  hex: '#9aa895' },
  { id: 'appelgron',    name: 'Äppelgrön',    hex: '#8fce93' },
  { id: 'pastellgul',   name: 'Pastellgul',   hex: '#e7eb9e' },
  { id: 'orange',       name: 'Orange',       hex: '#c35427', note: 'Finns INTE i 25/38 mm' },
  { id: 'neonorange',   name: 'Neonorange',   hex: '#ff4d13', note: 'Tillfälligt parti, endast 25 mm' },
  { id: 'mango',        name: 'Mango',        hex: '#ffa023', note: 'Tillfälligt parti, endast 25 mm' },
];

// Bomullsband per bandbredd (bandet är smalare än det färdiga halsbandet).
// `widths` anger vilka FÄRDIGA halsbandsbredder färgen finns i, enligt
// https://www.valleydogs.se/material-till-halsband/bomullsband/ :
//   2.5 cm halsband = 1,8 cm band (14 färger)
//   3.5 cm halsband = 2,5 cm band (20 färger)
//   4 cm halsband   = 3 cm band   (21 färger)
//   5 cm halsband   = 4 cm band   (16 färger)
export const WEBBING_COLORS = [
  { id: 'svart',      name: 'Svart',      hex: '#17181a', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'marinbla',   name: 'Marinblå',   hex: '#232f45', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'sverigebla', name: 'Sverigeblå', hex: '#1c3f9e', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'ljusbla',    name: 'Ljusblå',    hex: '#45b7e3', widths: ['2.5'] },
  { id: 'turkos',     name: 'Turkos',     hex: '#19a7d4', widths: ['3.5', '4', '5'] },
  { id: 'aqua',       name: 'Aqua',       hex: '#4fb3a5', widths: ['3.5', '4', '5'] },
  { id: 'oliv',       name: 'Oliv',       hex: '#45483c', widths: ['3.5', '4', '5'] },
  { id: 'skogsgron',  name: 'Skogsgrön',  hex: '#17402c', widths: ['4'] },
  { id: 'grasgron',   name: 'Gräsgrön',   hex: '#2f7d4a', widths: ['3.5'] },
  { id: 'gron',       name: 'Grön',       hex: '#22994d', widths: ['2.5', '3.5'] },
  { id: 'neongron',   name: 'Neongrön',   hex: '#5aef62', widths: ['3.5', '4'] },
  { id: 'vinrod',     name: 'Vinröd',     hex: '#57202b', widths: ['3.5', '4', '5'] },
  { id: 'rod',        name: 'Röd',        hex: '#cf2028', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'korall',     name: 'Korall',     hex: '#f2766b', widths: ['4'] },
  { id: 'cerise',     name: 'Cerise',     hex: '#ef2f8e', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'ljusrosa',   name: 'Ljusrosa',   hex: '#dc93ac', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'lila',       name: 'Lila',       hex: '#4a3f92', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'lavendel',   name: 'Lavendel',   hex: '#8c8cc8', widths: ['2.5', '4'] },
  { id: 'gul',        name: 'Gul',        hex: '#e0b91d', widths: ['3.5', '4', '5'] },
  { id: 'orange',     name: 'Orange',     hex: '#e06a38', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'brun',       name: 'Brun',       hex: '#4a3226', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'khaki',      name: 'Khaki',      hex: '#b39970', widths: ['2.5', '3.5', '4', '5'] },
  { id: 'gra',        name: 'Grå',        hex: '#9a9da1', widths: ['3.5', '4'] },
  { id: 'vit',        name: 'Vit',        hex: '#eef0f4', widths: ['3.5', '4', '5'] },
  { id: 'offwhite',   name: 'Off-white',  hex: '#f0eee6', widths: ['2.5'] },
];

// Foder (visas som kant över/under bomullsbandet).
export const LINING_GROUPS = [
  {
    group: 'Äkta läder (+120 SEK)', leather: true,
    items: [
      { id: 'lader-svart',      name: 'Svart',      hex: '#232323' },
      { id: 'lader-brun',       name: 'Brun',       hex: '#a9743f' },
      { id: 'lader-sverigebla', name: 'Sverigeblå', hex: '#2456c4' },
      { id: 'lader-cerise',     name: 'Cerise',     hex: '#d61d7d' },
      { id: 'lader-turkos',     name: 'Turkos',     hex: '#1e7d96' },
      { id: 'lader-lila',       name: 'Lila',       hex: '#4740a0' },
      { id: 'lader-ljusrosa',   name: 'Ljusrosa',   hex: '#e3b7bd' },
      { id: 'lader-vit',        name: 'Vit',        hex: '#ececec' },
      { id: 'lader-kramvit',    name: 'Krämvit (limited)',      hex: '#e8e2cf' },
      { id: 'lader-oldred',     name: 'Old red (limited)',      hex: '#9e3a4a' },
      { id: 'lader-brunflammig',name: 'Brun flammig (limited)', hex: '#4c3427' },
      { id: 'lader-babyrosa',   name: 'Babyrosa (limited)',     hex: '#ee8fe4' },
    ],
  },
  {
    group: 'Metallic konstskinn', leather: false,
    items: [
      { id: 'met-guld',   name: 'Guldmetallic',   hex: '#c6a067', metallic: true },
      { id: 'met-silver', name: 'Silvermetallic', hex: '#a7a7ab', metallic: true },
      { id: 'met-rosa',   name: 'Rosametallic',   hex: '#e8c0bb', metallic: true },
      { id: 'met-bla',    name: 'Blåmetallic',    hex: '#40699e', metallic: true },
      { id: 'met-gron',   name: 'Grönmetallic',   hex: '#6d7d76', metallic: true },
    ],
  },
  {
    group: 'Behandlad bomull (mönstrad)', leather: false,
    items: [
      { id: 'bb-korsbarsblom', name: 'Körsbärsblom', hex: '#c3d24a', hex2: '#e585b6', pattern: 'floral' },
      { id: 'bb-citron',       name: 'Citron',       hex: '#9adcdc', hex2: '#f2e33c', pattern: 'dots' },
      { id: 'bb-randig',       name: 'Randig',       hex: '#e0762c', hex2: '#37b3ac', pattern: 'stripes' },
      { id: 'bb-blommig',      name: 'Blommig',      hex: '#ded7cc', hex2: '#7c2437', pattern: 'floral' },
      { id: 'bb-rose',         name: 'Rosé',         hex: '#f4c3d4', hex2: '#c76a8e', pattern: 'floral' },
      { id: 'bb-taggigbla',    name: 'Taggig blå',   hex: '#bfe3ea', hex2: '#2a7f9e', pattern: 'zigzag' },
      { id: 'bb-gultaggig',    name: 'Gul taggig',   hex: '#f6ecc2', hex2: '#eebe3a', pattern: 'zigzag' },
      { id: 'bb-solfjaderbla', name: 'Solfjäder blå',hex: '#e9f2ee', hex2: '#2b9391', pattern: 'fans' },
    ],
  },
  {
    group: 'Softshell', leather: false,
    items: [
      { id: 'ss-svart',      name: 'Svart',        hex: '#1d1d1f' },
      { id: 'ss-marinbla',   name: 'Marinblå',     hex: '#1c2440' },
      { id: 'ss-sverigebla', name: 'Sverigeblå',   hex: '#3327b8' },
      { id: 'ss-petrol',     name: 'Petrol',       hex: '#155a63' },
      { id: 'ss-jeans',      name: 'Jeans',        hex: '#47799e' },
      { id: 'ss-turkos',     name: 'Turkos',       hex: '#12a5dc' },
      { id: 'ss-aqua',       name: 'Aqua',         hex: '#9ed3c8' },
      { id: 'ss-pastellgron',name: 'Pastellgrön',  hex: '#a9b3a4' },
      { id: 'ss-appelgron',  name: 'Äppelgrön',    hex: '#8bc353' },
      { id: 'ss-skogsgron',  name: 'Skogsgrön',    hex: '#2d3a24' },
      { id: 'ss-vinrod',     name: 'Vinröd',       hex: '#84353f' },
      { id: 'ss-rod',        name: 'Röd',          hex: '#d41a2a' },
      { id: 'ss-cerise',     name: 'Cerise',       hex: '#e82c94' },
      { id: 'ss-ljusrosa',   name: 'Ljusrosa',     hex: '#f2ccd7' },
      { id: 'ss-ljuslavendel', name: 'Ljus lavendel', hex: '#d9c8ce' },
      { id: 'ss-gul',        name: 'Gul',          hex: '#f2cf33' },
      { id: 'ss-neonorange', name: 'Neonorange',   hex: '#fc5a12' },
      { id: 'ss-lila',       name: 'Lila',         hex: '#83497e' },
      { id: 'ss-oliv',       name: 'Oliv',         hex: '#57503a' },
      { id: 'ss-neongron',   name: 'Neongrön',     hex: '#41c451' },
      { id: 'ss-gra',        name: 'Grå',          hex: '#9d9d9d' },
      { id: 'ss-khaki',      name: 'Khaki',        hex: '#c3ac84' },
      { id: 'ss-brun',       name: 'Brun',         hex: '#5b4436' },
      { id: 'ss-marinblablommor', name: 'Marinblå blommor', hex: '#232c42', hex2: '#e9a1b4', pattern: 'floral' },
      { id: 'ss-storablommor',    name: 'Stora blommor',    hex: '#20191f', hex2: '#a05f9e', pattern: 'floral' },
      { id: 'ss-rosaleopard',     name: 'Rosa leopard',     hex: '#ecd5d4', hex2: '#231a1c', pattern: 'leopard' },
      { id: 'ss-leopard',         name: 'Leopard',          hex: '#c49a62', hex2: '#241a12', pattern: 'leopard' },
      { id: 'ss-lov',             name: 'Löv',              hex: '#28415c', hex2: '#e0653c', pattern: 'floral' },
    ],
  },
];

export const TEXT_COLORS = [
  { id: 'svart',      name: 'Svart',      hex: '#141414' },
  { id: 'vit',        name: 'Vit',        hex: '#f5f5f5' },
  { id: 'sverigebla', name: 'Sverigeblå', hex: '#1e4e9c' },
  { id: 'rod',        name: 'Röd',        hex: '#bb2027' },
  { id: 'vinrod',     name: 'Vinröd',     hex: '#83173f' },
  { id: 'cerise',     name: 'Cerise',     hex: '#c73a8c' },
  { id: 'ljusrosa',   name: 'Ljusrosa',   hex: '#f0b7cd' },
  { id: 'solgul',     name: 'Solgul',     hex: '#f5a71c' },
  { id: 'gul',        name: 'Gul',        hex: '#e8d40f' },
  { id: 'orange',     name: 'Orange',     hex: '#e84e1a' },
  { id: 'grasgron',   name: 'Gräsgrön',   hex: '#157936' },
  { id: 'gron',       name: 'Grön',       hex: '#78be43' },
  { id: 'bensin',     name: 'Bensin',     hex: '#0d4f56' },
  { id: 'ljusbla',    name: 'Ljusblå',    hex: '#4db8d7' },
  { id: 'tiffanybla', name: 'Tiffany blå',hex: '#3fd6c1' },
  { id: 'lila',       name: 'Lila',       hex: '#8371e8' },
  { id: 'guld',       name: 'Guld',       hex: '#9b8a48' },
  { id: 'silver',     name: 'Silver',     hex: '#c4c2bd' },
  { id: 'koppar',     name: 'Koppar',     hex: '#a05f42' },
  { id: 'rose',       name: 'Rosé',       hex: '#b08286' },
  // Glitter
  { id: 'guldglitter',      name: 'Guldglitter',      hex: '#c79b52', glitter: true },
  { id: 'gulglitter',       name: 'Gulglitter',       hex: '#e4c31e', glitter: true },
  { id: 'nougatglitter',    name: 'Nougatglitter',    hex: '#cf9268', glitter: true },
  { id: 'kopparglitter',    name: 'Kopparglitter',    hex: '#cd5e35', glitter: true },
  { id: 'champagneglitter', name: 'Champagneglitter', hex: '#d8cbb2', glitter: true },
  { id: 'sverigeblaglitter',name: 'Sverigeblåglitter',hex: '#1c3f9e', glitter: true },
  { id: 'ljusblaglitter',   name: 'Ljusblåglitter',   hex: '#79c3e8', glitter: true },
  { id: 'aquaglitter',      name: 'Aquaglitter',      hex: '#2fae9f', glitter: true },
  { id: 'petrolglitter',    name: 'Petrolglitter',    hex: '#145f66', glitter: true },
  { id: 'svartglitter',     name: 'Svartglitter',     hex: '#26262e', glitter: true },
  { id: 'ceriseglitter',    name: 'Ceriseglitter',    hex: '#a92a6e', glitter: true },
  { id: 'roseguldglitter',  name: 'Roséguldglitter',  hex: '#dc9ba0', glitter: true },
  { id: 'konfettiglitter',  name: 'Konfettiglitter',  hex: '#cdb9c8', glitter: true },
  { id: 'rodglitter',       name: 'Rödglitter',       hex: '#c1272d', glitter: true },
  { id: 'vinrodglitter',    name: 'Vinrödglitter',    hex: '#6e2231', glitter: true },
  { id: 'grasgronglitter',  name: 'Gräsgrönglitter',  hex: '#1e8c46', glitter: true },
  { id: 'gronglitter',      name: 'Grönglitter',      hex: '#8cc63f', glitter: true },
  { id: 'olivglitter',      name: 'Olivglitter',      hex: '#4c4d2a', glitter: true },
  { id: 'lilaglitter',      name: 'Lilaglitter',      hex: '#7a2f9e', glitter: true },
  { id: 'lavendelglitter',  name: 'Lavendelglitter',  hex: '#c3b1e8', glitter: true },
  { id: 'orangeglitter',    name: 'Orangeglitter',    hex: '#f58a54', glitter: true },
  { id: 'vitglitter',       name: 'Vitglitter',       hex: '#eeeeee', glitter: true },
  { id: 'silverglitter',    name: 'Silverglitter',    hex: '#bcbcc4', glitter: true },
  // Special – kan ej användas vid dubbeltext, som skugga eller på BioThane
  { id: 'regnbage',        name: 'Regnbåge',         hex: '#e0407a', special: 'rainbow' },
  { id: 'dimmig',          name: 'Dimmig',           hex: '#c9a7c4', special: 'pastelrainbow' },
  { id: 'guldmetallic',    name: 'Guldmetallic',     hex: '#d4bf90', special: 'metal' },
  { id: 'silvermetallic',  name: 'Silvermetallic',   hex: '#cdd3da', special: 'metal' },
  { id: 'roseguldmetallic',name: 'Roséguldmetallic', hex: '#e5b7a6', special: 'metal' },
  { id: 'reflex',          name: 'Reflex',           hex: '#dcdcd2', special: 'reflex' },
];

// Typsnitt – Valley Dogs-namn mappade till liknande Google Fonts för förhandsvisning.
export const FONTS = [
  { id: 'bubbly',    name: 'Bubbly',    css: '"Baloo 2", cursive',           weight: 800, caps: true },
  { id: 'fancy',     name: 'Fancy',     css: '"Titan One", cursive',         weight: 400, caps: false },
  { id: 'autumn',    name: 'Autumn',    css: '"Archivo Black", sans-serif',  weight: 400, caps: false },
  { id: 'avenir',    name: 'Avenir',    css: '"Nunito Sans", sans-serif',    weight: 800, caps: false },
  { id: 'magnolia',  name: 'Magnolia',  css: '"Pacifico", cursive',          weight: 400, caps: false },
  { id: 'dancing',   name: 'Dancing',   css: '"Dancing Script", cursive',    weight: 600, caps: false },
  { id: 'clarissa',  name: 'Clarissa',  css: '"Great Vibes", cursive',       weight: 400, caps: false },
  { id: 'signature', name: 'Signature', css: '"Mr Dafoe", cursive',          weight: 400, caps: false },
  { id: 'stopme',    name: 'Stop me',   css: '"Oswald", sans-serif',         weight: 600, caps: true },
  { id: 'beckman',   name: 'Beckman',   css: '"Josefin Sans", sans-serif',   weight: 600, caps: true },
  { id: 'blixten',   name: 'Blixten',   css: '"Archivo Black", sans-serif',  weight: 400, caps: true, italic: true },
  { id: 'built',     name: 'Built',     css: '"Anton", sans-serif',          weight: 400, caps: true },
  { id: 'marker',    name: 'Marker',    css: '"Permanent Marker", cursive',  weight: 400, caps: true },
  { id: 'abril',     name: 'Abril',     css: '"Abril Fatface", serif',       weight: 400, caps: false },
  { id: 'baskerville', name: 'Baskerville', css: '"Libre Baskerville", serif', weight: 400, caps: false },
  { id: 'typewriter',  name: 'Typewriter',  css: '"Special Elite", cursive',   weight: 400, caps: false },
];
// Endast versaler: Bubbly, Stop me, Beckman, Blixten, Marker, Built.

export const SYMBOLS = [
  { id: 'ingen',           name: 'Ingen symbol' },
  { id: 'tass',            name: 'Tass' },
  { id: 'hjarta',          name: 'Hjärta' },
  { id: 'smahjartan',      name: 'Små hjärtan' },
  { id: 'stjarna',         name: 'Stjärna' },
  { id: 'stjarnor',        name: 'Stjärnor' },
  { id: 'blinkandestjarna',name: 'Blinkande stjärna' },
  { id: 'krona',           name: 'Krona' },
  { id: 'blixt',           name: 'Blixt' },
  { id: 'eld',             name: 'Eld' },
  { id: 'fyrklover',       name: 'Fyrklöver' },
  { id: 'diamant',         name: 'Diamant' },
  { id: 'pokal',           name: 'Pokal' },
  { id: 'dodskalle',       name: 'Dödskalle' },
  { id: 'bomb',            name: 'Bomb' },
  { id: 'treudd',          name: 'Treudd' },
  { id: 'kvistar',         name: 'Kvistar' },
  { id: 'dalahast',        name: 'Dalahäst' },
  { id: 'vallhund',        name: 'Vallhund' },
  { id: 'far',             name: 'Får' },
  { id: 'apportbock',      name: 'Apportbock' },
  { id: 'virvelvind',      name: 'Virvelvind' },
  { id: 'clown',           name: 'Clown' },
  { id: 'monster',         name: 'Monster' },
  { id: 'svenskaflaggan',  name: 'Svenska flaggan', flag: ['#1c50a0', '#f8d015'] },
  { id: 'norskaflaggan',   name: 'Norska flaggan',  flag: ['#d5273b', '#26356e', '#ffffff'] },
  { id: 'finskaflaggan',   name: 'Finska flaggan',  flag: ['#f4f5f8', '#1c3f7c'] },
  { id: 'danskaflaggan',   name: 'Danska flaggan',  flag: ['#e8112d', '#ffffff'] },
];

export const HARDWARE_FINISHES = [
  { id: 'stal',        name: 'Vanliga i stål',        hex: '#b8bcc2', metalness: 0.95, roughness: 0.28 },
  { id: 'svart',       name: 'Svart pläterad',        hex: '#2a2c2e', metalness: 0.85, roughness: 0.4 },
  { id: 'roseguld',    name: 'Roséguld pläterad',     hex: '#c98a7e', metalness: 0.95, roughness: 0.25 },
  { id: 'antikmassing',name: 'Antik mässing pläterad',hex: '#7a6134', metalness: 0.9,  roughness: 0.45 },
  { id: 'massing',     name: 'Solid mässing',         hex: '#b89b45', metalness: 0.95, roughness: 0.25, surcharge: { cotton: 30, biothane: 40 } },
];

export const SYMBOL_PLACEMENTS = [
  { id: 'fore',   name: 'Före texten' },
  { id: 'efter',  name: 'Efter texten' },
  { id: 'bada',   name: 'På vardera sida om texten' },
];

// Halsbandsmodeller (bomull). Pris per färdig bredd: 2.5 / 3.5 / 4 / 5 cm.
export const COTTON_MODELS = [
  { id: 'fast',        name: 'Fast halsband',            prices: { '2.5': 389, '3.5': 399, '4': 399, '5': 419 },
    glitterPrices: { '2.5': 429, '3.5': 439, '4': 439, '5': 449 } },
  { id: 'halvstryp',   name: 'Halvstryp',                prices: { '2.5': 389, '3.5': 399, '4': 399, '5': 419 },
    glitterPrices: { '2.5': 429, '3.5': 439, '4': 439, '5': 449 } },
  { id: 'halvstrypknappe', name: 'Halvstryp med knäppe', prices: { '2.5': 389, '3.5': 399, '4': 399, '5': 429 },
    glitterPrices: { '2.5': 429, '3.5': 439, '4': 439, '5': 459 } },
  { id: 'stallbart',   name: 'Ställbart halsband',       prices: { '2.5': 389, '3.5': 399, '4': 399 } },
  { id: 'agility',     name: 'Agilityhalsband',          prices: { '2.5': 389, '3.5': 399, '4': 399, '5': 419 },
    glitterPrices: { '2.5': 429, '3.5': 439, '4': 439, '5': 449 } },
  { id: 'justerbart',  name: 'Justerbart halvstryp',     prices: { '2.5': 419, '3.5': 429, '4': 429 } },
];

export const COTTON_WIDTHS = [
  { id: '2.5', name: '2,5 cm', bandWidth: '1,8 cm', cm: 2.5 },
  { id: '3.5', name: '3,5 cm', bandWidth: '2,5 cm', cm: 3.5 },
  { id: '4',   name: '4 cm',   bandWidth: '3 cm',   cm: 4 },
  { id: '5',   name: '5 cm',   bandWidth: '4 cm',   cm: 5 },
];

// BioThane Beta®
export const BIOTHANE = {
  basePrice: 389,          // Fast halsband
  glitterBasePrice: 449,   // Helglittrigt
  models: [
    { id: 'fast',      name: 'Fast halsband',      surcharge: 0 },
    { id: 'halvstryp', name: 'Halvstryp',          surcharge: 10 },
    { id: 'stallbart', name: 'Ställbart halsband', surcharge: 10 },
  ],
  widths: [
    { id: '25', name: '25 mm', surcharge: 0,  cm: 2.5 },
    { id: '38', name: '38 mm', surcharge: 10, cm: 3.8 },
  ],
};

export const LEATHER_SURCHARGE = 120;

export const PRODUCT_URLS = {
  cotton: {
    '2.5': 'https://www.valleydogs.se/produkter/hundhalsband-25-cm/',
    '3.5': 'https://www.valleydogs.se/produkter/hundhalsband-3-cm/',
    '4':   'https://www.valleydogs.se/produkter/hundhalsband/',
    '5':   'https://www.valleydogs.se/produkter/hundhalsband-5-cm/',
  },
  biothane: 'https://www.valleydogs.se/produkter/biothanehalsband/',
};

export function findColor(list, id) {
  return list.find(c => c.id === id) || list[0];
}

export function allLinings() {
  return LINING_GROUPS.flatMap(g => g.items.map(i => ({ ...i, group: g.group, leather: g.leather })));
}
