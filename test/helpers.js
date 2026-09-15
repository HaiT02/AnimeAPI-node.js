import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';

export async function setup(t, records = []) {
  const directory = await mkdtemp(path.join(tmpdir(), 'anime-api-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const dataFile = path.join(directory, 'anime.json');
  await writeFile(dataFile, JSON.stringify(records));
  return { app: createApp({ dataFile, logger: { error() {} } }), dataFile };
}

export const anime = { title: 'Naruto', genre: 'action', episodes: 220, status: 'finished' };
