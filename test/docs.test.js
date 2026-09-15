import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setup } from './helpers.js';

test('OpenAPI describes every CRUD operation and list parameters', async (t) => {
  const { app } = await setup(t);
  const { body: spec } = await request(app).get('/openapi.json').expect(200);
  assert.equal(spec.openapi, '3.0.3');
  for (const [path, methods] of [['/anime', ['get', 'post']], ['/anime/{id}', ['get', 'put', 'delete']]]) {
    for (const method of methods) {
      assert.ok(spec.paths[path][method].responses['500']);
      assert.ok(spec.paths[path][method].summary);
    }
  }
  assert.deepEqual(spec.paths['/anime'].get.parameters.map((item) => item.name), ['genre', 'status', 'q', 'page', 'limit']);
  assert.deepEqual(spec.components.schemas.AnimeInput.required, ['title', 'genre', 'episodes', 'status']);
});

test('Swagger UI and its script are served locally', async (t) => {
  const { app } = await setup(t);
  const response = await request(app).get('/docs/').expect(200).expect('Content-Type', /html/);
  assert.match(response.text, /swagger-ui/);
  const script = await request(app).get('/docs/swagger-ui-init.js').expect(200);
  assert.match(script.text, /Anime API/);
});
