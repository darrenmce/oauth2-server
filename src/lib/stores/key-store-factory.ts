import { MemoryKeyStore } from './MemoryKeyStore';
import { DBClients, IKeyStore, StoreType } from './types';
import { RedisKeyStore } from './RedisKeyStore';

export function keyStoreFactory(type: StoreType, dbClients: DBClients, seedData?: any): IKeyStore {
  switch (type) {
    case StoreType.memory:
      return new MemoryKeyStore(seedData);
    case StoreType.redis:
      return new RedisKeyStore(dbClients.redis, 'mfa')
  }
}
