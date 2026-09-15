import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createApp, defaultDataFile } from './app.js';

const dataFile = process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : defaultDataFile;
const port = Number(process.env.PORT || 3000);

try {
  mkdirSync(path.dirname(dataFile), { recursive: true });
  // Skapa endast en ny fil. Befintlig data får aldrig skrivas över vid start.
  try {
    writeFileSync(dataFile, '[]\n', { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  const server = createApp({ dataFile }).listen(port, () => {
    console.log(`Anime API: http://localhost:${port}/anime`);
  });
  server.on('error', (error) => {
    console.error('Kunde inte starta servern:', error.message);
    process.exitCode = 1;
  });
} catch (error) {
  console.error('Kunde inte starta servern:', error.message);
  process.exitCode = 1;
}
