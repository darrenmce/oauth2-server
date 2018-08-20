import { getConfig } from './config';
import { createDBClients } from './db';
import { createServer } from './server';

const config = getConfig();

const dbClients = createDBClients(config.dbs);

const server = createServer({ config, dbClients});

server.listen(config.port, () => {
  console.log(`listening on ${config.port}`);
});