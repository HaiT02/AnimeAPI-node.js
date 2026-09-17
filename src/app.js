import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';
import { createAnimeService } from './services/anime-service.js';
import { createAnimeRouter } from './routes/anime-routes.js';
import { createErrorHandler } from './error-handler.js';
import { openapi } from './openapi.js';

export const defaultDataFile = fileURLToPath(new URL('../data/anime.json', import.meta.url));

export function createApp({ dataFile = defaultDataFile, logger = console } = {}) {
  const app = express();
  const store = createStore(dataFile);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.get('/openapi.json', (req, res) => res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { validatorUrl: null } }));

  app.use('/anime', createAnimeRouter(createAnimeService(store)));

  app.use((req, res) => res.status(404).json({ error: 'Routen hittades inte.' }));
  app.use(createErrorHandler(logger));
  return app;
}
