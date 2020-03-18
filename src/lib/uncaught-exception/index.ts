import * as Logger from 'bunyan';
// temporary pre-configured logger
let log = Logger.createLogger({ name: 'oauth2-server' });

function handler(message, err) {
  log.error(err, message);
  process.exit(1);
}

if (!process.env.DEV_MODE) {
  process.on('uncaughtException', handler.bind(null, 'Uncaught Exception'));
  process.on('unhandledRejection', handler.bind(null, 'Unhandled Rejection'));
}

export function updateUncaughtExceptionHandler(newLog: Logger) {
  log = newLog;
}
