import * as redis from 'redis';
import { dbConfig } from '../config/types';
import { DBClients } from '../lib/stores/types';

export function createDBClients(config: dbConfig): DBClients {
  return {
    redis: redis.createClient(config.redis)
  }
}