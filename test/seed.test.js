import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, unlink } from 'node:fs/promises';
import request from 'supertest';
import { initializeStorage } from '../src/initialize-storage.js';
import { setup, anime } from './helpers.js';

test('first startup creates 15 anime that can be read on two pages', async (t) => {
  const { app, dataFile } = await setup(t);
  await unlink(dataFile);
  initializeStorage(dataFile);
  const first = await request(app).get('/anime').expect(200);
  const second = await request(app).get('/anime?page=2').expect(200);
  assert.equal(first.body.pagination.total, 15);
  assert.equal(first.body.data.length, 10);
  assert.equal(second.body.data.length, 5);
  const records = [...first.body.data, ...second.body.data];
  assert.equal(new Set(records.map((item) => item.id)).size, 15);
  assert.ok(records.some((item) => item.title === 'Naruto'));
});

test('startup preserves existing data, including an intentionally empty list', async (t) => {
  for (const records of [[], [{ id: '1', ...anime }]]) {
    const { dataFile } = await setup(t, records);
    const before = await readFile(dataFile, 'utf8');
    initializeStorage(dataFile);
    assert.equal(await readFile(dataFile, 'utf8'), before);
  }
});
