import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InputError, validateAnime, validateQuery } from '../src/validation.js';

const anime = { title: 'Naruto', genre: 'action', episodes: 220, status: 'finished' };

test('validateAnime normalizes text without mutating the input', () => {
  const body = { ...anime, title: '  My   Hero Academia  ', genre: ' ACTION ', status: ' FINISHED ' };
  const original = { ...body };
  assert.deepEqual(validateAnime(body), { ...anime, title: 'My Hero Academia' });
  assert.deepEqual(body, original);
});

test('validateAnime accepts boundary values', () => {
  for (const episodes of [0, 100000]) {
    for (const title of ['a', 'a'.repeat(120)]) {
      const body = { ...anime, episodes, title };
      assert.deepEqual(validateAnime(body), body);
    }
  }
});

test('validateAnime rejects invalid objects, text, choices and episode counts', () => {
  const invalid = [null, [], {}, 'Naruto', { ...anime, id: '1' }];
  for (const title of ['', '   ', 123, 'a'.repeat(121), '<script>', 'a\u0000', 'a\n']) invalid.push({ ...anime, title });
  for (const episodes of [-1, 100001, 1.5, '220', NaN, Infinity]) invalid.push({ ...anime, episodes });
  invalid.push({ ...anime, genre: 'unknown' }, { ...anime, status: 'unknown' });
  for (const body of invalid) {
    assert.throws(() => validateAnime(body), (error) => error instanceof InputError && error.status === 400);
  }
  assert.throws(() => validateAnime({ ...anime, episodes: -1 }), /episodes/);
});

test('validateQuery supplies defaults and normalizes valid filters', () => {
  assert.deepEqual(validateQuery({}), { genre: undefined, status: undefined, q: undefined, page: 1, limit: 10 });
  assert.deepEqual(validateQuery({ genre: ' ACTION ', status: ' FINISHED ', q: ' NARUTO ', page: '2', limit: '50' }), {
    genre: 'action', status: 'finished', q: 'naruto', page: 2, limit: 50,
  });
});

test('validateQuery rejects unknown filters and invalid pagination', () => {
  const queries = [{ unknown: '1' }, { q: '' }, { q: '<script>' }, { genre: 'unknown' }, { status: 'unknown' }];
  for (const page of ['0', '-1', '1.5', 'abc', '9007199254740992', ['1', '2'], 1]) queries.push({ page });
  for (const limit of ['0', '51', '2abc', '']) queries.push({ limit });
  for (const query of queries) assert.throws(() => validateQuery(query), InputError);
  assert.throws(() => validateQuery({ page: '0' }), /page/);
});
