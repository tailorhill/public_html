# Kundregler för storlek och text

Implementerat på `feature/customer-size-text-rules` enligt kundens meddelande.

- Ställbart och justerbart halvstryp i bomull har egna intervall per bredd, med 0/10/20 kr tillägg och egen storlek +30 kr. 5 cm erbjuds inte.
- Egen storlek kräver ifylld Övrig info. Måttet skickas som kundens text, inte som ett påhittat numeriskt mått. 3D-vyn är illustrativ; standardintervall visas vid mittmåttet.
- Max 7 respektive 10 tecken inklusive symboler. Symbol på båda sidor räknas två gånger. Mellanslag räknas. Text som blir för lång raderas inte; beställning och produktionsfiler spärras med ett meddelande.
- Textstorlek är alltid stor, även i gamla designlänkar och skärfiler.
- Bomull: slät första text tillåter slät/glitter på nästa; glitter kräver glitter. Glitter i skuggan kräver glittertext, och glittersymbol om symbolskugga valts.
- Specialfärger är spärrade i dubbeltext och som skugga. BioThane har ingen skugga, dubbeltext kräver samma färgtyp och Dimmig får endast användas ensam (symbolen får följa samma färg).
- Skugga kan väljas för bara text eller text och symboler; valet sparas i designlänken, orderkommentaren, 3D-vyn och SVG/DXF.
- Varukorgen matchar valt intervall exakt; överlappande intervall får inte ersätta varandra. Saknat alternativ stoppar överföringen.

## Behöver bekräftas av kunden

1. Justerbart 4 cm listar 40–50 cm men anger ingen teckengräns för det. Preliminärt 7.
2. Egen storlek på 3,5 och 4 cm saknar teckengräns. Preliminärt 7.
3. Dubbeltext tolkas som 7/10 tecken per lager inklusive symbolerna, inte summan av båda lagren. Text efter varandra räknas sammanlagt. Två/tre rader räknas per rad.

## Verifiering

`node tools/test-customer-rules.cjs` testar regler, länkar och varukorgsmatchning med simulerat butikssvar.

`node tools/test-customer-ui.cjs` testar gränssnitt, pris, beställningsspärr, designlänkar och skugga i skärfiler via Playwright. Ange `NODE_PATH`, `BROWSER_EXECUTABLE` och `TEST_URL` vid behov. Standardserver: port 8748. Testerna lägger ingen beställning i den riktiga butiken.
