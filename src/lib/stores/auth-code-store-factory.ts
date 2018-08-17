import { DBClients, IAuthorizationCodeStore, StoreType } from './types';
import { MemoryAuthorizationCodeStore } from './MemoryAuthorizationCodeStore';
import { RedisAuthorizationCodeStore } from './RedisAuthorizationCodeStore';

export function authCodeStoreFactory(type: StoreType, dbClients: DBClients): IAuthorizationCodeStore {
  switch (type) {
    case StoreType.memory:
      return new MemoryAuthorizationCodeStore();
    case StoreType.redis:
      return new RedisAuthorizationCodeStore(dbClients.redis, 'authCode')
  }
}
