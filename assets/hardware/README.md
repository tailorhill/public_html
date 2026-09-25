# Valley Dogs: Blender-beslag

Modeller skapade i Blender 5.2.2 för designverktyget, 2026-09-25.

## Referenser och avgränsning

Granskade produktbilder och beskrivningar:

- https://www.valleydogs.se/material-till-halsband/beslag/ — D-ringarnas raka sida och breda båge; trebomsspännets två rundade, långsmala öppningar; metallutföranden.
- https://www.valleydogs.se/produkter/hundhalsband/fast-halsband-4-cm — 3 cm bomullsband med foder till cirka 4 cm; svart plastklickspänne enligt aktuella val.
- https://www.valleydogs.se/produkter/hundhalsband/stallbart-halsband-4-cm — klickspänne, D-ring, trebomsspänne och vikt band.
- https://www.valleydogs.se/produkter/biothanehalsband/biothanehalsband-25mm — fast halsband med klickspänne och nitade fästen. En produktbild visar metallklickspänne, men aktuellt formulär erbjuder svart plast; visningen följer formuläret.
- https://www.valleydogs.se/produkter/biothanehalsband/stallbart-halsband-i-biothane-betaR — rundat rullspänne, torne, bandhålla och hål längs bandet.

- https://www.valleydogs.se/produkter/hundhalsband/halvstryp-4-cm — vanligt halvstryp med separat banddel.
- https://www.valleydogs.se/produkter/hundhalsband/halvstryp-med-knappe-4-cm — svart plastknäppe på strypdelen.
- https://www.valleydogs.se/produkter/hundhalsband/justerbart-halvstryp-4-cm — justerspänne på huvudbandet, avtagbar foderhållare (Queen-bilden).
- https://www.valleydogs.se/produkter/biothanehalsband/halvstryp-biothane-25-mm — slätt band, metallöglor och nitade infästningar.

Former/proportioner är visuella approximationer från bilderna, inte leverantörens CAD eller uppmätta beslag. Ingen tillverkarlogotyp har lagts till. Bilderna används som referenser och ingår inte i de exporterade modellerna. Övrig halsbandsgeometri, inklusive fodret och halvstrypsbandet, genereras fortfarande av verktyget. Halvstrypsvarianterna har egna konstruktioner med rundade styröglor, kompakt kontrollband, vikta ändar och sömmar eller nitar. Knäppvarianten har klickspänne på kontrollbandet; justerbart halvstryp har trebomsspänne på huvudbandet och delbar foderhållare. Bandet är en statisk visualisering, inte en simulering av åtdragning.

## Filer

- `valley-dogs-hardware.blend`: redigerbar källa med sju grupper, utlagda bredvid varandra, med kamera och studiobelysning.
- `side-release.glb`: stängt klickspänne, bandöppningar, ihålig mottagardel, sidoknappar och greppräfflor.
- `d-ring.glb`: metallring med rak sida och rundade skuldror.
- `tri-glide.glb`: gjutet trebomsspänne med rundade hålkanter.
- `roller-buckle.glb`: rullspänne med separat rulle och torne.
- `keeper.glb`: bandhålla till det ställbara BioThane-halsbandet.
- `half-slip-ring.glb`: rundad oval styrögla till halvstrypsbandet.
- `split-keeper.glb`: delbar metallhållare för fodret på justerbart halvstryp.
- `preview.jpg`: översiktsbild renderad i Blender Cycles.
- `build-stats.json`: storlek och vertexantal från exporten.

## Återskapa

Kör från projektroten (Blender behövs endast vid modellering/export):

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/build_hardware.py
```

Lägg till `-- --render` efter kommandot för att också återskapa förhandsbilden.

Källan använder referensbandbredd 3 cm. Blender X är längs bandet, Y tvärs bandet och Z utåt. GLB exporteras med standard Y-up; `js/hardware-assets.js` omvandlar axlarna tillbaka till verktygets koordinater. Måtten är numeriska centimeter i detta verktyg och ska skalas med 0,01 om modellerna används i en scen med meter som enhet.

Verktyget skalar modellerna efter bandbredd, byter metallmaterial efter valet och skapar bandflikar dynamiskt. Originalgeometrin cachas; varje visning får egna geometrier som kan frigöras vid ombygge. Om en modell saknas används den befintliga kodmodellen. Inga externa nätverksanrop behövs för modellerna.

GLTFLoader och BufferGeometryUtils är Three.js r160 (MIT), samma version som den befintliga renderaren. Enda ändringen i GLTFLoader är den relativa importsökvägen. Licens: `vendor/three-LICENSE.txt`.

## Kontroll

Med Playwright tillgängligt och en lokal server på port 8746:

```sh
node tools/test-hardware.cjs
```

`TEST_URL`, `NODE_PATH` och `BROWSER_EXECUTABLE` kan anges för annan server eller lokal webbläsare. Testet kontrollerar modelladdning, beslagstyp, metallfärger, dolda beslag, PNG-export, lite-läge och reservmodell när GLB inte kan laddas.
