export const genres = ['action', 'adventure', 'comedy', 'drama', 'fantasy', 'romance', 'sci-fi', 'slice-of-life', 'sports', 'thriller'];
export const statuses = ['upcoming', 'ongoing', 'finished'];

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function cleanText(value, field) {
  if (typeof value !== 'string') throw new InputError(`${field} måste vara text.`);
  // Titlar och sökningar är ren text. HTML och kontrolltecken tillåts inte.
  if (/[<>\u0000-\u001f\u007f]/u.test(value)) {
    throw new InputError(`${field} får inte innehålla HTML eller kontrolltecken.`);
  }
  const cleaned = value.trim().replace(/\s+/gu, ' ');
  if (cleaned.length < 1 || cleaned.length > 120) {
    throw new InputError(`${field} måste vara 1–120 tecken.`);
  }
  return cleaned;
}

function choice(value, field, options) {
  const cleaned = cleanText(value, field).toLowerCase();
  if (!options.includes(cleaned)) {
    throw new InputError(`${field} måste vara ett av: ${options.join(', ')}.`);
  }
  return cleaned;
}

export function validateAnime(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new InputError('Body måste vara ett JSON-objekt.');
  }
  const fields = ['title', 'genre', 'episodes', 'status'];
  if (Object.keys(body).some((key) => !fields.includes(key))) {
    throw new InputError('Tillåtna fält är title, genre, episodes och status.');
  }
  const title = cleanText(body.title, 'title');
  const genre = choice(body.genre, 'genre', genres);
  const status = choice(body.status, 'status', statuses);
  if (!Number.isInteger(body.episodes) || body.episodes < 0 || body.episodes > 100000) {
    throw new InputError('episodes måste vara ett heltal mellan 0 och 100000.');
  }
  return { title, genre, episodes: body.episodes, status };
}

function positiveInteger(value, fallback, maximum, field) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)
    || !Number.isSafeInteger(Number(value)) || Number(value) > maximum) {
    throw new InputError(`${field} måste vara ett heltal mellan 1 och ${maximum}.`);
  }
  return Number(value);
}

export function validateQuery(query) {
  const allowed = ['genre', 'status', 'q', 'page', 'limit'];
  if (Object.keys(query).some((key) => !allowed.includes(key))) {
    throw new InputError('Tillåtna query-parametrar är genre, status, q, page och limit.');
  }
  return {
    genre: query.genre === undefined ? undefined : choice(query.genre, 'genre', genres),
    status: query.status === undefined ? undefined : choice(query.status, 'status', statuses),
    q: query.q === undefined ? undefined : cleanText(query.q, 'q').toLowerCase(),
    page: positiveInteger(query.page, 1, Number.MAX_SAFE_INTEGER, 'page'),
    limit: positiveInteger(query.limit, 10, 50, 'limit'),
  };
}

export function validateBody(req, res, next) {
  if (!req.is('application/json')) {
    throw new InputError('Använd Content-Type: application/json.', 415);
  }
  req.body = validateAnime(req.body);
  next();
}
