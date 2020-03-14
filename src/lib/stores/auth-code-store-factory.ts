import Logger from 'bunyan';

import { DBClients, IAuthorizationCodeStore, StoreType } from './types';
import { MemoryAuthorizationCodeStore } from './MemoryAuthorizationCodeStore';
import { RedisAuthorizationCodeStore } from './RedisAuthorizationCodeStore';

export function authCodeStoreFactory(type: StoreType, log: Logger, dbClients: DBClients): IAuthorizationCodeStore {
  switch (type) {
    case StoreType.memory:
      return new MemoryAuthorizationCodeStore(log);
    case StoreType.redis:
      return new RedisAuthorizationCodeStore(log, dbClients.redis, 'authCode')
  }
}
