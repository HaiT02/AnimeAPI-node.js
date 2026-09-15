import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import request from 'supertest';
import { setup, anime } from './helpers.js';

test('every CRUD route returns a safe JSON error for corrupt or missing storage', async (t) => {
  const { app, dataFile } = await setup(t);
  const corruptFiles = ['{broken', '{}', '[null]', JSON.stringify([{ id: '1', ...anime, episodes: -1 }]),
    JSON.stringify([{ id: '1', ...anime }, { id: '1', ...anime }])];
  for (const content of [...corruptFiles, null]) {
    if (content === null) await unlink(dataFile);
    else await writeFile(dataFile, content);
    for (const [method, url] of [['get', '/anime'], ['get', '/anime/1'], ['post', '/anime'], ['put', '/anime/1'], ['delete', '/anime/1']]) {
      const call = request(app)[method](url);
      if (method === 'post' || method === 'put') call.send(anime);
      const response = await call.expect(500);
      assert.deepEqual(response.body, { error: 'Ett internt serverfel inträffade.' });
      assert.ok(!response.text.includes(dataFile));
    }
    if (content !== null) assert.equal(await readFile(dataFile, 'utf8'), content);
  }
});

test('write failures return 500 and leave the original data intact', async (t) => {
  const original = [{ id: '1', ...anime }];
  const { app, dataFile } = await setup(t, original);
  // En katalog på tempfilens plats orsakar ett riktigt skrivfel på Windows och Linux.
  await mkdir(`${dataFile}.tmp`);
  for (const method of ['post', 'put', 'delete']) {
    const call = request(app)[method](method === 'post' ? '/anime' : '/anime/1');
    if (method !== 'delete') call.send(anime);
    await call.expect(500);
  }
  assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), original);
});

test('concurrent creates do not lose records', async (t) => {
  const { app, dataFile } = await setup(t);
  const responses = await Promise.all(Array.from({ length: 10 }, (_, i) =>
    request(app).post('/anime').send({ ...anime, title: `Anime ${i}` }).expect(201)));
  assert.equal(new Set(responses.map((response) => response.body.id)).size, 10);
  assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).length, 10);
});

test('unknown routes return a JSON 404', async (t) => {
  const { app } = await setup(t);
  const response = await request(app).get('/missing').expect(404);
  assert.deepEqual(response.body, { error: 'Routen hittades inte.' });
});
