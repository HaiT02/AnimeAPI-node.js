import express from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';

export const defaultDataFile = fileURLToPath(new URL('../data/anime.json', import.meta.url));

export function createApp({ dataFile = defaultDataFile, logger = console } = {}) {
  const app = express();
  const store = createStore(dataFile);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/anime', (req, res) => {
    res.json({ data: store.read() });
  });

  app.get('/anime/:id', (req, res) => {
    const anime = store.read().find((item) => item.id === req.params.id);
    if (!anime) return res.status(404).json({ error: 'Anime hittades inte.' });
    res.json(anime);
  });

  app.post('/anime', (req, res) => {
    const records = store.read();
    const anime = { ...req.body, id: randomUUID() };
    records.push(anime);
    store.write(records);
    res.status(201).location(`/anime/${anime.id}`).json(anime);
  });

  app.put('/anime/:id', (req, res) => {
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
    logger.error(error);
    res.status(500).json({ error: 'Ett internt serverfel inträffade.' });
  });
  return app;
}
