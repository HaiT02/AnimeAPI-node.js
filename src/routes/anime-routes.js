import { Router } from 'express';
import { createAnimeController } from '../controllers/anime-controller.js';
import { validateBody } from '../validation.js';

export function createAnimeRouter(service) {
  const router = Router();
  const controller = createAnimeController(service);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', validateBody, controller.create);
  router.put('/:id', validateBody, controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
