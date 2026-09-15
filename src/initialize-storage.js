import { constants, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function initializeStorage(dataFile) {
  mkdirSync(path.dirname(dataFile), { recursive: true });
  try {
    // Startdata kopieras bara första gången. Användarens ändringar behålls.
    copyFileSync(new URL('../data/seed.json', import.meta.url), dataFile, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}
