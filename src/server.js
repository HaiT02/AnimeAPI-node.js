import path from 'node:path';
import { createApp, defaultDataFile } from './app.js';
import { initializeStorage } from './initialize-storage.js';

const dataFile = process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : defaultDataFile;
const port = Number(process.env.PORT || 3000);

try {
  initializeStorage(dataFile);
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
