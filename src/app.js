import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';
import { InputError, validateBody, validateQuery } from './validation.js';
import { openapi } from './openapi.js';

export const defaultDataFile = fileURLToPath(new URL('../data/anime.json', import.meta.url));

export function createApp({ dataFile = defaultDataFile, logger = console } = {}) {
  const app = express();
  const store = createStore(dataFile);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.get('/openapi.json', (req, res) => res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { validatorUrl: null } }));

  app.get('/anime', (req, res) => {
    const { genre, status, q, page, limit } = validateQuery(req.query);
    const filtered = store.read().filter((item) =>
      (!genre || item.genre === genre)
      && (!status || item.status === status)
      && (!q || item.title.toLowerCase().includes(q)));
    const total = filtered.length;
    const start = (page - 1) * limit;
    res.json({
      data: filtered.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  app.get('/anime/:id', (req, res) => {
    const anime = store.read().find((item) => item.id === req.params.id);
    if (!anime) return res.status(404).json({ error: 'Anime hittades inte.' });
    res.json(anime);
  });

  app.post('/anime', validateBody, (req, res) => {
    const records = store.read();
    const anime = { ...req.body, id: randomUUID() };
    records.push(anime);
    store.write(records);
    res.status(201).location(`/anime/${anime.id}`).json(anime);
  });

  app.put('/anime/:id', validateBody, (req, res) => {
    const records = store.read();
    const index = records.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Anime hittades inte.' });
    records[index] = { ...req.body, id: req.params.id };
    store.write(records);
    res.json(records[index]);
  });

  app.delete('/anime/:id', (req, res) => {
    const records = store.read();
    const remaining = records.filter((item) => item.id !== req.params.id);
    if (remaining.length === records.length) {
      return res.status(404).json({ error: 'Anime hittades inte.' });
    }
    store.write(remaining);
    res.status(204).end();
  });

  app.use((req, res) => res.status(404).json({ error: 'Routen hittades inte.' }));
  app.use((error, req, res, next) => {
    if (error instanceof InputError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Body innehåller ogiltig JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Body får vara högst 10 kB.' });
    }
    if (error.status === 415) {
      return res.status(415).json({ error: 'Teckenkodningen eller komprimeringen stöds inte.' });
    }
    logger.error(error);
    res.status(500).json({ error: 'Ett internt serverfel inträffade.' });
  });
  return app;
}
