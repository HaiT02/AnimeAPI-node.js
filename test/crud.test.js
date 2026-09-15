import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setup, anime } from './helpers.js';

test('POST /anime creates an anime and saves it to disk', async (t) => {
  const { app, dataFile } = await setup(t);
  const response = await request(app).post('/anime').send(anime).expect(201);
  assert.match(response.body.id, /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.location, `/anime/${response.body.id}`);
  assert.deepEqual(response.body, { id: response.body.id, ...anime });
  assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), [response.body]);
});

test('GET /anime returns stored anime, also from a new app instance', async (t) => {
  const { dataFile } = await setup(t, [{ id: '1', ...anime }]);
  const response = await request(createApp({ dataFile })).get('/anime').expect(200);
  assert.deepEqual(response.body.data, [{ id: '1', ...anime }]);
});

test('GET /anime/:id returns one anime or 404', async (t) => {
  const { app } = await setup(t, [{ id: '1', ...anime }]);
  const response = await request(app).get('/anime/1').expect(200);
  assert.equal(response.body.title, anime.title);
  await request(app).get('/anime/missing').expect(404);
});

test('PUT /anime/:id replaces the anime and persists the change', async (t) => {
  const { app, dataFile } = await setup(t, [{ id: '1', ...anime }]);
  const updated = { ...anime, title: 'Bleach', episodes: 366 };
  const response = await request(app).put('/anime/1').send(updated).expect(200);
  assert.deepEqual(response.body, { id: '1', ...updated });
  assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), [response.body]);
  await request(app).put('/anime/missing').send(updated).expect(404);
});

test('DELETE /anime/:id removes the record permanently or returns 404', async (t) => {
  const { app, dataFile } = await setup(t, [{ id: '1', ...anime }]);
  const response = await request(app).delete('/anime/1').expect(204);
  assert.equal(response.text, '');
  assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), []);
  await request(app).delete('/anime/1').expect(404);
});
