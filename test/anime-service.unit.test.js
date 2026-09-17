import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnimeService } from '../src/services/anime-service.js';

const anime = { title: 'Naruto', genre: 'action', episodes: 220, status: 'finished' };

function setup(initial = []) {
  let records = structuredClone(initial);
  let writes = 0;
  const service = createAnimeService({
    read: () => structuredClone(records),
    write(value) { records = structuredClone(value); writes++; },
  });
  return { service, records: () => records, writes: () => writes };
}

test('service combines filters before pagination and counts all matches', () => {
  const records = [
    { ...anime, id: '1' },
    { ...anime, id: '2', genre: 'comedy' },
    { ...anime, id: '3', status: 'ongoing' },
    { ...anime, id: '4', title: 'Bleach' },
    { ...anime, id: '5', title: 'Naruto Shippuden' },
  ];
  const { service } = setup(records);
  assert.deepEqual(service.list({ genre: 'action', status: 'finished', q: 'naruto', page: 2, limit: 1 }), {
    data: [records[4]], pagination: { page: 2, limit: 1, total: 2, totalPages: 2 },
  });
  assert.deepEqual(service.list({ q: 'missing', page: 1, limit: 10 }), {
    data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  });
  assert.deepEqual(service.list({ page: 9, limit: 10 }).data, []);
});

test('service creates unique ids, replaces fields and removes only the requested record', () => {
  const state = setup([{ ...anime, id: 'existing' }]);
  const first = state.service.create(anime);
  const second = state.service.create(anime);
  assert.match(first.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(first.id, second.id);
  assert.deepEqual(state.records(), [{ ...anime, id: 'existing' }, first, second]);
  assert.deepEqual(state.service.getById(first.id), first);
  const replacement = { title: 'Bleach', genre: 'adventure', episodes: 366, status: 'ongoing' };
  assert.deepEqual(state.service.update(first.id, replacement), { ...replacement, id: first.id });
  assert.deepEqual(state.records()[1], { ...replacement, id: first.id });
  assert.equal(state.service.remove(first.id), true);
  assert.deepEqual(state.records(), [{ ...anime, id: 'existing' }, second]);
});

test('missing ids do not write to storage', () => {
  const state = setup([{ ...anime, id: '1' }]);
  assert.equal(state.service.getById('missing'), undefined);
  assert.equal(state.service.update('missing', anime), undefined);
  assert.equal(state.service.remove('missing'), false);
  assert.equal(state.writes(), 0);
  assert.deepEqual(state.records(), [{ ...anime, id: '1' }]);
});

test('service propagates storage failures instead of reporting success', () => {
  const failure = new Error('Storage unavailable');
  for (const failingOperation of ['read', 'write']) {
    const store = { read: () => [{ ...anime, id: '1' }], write() {} };
    store[failingOperation] = () => { throw failure; };
    const service = createAnimeService(store);
    const operations = [() => service.create(anime), () => service.update('1', anime), () => service.remove('1')];
    if (failingOperation === 'read') operations.push(() => service.getById('1'), () => service.list({ page: 1, limit: 10 }));
    for (const operation of operations) assert.throws(operation, (error) => error === failure);
  }
});
