# Handoff: Foderstudio – fotorealistisk 3D-förhandsvisning av foder

## Översikt
Konfigurator för Valley Dogs bomullshalsband med foder. Kunden väljer modell, bredd, bandfärg, foder (läder, softshell, mönstrat, metallic m.m.) och text, och ser halsbandet i en fotorealistisk 3D-vy (three.js, PBR). Syftet är att ersätta/uppgradera den nuvarande 3D-förhandsvisningen i konfiguratorn på valleydogs.se.

## Om filerna
Filerna är **designreferenser byggda i HTML** – en fungerande prototyp som visar avsett utseende och beteende, inte produktionskod att kopiera rakt av. Uppgiften är att **återskapa detta i den befintliga kodbasen** (butikens konfigurator/tema) med dess mönster. 3D-modulerna i `js/` (ES-moduler, ren three.js, inga byggsteg) är dock skrivna så att de i stort kan lyftas in direkt och kopplas mot butikens egna UI-kontroller.

## Fidelity
**High-fidelity** för 3D-renderingen (material, texturer, geometri, ljus). Panelens UI (vänsterkolumn, kort, knappar) är en arbetsyta för att granska foder – återanvänd butikens befintliga konfigurator-UI i stället för att kopiera den layouten.

## Arkitektur
- `js/collar3d.js` – `CollarViewer`: renderer, kamera, OrbitControls, RoomEnvironment-ljus, skuggplan, grundgeometri för halsband, text/symboler (vinyl), beslag.
- `js/foder-realism.js` – `RealisticCollarViewer extends CollarViewer`: foder i full bredd + bomullsband som upphöjt band ovanpå, sömmar, PBR-kartor (albedo/normal/ORM) genererade på canvas, fotobaserade foder- och bandtexturer, halvstrypets ofodrade strypdel, vävd Valley Dogs-etikett.
- `js/data.js` – modeller, priser, bredder, bandfärger, foderlista (id, namn, grupp, hex).
- `js/symbols.js`, `js/vd-symbols.js` – symbolsiluetter och flaggor.
- `vendor/` – three.js (module), OrbitControls, RoomEnvironment.

## Användning av 3D-modulen
```js
import * as fr from './js/foder-realism.js';
await fr.loadPhotoLinings(baseUrl);              // laddar textures/ och wtex/
const viewer = new fr.RealisticCollarViewer(canvas);
viewer.build({
  family: 'cotton', width: 4, bandWidthCm: 3, circumference: 45,
  modelKind: 'fast' | 'halvstryp', modelId, lining /* objekt ur data.js */,
  bandColor, text, font, showHardware: false,
});
viewer.setView('oversikt' | 'kant' | 'insida');
viewer.snapshot();                               // PNG dataURL
```
Se `Foderstudio.dc.html` (metoden `rebuild()`) för exakt hur config byggs från UI-state.

## Beteende (nuvarande beslut)
- Beslag (spänne, D-ring, O-ringar) visas inte – bara själva halsbandet.
- Fast / Ställbart / Agility: fodrat runt hela halsen (ser likadana ut).
- Alla tre halvstryp ritas likadant: fodrad huvuddel fram, ofodrat band sluter ringen på baksidan.
- Valley Dogs-etiketten sitter på framsidan, till höger om texten, sticker ut under bandets nederkant.
- Läder (utom Brun flammig): narvens relief/glans härleds ur fotot (högpass på luminans), storskalig fläckighet utjämnad.
- Bomullsband: fototextur, `WEAVE_SCALE = 0.55` i foder-realism.js styr maskstorlek.
- Vyer: Översikt, Närbild kant, Insida.

## Tillgångar
- `textures/` – sömlösa fodertexturer (PNG), en per foder-id; storlek i cm per ruta i `PHOTO_LININGS`.
- `wtex/` – sömlösa bomullsbandtexturer per bandfärg.
- `src/`, `wsrc/` – originalfoton som texturerna skapats ur (för omgenerering).
- `tools/tile.js`, `tools/wtile.js` – skript som gjorde fotona sömlösa (kördes i webbläsarmiljö med canvas; anpassa vid behov).
- Typsnitt för text: Google Fonts (se `<link>` i Foderstudio.dc.html).

## Att tänka på vid driftsättning
- Texturer: ~1 MB+ totalt – konvertera till WebP/KTX2 och lazy-ladda endast valt foder.
- PBR-kartor genereras per foder på canvas (1024²) – cacha, eller förgenerera normal/ORM-kartor offline.
- Testa prestanda på mobil (sänk pixelRatio, skuggkarta, anisotropi vid behov).
- Beslagskoden finns kvar i collar3d.js men används inte (`showHardware: false`).
- Prototypen kör i en designmiljö; `support.js` och `.dc.html`-formatet behövs inte i produktion.

## Referensbilder – verifiera mot dessa
`screenshots/` innehåller facit från prototypen (text "Bamse", 4 cm bredd, omkrets 45 cm, standardkamera per vy):
- 01 – Fast halsband, Äkta läder Brun, band Marinblå, Översikt
- 02 – Fast halsband, Äkta läder Svart, band Röd, Översikt
- 03 – Halvstryp, Äkta läder Brun, band Marinblå, Översikt
- 04 – Samma, Närbild kant
- 05 – Samma, Insida
- 06 – Fast halsband, Softshell Vinröd, band Cerise, Översikt
- 07 – Hela prototypens gränssnitt (endast referens för 3D-vyns känsla, inte UI-layout)

**Krav på Claude Code:** efter implementationen, rendera samma sex konfigurationer i er miljö, ta skärmbilder och jämför sida vid sida med 01–06. Kontrollera särskilt:
1. Fodret syns som en kant över och under bomullsbandet och på insidan.
2. Läderstrukturen (narv, glans) och bandets väv har samma skala och karaktär.
3. Halvstrypets fodrade del slutar strax före baksidan; ofodrat band sluter ringen.
4. Valley Dogs-etiketten sitter till höger om texten och sticker ut under nederkanten.
5. Text i vinyl med relief, centrerad på framsidan.
6. Inga beslag syns.
Rapportera avvikelser och åtgärda dem tills bilderna stämmer.

## Filer
- `Foderstudio.dc.html` – prototypens UI och state (öppna via en lokal webbserver).
- `js/`, `vendor/`, `textures/`, `wtex/`, `tools/`
