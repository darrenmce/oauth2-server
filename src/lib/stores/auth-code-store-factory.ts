import { AuthCodeStoreType, IAuthorizationCodeStore } from './types';
import { MemoryAuthorizationCodeStore } from './MemoryAuthorizationCodeStore';

export function authCodeStoreFactory(type: AuthCodeStoreType): IAuthorizationCodeStore {
  if (type === AuthCodeStoreType.memory) {
    return new MemoryAuthorizationCodeStore();
  }
}
