# Anime API

Det här är mitt projekt för inlämning 2. Jag har byggt ett API med Node.js och Express där man kan lägga till, hämta, ändra och ta bort anime. Jag har hållit det ganska enkelt med en JSON-fil som lagring och ingen frontend.

Det följer med 15 anime, bland annat Naruto, Death Note och Cowboy Bebop, så det finns data att testa direkt.

## Kom igång

Man behöver Node.js 22 eller senare, npm och Git.

```bash
git clone https://github.com/HaiT02/AnimeAPI-node.js.git
cd AnimeAPI-node.js
npm ci
npm start
```

API:et finns på `http://localhost:3000/anime`.

Öppna **[Swagger-dokumentationen](http://localhost:3000/docs/)** för att testa anropen med **Try it out**. Där finns också mer detaljer om alla fält och svar. OpenAPI-specifikationen finns på `/openapi.json`.

## Använda API:et

| Metod | Endpoint | Vad den gör | Lyckat svar |
| --- | --- | --- | --- |
| GET | `/anime` | Hämtar en lista med anime | 200 |
| GET | `/anime/:id` | Hämtar en anime med ett visst id | 200 |
| POST | `/anime` | Lägger till en anime | 201 |
| PUT | `/anime/:id` | Uppdaterar en anime | 200 |
| DELETE | `/anime/:id` | Tar bort en anime | 204, tomt svar |

Till exempel hämtar `/anime/1` Naruto från startdatan. När du skapar en ny anime får den ett id automatiskt.

### Lägga till eller ändra

POST och PUT använder `Content-Type: application/json`. Skicka alla fyra fält, även när du uppdaterar:

```json
{
  "title": "Naruto",
  "genre": "action",
  "episodes": 220,
  "status": "finished"
}
```

- `title`: 1–120 tecken.
- `genre`: `action`, `adventure`, `comedy`, `drama`, `fantasy`, `romance`, `sci-fi`, `slice-of-life`, `sports` eller `thriller`.
- `episodes`: ett heltal mellan 0 och 100000.
- `status`: `upcoming`, `ongoing` eller `finished`.

Extra fält tillåts inte. Onödiga blanksteg rensas bort och genre/status görs om till små bokstäver. Body får vara högst 10 kB.

### Filtrera och bläddra

```text
/anime?genre=action
/anime?status=finished
/anime?q=naruto
/anime?page=2
/anime?genre=action&page=1&limit=3
```

`q` söker i titeln. Textfilter fungerar oavsett stora eller små bokstäver och kan kombineras. Som standard visas 10 anime per sida. `page` börjar på 1 och `limit` kan vara 1–50.

Listsvaren innehåller `data` med anime och `pagination` med `page`, `limit`, `total` och `totalPages`. Antalet räknas efter filtrering. Om inget matchar får du en tom lista.

### Om något blir fel

API:et svarar med JSON, till exempel `{ "error": "Anime hittades inte." }`.

| Status | Betydelse |
| --- | --- |
| 400 | Felaktig JSON, ogiltiga fält eller filter/paginering |
| 404 | Anime eller endpoint finns inte |
| 413 | För stor body |
| 415 | Fel innehållstyp eller kodning |
| 500 | Serverfel, exempelvis om datafilen är trasig eller inte går att läsa/skriva |

## Lagring

Vid första starten kopieras `data/seed.json` till `data/anime.json`. Därefter sparas ändringar i `anime.json` och finns kvar efter omstart. Befintlig data skrivs inte över med startdatan. Startdatan innehåller avslutade TV-serier; avsnittsantal gäller serien som anges, utan filmer och specialavsnitt.

`seed.json` finns i GitHub-repot, medan den lokala `anime.json` är ignorerad av Git. JSON-lagringen är tänkt för ett litet projekt med en serverprocess. API:et har ingen inloggning.

## Tester och TDD

```bash
npm test
```

Testerna använder `node:test` och Supertest. De testar bland annat CRUD, filtrering, paginering, validering, startdata och lagringsfel. De använder egna tillfälliga filer så att den vanliga datan inte påverkas.

Jag har arbetat i TDD-steg: först ett test som misslyckas, sedan kod som får det att gå igenom, och därefter förenkling där det behövs. Testerna och implementationerna ligger i separata commits så att stegen går att följa i historiken.

`npm run dev` startar med automatisk omstart när koden ändras. `npm run test:coverage` visar kodtäckningen.
