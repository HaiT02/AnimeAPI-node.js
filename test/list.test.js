import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setup, anime } from './helpers.js';

const records = Array.from({ length: 12 }, (_, index) => ({
  ...anime, id: String(index + 1), title: `Anime ${index + 1}`,
  genre: index < 6 ? 'action' : 'comedy',
  status: index % 2 === 0 ? 'ongoing' : 'finished',
}));

test('GET /anime defaults to 10 records and includes pagination metadata', async (t) => {
  const { app } = await setup(t, records);
  const first = await request(app).get('/anime').expect(200);
  assert.deepEqual(first.body, { data: records.slice(0, 10), pagination: { page: 1, limit: 10, total: 12, totalPages: 2 } });
  const second = await request(app).get('/anime?page=2').expect(200);
  assert.deepEqual(second.body.data, records.slice(10));
  const outside = await request(app).get('/anime?page=10').expect(200);
  assert.deepEqual(outside.body.data, []);
});

test('filters can be combined and apply before pagination', async (t) => {
  const { app } = await setup(t, records);
  const response = await request(app).get('/anime?genre=ACTION&status=ongoing&limit=2&page=2').expect(200);
  assert.deepEqual(response.body.data, [records[4]]);
  assert.deepEqual(response.body.pagination, { page: 2, limit: 2, total: 3, totalPages: 2 });
  const search = await request(app).get('/anime?q=ANIME%201').expect(200);
  assert.equal(search.body.pagination.total, 4);
  const empty = await request(app).get('/anime?q=missing').expect(200);
  assert.deepEqual(empty.body, { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
});

test('invalid or unknown query parameters return 400', async (t) => {
  const { app } = await setup(t, records);
  for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=abc', 'page=9007199254740992',
    'limit=0', 'limit=51', 'limit=2abc', 'page=1&page=2', 'genre=invalid', 'status=invalid',
    'q=', 'q=%3Cscript%3E', 'q=' + 'a'.repeat(121), 'unknown=1', 'limit=']) {
    const response = await request(app).get(`/anime?${query}`).expect(400);
    assert.equal(typeof response.body.error, 'string');
  }
});
