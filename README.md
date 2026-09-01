# Designa ditt halsband – 3D-verktyg för Valley Dogs-halsband

Ett fristående 3D-designverktyg för måttbeställda hundhalsband, byggt kring
sortimentet hos [valleydogs.se](https://www.valleydogs.se). Verktyget körs helt
i webbläsaren på en egen webbserver – inget behöver installeras på Valley Dogs
webbplats.

## Funktioner

- **3D-förhandsvisning** (Three.js): rotera och zooma halsbandet i realtid.
- **Två materialfamiljer**, med modeller och priser hämtade från butiken:
  - **Bomullshalsband** (2,5 / 3,5 / 4 / 5 cm) – Fast, Halvstryp, Halvstryp
    med knäppe, Ställbart, Agility, Justerbart halvstryp.
  - **BioThane Beta®** (25 / 38 mm) – Fast, Halvstryp, Ställbart.
- **Hela materialkatalogen**: 24 bomullsbandsfärger, 26 BioThane-färger,
  foder (äkta läder, metallic-konstskinn, behandlad bomull, softshell),
  49 text-/vinylfärger inkl. glitter och specialfärger, 16 typsnitt,
  28 symboler, beslag i 5 utföranden samt helglittrigt tillval.
- **Två texter** med eget typsnitt och egen färg, i tre placeringar:
  efter varandra, två rader eller dubbeltext (text 2 ovanpå text 1).
- **Regler från butiken** inbyggda: versal-typsnitt, specialfärger som inte
  funkar på BioThane/som skugga, dubbeltextregler (glitter på glitter eller
  slät under + glitter över, ingen skugga), färger som saknas i vissa
  bredder, pristillägg (äkta läder +100–150 kr beroende på bredd,
  solid mässing +30/40 kr osv.).
- **Livepris** och **beställningsunderlag**: texten matchar fälten i Valley
  Dogs beställningsformulär och kan kopieras eller mejlas till
  info@valleydogs.se, med direktlänk till rätt produktsida.

## Kör lokalt

Allt är statiska filer (ES-moduler), så det enda som behövs är en webbserver:

```bash
python3 -m http.server 8734
```

Öppna sedan <http://localhost:8734>. (Att öppna `index.html` direkt från disk
fungerar inte – ES-moduler kräver http/https.)

## Driftsättning

Ladda upp katalogen (utom `.claude/`) till valfri statisk webbserver eller
tjänst – nginx/Apache, Netlify, Vercel, GitHub Pages, Railway m.fl. Inga
byggsteg, ingen backend. Typsnitten hämtas från Google Fonts, i övrigt är allt
självförsörjande (`vendor/three.module.js` är incheckad).

## Struktur

```
index.html          – sida & layout (svenska)
css/style.css       – utseende
js/data.js          – HELA katalogen: färger, foder, typsnitt, symboler, priser
js/app.js           – UI, tillstånd, prisberäkning, beställningstext
js/collar3d.js      – Three.js-scen, procedurella texturer, beslag
js/symbols.js       – canvas-ritade versioner av Valley Dogs symboler
vendor/             – three.js r160 + OrbitControls (lokala kopior)
```

## Uppdatera sortimentet

Alla priser, färger och regler ligger i `js/data.js` med svenska namn som
matchar butiken. Nya färger/typsnitt/symboler läggs till där; hex-koderna är
approximationer av foto-swatcharna på
[Material till halsband](https://www.valleydogs.se/material-till-halsband/).

Datan hämtades från valleydogs.se 2026-08-27. Priserna visas som "beräknat
pris" i verktyget och bekräftas alltid i Valley Dogs kassa.

## Symboler

Samtliga symboler är Valley Dogs egna (genererade ur leverantörens symbolark
till `js/vd-symbols.js`) – exakt samma former som sys på halsbanden.
Flaggorna ritas efter respektive flaggas geometri i riktiga färger.
