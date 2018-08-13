import { CredentialsStoreType, ICredentialsStore } from './types';
import { MemoryCredentialsStore } from './MemoryCredentialsStore';

export function credentialsStoreFactory(type: CredentialsStoreType, seedData?: any): ICredentialsStore {
  if (type === CredentialsStoreType.memory) {
    return new MemoryCredentialsStore(seedData);
  }
}
