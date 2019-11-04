import { getConfig } from './config';
import { createDBClients } from './db';
import { createServer } from './server';
import { OAuthConfig } from './config/types';
import { createServices } from './services';

const config = getConfig();

async function startServer(config: OAuthConfig) {
  const dbClients = await createDBClients(config.dbs);
  const services = await createServices(config.services);
  const server = await createServer({ config, dbClients, services });

  server.listen(config.port, () => {
    console.log(`listening on ${config.port}`);
  });
}

startServer(config);
