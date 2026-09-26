# Katalog-admin

Enkelt webbverktyg för att redigera **all katalogdata** i designverktyget –
färger, material, foder, beslag, typsnitt, symboler, modeller, priser och
bredder – utan att röra koden.

Sida: `admin.html` · Spar-endpoint: `admin.php` · Bilduppladdning: `admin-upload.php`
· Lösenord/konfig: `admin-config.php` · Data: `data.json`

## Hur det hänger ihop

- Katalogen ligger i **`data.json`** i sajtens rot.
- `js/data.js` innehåller samma värden som **inbyggda standardvärden/fallback**
  och lägger `data.json` ovanpå vid inläsning. Saknas eller är `data.json`
  trasig används standardvärdena – **butiken kan aldrig släckas av en dålig
  data.json**.
- `admin.html` läser `data.json`, låter dig redigera och skickar tillbaka den
  till `admin.php`, som validerar, **säkerhetskopierar** nuvarande fil till
  `data-backups/` och skriver den nya. Ändringar går live direkt.

## Innan första användning: sätt ett lösenord

Admin vägrar spara/ladda upp tills ett lösenord är satt. Lösenordet ligger på
**ett ställe**, `admin-config.php`, och delas av `admin.php` och `admin-upload.php`.

1. Generera sha256-hashen av ditt valda lösenord:
   ```bash
   printf '%s' 'ditt-lösenord' | shasum -a 256
   ```
   (eller `node -e "console.log(require('crypto').createHash('sha256').update('ditt-lösenord').digest('hex'))"`)
2. Klistra in hex-strängen i `admin-config.php`:
   ```php
   const ADMIN_PW_SHA256 = '…din hash…';
   ```
3. Ladda upp `admin-config.php` till one.com.

Lösenordet efterfrågas när du klickar **Spara & publicera** och sparas i
webbläsarens session-lagring tills du stänger fliken.

## Använda verktyget

Öppna `https://design.valleydogs.se/admin.html`.

- Vänster: kategorier. Höger: redigerbar tabell.
- Rader: **↑ ↓** ordna, **⧉** duplicera, **✕** ta bort, **+ Lägg till rad**.
- **Förhandsgranska ↗** öppnar verktyget med dina ändringar (via webbläsaren,
  publiceras inte) så du kan se dem först.
- **Ladda ner JSON** sparar en kopia lokalt.
- **Återställ standard** går tillbaka till kodens standardvärden (publiceras
  inte förrän du sparar).
- **Spara & publicera** validerar och skriver `data.json` live, med backup.

Dubbletter av id och ogiltiga hex-koder blockerar sparning och visas överst.

## Bilder (foder- och bandtexturer)

Foder och bomullsband kan ha ett riktigt tygfoto som används i 3D. Kopplingen
är katalogdata: fältet **`foto`** (på/av) och för foder **`texCm`** (texturens
fysiska rutstorlek i cm, styr skalan). Bilderna ligger som:

- Foder: `textures/<id>.webp` (3D) + `foder-thumb/<id>.webp` (miniatyr)
- Band: `wtex/<id>.webp` (3D) + `band-thumb/<id>.webp` (miniatyr)

Finns ingen `foto` faller 3D tillbaka på ett procedurellt utseende ur färgen
(hex/hex2/mönster), och miniatyren visar färgen.

**Ladda upp bild** i admin: kolumnen **Bild** i Bomullsband och Foder har en
*Ladda upp*-knapp. Välj en bild (webp/png/jpeg) – `admin-upload.php` skalar den
och skriver både texturen och miniatyren som WebP, och kryssar i **Foto**. Sätt
`cm-skala` för foder så mönstret blir rätt stort. Klicka sedan **Spara &
publicera** så att foto-kopplingen (`foto`/`texCm`) sparas i `data.json`.

> Kräver att serverns PHP har GD med WebP-stöd (one.com har normalt det). Saknas
> det kan du i stället ladda upp färdiga `<id>.webp`-filer manuellt till mapparna
> ovan och kryssa i **Foto** för hand.

## Symboler (egna former)

Symbolens form är katalogdata: fältet **`path`** (SVG-path i en kvadratisk
koordinatrymd) och **`viewBox`** (kvadratens storlek, standard 2048). Inbyggda
symboler har sina former i `js/vd-symbols.js`; admin-tillagda symboler bär sin
path i `data.json`.

**Lägg till en symbol:** lägg en ny rad i **Symboler**, sätt id + namn, och
klicka **Ladda upp SVG** i kolumnen *SVG-form*. SVG:n läses in i webbläsaren
(ingen server) och path:en extraheras. Klicka sedan **Spara & publicera**.

Krav på SVG:n: **enfärgad siluett**, **utplattad** (inga `transform`-attribut –
platta ut i t.ex. Inkscape: *Bana → Objekt till bana*, ta bort grupper), och
`path`/`rect`/`circle`/`ellipse`/`polygon` (basformer omvandlas automatiskt).
`viewBox` bör börja i 0,0. Symbolen fylls med *evenodd*, så hål fungerar.

## Typsnitt (egna)

**Lägg till ett typsnitt:** lägg en ny rad i **Typsnitt**, sätt id + namn, och
klicka **Ladda upp TTF** i kolumnen *Fontfil*. Filen (`.ttf`/`.otf`) skrivs till
`fonts/<id>.ttf` och typsnittet självhostas: `css` sätts automatiskt till
`"vd-<id>", …` och används i både förhandsvisning (@font-face) och skärfiler
(opentype.js). Klicka **Spara & publicera**. Woff/woff2 stöds inte – exportera
som TTF/OTF. Befintliga (Google-)typsnitts metadata går också att ändra.

## Kvar i koden (ej i admin)

- **Storleks-/teckenregler** (`js/design-rules.js`) är logik, inte katalog.

## Filer att ladda upp till one.com

`data.json`, `admin.html`, `admin.php`, `admin-upload.php`, `admin-config.php`,
`js/admin.js`, `js/data.js`, `js/foder-realism.js`, `js/symbols.js`, `js/app.js`.
Mapparna `data-backups/`, `textures/`, `wtex/`, `foder-thumb/`, `band-thumb/`
och `fonts/` skapas/fylls automatiskt.
