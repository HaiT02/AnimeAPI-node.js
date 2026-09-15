import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { validateAnime } from './validation.js';

// Synkrona filoperationer håller varje ändring sammanhängande i en Node-process.
// Passar en liten skoluppgift; större API:er bör använda en databas.
export function createStore(dataFile) {
  return {
    read() {
      const records = JSON.parse(readFileSync(dataFile, 'utf8'));
      // Giltig JSON kan ändå innehålla fel sorts data. Skriv aldrig över den.
      try {
        if (!Array.isArray(records)) throw new Error('Förväntade en lista.');
        const ids = new Set();
        for (const record of records) {
          if (!record || typeof record.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(record.id) || ids.has(record.id)) {
            throw new Error('Ogiltigt eller duplicerat id.');
          }
          const { id, ...fields } = record;
          const cleaned = validateAnime(fields);
          if (Object.keys(cleaned).some((key) => cleaned[key] !== fields[key])) {
            throw new Error('Datan är inte normaliserad.');
          }
          ids.add(id);
        }
      } catch (cause) {
        // Fel i lagrad data är serverfel, inte ett 400-fel från klienten.
        throw new Error('Datafilen innehåller ogiltiga animeposter.', { cause });
      }
      return records;
    },
    write(records) {
      // Byt först ut originalet när hela den nya filen har skrivits.
      const temporaryFile = `${dataFile}.tmp`;
      writeFileSync(temporaryFile, JSON.stringify(records, null, 2));
      renameSync(temporaryFile, dataFile);
    },
  };
}
