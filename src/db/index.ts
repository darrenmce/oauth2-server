import redis from 'redis';
import { dbConfig } from '../config/types';
import { DBClients } from '../lib/stores/types';

export async function createDBClients(config: dbConfig): Promise<DBClients> {
  return {
    redis: redis.createClient(config.redis)
  }
}
