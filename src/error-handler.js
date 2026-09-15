import { InputError } from './validation.js';

export function createErrorHandler(logger) {
  // Express identifierar felmiddleware genom dess fyra parametrar.
  return (error, req, res, next) => {
    if (error instanceof InputError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Body innehåller ogiltig JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Body får vara högst 10 kB.' });
    }
    if (error.status === 415) {
      return res.status(415).json({ error: 'Teckenkodningen eller komprimeringen stöds inte.' });
    }
    logger.error(error);
    res.status(500).json({ error: 'Ett internt serverfel inträffade.' });
  };
}
