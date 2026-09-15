# Anime API

Ett REST API byggt med Node.js och Express för att hantera anime. Projektet innehåller ingen frontend. API:et har CRUD-operationer, filtrering, paginering och lagring i en JSON-fil.

## Kom igång

Kräver **Node.js 22 eller senare**, npm och Git. Projektet har testats med Node.js 24.

```bash
git clone https://github.com/HaiT02/AnimeAPI-node.js.git
cd AnimeAPI-node.js
npm ci
npm start
```

Servern körs på `http://localhost:3000`. Vid första starten skapas `data/anime.json` med en tom lista. Sparad data finns kvar efter omstart. Ingen databasinstallation eller API-nyckel behövs.

| Kommando | Beskrivning |
| --- | --- |
| `npm start` | Startar API:et |
| `npm run dev` | Startar med automatisk omstart vid kodändringar |
| `npm test` | Kör alla automatiska tester |
| `npm run test:coverage` | Kör testerna och visar kodtäckning |

Miljövariablerna `PORT` och `DATA_FILE` kan användas för att byta port och sökväg till datafilen. Standardvärden är `3000` och projektets `data/anime.json`. En relativ `DATA_FILE` utgår från terminalens arbetsmapp.

Exempel i PowerShell:

```powershell
$env:PORT = '3001'
npm start
```

## API-dokumentation

Interaktiv dokumentation med **Swagger UI** finns på [http://localhost:3000/docs/](http://localhost:3000/docs/). Där går det att läsa om och testa alla endpoints med **Try it out**. OpenAPI-specifikationen finns på [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json) och definieras i [src/openapi.js](src/openapi.js).

### Endpoints

Alla sökvägar utgår från `http://localhost:3000`. POST och PUT kräver `Content-Type: application/json`. Svaren är JSON, förutom DELETE som ger ett tomt svar vid lyckad borttagning.

| Metod | Sökväg | Funktion | Lyckat svar |
| --- | --- | --- | --- |
| GET | `/anime` | Lista, filtrera och paginera anime | `200 OK` |
| GET | `/anime/:id` | Hämta en anime | `200 OK` |
| POST | `/anime` | Skapa en anime | `201 Created` |
| PUT | `/anime/:id` | Ersätta en anime, alla fyra fält krävs | `200 OK` |
| DELETE | `/anime/:id` | Ta bort en anime | `204 No Content` |

### Data och validering

Exempel på body för POST och PUT:

```json
{
  "title": "Naruto",
  "genre": "action",
  "episodes": 220,
  "status": "finished"
}
```

| Fält | Typ | Regler |
| --- | --- | --- |
| `title` | string | 1–120 tecken efter rensning. HTML-vinkelparenteser och kontrolltecken avvisas. |
| `genre` | string | `action`, `adventure`, `comedy`, `drama`, `fantasy`, `romance`, `sci-fi`, `slice-of-life`, `sports` eller `thriller` |
| `episodes` | integer | Heltal mellan 0 och 100000. Tal som text accepteras inte. |
| `status` | string | `upcoming`, `ongoing` eller `finished` |

Alla fyra fält är obligatoriska. Okända fält avvisas. Servern skapar ett UUID som `id`; klienten ska inte skicka ett eget id. POST returnerar det skapade objektet och en `Location`-header med postens sökväg. PUT behåller postens id.

Sanering sker innan data sparas: omgivande blanksteg tas bort, upprepade blanksteg blir ett och genre/status omvandlas till små bokstäver. Exempelvis blir `" ACTION "` till `"action"`. Titlar lagras som ren text; `<`, `>` och kontrolltecken ger `400`. Request body får vara högst 10 kB. Data körs aldrig som kod. En eventuell framtida klient behöver fortfarande rendera titlar som text och undvika att tolka dem som HTML.

### Filtrering och paginering

| Parameter | Beskrivning | Standard |
| --- | --- | --- |
| `genre` | Exakt genre ur listan ovan | Alla genrer |
| `status` | Exakt status ur listan ovan | Alla statusar |
| `q` | Sök efter en del av titeln, 1–120 tecken ren text | Ingen sökning |
| `page` | Positivt heltal, högst 9007199254740991 | `1` |
| `limit` | Antal poster per sida, heltal 1–50 | `10` |

Textfilter ignorerar skillnader mellan stora och små bokstäver. Flera filter kan kombineras; varje träff måste uppfylla samtliga filter. Filtreringen görs före pagineringen. Posterna returneras i den ordning de skapades. Okända, upprepade eller ogiltiga parametrar ger `400`.

```text
GET /anime
GET /anime?genre=action
GET /anime?genre=action&status=finished&page=1&limit=3
GET /anime?q=naruto
GET /anime?page=2
```

Exempel på listsvar:

```json
{
  "data": [
    {
      "id": "93cab4e7-10d8-4dc4-9a9a-93f65c8d49c0",
      "title": "Naruto",
      "genre": "action",
      "episodes": 220,
      "status": "finished"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

`total` är antalet träffar efter filtrering, före paginering. En sida utanför resultatet ger `200` med `data: []`. När inga poster matchar är både `total` och `totalPages` noll.

### Prova CRUD i PowerShell

Starta servern i en terminal och kör följande i en annan:

```powershell
$baseUrl = 'http://localhost:3000'

# CREATE
$body = @{ title = 'Naruto'; genre = 'action'; episodes = 220; status = 'finished' } | ConvertTo-Json
$anime = Invoke-RestMethod "$baseUrl/anime" -Method Post -ContentType 'application/json' -Body $body

# READ: lista och enskild post
Invoke-RestMethod "$baseUrl/anime?genre=action&page=1&limit=3"
Invoke-RestMethod "$baseUrl/anime/$($anime.id)"

# UPDATE: PUT ersätter samtliga redigerbara fält
$updated = @{ title = 'Naruto Shippuden'; genre = 'action'; episodes = 500; status = 'finished' } | ConvertTo-Json
Invoke-RestMethod "$baseUrl/anime/$($anime.id)" -Method Put -ContentType 'application/json' -Body $updated

# DELETE
Invoke-RestMethod "$baseUrl/anime/$($anime.id)" -Method Delete
```

Samma anrop kan göras i Swagger UI eller Postman. Använd det id som POST returnerar för GET, PUT och DELETE.

### Felhantering

| Status | Betydelse |
| --- | --- |
| `400 Bad Request` | Felaktig JSON, saknade/ogiltiga fält eller query-parametrar |
| `404 Not Found` | Posten eller routen finns inte |
| `413 Content Too Large` | Request body överskrider 10 kB |
| `415 Unsupported Media Type` | Fel Content-Type eller en teckenkodning/komprimering som inte stöds |
| `500 Internal Server Error` | Internt fel, exempelvis saknad, korrupt eller oskrivbar datafil |

Exempel på fel:

```json
{
  "error": "Anime hittades inte."
}
```

Samtliga CRUD-routes använder gemensam felhantering. Tekniska serverfel loggas i terminalen men stack traces och lokala filsökvägar skickas inte till klienten. En korrupt datafil skrivs inte över automatiskt.

## Datalagring och struktur

Anime sparas i `data/anime.json`, som är ignorerad av Git för att lokala testanrop inte ska ändra repots innehåll. En tom fil skapas endast om filen saknas vid serverstart. Även strukturen på lagrade poster kontrolleras vid läsning. Ändringar skrivs först till en temporär fil som sedan ersätter originalet.

```text
src/
  app.js           Express-app och CRUD-routes
  server.js        Startar servern och skapar datafil vid behov
  store.js         Läser, kontrollerar och skriver JSON-data
  validation.js    Validerar och rensar body och query-parametrar
  error-handler.js Gemensamma felsvar och loggning
  openapi.js       OpenAPI-specifikation för Swagger UI
test/
  crud.test.js         CRUD och beständig lagring
  list.test.js         Filtrering och paginering
  validation.test.js   Felaktig indata och sanering
  errors.test.js       Lagringsfel och samtidiga anrop
  docs.test.js         Dokumentationens endpoints
  helpers.js           Isolerade testfiler och testdata
data/
  .gitkeep         Behåller datamappen i Git
```

Fillagringen använder synkrona operationer för att hålla läsning och ändring sammanhängande i en Node-process. Det är enkelt för ett litet kursprojekt men blockerar andra anrop under filåtkomst. API:et är avsett för en serverprocess och en liten datamängd. Vid större användning eller flera processer behövs en databas. API:et saknar autentisering, så alla som når servern kan ändra data.

## Tester och TDD

Testerna använder Node.js inbyggda testverktyg (`node:test`) och Supertest för HTTP-anrop. Varje test får en egen tillfällig datafil som tas bort efteråt. Testerna ändrar inte den vanliga datafilen.

Utvecklingen har gjorts i test-först-steg: tester skrevs och kördes röda innan motsvarande implementation lades till och kördes grön. Git-historiken innehåller separata test- och implementationscommits för CRUD, validering/filtrering/paginering, kontroll av korrupt lagring och Swagger-dokumentation. Testerna för skrivfel och samtidiga anrop verifierade även redan fungerande beteenden.

Refactor-steget flyttade den gemensamma felhanteringen till en egen modul för att göra routes lättare att läsa. Samma tester kördes gröna före och efter flytten.

Testsviten kontrollerar bland annat HTTP-status, svarsdata, att ändringar finns på disk, ogiltig indata, kombinerade filter, paginering och att samtliga CRUD-routes hanterar lagringsfel. Att testerna är gröna är en kontroll av dessa beteenden, inte en garanti för att alla möjliga fel är täckta.

## Teknik och referenser

- [Express: felhantering](https://expressjs.com/en/guide/error-handling/)
- [Node.js: testverktyget](https://nodejs.org/api/test.html)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Supertest](https://github.com/forwardemail/supertest)
