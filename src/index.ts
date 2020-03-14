import { createLogger } from 'bunyan';

import { updateUncaughtExceptionHandler } from './lib/uncaught-exception';
import { getConfig } from './config';
import { createDBClients } from './db';
import { createServer } from './server';
import { OAuthConfig } from './config/types';
import { createServices } from './services';

const config = getConfig();

async function startServer(config: OAuthConfig) {
  const log = createLogger(config.server.log);
  updateUncaughtExceptionHandler(log);

  const dbClients = await createDBClients(log, config.dbs);
  const services = await createServices(log, config.services);
  const server = await createServer({ log, config, dbClients, services });

  server.listen(config.server.port, () => {
    log.info(`listening on port ${config.server.port}`);
  });
}

startServer(config);
