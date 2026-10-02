# Materialförbättringar från kundens halsbandsbilder

Referenser: användarens bilder 1–14, framför allt 2/3 (väv, foder och halvstryp), 9/13 (grå bomull och glitter), 4/6/10 (täta glitterkorn). Originalbilderna ändras inte och ligger inte i webbprojektet.

- Blender-modellerade korsande garn med tre deltrådar ger en repeterbar höjdkarta. Webbläsaren använder höjden till normaler och svag färgvariation på både huvudband och strypdel. Den fysiska visningsskalan är 12 mm per ruta och skalas oberoende av bandbredd.
- Bomullens befintliga färgfoton bevaras. Enfärgat textilfoder använder katalogfärgen och fin vävstruktur, så fotograferade veck/skuggor inte upprepas runt hela halsbandet. Mönster-, läder- och metallfoton används fortsatt.
- Något rundare foderkant, mjuk välvning på insidan, små rynkor nära kanterna och svagt oval helhetsform. Affin ovalisering är en visuell approximation, inte en fysisk simulering.
- Täta, deterministiska glitterkorn ersätter stora slumpmässiga stjärnglimtar. Tunna textlager behåller lite av vävens relief.

## Filer och återskapande

`tools/build_cotton_weave.py` bygger garnen och bakar `assets/materials/cotton/height.png` samt `normal.png`. Den sparar den redigerbara källan `cotton-weave.blend`.

Kör med Blender i bakgrunden:

```
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/build_cotton_weave.py
```

Webbservern behöver `js/foder-realism.js` och `assets/materials/cotton/height.png`. Normalbilden och Blender-källan är arbetsmaterial; normalerna som inkluderar text/sömmar byggs i webbläsaren. Saknad höjdkarta faller tillbaka till tidigare relief.

Verifiering: `tools/test-material-realism.cjs` samt befintligt `tools/test-hardware.cjs`. Ange `TEST_URL`, `NODE_PATH` och `BROWSER_EXECUTABLE` efter lokal miljö.
