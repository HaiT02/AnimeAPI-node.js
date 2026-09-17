import { randomUUID } from 'node:crypto';

// Tar emot validerad data. Lagringen injiceras så att logiken kan testas utan filer.
export function createAnimeService(store) {
  return {
    list({ genre, status, q, page, limit }) {
      const filtered = store.read().filter((item) =>
        (!genre || item.genre === genre)
        && (!status || item.status === status)
        && (!q || item.title.toLowerCase().includes(q)));
      const total = filtered.length;
      const start = (page - 1) * limit;
      return {
        data: filtered.slice(start, start + limit),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    },
    getById(id) {
      return store.read().find((item) => item.id === id);
    },
    create(body) {
      const records = store.read();
      const anime = { ...body, id: randomUUID() };
      store.write([...records, anime]);
      return anime;
    },
    update(id, body) {
      const records = store.read();
      const index = records.findIndex((item) => item.id === id);
      if (index === -1) return undefined;
      const anime = { ...body, id };
      store.write(records.map((item, i) => i === index ? anime : item));
      return anime;
    },
    remove(id) {
      const records = store.read();
      const remaining = records.filter((item) => item.id !== id);
      if (remaining.length === records.length) return false;
      store.write(remaining);
      return true;
    },
  };
}
