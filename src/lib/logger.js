const isDev = Boolean(import.meta.env?.DEV);

function emit(level, message, context) {
  if (!isDev) return;
  const logger = console[level] ?? console.log;
  if (context === undefined) logger(`[civicpulse] ${message}`);
  else logger(`[civicpulse] ${message}`, context);
}

export const logger = {
  debug: (message, context) => emit('debug', message, context),
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context) => emit('error', message, context),
};
