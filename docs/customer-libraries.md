# Symboler och typsnitt i kundverktyget

Knapparna **Sök fler symboler · Iconify** och **Fler typsnitt · Google Fonts** finns under respektive väljare. Valet ersätter det aktiva symbol-/textelementets symbol eller typsnitt. Vanliga teckengränser gäller fortfarande.

## Symboler

Sökning via Iconifys publika API, begränsad till Material Design Icons (Pictogrammers). Några vanliga svenska ord översätts till engelska; engelska sökord stöds direkt. Endast enfärgade symboler med en SVG-path importeras. Stroke, grupper, transformationer och färglager väljs bort eftersom verktygets skärfiler bygger på fyllda siluetter. SVG-markup infogas aldrig i dokumentet.

Path och koordinatskala följer med i designlänken. Mottagaren behöver alltså inte kontakta Iconify för att återställa en vald symbol. Symbolerna fungerar i canvas/3D, SVG och DXF. Källa och licens finns i sökfönstret samt `assets/libraries/mdi-LICENSE.txt`.

## Typsnitt

`assets/libraries/google-fonts.json` indexerar statiska TTF-varianter från Google Fonts officiella OFL-katalog, med en låst Git-revision. Inga API-nycklar behövs. Det är ett index över stödda varianter, inte hela Google Fonts utbud. Variabla fonter, stora fontfiler och andra licenskataloger ingår inte.

TTF-filen hämtas först vid förhandsvisning, val eller återställning av ett valt typsnitt. Samma fil används av FontFace och opentype.js för att hålla förhandsvisning och skärfiler konsekventa. ÅÄÖåäö kontrolleras innan typsnittet godtas. Nedladdningen kräver kontakt med raw.githubusercontent.com. Om återställningen misslyckas behålls typsnittsvalet och beställning/export blockeras med ett felmeddelande tills användaren laddar om eller byter typsnitt.

Indexet kan uppdateras med `python3 tools/build-font-library.py`. Skriptet behåller tidigare publicerade poster och deras filrevisioner så att sparade designer fortsätter använda samma filer. Nya familjer läggs till.

## Beställning och driftsättning

Fritextfält i butiken får faktiska namn. För enum-fält används Eget typsnitt/Egen symbol för biblioteksval; om det inte finns något sådant val visas butikens vanliga valideringsfel. Inga godtyckliga ersättningsval görs. Fullständiga textval och designlänk finns också i orderkommentaren.

Ladda upp ändrade HTML/CSS/JS-filer samt `assets/libraries/` och `d.php`. Den senare tillåter större designlänkar eftersom symbolernas vektorer följer med. Ingen ändring av admin-konfiguration behövs.

Källor: https://iconify.design/docs/api/ och https://github.com/google/fonts
