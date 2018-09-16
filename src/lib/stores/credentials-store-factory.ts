import { StoreType, DBClients, ICredentialsStore } from './types';
import { MemoryCredentialsStore } from './MemoryCredentialsStore';
import { RedisCredentialsStore } from './RedisCredentialsStore';

export function credentialsStoreFactory(type: StoreType, dbClients: DBClients, seedData?: any): ICredentialsStore {
  switch (type) {
    case StoreType.memory:
      return new MemoryCredentialsStore();
    case StoreType.redis:
      return new RedisCredentialsStore(dbClients.redis, 'cred');
  }
}
