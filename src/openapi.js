import { genres, statuses } from './validation.js';

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonResponse = (description, schema) => ({
  description, content: { 'application/json': { schema } },
});
const serverError = jsonResponse('Lagringen kunde inte läsas eller skrivas.', ref('Error'));
const notFound = jsonResponse('Anime hittades inte.', ref('Error'));
const badRequest = jsonResponse('Ogiltig indata eller JSON.', ref('Error'));
const bodyErrors = {
  400: badRequest,
  413: jsonResponse('Body överskrider 10 kB.', ref('Error')),
  415: jsonResponse('Använd application/json med en teckenkodning som stöds.', ref('Error')),
  500: serverError,
};
const requestBody = {
  required: true,
  content: { 'application/json': { schema: ref('AnimeInput') } },
};

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Anime API', version: '1.0.0', description: 'Ett REST API för att skapa, hämta, ersätta och ta bort anime. Skolprojekt utan inloggning.' },
  servers: [{ url: '/', description: 'Servern som visar dokumentationen' }],
  paths: {
    '/anime': {
      get: {
        summary: 'Lista, filtrera och paginera anime',
        description: 'Filter kombineras med AND före paginering. Ordningen är den som posterna skapades i. En tom lista eller sida utanför resultatet ger 200 med data: []. Okända eller upprepade parametrar ger 400.',
        parameters: [
          { name: 'genre', in: 'query', description: 'Exakt genre, oberoende av stora/små bokstäver.', schema: { type: 'string', enum: genres } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: statuses } },
          { name: 'q', in: 'query', description: 'Del av titel, oberoende av stora/små bokstäver. Ren text.', schema: { type: 'string', minLength: 1, maxLength: 120 } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
        ],
        responses: {
          200: jsonResponse('En sida av resultatet.', ref('AnimeList')),
          400: badRequest, 500: serverError,
        },
      },
      post: {
        summary: 'Skapa en anime', requestBody,
        responses: {
          201: { ...jsonResponse('Anime skapades.', ref('Anime')), headers: { Location: { description: 'Sökväg till den skapade posten.', schema: { type: 'string' } } } },
          ...bodyErrors,
        },
      },
    },
    '/anime/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, description: 'Det id som servern returnerade när posten skapades.', schema: { type: 'string' } }],
      get: {
        summary: 'Hämta en anime',
        responses: { 200: jsonResponse('En anime.', ref('Anime')), 404: notFound, 500: serverError },
      },
      put: {
        summary: 'Ersätt en anime',
        description: 'Alla fyra fält krävs. Postens id behålls.', requestBody,
        responses: { 200: jsonResponse('Anime uppdaterades.', ref('Anime')), 404: notFound, ...bodyErrors },
      },
      delete: {
        summary: 'Ta bort en anime',
        responses: { 204: { description: 'Anime togs bort. Ingen response body.' }, 404: notFound, 500: serverError },
      },
    },
  },
  components: {
    schemas: {
      AnimeInput: {
        type: 'object', additionalProperties: false,
        required: ['title', 'genre', 'episodes', 'status'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120, description: 'Ren text utan <, > eller kontrolltecken. Omgivande blanksteg tas bort och flera blanksteg blir ett.', example: 'Naruto' },
          genre: { type: 'string', enum: genres, description: 'Blanksteg tas bort och texten blir gemener.', example: 'action' },
          episodes: { type: 'integer', minimum: 0, maximum: 100000, example: 220 },
          status: { type: 'string', enum: statuses, description: 'Blanksteg tas bort och texten blir gemener.', example: 'finished' },
        },
      },
      Anime: {
        type: 'object', required: ['id', 'title', 'genre', 'episodes', 'status'],
        properties: {
          id: { type: 'string', example: '93cab4e7-10d8-4dc4-9a9a-93f65c8d49c0' },
          title: { type: 'string' }, genre: { type: 'string', enum: genres },
          episodes: { type: 'integer' }, status: { type: 'string', enum: statuses },
        },
      },
      AnimeList: {
        type: 'object', required: ['data', 'pagination'],
        properties: {
          data: { type: 'array', items: ref('Anime') },
          pagination: {
            type: 'object', required: ['page', 'limit', 'total', 'totalPages'],
            properties: {
              page: { type: 'integer', example: 1 }, limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 12 }, totalPages: { type: 'integer', example: 2 },
            },
          },
        },
      },
      Error: { type: 'object', required: ['error'], properties: { error: { type: 'string', example: 'Anime hittades inte.' } } },
    },
  },
};
