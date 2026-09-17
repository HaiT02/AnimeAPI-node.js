import { validateQuery } from '../validation.js';

function notFound(res) {
  return res.status(404).json({ error: 'Anime hittades inte.' });
}

export function createAnimeController(service) {
  return {
    list(req, res) {
      res.json(service.list(validateQuery(req.query)));
    },
    getById(req, res) {
      const anime = service.getById(req.params.id);
      if (!anime) return notFound(res);
      res.json(anime);
    },
    create(req, res) {
      const anime = service.create(req.body);
      res.status(201).location(`/anime/${anime.id}`).json(anime);
    },
    update(req, res) {
      const anime = service.update(req.params.id, req.body);
      if (!anime) return notFound(res);
      res.json(anime);
    },
    remove(req, res) {
      if (!service.remove(req.params.id)) return notFound(res);
      res.status(204).end();
    },
  };
}
