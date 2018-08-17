import * as redis from 'redis';
import { StoresConfig } from '../config/types';
import { DBClients } from '../lib/stores/types';

export function createDBClients(config: StoresConfig): DBClients {
  return {
    redis: redis.createClient(config.redis)
  }
}