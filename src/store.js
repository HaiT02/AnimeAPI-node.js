import { readFileSync, writeFileSync, renameSync } from 'node:fs';

// Synkrona filoperationer håller varje ändring sammanhängande i en Node-process.
// Passar en liten skoluppgift; större API:er bör använda en databas.
export function createStore(dataFile) {
  return {
    read() {
      return JSON.parse(readFileSync(dataFile, 'utf8'));
    },
    write(records) {
      // Byt först ut originalet när hela den nya filen har skrivits.
      const temporaryFile = `${dataFile}.tmp`;
      writeFileSync(temporaryFile, JSON.stringify(records, null, 2));
      renameSync(temporaryFile, dataFile);
    },
  };
}
