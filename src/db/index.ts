import Logger from 'bunyan';
import redis from 'redis';

import { dbConfig } from '../config/types';
import { DBClients } from '../lib/stores/types';

async function readyCheck(log: Logger, dbClients: DBClients): Promise<void> {
  const redisReady = new Promise((resolve) => {
    dbClients.redis.on('ready', () => {
      log.info('redis connected');
      resolve();
    });
  });

  await Promise.all([
    redisReady
  ]);
}

export async function createDBClients(log: Logger, config: dbConfig): Promise<DBClients> {
  log.info('initializing db clients...');

  const dbClients = {
    redis: redis.createClient(config.redis)
  };

  await readyCheck(log, dbClients);

  log.info('db clients ready');

  return dbClients;
}
