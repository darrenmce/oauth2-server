import { MemoryKeyStore } from './MemoryKeyStore';
import { IKeyStore, KeyStoreType } from './types';

export function keyStoreFactory(type: KeyStoreType, seedData?: any): IKeyStore {
  if (type === KeyStoreType.memory) {
    return new MemoryKeyStore(seedData);
  }
}
