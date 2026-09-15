import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { setup, anime } from './helpers.js';

const invalidBodies = [
  {}, [], null,
  { ...anime, title: '' },
  { ...anime, title: '   ' },
  { ...anime, title: 123 },
  { ...anime, title: 'a'.repeat(121) },
  { ...anime, title: '<script>alert(1)</script>' },
  { ...anime, title: 'Naruto\u0000' },
  { ...anime, genre: 'unknown' },
  { ...anime, episodes: -1 },
  { ...anime, episodes: 1.5 },
  { ...anime, episodes: '220' },
  { ...anime, episodes: 100001 },
  { ...anime, status: 'unknown' },
  { ...anime, id: 'client-id' },
  { ...anime, extra: 'unexpected' },
];

test('POST and PUT reject invalid input without changing storage', async (t) => {
  const original = [{ id: '1', ...anime }];
  const { app, dataFile } = await setup(t, original);
  for (const body of invalidBodies) {
    for (const [method, url] of [['post', '/anime'], ['put', '/anime/1']]) {
      const response = await request(app)[method](url)
        .set('Content-Type', 'application/json').send(JSON.stringify(body)).expect(400);
      assert.equal(typeof response.body.error, 'string');
    }
  }
  assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), original);
});

test('POST and PUT trim whitespace and normalize genre and status', async (t) => {
  const { app } = await setup(t);
  const input = { title: '  My   Hero Academia  ', genre: ' ACTION ', episodes: 0, status: ' UPCOMING ' };
  const created = await request(app).post('/anime').send(input).expect(201);
  assert.equal(created.body.title, 'My Hero Academia');
  assert.equal(created.body.genre, 'action');
  assert.equal(created.body.status, 'upcoming');
  const updated = await request(app).put(`/anime/${created.body.id}`).send(input).expect(200);
  assert.deepEqual(updated.body, created.body);
});

test('malformed JSON, unsupported content type and oversized bodies return JSON errors', async (t) => {
  const { app } = await setup(t);
  for (const [body, type, status] of [
    ['{broken', 'application/json', 400],
    ['title=Naruto', 'text/plain', 415],
    [JSON.stringify({ ...anime, title: 'a'.repeat(11000) }), 'application/json', 413],
  ]) {
    const response = await request(app).post('/anime').set('Content-Type', type).send(body).expect(status);
    assert.equal(typeof response.body.error, 'string');
  }
});
